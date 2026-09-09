// Run Disha's REAL enumeration + offline planner against sites we do not
// control, with NO MODEL and NO CLICKS.
//
// This is the honest answer to "your demo only worked on one site - is it
// hardcoded?". It loads the shipping lib/ files into a live page, enumerates
// the interactive elements exactly as the extension would, scores them, and
// prints what the dot WOULD land on. It never clicks, types or submits, so it
// is safe to point at a government portal.
//
// Usage:
//   node test/realsite.mjs                          # the default target list
//   node test/realsite.mjs <url> "<goal>"           # one ad-hoc target
//   GD_SETTLE=15000 node test/realsite.mjs          # slower sites
//
// Requires Chrome on --remote-debugging-port=9333.
import { connect, evaluate, sleep } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const here = new URL(".", import.meta.url);
const read = (f) => readFileSync(new URL("../" + f, here), "utf8");

// The same files the extension ships, in the order the harness loads them.
// shim.js supplies the four chrome.* calls a content script needs.
const BUNDLE = ["demo/shim.js", "lib/redact.js", "lib/remember.js", "lib/tree.js", "lib/local.js", "lib/fade.js",
                "lib/dots.js", "lib/ground.js"].map(read).join("\n;\n");

const DEFAULTS = [
  { url: "https://scholarships.gov.in/", goal: "how do i apply for a scholarship" },
  { url: "https://swayam.gov.in/", goal: "i want to enroll in a course" },
  { url: "https://www.aicte-india.org/", goal: "where do i find the approved institutes list" }
];

const [, , argUrl, argGoal] = process.argv;
const targets = argUrl ? [{ url: argUrl, goal: argGoal || "help me get started" }] : DEFAULTS;
const settle = Number(process.env.GD_SETTLE || 8000);

const cdp = await connect(9333);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1280, height: 720, deviceScaleFactor: 1, mobile: false
});

for (const { url, goal } of targets) {
  console.log("\n" + "=".repeat(72) + "\n" + url + "\n  goal: " + goal);
  try {
    await cdp.send("Page.navigate", { url });
    await sleep(settle);
  } catch (e) {
    console.log("  NAVIGATION FAILED:", e.message);
    continue;
  }

  // A site that fails to resolve still renders a Chrome error page with a
  // couple of controls on it, which would otherwise read as a thin result.
  const where = await evaluate(cdp, `return location.href;`).catch(() => "");
  if (String(where).startsWith("chrome-error://")) {
    const why = await evaluate(cdp, `return (document.body.innerText||"").trim().slice(0,120);`);
    console.log("  DID NOT LOAD -", String(why).replace(/\s+/g, " ").slice(0, 100));
    continue;
  }

  let out;
  try {
    out = await evaluate(cdp, `
      ${BUNDLE}
      const els = getInteractiveElements();
      const payload = els.map(e => ({ id: e.id, role: e.role, name: e.name, rect: e.rect }));
      const pick = gdLocalPick(payload, ${JSON.stringify(goal)}, []);
      const chosen = els.find(e => e.id === pick.id);
      const quality = chosen ? gdGroundingQuality(chosen, ${JSON.stringify(goal)}, els) : 0;
      const words = Math.max(0, Math.min(1, Number(pick.confidence) || 0));
      let band = gdBand(words, quality);
      if (pick.offline && band === "green") band = "amber";
      const named = payload.filter(e => e.name && e.name.trim()).length;
      return JSON.stringify({
        total: payload.length, named, unnamed: payload.length - named,
        title: document.title,
        pickName: chosen ? chosen.name : null,
        pickRole: chosen ? chosen.role : null,
        reason: pick.reason, words,
        quality: Number(quality.toFixed(3)),
        shown: Math.round(Math.min(words, quality) * 100),
        band
      });
    `);
  } catch (e) {
    console.log("  INJECTION FAILED:", e.message.slice(0, 180));
    continue;
  }

  const r = JSON.parse(out);
  console.log("  title:", String(r.title).slice(0, 68));
  console.log(`  controls found: ${r.total}  (named ${r.named}, unnamed ${r.unnamed})`);
  if (!r.pickName) {
    console.log("  NO DOT. " + r.reason);
  } else {
    console.log(`  dot -> "${String(r.pickName).slice(0, 60)}" [${r.pickRole}]`);
    console.log(`  words ${r.words.toFixed(3)} x page ${r.quality} -> ${r.band.toUpperCase()} ${r.shown}%`);
  }
}

cdp.close();
process.exit(0);
