# How to run Disha in front of judges

**Double-click `run.bat`.** That is the whole answer. It serves the files, opens the portal, and
prints every URL you might need. Press any key in that window to shut everything down.

Nothing is installed and nothing is built — Disha is plain JavaScript. `run.bat` only needs **Python
on PATH**, and only to serve files over http, because a browser will not run the guide from a
`file://` page.

## What opens, and what to show

| URL | What it is |
|---|---|
| `localhost:8931/index.html` | **The portal.** Start here — this is the thing being presented. |
| `localhost:8777/demo/index.html` | **The live prototype.** Type a goal, follow the dots. |
| `localhost:8931/practice.html` | The practice sandbox — a government-shaped portal. |
| `localhost:8778/how-the-dot-is-chosen.html` | The numbers behind one decision. |

## The two-minute run

1. Open the prototype. Type **`i want to take my money out`** and press Ask.
2. Follow the dots. Four steps, three screens. Say the line that matters while they watch:
   *"It never clicks. I click."*
3. On step three the dot goes **red at 51%**. Stop there. That is the whole pitch:
   *"Two controls scored almost the same, so it says it isn't sure."*
4. Move the pointer near a dot — the card opens and says what happens after the click.
5. Type **`something is wrong, i want to raise a complaint`**. The target is two screens down, so it
   shows **two arrowheads** — "keep going". One arrowhead means it is just past the edge. It points;
   it never scrolls the page for you.
6. Run the first task again, twice. The dot gets quieter each time and then stops appearing.
   *"It is trying to stop being needed."*

## If you would rather not type on stage

`localhost:8777/demo/index.html?auto=1` plays the whole story hands-free — it types into the real
ask bar and clicks through the real dots, with a visible pointer.

One scene at a time, for a slide or a rehearsal:

```
?auto=1&scene=chain        the four dots, three screens
?auto=1&scene=red-verify   the near-tie that goes red at 51%
?auto=1&scene=nav          every arrow state, down and up
?auto=1&scene=fade         the same task until the dot is gone
```

Pre-recorded loops of all four are in `deck/clips/` for the PowerPoint.

## Things a judge will press on — answer in one sentence

- **"Is it hardcoded to this page?"** No. `deck/real-site-run.md` has it running on
  scholarships.gov.in, where it found 28 controls and picked "Apply now" — and on two sites where it
  picked wrong and said so in red.
- **"Why is nothing green?"** No model key is configured, and the offline word-matcher is capped
  below green by design. That is a deliberate limit, not a failure.
- **"What is the panel in the corner?"** The candidates it is choosing between, with the two scores
  it uses, live. The bar is the weaker of the two — the number it would actually claim.

Full Q&A bank: `judge-FAQ.md`. Never claim more than `deck/numbers.md` supports.

## If something goes wrong on the day

- **Port already in use** — `run.bat` frees 8777, 8931 and 8778 before starting. Run it again.
- **A page looks stale** — hard-reload it (Ctrl+F5); the file servers do not set cache headers.
- **"Python was not found"** — install it from python.org with *Add python.exe to PATH* ticked.
- **The dots stop appearing** — you have done that step five times and it is mastered. Click
  **Reset practice memory** in the grey strip at the top.
