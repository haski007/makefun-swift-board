import { h } from './ui.js';
import * as bounty from './bounty.js';
import * as leaderboard from './leaderboard.js';

export function build(params) {
  const left = bounty.build(params);
  const right = leaderboard.build(params);
  const page = h('section.duo', left, right);
  page.refs = { left, right };
  return page;
}

export function patch(page, params, board, info) {
  bounty.patch(page.refs.left, params, info, null);
  leaderboard.patch(page.refs.right, params, board, info);
}
