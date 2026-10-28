"""Tiny JSON-file store for voices and history (single-user, self-hosted)."""

import json
import secrets
import threading
from datetime import datetime, timezone

from .config import DATA_DIR

_lock = threading.Lock()


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class Collection:
    def __init__(self, name: str, key: str):
        self.path = DATA_DIR / f"{name}.json"
        self.key = key
        self._items: list[dict] = json.loads(self.path.read_text()) if self.path.exists() else []

    def _save(self):
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self._items, indent=2))
        tmp.replace(self.path)

    def all(self) -> list[dict]:
        with _lock:
            return [dict(i) for i in self._items]

    def get(self, item_id: str) -> dict | None:
        with _lock:
            return next((dict(i) for i in self._items if i[self.key] == item_id), None)

    def add(self, item: dict) -> dict:
        with _lock:
            self._items.insert(0, item)
            self._save()
        return item

    def sync(self, items: list[dict], migrate=None):
        """Upsert many items in one write (appended in order); `migrate` patches existing items."""
        with _lock:
            index = {i[self.key]: i for i in self._items}
            for item in items:
                if item[self.key] in index:
                    index[item[self.key]].update(item)
                else:
                    self._items.append(item)
                    index[item[self.key]] = item
            if migrate:
                for i in self._items:
                    migrate(i)
            self._save()

    def update(self, item_id: str, **fields) -> dict | None:
        with _lock:
            for i in self._items:
                if i[self.key] == item_id:
                    i.update(fields)
                    self._save()
                    return dict(i)
        return None

    def delete(self, item_id: str) -> dict | None:
        with _lock:
            for n, i in enumerate(self._items):
                if i[self.key] == item_id:
                    del self._items[n]
                    self._save()
                    return i
        return None


voices = Collection("voices", "voice_id")
history = Collection("history", "history_item_id")
