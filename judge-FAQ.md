# Disha — judge Q&A bank
**Rule for the whole session: answer in one sentence, then stop.** Over-explaining reads as
uncertainty. If they want more, they will ask. Every number below traces to a source in
`F:\SIH\research` — never invent one on stage.

**When you don't know:** *"I don't know — here's how we'd find out."* Judges forgive that instantly.
They do not forgive a confident wrong answer, because they will test the next one harder.

---

## The killer questions (rehearse these until automatic)

**"Microsoft Copilot Vision already does this. What's new?"**
> You're right, and we say so on our own slide. Copilot Vision points at things — we don't claim to
> have invented that. What no shipped product does is show you *how confident it is and why*, fade the
> guidance as you learn, and target Indian student and public-service portals. Pointing is the
> commodity. Knowing when not to trust the pointer is the product.

**"Isn't this just WalkMe / Whatfix / a tutorial tool?"**
> Those need a developer to author every step in advance, for one specific product. Ours reads
> whatever is on the screen, so it works on a portal nobody paid us to script — and it doesn't break
> when that portal is redesigned.

**"Isn't this just ChatGPT with extra steps?"**
> ChatGPT describes a path in words — "go to profile, then settings." That fails exactly when the
> screen doesn't look like the description. We point at the actual pixel on your actual screen, and
> we tell you how sure we are.

**"What if the AI is wrong?"**
> Then you've wasted a glance, not a transaction — because the human always clicks, and the system
> never can. That's a deliberate design constraint, not a limitation we haven't got to yet.

**"Your demo only worked on one site. Is it hardcoded?"**
> No — and here's the same thing running on a site I haven't prepared. *(Have that second clip ready.
> If you can't demo it live, say: "It grounds live against any page; today I've verified it on these
> two.")* Never claim more sites than you have actually run.

**"What's your biggest weakness?"**
> Unlabelled, icon-only buttons. Badly built sites give us nothing to reason about — and that's
> exactly when we show an amber or red dot instead of pretending. Our fallback is a vision model,
> which is on the roadmap, not in this build.

---

## Novelty and positioning

**"What is genuinely new here?"**
> One sentence: guidance that tells you how much to trust it, and removes itself as you learn.

**"Who else is in this space?"**
> Autopilot agents — Comet, Strawberry, and OpenAI's discontinued Operator — try to *do the task for
> you*. We deliberately went the other way, because an agent that clicks for you on a banking or
> Aadhaar portal is unsafe, and it teaches the user nothing.

**"Why not just let the AI do it automatically?"**
> Because our problem statement is education. If the AI does it, the student learns nothing and needs
> it forever. The point is for them to stop needing us.

---

## Technical

**"How does it know where to click?"**
> It reads the page's own structure — every button, link and field, with the accessible names that
> screen readers use. Then a language model picks the one that matches your goal.

**"How is the confidence calculated?"** *(Your strongest technical answer — use the diagram.)*
> Two independent judgements. The model gives its own confidence. Separately, on the device, we score
> the page evidence: does the element have a real name, does that name match the goal, is it unique
> or are there look-alikes, is it actually on top or covered? Both must agree before you get a green
> dot. A model marking its own homework isn't evidence.

**"Why an extension and not a website or an app?"**
> A website can't read or draw on top of *another* website — browsers forbid it. The extension is the
> only place this can run today. Desktop and Android versions are the roadmap.

**"Why not screen sharing or computer vision?"**
> In a browser, reading the page directly is more accurate than looking at pixels — we get exact
> element boundaries instead of guessing them. Vision is our fallback for sites that give us nothing,
> not our default.

**"Does it work offline?"**
> The guidance model can run locally, yes. That matters for our users — but I'd call it demonstrated
> in principle, not production-ready.

**"What does it cost to run?"**
> We send a compact list of control names, not screenshots — so it's a small text request per step,
> on a cheap model. Explanations are cached per page, so the second student on the same page costs
> nothing.

---

## Theme fit (they will ask — PS 26202 is **Smart Automation**, not Smart Education)

**"How is this education and not just a helper tool?"**
> Because the help is designed to disappear. Every time the student completes a step alone, the
> guidance dims; when they get it wrong, it comes back. That's scaffolding with fading — the same
> pattern a good teacher uses.

**"What's the learning science behind it?"**
> Three things: active learning beat lecturing by 0.47 standard deviations across 225 studies;
> worked examples that fade produce independence; retrieval and spacing produce retention. We turned
> the fading part into software.

**"How would you prove students actually learn?"**
> A randomised task study: unaided completion rate, time taken, errors, how often they asked for
> help, and retention after 7 to 30 days. We haven't run it yet — no national dataset measures this,
> so we'd have to generate the evidence ourselves.

**"Who is the user — the student or the college?"**
> Both, and that's the design. The student gets the extension; the institution gets the dashboard
> showing which skills each student can now perform unaided.

---

## Safety and privacy

**"Can it see my password?"**
> Only the *names* of controls leave the device — never what you type. And at any password, OTP or
> payment step it pauses and hands control back to you.

**"Could it be used to trick someone?"**
> It can't act — it can only point, and the person decides. That's precisely why we refused to build
> an autopilot.

---

## Business and scale

**"Who pays?"**
> Institutions, not students. A college or a skilling programme pays for the dashboard and the task
> packs; the student's extension stays free.

**"How does this scale without government cooperation?"**
> That's the point — it runs on top of portals that already exist, so no ministry has to rebuild
> anything for it to work. A teacher or an NGO worker walks a task once and it becomes a verified
> pack others reuse.

**"What happens after the hackathon?"**
> The extension is small and runs on free-tier or local models, so it costs almost nothing to keep
> alive. The honest answer is that the next milestone is the learning study, not more features.

---

## Numbers you may quote (and the exact framing)

| Claim | Say it exactly like this |
|---|---|
| Digital skill gap | "Only 21% of rural Indians aged 15–24 could search online, use email and bank online — MoSPI, 2022–23." |
| Government service use | "Only 11.4% of connected households use the internet for government services — NCAER, 2026." |
| Assisted demand | "The CSC network processed 48.54 crore *transactions* in FY 2025–26." **Say transactions, never people.** |
| Active learning | "0.47 standard deviations across 225 studies." Add: *"that validates the method, not our product."* |

## Never say these
1. ❌ "75% of Indians can't use government websites" — no such measure exists.
2. ❌ "48 crore people can't self-serve" — that figure counts transactions.
3. ❌ "We invented AI-guided navigation" — Copilot Vision ships today.
4. ❌ "It works on every website" — say which ones you have actually run.
5. ❌ "Our AI is 99% accurate" — quote only what you measured, or say you haven't measured it yet.
