(function () {
  const GD_COLORS = { green: "#22c55e", amber: "#f59e0b", red: "#ef4444" };

  let goal = "";
  let paused = false;
  let lastResult = null;
  let lastCandidates = [];
  let lastFingerprint = "";
  let scaffold = null;
  let history = [];
  let clicked = []; // fingerprints of steps already taken in this run
  let runToken = 0;
  let rafId = 0;
  let mouse = { x: -9999, y: -9999 };

  function ensureOverlay() {
    gdInjectStyles();
    let overlay = document.getElementById("gd-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "gd-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483646" // one below the ask bar, which must stay clickable
    });
    // body when it exists: a fixed-position child of <html> is legal but rare,
    // and some renderers composite it against the unscrolled document.
    (document.body || document.documentElement).appendChild(overlay);
    return overlay;
  }

  // Read the LIVE element's rect every time — never a cached rect, never a
  // re-enumerated index.
  function paint() {
    if (paused || !lastResult || lastResult.targetId < 0) return;
    clearDots();
    if (scaffold && scaffold.hide) return; // mastered: the learner does it unaided
    const node = gdGetElement(lastResult.targetId);
    if (!node) return;

    // A hidden or background tab reports a zero-height viewport, and every
    // element then looks "below the fold". Painting a permanent scroll arrow at
    // nobody is worse than painting nothing.
    if (!innerHeight) return;

    const r = node.getBoundingClientRect();
    const color = GD_COLORS[lastResult.band];

    // Off-screen: point the way and let them scroll. Scrolling the page for
    // them teaches nothing and steals control of a screen they are trying to
    // learn. scheduleRepaint() swaps the arrow for the dot as it comes into view.
    if (r.bottom < 8) {
      drawArrow("up", color, "Scroll up — your next step is above");
      return;
    }
    if (r.top > innerHeight - 8) {
      drawArrow("down", color, "Scroll down — your next step is below");
      return;
    }

    const percent = Math.round(lastResult.confidence * 100);
    drawDot(
      { x: r.left, y: r.top, w: r.width, h: r.height },
      color,
      `${lastResult.reason} (${percent}%)`,
      {
        opacity: scaffold ? scaffold.opacity : 1,
        showLabel: scaffold ? scaffold.showLabel : true,
        next: lastResult.next || ""
      }
    );
    gdUpdateHoverCard(mouse.x, mouse.y);
  }

  function scheduleRepaint() {
    if (paused || !lastResult || rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      paint();
    });
  }

  // Wait until the page stops changing, so we ground against the settled screen.
  function waitForQuiet(maxMs = 1500, quietMs = 250) {
    return new Promise((resolve) => {
      let timer = setTimeout(finish, quietMs);
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(finish, quietMs);
      });
      observer.observe(document, { subtree: true, childList: true, attributes: true });
      const hardStop = setTimeout(finish, maxMs);
      function finish() {
        clearTimeout(timer);
        clearTimeout(hardStop);
        observer.disconnect();
        resolve();
      }
    });
  }

  function say(text, kind) {
    showBanner(text, kind);
    gdChatSay(text, kind === "info" ? "bot" : kind);
  }

  async function step() {
    const token = ++runToken;
    ensureOverlay();
    clearDots();

    showBanner("Reading this page...", "info");
    const elements = getInteractiveElements();
    showBanner(elements.length + " controls found - choosing...", "info");

    const result = await pickTarget(elements, goal, history, clicked);
    if (token !== runToken || paused) return; // a newer run superseded this one

    lastResult = result;
    lastCandidates = elements;

    if (result.targetId < 0) {
      // Never fail silently - the user must see why nothing appeared.
      say(result.reason, "red");
      console.warn("[GuideDots]", result.reason);
      return;
    }

    const chosen = elements.find((e) => e.id === result.targetId);
    lastFingerprint = gdFingerprint(chosen);
    scaffold = await gdScaffold(lastFingerprint);
    if (token !== runToken) return;

    // Wording must match the confidence, or the honesty claim is hollow.
    const WORDS = {
      green: "Found it",
      amber: "Best guess - check before clicking",
      red: "Not sure - verify this one"
    };
    const pct = Math.round(result.confidence * 100);
    say(`${WORDS[result.band]}: ${result.reason} (${pct}%)`, result.band);
    if (scaffold.level === "mastered") {
      say("You've done this step five times — try it without the dot.", "bot");
    }
    paint();
  }

  async function onClick(event) {
    if (paused || !lastResult || lastResult.targetId < 0) return;

    const node = gdGetElement(lastResult.targetId);
    const hitTarget =
      node && (event.target === node || node.contains(event.target) || event.target.contains(node));

    if (hitTarget) {
      await gdRecordSuccess(lastFingerprint);
      clicked.push(lastFingerprint);
      history.push(lastResult.reason || "previous step");
      if (history.length > 6) history.shift();
      await waitForQuiet();
      if (!paused) step();
      return;
    }

    // Only count it as a wrong turn if they clicked a DIFFERENT control —
    // clicking blank space or body text isn't a mistake.
    const clickedAnotherControl = lastCandidates.some((c) => {
      const n = gdGetElement(c.id);
      return n && n !== node && (n === event.target || n.contains(event.target));
    });
    if (clickedAnotherControl) {
      await gdRecordFailure(lastFingerprint);
      scaffold = await gdScaffold(lastFingerprint); // support comes back
      say("That wasn't it — bringing the guidance back.", "amber");
      await waitForQuiet();
      if (!paused) step();
    }
  }

  function start(newGoal) {
    goal = newGoal;
    paused = false;
    history = [];
    clicked = [];
    step();
  }

  function stop() {
    paused = true;
    runToken++;
    lastResult = null;
    history = [];
    clicked = [];
    clearDots();
  }

  // ---- the on-page ask bar -------------------------------------------------
  ensureOverlay();
  gdMountChat({
    onAsk: (text) => start(text),
    onStop: () => {
      stop();
      gdChatSay("Stopped.", "bot");
    },
    onShare: async () => {
      if (gdShareGetState() !== "off") {
        gdShareStop();
        gdChatSay("Screen sharing stopped.", "bot");
        return;
      }
      try {
        gdChatSetShareState(await gdShareStart());
        gdChatPrivacy("Sharing this screen. Hit Pause before typing any OTP or password.");
        gdChatSay("Sharing on. I'll only look at the screen when the page itself isn't readable.", "bot");
      } catch (e) {
        // Refusing the browser prompt is a normal choice, not a failure.
        gdChatSay("No screen access — I'll keep working from the page alone.", "bot");
      }
    },
    onHold: () => {
      const state = gdShareToggleHold();
      gdChatSetShareState(state);
      gdChatPrivacy(
        state === "paused"
          ? "PAUSED — nothing is being captured. Safe to type your OTP."
          : "Sharing this screen again."
      );
    }
  });

  // ---- messages from the popup (kept: the popup still owns provider setup) --
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === "TESTDOT") {
      // Bisect helper: proves injection + overlay + drawing work, with no AI involved.
      ensureOverlay();
      clearDots();
      drawDot({ x: 40, y: 40, w: 120, h: 40 }, "#22c55e", "TEST DOT - plumbing works", {
        next: "nothing — this dot is a wiring check"
      });
      return;
    }
    if (msg.type === "START") start(msg.goal || "");
    if (msg.type === "PAUSE") paused = true; // safe point to type an OTP or password
    if (msg.type === "STOP") stop();
  });

  document.addEventListener("click", onClick, true); // capture, but never block the click
  document.addEventListener("mousemove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    gdUpdateHoverCard(mouse.x, mouse.y);
  });
  window.addEventListener("scroll", scheduleRepaint, true);
  window.addEventListener("resize", scheduleRepaint);
})();
