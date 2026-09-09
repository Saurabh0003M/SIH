# Disha — FINAL slide text for the official SIH 2026 idea PPT

**How to use this file.** The official template has **exactly six slides** and they are fixed —
do not add, merge, split or reorder them. For each slide below: paste the **Headline** into the
slide title, paste the **Body** bullets as-is, and place the image named on the `visual:` line.
Every figure used here is traced in [`numbers.md`](numbers.md); every image is in `assets/`.

Body text is capped at **45 words per slide** on purpose. If it does not fit in 45 words it is a
talking point, not a slide — put it in the script, not on the wall.

**Two blanks only you can fill (slide 1):** `<TEAM ID>` and `<TEAM NAME>`. I have not invented them.

---

## Slide 1 — Title

**Headline (9 words):** Disha — guidance that teaches you to stop needing it

**Body:**
- Problem Statement ID: **26207**
- Problem Statement Title: **Student Innovation — bring-your-own idea**
- Theme: **Smart Education**
- PS Category: **Software**
- Team ID: `<TEAM ID>`
- Team Name: `<TEAM NAME>`

`visual: portal-home.png`

> Speaker's first line, not on the slide: *"Only 21% of rural Indians aged 15–24 can search online,
> use email and bank online. The services exist. People fail at the interface."*

---

## Slide 2 — Idea Title and Proposed Solution

**Headline (7 words):** It points. You click. Then it fades.

**Body (42 words):**
- Disha reads the page's own controls and their accessible names, then marks the **one** next step with a colour-coded dot.
- **You click. Disha never can.** At an OTP or payment step it pauses and hands control back.
- Every success dims the dot; five clean repetitions remove it entirely.

**Footer line — keep this, do not cut it for space:**
> The closest shipped product is **Microsoft Copilot Vision "Highlights."** We do not claim to have
> invented AI screen-understanding or on-screen pointing. Our contribution is the combination:
> exposed confidence, DOM + ARIA grounding, a fading scaffold, and Indian public-service task packs.

`visual: demo-step3.png`
*(The red dot on the amount field, with all four steps and their percentages visible in the panel.
Optional second image if the template has room: `demo-hovercard.png`.)*

**How it addresses the problem, in one sentence for the speaker:** a citizen who does not know the
word *withdraw* still finishes the task, and finishes it themselves.

---

## Slide 3 — Technical Approach

**Headline (8 words):** Two judgements must agree before you see green

**Body (44 words):**
- Manifest V3 Chrome extension, vanilla JavaScript, no build step. Model is pluggable: Gemini free tier, Anthropic, or a **local Ollama model with no internet**.
- The model returns one element id and its confidence. Separately, **on-device**, we score the page evidence.
- Green needs 0.80 model **and** 0.75 page evidence; we display the weaker number, never the average.

**Process flow (this is what the diagram shows):**
`page → enumerate interactive elements + ARIA names → compact text list → model returns {id, confidence} → on-device grounding score → colour band → draw dot → human clicks → wait for DOM to settle → next step`

`visual: architecture.png`

**Two decisions worth defending out loud, if asked:**
1. **DOM + ARIA, not Chrome's accessibility tree** — the computed AX tree needs the `debugger`
   permission; DOM traversal is cheaper and more robust on older government markup.
2. **Text-first, vision only on failure** — we send control names, not screenshots, so a step costs
   a small text request. Vision grounding is the documented fallback, **not built in this version**.

---

## Slide 4 — Feasibility and Viability

**Headline (6 words):** Working prototype today; risks named honestly

**Body (45 words):**
- **Built and verified in a browser:** live grounding, colour bands, contingent fading, on-page ask bar, screen share with a real pause, offline mode.
- **Unlabelled controls?** The page score drops and the dot goes red — it never guesses silently.
- **Portal redesigned?** Nothing is pre-scripted; it re-grounds on every step.

`visual: explainer-red-case.png`

**The measured run (say the numbers, they are ours):** on our practice portal, "i want to take my
money out" produced **64% → 57% → 51% red → 75%**. The red step is the point: the amount field
scored **0.815** and the confirm button **0.763** — a win by **0.052** is reported as a win by 0.052.

**Say this if pressed:** that run used the **offline matcher with no model**, which is capped below
green by design. We have not yet recorded a green dot on stage, and we have not measured accuracy.

---

## Slide 5 — Impact and Benefits

**Headline (7 words):** Independence, not another helper that never leaves

**Body (41 words):**
- **Social:** the citizen completes the task alone, instead of paying someone else to click for them.
- **Educational:** guidance fades on demonstrated success — active learning **+0.47 SD**, spaced retrieval **g = 0.74**.
- **Governance:** zero integration cost. It runs on portals that already exist.

`visual: practice-portal.png`

**Supporting lines for the speaker (not on the slide):**
- Only **11.4%** of connected households use the internet for government services; **one in five**
  households using digital services depends on help from outside the household (NCAER, June 2026).
- A Maharashtra study recorded **₹47** in service charges plus travel; a Jharkhand study recorded
  **₹101 actually paid** against a **₹30** official fee.
- **57%** of urban internet users preferred Indic-language content in 2024 — guidance can be spoken
  in the mother tongue through BHASHINI.
- Both learning figures **validate the mechanism, not our product.** Say that out loud.

---

## Slide 6 — Research and References

**Headline (5 words):** What we read before building

**Body:**
- **MoSPI**, Comprehensive Annual Modular Survey 2022–23 — the 21% combined ICT-skill figure.
- **NSS 78th Round (2020–21)** — computer literacy 24.7% national, 18.1% rural.
- **NCAER**, *The Evolving Landscape of Digital Inclusion in India*, June 2026.
- **PIB / MeitY** — CSC network: 48.54 crore transactions, 5,01,731 centres, FY 2025–26.
- **Freeman et al., PNAS 2014** — active learning, +0.47 SD across 225 studies.
- **Adesope et al. 2017** (retrieval, g = 0.51) · **Latimier et al. 2021** (spacing, g = 0.74).
- **Renkl et al.** — guidance fading triggered by mastery evidence, not elapsed time.
- **Microsoft Copilot Vision release notes** — the closest shipped prior art.
- **IAMAI–Kantar, Internet in India 2024** · **BHASHINI metrics dashboard**.
- **microsoft/GUI-Actor** (MIT) — the vision-grounding fallback on our roadmap.

`visual: none — keep this slide text-only`

---

## Asset map

| Slide | Image | What it shows |
|---|---|---|
| 1 | `assets/portal-home.png` | The portal landing: "It doesn't do it for you. It teaches you to do it yourself." |
| 2 | `assets/demo-step3.png` | The red dot on the amount field; all four steps and percentages in the panel |
| 2 (spare) | `assets/demo-hovercard.png` | The proximity card open beside the dot |
| 3 | `assets/architecture.png` | Read → Decide → Guide, with the "both must agree" node and the privacy boundary |
| 4 | `assets/explainer-red-case.png` | 0.815 vs 0.763, margin 0.052, verdict "NOT SURE 51%" |
| 5 | `assets/practice-portal.png` | Vidya Setu practice sandbox — a government-shaped portal we can demo safely |
| demo/appendix | `assets/demo-step1.png`, `demo-step2.png`, `demo-step4.png` | The other three steps of the same run |
| demo/appendix | `assets/demo-arrow.png` | The scroll-down arrow when the target is off-screen |

All images are **1920×1080 PNG**, light theme, no browser chrome, captured from the running
prototype on **9 Sept 2026**. Nothing is a mock-up.

---

## ⚠️ Checklist — claims we must NOT make

Tick these before the deck leaves your hands. Every one of them will be fact-checked.

- [ ] ❌ **"75% of Indians cannot complete a government task."** No such national measure exists. Use the **21%** rural ICT-skill figure and call it a combined ICT-skill measure.
- [ ] ❌ **"48.54 crore citizens can't self-serve."** That number counts **transactions** — it can repeat the same person and includes commercial activity.
- [ ] ❌ **"SWAYAM has a 90.9% dropout rate."** Enrolments are cumulative and certification is a paid optional exam.
- [ ] ❌ **"89% of Indians aren't comfortable in English."** Census language reporting is not digital comfort. Use the **57%** Indic-content-preference figure.
- [ ] ❌ **"Active learning proves our product improves outcomes by 0.47 SD."** It validates the **mechanism**, not our product.
- [ ] ❌ **"We invented AI-guided on-screen navigation."** Copilot Vision Highlights ships today — and we say so on slide 2.
- [ ] ❌ **A single authoritative EdTech market size.** Estimates range US$2.8B–12.75B by definition; always attach the source and its scope.
- [ ] ❌ **"Indians pay ₹47 for a government service."** Say *"a Maharashtra study recorded ₹47"* — it is a local benchmark, not a national fee.
- [ ] ❌ **"Our AI is 99% accurate" / any accuracy number.** We have not measured accuracy. Quote only the four percentages from our own run.
- [ ] ❌ **"It works on every website."** Say which portals we have actually run it on: our two practice portals.
- [ ] ❌ **"The vision fallback works."** Frames are captured; **nothing consumes them yet.** It is on the roadmap, not in this build.
