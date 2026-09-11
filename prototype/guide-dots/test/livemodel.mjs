
// LIVE END-TO-END: real page -> real tree.js enumeration -> real prompt ->
// real model. Everything the extension does except drawing the dot.
//
//   node test/livemodel.mjs "<url>" "<goal>"
//
// Reads the key from config.local.js and never prints it.
import { connect, evaluate, sleep } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const here = new URL(".", import.meta.url);
const read = (f) => readFileSync(new URL("../" + f, here), "utf8");

const cfg = eval(read("config.local.js") + "; GD_CONFIG");
const bg = read("background.js");
// The three pieces of the service worker that decide what gets asked and how
// the reply is read. Sliced by index, not regex: the file is CRLF and these
// functions contain blank lines.
const chunk = (from, to) => bg.slice(bg.indexOf(from), bg.indexOf(to, bg.indexOf(from) + 1));
eval(chunk("const GD_SYSTEM =", "function gdPrompt") +
     chunk("function gdPrompt", "function gdParseReply") +
     chunk("function gdParseReply", "function gdMeta") +
     ";globalThis.GD_SYSTEM = GD_SYSTEM;" +
     "globalThis.gdPrompt = gdPrompt;" +
     "globalThis.gdParseReply = gdParseReply;");

const BUNDLE =
  ["lib/redact.js", "lib/tree.js"].map(read).join("\n;\n");

const [, , url, goal] = process.argv;
const settle = Number(process.env.GD_SETTLE || 9000);

const cdp = await connect(9333);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

console.log("opening " + url);
await cdp.send("Page.navigate", { url });
await sleep(settle);

const raw = await evaluate(cdp, BUNDLE + `
  const els = getInteractiveElements();
  return JSON.stringify(els.map(e => ({
    id: e.id, role: e.role, name: e.name, rect: e.rect, needsInput: e.needsInput
  })));
`);
const elements = JSON.parse(raw);
console.log(`tree.js found ${elements.length} controls`);
const empties = elements.filter((e) => e.needsInput === true);
console.log(`  of which EMPTY and waiting for input: ${empties.length}` +
  (empties.length ? "  -> " + empties.slice(0, 5).map((e) => e.name || "(unnamed)").join(", ") : ""));

const prompt = gdPrompt({ goal, url, elements, history: [] });
console.log(`prompt: ${prompt.length} chars\n`);

const models = cfg.models.split(",").map((m) => m.trim()).slice(0, 3);
const attempt = async (model) => {
  const t0 = Date.now();
  const r = await fetch(cfg.baseUrl + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.apiKey, "Content-Type": "application/json",
               "HTTP-Referer": "https://sih-disha.local", "X-Title": "Disha" },
    body: JSON.stringify({ model, temperature: 0, max_tokens: 1024,
      messages: [{ role: "system", content: GD_SYSTEM }, { role: "user", content: prompt }] })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(model + ": " + r.status + " " + JSON.stringify(d.error && d.error.message).slice(0, 90));
  const c = d.choices && d.choices[0];
  if (!c || !c.message || typeof c.message.content !== "string") {
    throw new Error(model + ": no text (finish_reason " + (c && c.finish_reason) + ")");
  }
  const parsed = gdParseReply(c.message.content);
  return { parsed, model, ms: Date.now() - t0,
           tokensIn: d.usage && d.usage.prompt_tokens, tokensOut: d.usage && d.usage.completion_tokens };
};

console.log("racing: " + models.join(" vs "));
const settled = await Promise.allSettled(models.map(attempt));
settled.forEach((s, i) => console.log(
  "  " + models[i].padEnd(50) + (s.status === "fulfilled"
    ? `OK  ${s.value.ms}ms`
    : "FAIL  " + String(s.reason.message).slice(0, 90))));

const won = settled.find((s) => s.status === "fulfilled");
if (!won) { console.log("\nall three failed"); process.exit(1); }

const { parsed, model, ms, tokensIn, tokensOut } = won.value;
const chosen = elements.find((e) => e.id === parsed.id);
console.log("\n" + "=".repeat(66));
console.log("GOAL     " + JSON.stringify(goal));
console.log("PICKED   " + (chosen ? `[${chosen.role}] "${chosen.name}"` : "id " + parsed.id + " (not on the page!)"));
console.log("SAYS     " + parsed.reason);
if (parsed.next) console.log("NEXT     " + parsed.next);
console.log("CONF     " + parsed.confidence);
console.log("META     " + model + "  " + ms + "ms  " + tokensIn + " in / " + tokensOut + " out");
console.log("=".repeat(66));

process.exit(0);
