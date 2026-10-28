// Global setup/teardown: remember which history items existed before the run, and delete the
// ones the tests created afterwards, so UI tests don't leave clutter in the real History.
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE = (process.env.NOLABS_URL || 'http://localhost:3333').replace(/\/$/, '');
const SNAPSHOT = path.join(os.tmpdir(), 'nolabs-ui-history-snapshot.json');
const headers: Record<string, string> = process.env.NOLABS_API_KEY ? { 'xi-api-key': process.env.NOLABS_API_KEY } : {};

async function historyIds(): Promise<string[]> {
  const res = await fetch(`${BASE}/v1/history?limit=500`, { headers });
  if (!res.ok) return [];
  const body = (await res.json()) as { history: { history_item_id: string }[] };
  return body.history.map((h) => h.history_item_id);
}

export async function snapshotHistory() {
  fs.writeFileSync(SNAPSHOT, JSON.stringify(await historyIds().catch(() => [])));
}

export async function removeTestHistory() {
  let before: string[];
  try {
    before = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  } catch {
    return; // no snapshot: never delete blindly
  }
  const keep = new Set(before);
  for (const id of await historyIds().catch(() => [])) {
    if (!keep.has(id)) await fetch(`${BASE}/v1/history/${id}`, { method: 'DELETE', headers }).catch(() => {});
  }
  try {
    fs.unlinkSync(SNAPSHOT);
  } catch {
    /* already gone */
  }
}
