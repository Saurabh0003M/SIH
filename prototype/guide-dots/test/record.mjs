// Screen-record the demo harness straight out of Chrome, with no OS recorder
// and no window to keep in focus.
//
// Why CDP screencast rather than Playwright: Playwright is not installed here,
// and screencast gives frame timestamps, so the output keeps the real timing of
// the run instead of assuming a steady frame rate. Frames arrive irregularly
// (Chrome only sends one when the page actually changes), so each frame is held
// for its true duration via ffmpeg's concat demuxer.
//
// Usage:
//   node test/record.mjs <url> <out.mp4> [seconds] [--gif]
//
// Requires: Chrome listening on --remote-debugging-port=9333, and ffmpeg on PATH.
import { connect, sleep } from "./cdp.mjs";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [, , url, outArg, secsArg, ...flags] = process.argv;
if (!url || !outArg) {
  console.error("usage: node test/record.mjs <url> <out.mp4> [seconds] [--gif]");
  process.exit(2);
}
const seconds = Number(secsArg) || 12;
const wantGif = flags.includes("--gif");
const out = path.resolve(outArg);
const work = path.join(path.dirname(out), ".frames-" + path.basename(out, ".mp4"));

if (existsSync(work)) rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
mkdirSync(path.dirname(out), { recursive: true });

const cdp = await connect(9333);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

// 1280x720 at deviceScaleFactor 1.5 is the rig that made the deck PNGs: the
// output is a true 1920x1080 in which the dot's percentage is still readable
// when the slide is projected.
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false
});

const frames = [];
cdp.onEvent = (msg) => {
  if (msg.method !== "Page.screencastFrame") return;
  const { data, sessionId, metadata } = msg.params;
  frames.push({ data, t: metadata.timestamp });
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
};

await cdp.send("Page.navigate", { url });
await sleep(1500); // let fonts and layout settle before the first frame

await cdp.send("Page.startScreencast", {
  format: "jpeg", quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1
});
// A fixed duration either cuts the ending off or leaves dead air at the end,
// and both ruin a loop. autoplay's scenes set window.__sceneDone once they are
// back on the idle frame, so the recorder can stop exactly at the loop point.
if (flags.includes("--until-done")) {
  console.log(`recording ${url} until the scene reports done (max ${seconds}s) ...`);
  const until = Date.now() + seconds * 1000;
  for (;;) {
    if (Date.now() > until) { console.log("  scene never reported done - stopping at the cap"); break; }
    const r = await cdp.send("Runtime.evaluate", { expression: "!!window.__sceneDone", returnByValue: true });
    if (r.result.value) break;
    await sleep(200);
  }
} else {
  console.log(`recording ${seconds}s of ${url} ...`);
  await sleep(seconds * 1000);
}
await cdp.send("Page.stopScreencast");
await sleep(300);
cdp.close();

if (frames.length < 2) {
  console.error(`only ${frames.length} frame(s) captured - nothing to encode`);
  process.exit(1);
}

// Write frames and a concat list that holds each for its real duration.
const lines = [];
for (let i = 0; i < frames.length; i++) {
  const file = path.join(work, `f${String(i).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(frames[i].data, "base64"));
  const dur = i < frames.length - 1
    ? Math.max(0.016, frames[i + 1].t - frames[i].t)
    : 0.25;
  lines.push(`file '${file.replace(/\\/g, "/")}'`, `duration ${dur.toFixed(4)}`);
}
lines.push(`file '${path.join(work, `f${String(frames.length - 1).padStart(5, "0")}.jpg`).replace(/\\/g, "/")}'`);
const listFile = path.join(work, "list.txt");
writeFileSync(listFile, lines.join("\n"));

const span = frames[frames.length - 1].t - frames[0].t;
console.log(`captured ${frames.length} frames over ${span.toFixed(1)}s`);

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "concat", "-safe", "0", "-i", listFile,
  "-vf", "fps=30,scale=1920:1080:flags=lanczos",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
  "-movflags", "+faststart",
  "-an", // PowerPoint loops behave badly with a silent audio track present
  out
], { stdio: "inherit" });

if (wantGif) {
  const gif = out.replace(/\.mp4$/, ".gif");
  const pal = path.join(work, "pal.png");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", out,
    "-vf", "fps=15,scale=1280:-1:flags=lanczos,palettegen", pal], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", out, "-i", pal,
    "-lavfi", "fps=15,scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse", gif], { stdio: "inherit" });
  console.log("gif:", gif);
}

rmSync(work, { recursive: true, force: true });
console.log("wrote", out);
process.exit(0);
