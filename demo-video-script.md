# Disha — 2-minute demo video: what to record, and how

**Rule for this video: show the screen doing the thing.** No logo animation, no stock footage, no
talking head beyond five seconds. Judges are deciding one question — *did they actually build it?*

Record at 1080p. Prefer one continuous capture per scene; cuts read as hiding failures.

---

## Before you press record

1. **Start the harness.**
   ```bash
   python -m http.server 8777 --directory prototype/guide-dots
   ```
2. **Open the autoplay build** at `http://localhost:8777/demo/index.html?auto=1`
   — it types, waits for the real dot, and clicks through by itself. Nothing is faked: it clicks
   whatever `elementFromPoint` finds under the dot, which is exactly what a hand does.
   Add `&slow=1` if the pacing feels rushed for narration.
3. **Keep that tab focused and visible while recording.** A background tab throttles timers to one
   per second and the run crawls. This is the single most likely thing to ruin a take.
4. Notifications off, other tabs closed, bookmarks bar hidden, 1080p window.

The whole autoplay run is about 90 seconds and carries its own captions, so you can narrate over it
or let it speak for itself.

---

## Scene 1 — 0:00–0:15 · The problem, in one sentence

**Shot:** the BharatInvest wallet screen, cursor drifting between *Add money*, *Withdraw*,
*Statement*.

> Only 21 percent of rural Indians aged 15 to 24 can search online, use email and bank online.
> The service is right there on the screen. They just can't find the button — so they pay somebody
> else to click it for them.

*On-screen text: 21% · MoSPI, CAMS 2022–23*

---

## Scene 2 — 0:15–0:50 · It works from the words people actually use

**Shot:** autoplay scene 1. He types **"i want to take my money out"** — never the word *withdraw* —
and the dots walk him through four screens.

> He doesn't know the word "withdraw". He knows the money is in there and he wants it out. That's
> all he types.

Let the four dots land. **Do not cut between steps** — the unbroken chain is the proof.

> Nothing is running here. No model, no API key, no internet. It matched his words against the page
> itself.

---

## Scene 3 — 0:50–1:05 · The step where it says it isn't sure

**Shot:** step 3 — the **red** dot on the amount field, 51%, "Not sure — verify this one."

> Here it goes red. Two controls scored almost the same, so it says fifty-one percent and tells him
> to check. Every assistant you have ever used would have said "sure!" and pointed anyway.

**This is the most valuable ten seconds in the video.** Do not cut it because it "looks like a
failure". It is the differentiator.

---

## Scene 4 — 1:05–1:20 · Off-screen, and the privacy stop

**Shot A:** autoplay scene 2 — the bouncing *scroll down* arrow for a footer link.

> When the answer is three screens down it points. It does not seize the page and scroll for him.

**Shot B (record separately, by hand):** turn **Share screen** on, then hit **Pause** at a
password or OTP field. Show the panel text change to *"PAUSED — nothing is being captured."*

> Screen sharing is optional and off by default. At an OTP or a password, one click stops capture at
> the source. It never types your credentials and it never clicks for you.

---

## Scene 5 — 1:20–1:45 · The part that makes it education, not a tool

**Shot:** autoplay scene 3 — the same task a second time. Same dots, **no words**.

> Every time he does it himself, Disha gets quieter. Five clean repetitions and the dot disappears
> entirely. Get it wrong and the help comes straight back.

> That is not a shortcut, it is teaching. Active learning beats being told by close to half a
> standard deviation across 225 studies. This makes you do it.

---

## Scene 6 — 1:45–2:00 · How it decided

**Shot:** the explainer page, *How the dot is chosen* — hit **Replay**, let the pipeline animate,
then click **Step 3 · the field** to show the red case.

> Two independent numbers have to agree before it will claim anything: what the words scored, and
> what the page itself supports. We show you the weaker of the two, never the average.

**Closing card:** project name · PS 26207 · team name, and the line
*"It doesn't do it for you. It teaches you to do it yourself."*

---

## Shot-list checklist

- [ ] The **four-step chain**, unbroken (autoplay scene 1)
- [ ] The **red 51%** dot, percentage legible on screen
- [ ] The **scroll arrow** and its swap to a dot as it comes into view
- [ ] **Proximity card** — pointer near a dot, the explanation opens
- [ ] **Pause** during screen share, panel text visible
- [ ] The **fade** — same task twice, words gone the second time
- [ ] The **explainer** animating
- [ ] ⚠️ **One clip on a real website**, extension loaded in Chrome ← judges look hardest for this
- [ ] ⚠️ **One green dot** — needs a live model; the offline matcher is capped at amber by design

The last two are the only shots the harness cannot give you. Both need `chrome://extensions` →
*Load unpacked* → `prototype/guide-dots`, and a key in the popup.

---

## Traps

- **Never fake a dot.** If it misfires, re-record or use a different site. If a judge asks and it's
  mocked up, you are finished.
- **Rehearse until it works three times running**, then record.
- Use a test account. Never show a real Aadhaar number, bank balance or OTP on camera.
- If the model is slow, say "one moment" in the voiceover. A two-second wait is fine; a hidden cut
  is not.
- Don't claim you invented AI screen-pointing. **Microsoft Copilot Vision "Highlights" shipped
  first.** What's ours: exposed calibrated confidence as the dot's colour, the DOM+ARIA fusion, the
  fading scaffold, and working with no model at all.

## If the live demo isn't reliable by recording day

Record the narrow flow that does work and say so plainly on screen: *"Demonstrated here on a test
portal; the same grounding runs on any page."* Honest scoping beats a broken wide demo, and it
matches what the feasibility slide already claims.
