// Surface 4, an account's public profile (#/u/:handle): who it is, its record, every result with its place, prize
// and score, and its payouts. One request; the results are shown a page at a time and patched in place.
import { h, patchList, setText, usd, count, ordinal, day, score, avatar } from './ui.js';

export function patch(page, params, profile) {
  const { refs } = page;
  page.repaint = () => patch(page, params, profile);
  const record = profile.record || {};
  setText(refs.name, profile.display_name || profile.handle);
  setText(refs.handle, `@${profile.handle}${profile.house ? ' · house account' : ''} · joined ${day(profile.joined_at)}`);
  setText(refs.bio, profile.bio || '');
  if (refs.who.dataset.handle !== profile.handle) {
    refs.who.dataset.handle = profile.handle;
    refs.who.replaceChildren(avatar(profile.avatar?.url || profile.image, profile.handle));
    const out = (href, label) => href && h('a', { href, target: '_blank', rel: 'noopener' }, label);
    refs.links.replaceChildren(
      ...[
        out(profile.github_login && `https://github.com/${profile.github_login}`, 'GitHub'),
        out(profile.x?.url, 'X'),
        out(profile.discord?.url, 'Discord'),
        out(profile.wallet?.explorer_url, profile.wallet && `Wallet ${profile.wallet.address.slice(0, 4)}…${profile.wallet.address.slice(-4)}`),
        out(`https://make.fun/u/${profile.handle}`, 'On make.fun'),
      ].filter(Boolean),
    );
  }
  setText(refs.prize, usd(record.prize_usd));
  setText(refs.won, count(record.competitions_won));
  setText(refs.podiums, count(record.podium_finishes));
  setText(refs.placed, count(record.competitions_placed));
  setText(refs.entered, count(record.competitions_entered));
  setText(refs.best, record.best_placement ? ordinal(record.best_placement) : '–');
  const results = profile.solutions || [];
  patchResults(refs.results, results.slice(0, page.rows));
  refs.more.hidden = results.length <= page.rows;
  setText(refs.shown, results.length ? `Showing ${Math.min(page.rows, results.length)} of ${count(results.length)} results.` : 'No public results yet.');
  const payouts = profile.payouts || [];
  refs.paid.hidden = !payouts.length;
  patchList(refs.payouts, payouts.slice(0, 6), (payout) => payout.id, payoutRow);
}

function patchResults(list, results) {
  patchList(list, results, (result) => result.submission_id, resultRow);
}

const PAGE_RESULTS = 8;

// A profile's results arrive whole; they are shown a page at a time, and the next page is a patch.
export function showMore(page) {
  page.rows += PAGE_RESULTS;
  page.repaint();
}

function resultRow(result) {
  const refs = {
    place: h('b.place'),
    bounty: h('a.title', { href: `#/bounty/${result.competition.slug}` }),
    entry: h('span.entry'),
    prize: h('b.cash'),
    score: h('span.score'),
    when: h('small'),
  };
  const node = h('li', refs.place, h('div', h('h3', refs.bounty), refs.entry, refs.when), h('div.took', refs.prize, refs.score));
  node.patch = (fresh) => {
    const placed = fresh.placement;
    const open = fresh.competition.status !== 'resolved';
    setText(refs.place, placed ? ordinal(placed) : open ? 'live' : '–');
    node.classList.toggle('podium', placed > 0 && placed <= 3);
    setText(refs.bounty, fresh.competition.title);
    setText(refs.entry, fresh.title || '');
    setText(refs.prize, Number(fresh.prize_usd) ? usd(fresh.prize_usd) : '');
    setText(refs.score, fresh.score ? `${fresh.score.column?.title || 'Score'} ${score(fresh.score.display, fresh.score.column?.title)}` : '');
    setText(refs.when, `${fresh.competition.category || 'Bounty'} · entered ${day(fresh.entered_at)}${open ? ' · awaiting results' : ''}`);
  };
  return node;
}

function payoutRow() {
  const amount = h('b.cash');
  const what = h('span');
  const tx = h('a', { target: '_blank', rel: 'noopener' }, 'transaction');
  const node = h('li', amount, what, tx);
  node.patch = (payout) => {
    setText(amount, usd(payout.amount_usd));
    setText(what, `${payout.place ? `${ordinal(payout.place)} place, ` : ''}${payout.competition?.title || 'reward'} · ${day(payout.paid_at)}`);
    tx.href = payout.explorer_url || '#';
  };
  return node;
}

export function build() {
  const refs = {
    who: h('span.me'),
    links: h('p.links'),
    name: h('h1'),
    handle: h('p.note'),
    bio: h('p.lead'),
    prize: h('b.cash'),
    won: h('b'),
    podiums: h('b'),
    placed: h('b'),
    entered: h('b'),
    best: h('b'),
    results: h('ol.results'),
    more: h('button.more', { type: 'button' }, `Show ${PAGE_RESULTS} more results`),
    shown: h('p.note'),
    payouts: h('ul.payouts'),
  };
  refs.more.addEventListener('click', () => showMore(page));
  refs.paid = h('div', h('h2', 'Payouts'), refs.payouts);
  const tile = (label, value, note) => h('div', h('dt', label), h('dd', value, h('small', note)));
  const page = h(
    'section.profile',
    h('p.crumbs', h('a', { href: '#/' }, 'Bounty board'), ' / public profile'),
    h(
      'div.id',
      refs.who,
      h('div', h('p.kicker', 'Public profile · live from make.fun/api'), refs.name, refs.handle, refs.bio, refs.links),
    ),
    h(
      'dl.figures',
      tile('Prize money', refs.prize, 'paid and owed'),
      tile('Bounties won', refs.won, 'first places'),
      tile('Podiums', refs.podiums, '2nd or 3rd'),
      tile('Placed', refs.placed, 'in the rewards'),
      tile('Entered', refs.entered, 'bounties'),
      tile('Best place', refs.best, 'so far'),
    ),
    h('div.columns', h('div', h('h2', 'Results'), refs.results, refs.more, refs.shown), h('aside', refs.paid)),
  );
  page.refs = refs;
  page.rows = PAGE_RESULTS;
  return page;
}
