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
  // The LAST thing that touches a name before it can leave the device. A badly
  // built portal puts the value into the label, so this is where an Aadhaar or
  // an OTP would otherwise walk into the prompt. See lib/redact.js.
  return gdRedact(raw.trim().replace(/\s+/g, " ").slice(0, 80));
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

// Our own UI is on the page too, and the ask bar lives in a shadow root that the
// walk below would happily descend into — leaving the guide free to point at its
// own Stop button. Everything we injected is off-limits.
const GD_OURS = ["gd-overlay", "gd-chat-host", "gd-styles"];

function gdIsOurs(el) {
  return GD_OURS.some((id) => {
    const node = document.getElementById(id);
    return node && (node === el || node.contains(el));
  });
}

// Modern SPAs hide controls inside shadow roots, which querySelectorAll won't cross.
function gdCollect(root, bag) {
  root.querySelectorAll(GD_SELECTOR).forEach((el) => bag.push(el));
  root.querySelectorAll("*").forEach((el) => {
    if (el.shadowRoot && !gdIsOurs(el)) gdCollect(el.shadowRoot, bag);
  });
}

// A page big enough to blow the prompt budget gets ranked and trimmed rather than
// clipped by geometry. A hard viewport cutoff silently drops the very control the
// user asked for - footer links like "Grievance Redressal" sit three screens down
// on almost every real portal.
const GD_MAX_CANDIDATES = 150;

// Idea from browser-use (MIT): a great many real controls are plain <div>s that
// only announce themselves through cursor:pointer. Government portals and older
// SPAs are full of them, and we were blind to every one.
//
// Computed style, not the attribute — an inline `style="cursor:pointer"` is the
// rare case; the common one is a class. Capped hard, because on a page where
// the author set cursor:pointer on a wrapper this would otherwise swallow the
// whole document.
const GD_POINTER_CAP = 40;

function gdPointerCandidates(bag) {
  const extra = [];
  const all = document.body ? document.body.querySelectorAll("div,span,li,td,p,img") : [];
  for (const el of all) {
    if (extra.length >= GD_POINTER_CAP) break;
    if (bag.includes(el)) continue;
    if (getComputedStyle(el).cursor !== "pointer") continue;
    // A pointer-cursor wrapper around other pointer-cursor children is chrome,
    // not a control. Keep the innermost one only.
    if (el.querySelector("a,button,[role=button],[onclick]")) continue;
    const text = (el.textContent || "").trim();
    if (!text || text.length > 80) continue;
    extra.push(el);
  }
  return extra;
}

function getInteractiveElements() {
  gdElements = [];
  const seen = new Set();
  const found = [];
  gdCollect(document, found);
  const redactedBefore = gdRedactTotal();
  const selectorCount = found.length;
  gdPointerCandidates(found).forEach((el) => found.push(el));
  const pointerAdded = found.length - selectorCount;

  const kept = [];
  found.forEach((el) => {
    if (gdIsOurs(el)) return;

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

  if (pointerAdded) {
    console.log(
      `[GuideDots] ${selectorCount} controls from selectors, +${pointerAdded} found by cursor:pointer`
    );
  }
  gdRedactReport(redactedBefore);

  return shortlist.map((c) => {
    const id = gdElements.length;
    gdElements.push(c.el);
    return {
      id,
      role: c.role,
      name: c.name,
      // Whether the field still needs filling - a BOOLEAN, never the value.
      // Without this the model cannot tell a blank form from a completed one,
      // so it points at Submit while the user is staring at an empty box.
      // The value itself never leaves the device; that promise is unchanged.
      needsInput: gdNeedsInput(c.el),
      rect: {
        x: Math.round(c.r.left),
        y: Math.round(c.r.top),
        w: Math.round(c.r.width),
        h: Math.round(c.r.height)
      }
    };
  });
}

// true  = a control the user must put something into, and has not yet
// false = already has a value
// null  = not a value-bearing control at all (a link, a button)
function gdNeedsInput(el) {
  if (!el) return null;
  const tag = el.tagName;
  if (tag === "SELECT") return !el.value || el.selectedIndex <= 0;
  if (tag === "TEXTAREA") return !el.value.trim();
  if (tag !== "INPUT") return null;
  const t = (el.type || "text").toLowerCase();
  if (t === "checkbox" || t === "radio") return !el.checked;
  if (t === "button" || t === "submit" || t === "reset" || t === "hidden") return null;
  return !el.value.trim();
}

function gdGetElement(id) {
  const el = gdElements[id];
  return el && el.isConnected ? el : null;
}
