// Shared by every view and loaded with the first of them: the element builder, the in-place patching helpers,
// money, dates and scores, and the single one-second ticker that moves every countdown without a request.
import { CSS } from './style.js';

const SITE = 'https://make.fun';
const sheet = new CSSStyleSheet();
sheet.replaceSync(CSS);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

// h('a.title', { href }, 'text', node, ...) builds one element; a null or false child is skipped.
export function h(spec, props, ...kids) {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  if (props === null || typeof props !== 'object' || props.nodeType || Array.isArray(props)) {
    kids.unshift(props);
    props = null;
  }
  for (const name in props) {
    const value = props[name];
    if (value == null || value === false) continue;
    if (name in node) node[name] = value;
    else node.setAttribute(name, value);
  }
  node.append(...kids.flat().filter((kid) => kid != null && kid !== false));
  return node;
}

// Writes a text only when it differs, so a refresh that changed nothing touches no DOM.
export function setText(node, text) {
  text = String(text);
  if (node.textContent !== text) node.textContent = text;
}

// Keyed reconcile of a list: rows already on the page are kept and patched, new ones are made once, rows are moved
// only when their place changed and removed only when their key is gone. `make(item)` returns a node with .patch.
export function patchList(parent, items, keyOf, make) {
  const before = parent.rows || new Map();
  const after = new Map();
  items.forEach((item, i) => {
    const key = keyOf(item);
    const node = before.get(key) || make(item);
    node.patch(item, i);
    after.set(key, node);
    if (parent.children[i] !== node) parent.insertBefore(node, parent.children[i] || null);
  });
  for (const [key, node] of before) if (!after.has(key)) node.remove();
  parent.rows = after;
}

export function usd(value) {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export const count = (value) => (Number(value) || 0).toLocaleString('en-US');

export function ordinal(place) {
  const tens = place % 100;
  return place + (tens > 10 && tens < 14 ? 'th' : ['th', 'st', 'nd', 'rd'][place % 10] || 'th');
}

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
export const day = (iso) => (iso ? `${DAY.format(new Date(iso))} UTC` : 'not set');

// A leaderboard value as people read it: a judge win rate in millionths as a percentage, micro-USDC as dollars.
export function score(display, title = '') {
  const value = Number(display);
  if (display == null || display === '' || Number.isNaN(value)) return display || '–';
  if (/win rate/i.test(title)) return `${(value / 1e4).toFixed(1)}%`;
  if (/micro-USDC/i.test(title)) return usd((value / 1e6).toFixed(2));
  return value.toLocaleString('en-US', { minimumFractionDigits: (String(display).split('.')[1] || '').length });
}

// Whether a bounty takes entries is read off its dates: one past its deadline can still say status "open".
export function stage(bounty, now = Date.now()) {
  if (bounty.status === 'resolved' || bounty.winner) return 'done';
  if (Date.parse(bounty.opensAt || bounty.publishedAt) > now) return 'soon';
  return Date.parse(bounty.deadline) > now && bounty.status === 'open' ? 'live' : 'judging';
}

export const STAGES = { live: 'Taking entries', soon: 'Opens soon', judging: 'Closed · awaiting results', done: 'Finished' };

export function timeLeft(ms) {
  if (ms <= 0) return 'Closed';
  const two = (n) => String(n).padStart(2, '0');
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const clock = `${two(Math.floor(s / 3600) % 24)}h ${two(Math.floor(s / 60) % 60)}m`;
  return d ? `${d}d ${clock}` : `${clock} ${two(s % 60)}s`;
}

// Points a countdown element at a time; the ticker below does the rest.
export function countdown(node, iso) {
  if (node.dataset.until !== iso) node.dataset.until = iso;
  const left = Date.parse(iso) - Date.now();
  setText(node, timeLeft(left));
  node.classList.toggle('calm', left > 864e5);
  return node;
}

const sync = document.querySelector('header').appendChild(h('small.sync'));

function tickCountdowns() {
  const now = Date.now();
  for (const node of document.querySelectorAll('[data-until]')) countdown(node, node.dataset.until);
  if (window.syncedAt) setText(sync, `Live · updated ${Math.round((now - window.syncedAt) / 1000)}s ago`);
}
setInterval(tickCountdowns, 1000);

// The header's search box opens a public profile by handle.
document.forms[0].addEventListener('submit', (event) => {
  event.preventDefault();
  const handle = event.target.q.value.trim().replace(/^@/, '');
  if (handle) location.hash = `#/u/${encodeURIComponent(handle)}`;
  event.target.reset();
});

// make.fun's own images are served same-origin only, so crossorigin is set before src; the initial shows until
// (and unless) the picture loads.
export function avatar(url, name) {
  const box = h('span.avatar', { 'aria-hidden': 'true' }, (name || '?')[0].toUpperCase());
  if (url) {
    const img = document.createElement('img');
    if (url[0] === '/') url = SITE + url;
    if (url.startsWith(SITE)) img.crossOrigin = 'anonymous';
    img.alt = '';
    img.addEventListener('load', () => box.replaceChildren(img));
    img.src = url;
  }
  return box;
}

// The four figures of a bounty as text, for the board's ledger rows and for the tiles alike.
export function facts(bounty) {
  const at = stage(bounty);
  const fees = Number(bounty.entryFeesUsd) || 0;
  const paid = Number(bounty.entryFeeUsd) || 0;
  return {
    at,
    pot: usd(bounty.potUsd ?? bounty.rewardAmount),
    potNote: fees ? `${usd(bounty.rewardAmount)} + ${usd(fees)} fees` : 'reward',
    fee: paid ? usd(paid) : 'Free',
    feeNote: paid ? `${count(bounty.entryFeePayers)} paid` : 'no fee',
    until: at === 'live' ? bounty.deadline : at === 'soon' ? bounty.opensAt || bounty.publishedAt : null,
    left: at === 'done' ? 'Finished' : 'Closed',
    leftNote: at === 'soon' ? 'until it opens' : `${at === 'live' ? 'ends' : 'ended'} ${day(bounty.deadline)}`,
    entries: count(bounty.submissionCount),
  };
}

// Points a clock at its deadline (or at the word that replaces it); the ticker moves it from here on.
export function setClock(node, fact) {
  if (fact.until) countdown(node, fact.until);
  else {
    delete node.dataset.until;
    setText(node, fact.left);
  }
  node.classList.toggle('off', fact.at !== 'live');
}

// The four tiles every bounty page leads with: live pot, entry fee, time left, entries.
export function figures() {
  const [pot, potNote, fee, feeNote, left, leftNote, entries] = [h('b.cash'), h('small'), h('b'), h('small'), h('b.clock'), h('small'), h('b')];
  const node = h(
    'dl.figures',
    h('div', h('dt', 'Live pot'), h('dd', pot, potNote)),
    h('div', h('dt', 'Entry fee'), h('dd', fee, feeNote)),
    h('div', h('dt', 'Time left'), h('dd', left, leftNote)),
    h('div', h('dt', 'Entries'), h('dd', entries)),
  );
  node.patch = (bounty) => {
    const fact = facts(bounty);
    setText(pot, fact.pot);
    setText(potNote, fact.potNote);
    setText(fee, fact.fee);
    setText(feeNote, fact.feeNote);
    setClock(left, fact);
    setText(leftNote, fact.leftNote);
    setText(entries, fact.entries);
  };
  return node;
}

// One shape for the three row kinds the API gives: full entries, the compact rest and /live's standings.
export function standing(entry, display, title, prize) {
  return {
    id: entry.submission_id,
    rank: entry.rank,
    handle: entry.handle,
    title: entry.title,
    image: entry.image,
    house: entry.house || entry.baseline || entry.internal,
    score: score(display, title),
    prize: prize ? usd(prize) : '',
  };
}

// place -> what it pays now, the base reward plus its share of the entry fees.
export function prizeMap(bounty) {
  const now = bounty?.rewardsNow?.length ? bounty.rewardsNow : Object.entries(bounty?.rewards || {}).map(([place, amount]) => ({ place: Number(place), amountUsd: amount }));
  return new Map(now.map((reward) => [reward.place, reward.amountUsd]));
}
