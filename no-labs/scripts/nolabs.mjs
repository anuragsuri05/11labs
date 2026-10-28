#!/usr/bin/env node
// NO LABS launcher: `npm install` runs `setup`, `npm start` serves the app, `npm run dev` adds hot reload.
//
// The AI engines are Python (PyTorch). Where PyTorch ships wheels (Apple Silicon, Linux, Windows) they
// run natively from backend/.venv. Intel Macs have no PyTorch >= 2.3 wheels, so there the backend runs
// in Docker instead. Override with NOLABS_RUNTIME=native|docker.

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const DIST = path.join(FRONTEND, 'dist');
const VENV = path.join(BACKEND, '.venv');
const STAMP = path.join(ROOT, '.nolabs-setup');
const PORT = process.env.PORT || '3333';
const DEV_PORT = process.env.DEV_PORT || '5333';
const IS_WIN = process.platform === 'win32';
const VENV_PY = path.join(VENV, IS_WIN ? 'Scripts' : 'bin', IS_WIN ? 'python.exe' : 'python');
const URL = `http://localhost:${PORT}`;

const log = (msg) => console.log(`\x1b[1;35m[no labs]\x1b[0m ${msg}`);
class SetupError extends Error {}
const fail = (msg) => { throw new SetupError(msg); };

function run(bin, args, opts = {}) {
  const r = spawnSync(bin, args, { stdio: 'inherit', shell: IS_WIN, ...opts });
  if (r.status !== 0) fail(`Command failed: ${bin} ${args.join(' ')}`);
}
function succeeds(bin, args) {
  try { return spawnSync(bin, args, { stdio: 'ignore', shell: IS_WIN }).status === 0; } catch { return false; }
}
function output(bin, args) {
  try {
    const r = spawnSync(bin, args, { encoding: 'utf8', shell: IS_WIN });
    return r.status === 0 ? r.stdout.trim() : null;
  } catch { return null; }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ runtime choice
function runtime() {
  const forced = process.env.NOLABS_RUNTIME;
  if (forced === 'native' || forced === 'docker') return forced;
  if (process.platform === 'darwin' && process.arch === 'x64') {
    // x64 Node on Apple Silicon (Rosetta) can still use native arm64 Python.
    return output('sysctl', ['-n', 'hw.optional.arm64']) === '1' ? 'native' : 'docker';
  }
  return 'native';
}

function torchIndex() {
  if (process.platform === 'darwin') return null; // PyPI wheels include Apple GPU (MPS) support
  return succeeds('nvidia-smi', [])
    ? 'https://download.pytorch.org/whl/cu128'
    : 'https://download.pytorch.org/whl/cpu';
}

function setupFingerprint(mode) {
  const h = crypto.createHash('sha256');
  h.update(mode);
  h.update(fs.readFileSync(path.join(BACKEND, 'requirements.txt')));
  if (mode === 'docker') h.update(fs.readFileSync(path.join(BACKEND, 'Dockerfile')));
  else h.update(String(torchIndex()));
  return h.digest('hex');
}
const isSetUp = (mode) => {
  try { return fs.readFileSync(STAMP, 'utf8') === setupFingerprint(mode); } catch { return false; }
};

// ------------------------------------------------------------------ native python
function findPython() {
  const ok = (bin, pre = []) => {
    const v = output(bin, [...pre, '-c', 'import sys;print("%d.%d" % sys.version_info[:2])']);
    if (!v) return false;
    const [maj, min] = v.split('.').map(Number);
    return maj === 3 && min >= 10 && min <= 13; // range PyTorch 2.8 ships wheels for
  };
  if (IS_WIN && ok('py', ['-3.11'])) return ['py', ['-3.11']];
  for (const bin of ['python3.11', 'python3.12', 'python3.13', 'python3.10', 'python3', 'python']) {
    if (ok(bin)) return [bin, []];
  }
  return null;
}

function setupNative() {
  const uv = succeeds('uv', ['--version']);
  if (!fs.existsSync(VENV_PY)) {
    log('Creating Python environment in backend/.venv ...');
    if (uv) run('uv', ['venv', '--python', '3.11', VENV]); // uv fetches Python 3.11 if missing
    else {
      const py = findPython();
      if (!py) fail('Python 3.10-3.13 is required. Install it from https://www.python.org/downloads/ '
        + '(or install uv: https://docs.astral.sh/uv/) and run `npm run setup`.');
      run(py[0], [...py[1], '-m', 'venv', VENV]);
    }
  }
  const pip = (args) => uv
    ? run('uv', ['pip', 'install', '--python', VENV_PY, ...args])
    : run(VENV_PY, ['-m', 'pip', 'install', ...args]);
  if (!uv) run(VENV_PY, ['-m', 'pip', 'install', '--upgrade', 'pip']);

  const index = torchIndex();
  log(`Installing PyTorch (${index ? index.split('/').pop() : 'macOS'}) ... this is a large download`);
  pip(['torch==2.8.0', 'torchaudio==2.8.0', ...(index ? ['--index-url', index] : [])]);
  log('Installing AI engines (OmniVoice, Whisper, Demucs, AudioLDM, MusicGen) ...');
  pip(['-r', path.join(BACKEND, 'requirements.txt')]);
  pip(['--no-deps', 'demucs==4.0.1']);
}

function nativeEnv() {
  const require = createRequire(import.meta.url);
  let ffmpeg = 'ffmpeg';
  try { ffmpeg = require('ffmpeg-static') || ffmpeg; } catch { /* fall back to PATH */ }
  return {
    ...process.env,
    DATA_DIR: path.join(ROOT, 'data'),
    WEB_DIR: DIST,
    HF_HOME: path.join(ROOT, 'models'),
    TORCH_HOME: path.join(ROOT, 'models', 'torch'),
    FFMPEG_BINARY: ffmpeg,
    PYTHONUNBUFFERED: '1',
  };
}

// ------------------------------------------------------------------ docker
async function ensureDocker() {
  if (!succeeds('docker', ['--version'])) {
    fail('This computer needs Docker to run the AI engines (PyTorch has no Intel-Mac builds). '
      + 'Install Docker Desktop from https://www.docker.com/products/docker-desktop/ and run `npm run setup`.');
  }
  if (succeeds('docker', ['info'])) return;
  log('Starting Docker Desktop ...');
  if (process.platform === 'darwin') spawnSync('open', ['-a', 'Docker']);
  else if (IS_WIN) spawnSync('cmd', ['/c', 'start', '', 'Docker Desktop'], { shell: true });
  for (let i = 0; i < 60; i++) {
    if (succeeds('docker', ['info'])) return;
    await sleep(3000);
  }
  fail('Docker is installed but not running. Start Docker Desktop and try again.');
}

const compose = (args, opts) => run('docker', ['compose', ...args], { cwd: ROOT, ...opts });

// ------------------------------------------------------------------ frontend
function newestMtime(p) {
  const st = fs.statSync(p);
  if (!st.isDirectory()) return st.mtimeMs;
  return Math.max(st.mtimeMs, ...fs.readdirSync(p).map((f) => newestMtime(path.join(p, f))));
}
function buildFrontend(force = false) {
  const built = path.join(DIST, 'index.html');
  const sources = ['src', 'public', 'index.html', 'vite.config.ts', 'tailwind.config.js']
    .map((f) => path.join(FRONTEND, f)).filter(fs.existsSync);
  if (!force && fs.existsSync(built) && fs.statSync(built).mtimeMs >= Math.max(...sources.map(newestMtime))) return;
  log('Building the web app ...');
  run('npm', ['run', 'build', '--workspace', 'frontend'], { cwd: ROOT });
}

// ------------------------------------------------------------------ commands
async function setup() {
  const mode = runtime();
  log(`Setting up (${mode} mode) ...`);
  for (const d of ['data', 'models']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
  buildFrontend();
  if (mode === 'docker') {
    await ensureDocker();
    log('Building the engine container (first time downloads ~2 GB) ...');
    compose(['build']);
  } else {
    setupNative();
  }
  fs.writeFileSync(STAMP, setupFingerprint(mode));
  log(`Setup complete. Run \x1b[1mnpm start\x1b[0m and open ${URL}`);
}

function openBrowser(url) {
  if (process.env.NOLABS_NO_OPEN || process.env.CI) return;
  const [bin, args] = process.platform === 'darwin' ? ['open', [url]]
    : IS_WIN ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(bin, args, { stdio: 'ignore', detached: true }).unref(); } catch { /* ignore */ }
}

async function waitForApi(url) {
  for (let i = 0; i < 600; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/v1/health`);
      if (r.ok) {
        log(`\x1b[32mReady!\x1b[0m Open \x1b[1m${url}\x1b[0m  (Ctrl+C to stop)`);
        log('First launch downloads ~6 GB of models and creates the premade voices; that can take a while.');
        openBrowser(url);
        return;
      }
    } catch { /* not up yet */ }
    await sleep(1000);
  }
}

function startBackend(mode, { reload }) {
  if (mode === 'docker') {
    return spawn('docker', ['compose', 'up', '--remove-orphans'], {
      cwd: ROOT, stdio: 'inherit', shell: IS_WIN,
      env: { ...process.env, PORT, UVICORN_FLAGS: reload ? '--reload --reload-dir /srv/app' : '' },
    });
  }
  return spawn(VENV_PY, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', PORT,
    ...(reload ? ['--reload', '--reload-dir', 'app'] : [])], { cwd: BACKEND, stdio: 'inherit', env: nativeEnv() });
}

async function start({ dev = false } = {}) {
  const mode = runtime();
  if (!isSetUp(mode)) await setup();
  if (mode === 'docker') await ensureDocker();
  if (!dev) buildFrontend();

  const children = [startBackend(mode, { reload: dev })];
  if (dev) {
    children.push(spawn('npm', ['run', 'dev', '--workspace', 'frontend'], {
      cwd: ROOT, stdio: 'inherit', shell: IS_WIN, env: { ...process.env, PORT, DEV_PORT },
    }));
  }
  const stop = () => children.forEach((c) => c.exitCode === null && c.kill('SIGINT'));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  children.forEach((c) => c.on('exit', (code) => { stop(); process.exitCode = code ?? 0; }));
  await waitForApi(dev ? `http://localhost:${DEV_PORT}` : URL);
}

async function testBackend() {
  const mode = runtime();
  if (!isSetUp(mode)) await setup();
  if (mode === 'docker') {
    await ensureDocker();
    run('docker', ['compose', 'run', '--rm', '--no-deps', '-v', `${path.join(BACKEND, 'tests')}:/srv/tests`,
      'engine', 'python', '-m', 'pytest', '-q', '-p', 'no:cacheprovider', 'tests'], { cwd: ROOT });
  } else {
    run(VENV_PY, ['-m', 'pytest', '-q', '-p', 'no:cacheprovider', 'tests'], { cwd: BACKEND, env: nativeEnv() });
  }
}

async function stopAll() {
  if (runtime() === 'docker' && succeeds('docker', ['info'])) compose(['down']);
}

const commands = { setup, start: () => start(), dev: () => start({ dev: true }), stop: stopAll, test: testBackend };
const command = commands[process.argv[2] || 'start'];
if (!command) {
  console.log('Usage: node scripts/nolabs.mjs <setup|start|dev|stop|test>');
  process.exit(1);
}
try {
  await command();
} catch (e) {
  if (!(e instanceof SetupError)) throw e;
  console.error(`\x1b[31m[no labs] ${e.message}\x1b[0m`);
  // Don't break `npm install` itself; `npm start` re-runs setup and shows the error again.
  process.exitCode = process.env.npm_lifecycle_event === 'postinstall' ? 0 : 1;
}
