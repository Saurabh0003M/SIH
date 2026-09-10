# Disha — install it in four minutes

Disha is a Chrome extension. It reads the page you are on, works out the **one** control you should
click next, and draws a coloured dot on it. **You click. Disha never does.**

There is no build step, no npm install, no account and no server.

---

## 1. Load it into Chrome

1. Unzip this folder anywhere you like.
2. Open **`chrome://extensions`**.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and pick the unzipped folder — the one containing `manifest.json`.

That is the whole install. The extension icon appears in the toolbar.

## 2. Try it with no key at all

It works out of the box with **no model, no key and no internet**: it matches your words against the
page's own control names.

1. Open **`demo/index.html`** from the unzipped folder in Chrome (double-click it, or drag it into a
   tab). This is a fictional broker portal built only to practise on — no real money, no real
   accounts, nothing is sent anywhere.
2. In the on-page **Disha** panel at the bottom-right, type: **`i want to take my money out`**
3. Press **Ask**.

You will see a dot appear on **Wallet**. Click it yourself. The next dot appears on the next page,
and so on for four steps. Hover near a dot to see what happens *after* you click it.

**The colours are the point.** Amber means "best guess — check before clicking". Red means "not sure —
verify this one". With no model attached, Disha is capped below green **by design**, so on this run
you should see roughly **64% → 57% → red 51% → 75%**. It never pretends to be confident.

## 3. Paste a Gemini key to see it at full strength

Green needs two independent judgements to agree: the model must be ≥ 0.80 **and** the page evidence
must be ≥ 0.75. The word-matcher alone can never clear the first bar, so you need a model.

1. Get a free key at **https://aistudio.google.com/apikey**.
2. Click the Disha toolbar icon.
3. Choose **Gemini API** in the dropdown, paste the key in the box, and click away — it saves itself.
4. Go back to the demo page (or any real website) and ask again.

The key is stored in Chrome's local extension storage on your own machine. It is never written to
this folder and never leaves your browser except in the request to Google.

### If the Gemini free tier runs out

It does run out — it is a daily cap, so it comes back, but not necessarily when you need it. Disha
speaks to **any OpenAI-compatible gateway**, so you are never stuck on one provider.

Make a free key at **https://openrouter.ai/keys**, then in the popup choose
**My gateway (OpenAI-compatible)** and fill in:

| Field | Value |
|---|---|
| Base URL | `https://openrouter.ai/api/v1` |
| Models | `google/gemma-4-26b-a4b-it:free, nvidia/nemotron-3.5-lightning:free, nex-agi/nex-n2.5-mini:free` |
| API key | your OpenRouter key |

Models are comma-separated on purpose: Disha races the fastest few and uses whichever answers first,
so one model being rate-limited does not stop the demo. Anything ending `:free` costs nothing — there
were **18 such models** when this was written, and the current list is at
https://openrouter.ai/api/v1/models (it is public, no key needed).

The same three fields work for any other OpenAI-compatible endpoint, including NVIDIA's
`https://integrate.api.nvidia.com/v1` and Azure AI Foundry.

## 4. Use it on a real site

Open any website, click the toolbar icon, type what you want to do, and press **Start**.
Chrome's own pages (`chrome://…`) are off-limits to every extension, including this one.

Two things worth knowing:

- **The Pause button is real.** Before you type an OTP, a password or a card number, press **Pause**.
  Disha stops reading the page until you press Start again.
- **Only control names ever leave your device** — the visible label of each button and field, with
  Aadhaar numbers, PANs, phone numbers, card and account numbers masked out first. Your page text,
  your form values and your credentials are never sent anywhere.

---

## What is in this folder

| Path | What it is |
|---|---|
| `manifest.json`, `background.js`, `content.js` | the extension itself |
| `lib/` | the parts that do the thinking — `tree.js` reads the page, `ground.js` scores the evidence, `dots.js` draws, `fade.js` removes the help once you have earned it, `remember.js` schedules the return visit, `redact.js` masks personal numbers |
| `demo/` | the practice portal, and a `chrome.*` shim so the same unmodified code runs as a plain web page. See `demo/README.md`. |
| `test/` | the recording and measurement rigs. They need Node 22+ and Chrome on a debugging port; they are not needed to use Disha. |
| `config.local.js` | defaults only. **No key is in this file** — it just tells Disha to start in no-model mode. |

## If something does not work

- **No dot appears, and no message either.** Reload the page after loading the extension — a content
  script is not injected into tabs that were already open.
- **"Couldn't reach the page".** You are on a `chrome://` page or the Chrome Web Store. Open a normal
  website.
- **Everything is red.** That is Disha being honest about a page it cannot read confidently, not a
  crash. Unlabelled or icon-only controls are its weakest case, and it says so instead of guessing.
- **Nothing happens with "Local model".** That option expects Ollama running on your machine. Pick
  **No model** or **Gemini API** instead.
