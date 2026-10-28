"""Model engines: lazy loading, a memory budget with LRU eviction, and a single-slot job queue.

CPU-bound models fight over cores, so inference runs one job at a time. Requests beyond
MAX_WAITING queued jobs are rejected with 429 instead of piling up.
"""

import gc
import logging
import threading
import time
from contextlib import contextmanager

import torch

from ..config import MAX_WAITING_JOBS, MEMORY_BUDGET_GB, TORCH_THREADS
from ..errors import APIError

torch.set_num_threads(TORCH_THREADS)
log = logging.getLogger("nolabs")


class JobQueue:
    def __init__(self, max_waiting: int):
        self.max_waiting = max_waiting
        self._lock = threading.Lock()
        self._count = threading.Lock()
        self.waiting = 0
        self.running = 0

    @contextmanager
    def slot(self, threads: int | None = None):
        """Run one job at a time. `threads` sets the torch CPU threads for this job."""
        with self._count:
            if self.waiting >= self.max_waiting:
                raise APIError(429, "server_busy",
                               "The server is busy with other jobs. Please try again in a moment.")
            self.waiting += 1
        try:
            self._lock.acquire()
        finally:
            with self._count:
                self.waiting -= 1
        self.running = 1
        torch.set_num_threads(threads or TORCH_THREADS)  # engines tune this; others use the default
        try:
            yield
        finally:
            self.running = 0
            self._lock.release()

    def snapshot(self) -> dict:
        return {"running": self.running, "waiting": self.waiting, "max_waiting": self.max_waiting}


jobs = JobQueue(MAX_WAITING_JOBS)
_registry: list["Engine"] = []
_budget_lock = threading.Lock()


def _make_room(incoming: "Engine"):
    """Evict least-recently-used engines until `incoming` fits in the memory budget."""
    loaded = sorted((e for e in _registry if e.is_loaded and e is not incoming), key=lambda e: e.last_used)
    used = sum(e.size_gb for e in loaded)
    while loaded and used + incoming.size_gb > MEMORY_BUDGET_GB:
        victim = loaded.pop(0)
        used -= victim.size_gb
        victim.unload()


class Engine:
    name = "engine"
    size_gb = 1.0  # measured resident size, used for the memory budget
    threads: int | None = None  # best CPU thread count for this engine (None = default)

    def slot(self):
        return jobs.slot(self.threads)

    def __init__(self):
        _registry.append(self)
        self.last_used = 0.0
        self._model = None
        self._load_lock = threading.Lock()
        self.error: str | None = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def status(self) -> str:
        if self.is_loaded:
            return "loaded"
        return "unavailable" if self.error else "idle"

    def _load(self):
        raise NotImplementedError

    def unload(self):
        with self._load_lock:
            self._model = None
            self._on_unload()
        gc.collect()
        log.info("unloaded %s engine", self.name)

    def _on_unload(self):
        pass

    @property
    def model(self):
        self.last_used = time.monotonic()
        if self._model is None:
            with self._load_lock:
                if self._model is None:
                    with _budget_lock:
                        _make_room(self)
                    log.info("loading %s engine", self.name)
                    started = time.monotonic()
                    try:
                        self._model = self._load()
                        self.error = None
                    except Exception as e:
                        self.error = f"{type(e).__name__}: {e}"
                        log.exception("failed to load %s", self.name)
                        raise APIError(503, "engine_unavailable",
                                       f"The {self.name} engine could not be loaded: {self.error}") from e
                    log.info("loaded %s engine in %.1fs", self.name, time.monotonic() - started)
        return self._model


def all_engines() -> list[Engine]:
    return list(_registry)
