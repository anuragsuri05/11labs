import threading
import time

import numpy as np
import pytest


def test_chunk_text_packs_sentences():
    from app.engines.tts import chunk_text

    text = "First sentence. Second one! Third? " * 20
    chunks = chunk_text(text, limit=100)
    assert all(len(c) <= 100 for c in chunks)
    assert " ".join(chunks).split() == text.split()  # nothing lost or reordered


def test_chunk_text_breaks_overlong_sentence():
    from app.engines.tts import chunk_text

    text = "word " * 120
    chunks = chunk_text(text, limit=80)
    assert len(chunks) > 1 and all(len(c) <= 81 for c in chunks)
    assert chunk_text("   ") == []


def test_chunk_text_short_first_chunk():
    from app.engines.tts import chunk_text

    text = "Hello there. " + "This is a much longer sentence that keeps going for a while. " * 6
    chunks = chunk_text(text, limit=200, first_limit=40)
    assert chunks[0] == "Hello there." and all(len(c) <= 200 for c in chunks)
    assert " ".join(chunks).split() == text.split()
    long_first = chunk_text("word " * 60, limit=200, first_limit=40)
    assert len(long_first[0]) <= 41 and " ".join(long_first).split() == ("word " * 60).split()


def test_place_segments_never_overlaps():
    from app.engines.tts import SAMPLE_RATE, place_segments

    clips = [np.ones(SAMPLE_RATE, dtype=np.float32), np.ones(SAMPLE_RATE, dtype=np.float32)]
    segs = [{"start": 0.0, "end": 0.5}, {"start": 0.5, "end": 1.0}]  # 1 s clips in 0.5 s slots
    out = place_segments(clips, segs, total=1.0)
    assert len(out) >= 2 * SAMPLE_RATE and out.max() == 1.0  # pushed later, not summed


def test_job_queue_serialises_and_rejects_when_full():
    from app.engines import JobQueue
    from app.errors import APIError

    q = JobQueue(max_waiting=1)
    started, release = threading.Event(), threading.Event()

    def hold():
        with q.slot():
            started.set()
            release.wait(5)

    t1 = threading.Thread(target=hold)
    t1.start()
    started.wait(5)
    def wait_turn():
        with q.slot():
            pass

    t2 = threading.Thread(target=wait_turn)
    t2.start()
    time.sleep(0.2)
    assert q.snapshot()["waiting"] == 1
    with pytest.raises(APIError) as e:
        with q.slot():
            pass
    assert e.value.status == 429
    release.set()
    t1.join(5)
    t2.join(5)
    assert q.snapshot() == {"running": 0, "waiting": 0, "max_waiting": 1}


def test_memory_budget_evicts_lru(monkeypatch):
    from app import engines

    class Fake(engines.Engine):
        size_gb = 2.0

        def _load(self):
            return object()

    monkeypatch.setattr(engines, "MEMORY_BUDGET_GB", 4.5)
    monkeypatch.setattr(engines, "_registry", [])
    a, b, c = Fake(), Fake(), Fake()
    a.name, b.name, c.name = "a", "b", "c"
    a.model
    b.model
    a.model  # a is now most recently used
    c.model  # needs room: evicts b
    assert a.is_loaded and c.is_loaded and not b.is_loaded


def test_engine_load_failure_is_503(monkeypatch):
    from app import engines
    from app.errors import APIError

    class Broken(engines.Engine):
        name = "broken"
        size_gb = 0.1

        def _load(self):
            raise RuntimeError("no weights")

    monkeypatch.setattr(engines, "_registry", [])
    e = Broken()
    with pytest.raises(APIError) as err:
        e.model
    assert err.value.status == 503 and "no weights" in err.value.message and e.status == "unavailable"


def test_catalog_ids_unique_and_valid():
    from app.catalog import KOKORO_VOICES, OMNI_VOICES, POCKET_VOICES, catalog_voices
    from app.engines.tts import KOKORO_LANGS, POCKET_LANGS

    voices = catalog_voices("t")
    ids = [v["voice_id"] for v in voices]
    assert len(ids) == len(set(ids)) == len(KOKORO_VOICES) + len(POCKET_VOICES)
    assert all(v[0][0] in KOKORO_LANGS and v[0][1] in "fm" for v in KOKORO_VOICES)
    assert all(v[4] in POCKET_LANGS for v in POCKET_VOICES)
    assert len({v[0] for v in OMNI_VOICES}) == len(OMNI_VOICES)
