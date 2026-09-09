(function () {
  const GD_COLORS = { green: "#22c55e", amber: "#f59e0b", red: "#ef4444" };

  let goal = "";
  let paused = false;
  let lastResult = null;
  let lastCandidates = [];
  let lastFingerprint = "";
  let scaffold = null;
  let history = [];
  let runToken = 0;
  let rafId = 0;

  function ensureOverlay() {
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
      zIndex: "2147483647"
    });
    document.documentElement.appendChild(overlay);
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

    // The answer is no use if it's off-screen. Bring it to them.
    let r = node.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) {
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(paint, 420);
      return;
    }

    const percent = Math.round(lastResult.confidence * 100);
    drawDot(
      { x: r.left, y: r.top, w: r.width, h: r.height },
      GD_COLORS[lastResult.band],
      `${lastResult.reason} (${percent}%)`,
      { opacity: scaffold ? scaffold.opacity : 1, showLabel: scaffold ? scaffold.showLabel : true }
    );
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

  async function step() {
    const token = ++runToken;
    ensureOverlay();
    clearDots();

    showBanner("Reading this page...", "info");
    const elements = getInteractiveElements();
    showBanner(elements.length + " controls found - choosing...", "info");

    const result = await pickTarget(elements, goal, history);
    if (token !== runToken || paused) return; // a newer run superseded this one

    lastResult = result;
    lastCandidates = elements;

    if (result.targetId < 0) {
      // Never fail silently - the user must see why nothing appeared.
      showBanner(result.reason, "red");
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
    showBanner(WORDS[result.band], result.band);
    paint();
  }

  async function onClick(event) {
    if (paused || !lastResult || lastResult.targetId < 0) return;

    const node = gdGetElement(lastResult.targetId);
    const hitTarget =
      node && (event.target === node || node.contains(event.target) || event.target.contains(node));

    if (hitTarget) {
      await gdRecordSuccess(lastFingerprint);
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
      await waitForQuiet();
      if (!paused) step();
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === "TESTDOT") {
      // Bisect helper: proves injection + overlay + drawing work, with no AI involved.
      ensureOverlay();
      clearDots();
      drawDot({ x: 40, y: 40, w: 120, h: 40 }, "#22c55e", "TEST DOT - plumbing works");
      return;
    }
    if (msg.type === "START") {
      goal = msg.goal || "";
      paused = false;
      history = [];
      step();
    }
    if (msg.type === "PAUSE") {
      paused = true; // safe point for the user to type an OTP or password
    }
    if (msg.type === "STOP") {
      paused = true;
      runToken++;
      lastResult = null;
      history = [];
      clearDots();
    }
  });

  document.addEventListener("click", onClick, true); // capture, but never block the click
  window.addEventListener("scroll", scheduleRepaint, true);
  window.addEventListener("resize", scheduleRepaint);

  ensureOverlay();
})();
