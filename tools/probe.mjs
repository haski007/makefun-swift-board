// Opens a route in headless Chrome at a given width and prints what an expression returns once the route is ready.
// `node tools/probe.mjs <hash> <width> <expression>`; the expression may be async and may click things.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [hash, width, expression] = process.argv.slice(2);
const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const server = spawn(process.execPath, [join(root, 'serve.ts'), '--port', '8138'], { stdio: 'ignore' });
const profile = mkdtempSync(join(tmpdir(), 'probe-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const endpoint = await new Promise((found) => {
  let seen = '';
  chrome.stderr.on('data', (chunk) => {
    seen += chunk;
    const match = /DevTools listening on (ws:\/\/\S+)/.exec(seen);
    if (match) found(match[1]);
  });
});
const socket = new WebSocket(endpoint);
await new Promise((open) => socket.addEventListener('open', open));
const waiting = new Map();
let lastId = 0;
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (waiting.has(message.id)) waiting.get(message.id)(message.result ?? message.error);
  else if (message.method === 'Runtime.exceptionThrown') console.error('exception:', message.params.exceptionDetails.exception?.description);
});
const send = (method, params = {}, sessionId) => new Promise((done) => {
  const id = ++lastId;
  waiting.set(id, done);
  socket.send(JSON.stringify({ id, method, params, sessionId }));
});
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url: `http://127.0.0.1:8138/index.html${hash}` }, sessionId);
  for (let tries = 0; tries < 100; tries += 1) {
    await sleep(200);
    const { result } = await send('Runtime.evaluate', { expression: 'window.__shotReady === true' }, sessionId);
    if (result?.value) break;
  }
  const run = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true }, sessionId);
  console.log(JSON.stringify(run.result?.value ?? run, null, 1));
} finally {
  chrome.kill();
  server.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
