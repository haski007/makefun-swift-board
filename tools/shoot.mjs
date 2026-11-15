// Takes the screenshots shots.json names: serves app/ with serve.ts, drives headless Chrome over the DevTools
// protocol (Node's own WebSocket, no dependency), opens each route, waits for window.__shotReady === true and writes
// the frame, unedited, to screenshots/. `node tools/shoot.mjs [--to <dir>] [file ...]` (default: every shot).
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8137;
const MAX_BYTES = 256 * 1024;
const args = process.argv.slice(2);
const to = args.includes('--to') ? args.splice(args.indexOf('--to'), 2)[1] : join(root, 'screenshots');
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8')).filter((shot) => !args.length || args.includes(shot.file));
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const server = spawn(process.execPath, [join(root, 'serve.ts'), '--port', String(PORT)], { stdio: 'ignore' });
const profile = mkdtempSync(join(tmpdir(), 'shoot-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', '--force-color-profile=srgb', 'about:blank'], {
  stdio: ['ignore', 'ignore', 'pipe'],
});

// Chrome prints its DevTools address on stderr once it listens.
const endpoint = await new Promise((found, failed) => {
  let seen = '';
  chrome.stderr.on('data', (chunk) => {
    seen += chunk;
    const match = /DevTools listening on (ws:\/\/\S+)/.exec(seen);
    if (match) found(match[1]);
  });
  chrome.on('exit', () => failed(new Error(`Chrome exited early: ${seen}`)));
});

const socket = new WebSocket(endpoint);
await new Promise((open, failed) => {
  socket.addEventListener('open', open);
  socket.addEventListener('error', failed);
});
const waiting = new Map();
let lastId = 0;
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && waiting.has(message.id)) {
    const { done, failed } = waiting.get(message.id);
    waiting.delete(message.id);
    if (message.error) failed(new Error(message.error.message));
    else done(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    console.error('  page exception:', message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    console.error('  console.error:', message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((done, failed) => {
    const id = ++lastId;
    waiting.set(id, { done, failed });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });

let failedShots = 0;
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  await page('Page.enable');
  await page('Runtime.enable');
  mkdirSync(to, { recursive: true });

  for (const [index, shot] of shots.entries()) {
    const { width, height } = shot.viewport;
    await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: shot.scale || 1, mobile: false });
    // A new query string makes each shot a fresh page load, so every shot shows a cold start of its route.
    await page('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html?shot=${index}${shot.path}` });
    let ready = false;
    for (let tries = 0; tries < 150 && !ready; tries += 1) {
      await sleep(200);
      const { result } = await page('Runtime.evaluate', { expression: 'window.__shotReady === true && location.hash.length > 0' });
      ready = result.value === true;
    }
    if (!ready) {
      console.error(`${shot.file}: the route never became ready`);
      failedShots += 1;
      continue;
    }
    await sleep(shot.settle ?? 1800); // avatars and entry images
    const png = /\.png$/i.test(shot.file);
    let bytes;
    for (let quality = 92; ; quality -= 6) {
      const { data } = await page('Page.captureScreenshot', png ? { format: 'png' } : { format: 'jpeg', quality });
      bytes = Buffer.from(data, 'base64');
      if (png || bytes.length <= MAX_BYTES || quality <= 40) break;
    }
    writeFileSync(join(to, shot.file), bytes);
    const fits = bytes.length <= MAX_BYTES;
    if (!fits) failedShots += 1;
    console.log(`${shot.file}: ${shot.path} at ${width}x${height} @${shot.scale || 1}x -> ${Math.round(width * (shot.scale || 1))}x${Math.round(height * (shot.scale || 1))} px, ${bytes.length} bytes${fits ? '' : ' (over 256 KiB)'}`);
  }
  await send('Browser.close').catch(() => {});
} finally {
  socket.close();
  chrome.kill();
  server.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
process.exit(failedShots ? 1 : 0);
