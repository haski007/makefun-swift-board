function boardPage({ past }) {
  return [import('./board.js'), `/competitions?status=${past ? 'resolved' : 'open'}&activity=times&limit=24`];
}
function bountyPage({ slug }) {
  return [import('./bounty.js'), `/competitions/${slug}?submissions=summary`, `/competitions/${slug}/live`];
}
function leaderboardPage({ slug, wide }) {
  return [wide ? import('./duo.js') : import('./leaderboard.js'), `/competitions/${slug}/leaderboard?rows=first`, `/competitions/${slug}?submissions=summary`];
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
const etagCache = new Map(), inFlight = new Map();
let turn = 0;

function revalidateByEtag(path) {
  if (!inFlight.has(path)) {
    const held = etagCache.get(path);
    inFlight.set(
      path,
      fetch('https://make.fun/api' + path)
        .then(async (answer) => {
          if (!answer.ok) throw Error(`make.fun answered ${answer.status} for ${path}`);
          const etag = answer.headers.get('etag');
          const data = held && etag === held.etag ? held.data : await answer.json();
          etagCache.set(path, { etag, data, minute: (Date.now() / 6e4) | 0 });
          return data;
        })
        .finally(() => inFlight.delete(path)),
    );
  }
  return inFlight.get(path);
}

export function etagGet(path) {
  const held = etagCache.get(path);
  if (!held) return revalidateByEtag(path);
  if (held.minute !== ((Date.now() / 6e4) | 0)) revalidateByEtag(path).then((data) => data === held.data || refresh(), () => {});
  return Promise.resolve(held.data);
}

function buildOnceThenPatch(view, key, module, params, answers) {
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
  const wide = matchMedia('(min-width:1100px)').matches;
  const key = hash + (wide && /^#\/bounty\/[^/]+\/leaderboard$/.test(hash) ? '+duo' : '');
  const view = document.getElementById('view');
  view.ariaLive = 'polite';
  if (view.dataset.key !== key) window.__shotReady = false;
  try {
    const [pattern, page] = ROUTES.find(([pattern]) => pattern.test(hash)) || [];
    if (!page) throw Error(`No page at ${hash}`);
    const params = { ...pattern.exec(hash).groups, etagGet, wide };
    const [load, first, ...rest] = page(params);
    import('./ui.js');
    import('./style.js');
    params.api = first;
    const [module, ...answers] = await Promise.all([load, etagGet(first), ...rest.map((path) => etagGet(path).catch(() => null))]);
    if (mine === turn) buildOnceThenPatch(view, key, module, params, answers);
  } catch (error) {
    if (mine !== turn) return;
    view.dataset.key = '';
    view.innerHTML = '<h1>No page here</h1><p></p><a href="#/">Bounty board</a>';
    view.children[1].textContent = error.message;
  }
  for (const link of document.querySelectorAll('nav a')) link.toggleAttribute('aria-current', link.hash === hash);
  window.__shotReady = mine === turn;
  window.syncedAt = Date.now();
}

matchMedia('(min-width:1100px)').onchange = () => refresh();
addEventListener('hashchange', refresh);
addEventListener('visibilitychange', () => document.hidden || refresh());
setInterval(() => document.hidden || refresh(), 6e4);
refresh();
