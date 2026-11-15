// First load: one page function per surface, the ETag cache and the hash router. Views arrive by literal import().
function boardPage({ past }) {
  return [import('./board.js'), `/competitions?status=${past ? 'resolved' : 'open'}&activity=times&limit=24`];
}
function bountyPage({ slug }) {
  return [import('./bounty.js'), `/competitions/${slug}?submissions=summary`, `/competitions/${slug}/live`];
}
function leaderboardPage({ slug }) {
  return [import('./leaderboard.js'), `/competitions/${slug}/leaderboard?rows=first`, `/competitions/${slug}?submissions=summary`];
}
function profilePage({ handle }) {
  return [import('./profile.js'), `/profiles/${handle}`];
}

const ROUTES = [
  [/^#\/(?<past>past)?$/, boardPage],
  [/^#\/bounty\/(?<slug>[\w.-]+)$/, bountyPage],
  [/^#\/bounty\/(?<slug>[\w.-]+)\/leaderboard$/, leaderboardPage],
  [/^#\/u\/(?<handle>[^/]+)$/, profilePage],
];
// path -> { etag, data, minute }, and path -> the one request concurrent callers share
const etagCache = new Map();
const inFlight = new Map();
const minute = () => Math.floor(Date.now() / 6e4);
let turn = 0;

// One GET per path at a time; the browser revalidates with If-None-Match itself, and a 304 keeps the parsed answer.
function revalidate(path) {
  if (!inFlight.has(path)) {
    const held = etagCache.get(path);
    inFlight.set(
      path,
      fetch('https://make.fun/api' + path)
        .then(async (answer) => {
          if (!answer.ok) throw Error(`make.fun answered ${answer.status} for ${path}`);
          const etag = answer.headers.get('etag');
          const data = held && etag === held.etag ? held.data : await answer.json();
          etagCache.set(path, { etag, data, minute: minute() });
          return data;
        })
        .finally(() => inFlight.delete(path)),
    );
  }
  return inFlight.get(path);
}

// ETags turn with the minute: an answer from this minute costs no request; an older one shows at once while it
// revalidates, and the open view is patched only if the answer changed.
export function apiGet(path) {
  const held = etagCache.get(path);
  if (!held) return revalidate(path);
  if (held.minute !== minute()) revalidate(path).then((data) => data === held.data || refresh(), () => {});
  return Promise.resolve(held.data);
}

// A route's page is built once; the same route again (refresh, sort, next page) patches it in place.
function mountOrPatch(view, key, module, params, answers) {
  if (view.dataset.key !== key) {
    view.dataset.key = key;
    view.replaceChildren((view.page = module.build(params)));
    scrollTo(0, 0);
  }
  module.patch(view.page, params, ...answers);
}

async function refresh() {
  const mine = ++turn;
  const hash = (decodeURI(location.hash) || '#/').replace(/([^#])\/+$/, '$1');
  const view = document.getElementById('view');
  if (view.dataset.key !== hash) window.__shotReady = false;
  try {
    const [pattern, page] = ROUTES.find(([pattern]) => pattern.test(hash)) || [];
    if (!page) throw Error(`No page at ${hash}`);
    const params = { ...pattern.exec(hash).groups, apiGet };
    const [load, first, ...rest] = page(params);
    params.api = first;
    const [module, ...answers] = await Promise.all([load, apiGet(first), ...rest.map((path) => apiGet(path).catch(() => null))]);
    if (mine === turn) mountOrPatch(view, hash, module, params, answers);
  } catch (error) {
    if (mine !== turn) return;
    view.dataset.key = '';
    view.innerHTML = '<h1>No page here</h1><p></p><a href="#/">Bounty board</a>';
    view.children[1].textContent = error.message;
  }
  for (const link of document.querySelectorAll('nav a')) link.toggleAttribute('aria-current', link.hash === hash);
  window.__shotReady = mine === turn;
}

addEventListener('hashchange', refresh);
addEventListener('visibilitychange', () => document.hidden || refresh());
setInterval(() => document.hidden || refresh(), 6e4);
refresh();
