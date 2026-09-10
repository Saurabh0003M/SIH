// Talks to the model. Content scripts can't make cross-origin calls, so all
// provider traffic goes through this service worker.
//
// Providers: "anthropic" (BYOK) | "gemini" (free tier) | "ollama" (local, offline)
// Configure via chrome.storage.local: { provider, apiKey, model }

// Optional local defaults (base URL, model list, key) so the popup needs no typing.
// Absent in a shared copy - the extension then falls back to the popup values.
try {
  importScripts("config.local.js");
} catch (e) {
  console.log("[GuideDots] no config.local.js - using popup settings");
}

// The job is GUIDANCE, not "find the submit button". On a form the next step a
// human needs is the first thing they must fill in - pointing at Search while
// From and To are still blank is not guidance, it is a shortcut past the task.
const GD_SYSTEM =
  "You are guiding a human through a task one step at a time. Choose the ONE " +
  "element they should deal with NEXT. " +
  "Elements are given as id|role|name|x,y,w,h, and value-bearing controls are " +
  "additionally marked EMPTY or FILLED. " +
  "RULES: " +
  "(1) If the goal needs information the page does not have yet, choose the " +
  "FIRST EMPTY field they must fill - top to bottom, left to right by the " +
  "coordinates - NOT the button that submits. " +
  "(2) Choose the submit, search or confirm control only once the fields that " +
  "matter are already FILLED. " +
  "(3) For an EMPTY field, `next` must say WHAT TO TYPE into it, in plain " +
  "words. For a button or link, `next` says what they will see after clicking. " +
  'Reply with JSON only: {"id": <integer id from the list, or null>, ' +
  '"confidence": <0..1>, "reason": "<=12 words, why this is the next step>", ' +
  '"next": "<=14 words, what to type here, or what happens after the click>"}. ' +
  "Use null if nothing on this screen matches. Never invent an id that is not " +
  "listed. confidence must reflect genuine certainty, not politeness.";

const GD_DEFAULT_MODEL = {
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-2.5-flash",
  ollama: "llama3.2:3b"
};

function gdPrompt({ goal, url, elements, history }) {
  const lines = elements
    .map((e) => {
      const state = e.needsInput === true ? "|EMPTY"
                  : e.needsInput === false ? "|FILLED" : "";
      return `${e.id}|${e.role}|${e.name}|${e.rect.x},${e.rect.y},${e.rect.w},${e.rect.h}${state}`;
    })
    .join("\n");
  const done = history && history.length ? `ALREADY DONE: ${history.join(" -> ")}\n` : "";
  return `GOAL: ${goal}\n${done}URL: ${url}\nELEMENTS:\n${lines}\n\nPick the NEXT step. RETURN JSON ONLY.`;
}

function gdParseReply(text) {
  let s = String(text == null ? "" : text).trim();
  if (!s) throw new Error("model returned an empty reply");

  // Models fence their JSON far more often than the docs suggest.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  // A greedy /\{[\s\S]*\}/ spans two objects when the model chats before or
  // after the JSON, and then JSON.parse dies on the join. Walk the braces
  // instead and take the first complete object, ignoring braces inside strings.
  const start = s.indexOf("{");
  if (start < 0) throw new Error("model did not return JSON: " + s.slice(0, 80));
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) { end = i; break; }
  }
  if (end < 0) throw new Error("model returned truncated JSON: " + s.slice(0, 80));

  let o;
  try {
    o = JSON.parse(s.slice(start, end + 1));
  } catch (e) {
    throw new Error("model returned malformed JSON: " + s.slice(start, start + 80));
  }
  return {
    id: o.id === null || o.id === undefined ? -1 : Number(o.id),
    confidence: Number(o.confidence),
    reason: String(o.reason || "").slice(0, 80),
    next: String(o.next || "").slice(0, 90)
  };
}

// Everything the user is entitled to know about the call we just made on their
// behalf: which model answered, how long it took, and what it cost in tokens.
// Attached to the reply so the on-page panel can show its working instead of
// asking anyone to trust it.
function gdMeta(parsed, model, ms, usage) {
  parsed._meta = {
    model,
    ms,
    tokensIn: usage && usage.in != null ? usage.in : null,
    tokensOut: usage && usage.out != null ? usage.out : null
  };
  return parsed;
}


async function gdFetchJson(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) {
    const err = new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
    err.status = r.status; // so the retry logic can tell "slow down" from "wrong key"
    throw err;
  }
  return r.json();
}

// The Gemini free tier rate-limits hard, and gateways return 503 while a model
// cold-starts. Both are worth exactly one polite retry; a 401 or 400 is not,
// because retrying a wrong key just wastes the user's time twice.
const GD_RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

async function gdWithRetry(label, fn) {
  try {
    return await fn();
  } catch (e) {
    if (!GD_RETRY_STATUS.has(e.status)) throw e;
    // Honour Retry-After when we can infer it; otherwise a flat, short pause.
    const waitMs = e.status === 429 ? 2500 : 1200;
    console.log(`[GuideDots] ${label} returned ${e.status} - retrying once in ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
    return fn();
  }
}

// Pick a model this API key can actually use, and remember it.
async function gdResolveGeminiModel(apiKey) {
  // Cached under its own key — a model name discovered for Gemini must never
  // leak into an Ollama or Anthropic call.
  const cached = await chrome.storage.local.get("geminiModel");
  if (cached.geminiModel) return cached.geminiModel;
  const data = await gdFetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { method: "GET" }
  );
  const usable = (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((n) => !/vision|embedding|aqa|imagen/i.test(n));
  const pick =
    usable.find((n) => /flash-lite/i.test(n)) ||
    usable.find((n) => /flash/i.test(n)) ||
    usable[0];
  if (!pick) throw new Error("this Gemini key has no usable text model");
  await chrome.storage.local.set({ geminiModel: pick });
  console.log("[GuideDots] using Gemini model:", pick);
  return pick;
}


// ---------------------------------------------------------------------------
// ROUTING. Gateways expose many models whose speed and reliability drift hour to
// hour, so we don't trust a static choice: we score each model from what it
// actually did for US, race the best ones, and take the first valid answer.
// ---------------------------------------------------------------------------

const GD_RACE_COUNT = 3; // Was 2. On free tiers models go 429 'rate-limited
// upstream' independently and often, and a 150-control page takes 8-14s to
// answer - so two racers both failing is a live-demo outage, not a rarity.
// Three costs nothing on free models and roughly halves that chance.

async function gdStats() {
  const { modelStats } = await chrome.storage.local.get("modelStats");
  return modelStats || {};
}

async function gdRecord(model, ok, ms) {
  const stats = await gdStats();
  const s = stats[model] || { ok: 0, fail: 0, avgMs: 0 };
  if (ok) {
    s.ok += 1;
    // Exponential moving average: recent latency matters more than history.
    s.avgMs = s.avgMs ? Math.round(s.avgMs * 0.7 + ms * 0.3) : ms;
  } else {
    s.fail += 1;
  }
  stats[model] = s;
  await chrome.storage.local.set({ modelStats: stats });
}

// Higher is better. Availability uses Laplace smoothing so a single failure
// doesn't permanently bench a model, and an unseen model still gets tried.
function gdScore(s) {
  if (!s) return 1 / 8000;
  const availability = (s.ok + 1) / (s.ok + s.fail + 2);
  return availability / (s.avgMs || 8000);
}

async function callLLM(payload) {
  const stored = await chrome.storage.local.get(["provider", "apiKey", "model", "baseUrl"]);
  const defaults = (typeof self !== "undefined" && self.GD_CONFIG) || {};
  const cfg = {
    provider: stored.provider || defaults.provider,
    apiKey: stored.apiKey || defaults.apiKey,
    model: stored.model || defaults.models,
    baseUrl: stored.baseUrl || defaults.baseUrl
  };
  const provider = cfg.provider || "ollama";
  const model = cfg.model || GD_DEFAULT_MODEL[provider];
  const prompt = gdPrompt(payload);

  if (provider === "ollama") {
    const t0 = Date.now();
    const data = await gdWithRetry("ollama", () =>
      gdFetchJson("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: `${GD_SYSTEM}\n\n${prompt}`,
        stream: false,
        format: "json", // small models drift without this
        options: { temperature: 0 }
      })
      })
    );
    return gdMeta(gdParseReply(data.response), model, Date.now() - t0, {
      in: data.prompt_eval_count,
      out: data.eval_count
    });
  }

  if (!cfg.apiKey) throw new Error("no API key set — open the popup and add one");

  // Any OpenAI-compatible gateway (incl. a self-hosted router that fails over
  // between several upstream keys). Base URL + model come from the popup.
  if (provider === "custom") {
    const base = (cfg.baseUrl || "").replace(/\/+$/, "");
    if (!base) throw new Error("set the gateway base URL in the popup");

    const models = (cfg.model || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!models.length) throw new Error("name at least one model in the popup");

    const stats = await gdStats();
    const ranked = [...models].sort((a, b) => gdScore(stats[b]) - gdScore(stats[a]));
    const racers = ranked.slice(0, Math.max(1, Math.min(GD_RACE_COUNT, ranked.length)));

    // 200 was enough when every model spent its budget on the answer. Reasoning
    // models bill their thinking against the same allowance, so a small cap can
    // come back finish_reason:"length" with an EMPTY answer - the same trap that
    // bit the Gemini path. Our reply is a four-field object; a big ceiling costs
    // nothing, because you pay for tokens produced, not tokens allowed.
    const GD_CUSTOM_BUDGET = 1024;

    const attempt = (model) => {
      const started = Date.now();

      const post = (shape) => gdFetchJson(base + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
          "HTTP-Referer": "https://sih-disha.local",
          "X-Title": "Disha"
        },
        body: JSON.stringify({
          model,
          ...(shape.dropTemperature ? {} : { temperature: 0 }),
          [shape.budgetKey]: GD_CUSTOM_BUDGET,
          messages: [
            { role: "system", content: GD_SYSTEM },
            { role: "user", content: prompt }
          ]
        })
      });

      // Newer OpenAI-family models reject `max_tokens` outright and want
      // `max_completion_tokens`, and several refuse any temperature but their
      // default. A gateway fronting them — Azure AI Foundry among them — says so
      // in a 400. Ask again in the shape it asked for, rather than failing in
      // front of a room.
      const shape = { budgetKey: "max_tokens", dropTemperature: false };
      const postAdapting = () =>
        post(shape).catch((e) => {
          if (e.status !== 400) throw e;
          const said = String(e.message || "");
          let adapted = false;
          if (/max_completion_tokens/.test(said) && shape.budgetKey === "max_tokens") {
            shape.budgetKey = "max_completion_tokens";
            adapted = true;
          }
          if (/temperature/.test(said) && !shape.dropTemperature) {
            shape.dropTemperature = true;
            adapted = true;
          }
          if (!adapted) throw e;
          console.log(`[GuideDots] ${model} wants a different request shape - asking again`);
          return post(shape);
        });

      return gdWithRetry(model, postAdapting)
        .then((d) => {
          // A gateway can answer 200 with no usable choice at all: a content
          // filter tripped, or the budget ran out mid-thought. Say which.
          const choice = d && d.choices && d.choices[0];
          if (!choice || !choice.message || typeof choice.message.content !== "string") {
            throw new Error(
              choice && choice.finish_reason
                ? `${model} returned no text (finish_reason: ${choice.finish_reason})`
                : `${model} returned no answer`
            );
          }
          const parsed = gdParseReply(choice.message.content);
          const ms = Date.now() - started;
          gdRecord(model, true, ms);
          console.log(`[GuideDots] ${model} answered in ${ms}ms`);
          return gdMeta(parsed, model, ms, {
            in: d.usage && d.usage.prompt_tokens,
            out: d.usage && d.usage.completion_tokens
          });
        })
        .catch((e) => {
          gdRecord(model, false, Date.now() - started);
          throw new Error(`${model}: ${e.message}`);
        });
    };

    console.log("[GuideDots] racing:", racers.join(" vs "));
    try {
      // First valid answer wins; the losers still report in, so the scores stay honest.
      return await Promise.any(racers.map(attempt));
    } catch (aggregate) {
      const why = (aggregate.errors || [aggregate])
        .map((e) => e.message)
        .join(" | ");
      throw new Error("all models failed - " + why.slice(0, 180));
    }
  }

  if (provider === "gemini") {
    // Model names change and get retired, so ask the key what it can actually use.
    const geminiModel = cfg.model || (await gdResolveGeminiModel(cfg.apiKey));
    const data = await gdWithRetry("gemini", () =>
      gdFetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${cfg.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${GD_SYSTEM}\n\n${prompt}` }] }],
            // 200 was too tight: on the 2.5 models reasoning tokens are billed
            // against this budget, so the reply can finish as MAX_TOKENS with no
            // text part at all - which used to surface as a TypeError.
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 2048,
              responseMimeType: "application/json"
            }
          })
        }
      )
    );

    // Every hop here has failed in the wild: blocked prompts return no
    // candidate, safety stops return a candidate with no parts.
    const cand = data.candidates && data.candidates[0];
    if (!cand) {
      const blocked = data.promptFeedback && data.promptFeedback.blockReason;
      throw new Error(blocked ? `prompt blocked (${blocked})` : "no candidate returned");
    }
    const parts = (cand.content && cand.content.parts) || [];
    const text = parts.map((pt) => pt.text || "").join("").trim();
    if (!text) {
      throw new Error(
        cand.finishReason === "MAX_TOKENS"
          ? "reply hit the token cap before any text - raise maxOutputTokens"
          : `empty reply (finishReason ${cand.finishReason || "unknown"})`
      );
    }
    return gdParseReply(text);
  }

  // anthropic
  const data = await gdWithRetry("anthropic", () =>
    gdFetchJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      // required to call the API directly from a browser context
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      temperature: 0,
      system: GD_SYSTEM,
      messages: [{ role: "user", content: prompt }]
    })
    })
  );
  const block = (data.content || []).find((b) => b.type === "text");
  if (!block) throw new Error(`no text block (stop_reason ${data.stop_reason || "unknown"})`);
  return gdParseReply(block.text);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "GROUND") return;
  callLLM(msg)
    .then(sendResponse)
    .catch(async (e) => {
      // Say WHICH provider failed - a key sent to the wrong endpoint looks
      // identical to a bad key otherwise.
      const { provider } = await chrome.storage.local.get("provider");
      sendResponse({ error: `[${provider || "ollama"}] ${e.message}` });
    });
  return true; // keep the channel open for the async reply
});
