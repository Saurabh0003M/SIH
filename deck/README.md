# deck/ — everything needed to build the SIH idea PPT

Built 9 Sept 2026, then rewritten the same day against the **actual official template**.
Nothing here is a mock-up: every screenshot came out of the running prototype.

**This folder is the writing.** The pictures and clips that go on the slides are in
[`../media/`](../media) — start at [`media/README.md`](../media/README.md), which says which clip
belongs on which slide.

| File | What it is | Who uses it |
|---|---|---|
| `slides.md` | **Start here.** Final text mapped onto the six official slides, box by box, with the template's own headings and sub-pointers reproduced so nothing gets renamed. | Whoever builds the PPT |
| `disha-idea-deck-draft.pptx` | A 6-slide draft that mirrors the template's structure — team oval, fixed ALL-CAPS title, the box layout, the blue footer bar. | Whoever builds the PPT |
| `disha-idea-deck-draft.pdf` | The same deck exported to PDF, because **PDF is the only format the portal accepts**. | Check what a judge will actually see |
| `numbers.md` | Every statistic on the deck, its exact source line in `research/`, and the caveat that must travel with it. | Whoever writes footnotes, and whoever answers a judge |
| **`../media/`** | **Moved out of this folder.** All eleven screenshots and all four looping clips now live in [`media/`](../media), because they are used by the README, the video and the portal as well as by the deck. | Both |

## Where the template actually is

`reference/past winning teams/805306823-SIH-Winner-PPT.pdf` — **that file is misnamed.** It is not a
winner's deck. Pages 1, 4, 5 and 6 are the **blank official template**, pages 2–3 were filled in by a
team called CODESTRIX, and page 7 is the official instructions page. `Lanezy PPT main.pdf` is a real
filled deck (SIH 2025) and is the best example of how much a strong team packs onto these slides.
`SIH GRAND FINALE 2024.pdf` is a college press release, not a deck.

## The rules that came off the instructions page

1. **Maximum six slides, including the title slide.**
2. Avoid paragraphs — points, diagrams, infographics, pictures.
3. Keep it precise and easy to understand.
4. The idea should be unique and novel.
5. **Use only the provided template, without changing the idea-details pointers.**
6. **Save as PDF and upload that.** No PPT, no Word.
7. Delete the instructions slide before uploading.

## Five things not to get wrong

1. **The template is the 2024 edition, and it now lives in `reference/`** — which is gitignored, so a fresh clone will not have it; see [`reference/README.md`](../reference/README.md) to get it back. Rule 5 says use *the provided* template, so
   download the **2026** file from the SIH portal and paste this text into it. The section structure
   is unchanged between 2024 and 2025, so nothing in `slides.md` needs rewriting — but the logo, the
   year and the footer must come from the 2026 file. The draft's logo box is deliberately empty for
   this reason.
2. **Team ID stays blank** until the intercollege round is cleared. Team name is **Code Blooded**,
   and it goes in the oval at the top-left of slides 2–6 as well as on slide 1.
3. **Keep the Copilot Vision honesty line on slide 2.** Removing it is the fastest way to lose the
   novelty argument when a judge names the product first.
4. **Read the checklist at the bottom of `slides.md`** before the deck leaves your hands.
5. **The links question — half of it is now answered.** Both winner decks put clickable Video /
   Website / Report / GitHub links on their slides, and we finally have one that is real:

   > **github.com/Saurabh0003M/SIH** — public, with a README that explains the whole repo to
   > someone who has never seen it.

   Put it on the title slide. Two are still missing, and both are cheap:

   - **Video.** Record `demo-video-script.md` and upload it unlisted. This is the one judges
     actually click.
   - **Website.** `platform/` and `prototype/guide-dots/demo/` are static files with no build step,
     so GitHub Pages will host the working prototype in about ten minutes. That turns "carry it open
     in a tab" into a link anyone on the panel can open themselves.

   The explainer is a private Claude artifact — publish it or don't cite it. And whatever else
   changes, **never put a `localhost` URL on a submitted slide.**

## How the screenshots were made, if they need remaking

The demo server runs from `.claude/launch.json` (`disha-demo` on 8777, `platform` on 8931,
`explainer` on 8778). The captures were driven through the Chrome DevTools Protocol at a CSS viewport
of 1280×720 with `deviceScaleFactor: 1.5`, which yields a true 1920×1080 PNG in which the confidence
percentage is still readable on a projected slide. The script typed into the real ask bar and clicked
through `elementFromPoint` — the same thing a hand does — so a take that looks right is right.

LibreOffice and `pdftoppm` are not installed on this machine, so the pptx skill's usual render path
fails. **PowerPoint COM works** (`New-Object -ComObject PowerPoint.Application`, then
`Slide.Export(...)` and `SaveCopyAs(path, 32)` for PDF) and is more faithful anyway.
