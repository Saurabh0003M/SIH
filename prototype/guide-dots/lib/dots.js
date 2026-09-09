// Draw the guidance marker. The dot must NEVER intercept the user's click —
// the whole point is that the human clicks the real control underneath it.

function drawDot(rect, color, label, opts) {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;

  const { opacity = 1, showLabel = true } = opts || {};
  const size = 16;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

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
      left: cx + 14 + "px",
      top: cy - 10 + "px",
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

function clearDots() {
  const overlay = document.getElementById("gd-overlay");
  if (!overlay) return;
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
