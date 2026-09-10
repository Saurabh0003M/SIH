const $ = (id) => document.getElementById(id);
const goalEl = $("goal"), apiKeyEl = $("apiKey"), statusEl = $("status");
const keyState = $("keyState"), keyBox = $("keyBox"), providerEl = $("provider");
const customBox = $("customBox"), baseUrlEl = $("baseUrl"), modelEl = $("modelName");

const CONTENT_FILES = [
  // redact.js and remember.js must precede tree.js: gdAccessibleName calls the
  // redactor on every name, so injecting tree.js alone throws on a real page.
  "lib/redact.js", "lib/remember.js",
  "lib/tree.js", "lib/dots.js", "lib/local.js", "lib/ground.js",
  "lib/fade.js", "lib/chat.js", "lib/screen.js", "content.js"
];

let provider = "ollama";
let savedKey = "";

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#b91c1c" : "#166534";
}

function needsKeyFor(p) {
  return p !== "ollama" && p !== "offline";
}

function render() {
  const needsKey = needsKeyFor(provider);
  customBox.hidden = provider !== "custom";
  keyState.hidden = !needsKey || !savedKey;
  keyBox.hidden = !needsKey || Boolean(savedKey);
}

// Bump this when config.local.js changes and should override saved settings.
const GD_CONFIG_VERSION = 5;

chrome.storage.local.get(
  ["apiKey", "provider", "baseUrl", "model", "configVersion"],
  (d) => {
    const c = (typeof GD_CONFIG !== "undefined" && GD_CONFIG) || {};
    // One-time adoption: a stale saved provider would otherwise beat the
    // baked-in defaults forever, which is exactly what sent a key to Anthropic.
    // Gate on the PROVIDER, not the key. Gating on the key meant a config that
    // switched provider but left the key blank was ignored, so a saved
    // "ollama" from an earlier version silently outlived the change - the
    // extension then tried a local model that may not even be running.
    const adopt = Boolean(c.provider || c.apiKey) && d.configVersion !== GD_CONFIG_VERSION;

    savedKey = adopt ? c.apiKey || "" : d.apiKey || "";
    provider = adopt ? c.provider || "offline" : d.provider || "ollama";
    const baseUrl = adopt ? c.baseUrl : d.baseUrl || "";
    const modelList = adopt ? c.models : d.model || "";

    if (adopt) {
      chrome.storage.local.set({
        apiKey: savedKey,
        provider,
        baseUrl,
        model: modelList,
        geminiModel: "",
        configVersion: GD_CONFIG_VERSION
      });
    }

    providerEl.value = provider;
    apiKeyEl.value = savedKey;
    baseUrlEl.value = baseUrl;
    modelEl.value = modelList;
    render();
    goalEl.focus();
    const LABEL = {
      offline: "no model - words only",
      ollama: "Local model",
      custom: "your gateway",
      gemini: "Gemini",
      anthropic: "Anthropic"
    };
    setStatus("Ready - using " + (LABEL[provider] || provider) + ".");
  }
);

// The goal belongs to one task on one page - never carry it to another tab.
chrome.storage.local.remove("goal");

function saveKey() {
  const v = apiKeyEl.value.trim();
  if (!v || v === savedKey) return;
  savedKey = v;
  // A different key may reach different models, so drop the cached one.
  chrome.storage.local.set({ apiKey: v, geminiModel: "" }, () => {
    render();
    setStatus("API key saved. You won't need to paste it again.");
  });
}
apiKeyEl.addEventListener("change", saveKey);
apiKeyEl.addEventListener("blur", saveKey);

function saveCustom() {
  // provider included deliberately: selecting it and hitting Start immediately
  // could otherwise race the async write and use the previous provider.
  chrome.storage.local.set({
    provider,
    baseUrl: baseUrlEl.value.trim(),
    model: modelEl.value.trim()
  });
}
baseUrlEl.addEventListener("blur", saveCustom);
modelEl.addEventListener("blur", saveCustom);

$("changeKey").addEventListener("click", () => {
  savedKey = "";
  apiKeyEl.value = "";
  render();
  apiKeyEl.focus();
  setStatus("Paste the new key.");
});

providerEl.addEventListener("change", () => {
  provider = providerEl.value;
  chrome.storage.local.set({ provider }, () => {
    render();
    setStatus(
      provider === "offline"
        ? "No model at all - matches your words against the page."
        : provider === "ollama"
          ? "Using your local model - no key, no internet needed."
          : "Using " + provider + "."
    );
  });
});

async function send(type) {
  saveKey();
  saveCustom();
  const goal = goalEl.value.trim();

  if (type === "START" && !goal) return setStatus("Type a goal first.", true);
  if (type === "START" && needsKeyFor(provider) && !savedKey)
    return setStatus("Paste your API key first.", true);
  if (type === "START" && provider === "custom" && !baseUrlEl.value.trim())
    return setStatus("Enter the gateway base URL.", true);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return setStatus("No active tab.", true);
  if (/^(chrome|edge|about|chrome-extension):/.test(tab.url || "")) {
    return setStatus("Browser pages are off-limits. Open a normal website.", true);
  }

  const done = () =>
    setStatus(type === "START" ? "Guiding... look for the dot." : type.toLowerCase() + "ed.");

  try {
    await chrome.tabs.sendMessage(tab.id, { type, goal });
    done();
  } catch {
    // Nothing is listening in this tab. Usually that means the content script
    // was never injected here. But it can also mean the extension was reloaded
    // while the page stayed open: the old script's context is dead, yet its
    // top-level declarations are still in the isolated world. Re-running the
    // files there throws "Identifier 'gdChatRoot' has already been declared" on
    // every single one, and the user sees ten red lines and no dot. Ask first.
    try {
      const [probe] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => typeof gdMountChat === "function"
      });
      if (probe && probe.result) {
        return setStatus("Reload this page once - the extension was updated underneath it.", true);
      }
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: CONTENT_FILES });
      await chrome.tabs.sendMessage(tab.id, { type, goal });
      done();
    } catch (e) {
      setStatus("Couldn't reach the page: " + e.message, true);
    }
  }
}

$("start").addEventListener("click", () => send("START"));
$("pause").addEventListener("click", () => send("PAUSE"));
$("stop").addEventListener("click", () => send("STOP"));
$("testdot").addEventListener("click", () => send("TESTDOT"));


// ---- spaced practice ------------------------------------------------------
// A procedure done once is not a procedure retained. Anything the learner has
// mastered comes back here with a review date from lib/remember.js (FSRS).
async function renderDue() {
  const box = $("due");
  if (!box || typeof gdReviewDue !== "function") return;
  let items = [];
  try {
    items = await gdReviewDue(3);
  } catch (e) {
    return; // the popup must open even if storage is unavailable
  }
  if (!items.length) {
    box.textContent = "";
    return;
  }
  box.innerHTML =
    '<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb;' +
    'font-size:11px;color:#6b7280">Due for practice</div>' +
    items
      .map((it) => {
        const [site, task] = it.key.split("::");
        const label = gdReviewLabel(it);
        const overdue = it.due <= Date.now();
        return (
          '<div style="font-size:12px;margin-top:4px;color:#111">' +
          task.replace(/[<>&]/g, "") +
          ' <span style="color:#6b7280">on ' + site.replace(/[<>&]/g, "") + '</span>' +
          ' <span style="color:' + (overdue ? "#b91c1c" : "#6b7280") + '">- ' + label + "</span></div>"
        );
      })
      .join("");
}

renderDue();
