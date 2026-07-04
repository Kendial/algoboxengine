/* ════════════════════════════════════════════════════════════════
   AlgoBox™ Decision Engine — app.js
   View + controller layer: renders data.js content and rules.js
   logic to the DOM, wires all interaction via event delegation.
   ════════════════════════════════════════════════════════════════ */

var ABX = {
  state: (ABX_STORE.loadEngine()) || abxFreshState(),
  tab: 'engine'
};

/* ══════════════════════════════════════════════════════════
   DECLARATIVE STAGE FIELD DEFINITIONS
   Connects data.js option keys to state paths for generic rendering.
   ══════════════════════════════════════════════════════════ */
var STAGE_META = {
  tide:   { n:'1', name:'Tide',    sub:'89-range · overall market direction' },
  wave:   { n:'2', name:'Wave',    sub:'21–34 range · confirms the Tide' },
  macv:   { n:'3', name:'MACV',    sub:'momentum filter · is trading appropriate?' },
  stalk:  { n:'4', name:'Ripple B',sub:'stalking · higher-timeframe setups (the WHERE)' },
  ripple: { n:'5', name:'Ripple A',sub:'execution · precision trigger (the WHO)' }
};
var STAGE_FIELDS = {
  tide: [
    { grp:'Price vs Golden Ropes',              field:'loc',       opt:'tideLoc',   why:'tideLoc' },
    { grp:'Delta Flagging Pro bias',             field:'delta',     opt:'tideDelta', why:'tideDelta' },
    { grp:'FlowMaster tilt (Enigma / AO)',       field:'flow',      opt:'tideFlow',  why:'tideFlow' },
    { grp:'OBOS Divergence against this bias?',  field:'obos',      opt:'tideObos',  why:'tideObos', optional:true }
  ],
  wave: [
    { grp:'Price structure',      field:'structure', opt:'waveStruct', why:'waveStruct' },
    { grp:'Pullback quality',     field:'pullback',  opt:'wavePull',   why:'wavePull' },
    { grp:'Golden Ropes role',    field:'ropes',      opt:'waveRopes',  why:'waveRopes' }
  ],
  macv: [
    { grp:'MACV histogram',            field:'hist',   opt:'macvHist',   why:'macvHist' },
    { grp:'Masher',                    field:'masher', opt:'macvMasher', why:'macvMasher' },
    { grp:'No Fiddle Zone status',     field:'nfz',    opt:'macvNfz',    why:'macvNfz' }
  ],
  stalk: [
    { grp:'Reaction location (Structure — the WHERE)', field:'loc',  opt:'stalkLoc',  why:'stalkLoc' },
    { grp:'Double Delta / Ready DD',                    field:'dd',   opt:'stalkDD',   why:'stalkDD',   optional:true },
    { grp:'P-PRZ / Shark Back',                          field:'pprz', opt:'stalkPprz', why:'stalkPprz', optional:true },
    { grp:'SMLK Timing',                                 field:'smlk', opt:'stalkSmlk', why:'stalkSmlk', optional:true },
    { grp:'HTF Masher / Delta / FlowMaster level',       field:'htf',  opt:'stalkHtf',  why:'stalkHtf',  optional:true }
  ],
  ripple: [
    { grp:'FlowMaster Enigma', field:'enigma', opt:'ripEnigma', why:'ripEnigma', optional:true },
    { grp:'Alpha / Omega',     field:'ao',     opt:'ripAo',     why:'ripAo',     optional:true },
    { grp:'FlowMaster Cross',  field:'cross',  opt:'ripCross',  why:'ripCross',  optional:true },
    { grp:'AudioBox',          field:'audio',  opt:'ripAudio',  why:'ripAudio',  optional:true }
  ]
};

/* ══════════════════════════════════════════════════════════
   RENDER HELPERS
   ══════════════════════════════════════════════════════════ */
function pillsFor(stage, field, optKey, current, disabled){
  var map = ABX_OPTIONS[optKey];
  return Object.keys(map).map(function(v){
    var l = map[v][0], tone = map[v][1];
    var active = current === v ? 'active' : '';
    var dis = disabled ? 'disabled' : '';
    return '<button class="pill t-'+tone+' '+active+'" '+dis+' data-stage="'+stage+'" data-field="'+field+'" data-value="'+v+'">'+l+'</button>';
  }).join('');
}
function whyBtn(key){
  return key ? ' <button class="whybtn" data-why="'+key+'" type="button">?</button>' : '';
}
function renderWhyList(fields, stageState){
  var rows = fields.map(function(f){
    var v = stageState[f.field];
    if(v === null || v === undefined) return null;
    var map = ABX_OPTIONS[f.opt];
    if(!map[v]) return null;
    var l = map[v][0], tone = map[v][1];
    var icon = (tone==='bad'||tone==='strongbad') ? '✗' : (tone==='neutral') ? '•' : '✓';
    return '<div class="why t-'+tone+'"><span class="wi">'+icon+'</span>'+l+'</div>';
  }).filter(Boolean);
  return rows.length ? rows.join('') : '<div class="why-empty">No inputs yet — make a selection above.</div>';
}
function renderJobPanel(job){
  var ignoreHtml = (job.ignore && job.ignore.length) ? '<div class="ignore-row"><span class="ig-lbl">Ignore:</span>'+job.ignore.map(function(i){return '<span class="ig-chip">'+i+'</span>';}).join('')+'</div>' : '';
  var watchHtml = '';
  if(job.watch && job.watch.length){
    watchHtml = '<div class="watch-list"><div class="watch-h">Next thing to watch</div>'+job.watch.map(function(w){
      return '<div class="watch-item"><span class="wc">□</span>'+w+'</div>';
    }).join('')+'</div>';
  }
  return '<div class="jobpanel"><div class="job-h">Current Job</div><div class="job-txt">'+job.job+'</div>'+ignoreHtml+watchHtml+'</div>';
}
function toneClass(t){ return 't-'+t; }

/* ══════════════════════════════════════════════════════════
   RAIL + COACH
   ══════════════════════════════════════════════════════════ */
function renderRail(d, locks){
  var defs = [
    { id:'tide', name:'Tide', pct: Math.round((ABX_REQUIRED.tide.filter(function(f){return ABX.state.tide[f]!==null}).length/3)*100),
      color: d.tide.bias==='bull'?'var(--good)':d.tide.bias==='bear'?'var(--bad)':d.tide.bias==='neutral'?'var(--neutral)':'var(--line)' },
    { id:'wave', name:'Wave', pct: Math.round((ABX_REQUIRED.wave.filter(function(f){return ABX.state.wave[f]!==null}).length/3)*100),
      color: d.wave.bias==='bull'?'var(--good)':d.wave.bias==='bear'?'var(--bad)':d.wave.bias==='neutral'?'var(--neutral)':'var(--line)' },
    { id:'macv', name:'MACV', pct: Math.round((ABX_REQUIRED.macv.filter(function(f){return ABX.state.macv[f]!==null}).length/3)*100),
      color: d.macv.status==='clear'?'var(--good)':(d.macv.status==='blocked'||d.macv.status==='conflict')?'var(--bad)':d.macv.status==='unset'?'var(--line)':'var(--warn)' },
    { id:'stalk', name:'Ripple B', pct: Math.round((d.stalk.score/d.stalk.total)*100), color: d.stalk.located?'var(--strong)':'var(--line)' },
    { id:'ripple', name:'Ripple A', pct: d.setup ? 100 : (ABX.state.ripple.enigma||ABX.state.ripple.ao||ABX.state.ripple.cross||ABX.state.ripple.audio) ? 50 : 0, color: d.setup?'var(--gold)':'var(--line)' }
  ];
  return defs.map(function(x){
    var openCls = ABX.state.openStage===x.id ? 'open' : '';
    var lockCls = locks[x.id].locked ? 'locked' : '';
    return '<div class="rail-seg '+openCls+' '+lockCls+'" data-toggle-stage="'+x.id+'">'+
      '<div class="rail-lbl"><span>'+x.name+'</span><span class="pc">'+x.pct+'%</span></div>'+
      '<div class="rail-bar"><div class="rail-fill" style="width:'+x.pct+'%;background:'+x.color+'"></div></div>'+
    '</div>';
  }).join('');
}
function renderCoach(d){
  var badgeCls = { idle:'st-idle', bull:'st-bull', bear:'st-bear', warn:'st-warn', execute:'st-execute' }[d.badge.tone];
  var badgeHtml = '<div class="statusbadge '+badgeCls+'"><div class="lbl">'+d.badge.label+'</div>'+(d.badge.setup?'<div class="setup">'+d.badge.setup+'</div>':'')+'</div>';
  var brainHtml = '<div class="brain"><span class="bi">🧠</span><div class="bt">'+d.brain+'</div></div>';
  var warnHtml = d.warnings.length ? '<div class="warnbox"><span class="wi">⚠</span><span>'+d.warnings.join(' ')+'</span></div>' : '';
  return brainHtml + warnHtml + badgeHtml;
}

/* ══════════════════════════════════════════════════════════
   STAGE CARD (generic, staircase-locked)
   ══════════════════════════════════════════════════════════ */
function stageStatusChip(tone, label){
  return '<span class="stage-status '+toneClass(tone)+'"><span class="dot '+toneClass(tone)+'"></span>'+label+'</span>';
}
function stageToneAndLabel(id, d){
  if(id==='tide'){
    var t = d.tide.bias;
    return [t==='bull'?'good':t==='bear'?'bad':t==='neutral'?'neutral':'idle', t==='bull'?'Bullish':t==='bear'?'Bearish':t==='neutral'?'Neutral':'—'];
  }
  if(id==='wave'){
    var w = d.wave.bias;
    var lbl = w==='bull'?'Bullish':w==='bear'?'Bearish':w==='neutral'?'Neutral':'—';
    if(w && d.tide.bias && w!==d.tide.bias && w!=='neutral' && d.tide.bias!=='neutral') lbl += ' ⚠';
    return [w==='bull'?'good':w==='bear'?'bad':w==='neutral'?'neutral':'idle', lbl];
  }
  if(id==='macv'){
    var toneMap = { unset:'idle', blocked:'bad', conflict:'bad', 'wait-hist':'neutral', 'wait-masher':'warn', 'wait-nfz':'warn', clear:'good' };
    var labelMap = { unset:'—', blocked:'NFZ Blocked', conflict:'Conflict', 'wait-hist':'Neutral', 'wait-masher':'Wait: Masher', 'wait-nfz':'Wait: NFZ', clear:'Clear — Proceed' };
    return [toneMap[d.macv.status], labelMap[d.macv.status]];
  }
  if(id==='stalk'){
    return [d.stalk.located ? 'strong' : 'idle', d.stalk.located ? (d.stalk.score+' / '+d.stalk.total+' checked') : 'Searching…'];
  }
  if(id==='ripple'){
    var rc = [ABX.state.ripple.enigma,ABX.state.ripple.ao,ABX.state.ripple.cross,ABX.state.ripple.audio].filter(function(v){return v!==null}).length;
    return [d.setup ? 'gold' : rc>0 ? 'warn' : 'idle', d.setup ? d.setup : rc>0 ? rc+' signal(s)' : 'Waiting…'];
  }
  return ['idle','—'];
}

function renderStage(id, d, locks){
  var el = document.getElementById('stage-'+id);
  var meta = STAGE_META[id];
  var lock = locks[id];
  var isOpen = ABX.state.openStage === id && !lock.locked;
  el.className = 'stage' + (isOpen ? ' open' : '') + (lock.locked ? ' is-locked' : '');

  var ta = stageToneAndLabel(id, d);
  var statusHtml = lock.locked
    ? '<span class="stage-status t-locked"><span class="lockdot">🔒</span>Locked</span>'
    : stageStatusChip(ta[0], ta[1]);

  var fields = STAGE_FIELDS[id];
  var job = abxJobFor(id, ABX.state, d);
  var jobHtml = renderJobPanel(job);

  var groups = fields.map(function(f){
    var optTag = f.optional ? ' <span class="opt-tag">optional</span>' : '';
    return '<div class="grp"><div class="grp-h">'+f.grp+optTag+whyBtn(f.why)+'</div><div class="pills">'+pillsFor(id, f.field, f.opt, ABX.state[id][f.field], lock.locked)+'</div></div>';
  }).join('');

  var whyListHtml = '<div class="why-wrap"><div class="why-h">Why</div>'+renderWhyList(fields, ABX.state[id])+'</div>';

  var setupChip = (id==='ripple' && d.setup) ? '<div class="setupchip">✓ '+d.setup+'</div>' : '';
  var actions = (id==='ripple' && d.setup) ?
    '<div class="stage-actions">'+
      '<button class="actbtn gold" data-action="log-trade">📓 Log This Trade</button>'+
      '<button class="actbtn" data-action="save-playbook">📚 Save to Playbook</button>'+
    '</div>' : '';

  var lockNote = lock.locked ? '<div class="lockmsg"><span class="lockicon">🔒</span>'+lock.reason+'</div>' : '';

  var body = lock.locked ? lockNote : (jobHtml + groups + whyListHtml + setupChip + actions);

  el.innerHTML =
    '<div class="stage-head" data-toggle-stage="'+id+'">'+
      '<span class="stage-node '+(lock.locked?'node-locked':isOpen||abxIsStageComplete(ABX.state,id)?'node-done':'node-active')+'">'+(lock.locked?'🔒':abxIsStageComplete(ABX.state,id)?'✓':meta.n)+'</span>'+
      '<div class="stage-titles"><div class="stage-name">'+meta.name+'</div><div class="stage-sub">'+meta.sub+'</div></div>'+
      statusHtml+
      '<span class="chev">▶</span>'+
    '</div>'+
    '<div class="stage-body"><div class="stage-inner">'+body+'</div></div>';
}

/* ══════════════════════════════════════════════════════════
   ENGINE TAB
   ══════════════════════════════════════════════════════════ */
function renderEngine(){
  var d = abxOverallStatus(ABX.state);
  var locks = abxStageLock(ABX.state);

  document.getElementById('rail').innerHTML = renderRail(d, locks);
  document.getElementById('coach').innerHTML = renderCoach(d);

  ABX_STAGE_ORDER.forEach(function(id){ renderStage(id, d, locks); });

  var instrBtns = document.querySelectorAll('#instrBox button');
  instrBtns.forEach(function(b){ b.classList.toggle('active', b.dataset.instrument === ABX.state.instrument); });

  ABX_STORE.saveEngine(ABX.state);
}

/* ══════════════════════════════════════════════════════════
   JOURNAL TAB
   ══════════════════════════════════════════════════════════ */
function renderJournal(){
  var trades = ABX_STORE.listTrades();
  var stats = ABX_STORE.tradeStats();
  var el = document.getElementById('tab-journal');

  var statsHtml =
    '<div class="statrow">'+
      '<div class="stat"><div class="stat-v">'+stats.total+'</div><div class="stat-l">Logged</div></div>'+
      '<div class="stat"><div class="stat-v">'+(stats.winRate===null?'—':stats.winRate+'%') +'</div><div class="stat-l">Win rate</div></div>'+
      '<div class="stat"><div class="stat-v">'+stats.wins+'</div><div class="stat-l">Wins</div></div>'+
      '<div class="stat"><div class="stat-v">'+stats.losses+'</div><div class="stat-l">Losses</div></div>'+
    '</div>';

  var toolbar =
    '<div class="toolbar">'+
      '<button class="actbtn" data-action="export-data">⬇ Export JSON</button>'+
      '<label class="actbtn filebtn">⬆ Import JSON<input type="file" id="importFile" accept="application/json" style="display:none"></label>'+
      (trades.length ? '<button class="actbtn danger" data-action="clear-trades">🗑 Clear All</button>' : '')+
    '</div>';

  var list = trades.length ? trades.map(function(t){
    return '<div class="tradecard">'+
      '<div class="tc-head">'+
        '<span class="tc-dir '+(t.direction==='bull'?'t-good':t.direction==='bear'?'t-bad':'t-neutral')+'">'+(t.direction==='bull'?'LONG':t.direction==='bear'?'SHORT':'—')+'</span>'+
        '<span class="tc-instr">'+t.instrument+'</span>'+
        '<span class="tc-setup">'+(t.setup||'—')+'</span>'+
        '<span class="tc-date">'+new Date(t.loggedAt).toLocaleString()+'</span>'+
        '<button class="tc-del" data-action="delete-trade" data-id="'+t.id+'">✕</button>'+
      '</div>'+
      '<div class="tc-grid">'+
        '<label>Entry<input data-trade-id="'+t.id+'" data-trade-field="entry" value="'+(t.entry||'')+'"></label>'+
        '<label>Stop<input data-trade-id="'+t.id+'" data-trade-field="stop" value="'+(t.stop||'')+'"></label>'+
        '<label>Target<input data-trade-id="'+t.id+'" data-trade-field="target" value="'+(t.target||'')+'"></label>'+
        '<label>Result<select data-trade-id="'+t.id+'" data-trade-field="result">'+
          ['','Win','Loss','Breakeven','Open'].map(function(o){ return '<option '+(t.result===o?'selected':'')+'>'+ (o||'—') +'</option>'; }).join('')+
        '</select></label>'+
      '</div>'+
      '<label class="tc-notes">Notes<textarea data-trade-id="'+t.id+'" data-trade-field="notes" rows="2">'+(t.notes||'')+'</textarea></label>'+
    '</div>';
  }).join('') : '<div class="empty">No trades logged yet. Reach EXECUTE in the Engine tab and click "Log This Trade."</div>';

  el.innerHTML = '<h2 class="tabtitle">Trade Journal</h2>' + statsHtml + toolbar + '<div class="tradelist">'+list+'</div>';
}

/* ══════════════════════════════════════════════════════════
   PLAYBOOK TAB
   ══════════════════════════════════════════════════════════ */
function renderPlaybook(){
  var books = ABX_STORE.listPlaybooks();
  var el = document.getElementById('tab-playbook');
  var list = books.length ? books.map(function(b){
    var s = b.snapshot || {};
    var lines = [];
    if(s.tide) lines.push('Tide: '+[s.tide.loc,s.tide.delta,s.tide.flow].filter(Boolean).join(' / '));
    if(s.stalk && s.stalk.loc) lines.push('Location: '+s.stalk.loc);
    return '<div class="bookcard">'+
      '<div class="bc-head"><span class="bc-name">'+b.name+'</span><span class="bc-dir '+(b.direction==='bull'?'t-good':'t-bad')+'">'+(b.direction==='bull'?'LONG':'SHORT')+'</span>'+
      '<button class="tc-del" data-action="delete-playbook" data-id="'+b.id+'">✕</button></div>'+
      '<div class="bc-setup">'+b.setup+'</div>'+
      '<div class="bc-meta">'+new Date(b.savedAt).toLocaleDateString()+' · '+b.instrument+'</div>'+
      (b.notes ? '<div class="bc-notes">'+b.notes+'</div>' : '')+
    '</div>';
  }).join('') : '<div class="empty">No playbooks saved yet. Reach EXECUTE in the Engine tab and click "Save to Playbook."</div>';
  el.innerHTML = '<h2 class="tabtitle">Playbook</h2><div class="booklist">'+list+'</div>';
}

/* ══════════════════════════════════════════════════════════
   REPORT TAB
   ══════════════════════════════════════════════════════════ */
function renderReport(){
  var d = abxOverallStatus(ABX.state);
  var el = document.getElementById('tab-report');
  function line(label, val){ return '<div class="rp-row"><span class="rp-l">'+label+'</span><span class="rp-v">'+(val||'—')+'</span></div>'; }
  function stageBlock(id){
    var meta = STAGE_META[id];
    var fields = STAGE_FIELDS[id];
    var rows = fields.map(function(f){
      var v = ABX.state[id][f.field];
      var l = v && ABX_OPTIONS[f.opt][v] ? ABX_OPTIONS[f.opt][v][0] : '—';
      return line(f.grp, l);
    }).join('');
    return '<div class="rp-block"><div class="rp-h">'+meta.n+'. '+meta.name+'</div>'+rows+'</div>';
  }
  var html =
    '<div class="report">'+
      '<div class="rp-title">AlgoBox™ Decision Engine — Session Report</div>'+
      '<div class="rp-sub">Generated '+new Date().toLocaleString()+' · Instrument: '+ABX.state.instrument+'</div>'+
      '<div class="rp-verdict '+d.badge.tone+'">'+d.badge.label+(d.badge.setup?' — '+d.badge.setup:'')+'</div>'+
      ABX_STAGE_ORDER.map(stageBlock).join('')+
      '<div class="rp-foot">Trade = Structure + RTOFA · docs.algoboxpro.com · Educational tool only — trading involves risk.</div>'+
    '</div>'+
    '<button class="actbtn gold no-print" id="printBtn">🖨 Print / Save PDF</button>';
  el.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════
   TABS
   ══════════════════════════════════════════════════════════ */
function renderTabs(){
  document.querySelectorAll('.tabbtn').forEach(function(b){ b.classList.toggle('active', b.dataset.tab===ABX.tab); });
  document.querySelectorAll('.tabpage').forEach(function(p){ p.classList.toggle('active', p.id==='tab-'+ABX.tab); });
  document.getElementById('stickyZone').style.display = ABX.tab==='engine' ? '' : 'none';
}

/* ══════════════════════════════════════════════════════════
   MODAL + TOAST
   ══════════════════════════════════════════════════════════ */
function openModal(html){
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalBg').classList.add('open');
}
function closeModal(){ document.getElementById('modalBg').classList.remove('open'); }
function showToast(msg){
  var t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.getElementById('toastZone').appendChild(t);
  setTimeout(function(){ t.classList.add('show'); }, 10);
  setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); }, 300); }, 2400);
}

/* ══════════════════════════════════════════════════════════
   MASTER RENDER
   ══════════════════════════════════════════════════════════ */
function render(){
  renderTabs();
  if(ABX.tab === 'engine') renderEngine();
  if(ABX.tab === 'journal') renderJournal();
  if(ABX.tab === 'playbook') renderPlaybook();
  if(ABX.tab === 'report') renderReport();
}

/* ══════════════════════════════════════════════════════════
   ACTIONS
   ══════════════════════════════════════════════════════════ */
function advanceStage(stage){
  var idx = ABX_STAGE_ORDER.indexOf(stage);
  if(idx >= 0 && idx < ABX_STAGE_ORDER.length-1){ ABX.state.openStage = ABX_STAGE_ORDER[idx+1]; }
}
function doLogTrade(){
  var d = abxOverallStatus(ABX.state);
  if(!d.setup) return;
  openModal(
    '<div class="modal-h">Log This Trade</div>'+
    '<div class="modal-sub">'+ABX.state.instrument+' · '+(d.tide.bias==='bull'?'LONG':'SHORT')+' · '+d.setup+'</div>'+
    '<label class="mf">Entry price<input id="mfEntry" placeholder="e.g. 19850.25"></label>'+
    '<label class="mf">Stop<input id="mfStop" placeholder="e.g. 19835.00"></label>'+
    '<label class="mf">Target<input id="mfTarget" placeholder="e.g. 19890.00"></label>'+
    '<label class="mf">Notes<textarea id="mfNotes" rows="3" placeholder="Optional context"></textarea></label>'+
    '<div class="modal-actions"><button class="actbtn" data-modal-close>Cancel</button><button class="actbtn gold" id="confirmLog">Save to Journal</button></div>'
  );
  document.getElementById('confirmLog').addEventListener('click', function(){
    ABX_STORE.addTrade({
      instrument: ABX.state.instrument,
      direction: d.tide.bias,
      setup: d.setup,
      entry: document.getElementById('mfEntry').value,
      stop: document.getElementById('mfStop').value,
      target: document.getElementById('mfTarget').value,
      notes: document.getElementById('mfNotes').value
    });
    closeModal();
    showToast('✓ Logged to Journal');
  });
}
function doSavePlaybook(){
  var d = abxOverallStatus(ABX.state);
  if(!d.setup) return;
  openModal(
    '<div class="modal-h">Save to Playbook</div>'+
    '<div class="modal-sub">'+ABX.state.instrument+' · '+(d.tide.bias==='bull'?'LONG':'SHORT')+' · '+d.setup+'</div>'+
    '<label class="mf">Name<input id="mfName" placeholder="e.g. NQ AM Headshot Long"></label>'+
    '<label class="mf">Notes<textarea id="mfPbNotes" rows="3" placeholder="What made this setup clean?"></textarea></label>'+
    '<div class="modal-actions"><button class="actbtn" data-modal-close>Cancel</button><button class="actbtn gold" id="confirmBook">Save</button></div>'
  );
  document.getElementById('confirmBook').addEventListener('click', function(){
    ABX_STORE.addPlaybook({
      name: document.getElementById('mfName').value || 'Untitled Setup',
      instrument: ABX.state.instrument,
      direction: d.tide.bias,
      setup: d.setup,
      notes: document.getElementById('mfPbNotes').value,
      snapshot: JSON.parse(JSON.stringify(ABX.state))
    });
    closeModal();
    showToast('✓ Saved to Playbook');
    render();
  });
}

/* ══════════════════════════════════════════════════════════
   SESSION CLOCK
   ══════════════════════════════════════════════════════════ */
function tick(){
  var now = new Date();
  var est, eat;
  try{
    est = new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
    eat = new Intl.DateTimeFormat('en-US',{timeZone:'Indian/Antananarivo',hour12:false,hour:'2-digit',minute:'2-digit'}).format(now);
  }catch(e){ est='--:--:--'; eat='--:--'; }
  document.getElementById('clockEST').textContent = 'EST '+est;
  document.getElementById('clockEAT').textContent = 'EAT '+eat;
  var parts = est.split(':').map(Number);
  var sess = abxGetSession(parts[0]||0, parts[1]||0);
  var badge = document.getElementById('sessBadge');
  badge.textContent = sess.label;
  badge.className = 'sessbadge tone-'+sess.tone;
}

/* ══════════════════════════════════════════════════════════
   EVENTS
   ══════════════════════════════════════════════════════════ */
document.addEventListener('click', function(e){

  /* option pill */
  var pill = e.target.closest('[data-field]');
  if(pill && !pill.disabled){
    var stage = pill.dataset.stage, field = pill.dataset.field, value = pill.dataset.value;
    var before = abxIsStageComplete(ABX.state, stage);
    ABX.state[stage][field] = (ABX.state[stage][field] === value) ? null : value;
    var after = abxIsStageComplete(ABX.state, stage);
    if(!before && after) advanceStage(stage);
    render();
    return;
  }

  /* stage header / rail toggle (respects lock) */
  var head = e.target.closest('[data-toggle-stage]');
  if(head){
    var s = head.dataset.toggleStage;
    var locks = abxStageLock(ABX.state);
    if(locks[s].locked){ showToast('🔒 '+locks[s].reason); return; }
    ABX.state.openStage = (ABX.state.openStage === s) ? null : s;
    render();
    return;
  }

  /* why button */
  var why = e.target.closest('[data-why]');
  if(why){
    var w = ABX_WHY[why.dataset.why];
    if(w){
      openModal('<div class="modal-h">'+w.title+'</div><div class="modal-body-text">'+w.body+'</div><div class="modal-src">Source: '+w.source+'</div><div class="modal-actions"><button class="actbtn gold" data-modal-close>Got it</button></div>');
    }
    return;
  }

  /* tabs */
  var tabBtn = e.target.closest('.tabbtn');
  if(tabBtn){ ABX.tab = tabBtn.dataset.tab; render(); return; }

  /* reset */
  if(e.target.closest('#resetBtn')){
    if(confirm('Reset the current session? This clears all Tide/Wave/MACV/Stalking/Ripple selections (your Journal and Playbook are not affected).')){
      ABX.state = abxFreshState();
      ABX_STORE.clearEngine();
      render();
      showToast('Session reset');
    }
    return;
  }

  /* instrument */
  var instr = e.target.closest('[data-instrument]');
  if(instr){ ABX.state.instrument = instr.dataset.instrument; render(); return; }

  /* generic actions */
  var act = e.target.closest('[data-action]');
  if(act){
    var a = act.dataset.action;
    if(a === 'log-trade') doLogTrade();
    if(a === 'save-playbook') doSavePlaybook();
    if(a === 'delete-trade'){ if(confirm('Delete this journal entry?')){ ABX_STORE.deleteTrade(act.dataset.id); render(); } }
    if(a === 'delete-playbook'){ if(confirm('Delete this playbook entry?')){ ABX_STORE.deletePlaybook(act.dataset.id); render(); } }
    if(a === 'clear-trades'){ if(confirm('Delete ALL journal entries? This cannot be undone.')){ ABX_STORE.clearTrades(); render(); } }
    if(a === 'export-data'){
      var blob = new Blob([ABX_STORE.exportAll()], {type:'application/json'});
      var url = URL.createObjectURL(blob);
      var a2 = document.createElement('a');
      a2.href = url; a2.download = 'algobox-journal-export.json';
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      URL.revokeObjectURL(url);
      showToast('Exported');
    }
    return;
  }

  /* modal close */
  if(e.target.closest('[data-modal-close]') || e.target.id === 'modalBg'){ closeModal(); return; }

  /* print */
  if(e.target.closest('#printBtn')){ window.print(); return; }
});

/* journal inline field edits */
document.addEventListener('change', function(e){
  var f = e.target.closest('[data-trade-field]');
  if(f){
    var patch = {}; patch[f.dataset.tradeField] = f.value;
    ABX_STORE.updateTrade(f.dataset.tradeId, patch);
    if(f.dataset.tradeField === 'result') render();
  }
  var imp = e.target.closest('#importFile');
  if(imp && imp.files && imp.files[0]){
    var reader = new FileReader();
    reader.onload = function(ev){
      var res = ABX_STORE.importAll(ev.target.result);
      showToast(res.ok ? '✓ Imported' : res.error);
      render();
    };
    reader.readAsText(imp.files[0]);
  }
});
document.addEventListener('input', function(e){
  var f = e.target.closest('textarea[data-trade-field], input[data-trade-field]');
  if(f){
    var patch = {}; patch[f.dataset.tradeField] = f.value;
    ABX_STORE.updateTrade(f.dataset.tradeId, patch);
  }
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') closeModal();
});

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
tick();
setInterval(tick, 1000);
render();
