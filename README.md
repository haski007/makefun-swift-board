# makefun-swift-board

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/haski007/makefun-swift-board/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/haski007/makefun-swift-board/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A make.fun frontend in plain static files: no framework, no build step, read-only GET calls to `https://make.fun/api`. It has four surfaces, each with its own hash URL: the bounty board (`#/`, finished ones at `#/past`), a bounty's page with its rewards table at the live pot, dates and status (`#/bounty/<slug>`), that bounty's leaderboard (`#/bounty/<slug>/leaderboard`) and an account's public profile (`#/u/<handle>`).

On a wide screen (1100 px and up) the leaderboard route shows the bounty summary beside the full leaderboard, paged 50 rows at a time with Prev and Next; narrow screens get the plain leaderboard.

The first load is two files, `index.html` and `router.js` (the route table and an ETag cache with in-flight de-duplication, minute-aware because make.fun's ETags are). Each view is a module fetched by a literal `import()` when its route opens. Views patch their rows in place by key, long lists are paged, and every countdown ticks from one timer without a request. A bounty counts as taking entries by its deadline, not by its `open` status.

## Run it

```
node serve.ts
```

Then open http://localhost:8080. To build the entry's output and dossier: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`. To retake the screenshots with headless Chrome: `node tools/shoot.mjs`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=s5g52ybn&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
