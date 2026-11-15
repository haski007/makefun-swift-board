// makefun-swift-board: the entry program for makefun-frontend-01 (Node 22+, standard library only).
//
// The frontend itself is the static files in app/ (ES modules, no build step, reading https://make.fun/api with GET).
// This program only hands it in: it puts app/ and screenshots/ into the output directory and writes dossier.json
// there, the summary the judge reads, built by the vendored make.fun library (vendor/makefun-frontend.ts, untouched).
//
//   serve it:  node serve.ts                              then open http://localhost:8080
//   build it:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory is emptied of my own two folders first, so a run never mixes in what an earlier run left
// there; two runs on the same sources therefore write the same bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const shots = join(here, 'screenshots');
const taken = existsSync(shots) ? readdirSync(shots).filter((name) => /\.(png|jpe?g)$/i.test(name)) : [];
if (taken.length !== 3) console.warn(`main.ts: screenshots/ holds ${taken.length} pictures, the entry wants exactly 3`);

for (const folder of ['app', 'screenshots']) rmSync(join(out, folder), { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
for (const name of taken) cpSync(join(shots, name), join(out, 'screenshots', name));

// The scorer's own caps (reference/gate.json): text_max_bytes shapes the text; the rest refuse an entry the scorer
// would refuse (over 3 screenshots, one over 256 KiB, over 993 files in app/ or over 16 MiB of app files).
const caps = { text_max_bytes: 163840, screenshots: { max: 3, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 };
writeFileSync(join(out, 'dossier.json'), buildDossier(out, caps));
