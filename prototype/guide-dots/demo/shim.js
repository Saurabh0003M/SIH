// DEMO HARNESS — lets the real extension code run on a plain web page.
//
// Everything in ../lib and ../content.js is loaded here UNMODIFIED. The only
// thing this file provides is the handful of chrome.* APIs a content script
// expects, backed by localStorage. If the guide works here, it is the shipping
// code that works, not a mock of it — which is the whole point: an extension
// that can only be seen by installing an extension is impossible to demo, review
// or regression-test.
//
// Two model paths, same as the extension:
//   offline  — no network at all, lib/local.js does the matching (default)
//   gemini   — a real API call, straight from the page
// Anything else, or any failure, degrades to offline via ground.js.

(function () {
  const store = {};
  try {
    Object.assign(store, JSON.parse(localStorage.getItem("gd_demo") || "{}"));
  } catch (e) {
    /* first run, or a browser with storage disabled */
  }
  if (!store.provider) store.provider = "offline";

  const persist = () => {
    try {
      localStorage.setItem("gd_demo", JSON.stringify(store));
    } catch (e) {
      /* private window: settings just won't survive the reload */
    }
  };

  const pick = (keys) => {
    if (keys === null || keys === undefined) return { ...store };
    const list = Array.isArray(keys) ? keys : [keys];
    const out = {};
    list.forEach((k) => {
      if (k in store) out[k] = store[k];
    });
    return out;
  };

  const GD_SYSTEM =
    "You help a human find the ONE element to click next to achieve their goal. " +
    "You are given a numbered list of elements visible on screen as id|role|name|x,y,w,h. " +
    'Reply with JSON only: {"id": <integer id from the list, or null>, ' +
    '"confidence": <0..1>, "reason": "<=12 words, why this element>", ' +
    '"next": "<=12 words, what the user will see after clicking it"}. ' +
    "Use null if nothing on this screen matches. Never invent an id that is not listed. " +
    "confidence must reflect genuine certainty, not politeness.";

  function prompt(msg) {
    const lines = msg.elements
      .map((e) => `${e.id}|${e.role}|${e.name}|${e.rect.x},${e.rect.y},${e.rect.w},${e.rect.h}`)
      .join("\n");
    const done = msg.history && msg.history.length ? `ALREADY DONE: ${msg.history.join(" -> ")}\n` : "";
    return `GOAL: ${msg.goal}\n${done}URL: ${msg.url}\nELEMENTS:\n${lines}\n\nPick the NEXT step. RETURN JSON ONLY.`;
  }

  function parse(text) {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("model did not return JSON");
    const o = JSON.parse(match[0]);
    return {
      id: o.id === null || o.id === undefined ? -1 : Number(o.id),
      confidence: Number(o.confidence),
      reason: String(o.reason || "").slice(0, 80),
      next: String(o.next || "").slice(0, 90)
    };
  }

  async function ground(msg) {
    if (store.provider !== "gemini" || !store.apiKey) {
      // ground.js reads provider itself and calls the offline planner. Returning
      // an error here would double-report; returning nothing is the signal.
      return { error: "demo harness: no live provider configured" };
    }
    const model = store.model || "gemini-2.5-flash";
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${store.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${GD_SYSTEM}\n\n${prompt(msg)}` }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 200 }
        })
      }
    );
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
    const data = await r.json();
    return parse(data.candidates[0].content.parts[0].text);
  }

  window.chrome = {
    runtime: {
      onMessage: { addListener() {} }, // nothing sends into the page here
      async sendMessage(msg) {
        if (!msg || msg.type !== "GROUND") return { error: "unknown message" };
        try {
          return await ground(msg);
        } catch (e) {
          return { error: String(e.message || e) };
        }
      }
    },
    storage: {
      local: {
        get(keys, cb) {
          const out = pick(keys);
          if (cb) {
            cb(out);
            return;
          }
          return Promise.resolve(out);
        },
        set(obj, cb) {
          Object.assign(store, obj);
          persist();
          if (cb) {
            cb();
            return;
          }
          return Promise.resolve();
        },
        remove(keys, cb) {
          (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete store[k]);
          persist();
          if (cb) {
            cb();
            return;
          }
          return Promise.resolve();
        }
      }
    }
  };

  // Exposed so the demo page's settings row can change providers without
  // reaching into localStorage itself.
  window.gdDemoConfig = {
    get: () => ({ ...store }),
    set: (obj) => {
      Object.assign(store, obj);
      persist();
    },
    reset: () => {
      Object.keys(store).forEach((k) => delete store[k]);
      store.provider = "offline";
      persist();
    }
  };
})();
