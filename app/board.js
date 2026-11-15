// Surface 1, the bounty board (#/ live, #/past finished) as a ledger: one column header, then a dense row per bounty
// with its live pot, entry fee, time left and entries. One API page per request; the rows are keyed and patched in
// place on a refresh, a sort and "Load more", and the clocks tick from ui.js's single timer.
import { h, patchList, setText, usd, count, stage, STAGES, countdown, avatar, facts, setClock } from './ui.js';

export function build({ past }) {
  const refs = {
    headline: h('span'),
    pots: h('mark.cash'),
    next: h('p.next', 'Next to close '),
    nextTitle: h('a'),
    nextClock: h('b.clock'),
    list: h('div.rows'),
    more: h('button.more', { type: 'button' }, 'Load more bounties'),
    shown: h('p.note'),
    sorts: h('div.sorts', { role: 'group', 'aria-label': 'Sort the board' }),
  };
  refs.next.append(refs.nextTitle, ' in ', refs.nextClock);
  const page = h(
    'section.board',
    h(
      'div.band',
      h('div', h('p.kicker', past ? 'Finished bounties · make.fun/api' : 'Bounty board · live from make.fun/api'), h('h1', refs.headline, ' ', refs.pots)),
      h('div.side', refs.next, refs.sorts),
    ),
    h('div.cols', h('span', 'Bounty'), h('span', past ? 'Final pot' : 'Live pot'), h('span', 'Entry fee'), h('span', past ? 'Ended' : 'Time left'), h('span', 'Entries')),
    refs.list,
    refs.more,
    refs.shown,
  );
  page.refs = refs;
  page.sort = past ? 'late' : 'soon';
  page.more = [];
  for (const key of past ? ['late', 'pot', 'entries'] : ['soon', 'pot', 'entries']) {
    const button = h('button', { type: 'button', value: key }, SORTS[key][0]);
    button.addEventListener('click', () => {
      page.sort = key;
      page.repaint();
    });
    refs.sorts.append(button);
  }
  refs.more.addEventListener('click', () => loadNextPageByCursor(page));
  return page;
}

export function patch(page, params, first) {
  const { refs } = page;
  const past = params.past;
  page.repaint = () => patch(page, params, first);
  page.cursorOf = (cursor) => `${params.api}&cursor=${encodeURIComponent(cursor)}`;
  page.etagGet = params.etagGet;
  const pages = [first, ...page.more];
  const bounties = [...new Map(pages.flatMap((each) => each.items).map((bounty) => [bounty.slug, bounty])).values()];
  const live = bounties.filter((bounty) => stage(bounty) === 'live');
  const pot = (list) => usd(list.reduce((sum, bounty) => sum + Number(bounty.potUsd), 0));
  if (past) {
    setText(refs.headline, `${count(bounties.length)} finished bounties,`);
    setText(refs.pots, `${pot(bounties)} paid out.`);
    refs.next.hidden = true;
  } else {
    const next = live.toSorted(SORTS.soon[1])[0];
    setText(refs.headline, `${live.length} bounties take entries,`);
    setText(refs.pots, `${pot(live)} in live pots.`);
    refs.next.hidden = !next;
    if (next) {
      setText(refs.nextTitle, next.title);
      refs.nextTitle.href = `#/bounty/${next.slug}`;
      countdown(refs.nextClock, next.deadline);
    }
  }
  for (const button of refs.sorts.children) button.setAttribute('aria-pressed', button.value === page.sort);
  const sorted = bounties.toSorted((a, b) => Object.keys(STAGES).indexOf(stage(a)) - Object.keys(STAGES).indexOf(stage(b)) || SORTS[page.sort][1](a, b));
  patchList(refs.list, sorted, (bounty) => bounty.slug, bountyRow);
  const cursor = pages.at(-1).next_cursor;
  refs.more.hidden = !cursor;
  page.cursor = cursor;
  setText(refs.shown, `${count(bounties.length)} ${past ? 'finished' : 'open'} bounties shown${cursor ? ', more to load' : ', all of them'}.`);
}

const SORTS = {
  soon: ['Ending soon', (a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)],
  late: ['Latest', (a, b) => Date.parse(b.deadline) - Date.parse(a.deadline)],
  pot: ['Biggest pot', (a, b) => Number(b.potUsd) - Number(a.potUsd)],
  entries: ['Most entries', (a, b) => b.submissionCount - a.submissionCount],
};

// The next page of the board: one more cached request, then the same patch with its rows added.
export async function loadNextPageByCursor(page) {
  const { more } = page.refs;
  more.disabled = true;
  try {
    page.more.push(await page.etagGet(page.cursorOf(page.cursor)));
    page.repaint();
  } finally {
    more.disabled = false;
  }
}

function bountyRow() {
  const refs = {
    tag: h('span.tag'),
    title: h('a.title'),
    kind: h('span'),
    summary: h('span.summary'),
    won: h('span.won'),
    pot: h('b.cash'),
    potNote: h('small'),
    fee: h('b'),
    feeNote: h('small'),
    left: h('b.clock'),
    leftNote: h('small'),
    entries: h('b'),
  };
  const cell = (label, ...kids) => h('span.c', { 'data-l': label }, ...kids);
  const row = h(
    'article.row',
    h('div.what', h('h2', refs.tag, refs.title), h('p.sub', refs.kind, refs.summary, refs.won)),
    cell('Live pot', refs.pot, refs.potNote),
    cell('Entry fee', refs.fee, refs.feeNote),
    cell('Time left', refs.left, refs.leftNote),
    cell('Entries', refs.entries),
  );
  row.patch = (bounty) => {
    const fact = facts(bounty);
    setText(refs.tag, STAGES[fact.at]);
    refs.tag.className = `tag ${fact.at}`;
    refs.tag.hidden = fact.at === 'live' || fact.at === 'done';
    setText(refs.title, bounty.title);
    refs.title.href = `#/bounty/${bounty.slug}`;
    setText(refs.kind, [bounty.category, bounty.sponsor?.name && `by ${bounty.sponsor.name}`].filter(Boolean).join(' · '));
    setText(refs.summary, bounty.summary || bounty.description?.slice(0, 160) || '');
    const winner = bounty.winner?.handle;
    refs.won.hidden = !winner;
    if (winner && refs.won.dataset.handle !== winner) {
      refs.won.dataset.handle = winner;
      refs.won.replaceChildren('Won by ', avatar(bounty.winner.image, winner), h('a', { href: `#/u/${winner}` }, winner));
    }
    setText(refs.pot, fact.pot);
    setText(refs.potNote, fact.potNote);
    setText(refs.fee, fact.fee);
    setText(refs.feeNote, fact.feeNote);
    setClock(refs.left, fact);
    setText(refs.leftNote, fact.leftNote);
    setText(refs.entries, fact.entries);
  };
  return row;
}
