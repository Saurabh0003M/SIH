# Fastest MV3 Human-in-the-Loop Element Pointer

## Executive recommendation

For a hackathon MVP, build a **DOM-first, text-first MV3 extension**. Enumerate rendered interactive candidates in the content script; give each an ephemeral numeric ID; send a compact line-oriented list plus the user's goal to a cheap text model; validate the returned ID; then place one fixed-position dot in a closed extension-owned shadow root. Recompute the dot from the target's live `getBoundingClientRect()` on scroll, resize, DOM mutation, and after the human clicks.

Do **not** begin with canvas, a full accessibility-tree/CDP implementation, OmniParser, or autonomous clicking. The first credible demo needs only DOM access, ARIA-aware naming, structured LLM output, a human click listener, and a robust marker loop.

## Overlay marker

### Fastest reliable design

Use one extension-owned host appended to `document.documentElement`, attach a **closed shadow root**, and render markers inside a full-viewport container:

```css
:host, .overlay-root {
  all: initial;
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 2147483647;
  contain: layout style paint;
}
.marker {
  position: fixed;
  width: 16px;
  height: 16px;
  border: 3px solid white;
  border-radius: 999px;
  box-shadow: 0 1px 6px rgb(0 0 0 / 45%);
  transform: translate(-50%, -50%);
  transition: opacity 160ms linear;
}
```

For a chosen element, compute a visible point from its viewport rectangle. A good default is the upper-right inset, falling back to the center for tiny controls:

```js
function markerPoint(el) {
  const r = el.getBoundingClientRect();
  const x = r.width >= 28 ? r.right - 8 : r.left + r.width / 2;
  const y = r.height >= 28 ? r.top + 8 : r.top + r.height / 2;
  return {
    x: Math.max(8, Math.min(innerWidth - 8, x)),
    y: Math.max(8, Math.min(innerHeight - 8, y))
  };
}
```

Because `getBoundingClientRect()` is viewport-relative, pair it with `position: fixed`; do **not** add `scrollX` or `scrollY`. Update through one `requestAnimationFrame` scheduler attached to capturing `scroll`, `resize`, `visualViewport.scroll`, and `visualViewport.resize`. Add a `ResizeObserver` to the selected element and a debounced `MutationObserver` on the document.

### Divs versus canvas

| Approach | Speed to MVP | Accuracy and maintenance | Recommendation |
|---|---:|---|---|
| Fixed DOM dot in shadow root | Fastest | Natural CSS, simple color/opacity/tooltip, one live rectangle read | **Use this** |
| Absolute dot under `body` | Fast | Requires document-coordinate conversion and can be disturbed by body transforms/scroll containers | Acceptable fallback |
| Full-screen canvas | Slower | Useful for hundreds of boxes, but requires redraw, DPR scaling, text rendering, and hit-test bookkeeping | Skip for one/few dots |
| Popper/Floating UI | Slower | Excellent for collision-aware tooltips, unnecessary for a 16 px marker | Add later only if labels are needed |
| Modify target `outline`/`box-shadow` | Fastest code | Mutates site styles and can be clipped or overridden | Debug only |

A useful reference is [matatk/element-highlighter](https://github.com/matatk/element-highlighter), which demonstrates selector/XPath matching, mutation monitoring, non-interactive tints, and preserving/restoring target styles. Its manifest is MV2, and its tint uses absolute document coordinates (`scroll + rect`), so copy the lifecycle ideas rather than the positioning implementation.

### Fade behavior

Store repetitions by a stable-enough semantic fingerprint, not by the ephemeral LLM ID:

```text
origin + pathname-pattern + role + normalized-name + nearby-heading + form-id
```

After a successful human click, increment the fingerprint count and set opacity, for example, to `max(0.15, 1 - 0.18 * count)`. Keep confidence color independent: green at or above 0.80, amber from 0.55 to 0.79, red below 0.55. A red dot should mean “best guess, inspect carefully,” not “automatically act.”

## Fork candidates

| Repository | MV status | Relevant pieces | Distance from MVP |
|---|---|---|---|
| [bbuugg/ai-page-assist](https://github.com/bbuugg/ai-page-assist) | **MV3** | Content script, side panel, service worker, element selection, Anthropic/OpenAI-compatible/Ollama integration; manifest confirms MV3 and `debugger` support | **Closest extension shell**; add candidate enumeration, decision schema, and dot lifecycle. No detected license file at repository root, so verify permission with the author before redistributing a fork. |
| [gblikas/chrome-element-inspector](https://github.com/gblikas/chrome-element-inspector) | **MV3** | DevTools-like hover overlay and element inspection; TypeScript/Vite; GPL-3.0[^1] | **Closest small overlay fork**; add LLM/background and ARIA enumeration. |
| [matatk/element-highlighter](https://github.com/matatk/element-highlighter) | **MV2** | Selector/XPath highlighting, tints, outlines, mutation reruns, cleanup; license file present | Very close to highlighting, but port background/browser-action APIs to MV3 and replace absolute tint positioning. |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | Not an MV3 extension; Python/Playwright/CDP stack | Mature clickable-element extraction, selector map, indexed page overlays; MIT[^2][^3][^4] | Excellent **algorithm donor**, poor shell fork for an extension. Port its DOM-tree concepts, not the stack. |
| [browseros-ai/BrowserOS](https://github.com/browseros-ai/BrowserOS) | Chromium fork/application, not a normal extension | Full open-source agentic browser, local/cloud models, broad agent architecture; AGPL-3.0 | Far too large for the hackathon; architecture reference only. |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | MCP server plus browser connector, not your simple extension | Accessibility snapshots and a persistent browser-highlight action[^5] | Useful reference for snapshot/target semantics; not a fast fork. |
| [calmstate/VisualTagger](https://github.com/calmstate/VisualTagger) | Extension version exists; verify its current manifest before adopting | Adds borders and labels containing tag/ID/class to elements[^6] | Lightweight visual-tag donor, but not agentic or confidence-aware. |

**Fork order:** `ai-page-assist` if author/license clearance is acceptable; otherwise `chrome-element-inspector`; otherwise create a clean MV3 skeleton and port only small MIT-compatible concepts from `browser-use`.

## Element enumeration

### DOM-first hybrid

A normal content script can share and modify the page DOM even though its JavaScript world is isolated from page variables. It cannot directly obtain Chrome's computed accessibility tree through ordinary DOM APIs. The actual AX tree is available through the Chrome DevTools Protocol `Accessibility` domain, which requires the powerful `debugger` permission and attachment flow.[^7][^8][^9]

Therefore, use this progression:

1. **MVP:** DOM traversal plus accessible-name approximation.
2. **Hardening:** use a standards-based accessible-name library such as `dom-accessibility-api` rather than continuously expanding handwritten rules.
3. **Optional research mode:** attach `chrome.debugger` and query the AX tree only when DOM grounding fails; the permission is conspicuous and adds frame/node-mapping complexity.

On messy government sites, a **hybrid DOM scan is more operationally robust** than either a narrow selector list or AX-only collection. Old sites often have native links, image inputs, inline handlers, tabindex controls, and poor/missing ARIA; AX-only filtering can omit malformed but visibly clickable controls, while a narrow selector misses custom widgets.

### Candidate collection

Walk the document and every **open** shadow root recursively. Include:

```text
a[href], area[href], button, input:not([type=hidden]), select, textarea,
summary, details > summary, [contenteditable]:not([contenteditable=false]),
[role=button|link|checkbox|radio|switch|tab|menuitem|option|combobox|textbox|slider|spinbutton],
[tabindex]:not([tabindex="-1"])
```

Add conservative heuristics for `[onclick]`, elements with cursor `pointer`, and custom elements only when they are visible and have text/ARIA/name metadata. Cursor-pointer is a recall fallback, not a primary signal; otherwise a navigation-heavy page produces excessive noise.

Filter candidates using computed style and geometry:

- Reject `display:none`, `visibility:hidden/collapse`, `content-visibility:hidden`, `disabled`, `aria-disabled=true`, inert subtrees, zero-area rectangles, and elements fully outside an expanded viewport.
- Keep partially visible elements; intersect the rectangle with the visual viewport.
- Prefer the deepest actionable descendant when candidates nest.
- Deduplicate elements with essentially identical rectangles and semantic names.
- Optionally verify the candidate is not fully covered using `document.elementsFromPoint()` at its center and corners.

### Accessible names

Implement name extraction in this order: `aria-labelledby` text, `aria-label`, associated `abel>` text, native/element text, `alt`, `title`, `placeholder`, then nearby context. `aria-labelledby` has high precedence and can concatenate multiple referenced nodes; accessible names can also come from native labels, descendants, `alt`, and other sources.[^10][^11][^12]

For the MVP payload, preserve both **visible text** and **accessible name** because broken sites may provide one but not the other:

```json
{
  "id": 37,
  "tag": "button",
  "role": "button",
  "name": "Continue",
  "text": "NEXT",
  "type": null,
  "state": {"disabled": false, "checked": null, "expanded": null},
  "rect": [902, 611, 104, 38],
  "context": "Application status",
  "frame": "top"
}
```

Do not send selectors to the model. Keep `Map<number, WeakRef<Element>>` locally, return only `id`, confidence, and a short reason, and resolve the selected ID back to the live node. This avoids asking the model to synthesize brittle CSS.

## LLM transport

### Hackathon versus production

For a one-user hackathon demo, call the provider from the **background service worker**, not the content script. MV3 service workers/extension pages can make cross-origin requests to origins declared in `host_permissions`; content scripts are subject to the page's CORS behavior and should relay requests through extension messaging.[^13][^14][^15]

Direct Anthropic browser calls can be explicitly enabled with `anthropic-dangerous-direct-browser-access: true`, but the header name accurately warns that the user's key is exposed to the extension/client environment. A BYOK prototype can accept that trade-off if the key belongs to the local user, is never hard-coded, and is stored in `chrome.storage.session` where possible; Chrome notes that session storage is memory-backed and not exposed to content scripts by default.[^16][^17][^18]

For judges, teammates, a public demo, or store distribution, use a tiny proxy such as a Cloudflare Worker/Vercel function. The proxy holds the provider secret, applies per-user authentication, origin/extension checks, a strict model allow-list, maximum payload/output sizes, rate limits, and spend caps. The extension sends only page-derived candidates and the user goal; never ship a shared API key in extension JavaScript.

### Manifest hosts

Use exact API origins rather than `<all_urls>` for model traffic:

```json
"host_permissions": [
  "https://api.openai.com/*",
  "https://api.anthropic.com/*"
]
```

Page-reading permission is separate. For the cleanest hackathon install warning, use `activeTab` plus `scripting` and inject only after the user clicks the extension. Switch to optional host permissions later if persistent operation across sites is needed.

### Cheapest payload

Send compact text, not HTML:

```text
GOAL: Check application status
URL: https://example.gov/status
ELEMENTS:
12|link|Home|92,18,51,24||
13|textbox|Application number|212,184,310,42|required|
14|button|Check status|534,184,122,42||
RETURN JSON: {"id":integer|null,"confidence":0..1,"reason":"<=12 words"}
```

Optimizations, in order:

- Include only rendered candidates in or near the viewport; expand after a `scroll` recommendation or no-match.
- Cap names/context lengths and omit class lists, full HTML, computed styles, and XPath.
- Send a page fingerprint plus deltas after the first turn if the provider supports useful prompt caching.
- Require strict structured output with three fields and a tiny output-token cap.
- Attach a compressed screenshot only on escalation; `captureVisibleTab()` captures the visible area and requires `activeTab` or suitable host permission.[^19][^20]

## Grounding policy

A text-only model is usually sufficient when the candidate set contains a unique semantic match. It is especially strong for native controls and correctly labeled ARIA widgets. It is not reliable enough to trust its self-reported confidence alone, so combine model confidence with deterministic page-quality signals.

### Decision rule

Compute a local `groundingQuality` for the selected candidate:

- `+0.30` non-empty accessible name.
- `+0.20` name shares meaningful terms or a synonym with the goal.
- `+0.15` native interactive element or recognized widget role.
- `+0.15` unique name/role among visible candidates.
- `+0.10` nearby heading/form context supports the goal.
- `+0.10` candidate is visible and not substantially occluded.
- `-0.25` icon-only or empty name.
- `-0.20` multiple near-identical candidates.
- `-0.20` target is canvas/SVG-only, closed shadow content, or otherwise absent from the DOM list.

Use this routing:

```text
If modelConfidence >= 0.80 and groundingQuality >= 0.75:
    green DOM dot; no screenshot
Else if modelConfidence >= 0.55 and groundingQuality >= 0.55:
    amber DOM dot; human verifies
Else if selected candidate exists and has a usable rectangle:
    red DOM dot plus top-3 alternatives; do not invoke vision automatically unless requested
Else:
    capture visible screenshot and invoke the vision/GUI path
```

Also escalate when the returned ID is invalid, the live element disappeared, the top two model candidates are within roughly 0.10 confidence, or two consecutive human clicks fail to produce meaningful DOM/URL/state change.

### Model choices

- **Cheapest text path:** `gpt-5-nano` is an economical structured classifier at $0.05 per million input tokens and $0.40 per million output tokens. If using Google, Gemini 2.5 Flash-Lite is similarly cheap at $0.10/$0.40 but is reported as approaching retirement in October 2026, so avoid a new dependency unless the endpoint remains available.[^21][^22][^23]
- **Safer text fallback:** use one tier above nano only when ambiguity is detected; do not pay frontier-model prices on every click.
- **Cheapest vision path:** first try the provider's small multimodal model with one downscaled visible-tab screenshot and the goal. If local hardware or a local service is acceptable, GUI-Actor has 2B/3B MIT-licensed variants designed for GUI grounding.[^24][^25]
- **Parser path:** OmniParser converts a screenshot into detected UI regions plus captions, but its icon detector weights inherit AGPL while caption components are MIT; it adds a local service and is not the fastest MVP.[^26][^27]

The key architectural distinction is that GUI-Actor grounds a goal to coordinates/regions, while OmniParser first converts the screenshot into a structured region list that another model selects. For a Chrome extension already possessing DOM rectangles, both are fallback systems, not the default.

## Failure modes

| Breakage | Why it fails | Cheapest fix |
|---|---|---|
| Same-origin or cross-origin iframe | Top document cannot query a cross-origin frame DOM | Inject the content script with `all_frames:true`; each frame enumerates its own document, returns frame-scoped IDs, and draws its own local marker. Chrome checks each frame against URL permissions.[^7][^28] |
| `about:blank`, `srcdoc`, `blob:` frame | URL does not independently match | Add `match_origin_as_fallback:true`; it covers related opaque/special-scheme frames created by a matching origin.[^7][^28] |
| Frame marker coordination | Frame rectangles are relative to each frame viewport | Simplest: let the winning frame render the dot itself. Do not translate through nested frame offsets unless the top frame must own every marker. |
| Open shadow DOM | `querySelectorAll` does not cross shadow boundaries | Recursively visit every `element.shadowRoot`; observe discovered roots. |
| Closed shadow DOM | `element.shadowRoot` is null and internals are inaccessible from outside JavaScript[^29] | Treat the host as a candidate using host role/name/rectangle; if unlabeled, escalate to screenshot vision. Instrumenting `attachShadow` in the main world is invasive and too late for pre-existing roots. |
| `position:fixed` / sticky targets | Absolute document overlay drifts or disagrees with viewport behavior | Use fixed marker plus live `getBoundingClientRect()`. |
| CSS transforms/zoom | Layout position differs from naive offsets | Use `getBoundingClientRect`, never `offsetTop/Left`; clamp marker to viewport. |
| Nested scroll containers | Window scroll listener alone misses scrolls | Listen to `scroll` on `document` in capture phase; schedule one RAF update. |
| Dynamic SPA rerender | Stored `Element` becomes detached or semantically replaced | `MutationObserver` with 150-300 ms quiet debounce, validate `isConnected`, then re-enumerate and rerun. |
| SPA navigation | No full page load | Watch `popstate`, compare `location.href` during mutations/clicks, and optionally patch `pushState/replaceState` through a small main-world bridge. |
| Virtualized lists | Desired item is not in DOM until scrolling | Start viewport-only; if no match, ask the text model for `scroll: up/down` or expose a “scan next viewport” button. |
| Occlusion/modal | Geometry exists but another element intercepts clicks | Use `elementsFromPoint` at center/corners and prioritize the topmost actionable element; rescan when a dialog appears. |
| Canvas/WebGL/SVG icons | No meaningful HTML candidate/name | Vision fallback. For SVG, include focusable or role-bearing SVG elements before escalating. |
| Browser internal pages | Content-script injection prohibited on `chrome://` and some protected pages | Display “unsupported page”; do not fight platform restrictions. |
| PDF viewer | DOM belongs to Chrome's viewer, not the PDF's semantic controls/content | Mark unsupported in MVP or build a separate PDF mode later. |

## Event loop

Use human clicks as the progression signal without preventing or synthesizing them:

```text
1. User enters goal and presses Guide.
2. Enumerate candidates; assign IDs; call text model.
3. Validate ID against current candidate map; render confidence-colored dot.
4. Add one capturing document click listener, but never preventDefault/stopPropagation.
5. If click path contains the suggested target (or its label/descendant), increment repeat count.
6. Wait for DOM quiet: 200 ms since last mutation, maximum 1.5 s.
7. Re-enumerate and ask for the next step using goal + last action + compact candidates.
8. Remove the old marker before rendering the new one.
```

Do not rerun after every random click while the guide is inactive. Use an `AbortController` per run so a new click/navigation cancels stale provider responses.

## File-by-file MVP

```text
extension/
  manifest.json
  src/
    background.js
    content.js
    enumerate.js
    accessible-name.js
    overlay.js
    session.js
    protocol.js
    popup.html
    popup.js
    popup.css
    options.html
    options.js
  icons/
```

### `manifest.json`

MV3; `background.service_worker`; `activeTab`, `scripting`, `storage`; exact provider/proxy `host_permissions`; content script with `all_frames:true` and `match_origin_as_fallback:true` if iframe support is included on day one. Avoid `debugger` until an AX-tree experiment proves necessary.

### `popup.html/js/css`

Goal text box, Guide/Stop buttons, provider/model selector, and current status. Send `{type:"START", goal}` to the active tab. Keep page data out of the popup; it can close at any time.

### `content.js`

Own the per-frame loop: enumerate, message the background, validate response, draw marker, observe the human click, wait for quiescence, and repeat. Maintain the ID-to-element map only in memory.

### `enumerate.js`

Recursive document/open-shadow traversal, candidate tests, visibility/occlusion filtering, role inference, rectangle intersection, deduplication, nearby-context extraction, and payload truncation.

### `accessible-name.js`

For day one, implement the naming precedence above. Replace it with a tested accessible-name computation package during hardening; do not attempt to recreate the full AccName standard indefinitely.

### `overlay.js`

Closed shadow root, one marker element, confidence colors, opacity fading, RAF position scheduler, selected-element `ResizeObserver`, viewport listeners, and cleanup through `AbortController`.

### `background.js`

Receive candidate payloads, load BYOK from session/local storage for the private prototype or call the proxy, make provider `fetch`, enforce timeout and output schema, and return normalized `{id, confidence, reason}`. Hold no long-running loop because MV3 workers suspend.

### `session.js`

Goal, step number, last selected semantic fingerprint, repetition counts, last action summary, and cancellation IDs. Persist only what must survive navigation; use `chrome.storage.session` for sensitive/temporary state.[^18]

### `protocol.js`

Shared message constants and runtime validators. Validate provider output as untrusted input: integer ID in the current candidate set, finite confidence clamped to 0-1, short reason, and no executable selectors/code.

### `options.html/js`

BYOK and endpoint configuration. For a public demo, hide provider credentials entirely and configure only the authenticated proxy URL.

## Ranked implementation paths

1. **Fastest:** clean MV3 skeleton or `ai-page-assist` shell + fixed shadow-root DOM dot + DOM/ARIA candidate list + service-worker text-model call + human click rerun. Expected hackathon-quality implementation: one focused day.
2. **Fast with stronger overlay:** fork `chrome-element-inspector`, retain its MV3 hover/overlay foundation, then add enumeration and the LLM decision loop. Best when its GPL-3.0 license is acceptable.
3. **Algorithm-first:** port candidate-tree/index ideas from `browser-use` into a clean

---

## References

1. [GitHub - gblikas/chrome-element-inspector: Inspect elements like Google Chrome DevTools 🚀 🔍](https://github.com/gblikas/chrome-element-inspector) - Inspect elements like Google Chrome DevTools 🚀 🔍. Contribute to gblikas/chrome-element-inspector dev...

2. [GitHub - browser-use/browser-use: Make websites accessible for AI ...](https://github.com/browser-use/browser-use) - Browser Use lets an AI agent use a web browser the same way humans do — it opens pages, clicks butto...

3. [Hide highlight overlay from the browser navigation · Issue #225 · browser-use/browser-use](https://github.com/browser-use/browser-use/issues/225) - Hi, I was wondering if it is possible to hide from the browser live navigation the highlighted overl...

4. [browser-use/browser_use/dom/service.py at main · browser-use/browser-use](https://github.com/browser-use/browser-use/blob/main/browser_use/dom/service.py) - 🌐 Make websites accessible for AI agents. Automate tasks online with ease. - browser-use/browser-use

5. [Playwright MCP server](https://github.com/microsoft/playwright-mcp) - Playwright MCP server. Contribute to microsoft/playwright-mcp development by creating an account on ...

6. [GitHub - calmstate/VisualTagger: Visual Tagger is a JavaScript tool that visually highlights HTML elements for AIs, aiding in identifying interactive components on web pages.](https://github.com/calmstate/VisualTagger) - Visual Tagger is a JavaScript tool that visually highlights HTML elements for AIs, aiding in identif...

7. [Content scripts | Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) - An explanation of content scripts and how to use them in your Chrome Extension.

8. [third_party/blink/public/devtools_protocol/browser_protocol.pdl](https://chromium.googlesource.com/chromium/src/+/2f41a8e7fb08c23517c85c29e498b803eb53d36e/third_party/blink/public/devtools_protocol/browser_protocol.pdl)

9. [chrome.debugger | API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/debugger)

10. [Providing Accessible Names and Descriptions | APG | WAI](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/) - Accessibility resources free online from the international standards organization: W3C Web Accessibi...

11. [ARIA: aria-label attribute - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label) - The aria-label attribute defines a string value that can be used to name an element, as long as the ...

12. [ARIA: aria-labelledby attribute - MDN Web Docs - Mozilla](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby) - The aria-labelledby attribute identifies the element (or elements) that labels the element it is app...

13. [Stay secure | Chrome for Developers](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure) - How to keep your Chrome Extension secure.

14. [Declare permissions | Chrome Extensions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) - An overview of the valid values for the permissions property in manifest.json.

15. [Changes to Cross-Origin Requests in Chrome Extension ...](https://www.chromium.org/Home/chromium-security/extension-content-script-fetches/)

16. [Anthropic API not working · Issue #61 · 10cl/chatdev](https://github.com/10cl/chatdev/issues/61) - Describe the bug When I use the anthropic API I get this error: {"type":"error","error":{"type":"aut...

17. [Claude's API now supports CORS requests, enabling client ...](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) - Anthropic have enabled CORS support for their JSON APIs, which means it’s now possible to call the C...

18. [chrome.storage | API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/storage)

19. [tabs.captureVisibleTab() - Mozilla - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/captureVisibleTab) - Creates a data URL encoding the image of an area of the active tab in the specified window. You must...

20. [chrome.tabs | API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/tabs)

21. [Agent Platform Pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) - Discover flexible pricing for training, deployment, and prediction for Generative AI models with Ver...

22. [Google Gemini API Pricing Guide 2026: Flash, Pro, and ...](https://curlscape.com/blog/google-gemini-api-pricing-guide-2026) - Current Google Gemini API pricing for 2026: Gemini 3 generation (3.1 Pro, 3.5 Flash, 3.1 Flash-Lite)...

23. [GPT-5 nano Model | OpenAI API](https://developers.openai.com/api/docs/models/gpt-5-nano)

24. [README.md · microsoft/GUI-Actor-3B-Qwen2.5-VL at ...](https://huggingface.co/microsoft/GUI-Actor-3B-Qwen2.5-VL/blob/ccb5330c9977ba016992040b4b6d09966fd104db/README.md) - We’re on a journey to advance and democratize artificial intelligence through open source and open s...

25. [raw](https://huggingface.co/microsoft/GUI-Actor-2B-Qwen2-VL/raw/main/README.md)

26. [OmniParser for Pure Vision Based GUI Agent](https://microsoft.github.io/OmniParser/) - OMNIPARSER, a comprehensive method for parsing user interface screenshots into structured elements, ...

27. [GitHub - microsoft/OmniParser: A simple screen parsing tool towards pure vision based GUI agent](https://github.com/microsoft/OmniParser/tree/master) - A simple screen parsing tool towards pure vision based GUI agent - microsoft/OmniParser

28. [Content Scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts) - Reference documentation for the "content_scripts" property of manifest.json.

29. [ShadowRoot: mode property - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/mode) - The mode read-only property of the ShadowRoot specifies its mode — either open or closed. This defin...

