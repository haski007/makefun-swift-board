// Surface 2, a bounty's page (#/bounty/:slug): summary, the four figures, the rewards table at the live pot, dates
// and status, how it is scored, description and rules, and the top of its leaderboard. Two requests, both cached;
// a refresh patches the figures, the rewards and the standings where they stand.
import { h, patchList, setText, usd, count, ordinal, day, stage, STAGES, figures } from './ui.js';
import { patchStandings, standing, prizeMap } from './leaderboard.js';

export function patch({ refs }, params, bounty, live) {
  const at = stage(bounty);
  setText(refs.tag, STAGES[at]);
  refs.tag.className = `tag ${at}`;
  setText(refs.kind, [bounty.category, bounty.sponsor?.name && `by ${bounty.sponsor.name}`, ...(bounty.skills || []).slice(0, 3)].filter(Boolean).join(' · '));
  setText(refs.title, bounty.title);
  setText(refs.summary, bounty.summary || '');
  refs.figures.patch(bounty);
  patchRewardsTable(refs, bounty);
  patchDates(refs.dates, bounty, live);
  setText(refs.scoring, bounty.resolution?.summary || '');
  setText(refs.metric, bounty.resolution?.metric ? `Ranked by ${bounty.resolution.metric.name}, ${bounty.resolution.metric.better} is better.` : '');
  if (refs.description.source !== bounty.description) refs.description.replaceChildren(prose((refs.description.source = bounty.description) || ''));
  refs.rules.source = bounty.rules || '';
  refs.rulesBox.hidden = !bounty.rules;

  const standings = live?.standings;
  const prizes = prizeMap(bounty);
  let house = 0;
  const top = (standings?.rows || []).map((row) => {
    const own = row.baseline || row.internal;
    if (own) house += 1;
    return standing(row, row.display, standings.rank_key_title, own ? null : prizes.get(row.rank - house));
  });
  patchStandings(refs.top, top);
  setText(refs.topNote, top.length ? `Top ${top.length} of ${count(standings.total)}, best first by ${standings.rank_key_title}.` : 'The standings are not out yet for this phase.');
  setText(refs.topScore, standings?.rank_key_title || 'Score');
  setText(refs.all, top.length ? `Full leaderboard: all ${count(standings.total)} entries` : 'Open the leaderboard');
}

function patchRewardsTable(refs, bounty) {
  const fees = Number(bounty.entryFeesUsd) || 0;
  const places = bounty.rewardsNow?.length
    ? bounty.rewardsNow
    : Object.entries(bounty.rewards || {}).map(([place, amount]) => ({ place: Number(place), amountUsd: amount, baseUsd: amount, feeShareUsd: 0 }));
  setText(refs.pot, usd(bounty.potUsd ?? bounty.rewardAmount));
  setText(
    refs.potNote,
    fees
      ? `= ${usd(bounty.rewardAmount)} reward + ${usd(fees)} from ${count(bounty.entryFeePayers)} entry fees, shared by the top ${places.length}.`
      : `= the reward, shared by the top ${places.length}. No entry fee adds to it.`,
  );
  patchList(refs.rewards, tiers(places), (tier) => tier.place, rewardCell);
}

// The places that pay the same are one line of the rewards table: 1st, 2nd, 3rd, 4th to 10th, 11th to 20th.
function tiers(places) {
  const out = [];
  for (const reward of places) {
    const last = out.at(-1);
    if (last && last.amountUsd === reward.amountUsd && last.baseUsd === reward.baseUsd && reward.place === last.to + 1) last.to = reward.place;
    else out.push({ ...reward, to: reward.place });
  }
  return out;
}

function patchDates(list, bounty, live) {
  const phases = (bounty.phases || []).map((phase) => [`Phase: ${phase.title}`, `${day(phase.startsAt)} to ${day(phase.endsAt)}`]);
  const rows = [
    ['Status', `${STAGES[stage(bounty)]} (status ${bounty.status})`],
    ['Opened', day(bounty.opensAt || bounty.publishedAt)],
    ['Deadline', day(bounty.deadline)],
    ...phases,
    bounty.resolvedAt && ['Resolved', day(bounty.resolvedAt)],
    live?.status?.sentence && ['Right now', live.status.sentence],
    bounty.resolution?.announce && ['Results', bounty.resolution.announce],
  ].filter(Boolean);
  patchList(list, rows, (row) => row[0], dateRow);
}

function rewardCell() {
  const place = h('span');
  const amount = h('b.cash');
  const parts = h('small');
  const node = h('li', place, amount, parts);
  node.patch = (reward) => {
    setText(place, reward.to > reward.place ? `${ordinal(reward.place)} to ${ordinal(reward.to)}` : ordinal(reward.place));
    setText(amount, usd(reward.amountUsd) + (reward.to > reward.place ? ' each' : ''));
    setText(parts, Number(reward.feeShareUsd) ? `${usd(reward.baseUsd)} + ${usd(reward.feeShareUsd)}` : '');
  };
  return node;
}

function dateRow() {
  const term = h('dt');
  const value = h('dd');
  const node = h('div', term, value);
  node.patch = (row) => {
    setText(term, row[0]);
    setText(value, row[1]);
  };
  return node;
}

// The API's markdown as DOM nodes, never as HTML: headings, lists, paragraphs, `code`, **bold** and links.
function prose(text) {
  const out = document.createDocumentFragment();
  let list = null;
  let para = [];
  const flush = () => {
    if (para.length) out.append(h('p', inline(para.join(' '))));
    para = [];
  };
  for (const line of text.split('\n')) {
    const heading = /^#{1,6}\s+(.*)/.exec(line);
    const item = /^\s*(?:[-*]|\d+\.)\s+(.*)/.exec(line);
    if (!item) list = null;
    if (heading) {
      flush();
      out.append(h('h3', inline(heading[1])));
    } else if (item) {
      flush();
      if (!list) out.append((list = h('ul')));
      list.append(h('li', inline(item[1])));
    } else if (line.trim()) para.push(line.trim());
    else flush();
  }
  flush();
  return out;
}

function inline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/).map((part) => {
    if (part[0] === '`') return h('code', part.slice(1, -1));
    if (part.startsWith('**')) return h('strong', part.slice(2, -2));
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (!link) return part;
    const href = link[2][0] === '/' ? `https://make.fun${link[2]}` : link[2];
    return /^https?:/.test(href) ? h('a', { href, target: '_blank', rel: 'noopener' }, link[1]) : link[1];
  });
}

export function build({ slug }) {
  const refs = {
    tag: h('span.tag'),
    kind: h('span'),
    title: h('h1'),
    summary: h('p.lead'),
    figures: figures(),
    pot: h('mark.cash'),
    potNote: h('span'),
    rewards: h('ol.rewards'),
    dates: h('dl.dates'),
    scoring: h('p'),
    metric: h('p.note'),
    description: h('div.prose'),
    rules: h('div.prose'),
    top: h('ol.standings'),
    topNote: h('p.note'),
    topScore: h('span.score'),
    all: h('a.more', { href: `#/bounty/${slug}/leaderboard` }),
  };
  refs.rulesBox = h('details', h('summary', 'Read the full rules'), refs.rules);
  // The rules can run to tens of kilobytes: they become DOM only when the reader opens them.
  refs.rulesBox.addEventListener('toggle', () => {
    if (refs.rulesBox.open && refs.rules.shown !== refs.rules.source) refs.rules.replaceChildren(prose((refs.rules.shown = refs.rules.source)));
  });
  const page = h(
    'section.bounty',
    h('p.crumbs', h('a', { href: '#/' }, 'Bounty board'), ' / bounty page'),
    h('p.kicker', refs.tag, refs.kind),
    refs.title,
    refs.summary,
    refs.figures,
    h(
      'div.columns',
      h(
        'div',
        h('h2', 'Rewards at the live pot'),
        h('p.sum', refs.pot, ' ', refs.potNote),
        refs.rewards,
        h('h2', 'Dates and status'),
        refs.dates,
        h('h2', 'How it is scored'),
        refs.scoring,
        refs.metric,
        h('h2', 'Description'),
        refs.description,
        h('h2', 'Rules'),
        refs.rulesBox,
      ),
      h('aside', h('h2', 'Leaderboard'), refs.topNote, h('div.standings-head', h('span', '#'), h('span', 'Entrant'), refs.topScore, h('span.prize', 'Reward now')), refs.top, refs.all),
    ),
  );
  page.refs = refs;
  return page;
}
