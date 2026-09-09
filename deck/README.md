# deck/ — everything needed to build the SIH idea PPT

Built 9 Sept 2026. Nothing here is a mock-up: every screenshot came out of the running prototype.

| File | What it is | Who uses it |
|---|---|---|
| `slides.md` | **Start here.** Final text for all six official slides, one at a time, with the image to place on each. | Whoever builds the PPT |
| `disha-idea-deck-draft.pptx` | A plain 6-slide draft with that text and those images already placed. Restyle it onto the official template — do not start from a blank file. | Whoever builds the PPT |
| `numbers.md` | Every statistic on the deck, its exact source line in `research/`, and the caveat that must travel with it. | Whoever writes footnotes, and whoever answers a judge |
| `assets/` | Ten 1920×1080 PNGs. | Both |

## Three things not to get wrong

1. **Fill in `<TEAM ID>` and `<TEAM NAME>` on slide 1.** They are the only blanks; I did not invent them.
2. **Keep the Copilot Vision honesty line on slide 2.** Removing it is the fastest way to lose the novelty argument when a judge names the product first.
3. **Read the checklist at the bottom of `slides.md` before the deck leaves your hands.** Every item on it is a claim that will be fact-checked.

## How the screenshots were made, if they need remaking

The demo server runs from `.claude/launch.json` (`disha-demo` on 8777, `platform` on 8931,
`explainer` on 8778). The captures were driven through the Chrome DevTools Protocol at a CSS
viewport of 1280×720 with `deviceScaleFactor: 1.5`, which yields a true 1920×1080 PNG in which the
confidence percentage is still readable on a projected slide. The script typed into the real ask bar
and clicked through `elementFromPoint` — the same thing a hand does — so a take that looks right
is right.
