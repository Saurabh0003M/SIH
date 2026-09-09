const $ = (id) => document.getElementById(id);
const goalEl = $("goal"), apiKeyEl = $("apiKey"), statusEl = $("status");
const keyState = $("keyState"), keyBox = $("keyBox"), providerEl = $("provider");
const customBox = $("customBox"), baseUrlEl = $("baseUrl"), modelEl = $("modelName");

const CONTENT_FILES = ["lib/tree.js", "lib/dots.js", "lib/ground.js", "lib/fade.js", "content.js"];

let provider = "ollama";
let savedKey = "";

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#b91c1c" : "#166534";
}

function render() {
  const needsKey = provider !== "ollama";
  customBox.hidden = provider !== "custom";
  keyState.hidden = !needsKey || !savedKey;
  keyBox.hidden = !needsKey || Boolean(savedKey);
}

// Bump this when config.local.js changes and should override saved settings.
const GD_CONFIG_VERSION = 3;

chrome.storage.local.get(
  ["apiKey", "provider", "baseUrl", "model", "configVersion"],
  (d) => {
    const c = (typeof GD_CONFIG !== "undefined" && GD_CONFIG) || {};
    // One-time adoption: a stale saved provider would otherwise beat the
    // baked-in defaults forever, which is exactly what sent a key to Anthropic.
    const adopt = Boolean(c.apiKey) && d.configVersion !== GD_CONFIG_VERSION;

    savedKey = adopt ? c.apiKey : d.apiKey || "";
    provider = adopt ? c.provider : d.provider || "ollama";
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
      provider === "ollama"
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
  if (type === "START" && provider !== "ollama" && !savedKey)
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
    // Content script not in this tab yet - normal after reloading the extension.
    try {
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
