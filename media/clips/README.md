# media/clips — silent looping video of the real product

Recorded 9 Sept 2026 off the running prototype. **Nothing here is a mock-up or a screen
re-enactment**: each clip is the shipping `lib/` code driving a real page, typed into through the
real ask bar, clicked through `elementFromPoint`. The pointer you see is the demo driver made
visible — it travels to the dot the guide chose, and the click lands underneath it.

## What to put on which slide

| Clip | Length | MP4 | GIF | Put it on | What it proves |
|---|---|---|---|---|---|
| `01-chain` | 14.1 s | 0.92 MB | 3.20 MB | **Slide 2 (Idea / Solution)** | Four dots, three screens, one goal typed in plain words. The page changes and the guidance follows it. |
| `02-red-verify` | 10.8 s | 0.68 MB | 2.26 MB | **Slide 2 or 4** | The near-tie that goes **red at 51%**, and the card that says why. This is the honesty claim, on video. |
| `03-navigation` | 22.0 s | 1.73 MB | 6.88 MB | **Slide 3 (Technical Approach)** | All four navigation states in one take: **two arrowheads** for a long scroll, **one** when it is nearly there, the dot when the target arrives, then the same thing upwards. It points; it never scrolls the page for you. |
| `04-fade` | 17.6 s | 1.62 MB | 5.46 MB | **Slide 5 (Impact and Benefits)** | The same task three times, each quicker, until the dot is gone. This is the education claim. |

All four are **1920×1080, 30 fps, H.264, no audio track**.

## Putting one in PowerPoint

1. **Insert → Video → This Device**, pick the `.mp4`.
2. Select the video → **Playback** tab → tick **Start: Automatically** and **Loop until Stopped**.
3. Leave **Hide While Not Playing** unticked.

If a machine refuses to embed the MP4 (it happens on older Office builds), use the `.gif` of the
same name instead — drop it in as a picture and it loops on its own.

## They loop seamlessly — and that was measured

Every clip starts on the idle page and ends back on that exact frame: the run is stopped, the
overlay fades out over 400 ms, the page returns home, the chat panel is wound back to its opening
line, and it holds for 300 ms before the cut.

Verified by comparing the first and last frame of each file. Mean per-pixel difference on a 0–255
scale:

| clip | first-vs-last |
|---|---|
| 01-chain | 0.38 |
| 02-red-verify | 0.39 |
| 03-navigation | 0.41 |
| 04-fade | 0.47 |

Under 0.5 out of 255 is screencast JPEG noise, not a visible seam. **Before the run was stopped at
the end of a scene these scored ~7.2** — the guide was re-grounding on the way home and adding one
more chat line, which made the panel taller in the last frame than the first and the loop visibly
jump.

## What the arrows mean

| Marker | Meaning |
|---|---|
| **one** chevron, down or up | The target is just past the edge — nudge the page. |
| **two** chevrons, down or up | It is more than a screen and a quarter away — keep going, it is near the end. |
| a dot | The target is on screen. Click it. |

The threshold is 1.25 screens (`content.js`). Telling the two apart matters: a single arrow that
turns out to need four flicks of the wheel teaches the person that the arrow cannot be trusted.

**Note on the nav bar:** the demo portal's header is `position: sticky`, so a nav link like *Wallet*
is on screen at every scroll position and can never earn an up arrow. `03-navigation` therefore uses
*Buy stocks*, which sits in the page body, for the upward case.

## Two clips are NOT here, and why

- **`05-pause`** (sharing paused at a sensitive field) — **must be recorded by hand.** The rig
  drives headless Chrome, which has no desktop to capture: `getDisplayMedia` never resolves *or*
  rejects, it simply hangs waiting for a picker that cannot appear. `--use-fake-ui-for-media-stream`
  and `--auto-accept-this-tab-capture` did not change that. A clip was produced and **deleted**,
  because the panel still read "Nothing is captured. Sharing is off." — it would have been a video
  of the feature not working. To record it: open the harness in a normal Chrome window, click
  **Share screen** and pick this tab, then **Pause**, wait, **Resume**, **Stop**, using any screen
  recorder.
- **`06-green`** (a step going green) — **not possible yet.** Green needs a live model, and no key
  is configured. The offline matcher is capped below green by design, so faking it is the one thing
  we will not do. See `deck/real-site-run.md` for why a live key should produce green on the
  National Scholarship Portal.

## Re-recording any of them

```bash
node prototype/guide-dots/test/record.mjs "http://localhost:8777/demo/index.html?auto=1&scene=chain" media/clips/01-chain.mp4 60 --until-done --gif
```

Scenes: `chain` · `red-verify` · `nav` · `arrow` · `fade` · `pause`. Needs the `disha-demo` server on 8777,
Chrome on `--remote-debugging-port=9333`, and ffmpeg on PATH. `--until-done` stops the recording at
the scene's own loop point instead of a guessed duration.
