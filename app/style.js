// The stylesheet beyond index.html's few critical rules. It arrives with the first view (ui.js adopts it as a
// constructed sheet), so it costs the first load nothing. One theme: warm paper, black ink, a green slab for money
// and an orange clock.
export const CSS = `
h1{font-size:clamp(32px,5.2vw,56px);line-height:1.03;letter-spacing:-.04em;font-weight:900;margin:4px 0 12px;text-wrap:balance}
h2{font-size:21px;line-height:1.15;letter-spacing:-.02em;font-weight:800;margin:26px 0 10px;padding-top:9px;border-top:3px solid var(--ink)}
h3{font-size:17px;line-height:1.25;margin:16px 0 6px}
p{margin:0 0 10px}
:focus-visible{outline:3px solid var(--clock);outline-offset:2px}
[hidden]{display:none!important}
.kicker{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mute)}
.crumbs{font-size:14px;font-weight:700;color:var(--mute);margin-bottom:14px}
.lead{font-size:19px;line-height:1.4;max-width:66ch}
.note{font-size:14px;color:var(--mute)}
.cash{background:var(--cash);color:var(--ink);padding:0 .2em;font-weight:900;font-variant-numeric:tabular-nums;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.cash:empty{display:none}
.clock{color:var(--clock);font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}
.clock.off{color:var(--mute)}
.clock.calm{color:var(--ink)}
.sync{white-space:nowrap;font-size:12px;font-weight:600;color:var(--mute)}
.sync::before{content:'';display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:50%;background:var(--cash)}
.tag{padding:1px 7px;border:2px solid var(--ink);color:var(--ink);background:var(--card);font-size:11px}
.tag.live{background:var(--ink);color:var(--paper)}
.tag.judging{border-style:dashed}
.tag.done{background:var(--line);border-color:var(--line)}
button,.more{font:inherit;font-weight:700;color:var(--ink);background:var(--card);border:2px solid var(--ink);padding:7px 14px;cursor:pointer;text-decoration:none}
button:hover,.more:hover,button[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.more{display:inline-block;margin:14px 0 6px}

.figures{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:16px 0 4px;border:3px solid var(--ink);background:var(--card)}
.figures>div{padding:11px 14px 12px;border-left:1px solid var(--line);min-width:0}
.figures>div:first-child{border-left:0}
.figures dt{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mute)}
.figures dd{margin:3px 0 0}
.figures b{display:inline-block;font-size:clamp(24px,3.3vw,38px);line-height:1.08;letter-spacing:-.03em;font-weight:900;font-variant-numeric:tabular-nums}
.figures small{display:block;margin-top:4px;font-size:12.5px;line-height:1.25;color:var(--mute)}

.band{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px 28px;padding-bottom:14px}
.band h1{font-size:clamp(30px,4.4vw,46px);margin:0}
.band h1 .cash{display:inline-block;padding:0 .22em}
.side{display:grid;gap:9px;justify-items:start;max-width:100%}
.next{margin:0;font-size:15px}
.next a{font-weight:700}
.bounty h1{font-size:clamp(30px,4.2vw,44px)}
.bounty .lead{font-size:17px;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bounty .figures{margin-top:10px}
.bounty .figures b{font-size:clamp(24px,3vw,32px)}
.bounty .figures>div{padding:8px 14px 9px}
.profile .figures b{font-size:clamp(22px,2.8vw,30px)}
.sorts{display:flex;flex-wrap:wrap;gap:6px}
.sorts button{padding:3px 11px;font-size:14px}
.cols,.row{display:grid;grid-template-columns:minmax(0,1fr) 128px 86px 156px 74px;gap:0 16px;align-items:center}
.cols{padding:7px 0;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);background:var(--card);font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--mute)}
.cols span:nth-child(n+2){text-align:left}
.cols span:first-child{padding-left:4px}
.row{position:relative;padding:9px 0;border-bottom:1px solid var(--line)}
.row:hover{background:var(--card)}
.row h2{display:flex;align-items:center;gap:9px;margin:0;padding:0;border:0;font-size:19px;line-height:1.2;letter-spacing:-.015em}
.row .title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none}
.row .title::after{content:"";position:absolute;inset:0}
.row:hover .title{text-decoration:underline}
.sub{display:flex;gap:10px;margin:3px 0 0;font-size:13px;color:var(--mute);white-space:nowrap}
.sub>span:first-child{flex:none;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:11.5px;padding-top:1px}
.summary{min-width:0;overflow:hidden;text-overflow:ellipsis}
.won{position:relative;z-index:1;display:inline-flex;align-items:center;gap:6px;font-weight:700;color:var(--ink)}
.c{display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-width:0}
.c b{font-size:23px;line-height:1.1;letter-spacing:-.03em;font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}
.c .cash{padding:0 .16em}
.c small{font-size:11.5px;color:var(--mute);white-space:nowrap}
.tag{flex:none}

.columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,410px);gap:8px 38px;align-items:start}
.columns>*>h2:first-child{margin-top:18px}
.sum{font-size:16px}
.sum .cash{font-size:24px}
.rewards{margin:0;padding:0;list-style:none;border-top:3px solid var(--ink)}
.rewards li{display:grid;grid-template-columns:112px minmax(0,auto) 1fr;gap:0 14px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)}
.rewards span{font-size:14px;font-weight:800;color:var(--mute)}
.rewards b{font-size:19px}
.rewards small{font-size:12.5px;color:var(--mute)}
.dates{margin:0}
.dates>div{display:grid;grid-template-columns:132px minmax(0,1fr);gap:12px;padding:7px 0;border-bottom:1px solid var(--line)}
.dates dt{padding-top:2px;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--mute)}
.dates dd{margin:0}
.prose{max-width:72ch;overflow-wrap:anywhere}
.prose ul{margin:0 0 10px;padding-left:20px}
.prose li{margin-bottom:4px}
code{padding:1px 4px;background:#ebe5d4;font-size:.88em}
details{border:2px solid var(--ink);background:var(--card);padding:0 14px}
summary{padding:10px 0;font-weight:800;cursor:pointer}

input[type=search]{width:100%;max-width:340px;margin:18px 0 12px}
.standings{margin:0;padding:0;list-style:none;border-top:3px solid var(--ink)}
.standings li,.standings-head{display:grid;grid-template-columns:42px 28px minmax(0,1fr) minmax(0,1.5fr) minmax(74px,auto) minmax(78px,auto);gap:4px 10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}
.standings-head{padding:0 0 6px;border:0;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mute)}
.standings-head .entry{font-size:11px;color:var(--mute)}
.standings-head span:nth-child(2){grid-column:2/4}
.rank{font-size:19px;font-weight:900;text-align:center;font-variant-numeric:tabular-nums}
.podium .rank,.podium .place{background:var(--ink);color:var(--paper)}
.avatar{display:inline-grid;place-items:center;flex:none;width:28px;height:28px;border-radius:50%;overflow:hidden;background:var(--ink);color:var(--paper);font-size:13px;font-weight:800}
.avatar img{display:block;width:100%;height:100%;object-fit:cover}
.name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.who{font-weight:800}
.name small{margin-left:6px;color:var(--mute)}
.entry{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--mute)}
.score{font-weight:800;text-align:right;font-variant-numeric:tabular-nums}
.prize{justify-self:end;font-weight:900;font-variant-numeric:tabular-nums}
li .prize:not(:empty){background:var(--cash);padding:0 .25em}
aside .standings li{grid-template-columns:34px 28px minmax(0,1fr) auto minmax(64px,auto)}
aside .entry{grid-column:3/-1;grid-row:2;margin-top:-3px;font-size:13px}
aside .hd{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:0 12px;margin-top:18px;border-top:3px solid var(--ink)}
aside .hd h2{margin:0;border:0}
aside .hd .more{margin:0;padding:0;border:0;background:none;font-size:14px;text-decoration:underline}
aside .hd .more:hover{background:none;color:var(--clock)}
aside .standings li{padding:5px 0;gap:0 10px}
aside .standings-head{grid-template-columns:34px 28px minmax(0,1fr) auto minmax(64px,auto);padding:8px 0 5px;border-bottom:1px solid var(--ink)}
aside .standings{border-top:0}
aside .rank{font-size:17px}
aside h2+.note{margin-bottom:4px}

.id{display:flex;align-items:center;gap:22px;margin-bottom:8px}
.id .avatar{width:104px;height:104px;font-size:44px;border:3px solid var(--ink)}
.id h1{margin-bottom:4px}
.links{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0;font-weight:700}
.profile .figures{grid-template-columns:repeat(6,minmax(0,1fr))}
.results,.payouts{margin:0;padding:0;list-style:none;border-top:3px solid var(--ink)}
.results li{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.place{padding:4px 0;font-size:22px;font-weight:900;text-align:center;font-variant-numeric:tabular-nums}
.place.off{padding:6px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.results h3{margin:0;font-size:17px}
.results .title{text-decoration:none}
.results .title:hover,.row:hover .title{text-decoration:underline}
.results .entry{display:block}
.results small{color:var(--mute);font-size:12.5px}
.took{display:grid;justify-items:end;gap:3px}
.took .cash{font-size:20px}
.took .score{font-size:12.5px;font-weight:600;color:var(--mute)}
.payouts li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line);font-size:14px}
.payouts small{display:block;color:var(--mute);font-size:12.5px}
.payouts span b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

@media (max-width:900px){
.cols{display:none}
.row{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 12px;padding:14px 0}
.what{grid-column:1/-1}
.c::before{content:attr(data-l);font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.band,.side{justify-items:start}
.next{text-align:left}
.columns{grid-template-columns:minmax(0,1fr)}
.profile .figures{grid-template-columns:repeat(3,minmax(0,1fr))}
.profile .figures>div:nth-child(4){border-left:0}
.profile .figures>div:nth-child(n+4){border-top:1px solid var(--line)}
}
@media (max-width:600px){
.lead{font-size:17px}
.figures,.profile .figures{grid-template-columns:repeat(2,minmax(0,1fr))}
.row{grid-template-columns:repeat(2,minmax(0,1fr))}
.row{align-items:start}
.row .title{white-space:normal}
.sub{flex-wrap:wrap;gap:2px 10px;white-space:normal}
.summary{flex:1 1 100%;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.c b{font-size:21px}
.rewards li{grid-template-columns:96px minmax(0,auto) 1fr}
.figures>div:nth-child(odd){border-left:0}
.figures>div:nth-child(n+3){border-top:1px solid var(--line)}
.profile .figures>div:nth-child(4){border-left:1px solid var(--line)}
.standings li,.standings-head{grid-template-columns:34px 28px minmax(0,1fr) auto minmax(64px,auto)}
.standings-head .entry{display:none}
.standings .entry{grid-column:3/-1;grid-row:2;margin-top:-4px}
.id{align-items:flex-start;gap:14px}
.id .avatar{width:64px;height:64px;font-size:28px}
.results li{grid-template-columns:48px minmax(0,1fr)}
.took{grid-column:2;justify-items:start}
.dates>div{grid-template-columns:minmax(0,1fr);gap:0}
}
`;
