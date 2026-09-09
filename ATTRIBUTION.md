# Attribution — what we borrowed, and what we did not

Twelve repositories were cloned to `F:\SIH\borrowed\` (272 MB, gitignored) as reference while
building Disha. **That folder has been deleted.** Every repo below either has a piece of our code
tracing to it, or a recorded decision not to use it. Nothing is left vague.

*The prompt pack said thirteen repos; twelve were actually present on disk.*

**Rules we held to:** ideas may be taken from anything; **code was copied only from MIT-licensed
repos**, never from a repo with no licence file, and never from an AGPL or GPL one.

## The table

| Repo | Licence | Commit | What we took | Where it landed |
|---|---|---|---|---|
| [fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki) | MIT | `ff7c85c` | **CODE** — the FSRS-5 scheduling functions (stability, difficulty, recall probability, interval) and the default 21 weights | `prototype/guide-dots/lib/remember.js` |
| [browser-use](https://github.com/browser-use/browser-use) | MIT | `2b1f9d3` | **IDEA** — treat elements carrying `cursor:pointer` as candidates, not just semantic controls | `prototype/guide-dots/lib/tree.js` (`gdPointerCandidates`) |
| [ai-page-assist](https://github.com/bbuugg/ai-page-assist) | **none** | `6db3a96` | **IDEA ONLY** — its `desensitize` module strips sensitive values before anything reaches a model. No licence file, so **no code was read into ours**; the patterns and implementation are our own | `prototype/guide-dots/lib/redact.js` |
| [GUI-Actor](https://github.com/microsoft/GUI-Actor) | MIT | `d98d1bb` | **NOTHING YET** — reference for the vision fallback (see below) | — |
| [OmniParser](https://github.com/microsoft/OmniParser) | CC-BY (icon detector is AGPL) | `3540212` | **NOTHING** — rejected in favour of GUI-Actor | — |
| [element-highlighter](https://github.com/matatk/element-highlighter) | MIT | `a709b49` | **IDEA, no code** — the live-rect + MutationObserver marker lifecycle, which we had already built | `lib/dots.js` (ours) |
| [VisualTagger](https://github.com/calmstate/VisualTagger) | **none** | `3a59c5b` | **IDEA, no code** — same lifecycle question; nothing taken, no licence to take under | — |
| [chrome-element-inspector](https://github.com/gblikas/chrome-element-inspector) | **GPL** | `05feb15` | **IDEA, no code** — element picking under the cursor. GPL, so code was never an option | — |
| [intro.js](https://github.com/usablica/intro.js) | **AGPL** | `e5517e6` | **REVIEWED, NOT TAKEN** — step anchoring and tooltip collision. AGPL, and we point with arrows instead of scrolling for the user | — |
| [shepherd](https://github.com/shipshapecode/shepherd) | **AGPL-3.0** (dual) | `22a8a46` | **REVIEWED, NOT TAKEN** — same reason as intro.js | — |
| [meeting-minutes](https://github.com/Zackriya-Solutions/meeting-minutes) | MIT | `0281737` | **REVIEWED** — candidate for a Capture module; out of scope for the intercollege build | — |
| [open-notebook](https://github.com/lfnovo/open-notebook) | MIT | `2d2df8a` | **REVIEWED** — same as above, out of scope | — |

## The three that changed our code, and what changed

### 1. fsrs4anki → `lib/remember.js` (138 lines)

A procedure you did once is not one you can do in three weeks. Every recipe the learner masters in
`fade.js` now gets a next-review date from the real FSRS-5 algorithm, and the popup shows
**"Due for practice: &lt;task&gt; on &lt;site&gt;"**.

Ported: `next_recall_stability`, `next_forget_stability`, `next_difficulty`, `forgetting_curve`,
`next_interval`, `init_stability`, `init_difficulty`, and the default weight vector.
Deliberately dropped: the again/hard/good/easy button (we infer the rating — a clean unaided run is
`good`, a run with a wrong click is `again`) and the interval fuzz (Anki spreads load across a big
deck; we have a handful of recipes and a demo that must be reproducible).

Measured, reviewing each time on the due date:

| repetition | stability | next review |
|---|---|---|
| 1 | 2.31 | 2 days |
| 2 | 10.97 | 11 days |
| 3 | 46.25 | 46 days |
| 4 | 162.62 | 163 days |
| 5 | 496.30 | 365 days (capped) |
| then a wrong click | 6.66 | back to 7 days |

**This is what makes the spaced-retrieval line on the impact slide (g = 0.74) true in code rather
than asserted on a slide.**

### 2. ai-page-assist → `lib/redact.js` (idea only, our code)

The architecture diagram claims *"only control names leave the device — never your text, never your
credentials"*. That was true of page **content** but not airtight about **names**: a badly built
portal puts the value into the label, so a field can carry an Aadhaar number straight into the
prompt. Every accessible name is now scrubbed in `gdAccessibleName` — the last place a name can be
touched before it leaves — for Aadhaar, PAN, email, Indian mobile, bank account, card number and
OTP/PIN/CVV.

The mask keeps the **shape** (`Aadhaar «aadhaar» linked`) because the model still has to tell an
Aadhaar field from a phone field; it just never sees the digits. A count is logged to the console
per enumeration.

**Verified in the browser:** a real 12-digit Aadhaar placed in a live control's `aria-label` came
back as `Aadhaar «aadhaar» linked`, masked count 1. No false positives on `Amount to withdraw (₹)`,
`Confirm and send money`, `HDFC Bank •••• 4821` or `Wallet` — over-masking would break grounding.

### 3. browser-use → `lib/tree.js` (idea, our code)

A great many real controls are plain `<div>`s that announce themselves only through
`cursor:pointer`. We were blind to every one. Detection uses **computed** style (a class, not an
inline attribute), skips wrappers that already contain a real control, and is capped at 40 additions
so a page whose author set `cursor:pointer` on a container cannot swallow the document.

Measured before → after:

| Page | before | after | added |
|---|---|---|---|
| BharatInvest demo (our mock) | 27 | 27 | **0** |
| scholarships.gov.in | 28 | 31 | +3 |
| swayam.gov.in | 50 | **70** | **+20** |
| aicte-india.org | 119 | 120 | +1 |

**Zero on our own mock** — it is built from real `<button>` and `<a>` elements, so there was nothing
to find. That is the honest result: the heuristic is inert on well-built markup and earns its keep
on the sites our users actually face. It also left the demo's control count at exactly 27, so the
explainer and the deck assets remain true.

## GUI-Actor: what the vision fallback would look like

GUI-Actor returns a **verifier score** per candidate region alongside its attention map, which maps
onto our existing two-number rule cleanly: it would supply the *model* half of the score while
`gdGroundingQuality` continues to supply the *page* half, and `gdBand` would be unchanged.

Because a pixel-grounded pick cannot be checked against an accessible name, a vision-sourced dot
would be **capped at amber** and badged "from pixels" — the same discipline that caps the offline
matcher below green today.

## Rebuilding the folder

```bash
mkdir borrowed && cd borrowed
git clone https://github.com/open-spaced-repetition/fsrs4anki       && git -C fsrs4anki checkout ff7c85c
git clone https://github.com/browser-use/browser-use                && git -C browser-use checkout 2b1f9d3
git clone https://github.com/bbuugg/ai-page-assist                  && git -C ai-page-assist checkout 6db3a96
git clone https://github.com/microsoft/GUI-Actor                    && git -C GUI-Actor checkout d98d1bb
git clone https://github.com/microsoft/OmniParser                   && git -C OmniParser checkout 3540212
git clone https://github.com/matatk/element-highlighter             && git -C element-highlighter checkout a709b49
git clone https://github.com/calmstate/VisualTagger                 && git -C VisualTagger checkout 3a59c5b
git clone https://github.com/gblikas/chrome-element-inspector       && git -C chrome-element-inspector checkout 05feb15
git clone https://github.com/usablica/intro.js                      && git -C intro.js checkout e5517e6
git clone https://github.com/shipshapecode/shepherd                 && git -C shepherd checkout 22a8a46
git clone https://github.com/Zackriya-Solutions/meeting-minutes     && git -C meeting-minutes checkout 0281737
git clone https://github.com/lfnovo/open-notebook                   && git -C open-notebook checkout 2d2df8a
```
