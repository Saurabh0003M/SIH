# SIH 2026 — PS 26202 idea PPT: content blocks
**Status: draft by claude-code, 2026-09-08. Every number below is traced to the three research
reports in `F:\SIH\research`. Map these blocks onto the OFFICIAL SIH template — do not restructure
the official template.**

Working product name: **Disha** (दिशा — "direction"). Working repo name is `guide-dots`.

**One-line positioning (use verbatim, it survived the prior-art audit):**
> A confidence-aware, human-in-the-loop visual navigation copilot for Indian public-service and
> learning interfaces.

---

## 1. Problem

**Open with this. It is the strongest, best-sourced stat available:**
> **Only 21% of rural Indians aged 15–24 can do all three: search the internet, use email, and
> complete online banking.** — MoSPI, Comprehensive Annual Modular Survey 2022–23

Supporting evidence (all official):
- **18.1% of rural Indians aged 15+ were computer literate** (39.6% urban, 24.7% national) — NSS 78th Round, 2020–21.
- **Only 11.4% of connected households use the internet for government services**, and **one in five households using digital services depends on help from outside the household** — NCAER, June 2026.
- The assisted-digital channel processed **48.54 crore transactions in FY 2025–26** across **5,01,731 CSCs** — PIB/MeitY. *(This shows service demand at population scale.)*

**The consequence — what it costs a citizen who cannot self-serve** (label these as *local study
benchmarks*, not national averages):
- Maharashtra government study: **₹47 average service charge + ₹20 travel**, often **3–6 km**, **1–3 trips**.
- Jharkhand 10-district study: **₹101 actually paid** against a **₹30 official** fee; **2–5 hours** per application.

**Say it this way:** the citizen does not fail because the service is missing — the service exists
online. They fail at the *interface*. So they pay someone else to click for them.

---

## 2. Existing system and the gap

| What exists today | What it actually does | Why the gap remains |
|---|---|---|
| UMANG bot, Aadhaar Mitra | Chat/voice answers, status checks | **Tells you in words.** You still have to find the button yourself |
| CSC assisted mode | A human operator does it for you | Costs money and travel; **you learn nothing**, so you return next time |
| BHASHINI | Language infrastructure (22 languages, 7.75B API calls) | Solves *language*, not *procedure* |
| WalkMe / Whatfix / Pendo | On-screen step tours | **Every step is authored in advance** — only works on portals someone paid to script |
| Comet, Strawberry, (ex) Operator/Mariner | AI takes control and clicks for you | Unacceptable for Aadhaar/banking; and again, **the user learns nothing** |

**The gap:** nothing shows a citizen **where to click on their own screen, on any portal, with an
honest confidence, while they stay in control — and teaches them to stop needing it.**

---

## 3. Proposed solution

A floating assistant that watches the page the user is already on:

1. It reads the page's **interactive elements and their accessible names** (buttons, links, fields).
2. A language model picks **the single next element** that serves the user's stated goal.
3. A **confidence-coloured dot** appears on that element — **green** (high), **amber** (medium),
   **red** (low / irreversible action).
4. **The human clicks it.** The system never clicks. On OTP, password or payment steps it **pauses
   and hands control back**.
5. It waits for the page to settle, then points at the next step. And the next.
6. **As the user repeats a task successfully, the dots fade** — until they do it unaided.

---

## 4. Innovation and uniqueness (the 5 defensible ones)

1. **Confidence you can actually see.** The dot's colour is not the model's self-report. The system
   independently scores the page evidence — is the element properly named? does its name match the
   goal? is it unique, or are there look-alikes? is it actually on top? — and **both the model and the
   page evidence must agree before a dot turns green.** An AI that admits when it is unsure.
2. **It guides; it does not take over.** Human-in-the-loop by design, which is what makes it usable
   for Aadhaar, banking and government portals where autopilot agents are unsafe.
3. **It teaches, then gets out of the way.** Guidance fades on demonstrated success and is **restored
   after a mistake** — contingent scaffolding, not a timer. This is what makes it *education*, not
   just navigation.
4. **Works on portals nobody pre-scripted.** It grounds live against whatever is on screen, so it
   does not break when a government portal is redesigned — unlike authored walkthroughs.
5. **Built for Indian public-service and learning tasks**, multilingual via BHASHINI.

**Honesty slide (include it — judges reward this, and it protects the novelty claim):**
> The closest shipped product is **Microsoft Copilot Vision "Highlights."** We do not claim to have
> invented AI screen-understanding or on-screen pointing. Our contribution is the combination:
> calibrated, *exposed* confidence; DOM + ARIA grounding; a fading pedagogical scaffold; and
> India-specific public-service task packs. No shipped product combines these.

---

## 5. Technical approach

**Pipeline**
```
page → enumerate interactive elements + ARIA names → compact text payload
     → LLM returns {element id, confidence, reason}
     → local grounding-quality score → colour band → draw dot
     → human clicks → wait for DOM to settle → next step
```

**Stack:** Manifest V3 Chrome extension, vanilla JavaScript, no build step. Model is pluggable —
Gemini (free tier), Anthropic, or **a fully local model via Ollama for an offline mode**.

**Two engineering decisions worth defending out loud:**
- **DOM + ARIA, not the browser's accessibility tree.** Chrome's computed AX tree requires the
  `debugger` permission; DOM traversal with proper ARIA name resolution is both cheaper and **more
  robust on older government sites**, which often have unlabelled or malformed markup.
- **Text-first, vision only on failure.** Sending a compact text list of elements (not screenshots)
  keeps inference cheap. A vision grounding model (GUI-Actor, MIT-licensed) is the fallback for
  unlabelled/icon-only controls — which keeps the running cost near zero per step.

**Form-factor roadmap:** browser extension (now) → desktop overlay via Windows UI Automation (any
application, not just the browser) → Android AccessibilityService (mobile-first rural users).

---

## 6. Feasibility and viability

**Feasible now:** a working MV3 prototype exists; the grounding, confidence and fading logic are
implemented. *(Update this line with measured results after the first live test run.)*

| Risk | Mitigation |
|---|---|
| Unlabelled / icon-only controls | Grounding-quality score drops → amber/red dot → vision fallback |
| Government portal changes | Re-grounds live on every step; nothing is pre-scripted |
| Model picks the wrong element | Human always clicks — the system cannot act; wrong guesses cost a glance, not a transaction |
| iframes, shadow DOM, SPAs | Per-frame injection, shadow traversal, DOM-quiet re-grounding |
| Privacy | Only element names and roles leave the device — never page content, never credentials; offline local-model mode available |
| Running cost | Compact text payload + a cheap model; vision only on escalation |

---

## 7. Impact and benefits

- **Social:** independence for citizens who currently depend on a paid intermediary to use services they are entitled to.
- **Economic:** avoids the per-visit intermediary and travel cost documented above (₹47 + ₹20 travel, 1–3 trips, Maharashtra study benchmark).
- **Educational:** the design follows the strongest evidence in learning science — **active learning improved performance by 0.47 SD across 225 undergraduate STEM studies** (Freeman et al., PNAS 2014); **retrieval practice g = 0.51** vs restudy; **spaced retrieval g = 0.74**. *(These validate the mechanism — learning by doing with fading guidance — not this product's outcome.)*
- **Governance:** **zero integration cost.** It runs on top of existing portals, so no ministry has to rebuild anything for it to work.
- **Language:** **57% of urban internet users preferred Indic-language content in 2024** (IAMAI–Kantar); guidance can be spoken in the user's mother tongue via BHASHINI — the same capability our team's PS 26042 entry builds.

---

## 8. Validation plan (say this — it shows scientific maturity)

No existing national dataset measures our exact target outcome, so we will measure it: a randomized
task study on real government portals measuring **independent completion rate, time to complete,
error rate, number of help requests, confidence calibration, retention after 7–30 days, and safe
escalation to a human.**

---

## ⚠️ Claims we must NOT make (these will be fact-checked)

1. ❌ "75% of Indians cannot complete a government task." **No such national measure exists.** Use the 21% rural ICT-skill figure, phrased as a combined ICT-skill measure.
2. ❌ "48.54 crore citizens can't self-serve." That number is **transactions**, not people — it may repeat users and includes commercial activity.
3. ❌ "SWAYAM has a 90.9% dropout rate." Enrolments are cumulative and certification is often a paid optional exam.
4. ❌ "89% of Indians aren't comfortable in English." Census language reporting ≠ digital comfort. Use the 57% Indic-content-preference figure instead.
5. ❌ "Active learning proves our product improves outcomes by 0.47 SD." It validates the **mechanism**, not our product.
6. ❌ "We invented AI-guided on-screen navigation." Copilot Vision Highlights ships today.
7. ❌ A single authoritative EdTech market size — estimates range US$2.8B–12.75B by definition. Always attach the source and its scope.

## Key sources
MoSPI CAMS 2022–23 · NSS 78th Round · NCAER June 2026 · PIB/MeitY (CSC) · Maharashtra CSC quality
study · Jharkhand 10-district CSC study · Freeman et al. PNAS 2014 · Adesope et al. 2017 · Latimier
et al. 2021 · IAMAI–Kantar Internet in India 2024 · BHASHINI metrics dashboard · Microsoft Copilot
Vision release notes · microsoft/GUI-Actor (MIT)
