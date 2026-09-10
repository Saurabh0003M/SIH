// THE ASK BAR — the surface the user actually talks to, living on the page
// itself rather than in the extension popup.
//
// Why not the popup: a Chrome popup closes the moment you click anything on the
// page. Our entire interaction *is* clicking things on the page, so a popup-only
// UI would vanish at step one. It also has to survive being dropped onto any
// site in India, so the whole thing lives in a shadow root — the host page's CSS
// cannot reach in, and ours cannot leak out.

let gdChatRoot = null; // the shadow root

const GD_CHAT_CSS = `
  :host { all: initial; --s: 1; }   /* --s: the panel's own zoom, set on resize */
  .panel {
    position: fixed; right: 18px; bottom: 18px; width: 330px;
    background: #fff; color: #111827; border-radius: 14px;
    box-shadow: 0 10px 40px rgb(0 0 0 / 28%); overflow: hidden;
    /* Everything below is in em, so dragging the panel bigger makes the WORDS
       bigger - which is the point of dragging it bigger. */
    font: calc(13px * var(--s))/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
    display: flex; flex-direction: column; max-height: 70vh;
  }
  .head {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; background: #111827; color: #fff;
    /* the whole bar is the drag handle, so it must not select as text */
    cursor: move; user-select: none; touch-action: none;
  }
  .head b { font-size: 1em; font-weight: 600; letter-spacing: .2px; }
  .head .sub { font-size: .82em; opacity: .65; margin-left: auto; }
  .close {
    background: none; border: 0; color: #fff; opacity: .6;
    font-size: 1.2em; cursor: pointer; padding: 0 4px; line-height: 1;
    border-radius: 4px;
  }
  .close:hover { opacity: 1; background: rgb(255 255 255 / 16%); }
  /* minimised: the header bar alone, still draggable, still says who it is */
  .panel.min { width: 210px; }
  .panel.min .log,
  .panel.min .ask,
  .panel.min .tools,
  .panel.min .privacy { display: none; }
  /* hidden: a pill that brings it back. Removing the panel with no way back
     would end a live demo on one stray click. */
  .pill {
    position: fixed; right: 18px; bottom: 18px;
    width: 46px; height: 46px; border-radius: 50%;
    background: #111827; color: #fff; border: 0; cursor: pointer;
    box-shadow: 0 8px 26px rgb(0 0 0 / 32%);
    font: 600 11px/1 system-ui, sans-serif; letter-spacing: .3px;
  }
  .pill:hover { background: #1f2937; }
  .pill[hidden] { display: none; }
  /* a real corner grip, like any window. Without one the panel is whatever
     width we decided, on every screen, forever. */
  .grip {
    position: absolute; right: 2px; bottom: 2px; width: 16px; height: 16px;
    cursor: nwse-resize; touch-action: none;
    background:
      linear-gradient(135deg, transparent 0 55%, #9ca3af 55% 62%, transparent 62% 72%,
                      #9ca3af 72% 79%, transparent 79%);
    border-bottom-right-radius: 12px;
  }
  /* One corner was not enough: a right edge for width alone, a bottom edge for
     height alone, and the corner for both. */
  .grip-e {
    position: absolute; top: 34px; right: 0; width: 7px; bottom: 18px;
    cursor: ew-resize; touch-action: none;
  }
  .grip-s {
    position: absolute; left: 14px; right: 18px; bottom: 0; height: 7px;
    cursor: ns-resize; touch-action: none;
  }
  .grip-e:hover, .grip-s:hover { background: rgb(37 99 235 / 18%); }
  .panel.min .grip,
  .panel.min .grip-e,
  .panel.min .grip-s { display: none; }
  .log { padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 7px; }
  .msg { padding: 7px 10px; border-radius: 10px; max-width: 88%; word-wrap: break-word; }
  .me   { background: #111827; color: #fff; align-self: flex-end; border-bottom-right-radius: 3px; }
  .bot  { background: #f3f4f6; align-self: flex-start; border-bottom-left-radius: 3px; }
  .green { background: #dcfce7; color: #14532d; }
  .amber { background: #fef3c7; color: #78350f; }
  .red   { background: #fee2e2; color: #7f1d1d; }
  .ask { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid #e5e7eb; }
  .ask input {
    flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
    padding: 8px 10px; font: inherit; outline: none; min-width: 0;
  }
  .ask input:focus { border-color: #111827; }
  .ask button {
    border: 0; border-radius: 8px; background: #111827; color: #fff;
    padding: 8px 12px; cursor: pointer; font: inherit;
  }
  .tools { display: flex; gap: 6px; padding: 0 12px 10px; }
  .tools button {
    flex: 1; border: 1px solid #d1d5db; background: #fff; border-radius: 8px;
    padding: 6px 4px; cursor: pointer; font: .82em/1.3 system-ui, sans-serif; color: #374151;
  }
  .tools button:hover { border-color: #9ca3af; }
  .tools button.on { background: #dc2626; border-color: #dc2626; color: #fff; }
  .tools button.held { background: #f59e0b; border-color: #f59e0b; color: #fff; }
  .privacy { padding: 0 12px 10px; font-size: .8em; color: #6b7280; }
`;

function gdChatHtml() {
  return `
    <div class="panel">
      <div class="head">
        <b>Disha</b>
        <span class="sub" id="mode">on-page guide</span>
        <button class="close" id="mini" title="Minimise">&minus;</button>
        <button class="close" id="hide" title="Hide">&times;</button>
      </div>
      <div class="log" id="log"></div>
      <div class="ask">
        <input id="q" placeholder="What do you want to do?" autocomplete="off" />
        <button id="go">Ask</button>
      </div>
      <div class="tools">
        <button id="share">Share screen</button>
        <button id="hold" disabled>Pause</button>
        <button id="stop">Stop</button>
      </div>
      <div class="privacy" id="privacy">Nothing is captured. Sharing is off.</div>
      <div class="grip-e" id="gripE" title="Drag to widen"></div>
      <div class="grip-s" id="gripS" title="Drag to make taller"></div>
      <div class="grip" id="grip" title="Resize"></div>
    </div>`;
}

function gdChatSay(text, kind) {
  if (!gdChatRoot) return;
  const log = gdChatRoot.getElementById("log");
  const div = document.createElement("div");
  div.className = "msg " + (kind || "bot");
  div.textContent = text;
  log.appendChild(div);
  // Each line arrives rather than appearing, so a reader tracking the panel can
  // see that something new was said.
  if (!(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    div.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: 180, easing: "ease-out" });
  }
  log.scrollTop = log.scrollHeight;
  // A step-by-step guide can run long. Keep the last dozen turns so the panel
  // never grows past its own scroll area.
  while (log.children.length > 12) log.removeChild(log.firstChild);
}

function gdChatPrivacy(text) {
  if (!gdChatRoot) return;
  gdChatRoot.getElementById("privacy").textContent = text;
}

function gdChatSetShareState(state) {
  if (!gdChatRoot) return;
  const share = gdChatRoot.getElementById("share");
  const hold = gdChatRoot.getElementById("hold");
  share.classList.toggle("on", state !== "off");
  share.textContent = state === "off" ? "Share screen" : "Sharing";
  hold.disabled = state === "off";
  hold.classList.toggle("held", state === "paused");
  hold.textContent = state === "paused" ? "Resume" : "Pause";
}

// A previous injection leaves its DOM behind, with listeners bound to a script
// context that no longer exists — the extension was reloaded, or the popup
// injected a second time. Evict it before mounting, or the page carries two
// panels and only the newer one answers.
function gdEvictStale() {
  document.querySelectorAll("#gd-chat-host, #gd-overlay").forEach((n) => n.remove());
  gdChatRoot = null;
}

// Where the user last put the panel. sessionStorage, so it survives moving from
// page to page inside one task and disappears when the tab closes — we are not
// leaving anything behind on somebody's bank.
const GD_POS_KEY = "gd_panel_pos";

function gdReadPos() {
  try {
    return JSON.parse(sessionStorage.getItem(GD_POS_KEY)) || null;
  } catch (e) {
    return null; // private mode, or a site that blocks storage
  }
}

function gdWritePos(pos) {
  const clean = { min: Boolean(pos.min) };
  if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
    clean.x = pos.x;
    clean.y = pos.y;
  }
  if (Number.isFinite(pos.w) && Number.isFinite(pos.h)) {
    clean.w = pos.w;
    clean.h = pos.h;
  }
  if (pos.open !== undefined) clean.open = Boolean(pos.open);
  try {
    sessionStorage.setItem(GD_POS_KEY, JSON.stringify(clean));
  } catch (e) {
    /* nothing to do — the position is a convenience, not state we depend on */
  }
}

// A panel dragged past the edge, or restored at a position from a larger
// window, is a panel the user cannot reach. Never let it leave the viewport.
function gdClampPanel(panel) {
  if (!panel.style.left) return; // still anchored bottom-right, nothing to clamp
  // A hidden or background tab reports a zero-size viewport. Clamping against
  // that would park the panel off-screen for good.
  if (!innerWidth || !innerHeight) return;
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  const x = Math.min(Math.max(parseFloat(panel.style.left) || 0, 8), Math.max(8, innerWidth - w - 8));
  const y = Math.min(Math.max(parseFloat(panel.style.top) || 0, 8), Math.max(8, innerHeight - h - 8));
  panel.style.left = x + "px";
  panel.style.top = y + "px";
}

function gdDragPanel(panel, head) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;

  head.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return; // the − and × are controls, not handles
    const r = panel.getBoundingClientRect();
    // Hand off from right/bottom anchoring to left/top the moment it is grabbed,
    // otherwise the first drag makes it jump by its own width.
    panel.style.left = r.left + "px";
    panel.style.top = r.top + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    dragging = true;
    head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  head.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    panel.style.left = ox + e.clientX - sx + "px";
    panel.style.top = oy + e.clientY - sy + "px";
    gdClampPanel(panel);
  });

  const drop = () => {
    if (!dragging) return;
    dragging = false;
    gdWritePos({
      x: parseFloat(panel.style.left),
      y: parseFloat(panel.style.top),
      min: panel.classList.contains("min")
    });
  };
  head.addEventListener("pointerup", drop);
  head.addEventListener("pointercancel", drop);
  addEventListener("resize", () => gdClampPanel(panel));
}

// Drag the corner to resize, the way every other window on the machine works.
// Width and height are both remembered; the log area is the flexible child, so
// growing the panel grows the part with the guidance in it.
// The panel's base font size follows its width. Clamped, because past about
// twice the default the thing stops being a helper and becomes the page.
function gdApplyScale(panel) {
  const w = panel.offsetWidth || 330;
  panel.style.setProperty("--s", String(Math.min(Math.max(w / 330, 1), 1.9).toFixed(3)));
}

function gdResizePanel(panel, grip, axis) {
  let sx = 0, sy = 0, w0 = 0, h0 = 0, sizing = false;

  grip.addEventListener("pointerdown", (e) => {
    const r = panel.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; w0 = r.width; h0 = r.height;
    sizing = true;
    grip.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });

  grip.addEventListener("pointermove", (e) => {
    if (!sizing) return;
    if (axis !== "y") {
      const w = Math.min(Math.max(w0 + e.clientX - sx, 260), Math.max(260, innerWidth - 24));
      panel.style.width = w + "px";
      gdApplyScale(panel);
    }
    if (axis !== "x") {
      const h = Math.min(Math.max(h0 + e.clientY - sy, 180), Math.max(180, innerHeight - 24));
      panel.style.height = h + "px";
      // max-height would otherwise veto anything taller than 70vh
      panel.style.maxHeight = "none";
    }
  });

  const stop = () => {
    if (!sizing) return;
    sizing = false;
    const size = { w: parseFloat(panel.style.width), h: parseFloat(panel.style.height) };
    const prev = gdReadPos() || {};
    gdWritePos({ x: prev.x, y: prev.y, min: panel.classList.contains("min"), ...size });
  };
  grip.addEventListener("pointerup", stop);
  grip.addEventListener("pointercancel", stop);
}

// Set at mount so stop() can reach them without the panel being a global.
let gdChatCollapseFn = null;
let gdChatOpenFn = null;
let gdChatGreeting = "Tell me what you want to do on this page, in your own words.";

function gdChatReset() {
  if (!gdChatRoot) return;
  const log = gdChatRoot.getElementById("log");
  while (log.firstChild) log.removeChild(log.firstChild);
  gdChatSay(gdChatGreeting);
}

function gdChatCollapse() {
  if (gdChatCollapseFn) gdChatCollapseFn(true);
}

// Called when a run starts, so someone who pressed Start in the toolbar can
// actually read what Disha says back.
function gdChatOpen() {
  if (gdChatOpenFn) gdChatOpenFn(true);
}

// If the dot is about to land underneath the panel, the panel moves. Guidance
// you cannot see is not guidance, and sitting on top of the very control we are
// telling someone to click is the worst place on the screen for us to be.
function gdBoxesClash(r, box, pad) {
  return !(r.x + r.w < box.left - pad || r.x > box.right + pad ||
           r.y + r.h < box.top - pad || r.y > box.bottom + pad);
}

function gdChatAvoid(rect) {
  if (!gdChatRoot || !rect) return false;
  const panel = gdChatRoot.querySelector(".panel");
  if (!panel || panel.style.display === "none" || panel.classList.contains("min")) return false;

  const p = panel.getBoundingClientRect();
  const pad = 14;
  if (!gdBoxesClash(rect, p, pad)) return false;

  // In preference order: slide left at the same height, go up the same column,
  // then the two far corners. First one that clears the target wins.
  const w = p.width, h = p.height;
  const spots = [
    { x: 18, y: p.top },
    { x: p.left, y: 18 },
    { x: 18, y: 18 },
    { x: Math.max(18, innerWidth - w - 18), y: 18 }
  ];
  for (const c of spots) {
    if (c.x < 0 || c.y < 0 || c.x + w > innerWidth || c.y + h > innerHeight) continue;
    const box = { left: c.x, top: c.y, right: c.x + w, bottom: c.y + h };
    if (gdBoxesClash(rect, box, pad)) continue;
    const still = typeof matchMedia === "function" &&
                  matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still) {
      panel.style.transition = "left .28s ease, top .28s ease";
      setTimeout(() => { panel.style.transition = ""; }, 340);
    }
    panel.style.left = c.x + "px";
    panel.style.top = c.y + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    gdClampPanel(panel);
    return true;
  }

  // Nowhere on screen is clear of it - a very large target, or a small window.
  // Collapsing to the header is the one move that always uncovers the control.
  gdChatCollapse();
  return true;
}

function gdMountChat(handlers) {
  if (gdChatRoot) return gdChatRoot;
  // Eviction is content.js's job, once, BEFORE it builds the overlay. Doing it
  // here as well would delete the overlay that was just created.

  const host = document.createElement("div");
  host.id = "gd-chat-host";
  host.style.cssText = "position:fixed;inset:auto 0 0 auto;z-index:2147483647;";
  (document.body || document.documentElement).appendChild(host);

  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = GD_CHAT_CSS;
  root.appendChild(style);
  const wrap = document.createElement("div");
  wrap.innerHTML = gdChatHtml();
  root.appendChild(wrap);
  gdChatRoot = root;

  const q = root.getElementById("q");
  const ask = () => {
    const text = q.value.trim();
    if (!text) return;
    gdChatSay(text, "me");
    q.value = "";
    handlers.onAsk(text);
  };
  root.getElementById("go").addEventListener("click", ask);
  q.addEventListener("keydown", (e) => {
    if (e.key === "Enter") ask();
    e.stopPropagation(); // never let the host page's shortcuts eat what's typed here
  });

  root.getElementById("stop").addEventListener("click", handlers.onStop);
  root.getElementById("share").addEventListener("click", handlers.onShare);
  root.getElementById("hold").addEventListener("click", handlers.onHold);
  // ---- moving it out of the way ------------------------------------------
  // The panel sits over the bottom-right of the page, which is exactly where a
  // "Confirm" button often lives. It has to be movable and it has to shrink.
  const panel = root.querySelector(".panel");
  const head = root.querySelector(".head");
  const mini = root.getElementById("mini");
  gdDragPanel(panel, head);
  gdResizePanel(panel, root.getElementById("grip"), "both");
  gdResizePanel(panel, root.getElementById("gripE"), "x");
  gdResizePanel(panel, root.getElementById("gripS"), "y");

  const saved = gdReadPos();
  if (saved && Number.isFinite(saved.w) && Number.isFinite(saved.h)) {
    panel.style.width = saved.w + "px";
    panel.style.height = saved.h + "px";
    panel.style.maxHeight = "none";
  }
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    panel.style.left = saved.x + "px";
    panel.style.top = saved.y + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  const setMin = (on) => {
    panel.classList.toggle("min", on);
    mini.innerHTML = on ? "&plus;" : "&minus;";
    mini.title = on ? "Expand" : "Minimise";
    gdWritePos({ x: parseFloat(panel.style.left), y: parseFloat(panel.style.top), min: on });
    gdClampPanel(panel);
  };
  mini.addEventListener("click", () => setMin(!panel.classList.contains("min")));
  gdChatCollapseFn = setMin;
  if (saved && saved.min) setMin(true);
  gdClampPanel(panel);
  gdApplyScale(panel);

  // Hiding must never be a dead end: one stray click on × mid-demo would
  // otherwise cost a page reload to undo.
  const pill = document.createElement("button");
  pill.className = "pill";
  pill.textContent = "Disha";
  pill.title = "Show Disha";
  pill.hidden = true;
  wrap.appendChild(pill);

  const showPanel = (on) => {
    panel.style.display = on ? "" : "none";
    pill.hidden = on;
    if (on) gdClampPanel(panel);
    const prev = gdReadPos() || {};
    prev.open = on;
    gdWritePos(prev);
  };
  gdChatOpenFn = showPanel;

  root.getElementById("hide").addEventListener("click", () => showPanel(false));
  pill.addEventListener("click", () => showPanel(true));

  // Arrive as a pill, not a panel. Planting a chat window on every page somebody
  // opens is somebody else's product, not ours: Disha waits until it is asked
  // for - by clicking the pill, or by pressing Start in the toolbar. If the user
  // opened it on this site already, that choice is remembered for the tab.
  if (!(saved && saved.open)) {
    panel.style.display = "none";
    pill.hidden = false;
  }

  gdChatSay(gdChatGreeting);
  setTimeout(() => q.focus(), 50);
  return root;
}
