# numbers.md — every figure on the deck, and where it came from

**Rule: if a number is not in this table, it does not go on a slide.** Each row gives the exact
source line in `F:\SIH\research\` so a teammate can open the file, read the surrounding paragraph,
and paste the footnote without asking anyone.

Two research files carry all the external evidence:

- `EVIDENCE` = `research/India Evidence Audit  Navigation Copilot for Public-Service and Education Interfaces.md`
- `PEDAGOGY` = `research/Fast-Learning Tools, Reusable Repositories, and Pedagogy.md`
- `PRIORART` = `research/Prior-Art Review  AI-Guided On-Screen Navigation.md`

---

## A. Figures about the problem

| # | Figure, worded exactly as it may be said | Source line | The caveat you must not drop |
|---|---|---|---|
| A1 | **Only 21% of rural Indians aged 15–24 can do all three: search the internet, use email, and complete online banking.** — MoSPI, Comprehensive Annual Modular Survey 2022–23 | `EVIDENCE:77` (also `:39`, `:69`) | It is a **combined ICT-skill** measure, not a "can't use a government website" rate. India has **no** national task-completion benchmark. |
| A2 | **18.1% of rural Indians aged 15+ were computer literate** (39.6% urban, 24.7% national) — NSS 78th Round, 2020–21 | `EVIDENCE:11` | Self-reported general capability. **Never take the complement** ("so 75.3% cannot…") — `EVIDENCE:39` says so explicitly. |
| A3 | **Only 11.4% of connected households use the internet for government services**; **one in five** households using digital services depends on help from **outside the household** — NCAER, June 2026 | `EVIDENCE:13` | Marked **"CONFIRMED, but not an inability rate"** in the source. It measures use, not ability. |
| A4 | The assisted-digital channel processed **48.54 crore transactions in FY 2025–26** across **5,01,731 CSCs** — PIB/MeitY | `EVIDENCE:15` | Say **transactions**, never people. `EVIDENCE:43` flags "48.54 crore citizens" as the single most likely thing to get fact-checked. The FY figure is apparently part-year/provisional. |
| A5 | Maharashtra government study: **₹47 average service charge**; Jharkhand 10-district study: **₹101 actually paid** against a **₹30 official** fee | `EVIDENCE:17` | **"CONFIRMED locally; DISPUTED as a national typical fee."** Always say *"in a Maharashtra study"* / *"in a Jharkhand study"* — never "Indians pay ₹47". |

## B. Figures about learning (they validate the mechanism, not the product)

| # | Figure | Source line | The caveat you must not drop |
|---|---|---|---|
| B1 | **Active learning improved assessed performance by 0.47 SD across 225 undergraduate STEM studies** — Freeman et al., PNAS 2014 | `EVIDENCE:25` (and `PEDAGOGY:44`) | `EVIDENCE:55`: it supports the **mechanism** of active participation over lecture — "not product efficacy, Indian public-service navigation, or AI tutoring." |
| B2 | **Retrieval practice vs restudy: g = 0.51** (118 articles, 15,427 participants) | `EVIDENCE:26` | Comparator is restudy. |
| B3 | **Spaced vs massed retrieval: g = 0.74** after publication-bias correction | `EVIDENCE:27` | Comparator is **massed retrieval, not passive study**. `EVIDENCE:57`: B2 and B3 **must not be added together**. |
| B4 | Guidance fading should be **triggered by mastery evidence, not elapsed time** — Renkl et al. | `PEDAGOGY:48` | Same line warns that **fixed, non-contingent fading can be inferior to keeping support**. Our fade is contingent (count-based, restored on error), which is the defensible version. |

## C. Figures about language

| # | Figure | Source line | The caveat you must not drop |
|---|---|---|---|
| C1 | **57% of urban internet users preferred Indic-language content in 2024** — IAMAI–Kantar ICUBE | `EVIDENCE:28` (framing at `:61`, `:72`) | Use this **instead of** any "89% of Indians aren't comfortable in English" line — Census language reporting ≠ digital comfort. |
| C2 | **BHASHINI: 22 Indian languages, 7.75B API calls, 4.32T characters** (Sep 2023 – Jun 2026) | `EVIDENCE:30` | It is **language infrastructure**, not evidence that translation solves a procedural barrier. |

## D. Prior art (the honesty line)

| # | Statement | Source line | Note |
|---|---|---|---|
| D1 | **Microsoft Copilot Vision with "Highlights" is the closest shipped product**: it highlights the element to click and lets the human click it. | `PRIORART:9`, `:20` | Its public documentation **does not expose per-target confidence** and does not confirm a DOM/accessibility fusion architecture — that gap is our claim, and it is a *narrow* one. |
| D2 | "Infer a click target from a screenshot" is **not novel alone** | `PRIORART:59` | Copilot Vision, GUI-Actor, UGround all do visual grounding. |
| D3 | Copilot Vision Highlights is **direct prior art against the broad claim**, but not clearly against the narrower combination (fusion + exposed calibrated confidence + colour semantics + government/learning specialisation) | `PRIORART:47` | This sentence is the exact shape of what we may claim. |

## E. Numbers measured in our own prototype

Measured by driving the real harness at `http://localhost:8777/demo/index.html` on **9 Sept 2026**,
offline planner, no model, no network. Reproduce with `prototype/guide-dots/demo/` and the goal
`i want to take my money out`. **These are the only performance numbers we own.**

| # | Figure | Where it comes from | Caveat |
|---|---|---|---|
| E1 | Four-step run: **Wallet 64% amber → Withdraw 57% amber → Amount to withdraw 51% RED → Confirm and send money 75% amber** | `deck/assets/demo-step1..4.png`, all four visible in the panel of `demo-step4.png` | **Offline matcher only.** `lib/ground.js:106` caps an offline result below green by design, so nothing here can be green. |
| E2 | The red step: amount field **0.815** vs confirm button **0.763**, a margin of **0.052** | `deck/assets/explainer-red-case.png`; source data `explainer/how-the-dot-is-chosen.html:461–466` | This is the honesty demo: a win by 0.052 is reported as a win by 0.052. |
| E3 | Grounding-quality weights: **+0.30** has an accessible name · **+0.15** a role people act on · **+0.15** only one control has this name · **+0.10** actually the topmost thing at that point | `lib/ground.js` (`gdGroundingQuality`), rendered in `explainer-red-case.png` | Hand-set weights. **They are not calibrated against labelled data** — say "we expose the score", never "our confidence is calibrated". |
| E4 | Band thresholds: **green** needs model ≥ 0.80 **and** page quality ≥ 0.75; **amber** needs ≥ 0.55 on both; anything else is **red** | `lib/ground.js:47–49` | Both numbers must clear the bar — that is the "both must agree" claim, in code. |
| E5 | The number shown is **min(model, page quality)**, never the average | `lib/ground.js:112–116` | Written after a bug printed "Not sure (61%)". Worth saying out loud; it is the clearest proof the honesty is engineered, not decorative. |
| E6 | Fading levels: **1 success → labels off · 3 → faded · 5 → dot gone**; opacity `max(0.15, 1 − 0.18 × count)` | `lib/fade.js:50–60` | Contingent on success and **restored after a wrong click** — which is what `PEDAGOGY:48` says fading must be. |
| E7 | **27 interactive controls** enumerated on the demo home screen | `explainer-red-case.png` panel 2; harness console | Specific to this fictional page. Not a benchmark. |

## F. Numbers we do NOT have — do not invent them

- No accuracy figure. We have **not** measured how often the dot is on the right control across sites.
- No user-study result. The randomised task study on slide 4 is a **plan**, not a finding.
- No green dot on stage yet: with no live model, the offline path is amber-at-best **by design** (E1).
- No real-government-portal run has been recorded. Say "verified on our two practice portals."
- No cost-per-step figure. "A small text request on a cheap model" is a design claim, not a measurement.
