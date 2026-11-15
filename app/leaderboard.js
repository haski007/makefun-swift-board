// Surface 3, a bounty's leaderboard (#/bounty/:slug/leaderboard): every ranked entry with its score and the reward
// its place pays at the live pot. A board can hold thousands of rows, so they are shown a page at a time and the
// rows on the page are keyed and patched in place.
import { h, patchList, setText, usd, count, score, avatar, figures, standing, prizeMap } from './ui.js';

export function build({ slug }) {
  const refs = {
    bounty: h('a', { href: `#/bounty/${slug}` }),
    lead: h('span'),
    held: h('span'),
    figures: figures(),
    filter: h('input', { type: 'search', placeholder: 'Filter by handle or entry', 'aria-label': 'Filter the leaderboard by handle or entry title' }),
    scoreTitle: h('span.score'),
    list: h('ol.standings'),
    more: h('button.more', { type: 'button' }),
    shown: h('p.note'),
  };
  refs.filter.addEventListener('input', () => {
    page.rows = PAGE_ROWS;
    page.repaint();
  });
  refs.more.addEventListener('click', () => showMore(page));
  const page = h(
    'section.leaderboard',
    h('p.crumbs', h('a', { href: '#/' }, 'Bounty board'), ' / ', refs.bounty),
    h('p.kicker', 'Leaderboard · live from make.fun/api'),
    h('h1', 'Leaderboard'),
    h('p.lead', refs.lead, ' ', refs.held),
    refs.figures,
    refs.filter,
    h('div.standings-head', h('span', '#'), h('span', 'Entrant'), h('span.entry', 'Entry'), refs.scoreTitle, h('span.prize', 'Reward now')),
    refs.list,
    refs.more,
    refs.shown,
  );
  page.refs = refs;
  page.rows = PAGE_ROWS;
  return page;
}

export function patch(page, { slug }, board, bounty) {
  const { refs } = page;
  page.repaint = () => patch(page, { slug }, board, bounty);
  const title = board.columns?.find((column) => column.key === board.rank_key)?.title || board.rank_key || 'Score';
  const prizes = prizeMap(bounty);
  const rows = [
    ...(board.entries || []).map((entry) => standing(entry, entry.display?.[board.rank_key], title, prizes.get(entry.prize_rank))),
    ...(board.rest || []).map((entry) => standing(entry, entry.display, title, prizes.get(entry.prize_rank))),
  ];
  const wanted = refs.filter.value.trim().toLowerCase();
  const found = wanted ? rows.filter((row) => `${row.handle} ${row.title}`.toLowerCase().includes(wanted)) : rows;
  setText(refs.bounty, bounty?.title || board.competition?.title || slug);
  setText(refs.lead, `${count(rows.length)} ranked entries in the ${board.phase?.title || 'current'} phase, best first by ${title}.`);
  setText(refs.held, board.phase?.placements_held ? 'Places are provisional until the results are published.' : rows.length ? 'These places are final.' : 'No ranked entries yet.');
  setText(refs.scoreTitle, title);
  refs.figures.hidden = !bounty;
  if (bounty) refs.figures.patch(bounty);
  patchStandings(refs.list, found.slice(0, page.rows));
  refs.more.hidden = found.length <= page.rows;
  setText(refs.more, `Show ${count(Math.min(PAGE_ROWS, found.length - page.rows))} more`);
  setText(refs.shown, `Showing ${count(Math.min(page.rows, found.length))} of ${count(found.length)}${wanted ? ' matching' : ''} entries.`);
}

// The rows of a leaderboard, in place: a row that is already shown is patched, not rebuilt.
export function patchStandings(list, rows) {
  function standingRow(row) {
    const refs = {
      rank: h('b.rank'),
      who: h('a.who', { href: `#/u/${row.handle}` }),
      house: h('small'),
      title: h('span.entry'),
      score: h('b.score'),
      prize: h('span.prize'),
    };
    const node = h('li', refs.rank, avatar(row.image, row.handle), h('span.name', refs.who, refs.house), refs.title, refs.score, refs.prize);
    node.patch = (fresh) => {
      setText(refs.rank, fresh.rank ?? '–');
      node.classList.toggle('podium', fresh.rank <= 3);
      setText(refs.who, fresh.handle);
      setText(refs.house, fresh.house ? 'house entry' : '');
      setText(refs.title, fresh.title || '');
      setText(refs.score, fresh.score);
      setText(refs.prize, fresh.prize);
    };
    return node;
  }
  patchList(list, rows, (row) => row.id, standingRow);
}

const PAGE_ROWS = 50;

// The next screenful of a long board: the rows are already held, so this is a patch and no request.
export function showMore(page) {
  page.rows += PAGE_ROWS;
  page.repaint();
}

