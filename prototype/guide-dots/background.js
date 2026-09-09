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

const GD_SYSTEM =
  "You help a human find the ONE element to click next to achieve their goal. " +
  "You are given a numbered list of elements visible on screen as id|role|name|x,y,w,h. " +
  'Reply with JSON only: {"id": <integer id from the list, or null>, ' +
  '"confidence": <0..1>, "reason": "<=12 words"}. ' +
  "Use null if nothing on this screen matches. Never invent an id that is not listed. " +
  "confidence must reflect genuine certainty, not politeness.";

const GD_DEFAULT_MODEL = {
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-2.5-flash",
  ollama: "llama3.2:3b"
};

function gdPrompt({ goal, url, elements, history }) {
  const lines = elements
    .map((e) => `${e.id}|${e.role}|${e.name}|${e.rect.x},${e.rect.y},${e.rect.w},${e.rect.h}`)
    .join("\n");
  const done = history && history.length ? `ALREADY DONE: ${history.join(" -> ")}\n` : "";
  return `GOAL: ${goal}\n${done}URL: ${url}\nELEMENTS:\n${lines}\n\nPick the NEXT step. RETURN JSON ONLY.`;
}

function gdParseReply(text) {
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) throw new Error("model did not return JSON");
  const o = JSON.parse(match[0]);
  return {
    id: o.id === null || o.id === undefined ? -1 : Number(o.id),
    confidence: Number(o.confidence),
    reason: String(o.reason || "").slice(0, 80)
  };
}

async function gdFetchJson(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.json();
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

const GD_RACE_COUNT = 2; // race the 2 best. 3 costs ~50% more for marginal gain.

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
    const data = await gdFetchJson("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: `${GD_SYSTEM}\n\n${prompt}`,
        stream: false,
        format: "json", // small models drift without this
        options: { temperature: 0 }
      })
    });
    return gdParseReply(data.response);
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

    const attempt = (model) => {
      const started = Date.now();
      return gdFetchJson(base + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
          "HTTP-Referer": "https://sih-disha.local",
          "X-Title": "Disha"
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 200,
          messages: [
            { role: "system", content: GD_SYSTEM },
            { role: "user", content: prompt }
          ]
        })
      })
        .then((d) => {
          const parsed = gdParseReply(d.choices[0].message.content);
          const ms = Date.now() - started;
          gdRecord(model, true, ms);
          console.log(`[GuideDots] ${model} answered in ${ms}ms`);
          return parsed;
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
    const data = await gdFetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${cfg.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${GD_SYSTEM}\n\n${prompt}` }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 200 }
        })
      }
    );
    return gdParseReply(data.candidates[0].content.parts[0].text);
  }

  // anthropic
  const data = await gdFetchJson("https://api.anthropic.com/v1/messages", {
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
  });
  return gdParseReply(data.content[0].text);
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
