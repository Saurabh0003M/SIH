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
    if (scaffold && scaffold.hide) {
      gdFarewell(); // mastered: the guidance leaves with a ring, not a blink
      return; // the learner does it unaided
    }
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
    // How far off-screen, in screenfuls. One arrowhead is "just past the edge";
    // two is "this is a long way, keep going". A single arrow for a four-flick
    // scroll teaches the person the arrow cannot be trusted.
    const FAR = 1.25;
    if (r.bottom < 8) {
      const far = -r.bottom > innerHeight * FAR;
      drawArrow(
        "up",
        color,
        far ? "Keep scrolling up — it is near the top of the page"
            : "Scroll up — your next step is above",
        { far }
      );
      return;
    }
    if (r.top > innerHeight - 8) {
      const far = r.top - innerHeight > innerHeight * FAR;
      drawArrow(
        "down",
        color,
        far ? "Keep scrolling down — it is near the bottom of the page"
            : "Scroll down — your next step is below",
        { far }
      );
      return;
    }

    // Get out of our own way before drawing: if the panel is sitting on the
    // control, move it, then re-read the rect since the page may have shifted.
    if (gdChatAvoid({ x: r.left, y: r.top, w: r.width, h: r.height })) {
      const r2 = node.getBoundingClientRect();
      r.x = r2.left; r.y = r2.top;
    }

    const percent = Math.round(lastResult.confidence * 100);
    drawDot(
      { x: r.left, y: r.top, w: r.width, h: r.height },
      color,
      `${lastResult.reason} (${percent}%)`,
      {
        opacity: scaffold ? scaffold.opacity : 1,
        showLabel: scaffold ? scaffold.showLabel : true,
        next: lastResult.next || "",
        // Lets the motion layer tell "new step" from "same step, page scrolled".
        key: lastResult.targetId
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

  // A page that is still arriving has almost nothing in the DOM. Reading it then
  // produces a confident "nothing here matches" about a screen that has not
  // rendered yet - which is exactly what happened on a slow BookMyShow load:
  // one control found, and a red verdict next to a visible Book tickets button.
  // So: wait for the mutations to stop, and if what we found is implausibly thin
  // while the document is still loading, give it another moment and look again.
  const GD_THIN_PAGE = 4;

  async function readWhenSettled(token) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await waitForQuiet();
      if (token !== runToken) return null;
      const els = getInteractiveElements();
      if (els.length >= GD_THIN_PAGE || document.readyState === "complete") return els;
      showBanner(`Still loading - only ${els.length} controls so far, waiting...`, "info");
      await new Promise((r) => setTimeout(r, 700));
    }
    return token === runToken ? getInteractiveElements() : null;
  }

  async function step() {
    const token = ++runToken;
    ensureOverlay();
    clearDots();

    const tRead = performance.now();
    showBanner("Reading this page...", "info");
    const elements = await readWhenSettled(token);
    if (!elements) return; // a newer run superseded this one
    const readMs = Math.round(performance.now() - tRead);
    showBanner(elements.length + " controls found - choosing...", "info");
    // Show the working, not just the answer: the candidates and their real
    // on-device scores, while the choice is still being made.
    gdThinkScan(elements, goal);

    const tDecide = performance.now();
    const result = await pickTarget(elements, goal, history, clicked);
    const decideMs = Math.round(performance.now() - tDecide);
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
    const tDraw = performance.now();
    say(`${WORDS[result.band]}: ${result.reason} (${pct}%)`, result.band);
    if (scaffold.level === "mastered") {
      say("You've done this step five times — try it without the dot.", "bot");
      // Mastered is not "done forever". Schedule the return visit.
      gdReviewRecord(gdRecipeKey(goal, location.host), "easy").then((e) =>
        say(`I'll bring this back for practice — ${gdReviewLabel(e)}.`, "bot")
      );
    }
    paint();
    gdThinkVerdict(result, chosen.name, !result.offline, {
      read: readMs,
      decide: decideMs,
      draw: Math.round(performance.now() - tDraw)
    });
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
      gdShakeDot(); // make the correction visible, not only readable
      // A wrong turn shortens the review interval, exactly as a lapse does in
      // spaced repetition — the schedule follows the evidence, not a timer.
      gdReviewRecord(gdRecipeKey(goal, location.host), "again");
      await waitForQuiet();
      if (!paused) step();
    }
  }

  function start(newGoal) {
    gdChatOpen();   // a run you cannot read is not guidance
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
    gdThinkClear();
    gdClearBanner();   // the "best guess" pill must go with the dot
    gdChatReset();     // and the transcript with it
    gdChatCollapse();  // out of the way, one click from coming back
  }

  // ---- the on-page ask bar -------------------------------------------------
  // Clear out any panel and overlay left by an earlier injection first. After
  // "Reload" on chrome://extensions the old DOM survives with dead listeners,
  // so without this the page shows two Disha panels at once.
  gdEvictStale();
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
