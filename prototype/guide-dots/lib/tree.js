// Enumerate visible interactive elements and KEEP LIVE REFERENCES to them.
// getInteractiveElements() -> plain data for the model (ids are array indices)
// gdGetElement(id)         -> the live DOM node, or null if it's gone

const GD_SELECTOR = [
  "a[href]", "area[href]", "button", "input:not([type=hidden])", "select", "textarea",
  "summary", "[contenteditable]:not([contenteditable=false])",
  "[role=button]", "[role=link]", "[role=checkbox]", "[role=radio]", "[role=switch]",
  "[role=tab]", "[role=menuitem]", "[role=option]", "[role=combobox]", "[role=textbox]",
  "[onclick]", "[tabindex]:not([tabindex='-1'])"
].join(",");

let gdElements = []; // live nodes; index === id

function gdAccessibleName(el) {
  const labelledBy = (el.getAttribute("aria-labelledby") || "")
    .split(/\s+/).filter(Boolean)
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((n) => n.textContent)
    .join(" ");
  const nativeLabel = el.labels && el.labels[0] ? el.labels[0].textContent : "";
  const raw =
    labelledBy ||
    el.getAttribute("aria-label") ||
    nativeLabel ||
    (el.tagName === "INPUT" ? el.value || "" : el.textContent) ||
    el.getAttribute("alt") ||
    el.getAttribute("title") ||
    el.getAttribute("placeholder") ||
    "";
  return raw.trim().replace(/\s+/g, " ").slice(0, 80);
}

function gdRole(el) {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === "a" || tag === "area") return "link";
  if (tag === "textarea") return "textbox";
  if (tag === "input") {
    const t = (el.type || "text").toLowerCase();
    if (t === "submit" || t === "button" || t === "image") return "button";
    if (t === "checkbox" || t === "radio") return t;
    return "textbox";
  }
  return tag;
}

// Modern SPAs hide controls inside shadow roots, which querySelectorAll won't cross.
function gdCollect(root, bag) {
  root.querySelectorAll(GD_SELECTOR).forEach((el) => bag.push(el));
  root.querySelectorAll("*").forEach((el) => {
    if (el.shadowRoot) gdCollect(el.shadowRoot, bag);
  });
}

function getInteractiveElements() {
  gdElements = [];
  const out = [];
  const seen = new Set();
  const found = [];
  gdCollect(document, found);

  found.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    // Keep what's on screen OR just beyond it. Filtering to the exact viewport
    // discarded ~89% of a real government portal and made off-screen targets
    // invisible to the model, which then correctly reported "nothing matches".
    const margin = innerHeight * 2;
    if (r.bottom < -margin || r.top > innerHeight + margin) return;
    if (r.right < 0 || r.left > innerWidth) return;

    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return;
    if (el.disabled || el.getAttribute("aria-disabled") === "true") return;

    const role = gdRole(el);
    const name = gdAccessibleName(el);

    // drop near-identical nested duplicates (an <a> wrapping a <button>, etc.)
    const key = `${role}|${name}|${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
    if (seen.has(key)) return;
    seen.add(key);

    const id = gdElements.length;
    gdElements.push(el);
    out.push({
      id,
      role,
      name,
      rect: {
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height)
      }
    });
  });

  return out;
}

function gdGetElement(id) {
  const el = gdElements[id];
  return el && el.isConnected ? el : null;
}
