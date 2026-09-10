# Disha — FINAL slide text, mapped onto the official SIH idea-PPT template

**Rewritten 9 Sept 2026 against the actual template**, which is in this repo at
`reference/past winning teams/805306823-SIH-Winner-PPT.pdf` — that file is misnamed. It is not a
winner's deck: pages 1, 4, 5 and 6 are the **blank official template**, pages 2 and 3 were filled in
by a team called CODESTRIX, and page 7 is the official instructions page.

## Read this before you touch a slide

The template's own instructions page says, verbatim:

1. **Maximum six slides, including the title slide.**
2. **Avoid paragraphs** — put the idea in points / diagrams / infographics / pictures.
3. Keep the explanation precise and easy to understand.
4. The idea should be unique and novel.
5. **Use only the provided template, without changing the idea-details pointers** named on each slide.
6. **Save as PDF and upload that.** No PPT, no Word — the portal takes nothing else.
7. Delete the instructions slide before uploading.

Two consequences we have to live with:

- **The slide titles are fixed** — `TITLE PAGE`, `IDEA TITLE`, `TECHNICAL APPROACH`,
  `FEASIBILITY AND VIABILITY`, `IMPACT AND BENEFITS`, `RESEARCH AND REFERENCES`. Only slide 2's
  title is ours to write, because "IDEA TITLE" is a placeholder for the name of the idea. Any clever
  headline goes *inside* a box, never in the title.
- **The sub-pointers under each heading are fixed too.** They are reproduced below in `code font`.
  Keep them.

**⚠️ The template in this folder is the SIH 2024 edition.** Rule 5 says use *the provided* template,
so download the **2026** file from the SIH portal and paste this text into that. The section
structure is stable — the 2025 winner deck (`Lanezy PPT main.pdf`) uses the same six sections — so
nothing below needs rewriting, but the logo, the year and the footer must come from the 2026 file.

## Word budget

The template gives each slide **two or three boxes**. Aim for **≤45 words per box**, not per slide —
that lands slides 2–5 at roughly 100–135 words, which is what the winning decks actually run. Below
45 words a box looks empty on this template; above it, you are writing the paragraphs rule 2 bans.

---

## Slide 1 — `TITLE PAGE`

Fill the six template fields exactly as they are named. Nothing else goes on this slide.

| Field | Value |
|---|---|
| `Problem Statement ID –` | **26202** |
| `Problem Statement Title-` | **Student Innovation** *(bring-your-own idea)* |
| `Theme-` | **Smart Automation** |
| `PS Category- Software/Hardware` | **Software** |
| `Team ID-` | *leave blank* — issued only after the intercollege round |
| `Team Name (Registered on portal)` | **Code Blooded** |

Put **Code Blooded** in the oval at the top-left of slides 2–6 as well; that oval is on every
template slide and reads "Your Team Name" until you replace it.

> Speaker's first line, not on the slide: *"Only 21% of rural Indians aged 15–24 can search online,
> use email and bank online. The services exist. People fail at the interface."*

---

## Slide 2 — `IDEA TITLE`

**Slide title (this one is ours to write):**
> **Disha — it points, you click, and then it fades**

### Box 1 — `IDEA / SOLUTION :`  *(41 words)*

Disha reads the page's own controls and their accessible names, then marks the **one** next step with
a colour-coded dot.

- **You click. Disha never can.** At an OTP or payment step it pauses and hands control back.
- Every success dims the dot; **five clean repetitions remove it entirely.**
- Runs on any portal — nothing is scripted in advance.

### Box 2 — `Problem Resolution :`  *(44 words)*

- A citizen who does not know the word *withdraw* still finishes the task — **and finishes it themselves.**
- No paid intermediary, no travel, no "come back next week".
- Because it points instead of clicking, it is safe on Aadhaar, banking and scholarship portals where an autopilot agent is not.

### Box 3 — `Unique Value Propositions (UVP) :`  *(43 words)*

- **Confidence you can see.** The dot's colour is not the model's self-report — the page evidence is scored separately and both must agree.
- **It teaches, then leaves.** Guidance fades on success, returns after a mistake.
- **Zero integration cost.** No ministry rebuilds anything.

### Honesty line — keep it on this slide, small, at the bottom

> Closest shipped product: **Microsoft Copilot Vision "Highlights."** We do not claim to have
> invented on-screen pointing. Ours is the combination — exposed confidence, DOM + ARIA grounding,
> a fading scaffold, and India-specific task packs.

`visual: demo-step3.png` — the red dot on the amount field, all four steps visible in the panel.
Second image if the layout allows: `demo-hovercard.png`.

---

## Slide 3 — `TECHNICAL APPROACH`

### Box 1 — `Technologies used`  *(38 words)*

- **Manifest V3 Chrome extension**, vanilla JavaScript, no build step.
- **Model is pluggable** — Gemini free tier, Anthropic, or a **local Ollama model with no internet**.
- **DOM + ARIA**, not Chrome's accessibility tree — that needs the `debugger` permission and breaks on old government markup.
- Vision grounding (GUI-Actor, MIT) is the documented fallback.

### Box 2 — `Methodology and process for implementation`  *(37 words)*

```
page → enumerate interactive elements + ARIA names → compact text list
     → model returns {id, confidence}
     → on-device grounding score → colour band → draw dot
     → human clicks → wait for DOM to settle → next step
```

- Green needs **0.80** model **and** **0.75** page evidence.
- We display **the weaker of the two numbers**, never the average — so the number can never contradict the colour.

### Box 3 — Product status *(CODESTRIX put one on this slide; copy the idea)*

> **Working prototype, verified end-to-end in a browser:** live grounding, colour bands, contingent
> fading, on-page ask bar, screen share with a real pause, offline mode. Vision fallback and the
> live-model green dot are next.

`visual: architecture.png`

---

## Slide 4 — `FEASIBILITY AND VIABILITY`

Keep all three prescribed pointers and their sub-labels.

### `Analysis of the feasibility of the idea` — `Technical, Financial, Market, Operational` *(44 words)*

- **Technical:** built and running today; DOM + ARIA works on portals we do not control.
- **Financial:** a compact text request per step on a free-tier model; local model = zero.
- **Operational:** installs as an extension. No ministry integration, no portal changes.

### `Potential challenges and risks` — `Technical, Financial, Market, Operational` *(43 words)*

- **Unlabelled / icon-only controls** — our weakest case.
- **Model picks the wrong element.**
- **Trust:** users may over-rely on a confident-looking dot.
- **Market:** Copilot Vision already points at things.

### `Strategies for overcoming these challenges` — `Methods, principle, Strategies, Algorithms` *(45 words)*

- Unlabelled controls **drop the page score → the dot goes red**, never a silent guess; vision grounding is the fallback.
- A wrong pick costs a glance, not a transaction — **the human always clicks.**
- Over-reliance is answered by the fade itself.

`visual: explainer-red-case.png` — 0.815 vs 0.763, margin 0.052, verdict "NOT SURE 51%".

**The measured run, if you want a number on this slide:** "i want to take my money out" produced
**64% → 57% → 51% red → 75%** on our practice portal. Say plainly that this run used the **offline
matcher with no model**, which is **capped below green by design**, and that **accuracy is unmeasured.**

---

## Slide 5 — `IMPACT AND BENEFITS`

Keep both prescribed pointers and their sub-labels.

### `Potential impact on the target audience` *(44 words)*

- **Positive — improvement:** the citizen completes the task alone instead of paying someone to click.
- **New opportunities:** a teacher or NGO worker walks a task once and it becomes a pack others reuse.
- **Negative — technology adoption:** it needs a browser and a first install.

### `Benefits of the solution (social, economic, environmental, etc.)` *(43 words)*

- **Social — improved access, empowerment:** independence on services people are already entitled to.
- **Economic — cost:** avoids the per-visit intermediary and travel documented in the CSC studies.
- **Educational:** guidance fades on demonstrated success — active learning **+0.47 SD**, spaced retrieval **g = 0.74**.

`visual: practice-portal.png`

**Supporting lines for the speaker, not on the slide:**
- Only **11.4%** of connected households use the internet for government services; **one in five**
  households using digital services depends on help from outside the household (NCAER, June 2026).
- A **Maharashtra** study recorded **₹47** in service charges plus travel; a **Jharkhand** study
  recorded **₹101 actually paid** against a **₹30** official fee. Say *"a study recorded"*, never
  *"Indians pay"*.
- **57%** of urban internet users preferred Indic-language content in 2024 — guidance can be spoken
  in the mother tongue through BHASHINI.
- Both learning figures **validate the mechanism, not our product.** Say that out loud.

---

## Slide 6 — `RESEARCH AND REFERENCES`

Pointer: `Details / Links of the reference and research work`

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

---

## The links gap — decide this before submitting

Both winner decks put **clickable links** on their slides, in a little cloud callout: Lanezy had
*Video* and *Website* on slide 2 and *Report* and *GitHub* on slide 3. It is free credibility, and a
judge who clicks through has seen your prototype before they read a word.

**We currently have nothing public to link.** `F:\SIH` has **no git remote**, the demo runs on
`localhost`, and the explainer page is a private artifact. Before submission, either:

1. push the repo to a public GitHub and link it, and/or deploy `platform/` + the demo harness to a
   free static host and link that; or
2. make the explainer artifact link shareable; or
3. put no links on the deck — but then say in the room that the prototype is runnable, and have it
   open in a tab.

Do not put a `localhost` URL on a submitted slide.

---

## Asset map

| Slide | Image | What it shows |
|---|---|---|
| 1 | *(none — the template's own art fills it)* | |
| 2 | `assets/demo-step3.png` | The red dot on the amount field; all four steps and percentages in the panel |
| 2 (spare) | `assets/demo-hovercard.png` | The proximity card open beside the dot |
| 3 | `assets/architecture.png` | Read → Decide → Guide, the "both must agree" node, the privacy boundary |
| 4 | `assets/explainer-red-case.png` | 0.815 vs 0.763, margin 0.052, verdict "NOT SURE 51%" |
| 5 | `assets/practice-portal.png` | Vidya Setu practice sandbox — a government-shaped portal we can demo safely |
| spare | `assets/portal-home.png` | The landing page: "It doesn't do it for you. It teaches you to do it yourself." |
| spare | `demo-step1/2/4.png`, `demo-arrow.png` | The other three steps, and the off-screen scroll arrow |

All images are **1920×1080 PNG**, light theme, no browser chrome, captured from the running
prototype on **9 Sept 2026**. Nothing is a mock-up.

---

## ⚠️ Checklist — before this deck leaves your hands

**Template compliance**
- [ ] Six slides, **including** the title slide. The instructions slide is deleted.
- [ ] Built on the **2026** template downloaded from the SIH portal, not the 2024 file in this repo.
- [ ] The fixed slide titles and the sub-pointers under each heading are unchanged.
- [ ] **Code Blooded** is in the oval on slides 2–6; Team ID filled in once the intercollege round is cleared.
- [ ] Exported to **PDF** — that is the only format the portal accepts.
- [ ] No `localhost` links anywhere.

**Claims we must NOT make** — every one of these will be fact-checked
- [ ] ❌ **"75% of Indians cannot complete a government task."** No such measure exists. Use **21%**, described as a combined ICT-skill measure.
- [ ] ❌ **"48.54 crore citizens can't self-serve."** That counts **transactions** — it repeats users and includes commercial activity.
- [ ] ❌ **"SWAYAM has a 90.9% dropout rate."** Enrolments are cumulative; certification is a paid optional exam.
- [ ] ❌ **"89% of Indians aren't comfortable in English."** Census language reporting ≠ digital comfort. Use **57%**.
- [ ] ❌ **"Active learning proves our product improves outcomes by 0.47 SD."** It validates the **mechanism**.
- [ ] ❌ **"We invented AI-guided on-screen navigation."** Copilot Vision Highlights ships today — we say so on slide 2.
- [ ] ❌ **A single authoritative EdTech market size.** Estimates range US$2.8B–12.75B by definition.
- [ ] ❌ **"Indians pay ₹47 for a government service."** Say *"a Maharashtra study recorded ₹47"*.
- [ ] ❌ **Any accuracy number.** We have not measured accuracy. Quote only the four percentages from our own run.
- [ ] ❌ **"It works on every website."** Say which portals we have actually run it on: our two practice portals.
- [ ] ❌ **"The vision fallback works."** Frames are captured; **nothing consumes them yet.**
