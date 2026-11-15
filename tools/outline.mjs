// An approximation of the judge's outline (RULES.txt, "The dossier"): the Totals line, then each source file's heading
// with its declarations (top-level functions, exports, constants; the HTML lines with an id, a script or a link),
// cut at 1,248 bytes. It reads out/dossier.json, so build first: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
// `node tools/outline.mjs [dossier.json] [bytes]`
import { readFileSync } from 'node:fs';

const [file = 'out/dossier.json', limit = '1248'] = process.argv.slice(2);
const { text } = JSON.parse(readFileSync(file, 'utf8'));
const lines = [text.split('\n').find((line) => line.startsWith('Totals:'))];

const sections = text.split(/^### /m).slice(1);
for (const section of sections) {
  const [heading, ...rest] = section.split('\n');
  const body = rest.join('\n').replace(/^\s*```\w*\n/, '').replace(/\n```[\s\S]*$/, '').split('\n');
  lines.push(`### ${heading}`);
  const html = heading.includes('.html');
  for (const line of body) {
    if (html ? /\bid=|<script|<link/.test(line) : /^(export |async function |function |const |let |class )/.test(line)) {
      lines.push(html ? line.trim() : line.replace(/\s*(=>?\s*)?[{(]?\s*$/, '').replace(/\s*=\s*(?=[\[{(`'"\d]).*$/, '').replace(/\s*\{.*$/, ''));
    }
  }
}
const outline = Buffer.from(lines.join('\n'));
console.log(outline.subarray(0, Number(limit)).toString());
console.log(`\n--- outline is ${outline.length} bytes; the judge sees the first ${limit}, so ${Math.max(0, outline.length - Number(limit))} are cut ---`);
