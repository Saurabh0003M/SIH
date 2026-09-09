# Disha — next prompts for Opus 5 (prepared by claude-fable, 2026-09-09)

Paste **P0 first in every new Opus session**, then one numbered prompt at a time.
Order is by product value: P2 and P2.5 first, then the features, each followed by re-recording the clip it changes.

| # | Prompt | Why now | Rough time |
|---|---|---|---|
| P0 | Session preamble | Stops the "no, no, no" loop; sets the decisions as decided | paste with every prompt |
| P1 | Deck package | **DONE 2026-09-09 and accepted.** Teammates own the PPT from here; no agent time goes to slides. | — |
| P2 | Live model → green dot → real website | Nothing green has ever been shown; judges look for a real site | 45–60 min |
| P2.5 | Short looping clips for the PPT | Saurabh's call: the deck carries silent loops of the product, not screenshots | 1.5–2 h |
| P3 | Ask-Gemini parity + site knowledge packs + route preview | The "how does it know what comes after the click" answer; re-record two clips after | 2–3 h |
| P4 | Screen share → vision fallback | Frames are captured today but nothing consumes them; re-record one clip after | 1.5–2 h |
| P5 | Tree-traversal animation (+ optional Higgsfield) | The clip that shows what the presenter cannot show live | 1.5 h |
| P6 | Unified portal: combine the borrowed repos, keep the best mechanism | Your portal idea, done as a comparison judges can read | 2–3 h |
| P7 | The GPT Astra mega-brief | Hands the hardest thinking to Astra with full context | 45 min |
| P8 | Checkpoint + handover | Keeps the brain true, packages for judges | 20 min |

**Standing rule from Saurabh (2026-09-09): no agent tokens on the PPT.** Dedicated teammates build it from `deck/`. Agents work on the product and on short video clips that run in a loop inside the PPT.

Two facts Opus must know before P2 (verified today from the command line, not from the browser):

- **The AgentRouter key returns HTTP 401 `unauthorized client detected` for every request**, including a plain `GET /v1/models`. It is not a browser limitation; AgentRouter whitelists client software. The code path for it (`provider: "custom"`, with model racing) is already written and idle. Use a **Gemini free key** for the demo. Rotate the AgentRouter key after testing as you planned; it is in `config.local.js` (gitignored, confirmed absent from git history) and in this chat.
- `config.local.js` currently sets `provider: "ollama"`, so the extension will silently try a local model that may not be running. P2 fixes this.

---

## P0 — Session preamble (paste at the top of every Opus session)

~~~~
Read brain/state (the `sih` block only) before anything else. Then work in F:\SIH.

Decisions Saurabh has already made. Do not reopen them, do not argue them, do not offer alternatives to them:
1. The product is Disha: an on-page assistant (like Chrome's "Ask Gemini") whose extra is on-screen annotation — dots on the element to click, up/down arrows for scrolling, a comment card that opens when the pointer comes near the dot and says what happens after the click. The human clicks; the system never clicks.
2. Screen share exists as a toggle pair (Share/Stop, Pause/Resume) so the user can pause during OTP, password or personal fields. It stays.
3. There is also a web portal that combines the fragmented open-source learning and guidance solutions into one place, keeping the best mechanism where two repos overlap. Disha is the core inside that portal and the thing presented at the end.
4. Speed matters more than polish. The PPT belongs to dedicated teammates; agents spend nothing on slides. Agent work is the product and short silent clips of it that loop inside the PPT (see P2.5).

How to work:
- If you see a real problem, say it in ONE sentence, then build the requested thing anyway under a stated assumption. Never stop to ask permission for reversible work.
- Never fake a dot, a number, or a screenshot. If something does not work, say so plainly and show what does.
- Verify in the browser (the harness at http://localhost:8777/demo/index.html via the `disha-demo` launch config) before claiming anything works.
- At the end, update the `sih` block in brain/state with `last: <date> claude-opus-5 — …` and commit the vault with the brain-commit.ps1 hook (never raw git commit in the vault).
~~~~

---

## P1 — Deck package for teammates

**Done 2026-09-09 (commits 254b897, 52d9f34) and accepted after review. Teammates own the PPT from here. The official template file is `research/SIH2025-IDEA-Presentation-Format.pptx`; slide 2 must use its own three pointers, not the CODESTRIX labels — that note is for the teammates, not for an agent.**

---

## P2 — Live model, green dot, real website

~~~~
Goal: show the first GREEN dot, then run Disha on a real website, and record both.

Facts: the AgentRouter key gets HTTP 401 "unauthorized client detected" on every request, even GET /v1/models from curl, so it cannot be used from the extension today. Saurabh will paste a Gemini free key (from aistudio.google.com/apikey) into this chat. If it is not in the chat yet, do everything that does not need it and leave a one-line request at the end.

Steps:
1. config.local.js: change provider to "gemini" and add the Gemini key; keep the AgentRouter block commented with the 401 note. Bump GD_CONFIG_VERSION in popup.js so saved settings adopt it. Keep config.local.js gitignored.
2. Harness: gdDemoConfig.set({provider:"gemini", apiKey:"…"}), reload, run "i want to take my money out". Report the four bands and percentages with the live model. If no step goes green, print the model confidence and grounding quality per step and explain which one capped it; do not loosen gdBand thresholds to force green.
3. Fix whatever the live model exposes (JSON parsing, model name discovery, rate limits: back off and retry once, then fall back to offline with a visible message).
4. Real website: load unpacked from prototype/guide-dots in Chrome (use the Claude in Chrome tools if the in-app browser cannot load extensions; otherwise write exact click-by-click steps for Saurabh and stop there). Run two read-only tasks that submit nothing: on https://scholarships.gov.in "how do I apply for a scholarship" and on a college website of Saurabh's choice "i want to apply for admission". Screenshot every dot. Note every misfire honestly.
5. Autoplay: extend demo/autoplay.js so that when a live provider is configured the caption says "live model" instead of "no model"; keep the offline path unchanged.
6. Record: build the recording rig described in P2.5 now (Playwright record_video or CDP screencast, 1280x720 at deviceScaleFactor 1.5 → 1920x1080) and capture the ?auto=1 run with the live model, plus one clip of each real-site dot. Save under deck/clips/raw/. P2.5 turns these into the looping clips.

Deliver: the bands table (offline vs live), screenshots in F:\SIH\deck\assets\live\, the recordings, and a short list of what misfired on the real sites and why.
~~~~

---

## P2.5 — Short looping clips for the PPT

~~~~
Goal: a set of short, silent, seamlessly looping video clips of the REAL product, one per slide, that teammates drop into the PPT with "Loop until Stopped + Start Automatically". No screenshots, no mock-ups, no narration. Each clip must be readable when the slide is projected: dot, colour and percentage visible at 1920x1080.

Format: MP4 H.264, 1920x1080, 30 fps, 6–10 s, under 8 MB each, no audio track. Also export a GIF under 10 MB for each as a fallback (PowerPoint on some machines refuses MP4 embedding). Name them deck/clips/NN-name.mp4 and .gif.

Loop rule: the first and last frames must match. Start every clip on the idle page (no dot, ask bar empty), end by fading the overlay out over 400 ms back to that same idle frame, hold 300 ms, cut. A loop that jumps reads as a glitch on a projector.

Recording method: extend demo/autoplay.js with ?scene=<name> so ONE scene runs, then the page resets itself to idle (clear dots, clear the chat log, reset mastery when the scene needs it). Record with Playwright's video recording (record_video_dir, viewport 1280x720 with deviceScaleFactor 1.5 — the same rig that made the deck PNGs) or CDP Page.startScreencast → frames → ffmpeg. Check whether ffmpeg is on PATH; if not, pip install imageio-ffmpeg and use its bundled binary. Trim to the loop points with ffmpeg, never by hand. Speed up only the WAITS (the waitForQuiet pauses), never the dot's own animation; a dot that lands too fast to read is worthless.

Clips, in priority order:
01-chain        The four dots landing for "i want to take my money out". Type fast (25 ms per char), let each dot hold 1.5 s. Target 10 s.
02-red-verify   Step 3 alone: the red dot on the amount field, the pointer drifts near it, the hover card opens and shows "After you click …", holds 2 s. Target 7 s.
03-arrow        "i want to raise a complaint": the scroll-down arrow bobbing, a smooth programmatic scroll (window.scrollTo with behavior smooth), the arrow swaps to the dot as the footer link enters view. Target 7 s.
04-fade         Same task run four times fast with mastery reset first: full dot with label → quieter dot, no label → whisper → gone, with the panel line "try it without the dot". Speed the repeats up; hold the final empty state 1.5 s. Target 10 s.
05-pause        Share screen on, an OTP field focused, Pause clicked, the panel text flips to "PAUSED — nothing is being captured", Resume. Playwright needs --use-fake-ui-for-media-stream and --auto-select-desktop-capture-source="BharatInvest" to grant the picker without a hand; if that fails, record this one by hand and say so. Target 7 s.
06-green        Only after P2: one step going GREEN with the live model, percentage visible. Target 6 s. If no step goes green, do not fake it; ship 01–05 and say so.
07-tree         The tree-traversal animation from P5 (explainer/tree-traversal.html), 30 s, loops on its own. Record after P5.

After P3 re-record 01 with the route strip visible and add 08-question (a question gets an answer plus a "Show me" chip). After P4 add 09-vision (the "from pixels" badge dot on the canvas button).

Deliver: deck/clips/ with every mp4 and gif, a deck/clips/README.md that maps clip → slide (01 and 02 on slide 2, 07 on slide 3, 02 or 06 on slide 4, 04 on slide 5) and gives teammates the two PowerPoint clicks (Insert → Video → This Device; Playback → Start Automatically + Loop until Stopped + Hide While Not Playing off). Verify every file loops cleanly by playing it twice in the in-app browser or VLC and watching the seam. Report durations and sizes in a table.
~~~~

---

## P3 — Ask-Gemini parity, site knowledge packs, route preview (the "tree" answer)

~~~~
Goal: make the ask bar do everything "Ask Gemini" does for the current tab, make Disha "trained on that specific website", and answer Saurabh's question — how does it know what buttons come after the click — with a visible route.

Today the ask bar can only navigate. Build three things, in this order, verifying each in the harness before the next.

A. Questions, not only tasks (lib/intent.js, changes in content.js and background.js)
- Classify every ask as QUESTION or TASK with the model (one extra field in the JSON reply, or a first cheap call). A QUESTION ("what are the brokerage charges?", "is my money safe here?") gets answered in the chat panel from (1) the visible page text, capped at 6k characters, plus (2) the site knowledge pack below. Every answer ends with a "Show me" chip; clicking it converts the question into a TASK and starts the dots.
- A TASK behaves as today.
- Never send form values, passwords or anything typed into inputs; send only headings, paragraphs and the interactive-element list.

B. Site knowledge packs (prototype/guide-dots/packs/)
- JSON per origin: { origin, name, glossary: {"take money out": "Withdraw", …}, faqs: [{q, a}], recipes: [{goal, steps: ["Wallet", "Withdraw", "Amount to withdraw", "Confirm and send money"], sensitive: ["Confirm and send money"]}] }.
- Write packs for the two demo portals (BharatInvest at demo/, Vidya Setu at platform/practice.html) and an empty default. Load by origin in background.js and inject the matching pack into the system prompt. This is what "trained on that website" means in the pitch: a company ships a pack for its own portal instead of 30 customer-care seats. Say exactly that in a comment at the top of the loader.

C. Route preview (lib/route.js)
- On a TASK, ask the model for a PLAN first: an ordered list of expected steps, each {label, kind: click|type|scroll|sensitive, p: 0..1}, using the recipes if a pack exists and the current elements otherwise. Render it as a route strip in the ask bar: Wallet › Withdraw › Amount › Confirm, current step highlighted, sensitive steps with a lock icon (that is the pause point), each chip's opacity = its p.
- Every step is STILL grounded live against the real screen, exactly as today. If the live pick's name does not match the planned step, keep the live pick, re-plan, and show "route updated" in the strip. The plan is a forecast; the dot is the truth.
- Optional if time allows: a same-origin, GET-only, depth-1 crawl from the background worker (max 20 pages, 5 s budget, skip any URL containing logout, delete, pay, submit) that records link and button names per page, cached per origin, and is fed to the planner. Read-only. If you build it, show its page count in the popup.

D. Explainer for the motion clip
- Extend explainer/ with route-tree.html: the screens as nodes, the path as edges, each candidate with its bar, the chosen node pulsing, the red near-tie case shown. Use the real numbers from the harness run. This page is what P5 records.

Verify in the harness: a question gets an answer plus a Show-me chip; a task shows the route strip and the four dots; a wrong click keeps the live pick and updates the route. Zero console errors. Then update demo-video-script.md scene 6 to include the route strip.
~~~~

---

## P4 — Screen share → vision fallback

~~~~
Goal: make screen sharing DO something. Today lib/screen.js captures a downscaled JPEG frame (gdGrabFrame) and nothing consumes it.

Design (keep it honest: DOM first, pixels only on failure):
1. In lib/ground.js pickTarget: when the DOM path fails — no elements, model returned null, or the chosen candidate's grounding quality is below 0.40 — AND gdShareGetState() === "live", grab a frame and send {goal, image} to the background as type "GROUND_VISION".
2. background.js: a vision call for the current provider (Gemini flash accepts inline base64 images; Anthropic accepts image blocks; Ollama uses a vision-capable model if one is installed, otherwise return an error). Ask for JSON {x, y, confidence, reason, label} with x,y normalised 0..1 of the frame. Treat the reply as untrusted; clamp.
3. Coordinate mapping: request the share with getDisplayMedia({video:{frameRate:1}, preferCurrentTab:true, selfBrowserSurface:"include"}) so the picker defaults to this tab and coordinates map to the viewport after scaling by frame/viewport ratio. If the user shared the whole screen instead, detect the mismatch (frame aspect vs viewport aspect) and say in the panel "share this tab, not the whole screen, for pointing".
4. Draw the dot at the mapped point with a small "from pixels" badge, cap the band at amber, and use document.elementFromPoint at that point as the click target so the click loop still advances.
5. Pause must still stop frames at the track (already true); verify gdGrabFrame returns null while paused and that no request is sent.

Demo material: add to platform/practice.html one control that has no DOM name — a canvas-drawn "Download application form" button. In the harness the DOM path should go red or null there, and with sharing on, the vision path should place the dot. Screenshot both.

Update demo-video-script.md scene 4 so it shows the vision dot with the badge, and add one FAQ entry to judge-FAQ.md: "Why does the badge say from pixels?".
~~~~

---

## P5 — Motion clip: how the AI walks the tree

~~~~
Goal: a 30–40 second clip for the demo and the PPT that shows what the presenter cannot show live — the AI going over every control, scoring them, choosing, expanding the next screen, and the dot fading as the learner repeats.

Two outputs. Build A first; it is deterministic and truthful. B is the cinematic version.

A. explainer/tree-traversal.html — a self-contained SVG/Canvas animation, 1920x1080, dark background, no dependencies, with a Play button and ?auto=1 to start immediately. Use the REAL numbers from the harness run (Wallet 0.706 vs Mutual funds 0.473; Amount 0.815 vs Confirm 0.763 → margin 0.052 → 51% red). Scenes and timing:
   0–4 s   A browser window dissolves into a wireframe; every clickable control becomes a node (27 on the home screen).
   4–9 s   The sentence "i want to take my money out" types in; stopwords grey out; "take", "money", "out" glow; synonym expansion fans out (withdraw, cash, paisa, wallet, balance…).
   9–15 s  A scanner sweeps the nodes; each grows a probability bar; Wallet rises to 0.706, Mutual funds to 0.473, the rest stay near zero; the page-evidence checks tick in (+0.30 named, +0.15 role, +0.15 unique, +0.10 on top); the two numbers meet and the weaker one, 64%, prints; the dot turns amber and pulses on Wallet.
   15–20 s A click; the tree expands one level — the Wallet screen's nodes appear beneath; the route strip shows Wallet › Withdraw › Amount › Confirm.
   20–27 s The near-tie: Amount 0.815 and Confirm 0.763 side by side, the margin 0.052 highlighted, the dot goes red, "Not sure — verify this one (51%)".
   27–33 s The full path lights up; then the same path replays three times faster, and the dots fade to nothing: "five clean repetitions and the guidance is gone".
   33–36 s End card: Disha · PS 26207 · "It doesn't do it for you. It teaches you to do it yourself."
   Record with the OS screen recorder at 1080p with the tab focused; save F:\SIH\deck\video\tree-traversal.mp4.

B. Higgsfield version (only if the Higgsfield MCP tools are available in this session; otherwise write the prompts into F:\SIH\deck\video\higgsfield-prompts.md for Saurabh to run). Call get_workflow_instructions first. The catalog (checked 2026-09-09) has two fits: `faceless-video` (type Explainer: multi-scene narrated, consistent non-photoreal style, burned subtitles) for the whole clip, and `video-editing` (Higgsedit: file-backed motion graphics, animated text, overlays, title cards) to add the captions and end card onto the recording from A. Load `faceless-video` for B. Rules: 16:9, no readable UI text in the generated footage (AI video garbles text; overlay captions later), consistent palette (deep navy, white nodes, one amber, one red, one green), abstract nodes-and-edges rather than a real website. One 5–8 s shot per scene above, then stitch. Keep every generated file in F:\SIH\deck\video\higgsfield\.

Deliver: the mp4 from A, the shot list from B with file names, and a two-line note in demo-video-script.md on where the clip goes (between scene 5 and scene 6).
~~~~

---

## P6 — The unified portal: combine the borrowed repos, keep the best mechanism

~~~~
Goal: turn platform/ into the portal Saurabh described — the fragmented open-source solutions combined in one place, with Disha as the core — built as a comparison judges can read rather than as a pile of iframes.

Thirteen repos are already cloned under F:\SIH\borrowed\ (gitignored, reference only): GUI-Actor, OmniParser, VisualTagger, ai-page-assist, browser-use, chrome-element-inspector, element-highlighter, fsrs4anki, intro.js, meeting-minutes, open-notebook, shepherd. The research report research/Fast-Learning Tools, Reusable Repositories, and Pedagogy.md has their licences.

Build:
1. platform/modules.html — one card per capability the portal offers, grouped: Guide (Disha, the core), Practice (the sandbox portals), Remember (spaced revisiting of procedures), See (vision grounding fallback), Tour (authored walkthroughs for portals that ship a pack), Capture (lecture and session notes). For each capability list the repos that do it, and a "mechanism compared, kept X because Y" block: e.g. intro.js vs shepherd (both AGPL — kept the step-anchoring mechanism only as a design reference, wrote our own), GUI-Actor vs OmniParser (kept GUI-Actor: MIT, gives a verifier probability we can map to a band), element-highlighter vs VisualTagger vs chrome-element-inspector (kept the live-rect + mutation-observer lifecycle, dropped absolute document coordinates), browser-use vs ai-page-assist (kept the numbered-element prompt format; dropped autopilot clicking by design). Each block states the licence and whether the code is integrated, adapted, or referenced. Never claim integration that is not in the tree.
2. One real integration, not just a comparison: Remember. Port the FSRS scheduling function from fsrs4anki (MIT) into prototype/guide-dots/lib/remember.js so each mastered recipe (from fade.js mastery counts) gets a next-review date, and the popup shows "due for practice: Withdraw money (BharatInvest)". This is the spaced-retrieval claim on the impact slide (g = 0.74) made real in code. Keep it under 150 lines.
3. platform/index.html: add the Modules nav entry; the landing keeps Disha as the hero.
4. A licence table in platform/modules.html footer: repo, licence, how we use it. Flag AGPL repos as design-reference only.

Verify with the `platform` launch config: every card renders, every link resolves, dark mode holds, no horizontal scroll at 375 px. Screenshot modules.html at 1920x1080 into F:\SIH\deck\assets\portal-modules.png for the PPT.
~~~~

---

## P7 — The GPT Astra mega-brief

~~~~
Goal: write F:\SIH\astra-brief.md — one self-contained prompt Saurabh pastes into GPT Astra so Astra can do the hardest thinking with full context and no access to our files.

Structure the brief exactly like this:
1. ROLE and MISSION (10 lines): Astra is the senior architect and pitch strategist for Disha, SIH 2026 PS 26207, deadline 30 Sept 2026, idea-PPT stage, team of students, prototype exists.
2. HARD RULES: never claim we invented AI screen-pointing (Copilot Vision Highlights shipped first); use only numbers listed in the brief; label every estimate; answer in the output format at the end.
3. CONTEXT, pasted in full, in this order and within a 60k-character budget:
   a. The one-line positioning and the five defensible differentiators from PPT-content-draft.md.
   b. The "claims we must NOT make" list, verbatim.
   c. A 40-line code tour: what each file in prototype/guide-dots does, with the exact gdBand thresholds, the grounding-quality weights, the min() confidence rule, the fade levels, and the offline cap at amber.
   d. The measured numbers from the harness run (both cases from explainer/how-the-dot-is-chosen.html).
   e. The executive summaries of the three research reports (first 40 lines of each).
   f. The killer questions from judge-FAQ.md.
   g. What is built vs not built, honestly: built = DOM+ARIA enumeration, live grounding, honest confidence, fading, ask bar, screen share with track-level pause, offline planner, harness, autoplay; not yet = green dot on stage, vision fallback wired, real-site run, route preview, knowledge packs (adjust this line to whatever P2–P4 have finished by the time you write it).
4. TASKS for Astra, numbered:
   T1. Design the calibration evaluation: a protocol and a metrics table (independent completion rate, time, error rate, help requests, calibration error, 7- and 30-day retention, safe escalation) with sample sizes a student team can run in two weeks on the two practice portals.
   T2. Design the route-planner prompt and its JSON schema (plan, per-step probability, sensitive flags, re-plan rule) so a cheap model returns it reliably.
   T3. Red-team the novelty against Copilot Vision Highlights, WalkMe/Whatfix, Comet, UMANG bot; return the three hardest judge questions we have not prepared for, each with a one-sentence answer.
   T4. Write the six slide narratives for the official template, at most 45 words of body each, using only numbers in the brief.
   T5. Write a 90-second spoken pitch that opens on the 21% statistic and closes on the fade.
   T6. Propose the customer-care economics slide honestly: given Saurabh's framing (a company pays a ₹30,000 monthly salary per support seat, 30–40 seats), compute the annual figure, then state which part of that a per-portal knowledge pack plus Disha could realistically replace and which it cannot, and label every number as an assumption.
5. OUTPUT FORMAT: Markdown, one H2 per task, tables where a table fits, no preamble.

Do not paste secrets. Verify the final brief is under 60k characters and print its size.
~~~~

---

## P8 — Checkpoint and handover

~~~~
Goal: leave the project in a state any teammate or agent can pick up.

1. Write a brain note in the sih folder: "Disha — what changed on <date>" with what was built, what was verified in the browser, the bands table (offline vs live), what is still unwired, and the AgentRouter 401 finding. Then update ONLY the sih block in brain/state: a new `last:` line naming claude-opus-5 and the date, and rewrite `next:` to the true remaining items. Commit the vault with the brain-commit.ps1 hook.
2. Repo: commit F:\SIH on main with a message that lists the files. Confirm config.local.js is still untracked (git ls-files must print nothing for it).
3. Judges' package: a zip of prototype/guide-dots WITHOUT config.local.js, plus demo/README.md, plus a one-page INSTALL.md (Load unpacked → paste a Gemini key → open the practice portal → type a goal). Test the zip by extracting it to a temp folder and loading it once.
4. Remind Saurabh in one line to rotate the AgentRouter key and to delete config.local.js before handing the folder to anyone.
~~~~
