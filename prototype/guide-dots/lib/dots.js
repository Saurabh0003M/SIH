// Draw the guidance markers. Nothing drawn here may ever intercept a click —
// the whole point is that the HUMAN clicks the real control underneath.

let gdActiveDot = null; // { cx, cy, label, next, color } — what the hover card describes

// ---------------------------------------------------------------------------
// MOTION. A dot that pops into existence gives the eye nothing to follow, so
// the marker TRAVELS from the last step to this one. This layer is cosmetic
// only: grounding and the click loop start exactly when they did before, and
// the click target is always the live element under the dot's FINAL position.
// No library — CSS keyframes plus the Web Animations API, scoped to our own
// class names so host-page CSS cannot reach in.
// ---------------------------------------------------------------------------

let gdPrev = null; // { cx, cy, color, key, opacity, kind, at } — last marker drawn

const gdReduce = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
// Every duration collapses to 0 under reduced motion. The animations still RUN,
// so onfinish still fires and data-landed is still set — nothing downstream has
// to special-case it.
const gdMs = (ms) => (gdReduce() ? 0 : ms);

// A marker older than this belongs to a previous run, so the next one scales in
// rather than flying across the page from a stale position.
const GD_FRESH_MS = 4000;
const gdFresh = (kind) =>
  Boolean(gdPrev) && Date.now() - gdPrev.at < GD_FRESH_MS && (!kind || gdPrev.kind === kind);

// The line the dot leaves behind, so the eye can see where it came from.
function gdTrail(overlay, x1, y1, x2, y2, color) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (d < 6 || gdReduce()) return;
  const line = document.createElement("div");
  line.className = "gd-dot gd-trail";
  Object.assign(line.style, {
    position: "absolute",
    left: x1 + "px",
    top: y1 + "px",
    width: d + "px",
    height: "2px",
    borderRadius: "2px",
    background: color,
    transformOrigin: "0 50%",
    transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`,
    pointerEvents: "none"
  });
  overlay.appendChild(line);
  const done = () => line.remove();
  line.animate([{ opacity: 0.4 }, { opacity: 0 }], { duration: 600, easing: "ease-out" })
    .finished.then(done, done);
}

// One kind of marker handing over to another (dot <-> arrow): the outgoing one
// shrinks toward the incoming one's position while that grows.
function gdGhost(overlay, from, to, color) {
  if (gdReduce()) return;
  const g = document.createElement("div");
  g.className = "gd-dot gd-ghost";
  Object.assign(g.style, {
    position: "absolute",
    left: from.x - 8 + "px",
    top: from.y - 8 + "px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: color,
    pointerEvents: "none"
  });
  overlay.appendChild(g);
  const done = () => g.remove();
  g.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 0.85 },
      { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0)`, opacity: 0 }
    ],
    { duration: 300, easing: "ease-in-out" }
  ).finished.then(done, done);
}

// Mastered: the guidance leaves with one ring, rather than blinking out.
function gdFarewell() {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay || !gdFresh("dot") || gdReduce()) {
    gdPrev = null;
    return;
  }
  const { cx, cy, color } = gdPrev;
  const ring = document.createElement("div");
  ring.className = "gd-dot gd-ghost";
  Object.assign(ring.style, {
    position: "absolute",
    left: cx - 18 + "px",
    top: cy - 18 + "px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "2px solid " + color,
    pointerEvents: "none"
  });
  overlay.appendChild(ring);
  const done = () => ring.remove();
  ring.animate(
    [{ transform: "scale(.5)", opacity: 0.9 }, { transform: "scale(1.8)", opacity: 0 }],
    { duration: 500, easing: "ease-out" }
  ).finished.then(done, done);
  gdPrev = null;
}

// A wrong click: shake before the guidance travels back to the restored step,
// so the correction is something you SEE, not just something you read.
function gdShakeDot() {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay || gdReduce()) return;
  overlay.querySelectorAll('.gd-dot[data-landed="1"]').forEach((d) =>
    d.animate(
      [
        { transform: "translateX(0)" }, { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" }, { transform: "translateX(-4px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 300, easing: "ease-in-out" }
    )
  );
}

function drawDot(rect, color, label, opts) {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;

  const { opacity = 1, showLabel = true, next = "", key = null } = opts || {};
  const size = 18;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  gdActiveDot = { cx, cy, label, next, color };

  // A repaint for the SAME target (a scroll, a resize) must not re-animate, or
  // scrolling the page makes the dot look drunk.
  const k = key == null ? label : key;
  const travelled = gdFresh("dot") && gdPrev.key !== k;
  const sameTarget = gdFresh("dot") && gdPrev.key === k;
  const fromArrow = gdFresh("arrow");
  const from = gdPrev ? { x: gdPrev.cx, y: gdPrev.cy } : null;

  // A ring that breathes. On a page with forty controls a static 18px dot is
  // genuinely hard to find; the pulse is what makes it findable.
  const pulse = document.createElement("div");
  pulse.className = "gd-dot";
  Object.assign(pulse.style, {
    position: "absolute",
    left: cx - size + "px",
    top: cy - size + "px",
    width: size * 2 + "px",
    height: size * 2 + "px",
    borderRadius: "50%",
    border: "2px solid " + color,
    opacity: String(opacity * 0.9),
    pointerEvents: "none",
    // The ring would otherwise pulse while the dot is still in mid-flight,
    // drawing the eye to where the dot ISN'T. It starts on landing — and under
    // reduced motion it never breathes at all, it just marks the spot.
    animation: gdReduce() ? "none" : "gd-pulse 1.6s ease-out infinite",
    animationPlayState: "paused"
  });
  overlay.appendChild(pulse);

  const dot = document.createElement("div");
  dot.className = "gd-dot";
  dot.title = label || "";
  Object.assign(dot.style, {
    position: "absolute",
    left: cx - size / 2 + "px",
    top: cy - size / 2 + "px",
    width: size + "px",
    height: size + "px",
    borderRadius: "50%",
    background: color,
    opacity: String(opacity),
    pointerEvents: "none", // clicks must pass through to the page
    boxShadow: "0 0 0 2px #fff, 0 1px 6px rgb(0 0 0 / 45%)"
  });
  overlay.appendChild(dot);

  // ---- the journey -------------------------------------------------------
  // The dot is created at its FINAL position and animated in from wherever the
  // last one was. Anything reading the dot's box therefore gets the truth, and
  // data-landed says when it is safe to click.
  let arrival;
  if (travelled) {
    gdTrail(overlay, from.x, from.y, cx, cy, gdPrev.color);
    arrival = dot.animate(
      [
        { transform: `translate(${from.x - cx}px, ${from.y - cy}px)` },
        { transform: "translate(0,0)" }
      ],
      { duration: gdMs(450), easing: "ease-in-out", fill: "backwards" }
    );
    // The band changes meaning mid-flight, so it must read as a change, not a
    // swap: amber bleeding into red is the honest picture of a falling score.
    if (gdPrev.color !== color) {
      dot.animate([{ backgroundColor: gdPrev.color }, { backgroundColor: color }],
        { duration: gdMs(300), easing: "ease-in-out", fill: "backwards" });
      pulse.animate([{ borderColor: gdPrev.color }, { borderColor: color }],
        { duration: gdMs(300), easing: "ease-in-out", fill: "backwards" });
    }
  } else if (fromArrow) {
    gdGhost(overlay, from, { x: cx, y: cy }, gdPrev.color);
    arrival = dot.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }],
      { duration: gdMs(300), easing: "ease-out", fill: "backwards" });
  } else if (!sameTarget) {
    // First dot of a run: a small overshoot, so it announces itself.
    arrival = dot.animate(
      [{ transform: "scale(0)" }, { transform: "scale(1.15)", offset: 0.7 }, { transform: "scale(1)" }],
      { duration: gdMs(260), easing: "ease-out", fill: "backwards" }
    );
  }

  // Fading guidance should dim, not step down.
  if (sameTarget && gdPrev.opacity !== opacity) {
    dot.animate([{ opacity: gdPrev.opacity }, { opacity }],
      { duration: gdMs(400), easing: "ease-in-out", fill: "backwards" });
  }

  const land = () => {
    dot.dataset.landed = "1";
    pulse.style.animationPlayState = "running";
  };
  if (arrival) arrival.finished.then(land, land);
  else land();

  gdPrev = { cx, cy, color, key: k, opacity, kind: "dot", at: Date.now() };

  if (showLabel && label) {
    const chip = document.createElement("div");
    chip.className = "gd-dot";
    chip.textContent = label;
    Object.assign(chip.style, {
      position: "absolute",
      left: cx + 16 + "px",
      top: cy - 11 + "px",
      maxWidth: "260px",
      padding: "3px 8px",
      borderRadius: "6px",
      background: "rgba(17,17,17,.92)",
      color: "#fff",
      font: "12px/1.35 system-ui, sans-serif",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      opacity: String(opacity),
      pointerEvents: "none"
    });
    overlay.appendChild(chip);

    // The label reads as coming OUT of the dot, once the dot has arrived.
    const chipIn = () =>
      chip.animate(
        [{ opacity: 0, transform: "translateX(8px)" }, { opacity, transform: "translateX(0)" }],
        { duration: gdMs(180), delay: gdMs(120), easing: "ease-out", fill: "backwards" }
      );
    if (arrival) arrival.finished.then(chipIn, chipIn);
    else chipIn();
  }
}

// The target is off-screen. Point the way instead of yanking the page around —
// the person stays in control of their own scrolling, which is the difference
// between being guided and being driven.
function drawArrow(direction, color, text) {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;
  const down = direction === "down";

  const wrap = document.createElement("div");
  wrap.className = "gd-dot";
  Object.assign(wrap.style, {
    position: "absolute",
    left: "50%",
    display: "flex",
    flexDirection: down ? "column" : "column-reverse",
    alignItems: "center",
    gap: "6px",
    pointerEvents: "none",
    animation: "gd-bob-" + direction + " 1.2s ease-in-out infinite"
  });
  wrap.style[down ? "bottom" : "top"] = "28px";

  const caption = document.createElement("div");
  caption.textContent = text;
  Object.assign(caption.style, {
    padding: "5px 12px",
    borderRadius: "999px",
    background: "rgba(17,17,17,.92)",
    color: "#fff",
    font: "13px/1.4 system-ui, sans-serif",
    whiteSpace: "nowrap"
  });

  const head = document.createElement("div");
  head.textContent = down ? "↓" : "↑";
  Object.assign(head.style, {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: color,
    color: "#fff",
    font: "700 24px/42px system-ui, sans-serif",
    textAlign: "center",
    boxShadow: "0 0 0 3px #fff, 0 2px 10px rgb(0 0 0 / 40%)"
  });

  wrap.appendChild(caption);
  wrap.appendChild(head);
  overlay.appendChild(wrap);

  // Handing over from a dot that just scrolled out of view: the dot shrinks
  // toward the edge the arrow points at, and the arrow grows there.
  const ax = innerWidth / 2;
  const ay = down ? innerHeight - 50 : 50;
  if (gdFresh("dot")) gdGhost(overlay, { x: gdPrev.cx, y: gdPrev.cy }, { x: ax, y: ay }, gdPrev.color);
  if (!gdFresh("arrow")) {
    // The bob keyframes own `transform` and carry the translateX(-50%) that
    // centres the arrow, so this has to carry it too or the arrow jumps.
    wrap.animate(
      [
        { transform: "translateX(-50%) scale(0)", opacity: 0 },
        { transform: "translateX(-50%) scale(1)", opacity: 1 }
      ],
      { duration: gdMs(300), easing: "ease-out", fill: "backwards" }
    );
  }
  gdPrev = { cx: ax, cy: ay, color, key: "arrow-" + direction, opacity: 1, kind: "arrow", at: Date.now() };
}

// Move the pointer near the dot and the one-line reason opens into a full
// explanation: what this control is, and what appears after you click it.
// Proximity, not :hover — a hoverable element over the target would swallow
// the very click we are asking the person to make.
const GD_HOVER_RADIUS = 70;

function gdUpdateHoverCard(mouseX, mouseY) {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;
  const existing = overlay.querySelector(".gd-card");
  if (!gdActiveDot) {
    if (existing) existing.remove();
    return;
  }

  const near = Math.hypot(mouseX - gdActiveDot.cx, mouseY - gdActiveDot.cy) < GD_HOVER_RADIUS;
  if (!near) {
    // Reverse the entrance rather than vanishing. `closing` guards the many
    // mousemove events that arrive while the card is on its way out.
    if (existing && !existing.dataset.closing) {
      existing.dataset.closing = "1";
      const done = () => existing.remove();
      existing.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.92)" }],
        { duration: gdMs(160), easing: "ease-in" }).finished.then(done, done);
    }
    return;
  }
  if (existing && !existing.dataset.closing) return;
  if (existing) existing.remove(); // it was closing; replace it outright

  const card = document.createElement("div");
  card.className = "gd-dot gd-card";
  // Flip to the left / above near an edge, so the card is never half off-screen
  // at the exact moment it is meant to be read.
  const flipX = gdActiveDot.cx > innerWidth - 300;
  const flipY = gdActiveDot.cy > innerHeight - 140;
  Object.assign(card.style, {
    position: "absolute",
    width: "260px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(17,17,17,.96)",
    color: "#fff",
    font: "12px/1.5 system-ui, sans-serif",
    boxShadow: "0 6px 24px rgb(0 0 0 / 45%)",
    borderLeft: "3px solid " + gdActiveDot.color,
    pointerEvents: "none"
  });
  if (flipX) card.style.right = innerWidth - gdActiveDot.cx + 20 + "px";
  else card.style.left = gdActiveDot.cx + 20 + "px";
  if (flipY) card.style.bottom = innerHeight - gdActiveDot.cy + 20 + "px";
  else card.style.top = gdActiveDot.cy + 20 + "px";

  const why = document.createElement("div");
  why.textContent = gdActiveDot.label || "";
  why.style.marginBottom = gdActiveDot.next ? "6px" : "0";
  card.appendChild(why);

  if (gdActiveDot.next) {
    const then = document.createElement("div");
    then.textContent = "After you click: " + gdActiveDot.next;
    Object.assign(then.style, {
      color: "#a7f3d0",
      borderTop: "1px solid rgb(255 255 255 / 15%)",
      paddingTop: "6px"
    });
    card.appendChild(then);
  }
  overlay.appendChild(card);
  card.animate(
    [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "scale(1)" }],
    { duration: gdMs(160), easing: "ease-out", fill: "backwards" }
  );
  card.style.transformOrigin = flipX ? "right center" : "left center";
}

// ---------------------------------------------------------------------------
// THE THINKING PANEL. A developer-style trace of the decision, drawn while the
// guide is choosing. Every number in it is REAL and computed on this device:
// `words` is gdLocalScore (the synonym match) and `page` is gdGroundingQuality
// (named? unique? on top?). The bar is min(words, page) — the number the
// product would actually claim — so the panel cannot flatter the answer.
//
// When a live model answers, the model's own confidence replaces the `words`
// column for the chosen row only, and the panel says so. It never redraws the
// other rows with numbers the model did not produce.
// ---------------------------------------------------------------------------

const GD_THINK_ROWS = 6;

function gdThinkPanel() {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return null;
  let p = overlay.querySelector(".gd-think");
  if (p) return p;
  p = document.createElement("div");
  p.className = "gd-think"; // NOT gd-dot: clearDots() must leave it alone, like the banner
  Object.assign(p.style, {
    position: "absolute",
    left: "16px",
    bottom: "16px",
    width: "376px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(11,15,25,.94)",
    color: "#cbd5e1",
    font: "11px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    boxShadow: "0 8px 30px rgb(0 0 0 / 45%)",
    pointerEvents: "none"
  });
  overlay.appendChild(p);
  p.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
    { duration: gdMs(200), easing: "ease-out", fill: "backwards" });
  return p;
}

// A drawn bar, not block characters: ░ and █ render at different weights in
// different monospace fonts and turn into one grey smear on a projector.
function gdBarEl(v, color) {
  const track = document.createElement("span");
  Object.assign(track.style, {
    display: "inline-block", width: "64px", height: "6px", verticalAlign: "middle",
    margin: "0 6px", borderRadius: "3px", background: "rgb(255 255 255 / 14%)"
  });
  const fill = document.createElement("span");
  Object.assign(fill.style, {
    display: "block", height: "100%", borderRadius: "3px", background: color,
    width: Math.round(Math.max(0, Math.min(1, v)) * 100) + "%"
  });
  track.appendChild(fill);
  return track;
}

// Called the moment the candidates are enumerated, before any answer exists.
function gdThinkScan(elements, goal) {
  const p = gdThinkPanel();
  if (!p) return;
  p.textContent = "";

  const head = document.createElement("div");
  head.textContent = `▾ grounding · ${elements.length} controls on screen`;
  Object.assign(head.style, { color: "#7dd3fc", marginBottom: "6px" });
  p.appendChild(head);

  let scored = [];
  try {
    const expanded = gdExpandGoal(goal);
    scored = elements
      .map((e) => ({
        e,
        words: gdLocalScore(e, expanded),
        page: gdGroundingQuality(e, goal, elements)
      }))
      .filter((r) => r.words > 0)
      .sort((a, b) => b.words - a.words)
      .slice(0, GD_THINK_ROWS);
  } catch (err) {
    return; // the panel is decoration; it must never break grounding
  }

  scored.forEach((r, i) => {
    const row = document.createElement("div");
    const shown = Math.min(r.words, r.page);
    row.dataset.id = String(r.e.id);
    row.style.whiteSpace = "pre";
    row.style.opacity = ".72";

    const lead = document.createElement("span");
    lead.textContent =
      `${i === scored.length - 1 ? "└" : "├"} ${String(r.e.role).padEnd(7).slice(0, 7)} ` +
      `${String(r.e.name || "(unnamed)").slice(0, 20).padEnd(20)}`;
    row.appendChild(lead);
    // The bar is min(words, page) — the number the product would actually
    // claim — so a strong page score cannot make a weak match look good.
    row.appendChild(gdBarEl(shown, shown >= 0.55 ? "#fbbf24" : "#f87171"));
    const nums = document.createElement("span");
    nums.textContent = `w${r.words.toFixed(2)} p${r.page.toFixed(2)}`;
    nums.style.color = "#94a3b8";
    row.appendChild(nums);
    p.appendChild(row);
    row.animate([{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 0.72, transform: "none" }],
      { duration: gdMs(160), delay: gdMs(i * 45), easing: "ease-out", fill: "backwards" });
  });
}

// Called once the answer is in, with the SAME result the dot is drawn from.
function gdThinkVerdict(result, chosenName, live) {
  const p = document.getElementById("gd-overlay") &&
    document.getElementById("gd-overlay").querySelector(".gd-think");
  if (!p) return;

  p.querySelectorAll("[data-id]").forEach((row) => {
    const hit = row.dataset.id === String(result.targetId);
    row.style.opacity = hit ? "1" : ".38";
    if (hit) {
      row.style.color = "#fff";
      row.animate([{ transform: "translateX(-4px)" }, { transform: "none" }],
        { duration: gdMs(180), easing: "ease-out" });
    }
  });

  const out = document.createElement("div");
  const pct = Math.round(result.confidence * 100);
  out.textContent =
    `→ ${result.band.toUpperCase()} ${pct}%  ${String(chosenName || "").slice(0, 26)}` +
    (live ? "   [model + page must agree]" : "   [offline: capped below green]");
  Object.assign(out.style, {
    marginTop: "6px",
    paddingTop: "6px",
    borderTop: "1px solid rgb(255 255 255 / 14%)",
    color: { green: "#4ade80", amber: "#fbbf24", red: "#f87171" }[result.band] || "#cbd5e1",
    whiteSpace: "pre"
  });
  p.appendChild(out);
  out.animate([{ opacity: 0 }, { opacity: 1 }], { duration: gdMs(200), easing: "ease-out", fill: "backwards" });
}

// The panel outlives clearDots() on purpose, so it must be dismissed explicitly
// when the run stops.
function gdThinkClear() {
  const overlay = document.getElementById("gd-overlay");
  const p = overlay && overlay.querySelector(".gd-think");
  if (p) p.remove();
}

function clearDots() {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;
  gdActiveDot = null;
  overlay.querySelectorAll(".gd-dot").forEach((d) => d.remove());
}

// On-page status, so the user always sees what happened. The popup can close;
// this cannot. clearDots() leaves it alone on purpose.
function showBanner(text, kind) {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;
  let b = overlay.querySelector(".gd-banner");
  if (!b) {
    b = document.createElement("div");
    b.className = "gd-banner";
    Object.assign(b.style, {
      position: "absolute",
      top: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "8px 14px",
      borderRadius: "999px",
      font: "13px/1.4 system-ui, sans-serif",
      color: "#fff",
      pointerEvents: "none",
      maxWidth: "80vw",
      textAlign: "center",
      boxShadow: "0 2px 10px rgb(0 0 0 / 35%)"
    });
    overlay.appendChild(b);
  }
  const tone = { info: "#111827", green: "#166534", amber: "#92400e", red: "#991b1b" };
  const changed = b.textContent !== text;
  b.style.background = tone[kind] || tone.info;
  b.textContent = text;
  // Cross-fade, so a status that changes twice in a second still registers as
  // two statuses rather than one flicker.
  if (changed) {
    b.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: gdMs(180), easing: "ease-out" });
  }
}

// Injected once. Page CSS cannot reach these — every rule is scoped to our own
// class names, and the keyframes are namespaced.
function gdInjectStyles() {
  if (document.getElementById("gd-styles")) return;
  const style = document.createElement("style");
  style.id = "gd-styles";
  style.textContent =
    "@keyframes gd-pulse{0%{transform:scale(.55);opacity:.9}70%{transform:scale(1.15);opacity:0}100%{transform:scale(1.15);opacity:0}}" +
    "@keyframes gd-bob-down{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}" +
    "@keyframes gd-bob-up{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-8px)}}";
  (document.head || document.documentElement).appendChild(style);
}
