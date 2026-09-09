# Disha — SIH 2026, PS 26207

**Team Code Blooded · Student Innovation → Smart Education**

Disha (दिशा, *"direction"*) puts a coloured dot on the **one** control you should click next, on any
web page, for a goal you typed in plain words. The colour is a confidence number the system can be
held to. It never clicks for you, and the more you succeed the more it gets out of the way — five
clean repetitions and the dot is gone.

> One-line positioning, verbatim (it survived the prior-art audit):
> *A confidence-aware, human-in-the-loop visual navigation copilot for Indian public-service and
> learning interfaces.*

**Nothing here is a mock-up.** Every screenshot, clip and number in this repo came out of the running
code. If you are about to say something on stage, check it against `deck/numbers.md` first.

---

## 1. Run it — one minute, no install

**Double-click `run.bat`.** That is the whole answer. It frees the ports, serves the files, opens the
portal and prints every URL. Press any key in that window to shut everything down.

The only prerequisite is **Python on PATH** — and only to serve files over http, because a browser
will not run the guide from a `file://` page. Disha itself is plain JavaScript: nothing to install,
nothing to build, no `npm install`, no network call unless a model key is configured.

| URL | What it is |
|---|---|
| `localhost:8931/index.html` | **The portal** — the product page. Start a presentation here. |
| `localhost:8777/demo/index.html` | **The live prototype.** Type a goal, follow the dots. |
| `localhost:8931/practice.html` | The practice sandbox — a deliberately awkward government-shaped portal. |
| `localhost:8778/how-the-dot-is-chosen.html` | The maths behind one decision, animated. |

Hands-free for recording or a nervous stage: `localhost:8777/demo/index.html?auto=1`
(single scenes: `&scene=chain` · `red-verify` · `nav` · `fade`).

**The full stage runbook, including what to say, is [HOW-TO-DEMO.md](HOW-TO-DEMO.md).** Read that
before you present. This file is for understanding and navigating the repo.

---

## 2. Repo map

| Path | What it holds | Read it when |
|---|---|---|
| [`prototype/guide-dots/`](prototype/guide-dots) | **The product.** MV3 Chrome extension + a demo harness that runs the same code on a plain page. | You are explaining or changing how it works |
| [`platform/`](platform) | The portal, the architecture page and the practice sandbox (3 standalone HTML files). | You need the product page or an architecture visual |
| [`deck/`](deck) | Everything needed to build the SIH idea PPT: final slide text, traced numbers, screenshots, looping clips, a draft pptx + pdf. | You are building the presentation |
| [`explainer/`](explainer) | One animated page that walks through a single grounding decision on the real measured numbers. | A judge asks *"how does the confidence actually work?"* |
| [`research/`](research) | Three deep-research reports, the SIH guidelines, the official template, past teams' decks. | You need a citation or the rules |
| `borrowed/` | 12 cloned third-party repos, reference only. **Gitignored — not in a fresh clone.** | Never, for the pitch |
| [`HOW-TO-DEMO.md`](HOW-TO-DEMO.md) | The stage runbook: what to open, what to say, what to do when it breaks. | Before presenting |
| [`judge-FAQ.md`](judge-FAQ.md) | Q&A bank — the killer questions, rehearsed, one sentence each. | Before Q&A |
| [`demo-video-script.md`](demo-video-script.md) | Shot-by-shot script for the 2-minute demo video. | You are recording |
| [`PPT-content-draft.md`](PPT-content-draft.md) | Earlier content blocks (superseded by `deck/slides.md`). | For background only |
| [`next-prompts-for-opus.md`](next-prompts-for-opus.md) | The AI-agent work queue: what's done, what's deferred, why. | You want to know what is left |
| `run.bat` | The launcher. | Always |

The spreadsheet and PDF files at the root (`Problem_Statements_Evaluation_With_Summary - Final.xlsx`,
the two SIH problem-statement catalogues, `India-Proud AI Vision …docx`) are from the
problem-statement selection phase. Keep them; nothing depends on them.

---

## 3. The product — `prototype/guide-dots/`

Two ways to run the same code: install it as a Chrome extension, or open the demo harness in any
browser. **The harness loads `lib/` and `content.js` unmodified** — it only shims the four `chrome.*`
calls a content script needs. If it works in the harness, that is the shipping code working.

### The pipeline, one file at a time

| File | Lines | Its job |
|---|---|---|
| `lib/tree.js` | 137 | Enumerate every visible interactive element and keep **live** DOM references. Each gets a numeric id. |
| `background.js` | 336 | The only thing that talks to a model — content scripts can't make cross-origin calls. Providers: Gemini (free tier, default), Anthropic (BYOK), Ollama (local). Parses replies models actually send, fenced or chatty. |
| `lib/local.js` | 148 | **Offline planner.** Matches your words to the page through a synonym table — no network, no key. Also the fallback when the model call fails. Capped below green on purpose. |
| `lib/ground.js` | 120 | **The honesty layer.** Computes `groundingQuality` locally from page signals (is it named? does it share words with the goal? is it unique? is it actually on top?) and combines it with the model's own confidence using `min()` — so the number can never contradict the colour. |
| `lib/dots.js` | 640 | Draws the marker and never intercepts a click. The dot **travels** from the previous step, morphs into a scroll arrow when the target is off screen, shakes on a wrong click. |
| `lib/fade.js` | 62 | **The pedagogy layer.** Each clean repetition dims that step's guidance; a wrong click **restores** it. Fading is contingent, not on a timer — fixed monotonic fading can be worse than none. |
| `lib/chat.js` | 159 | The on-page ask bar, in a shadow root. It is on the page and not in the popup because a Chrome popup closes the instant you click the page — and clicking the page is the entire interaction. |
| `lib/screen.js` | 79 | Optional screen share for pages with no useful DOM (canvas, embedded PDF, cross-origin iframe), with a **track-level Pause** for OTP and PIN screens. |
| `content.js` | 289 | The loop that holds it together: goal → candidates → decision → dot → wait for the human's click → repeat. Owns the 1.25-screen threshold that decides one arrowhead vs two. |
| `popup.js` / `popup.html` | 166 | Extension settings: provider, key, model. |

### Around it

- `demo/` — `index.html` (a fictional broker portal), `shim.js` (the `chrome.*` shim, `localStorage`-backed), `autoplay.js` (drives the whole story hands-free: types into the real ask bar, waits for the real dot, clicks through `elementFromPoint` — it never plants an answer, so a take that looks right *is* right).
- `test/` — `realsite.mjs` runs the real enumeration + planner against sites we don't control, with no model and **no clicks**; `record.mjs` screen-records straight out of Chrome over CDP; `cdp.mjs` is a whole DevTools-Protocol client in one file with zero npm packages; `parse.test.mjs` exercises reply parsing.
- `config.local.js` — local model defaults. **Gitignored. Never commit a key.**

### Installing it as a real extension

`chrome://extensions` → Developer mode → **Load unpacked** → pick `prototype/guide-dots`. Set a
provider in the popup. Without a key it still runs, offline, through `lib/local.js`.

---

## 4. Building the presentation — `deck/`

Start at **[`deck/slides.md`](deck/slides.md)**: final text mapped box-by-box onto the six official
slides, with the template's own headings reproduced so nothing gets renamed, and a
*claims-we-must-NOT-make* checklist at the bottom.

Then:

- **[`deck/numbers.md`](deck/numbers.md)** — every statistic, traced to an exact source line in `research/`, plus a list of the numbers we do **not** have. If a number is not in this table, it does not go on a slide.
- **[`deck/README.md`](deck/README.md)** — the official rules (max 6 slides incl. title · upload PDF only · use the provided template unchanged), where the real template actually is, and five things not to get wrong.
- **`deck/assets/`** — ten 1920×1080 PNGs, all captured from the running prototype.
- **[`deck/clips/`](deck/clips)** — four silent looping clips of the real product (`01-chain`, `02-red-verify`, `03-navigation`, `04-fade`), 1080p30 H.264 with GIF fallbacks, each measured to loop seamlessly. Its README says which clip goes on which slide and how to set PowerPoint to autoplay-and-loop.
- **`disha-idea-deck-draft.pptx` / `.pdf`** — a structural draft, not the submission.

⚠️ The template in `research/` is the **2024** edition. Download the **2026** file from the SIH
portal and paste this text into it — the section structure is unchanged, but the logo, year and
footer must come from the 2026 file.

---

## 5. What you can say on stage, and what you can't

**The measured demo run** (fictional broker portal, offline matcher, goal *"i want to take my money
out"*): four steps, three screens — amber **64%** → amber **57%** → **red 51%** → amber **75%**.
Step 3 going red is the pitch, not a bug: `Confirm and send money` scored almost as well as the
amount field (0.815 vs 0.763, a margin of 0.052), and a narrow win is reported as a narrow win.

**Sites nobody scripted** ([`deck/real-site-run.md`](deck/real-site-run.md)) — real enumeration, no
model, no clicks:

| Site | Controls found | Named | Dot would land on | Shown |
|---|---|---|---|---|
| scholarships.gov.in | 28 | 86% | **"Apply now" — correct** | red 30% |
| swayam.gov.in | 50 | 68% | a course tile — **wrong** | red 16% |
| aicte-india.org | 119 | 93% | "Search" — **partial** | red 54% |

That is the answer to *"is it hardcoded to your page?"*, as a measurement rather than a claim — and
every miss was reported as a miss.

**Do not claim:**

- **A green dot.** No model key is configured; the offline matcher is capped below green by design. We have never shown green, so we don't say we have.
- **An accuracy rate.** Three sites on one day is a sample, not a benchmark — quote it in full.
- **That we invented AI screen understanding.** Microsoft Copilot Vision already highlights where to click. Keep that honesty line on slide 2 — removing it is the fastest way to lose the novelty argument the moment a judge names the product first. What nothing shipped combines is *calibrated visible confidence* + *guidance that fades on demonstrated mastery* + *packs built for Indian student and public-service portals*.

Full rehearsed answers: **[`judge-FAQ.md`](judge-FAQ.md)**.

---

## 6. Status

**Built and verified in a browser:** the four-step chain across three screens · the honest red band ·
the on-page ask bar · scroll arrows that distinguish "just past the edge" from "keep going" · the
proximity hover card · scaffold fading with restore-on-error · the offline planner · screen share
with a real Pause · travelling-dot motion · the live thinking-scan panel · hands-free autoplay ·
four looping clips · the deck package · runs on three real portals.

**Not built — say so plainly if asked:** the green dot and the live-model bands, both waiting on a
Gemini key · page Q&A · per-site knowledge packs · route preview ("what comes after the click") · a
vision consumer · the `05-pause` clip (needs a hand recording; headless Chrome has no desktop to
capture) and `06-green` (needs the key).

Deferred until after the intercollege round, by decision rather than by accident — see
[`next-prompts-for-opus.md`](next-prompts-for-opus.md).

---

## 7. Working notes

- **No build step and no dependencies.** Plain JavaScript, plain HTML. The `test/` scripts need Node 22+ and, for recording, Chrome on `--remote-debugging-port=9333` plus ffmpeg on PATH.
- **`borrowed/` is gitignored** (~272 MB of third-party repos, each with its own `.git`). A fresh clone will not have it, and nothing in the product imports from it — it is reading material.
- **Secrets never go in git.** `.env*`, `*.key`, `config.local.js` and `research/agent router api key/` are all ignored. Keys live on disk only — put yours in `config.local.js` or the extension popup, never in a tracked file. **This repository is public.**
- **Ports** 8777 (prototype), 8931 (portal), 8778 (explainer) — also configured in `.claude/launch.json` for agent-driven runs.
- If a page looks stale, hard-reload it (Ctrl+F5): the file servers set no cache headers.
