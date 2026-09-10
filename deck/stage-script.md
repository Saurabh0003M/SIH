# Stage script — what to say, and the numbers behind it

Written for the intercollege round. The deck is six slides and deliberately spare; **this is where the
talking goes.** Everything here is either sourced or labelled as arithmetic, because every number said
out loud is a number a judge may check.

---

## 1. Elaborating the problem

Three moves, in this order: **the cost to a company → the cost to a citizen → why teaching alone does
not work.** The first two earn attention, the third is the one that wins the argument, so give it the
most time.

### Move 1 — what a human answering the same question actually costs

**Say this:**

> "A support seat in India costs a company around **₹45,000 a month once you count everything** — not
> the salary, the seat. Salary is about half of it; the rest is the floor, the software, the training
> and the churn. Fifteen seats is **₹6.75 lakh a month. Over ₹80 lakh a year** — to answer the same
> forty questions, forever."

**Do not say "₹45,000 salary."** A judge who has looked at Naukri will correct you on the spot.
The average customer-support salary in India is about **₹22,000 a month**
([Indeed, Feb 2026](https://in.indeed.com/career/customer-service-representative/salaries)). The
₹45,000 figure is only defensible as **fully-loaded cost per seat**, and there it is comfortably
safe: a 50-seat Indian BPO runs **₹20–40 lakh a month all-in**, which is **₹40,000–80,000 per seat**
([Acefone](https://www.acefone.com/blog/bpo-cost-to-start-run-a-50-seat-call-center/)). Say "fully
loaded" and the number is bulletproof. Say "salary" and it is wrong by half.

The arithmetic, so you can say it without pausing:

| Seats | Per month | Per year |
|---|---|---|
| 15 | ₹6,75,000 | ₹81,00,000 |
| 50 | ₹22,50,000 | ₹2.7 crore |

**The turn:** "Disha does not replace those people. It removes the forty questions that never needed a
human — *where do I click* — so the ones who are left can answer the ones that do."

That last line matters. A room full of judges in India will not reward "we make support staff
redundant."

### Move 2 — the citizen's side

**Say this:**

> "Now flip it. The person on the other end of that call is trying to change their address on Aadhaar.
> Or a phone number. Or upload one document to a scholarship portal. **The service exists. They are
> entitled to it. They fail at the interface** — and then they pay someone at a shop to click for them."

**The numbers that hold up** (all on slide 5 and slide 6 already):

- **21%** of rural Indians aged 15–24 can search online, use email and bank online — a *combined
  ICT-skill measure*, MoSPI CAMS 2022–23. **Never say "cannot use a government website."**
- **11.4%** of connected households use the internet for government services, and **one in five**
  households using digital services depends on help from **outside the household** — NCAER, June 2026.
  That second figure is the one to lean on: it is literally "someone else clicks for them."
- A **Maharashtra** study recorded **₹47** in service charges plus travel; a **Jharkhand** study
  recorded **₹101 actually paid** against a **₹30** official fee. Say *"a study recorded"* — never
  *"Indians pay."*

**The turn:** "That is not a literacy problem. It is a **navigation** problem, and it is the one thing
software can actually fix."

### Move 3 — why teaching alone does not work

This is your strongest move. Two analogies; use **one**, not both. The cycle one is better for an
Indian room, and it is yours — nobody can dispute a bicycle.

**Say this:**

> "Imagine the best swimmer in the world teaches you to swim — technique, breathing, everything — and
> then never lets you into the water. Day one alone at the pool: do you jump in? No. You know it and
> you still cannot do it.
>
> Nobody has ever learned to ride a cycle without falling. What you actually needed was not another
> explanation — it was **somebody holding the back of the seat**. Close enough to catch you, letting
> you do the pedalling, and quietly letting go once you stopped needing them.
>
> Every digital literacy programme we have is the lecture. **Disha is the hand on the seat.** It shows
> you where to go, you do it yourself, and after five clean runs the dot stops appearing — because at
> that point you know."

**Two cautions.**

1. The swimmer is **Michael Phelps** (not "Michel Philips"). And it is **your analogy, not his quote**
   — do not say "as Michael Phelps said." Say "imagine the best swimmer in the world." Safer, and it
   lands the same.
2. Do not oversell the learning science. Slide 5 says active learning **+0.47 SD** and spaced
   retrieval **g = 0.74**, and both slides and this script say the same thing: **those validate the
   mechanism, not our product.** If a judge asks whether Disha improves learning outcomes, the answer
   is *"we have not measured that, and I am not going to claim it."*

**Then land it in one sentence:** "The gap is not between not-knowing and knowing. It is between
knowing and **doing**. That gap is where we live."

---

## 2. The Red Bull Basement line

**Say this, and only this:**

> "This is not a hackathon idea we invented last month. I have been carrying it for a while — I
> submitted it to **Red Bull Basement 2026**, and the programme gave us **$1,000 in Microsoft Azure
> credits** through Microsoft for Startups. So the cloud side of the next build is already paid for."

**What not to say.** Do not say *selected*, *shortlisted*, *won*, or *awarded*. That email goes to
teams in the **application phase**, before the video round and the national final — its own wording is
"strengthen your application as the next phases get closer." The **$25,000** in Azure credits is the
World Final prize, and that is a different thing entirely
([Red Bull Basement, how it works](https://www.redbull.com/us-en/events/red-bull-basement-usa-2026/red-bull-basement-how-it-works)).

Framed honestly it is still worth saying, and it does real work for you: it shows the idea predates
this hackathon, and it answers the money question before it is asked. Framed as a win, it is the one
claim on your deck a judge could disprove from their phone. **It is on slide 6, worded exactly this
way.**

---

## 3. Future scope

Open with the cost, because it is the part nobody else in the room will have thought about, and it
proves you understand what you are building rather than just wiring an API.

### The token argument — say the mechanism, and one number

**Say this:**

> "Screen sharing sounds free. It is not. Sharing a screen means the model is being handed a picture
> of it, over and over. Google's own rule is that a 1920×1080 frame is six tiles, **258 tokens each —
> about 1,550 tokens a frame.** One frame a second is **93,000 tokens a minute.** If a user opens the
> tab and walks away to make tea, we are paying for **six hundred pictures of a page that never
> changed.**"

The arithmetic, so you can defend it:

| | |
|---|---|
| 1920×1080 → tiles | ceil(1920/768) × ceil(1080/768) = **3 × 2 = 6** |
| tokens per frame | 6 × 258 = **1,548** |
| at 1 frame/second | **92,880 tokens per minute** |
| 10 idle minutes | 600 frames ≈ **929,000 tokens**, for nothing |
| change-driven instead | ~25 real changes ≈ **39,000 tokens** — about **24× less** |

Say plainly: **"That is arithmetic off Google's published tiling rule, not something we measured — we
have not built the vision path yet."**
([Gemini API — counting tokens](https://ai.google.dev/gemini-api/docs/tokens))

**The turn:** "So the first thing on our roadmap is not a feature, it is restraint. Capture only when
the screen actually changes. Mouse movement is not a change. If nothing changes for a while, slow
down; if nothing changes for longer, stop and wait to be asked."

### The rest of the roadmap

Say them as four sentences, not a list read aloud:

1. **Recovery from a wrong click.** Right now a wrong click brings the guidance back. Next it should
   show **two** dots: one for the step you were meant to take, and one for the way back to where you
   came from. Getting lost is the actual failure mode for a first-time user, not picking the wrong
   button.
2. **Talking instead of typing.** The people who most need this are the least likely to type a
   sentence in English. Voice in, guidance out — with **BHASHINI** for Indian languages. And because
   an open mic in a noisy room hears the wrong thing, a **mute button** ships with it, in the same
   breath as the Pause we already have.
3. **More than one tab.** A real task spans tabs — a portal, a PDF, a payment page. Letting the user
   grant reading rights to **specific** tabs, not all of them, lets Disha follow the whole flow while
   the user still decides what it can see.
4. **The interface itself.** It is a working prototype and it looks like one.

**Close the section with the discipline, not the wish list:**

> "Every one of those makes it see more. So every one of them has to come with the thing that stops it
> seeing — the pause, the mute, the per-tab permission. On a banking page, the restraint *is* the
> feature."

---

## 4. Questions this invites, and the answers

**"Isn't this just Copilot Vision?"**
> "Copilot Vision Highlights ships today and it points at things — we say so on slide 2, and I would
> rather say it than have you find it. What is ours is the combination: the confidence is **exposed as
> a colour**, and it comes from **two independent judgements** — the model's, and our own on-device
> score of the page evidence. Both must agree for green. And ours **fades** — it is trying to stop
> being needed."

**"What's your accuracy?"**
> "We have not measured it, so I am not going to give you a number. What I can show you is the run on
> our practice portal: 64, 57, **red 51**, 75 — and that red one is the honest part. It was a near-tie
> between two fields and it said so instead of guessing. We also ran it read-only on three live
> government portals; on Swayam it picked the wrong control and reported **red at 16%**."

**"Why not just let the AI click?"**
> "Two reasons. On an Aadhaar or a banking page, an agent that clicks is a liability — one wrong click
> is a transaction, not a glance. And the moment it clicks for you, you have learned nothing. The
> whole product is built on the human doing it."

**"Who pays for it?"**
> "Nobody has to. It runs on a free-tier model, and with a local model it costs zero and never leaves
> the machine. The cloud side of the next build is covered by the Azure credits."

**"Can I try it?"**
> Yes. `run.bat` opens the portal and the practice sandbox, and the extension zip installs in about
> four minutes with `INSTALL.md`. Have it open in a tab before you walk in.

---

## 5. Two things fixed after the first live test

Worth knowing in case someone at the back of the room notices the panel:

- **It moves now.** Drag it by its dark header. It sat over the bottom-right of the page, which is
  exactly where a "Confirm" button often lives.
- **It minimises** to just the title bar (**−**), and hiding it (**×**) leaves a small round *Disha*
  pill to bring it back — so one stray click cannot end the demo.
- **Reloading the extension no longer leaves two panels on the page.** It did; that was a real bug,
  and it is fixed.
