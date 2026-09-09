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

// A page big enough to blow the prompt budget gets ranked and trimmed rather than
// clipped by geometry. A hard viewport cutoff silently drops the very control the
// user asked for - footer links like "Grievance Redressal" sit three screens down
// on almost every real portal.
const GD_MAX_CANDIDATES = 150;

function getInteractiveElements() {
  gdElements = [];
  const seen = new Set();
  const found = [];
  gdCollect(document, found);

  const kept = [];
  found.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;

    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return;
    if (el.disabled || el.getAttribute("aria-disabled") === "true") return;

    const role = gdRole(el);
    const name = gdAccessibleName(el);

    // drop near-identical nested duplicates (an <a> wrapping a <button>, etc.)
    const key = `${role}|${name}|${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
    if (seen.has(key)) return;
    seen.add(key);

    // Distance from the middle of the screen, used only if we have to cut.
    const vh = Math.max(innerHeight, 800);
    const distance = Math.abs(r.top + r.height / 2 - vh / 2);
    kept.push({ el, r, role, name, distance });
  });

  // Too many to send? Keep the nearest, then restore document order so the model
  // still reads the page top-to-bottom.
  let shortlist = kept;
  if (kept.length > GD_MAX_CANDIDATES) {
    const nearest = new Set(
      [...kept].sort((a, b) => a.distance - b.distance).slice(0, GD_MAX_CANDIDATES)
    );
    shortlist = kept.filter((c) => nearest.has(c));
  }

  return shortlist.map((c) => {
    const id = gdElements.length;
    gdElements.push(c.el);
    return {
      id,
      role: c.role,
      name: c.name,
      rect: {
        x: Math.round(c.r.left),
        y: Math.round(c.r.top),
        w: Math.round(c.r.width),
        h: Math.round(c.r.height)
      }
    };
  });
}

function gdGetElement(id) {
  const el = gdElements[id];
  return el && el.isConnected ? el : null;
}
