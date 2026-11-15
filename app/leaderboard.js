import { h, patchList, setText, count, avatar, figures, standing, prizeMap } from './ui.js';

const ROWS_PER_PAGE = 50;

export function showPage(page, at) {
  page.at = at;
  page.repaint();
}

export function build({ slug }) {
  const pager = () => {
    const prev = h('button', { type: 'button' }, '‹ Prev');
    const next = h('button', { type: 'button' }, 'Next ›');
    const text = h('span.where');
    const node = h('div.pager', { role: 'group', 'aria-label': 'Leaderboard pages' }, prev, text, next);
    const go = (step) => {
      showPage(page, page.at + step);
      if (node !== page.refs.top) page.refs.top.scrollIntoView({ block: 'nearest' });
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    node.patch = (at, pages, from, to, total) => {
      setText(text, total ? `Rows ${count(from)}–${count(to)} of ${count(total)} · Page ${at + 1} of ${count(pages)}` : 'No rows');
      prev.disabled = at <= 0;
      next.disabled = at >= pages - 1;
      node.hidden = pages < 2;
    };
    return node;
  };
  const refs = {
    bounty: h('a', { href: `#/bounty/${slug}` }),
    lead: h('span'),
    held: h('span'),
    ranked: h('span'),
    figures: figures(),
    filter: h('input', { type: 'search', placeholder: 'Filter by handle or entry', 'aria-label': 'Filter the leaderboard by handle or entry title' }),
    scoreTitle: h('span.score'),
    list: h('ol.standings'),
    none: h('p.note'),
    top: pager(),
    bottom: pager(),
  };
  refs.filter.addEventListener('input', () => showPage(page, 0));
  const page = h(
    'section.leaderboard',
    h('p.crumbs', h('a', { href: '#/' }, 'Bounty board'), ' / ', refs.bounty),
    h('p.kicker', refs.ranked),
    h('h1', 'Leaderboard'),
    h('p.lead', refs.lead, ' ', refs.held),
    refs.figures,
    refs.filter,
    refs.top,
    h('div.standings-head', h('span', '#'), h('span', 'Entrant'), h('span.entry', 'Entry'), refs.scoreTitle, h('span.prize', 'Reward now')),
    refs.list,
    refs.none,
    refs.bottom,
  );
  page.refs = refs;
  page.at = 0;
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
  const pages = Math.max(1, Math.ceil(found.length / ROWS_PER_PAGE));
  page.at = Math.min(Math.max(page.at, 0), pages - 1);
  const from = page.at * ROWS_PER_PAGE;
  const shown = found.slice(from, from + ROWS_PER_PAGE);
  const phase = board.phase?.title || 'current phase';
  setText(refs.bounty, bounty?.title || board.competition?.title || slug);
  setText(refs.ranked, `${count(rows.length)} ranked · ${phase}`);
  setText(refs.lead, `${count(rows.length)} ranked entries in the ${phase}, best first by ${title}.`);
  setText(refs.held, board.phase?.placements_held ? 'Places are provisional until the results are published.' : rows.length ? 'These places are final.' : 'No ranked entries yet.');
  setText(refs.scoreTitle, title);
  setText(refs.none, found.length || !rows.length ? '' : `No entrant matches "${wanted}".`);
  refs.figures.hidden = !bounty;
  if (bounty) refs.figures.patch(bounty);
  patchStandings(refs.list, shown);
  for (const pager of [refs.top, refs.bottom]) pager.patch(page.at, pages, from + 1, from + shown.length, found.length);
}

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
