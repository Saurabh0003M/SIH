# deck/ — the SIH idea PPT

Built on the **official template** (`reference/SIH2025-IDEA-Presentation-Format.pptx`), which is kept
whole: its logo, its blue footer bar, its team-name oval, its fixed slide titles, and every one of its
prescribed pointers, word for word. The only structural change is that **slide 7, the instructions
page, is not in the output** — the instructions themselves tell you to delete it.

Nothing on these slides is a mock-up. Every picture and every frame of every clip came out of the
running prototype.

## The two files that matter

| File | Use it for | Why |
|---|---|---|
| **`disha-intercollege.pptx`** | **the room** — the live intercollege presentation | Four clips embedded, each starting by itself on slide entry and looping until you move on. 8.5 MB, everything embedded, no network needed. |
| **`disha-intercollege.pdf`** | **the portal** — the SIH submission upload | **PDF is the only format the portal accepts.** Each video appears as its poster frame, so a judge reading the PDF still sees the dot, the arrow and the verdict. 1.1 MB. |

Open the PPTX in Presenter view and just walk forward. You do not click to start a video, and you do
not need to stop one — leaving the slide stops it.

### The one hand step left for you

1. **Confirm the team name registered on the SIH portal really is `Code Blooded`**, and that it matches
   the oval on slides 2–6 and the field on slide 1.
2. **Fill in `Team ID-` on slide 1** once the intercollege round is cleared. It is deliberately blank —
   the ID does not exist yet.
3. **The template says `SMART INDIA HACKATHON 2025`** because that is what the provided file says. When
   SIH publishes the 2026 template, either paste this content into it or change that one heading. The
   section structure has been identical across 2024 and 2025, so nothing in `slides.md` would need
   rewriting.

## What is on each slide

| # | Template title | Clip | Stills |
|---|---|---|---|
| 1 | `TITLE PAGE` | — | the template's own art |
| 2 | *ours:* "Disha — it points, you click, and then it fades" | `01-chain` | — |
| 3 | `TECHNICAL APPROACH` | `03-navigation` | `architecture.png` |
| 4 | `FEASIBILITY AND VIABILITY` | `02-red-verify` | `explainer-red-case.png` |
| 5 | `IMPACT AND BENEFITS` | `04-fade` | `practice-portal.png` |
| 6 | `RESEARCH AND REFERENCES` | — | — |

All four clips are used, once each. `05-pause` and `06-green` are not here because they do not exist:
screen capture cannot be recorded in headless Chrome, and the green dot needs a live model key. Neither
will be faked.

## What was verified, and how

Run `deck/build/probe_play.ps1` to repeat it. It opens the deck in a real slideshow, walks to each
video slide, and reads the media player's position twice:

```
slide 2 VIDEO-01-chain      len=14067ms  TriggerType=2 (with previous)
slide 2: t=2.5s pos=3283ms  ->  t=5.5s pos=6432ms      started with no click
slide 2 loop: t=16s pos=1947ms                          past a 14.07 s clip - it wrapped
```

`TriggerType=2` is the part that took two attempts. Setting
`AnimationSettings.PlaySettings.PlayOnEntry` alone leaves the play effect as `nodeType="clickEffect"`
inside a click group, so the clip sits still until the presenter presses space. The fix is to move the
effect's trigger to `msoAnimTriggerWithPrevious`, which is what "on slide entry" actually means in the
timing tree.

All six PDF pages were rendered and checked: no text overflows a box, and nothing is clipped by the
footer bar.

## Rebuilding it

Two passes, because python-pptx cannot embed video and PowerPoint COM cannot lay out a slide comfortably.

```bash
python deck/build/build_deck.py
```

Text, cards and stills, straight from the template; each video's place is held by a rectangle named
`VIDEOSLOT::<clip>`.

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File deck/build/insert_videos.ps1
```

Swaps each placeholder for a real embedded media object, sets play/loop/no-hide, fixes the trigger,
attaches the poster frame, saves the PPTX and exports the PDF via `SaveCopyAs(path, 32)`.

Poster frames live in `media/posters/` and were cut with ffmpeg from a **chosen** frame, not frame 0 —
every clip opens on the idle page with no dot on it, so first-frame posters would have made the PDF
four pictures of nothing happening.

```bash
ffmpeg -ss 13   -i media/clips/01-chain.mp4      -vframes 1 media/posters/01-chain.png
ffmpeg -ss 8.5  -i media/clips/02-red-verify.mp4 -vframes 1 media/posters/02-red-verify.png
ffmpeg -ss 5    -i media/clips/03-navigation.mp4 -vframes 1 media/posters/03-navigation.png
ffmpeg -ss 14   -i media/clips/04-fade.mp4       -vframes 1 media/posters/04-fade.png
```

LibreOffice and `pdftoppm` are not installed on this machine, so the usual render path fails.
PowerPoint COM works and is more faithful anyway; PDF pages were rendered with PyMuPDF.

## The rest of the folder

| File | What it is |
|---|---|
| `slides.md` | The writing — final text mapped box by box onto the six official slides, with the template's own headings reproduced so nothing gets renamed. Edit here first, then rebuild. |
| `numbers.md` | Every statistic on the deck, its exact source line in `research/`, and the caveat that must travel with it. |
| `real-site-run.md` | Read-only grounding runs on three live public portals, including the two Disha got wrong and reported red. |
| `build/` | The two build scripts and the playback probe. |
| `superseded/` | The earlier hand-built draft. **Do not submit it.** Kept only for comparison. |
| `../media/` | Every picture and clip, with `media/README.md` explaining which is which. |

## Five things not to get wrong

1. **Upload the PDF, not the PPTX.** The portal takes nothing else.
2. **Team ID stays blank** until the intercollege round is cleared. Team name is **Code Blooded**.
3. **Keep the Copilot Vision honesty line on slide 2.** Removing it is the fastest way to lose the
   novelty argument when a judge names that product first.
4. **Read the claims checklist at the bottom of `slides.md`** before this leaves your hands. Every
   forbidden claim on that list is one a judge can fact-check in a minute.
5. **Never put a `localhost` URL on a submitted slide.** The one link on the deck —
   `github.com/Saurabh0003M/SIH` — is public and real.
