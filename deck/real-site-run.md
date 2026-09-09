# Disha on sites nobody scripted — the honest run

**9 Sept 2026. No model, no key, no clicks.** Reproduce with
`node prototype/guide-dots/test/realsite.mjs` (needs Chrome on `--remote-debugging-port=9333`).

This exists to answer one judge question — *"your demo only worked on one site, is it hardcoded?"* —
without touching a live government form. The script loads the **shipping** `lib/` files into a real
page, enumerates the interactive elements exactly as the extension would, scores them, and prints
what the dot **would** land on. It never clicks, types or submits.

## Results

| Site | Controls found | named | Dot would land on | Words × page | Band |
|---|---|---|---|---|---|
| scholarships.gov.in (NSP) | **28** | 24 (86%) | **"Apply now"** (link) — correct | 0.297 × 0.80 | **RED 30%** |
| swayam.gov.in | **50** | 34 (68%) | a course tile, *"Manufacturing Processes…"* — **wrong** | 0.165 × 0.45 | **RED 16%** |
| aicte-india.org | **119** | 111 (93%) | "Search" (span) — **partial**, not the institutes list | 0.537 × 0.55 | **RED 54%** |

Goals used: *"how do i apply for a scholarship"* · *"i want to enroll in a course"* ·
*"where do i find the approved institutes list"*.

## What this shows

**Enumeration works on markup we do not control.** 28, 50 and 119 controls came out of three
portals nobody wrote a script for, with 86%, 68% and 93% of them carrying a usable accessible name.
That is the "is it hardcoded?" answer, and it is now a measurement rather than a claim.

**On the real National Scholarship Portal it picked the right control.** "Apply now" is the correct
next step for "how do I apply for a scholarship", chosen from 28 candidates with no script and no
model.

**Every miss was reported as a miss.** Not one wrong pick was dressed up. Swayam matched the word
*course* against a course **title** instead of an enrol control and reported **16%**; AICTE landed on
"Search" and reported **54%**. Both are red. The product's central claim — that it tells you when not
to trust it — held on sites it had never seen.

## The one number to take from this

On NSP the **page evidence was strong (0.80)** — the DOM is well built and "Apply now" is uniquely
named, on top, and a real link. The **word match was weak (0.297)**, because the offline synonym
table is a lookup table, not a language model. The shown confidence is `min(0.297, 0.80) = 30%`.

**That first number is the one the live model replaces.** The page half of the score is already where
it needs to be for green (0.80 clears the 0.75 bar); it is the word half that is failing. This is the
concrete case for the Gemini key: on this exact page, a model that recognises "apply for a
scholarship" → "Apply now" should push the first number well past 0.80, and `gdBand` would return
**green** with no threshold touched.

Until that run happens, **we have not shown a green dot, and we do not claim one.**

## Caveats — read these before quoting anything above

- **Offline matcher only.** These are the floor, not the product's accuracy. No model was called.
- **Three sites is not a benchmark.** It is three sites, chosen by us, on one day.
- **No accuracy rate is implied.** One correct, one wrong, one partial — that is the sample, stated
  in full rather than summarised into a percentage.
- **Sites change.** These numbers are a snapshot of 9 Sept 2026.
- **`india.gov.in` refused the request** ("Access Denied") and returned no page. Not a product
  result; a bot block. Excluded rather than counted as a failure.
- **A college site was attempted and the domain did not resolve** (`DNS_PROBE_FINISHED_NXDOMAIN`) —
  I guessed the URL. If a specific college portal matters for the pitch, give me the real URL and
  it takes one command.
