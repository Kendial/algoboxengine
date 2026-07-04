/* ════════════════════════════════════════════════════════════════
   AlgoBox™ Decision Engine — rules.js
   Logic layer: gating, bias computation, "Current Job" / "Next
   Thing to Watch" generation, setup detection. No DOM access here —
   this file is pure state-in, structured-data-out so it can be
   tested independently of the page.
   ════════════════════════════════════════════════════════════════ */

const ABX_STAGE_ORDER = ['tide','wave','macv','stalk','ripple'];

const ABX_REQUIRED = {
  tide:   ['loc','delta','flow'],
  wave:   ['structure','pullback','ropes'],
  macv:   ['hist','masher','nfz'],
  stalk:  ['loc'],
  ripple: []
};

function abxFreshState(){
  return {
    instrument: 'NQ',
    openStage: 'tide',
    tide:   { loc:null, delta:null, flow:null, obos:null },
    wave:   { structure:null, pullback:null, ropes:null },
    macv:   { hist:null, masher:null, nfz:null },
    stalk:  { loc:null, dd:null, pprz:null, smlk:null, htf:null },
    ripple: { enigma:null, ao:null, cross:null, audio:null }
  };
}

/* ── generic helpers ── */
function abxIsStageComplete(state, stage){
  return ABX_REQUIRED[stage].every(function(f){ return state[stage][f] !== null; });
}
function abxBiasFromTriad(a,b,c){
  var vals = [a,b,c].filter(function(v){ return v !== null; });
  if(vals.length === 0) return { bias:null, confidence:0, answered:0 };
  var bull = vals.filter(function(v){ return v==='bull'; }).length;
  var bear = vals.filter(function(v){ return v==='bear'; }).length;
  var bias;
  if(bull > bear) bias = 'bull'; else if(bear > bull) bias = 'bear'; else bias = 'neutral';
  var top = Math.max(bull, bear, vals.length-bull-bear);
  return { bias:bias, confidence: top/3, answered: vals.length };
}

/* ── per-stage computation ── */
function abxComputeTide(state){
  var r = abxBiasFromTriad(state.tide.loc, state.tide.delta, state.tide.flow);
  r.capped = false;
  if(state.tide.obos === 'yes' && r.bias && r.bias !== 'neutral'){
    r.confidence = Math.max(0, r.confidence - 0.2);
    r.capped = true;
  }
  return r;
}
function abxComputeWave(state){
  return abxBiasFromTriad(state.wave.structure, state.wave.pullback, state.wave.ropes);
}
function abxComputeMacv(state, tideBias){
  var hist = state.macv.hist, masher = state.macv.masher, nfz = state.macv.nfz;
  var histBias = null;
  if(hist==='strongbull'||hist==='modbull') histBias='bull';
  else if(hist==='strongbear'||hist==='modbear') histBias='bear';
  else if(hist==='neutral') histBias='neutral';

  var status;
  if(hist===null) status='unset';
  else if(nfz==='on') status='blocked';
  else if(tideBias && tideBias!=='neutral' && histBias!=='neutral' && histBias!==null && histBias!==tideBias) status='conflict';
  else if(histBias==='neutral') status='wait-hist';
  else if(masher===null || masher==='neutral') status='wait-masher';
  else if((masher==='bull' && histBias!=='bull') || (masher==='bear' && histBias!=='bear')) status='wait-masher';
  else if(nfz===null) status='wait-nfz';
  else status='clear';

  return { histBias:histBias, status:status };
}

/* Stalking (Ripple B) — checklist-style confidence, not a bias */
function abxComputeStalk(state){
  var loc = state.stalk.loc;
  var items = [
    { key:'loc',  done: !!loc },
    { key:'dd',   done: state.stalk.dd === 'yes' },
    { key:'pprz', done: state.stalk.pprz === 'yes' },
    { key:'smlk', done: !!state.stalk.smlk },
    { key:'htf',  done: state.stalk.htf === 'yes' }
  ];
  var doneCount = items.filter(function(i){ return i.done; }).length;
  return { located: !!loc, items:items, score: doneCount, total: items.length };
}

/* Setup detection — Structure (stalk) + RTOFA (ripple) → named setup */
function abxComputeSetup(state, dir){
  var loc = state.stalk.loc, r = state.ripple;
  if(!loc) return null;
  var hasCross = r.cross !== null, hasEnigma = r.enigma !== null, hasAO = r.ao !== null, hasAudio = r.audio === 'yes';
  var hasDD = state.stalk.dd === 'yes';

  if(loc==='fibdot' && hasCross) return 'Headshot';
  if(loc==='shark' && r.ao==='bluealpha') return 'Power Shark Tail';
  if(loc==='ddsr' && r.enigma==='blue') return 'High-Confluence Reversal';
  if(loc==='dcdm' && hasCross) return 'DCDM Continuation';
  if(loc==='king' && hasDD) return 'Delta King';
  if(loc==='harmonic' && (r.ao==='greenalpha'||r.ao==='bluealpha') && dir==='bull') return 'Bullish PRZ Trade';
  if(loc==='harmonic' && (r.ao==='redomega'||r.ao==='pinkomega') && dir==='bear') return 'Bearish PRZ Trade';
  if(hasCross || hasEnigma || hasAO || hasDD || hasAudio) return 'Confluence Setup';
  return null;
}

/* ── gating: is a stage unlocked for interaction? ── */
function abxStageLock(state){
  var tide = abxComputeTide(state);
  var wave = abxComputeWave(state);
  var macv = abxComputeMacv(state, tide.bias);
  var stalk = abxComputeStalk(state);
  return {
    tide:   { locked:false, reason:null },
    wave:   { locked: !abxIsStageComplete(state,'tide'), reason:'Complete Tide to unlock' },
    macv:   { locked: !abxIsStageComplete(state,'wave'), reason:'Complete Wave to unlock' },
    stalk:  { locked: macv.status !== 'clear', reason: macv.status==='unset' ? 'Complete MACV to unlock' : macv.status==='blocked' ? 'MACV is inside the No Fiddle Zone' : macv.status==='conflict' ? 'MACV conflicts with Tide/Wave' : 'Waiting on MACV confirmation' },
    ripple: { locked: !stalk.located, reason:'Find a stalking location to unlock' }
  };
}

/* ── "Current Job" / "Ignore" / "Watch" text per stage ── */
function abxJobFor(stage, state, derived){
  var tide = derived.tide, wave = derived.wave, macv = derived.macv, stalk = derived.stalk, setup = derived.setup;

  if(stage === 'tide'){
    return {
      job: 'Determine bias. Only decide whether buyers or sellers currently control the market.',
      ignore: ['Entries', 'Ripple signals', 'Headshot / DCDM setups', 'Stalking tools']
    };
  }
  if(stage === 'wave'){
    return {
      job: 'Confirm whether the trend still supports the Tide. Do not stalk yet.',
      ignore: ['Entries', 'Stalking tools', 'Execution triggers']
    };
  }
  if(stage === 'macv'){
    if(macv.status === 'clear') return { job:'Momentum agrees. Market is tradable. Proceed to stalking.', ignore:[] };
    if(macv.status === 'blocked') return { job:'No Fiddle Zone. No trade. Wait.', ignore:['Entries','Stalking','Execution'] };
    if(macv.status === 'conflict') return { job:'Momentum disagrees with the higher timeframe. Wait for alignment.', ignore:['Entries','Stalking','Execution'] };
    if(macv.status === 'wait-hist') return { job:'Histogram is neutral. Wait for it to commit to a direction.', ignore:['Entries','Stalking','Execution'] };
    if(macv.status === 'wait-masher') return { job:'Waiting for a Masher in the confirmed direction before this market is tradable.', ignore:['Entries','Stalking','Execution'] };
    return { job:'Finish answering the MACV checklist.', ignore:['Entries','Stalking','Execution'] };
  }
  if(stage === 'stalk'){
    var watch = [];
    if(!stalk.located) watch.push('A reaction location (FibDot, PRZ, DCDM, King Timing, DDSR)');
    if(state.stalk.dd !== 'yes') watch.push('Double Delta / Ready DD');
    if(state.stalk.pprz !== 'yes') watch.push('P-PRZ / Shark Back');
    if(!state.stalk.smlk) watch.push('An SMLK timing line');
    if(state.stalk.htf !== 'yes') watch.push('A higher-timeframe level being respected');
    return {
      job: stalk.located ? 'Now you may care about entries. Wait for your checklist. Nothing else matters.' : 'Hunt for a location. Nothing else matters until price gets there.',
      ignore: ['Trade outcome', 'P&L'],
      watch: watch
    };
  }
  if(stage === 'ripple'){
    if(setup) return { job:'Permission granted. Everything aligns. Execute.', ignore:[] };
    return { job:'Wait for a valid Ripple A trigger to complete the setup. Location alone is not enough.', ignore:['Trade outcome'] };
  }
  return { job:'', ignore:[] };
}

/* ── overall status badge + warnings + brain narration ── */
function abxOverallStatus(state){
  var tide = abxComputeTide(state);
  var wave = abxComputeWave(state);
  var macv = abxComputeMacv(state, tide.bias);
  var stalk = abxComputeStalk(state);
  var setup = abxComputeSetup(state, tide.bias);

  var badge = { tone:'idle', label:'NO BIAS YET', setup:'' };
  var warnings = [];
  var brain = [];

  if(!tide.bias){
    brain.push('I haven\'t formed a bias yet. Start with the Tide — is price above or below the Golden Ropes, and which way is Delta and FlowMaster leaning?');
  } else if(tide.bias === 'neutral'){
    badge = { tone:'idle', label:'TIDE NEUTRAL', setup:'' };
    brain.push('The Tide is mixed — no clean directional edge yet. I\'m not looking for anything until this resolves.');
  } else {
    var dir = tide.bias;
    var dirWord = dir==='bull' ? 'LONG' : 'SHORT';
    if(wave.answered < 1){
      badge = { tone:dir, label:'WATCHING ('+dirWord+' LEAN)', setup:'' };
      brain.push('The Tide is '+dir+'. I\'m looking for '+(dir==='bull'?'longs':'shorts')+' only. Let\'s see if the Wave agrees.');
    } else if(wave.bias !== dir && wave.bias !== 'neutral'){
      badge = { tone:'warn', label:'CONFLICT — WAIT', setup:'' };
      warnings.push('Tide and Wave disagree. This is not tradeable — wait for alignment.');
      brain.push('Tide says '+dir+', but the Wave says '+wave.bias+'. I do not trade against a conflicted higher timeframe.');
    } else {
      if(macv.status === 'unset'){
        badge = { tone:dir, label:'WATCHING ('+dirWord+' LEAN)', setup:'' };
        brain.push('Tide and Wave both lean '+dir+'. Momentum agrees. Now I check the MACV before doing anything else.');
      } else if(macv.status === 'blocked'){
        badge = { tone:'warn', label:'NO FIDDLE ZONE', setup:'' };
        warnings.push('Price is inside the No Fiddle Zone on the MACV. Doing nothing until it clears.');
        brain.push('Careful — the MACV is inside the No Fiddle Zone. I am doing nothing until it clears.');
      } else if(macv.status === 'conflict'){
        badge = { tone:'warn', label:'CONFLICT — WAIT', setup:'' };
        warnings.push('The MACV histogram disagrees with the Tide/Wave bias.');
        brain.push('The MACV histogram disagrees with my '+dir+' bias. I wait for the histogram to confirm.');
      } else if(macv.status === 'wait-hist'){
        badge = { tone:'idle', label:'MACV NEUTRAL', setup:'' };
        brain.push('The MACV histogram is neutral. I need it to confirm direction before I get interested.');
      } else if(macv.status === 'wait-masher'){
        badge = { tone:dir, label:'WAIT FOR MASHER', setup:'' };
        brain.push('Tide, Wave and MACV all agree '+dir+'. Now I become patient — not looking for entries yet. Waiting for a '+dir+' Masher.');
      } else if(macv.status === 'wait-nfz'){
        badge = { tone:dir, label:'CHECK NFZ STATUS', setup:'' };
        brain.push('Everything above agrees '+dir+' — I just need to confirm the No Fiddle Zone status before proceeding.');
      } else if(macv.status === 'clear'){
        if(!stalk.located){
          badge = { tone:dir, label:'HUNTING FOR LOCATION', setup:'' };
          warnings.push(dir==='bull' ? 'Do not buy breakouts — wait for price to return to a structure location.' : 'Do not short breakdowns — wait for price to return to a structure location.');
          brain.push('Good — the MACV confirms. Now I am hunting for a location. Nothing else matters until price gets there.');
        } else if(!setup){
          var rippleAnswered = [state.ripple.enigma,state.ripple.ao,state.ripple.cross,state.ripple.audio].filter(function(v){return v!==null}).length;
          badge = { tone:dir, label: rippleAnswered>0 ? 'BUILDING CONFLUENCE' : 'STALKING — AWAIT TRIGGER', setup:'' };
          brain.push(rippleAnswered>0
            ? 'I have some order-flow activity here, but it doesn\'t yet form one of my named setups. I want a cleaner trigger.'
            : 'Price has reached my location. Now I am waiting for a Ripple A trigger. Location alone is not enough.');
        } else {
          badge = { tone:'execute', label:'EXECUTE '+dirWord, setup:setup };
          brain.push(setup+' confirmed. Structure and RTOFA agree, and every stage above is aligned. This is where I execute.');
        }
      }
    }
  }
  if(tide.capped){ brain.push('Note: confidence is capped — there\'s an OBOS divergence against this bias.'); }

  return {
    tide:tide, wave:wave, macv:macv, stalk:stalk, setup:setup,
    badge:badge, warnings:warnings, brain:brain.join(' ')
  };
}

/* ── session clock lookup ── */
function abxGetSession(h,m){
  var mins = h*60+m;
  for(var i=0;i<ABX_SESSIONS.length;i++){
    var s = ABX_SESSIONS[i];
    var a = s[0]*60+s[1], b = s[2]*60+s[3];
    if(mins>=a && mins<b) return { label:s[4], tone:s[5] };
  }
  return { label:'—', tone:'idle' };
}
