# AlgoBox™ Decision Engine

A local, offline-first trading copilot that enforces the official AlgoBox™ Order of
Operations — **Tide → Wave → MACV → Ripple B (stalking) → Ripple A (execution)** —
one decision at a time, so you can't skip a step and emotion has nowhere to sneak in.

It is not connected to your broker or to live market data. It is a structured
checklist that mirrors your own chart reading back to you, tells you what your
current job is, and only unlocks EXECUTE when Structure and RTOFA genuinely agree.

---

## 1. How to open it

**Just double-click `index.html`.** It runs entirely in your browser — no install,
no server, no account, nothing sent over the network except loading the two Google
Fonts.

If you prefer, you can also serve it from a tiny local server (optional, not
required):

```
cd abx-engine
python -m http.server 8000
# then open http://localhost:8000
```

Either way works identically. Keep all seven files together in the same folder —
`index.html` loads the others by relative path.

---

## 2. File structure

```
abx-engine/
├── index.html    the page shell — DOM structure, loads everything else
├── styles.css    the entire visual theme (dark UI, responsive, print)
├── data.js       content layer — every field's options + "Why?" explanations
├── rules.js      logic layer — bias math, gating, Job/Watch text, setup detection
├── journal.js    persistence layer — localStorage: auto-save, journal, playbook
├── app.js        view/controller — renders data+rules to the DOM, wires events
└── README.md     this file
```

The split is deliberate: **data.js** is the only file with AlgoBox terminology and
explanations in it, **rules.js** is the only file that decides what any of it
*means*, and **app.js** is the only file that touches the DOM. If you want to
correct an explanation or add a new field, you almost never need to touch more
than two files.

### Why `data.js` and not `data.json`?

Browsers block `fetch()` of local files when a page is opened directly from disk
(`file://…`) — it's a security restriction (CORS), not a bug. Rather than force
you to run a local server every day, the reference data is a plain JavaScript file
(`const ABX_OPTIONS = {...}`) that loads instantly with a `<script>` tag, no fetch
involved. Functionally it's the same as a JSON file — open it, it's just a big
object literal.

### Why classic `<script>` tags and not ES modules?

Same reason: `import`/`export` (`type="module"`) is also blocked under `file://`
in Chrome. Every file here uses plain global functions/consts (prefixed `abx`/`ABX`
to avoid collisions), loaded in dependency order in `index.html`:
`data.js → rules.js → journal.js → app.js`.

---

## 3. The Order of Operations, and how the app maps to it

| Stage | AlgoBox concept | What you're answering | Locks until |
|---|---|---|---|
| **1. Tide** | 89-range · overall bias | Golden Ropes position, Delta bias, FlowMaster tilt, optional OBOS divergence | always open |
| **2. Wave** | 21–34 range · confirmation | Structure, pullback quality, Golden Ropes role | Tide answered |
| **3. MACV** | momentum filter | Histogram (5-state), Masher, No Fiddle Zone | Wave answered |
| **4. Ripple B** | stalking — the **WHERE** | Reaction location (FibDot/PRZ/Shark/DCDM/King/DDSR), Double Delta, P-PRZ/Shark Back, SMLK timing, HTF level | MACV is **clear** (not blocked/conflicted/neutral) |
| **5. Ripple A** | execution — the **WHO** | Enigma, Alpha/Omega, Cross, AudioBox | a location is found in Ripple B |

A stage is **locked** (dimmed, padlock icon, inputs disabled) until the one before
it satisfies its gate — this is the "can't skip steps" rule. You can always go
back and *edit* an earlier, already-completed stage (say, MACV flips mid-session);
editing it re-evaluates everything downstream automatically.

Every field group has a **`?` button** that opens a short, sourced explanation
pulled from `docs.algoboxpro.com` — the app teaches while you use it.

### The decision brain

At every state, the app computes one **Current Job** sentence per stage (what to
do *right now*, and explicitly what to *ignore*), a live **coach narration**
("Tide and Wave both lean bullish… now I check the MACV…"), and a top-level
**status badge** that only turns gold and reads `EXECUTE LONG` / `EXECUTE SHORT`
when Structure (Ripple B) and RTOFA (Ripple A) combine into one of AlgoBox's
named setups (Headshot, Power Shark Tail, Delta King, DCDM Continuation, High-
Confluence Reversal, or a generic Confluence Setup).

---

## 4. Journal, Playbook, Report

- **Journal** — click **"Log This Trade"** once EXECUTE is reached to save the
  setup, direction, and instrument, then fill in entry/stop/target/result/notes
  (editable any time). Shows a running win rate once you start marking results.
- **Playbook** — click **"Save to Playbook"** to store a full snapshot of a clean
  setup under a name you choose, so you can build a personal library of your best
  A+ setups over time.
- **Report** — a clean, printable one-page summary of the *current* session's
  analysis. Click **Print / Save PDF** — the stylesheet automatically hides all
  interactive chrome and prints just the report.

### Auto-save & data safety

Every change is saved to your browser's `localStorage` automatically — close the
tab, reopen `index.html` later, and your in-progress session, journal, and
playbook are exactly as you left them.

`localStorage` under `file://` is reliable in Chrome and Edge. A few browsers
sandbox local-file storage more strictly. As a safety net, use **Export JSON** on
the Journal tab regularly (a real file on disk, works everywhere) and **Import
JSON** to restore it. If auto-save isn't persisting in your specific browser, that
export/import pair is your reliable path — treat it like backing up any other
data.

---

## 5. Extending it

**Add a new checklist item to an existing stage** (e.g. a new Ripple B concept):
1. Add its option map to `ABX_OPTIONS` in `data.js` (and a `ABX_WHY` entry).
2. Add a matching field to the right array in `STAGE_FIELDS` in `app.js`.
3. If it should affect gating or setup detection, add that logic to `rules.js`.

**Add a new named setup combo:** add a branch to `abxComputeSetup()` in
`rules.js`, and a one-line description to `ABX_SETUP_WHY` in `data.js`.

**Change the color/visual theme:** everything is CSS custom properties at the top
of `styles.css` (`--gold`, `--good`, `--bad`, etc.) — change them once, the whole
app updates.

---

## 6. Disclaimer

This is an educational decision-support tool built around the publicly documented
AlgoBox™ Order of Operations (docs.algoboxpro.com). It does not connect to any
market data feed, broker, or execution platform, and it does not place trades. It
reflects only what you tell it about your own charts. Trading futures carries
real financial risk — this tool does not remove that risk, it only removes
*emotional* decision-making from your own documented process. Always confirm
against your own analysis and risk management rules.

**Source:** docs.algoboxpro.com
