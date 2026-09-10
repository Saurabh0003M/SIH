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
  :host { all: initial; }
  .panel {
    position: fixed; right: 18px; bottom: 18px; width: 330px;
    background: #fff; color: #111827; border-radius: 14px;
    box-shadow: 0 10px 40px rgb(0 0 0 / 28%); overflow: hidden;
    font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
    display: flex; flex-direction: column; max-height: 70vh;
  }
  .head {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; background: #111827; color: #fff;
    /* the whole bar is the drag handle, so it must not select as text */
    cursor: move; user-select: none; touch-action: none;
  }
  .head b { font-size: 13px; font-weight: 600; letter-spacing: .2px; }
  .head .sub { font-size: 11px; opacity: .65; margin-left: auto; }
  .close {
    background: none; border: 0; color: #fff; opacity: .6;
    font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1;
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
    padding: 6px 4px; cursor: pointer; font: 11px/1.3 system-ui, sans-serif; color: #374151;
  }
  .tools button:hover { border-color: #9ca3af; }
  .tools button.on { background: #dc2626; border-color: #dc2626; color: #fff; }
  .tools button.held { background: #f59e0b; border-color: #f59e0b; color: #fff; }
  .privacy { padding: 0 12px 10px; font-size: 10.5px; color: #6b7280; }
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

  const saved = gdReadPos();
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
  if (saved && saved.min) setMin(true);
  gdClampPanel(panel);

  // Hiding must never be a dead end: one stray click on × mid-demo would
  // otherwise cost a page reload to undo.
  const pill = document.createElement("button");
  pill.className = "pill";
  pill.textContent = "Disha";
  pill.title = "Show Disha";
  pill.hidden = true;
  wrap.appendChild(pill);

  root.getElementById("hide").addEventListener("click", () => {
    panel.style.display = "none";
    pill.hidden = false;
  });
  pill.addEventListener("click", () => {
    panel.style.display = "";
    pill.hidden = true;
    gdClampPanel(panel);
  });

  gdChatSay("Tell me what you want to do on this page, in your own words.");
  setTimeout(() => q.focus(), 50);
  return root;
}
