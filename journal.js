/* ════════════════════════════════════════════════════════════════
   AlgoBox™ Decision Engine — journal.js
   Persistence layer: engine auto-save, trade journal, playbook.
   Uses localStorage with an in-memory fallback so the app never
   throws if storage is unavailable (private browsing, some file://
   configurations). Export/Import JSON is the reliable backup path.
   ════════════════════════════════════════════════════════════════ */

const ABX_STORE = (function(){
  var KEYS = { engine:'abx_engine_state_v1', journal:'abx_journal_v1', playbook:'abx_playbook_v1' };
  var memory = { engine:null, journal:[], playbook:[] };
  var storageOK = true;

  function testStorage(){
    try{
      var k = '__abx_test__';
      localStorage.setItem(k,'1');
      localStorage.removeItem(k);
      return true;
    }catch(e){ return false; }
  }
  storageOK = testStorage();

  function read(key, fallback){
    if(!storageOK) return memory[key] !== undefined ? memory[key] : fallback;
    try{
      var raw = localStorage.getItem(KEYS[key]);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function write(key, value){
    if(!storageOK){ memory[key] = value; return; }
    try{ localStorage.setItem(KEYS[key], JSON.stringify(value)); }
    catch(e){ storageOK = false; memory[key] = value; }
  }

  function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); }

  return {

    isPersistent: function(){ return storageOK; },

    /* ── engine auto-save ── */
    saveEngine: function(state){ write('engine', state); },
    loadEngine: function(){ return read('engine', null); },
    clearEngine: function(){ write('engine', null); },

    /* ── trade journal ── */
    listTrades: function(){ return read('journal', []); },
    addTrade: function(entry){
      var trades = read('journal', []);
      var record = Object.assign({
        id: uid(),
        loggedAt: new Date().toISOString(),
        instrument: 'NQ', direction:'', setup:'',
        entry:'', stop:'', target:'', result:'', notes:''
      }, entry);
      trades.unshift(record);
      write('journal', trades);
      return record;
    },
    updateTrade: function(id, patch){
      var trades = read('journal', []);
      trades = trades.map(function(t){ return t.id===id ? Object.assign({}, t, patch) : t; });
      write('journal', trades);
    },
    deleteTrade: function(id){
      var trades = read('journal', []).filter(function(t){ return t.id !== id; });
      write('journal', trades);
    },
    clearTrades: function(){ write('journal', []); },
    tradeStats: function(){
      var trades = read('journal', []);
      var total = trades.length;
      var wins = trades.filter(function(t){ return (t.result||'').toLowerCase()==='win'; }).length;
      var losses = trades.filter(function(t){ return (t.result||'').toLowerCase()==='loss'; }).length;
      var recorded = wins + losses;
      var bySetup = {};
      trades.forEach(function(t){
        var s = t.setup || 'Unlabeled';
        bySetup[s] = bySetup[s] || { total:0, wins:0 };
        bySetup[s].total++;
        if((t.result||'').toLowerCase()==='win') bySetup[s].wins++;
      });
      return { total:total, wins:wins, losses:losses, winRate: recorded ? Math.round((wins/recorded)*100) : null, bySetup:bySetup };
    },

    /* ── playbook ── */
    listPlaybooks: function(){ return read('playbook', []); },
    addPlaybook: function(entry){
      var books = read('playbook', []);
      var record = Object.assign({ id: uid(), savedAt: new Date().toISOString(), name:'Untitled Setup' }, entry);
      books.unshift(record);
      write('playbook', books);
      return record;
    },
    deletePlaybook: function(id){
      var books = read('playbook', []).filter(function(b){ return b.id !== id; });
      write('playbook', books);
    },

    /* ── export / import ── */
    exportAll: function(){
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        journal: read('journal', []),
        playbook: read('playbook', [])
      }, null, 2);
    },
    importAll: function(jsonString){
      var parsed;
      try{ parsed = JSON.parse(jsonString); }catch(e){ return { ok:false, error:'That file is not valid JSON.' }; }
      if(!parsed || (typeof parsed !== 'object')) return { ok:false, error:'Unexpected file format.' };
      if(Array.isArray(parsed.journal)) write('journal', parsed.journal);
      if(Array.isArray(parsed.playbook)) write('playbook', parsed.playbook);
      return { ok:true };
    }
  };
})();
