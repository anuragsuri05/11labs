#!/usr/bin/env node
// Live end-to-end check of a running NO LABS server with the real models.
// Usage: npm run test:e2e   (NOLABS_URL=http://host:port, NOLABS_API_KEY=... if auth is on, E2E_QUICK=1 skips slow engines)

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = (process.env.NOLABS_URL || 'http://localhost:3333').replace(/\/$/, '');
const KEY = process.env.NOLABS_API_KEY;
const QUICK = !!process.env.E2E_QUICK;
const headers = KEY ? { 'xi-api-key': KEY } : {};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nolabs-e2e-'));
const results = [];
const cleanup = { voices: [], history: [] };

async function call(method, url, { json, form, expect = 200 } = {}) {
  const init = { method, headers: { ...headers } };
  if (json) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(json); }
  if (form) init.body = form;
  const res = await fetch(BASE + url, init);
  const type = res.headers.get('content-type') || '';
  const body = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  if (res.status !== expect) {
    throw new Error(`${method} ${url} -> ${res.status} (expected ${expect}): ${JSON.stringify(body?.detail ?? '').slice(0, 300)}`);
  }
  const hid = res.headers.get('history-item-id');
  if (hid) cleanup.history.push(hid);
  return { res, body };
}

async function step(name, fn) {
  const started = Date.now();
  try {
    const note = await fn();
    results.push({ name, ok: true, secs: (Date.now() - started) / 1000, note });
    console.log(`  \x1b[32m✓\x1b[0m ${name} \x1b[2m(${((Date.now() - started) / 1000).toFixed(1)}s)${note ? ' ' + note : ''}\x1b[0m`);
  } catch (e) {
    results.push({ name, ok: false, secs: (Date.now() - started) / 1000, note: e.message });
    console.log(`  \x1b[31m✗ ${name}\x1b[0m\n    ${e.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function audioOk(r, minSecs = 0.3) {
  const dur = Number(r.res.headers.get('x-duration-seconds'));
  assert(/audio\//.test(r.res.headers.get('content-type')), `not audio: ${r.res.headers.get('content-type')}`);
  assert(r.body.length > 2000 && dur >= minSecs, `audio too short (${dur}s, ${r.body.length} bytes)`);
  return dur;
}
function file(name, buf) { const p = path.join(tmp, name); fs.writeFileSync(p, buf); return p; }
function blobOf(p, type) { return new Blob([fs.readFileSync(p)], { type }); }
function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args]);
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + r.stderr);
}

console.log(`NO LABS end-to-end test → ${BASE}${QUICK ? ' (quick)' : ''}\n`);
let speech; // a real speech clip, produced by TTS, reused as input below

await step('health', async () => {
  const { body } = await call('GET', '/v1/health');
  assert(body.status === 'ok', 'not ok');
  return `v${body.version}, ${body.device}`;
});
await step('models list', async () => {
  const { body } = await call('GET', '/v1/models');
  const ids = body.map((m) => m.model_id);
  assert(['omnivoice', 'kokoro', 'pocket'].every((m) => ids.includes(m)), ids.join(','));
  return body.map((m) => `${m.model_id}:${m.voice_count}`).join(' ');
});
await step('voice library', async () => {
  const { body } = await call('GET', '/v1/voices');
  assert(body.voices.length >= 76, `${body.voices.length} voices`);
  return `${body.voices.length} voices`;
});
for (const [voice, text] of [
  ['kokoro_af_heart', 'Welcome to No Labs. This voice is generated entirely on your own computer.'],
  ['kokoro_bf_emma', 'A British voice, rendered locally in a few seconds.'],
  ['kokoro_hf_alpha', 'नमस्ते, यह एक हिंदी आवाज़ है।'],
  ['kokoro_zf_xiaoxiao', '你好，欢迎使用开源语音工作室。'],
  ['pocket_alba', 'Pocket voices are the fastest option on a regular CPU.'],
  ['pocket_estelle', 'Bonjour, ceci est une voix française.'],
  ...(QUICK ? [] : [['premade_aria', 'OmniVoice speaks hundreds of languages and can clone any voice.']]),
]) {
  await step(`tts ${voice}`, async () => {
    const r = await call('POST', `/v1/text-to-speech/${voice}`, { json: { text } });
    const dur = audioOk(r, 1);
    if (voice === 'kokoro_af_heart') speech = file('speech.mp3', r.body);
    return `${dur}s audio`;
  });
}
await step('preview render', async () => {
  const r = await call('GET', '/v1/voices/pocket_jean/preview');
  assert(r.body.length > 10000, 'preview too small');
});
await step('voice/model mismatch is rejected', async () => {
  await call('POST', '/v1/text-to-speech/kokoro_af_heart', { json: { text: 'hi', model_id: 'pocket' }, expect: 400 });
});
await step('speech to text (word timestamps)', async () => {
  const form = new FormData();
  form.append('file', blobOf(speech, 'audio/mpeg'), 'speech.mp3');
  form.append('model_id', 'whisper-base');
  const { body } = await call('POST', '/v1/speech-to-text', { form });
  cleanup.history.push(body.history_item_id);
  assert(/computer/i.test(body.text) && body.words.length > 5, `transcript: ${body.text}`);
  return `"${body.text.slice(0, 50)}…"`;
});
await step('voice changer (kokoro target)', async () => {
  const form = new FormData();
  form.append('audio', blobOf(speech, 'audio/mpeg'), 'speech.mp3');
  form.append('voice_settings', '{}');
  return `${audioOk(await call('POST', '/v1/speech-to-speech/kokoro_am_michael', { form }), 2)}s audio`;
});
await step('voice isolator', async () => {
  const mix = path.join(tmp, 'mix.wav');
  ffmpeg(['-f', 'lavfi', '-i', 'sine=frequency=220:duration=6', '-i', speech, '-filter_complex', 'amix=inputs=2:duration=shortest', mix]);
  const form = new FormData();
  form.append('audio', blobOf(mix, 'audio/wav'), 'mix.wav');
  return `${audioOk(await call('POST', '/v1/audio-isolation', { form }), 2)}s audio`;
});
if (!QUICK) {
  let voiceId;
  await step('instant voice clone (webm upload, auto transcript)', async () => {
    const webm = path.join(tmp, 'rec.webm');
    ffmpeg(['-i', speech, '-c:a', 'libopus', webm]);
    const form = new FormData();
    form.append('name', 'E2E Clone');
    form.append('files', blobOf(webm, 'audio/webm'), 'rec.webm');
    const { body } = await call('POST', '/v1/voices/add', { form });
    voiceId = body.voice_id;
    cleanup.voices.push(voiceId);
  });
  await step('tts with cloned voice', async () =>
    `${audioOk(await call('POST', `/v1/text-to-speech/${voiceId}`, { json: { text: 'This is my cloned voice.', voice_settings: { quality: 12 } } }), 1)}s audio`);
  await step('voice design previews + save', async () => {
    const { body } = await call('POST', '/v1/text-to-voice/create-previews',
      { json: { voice_description: 'male, elderly, low pitch, british accent', text: 'Good evening, and welcome.' } });
    assert(body.previews.length === 3, 'expected 3 previews');
    const saved = await call('POST', '/v1/text-to-voice/create-voice-from-preview',
      { json: { generated_voice_id: body.previews[0].generated_voice_id, voice_name: 'E2E Designed' } });
    cleanup.voices.push(saved.body.voice_id);
  });
  await step('sound effect', async () =>
    `${audioOk(await call('POST', '/v1/sound-generation', { json: { text: 'thunder and heavy rain', duration_seconds: 3 } }), 2.5)}s audio`);
  await step('music', async () =>
    `${audioOk(await call('POST', '/v1/music', { json: { prompt: 'lofi hip hop beat, mellow piano', music_length_ms: 5000 } }), 4.5)}s audio`);
}

// tidy up what the test created
for (const id of cleanup.voices) await fetch(`${BASE}/v1/voices/${id}`, { method: 'DELETE', headers }).catch(() => {});
for (const id of cleanup.history) await fetch(`${BASE}/v1/history/${id}`, { method: 'DELETE', headers }).catch(() => {});
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed in ${results.reduce((s, r) => s + r.secs, 0).toFixed(0)}s`);
process.exit(failed.length ? 1 : 0);
