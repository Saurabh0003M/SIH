// Draw the guidance markers. Nothing drawn here may ever intercept a click —
// the whole point is that the HUMAN clicks the real control underneath.

let gdActiveDot = null; // { cx, cy, label, next, color } — what the hover card describes

function drawDot(rect, color, label, opts) {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;

  const { opacity = 1, showLabel = true, next = "" } = opts || {};
  const size = 18;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  gdActiveDot = { cx, cy, label, next, color };

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
    animation: "gd-pulse 1.6s ease-out infinite"
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
    boxShadow: "0 0 0 2px #fff, 0 1px 6px rgb(0 0 0 / 45%)",
    transition: "opacity 160ms linear"
  });
  overlay.appendChild(dot);

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
      pointerEvents: "none",
      transition: "opacity 160ms linear"
    });
    overlay.appendChild(chip);
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
    if (existing) existing.remove();
    return;
  }
  if (existing) return;

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
  b.style.background = tone[kind] || tone.info;
  b.textContent = text;
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
