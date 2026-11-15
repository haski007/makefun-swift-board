// Surface 4, an account's public profile (#/u/:handle): who it is, its record, every result with its place, prize
// and score, and its payouts. One request; the results are shown a page at a time and patched in place.
import { h, patchList, setText, usd, count, ordinal, day, score, avatar } from './ui.js';

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
    paidNote: h('p.note'),
  };
  refs.more.addEventListener('click', () => showMore(page));
  refs.paid = h('div', h('h2', 'Payouts'), refs.paidNote, refs.payouts);
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
  const results = byBounty(profile.solutions || []);
  patchResults(refs.results, results.slice(0, page.rows));
  refs.more.hidden = results.length <= page.rows;
  setText(refs.shown, results.length ? `${count(results.length)} bounties entered, ${count((profile.solutions || []).length)} entries in all.` : 'No public results yet.');
  const payouts = profile.payouts || [];
  refs.paid.hidden = !payouts.length;
  setText(refs.paidNote, `${payouts.length} payouts, ${usd(payouts.reduce((sum, payout) => sum + Number(payout.amount_usd), 0))} in all.`);
  patchList(refs.payouts, payouts, (payout) => payout.id, payoutRow);
}

function patchResults(list, results) {
  patchList(list, results, (result) => result.competition.slug, resultRow);
}

const PAGE_RESULTS = 8;

// A profile's results arrive whole; they are shown a page at a time, and the next page is a patch.
export function showMore(page) {
  page.rows += PAGE_RESULTS;
  page.repaint();
}

// One line per bounty the account entered: its best place, how many entries it made, the prize and its best score.
function byBounty(solutions) {
  const groups = new Map();
  for (const entry of solutions) {
    const group = groups.get(entry.competition.slug) || { competition: entry.competition, entries: [], prize: 0 };
    group.entries.push(entry);
    group.prize += Number(entry.prize_usd) || 0;
    groups.set(entry.competition.slug, group);
  }
  for (const group of groups.values()) {
    const placed = group.entries.filter((entry) => entry.placement > 0);
    group.best = placed.toSorted((a, b) => a.placement - b.placement)[0] || group.entries[0];
  }
  return [...groups.values()];
}

function resultRow() {
  const refs = {
    place: h('b.place'),
    bounty: h('a.title'),
    entry: h('span.entry'),
    prize: h('b.cash'),
    score: h('span.score'),
    when: h('small'),
  };
  const node = h('li', refs.place, h('div', h('h3', refs.bounty), refs.entry, refs.when), h('div.took', refs.prize, refs.score));
  node.patch = (group) => {
    const { best, competition } = group;
    const open = competition.status !== 'resolved';
    setText(refs.place, best.placement ? ordinal(best.placement) : open ? 'in play' : '–');
    refs.place.classList.toggle('off', !best.placement);
    node.classList.toggle('podium', best.placement > 0 && best.placement <= 3);
    refs.bounty.href = `#/bounty/${competition.slug}`;
    setText(refs.bounty, competition.title);
    setText(refs.entry, best.title || '');
    setText(refs.prize, group.prize ? usd(group.prize) : '');
    const column = best.score?.column;
    setText(refs.score, best.score ? `${(column?.title || 'Score').replace(/ \(.*\)/, '')} ${score(best.score.display, column?.title)}` : '');
    const n = group.entries.length;
    setText(refs.when, `${competition.category || 'Bounty'} · ${n} ${n > 1 ? 'entries' : 'entry'} · last ${day(group.entries[0].entered_at)}${open ? '' : ''}`);
  };
  return node;
}

function payoutRow() {
  const amount = h('b.cash');
  const what = h('b');
  const when = h('small');
  const tx = h('a', { target: '_blank', rel: 'noopener' }, 'tx');
  const node = h('li', amount, h('span', what, when), tx);
  node.patch = (payout) => {
    setText(amount, usd(payout.amount_usd));
    setText(what, payout.competition?.title || 'Reward');
    setText(when, `${payout.place ? `${ordinal(payout.place)} place · ` : ''}${day(payout.paid_at)}`);
    tx.href = payout.explorer_url || '#';
  };
  return node;
}
