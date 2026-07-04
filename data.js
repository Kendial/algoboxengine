/* ════════════════════════════════════════════════════════════════
   AlgoBox™ Decision Engine — data.js
   Content layer: field options, labels, tones, and "Why?" explanations.
   Plain JS globals (no ES modules) so the app works when opened
   directly from disk (file://) with no local server required.
   Source: docs.algoboxpro.com — verified against official documentation.
   ════════════════════════════════════════════════════════════════ */

/* Every option map: { value: [label, tone] }
   tone ∈ good | bad | neutral | strong | strongbad | idle           */

const ABX_OPTIONS = {

  /* ── TIDE ── */
  tideLoc:   { bull:['Price above the Golden Ropes','good'], neutral:['Price inside the Rivers of Life','neutral'], bear:['Price below the Golden Ropes','bad'] },
  tideDelta: { bull:['Bullish Delta pressure','good'], neutral:['Delta balanced','neutral'], bear:['Bearish Delta pressure','bad'] },
  tideFlow:  { bull:['Bullish FlowMaster tilt','good'], neutral:['FlowMaster mixed','neutral'], bear:['Bearish FlowMaster tilt','bad'] },
  tideObos:  { yes:['OBOS Divergence present','bad'], no:['No OBOS divergence','good'] },

  /* ── WAVE ── */
  waveStruct: { bull:['Higher-highs / higher-lows','good'], neutral:['Choppy — no clear structure','neutral'], bear:['Lower-highs / lower-lows','bad'] },
  wavePull:   { bull:['Healthy pullback','good'], neutral:['No pullback yet','neutral'], bear:['Sloppy / unhealthy pullback','bad'] },
  waveRopes:  { bull:['Ropes supporting the move','good'], neutral:['Ropes flat / unclear','neutral'], bear:['Ropes broken','bad'] },

  /* ── MACV ── */
  macvHist:   { strongbull:['Strong Buy','strong'], modbull:['Moderate Buy','good'], neutral:['Neutral','neutral'], modbear:['Moderate Sell','bad'], strongbear:['Strong Sell','strongbad'] },
  macvMasher: { bull:['Bullish Masher present','good'], neutral:['No Masher yet','neutral'], bear:['Bearish Masher present','bad'] },
  macvNfz:    { on:['Inside the No Fiddle Zone','bad'], off:['Clear of the No Fiddle Zone','good'] },

  /* ── RIPPLE B (stalking / waiting phase) ── */
  stalkLoc:   { fibdot:['FibDot reaction','strong'], harmonic:['Harmonic PRZ','strong'], shark:['Shark PRZ','strong'], dcdm:['DCDM level','strong'], king:['King Timing line','strong'], ddsr:['DDSR @ TCR extreme','strong'] },
  stalkDD:    { yes:['Double Delta / Ready DD present','strong'] },
  stalkPprz:  { yes:['P-PRZ / Shark Back present','strong'] },
  stalkSmlk:  { king:['King Timing Line','strong'], large:['Large Timing Line','strong'], medium:['Medium Timing Line','neutral'], small:['Small Timing Line','neutral'] },
  stalkHtf:   { yes:['HTF Masher / Delta / FlowMaster level respected','strong'] },

  /* ── RIPPLE A (execution / precision trigger) ── */
  ripEnigma: { green:['Green Enigma','good'], blue:['Blue Enigma','strong'], red:['Red Enigma','bad'], pink:['Pink Enigma','strongbad'] },
  ripAo:     { greenalpha:['Green Alpha','good'], bluealpha:['Blue Alpha','strong'], redomega:['Red Omega','bad'], pinkomega:['Pink Omega','strongbad'] },
  ripCross:  { white:['White Cross','strong'], supply:['Supply-colored Cross','strongbad'] },
  ripAudio:  { yes:['AudioBox confirms','strong'] }
};

/* ── "Why?" explanations, keyed the same as ABX_OPTIONS groups ──
   Each: { title, body, source }                                    */

const ABX_WHY = {

  tideLoc: {
    title: 'Golden Ropes — the Tide-level trend filter',
    body: 'The Golden Ropes are the EMA 50 (fast) and EMA 200 (slow) plotted together. Price above both = long bias. Price below both = short bias. Price sandwiched between them is the "Rivers of Life" — a chop zone where the two averages have not resolved a direction, and AlgoBox treats it as a No Fiddle Zone at the Tide level. This is the very first read of every session, before any signal or entry tool is considered.',
    source: 'docs.algoboxpro.com/fundamentals/golden-ropes'
  },
  tideDelta: {
    title: 'Delta Flagging Pro — order-flow pressure',
    body: 'Delta Flagging Pro measures the imbalance between aggressive buyers and sellers. A flag of 1,000+ contracts in one direction is read as institutional participation. At the Tide level you are not trading this flag directly — you are using it as one vote toward which side currently controls the market.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-delta-flagging-pro'
  },
  tideFlow: {
    title: 'FlowMaster tilt — Enigma / Alpha-Omega bias on Tide',
    body: 'Looking at the general color tilt of Enigma and Alpha/Omega signals on the Tide chart (not a single signal, the overall pattern) gives a third independent vote on direction. Three independent reads — location, Delta, FlowMaster — agreeing is what defines a clean Tide bias.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-enigma'
  },
  tideObos: {
    title: 'OBOS Divergence — a confidence dampener',
    body: 'The Ultimate OBOS Divergence tool flags when price makes a new high/low but the oscillator does not confirm it — a warning that the current move may be exhausted. It is not a reversal signal by itself, but if it is present against your Tide bias, treat your confidence as capped until it clears.',
    source: 'docs.algoboxpro.com/fundamentals/ultimate-obos-divergence'
  },

  waveStruct: {
    title: 'Wave structure — does price confirm the Tide?',
    body: 'The Wave (21–34 range) is the confirmation layer directly beneath the Tide. Higher-highs/higher-lows support a bullish Tide; lower-highs/lower-lows support a bearish Tide. A choppy Wave with no clear structure means the confirmation has not arrived yet, even if the Tide looks clean.',
    source: 'docs.algoboxpro.com/getting-started/order-of-operations'
  },
  wavePull: {
    title: 'Pullback quality',
    body: 'A healthy pullback retraces in a controlled, orderly way and holds a logical level (a prior swing, the Golden Ropes, a Fib zone). An unhealthy pullback is sharp, erratic, or breaks structure — it argues against the Tide bias rather than for it.',
    source: 'docs.algoboxpro.com/getting-started/order-of-operations'
  },
  waveRopes: {
    title: 'Golden Ropes at the Wave level',
    body: 'The same EMA 50/200 overlay, now read on the Wave chart. If price is respecting the ropes as dynamic support (in an uptrend) or resistance (in a downtrend), that is the Wave actively supporting the Tide. Broken ropes on the Wave is an early warning the Tide may be losing control.',
    source: 'docs.algoboxpro.com/fundamentals/golden-ropes'
  },

  macvHist: {
    title: 'MACV histogram — the momentum filter',
    body: 'The MACV Filter Chart is Step 3 of the official Order of Operations. It reports one of five states: Strong Buy, Moderate Buy, Neutral, Moderate Sell, Strong Sell. A Strong/Moderate reading in the direction of your Tide+Wave bias is what makes the market "tradable" for that direction. A Neutral reading means momentum has not committed yet.',
    source: 'docs.algoboxpro.com/fundamentals/macv-filter-chart'
  },
  macvMasher: {
    title: 'Masher — MACV deviation-line confluence',
    body: 'A Masher forms when price sits between two MACV deviation lines and an Enigma prints in the direction of the next line. It is the specific MACV-level confirmation that AlgoBox looks for before calling momentum "confirmed" — not just a favorable histogram color, but an active signal at this level.',
    source: 'docs.algoboxpro.com/strategies/masher'
  },
  macvNfz: {
    title: 'No Fiddle Zone — "Don\'t Fiddle in the Middle"',
    body: 'The No Fiddle Zone indicator reads the MACV histogram directly: when the histogram sits between its own first standard-deviation lines (±1σ) around the zero line, the market has no directional conviction and AlgoBox marks it as a No Fiddle Zone. This is a MACV-driven read, not a clock-based one — it can trigger at any time of day. While it is active, the rule is simple: no trade, wait.',
    source: 'docs.algoboxpro.com/fundamentals/no-fiddle-zone'
  },

  stalkLoc: {
    title: 'Reaction location — Structure, the "WHERE"',
    body: 'A FibDot, a Harmonic PRZ, a Shark PRZ, a DCDM level, a King Timing line, or a DDSR sitting at a Trend Channel Regulator extreme — these are all price-structure locations where a reaction is statistically likely. Finding one of these is what starts the stalking phase. Structure alone is never a trade; it defines where you are willing to look for one.',
    source: 'docs.algoboxpro.com/fundamentals/harmonic-patterns'
  },
  stalkDD: {
    title: 'Double Delta / Ready DD',
    body: 'Two Delta Flags appearing close together (a "Ready DD") signal concentrated institutional activity at this location — a stronger footprint than a single flag. AlgoBox treats this as a structure-level confluence item you stalk for, not a stand-alone entry trigger.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-delta-flagging-pro'
  },
  stalkPprz: {
    title: 'P-PRZ / Shark Back',
    body: 'The Projected PRZ (P-PRZ) is a Potential Reversal Zone the harmonic pattern is projecting forward — price has not reached it yet. On a Shark pattern specifically, "Shark Back" is the technique of entering at the farthest optimal line inside that projected zone. Both describe price arriving at a zone the structure predicted in advance, which is a materially stronger location than a reaction found after the fact.',
    source: 'docs.algoboxpro.com/strategies/shark-back-and-shark-tail'
  },
  stalkSmlk: {
    title: 'SMLK Timing Lines',
    body: 'SMLK stands for Small / Medium / Large / King — four tiers of statistically favorable timing windows that AlgoBox plots automatically. A King Timing Line is the highest-probability window; Large is second priority. Arriving at your structure location on or near a King or Large line meaningfully raises the quality of the setup you are stalking.',
    source: 'docs.algoboxpro.com/fundamentals/smlk-timing-lines'
  },
  stalkHtf: {
    title: 'Higher-timeframe level respected',
    body: 'Beyond the immediate location, check whether a higher-timeframe Masher line, Delta level, or FlowMaster reaction zone (read on Tide or Wave, not Ripple) is also being respected at this price. This is a multi-timeframe confluence check: the more timeframes agreeing this level matters, the more weight it carries.',
    source: 'docs.algoboxpro.com/getting-started/order-of-operations'
  },

  ripEnigma: {
    title: 'FlowMaster Enigma — the core trigger',
    body: 'Enigma is the primary Ripple-A entry signal. Green/Blue = bullish (Blue is the strongest tier), Red/Pink = bearish (Pink is the strongest tier). An Enigma is never traded alone — AlgoBox\'s rule is "Trade Nothing Alone": it must combine with your structure location to become a real setup.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-enigma'
  },
  ripAo: {
    title: 'Alpha / Omega — reversal vs continuation',
    body: 'Alpha (bullish) and Omega (bearish) signals carry a Power Number. Roughly: ≤15 favors continuation of the existing move, ≥20 favors a reversal, ≥40 is a strong reversal. At a structure location, an Alpha/Omega in the expected direction is one of the cleanest Ripple-A confirmations available.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-alpha-omega'
  },
  ripCross: {
    title: 'FlowMaster Cross',
    body: 'A Cross marks a burst of volume in one direction — a visible institutional footprint. A White Cross at a FibDot location is the classic "Headshot" trigger; two Crosses within 10–15 bars define a DCDM with an automatic target line.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-cross'
  },
  ripAudio: {
    title: 'AudioBox confirmation',
    body: 'AudioBox plays a distinct sound when a large order hits the tape in real time — a deep tone for a large buyer, a higher tone for a large seller. It is the final real-time confirmation layer on Ripple B, used to validate that the visual signal is backed by an actual large order, not just a pattern on the chart.',
    source: 'docs.algoboxpro.com/fundamentals/flowmaster-tm-audiobox'
  }
};

/* ── Setup names shown when Structure + RTOFA combine ── */
const ABX_SETUP_WHY = {
  'Headshot': 'FibDot (structure) + a Cross (RTOFA) at the same location. One of the highest-frequency, most reliable AlgoBox setups.',
  'Power Shark Tail': 'A Shark PRZ / Shark Back location (structure) confirmed by a Blue Alpha (RTOFA) — a high-conviction harmonic reversal.',
  'High-Confluence Reversal': 'A DDSR sitting at a Trend Channel Regulator extreme (structure) confirmed by a Blue Enigma (RTOFA) — AlgoBox\'s strongest reversal combination.',
  'DCDM Continuation': 'Price already at a DCDM level (structure) with a fresh Cross (RTOFA) confirming continuation toward the automatic target line.',
  'Delta King': 'A King Timing Line (structure/timing) with a Double Delta present (RTOFA) — statistical timing and institutional footprint aligning.',
  'Bullish PRZ Trade': 'A Harmonic PRZ (structure) confirmed by a Green or Blue Alpha (RTOFA) in a bullish context.',
  'Bearish PRZ Trade': 'A Harmonic PRZ (structure) confirmed by a Red or Pink Omega (RTOFA) in a bearish context.',
  'Confluence Setup': 'Structure and at least one RTOFA trigger are both present, but not in one of AlgoBox\'s specifically named combinations. Treat as valid but generic confluence — the reasoning still holds: structure + confirmation.'
};

/* ── Session time regions (EST) — used by the live clock ── */
const ABX_SESSIONS = [
  [0,0, 8,0, 'Closed — no session','idle'],
  [8,0, 9,25,'Pre-Market — trace OHL, no trade','idle'],
  [9,25,9,30,'News window — no trade','warn'],
  [9,30,9,35,'Open spike — SIT ON HANDS','bad'],
  [9,35,9,40,'Stabilizing — run the OoO','warn'],
  [9,40,9,50,'Reversal Zone — watch, don\'t chase','warn'],
  [9,50,10,10,'AM PRIME — best window','good'],
  [10,10,10,30,'Danger Zone — coffee break','bad'],
  [10,30,11,30,'Late Morning — good window','good'],
  [11,30,13,30,'Midday Chop — mandatory rest','bad'],
  [13,30,14,30,'Afternoon Build — prepare','warn'],
  [14,30,15,30,'PM PRIME — best window','good'],
  [15,30,15,50,'BTFD / STFR watch','warn'],
  [15,50,16,0, 'Algo Algos / Lucky 7\'s','warn'],
  [16,0,24,0, 'Session closed','idle']
];
