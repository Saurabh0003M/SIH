# media/ — every picture and clip of Disha, in one place

If you are looking for something visual to put in a slide, a video, a post or a
report, it is in here. Nothing in this folder is a mock-up, a stock image or a
re-enactment: **every frame came out of the running prototype**, driven through
the real ask bar and clicked through `elementFromPoint`, exactly as a hand would.

```
media/
  clips/        4 clips × 2 formats — silent, looping, 1920×1080 @ 30fps
  screenshots/  11 stills — 1920×1080 PNG
```

---

## clips/ — moving pictures

Four scenes, each shipped as **`.mp4`** (use this in PowerPoint) and **`.gif`**
(use this on GitHub, on the web, or when an old Office build refuses the MP4).

| Clip | Length | MP4 | GIF | What it proves |
|---|---|---|---|---|
| `01-chain` | 14.1 s | 0.92 MB | 3.20 MB | Four dots, three screens, one goal typed in plain words. **The best all-purpose clip** — this is the one in the top-level README. |
| `02-red-verify` | 10.8 s | 0.68 MB | 2.26 MB | The near-tie that goes **red at 51%**, and the card explaining why. The honesty claim, on video. |
| `03-navigation` | 22.0 s | 1.73 MB | 6.88 MB | Every navigation state in one take — two arrowheads, then one, then the dot, then the same going up. |
| `04-fade` | 17.6 s | 1.62 MB | 5.46 MB | The same task three times until the dot is gone. The education claim. |

**Which slide each one belongs on**, how to set PowerPoint to autoplay-and-loop,
why they loop without a visible seam (it was measured), and how to re-record any
of them: **[`clips/README.md`](clips/README.md)**.

**Two clips do not exist yet**, and both for honest reasons — `05-pause` needs a
hand recording because headless Chrome has no desktop to capture, and `06-green`
needs a live model key we do not have. Neither will be faked. The details are in
`clips/README.md`.

---

## screenshots/ — stills

All 1920×1080, all captured through the Chrome DevTools Protocol at a 1280×720
CSS viewport with `deviceScaleFactor: 1.5`, which keeps the confidence percentage
readable when projected.

### The guided run, in order

| File | What it shows |
|---|---|
| `demo-step1.png` | Step 1 — the dot on `Wallet`, amber **64%** |
| `demo-step2.png` | Step 2 — `Withdraw`, amber **57%** |
| `demo-step3.png` | Step 3 — **red 51%** on the amount field. *The single most useful image we have* — it is the whole pitch in one frame. |
| `demo-step4.png` | Step 4 — `Confirm and send money`, amber **75%** |
| `demo-arrow.png` | The off-screen case: arrowheads instead of a dot |
| `demo-hovercard.png` | The proximity card — what happens after the click |

### The rest

| File | What it shows |
|---|---|
| `architecture.png` | The system diagram — page, guide, and the boundary between them |
| `explainer-red-case.png` | The explainer page pulling apart the red decision, number by number |
| `portal-home.png` | The product portal (`platform/index.html`) |
| `portal-modules.png` | The portal's module section |
| `practice-portal.png` | The practice sandbox (`platform/practice.html`) |

---

## Making more

Both rigs live in `prototype/guide-dots/test/` and need no npm packages — just
Node 22+, Chrome on `--remote-debugging-port=9333`, and (for clips) ffmpeg on PATH.

```bash
# a clip
node prototype/guide-dots/test/record.mjs "http://localhost:8777/demo/index.html?auto=1&scene=chain" media/clips/01-chain.mp4 60 --until-done --gif
```

Scenes: `chain` · `red-verify` · `nav` · `fade` · `arrow` · `pause`.
Start the servers first with `run.bat`.

Stills were taken by driving the same harness over CDP and calling
`Page.captureScreenshot`. Note that an in-app browser pane caps screenshots at
800×450 — that is why capture goes through CDP directly and not through a
preview tool.
