// AUTOPLAY — drives the demo hands-free so it can be screen-recorded.
//
// Load the page with ?auto=1 and the whole story plays itself: it types into the
// real ask bar, waits for the real dot, and clicks whatever is under that dot
// with elementFromPoint — the same thing a hand does. Nothing here reaches into
// the guide's internals or plants an answer, so a take that looks right IS right.
//
// The point is a demo that cannot fumble. Live typing on stage costs thirty
// seconds and one nervous typo.

(function () {
  if (!/[?&]auto=1/.test(location.search)) return;

  const SLOW = /[?&]slow=1/.test(location.search) ? 1.6 : 1;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms * SLOW));

  // ---- the caption strip -------------------------------------------------
  const cap = document.createElement("div");
  cap.style.cssText = [
    // Sits ABOVE the grounding panel, which owns the bottom-left corner. The
    // demo caption is the thing that should move, not the product's own UI.
    "position:fixed", "left:24px", "bottom:200px", "max-width:min(560px,46vw)",
    "padding:14px 18px", "border-radius:12px", "background:rgba(15,23,42,.94)",
    "color:#fff", "font:500 17px/1.45 system-ui,sans-serif", "z-index:2147483647",
    "box-shadow:0 8px 30px rgb(0 0 0 / 35%)", "opacity:0", "transition:opacity 300ms",
    "pointer-events:none", "border-left:4px solid #22d3ee"
  ].join(";");
  document.documentElement.appendChild(cap);

  async function caption(text, hold = 2600) {
    cap.textContent = text;
    cap.style.opacity = "1";
    await wait(hold);
  }
  const hideCaption = () => { cap.style.opacity = "0"; };

  // ---- talking to the real UI --------------------------------------------
  const shadow = () => document.getElementById("gd-chat-host").shadowRoot;

  async function type(text) {
    const input = shadow().getElementById("q");
    input.focus();
    input.value = "";
    for (const ch of text) {
      input.value += ch;
      await wait(42);
    }
    await wait(400);
    shadow().getElementById("go").click();
  }

  // The dot is the only proof the guide answered. Poll for the real element
  // rather than sleeping a hopeful two seconds.
  // data-landed is set when the travel animation finishes. Without that check
  // the driver reads a rect the dot is still flying through and clicks the
  // wrong control — a bug a human demonstrator would never have.
  function overlayDot() {
    const o = document.getElementById("gd-overlay");
    return (
      o &&
      [...o.querySelectorAll(".gd-dot")].find(
        (d) => d.style.width === "18px" && d.dataset.landed === "1"
      )
    );
  }
  function overlayArrow() {
    const o = document.getElementById("gd-overlay");
    return o && [...o.querySelectorAll(".gd-dot")].find((d) => /Scroll/.test(d.textContent || ""));
  }

  async function waitFor(fn, timeout = 9000) {
    const until = Date.now() + timeout;
    while (Date.now() < until) {
      const hit = fn();
      if (hit) return hit;
      await wait(120);
    }
    return null;
  }

  function centreOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ---- the visible hand --------------------------------------------------
  // A screen recording has no cursor in it. Without one, a viewer sees dots
  // appear and pages change with nothing connecting them, and the single most
  // important claim of this product — THE HUMAN CLICKS, the system never does —
  // is invisible. This pointer is the demo driver made visible; it moves to the
  // real dot and the click still goes through elementFromPoint underneath it.
  const cursor = document.createElement("div");
  cursor.id = "gd-demo-cursor";
  cursor.style.cssText = [
    "position:fixed", "left:0", "top:0", "width:22px", "height:22px",
    "margin:-2px 0 0 -2px", "z-index:2147483647", "pointer-events:none",
    "opacity:0", "transition:opacity 300ms",
    "background:no-repeat center/contain url('data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<path d="M5 2l14 11-6 .6 3.2 6.4-2.6 1.3-3.2-6.4L5 19z" ' +
        'fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
      ) + "')"
  ].join(";");
  document.documentElement.appendChild(cursor);

  // The click ring: a short pulse under the pointer at the moment of the click.
  const ring = document.createElement("div");
  ring.style.cssText = [
    "position:fixed", "width:34px", "height:34px", "margin:-17px 0 0 -17px",
    "border-radius:50%", "border:2px solid #111", "z-index:2147483646",
    "pointer-events:none", "opacity:0"
  ].join(";");
  document.documentElement.appendChild(ring);

  let cur = { x: innerWidth * 0.5, y: innerHeight * 0.75 };
  const place = () => {
    cursor.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
    ring.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
  };
  place();

  // Ease the pointer over, and fire a real mousemove at every step so the
  // proximity hover card reacts to it exactly as it would to a hand.
  async function moveTo(x, y, ms = 620) {
    cursor.style.opacity = "1";
    const from = { ...cur };
    const started = performance.now();
    return new Promise((done) => {
      const tick = (now) => {
        const t = Math.min(1, (now - started) / (ms * SLOW));
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-in-out
        cur = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
        place();
        document.dispatchEvent(
          new MouseEvent("mousemove", { clientX: cur.x, clientY: cur.y, bubbles: true })
        );
        t < 1 ? requestAnimationFrame(tick) : done();
      };
      requestAnimationFrame(tick);
    });
  }

  async function pressRing() {
    ring.style.opacity = "1";
    ring.animate(
      [{ transform: ring.style.transform + " scale(.4)", opacity: 0.9 },
       { transform: ring.style.transform + " scale(1)", opacity: 0 }],
      { duration: 420, easing: "ease-out" }
    );
    await wait(160);
    ring.style.opacity = "0";
  }

  // Hover the dot the way a hand would: a mousemove at its centre.
  // Drift to just beside the dot — inside the proximity radius, not on top of
  // it — so the card opens while the target stays visible.
  async function hoverDot(dot) {
    const c = centreOf(dot);
    await moveTo(c.x - 34, c.y + 26, 520);
  }

  // Click through the dot. The overlay is pointer-events:none, so this lands on
  // the page control underneath — exactly what we ask the user to do.
  async function clickDot(dot) {
    const c = centreOf(dot);
    await moveTo(c.x, c.y);      // the hand travels to the dot, in view
    await wait(180);
    await pressRing();           // and the click is something you can SEE
    const target = document.elementFromPoint(c.x, c.y);
    if (target) target.click();
    await wait(700);
  }

  async function followDot({ hover = false, hold = 1500 } = {}) {
    const dot = await waitFor(overlayDot);
    if (!dot) return false;
    await wait(hold);
    if (hover) {
      await hoverDot(dot);
      await wait(2400);
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 4, clientY: 4, bubbles: true }));
    }
    await clickDot(dot);
    return true;
  }

  const goHome = () => document.querySelector('nav a[data-go="home"]').click();

  // The caption must describe the run that is actually happening. A recording
  // made with a live key that still says "no model is running" is a lie on
  // tape, and it is the kind that survives into a demo video.
  async function groundingCaption() {
    const { provider, apiKey } = await chrome.storage.local.get(["provider", "apiKey"]);
    const live = provider && provider !== "offline" && apiKey;
    return live
      ? `A live model (${provider}) picked this, and the page evidence had to agree before the dot appeared.`
      : "No model is running. It matched his words against the page itself — offline.";
  }

  // ---- the story ---------------------------------------------------------
  async function run() {
    // Start from a learner who has never done this. Otherwise the third scene —
    // "the second time, the words are gone" — silently shows nothing, because
    // the previous take already taught it.
    await chrome.storage.local.set({ gd_mastery: {} });
    await wait(1400);

    await caption("Ravi has money sitting in a broking account. He does not know the word “withdraw”.", 4200);
    await caption("He types what he actually knows.", 2200);
    hideCaption();

    await type("i want to take my money out");

    await caption(await groundingCaption(), 4000);
    await followDot({ hold: 900 });

    await caption("Second step. It read the new screen, not a script.", 3200);
    await followDot({ hold: 900 });

    await caption("Amber, and only 51%. “Confirm and send money” scored almost as well — so it says so.", 4600);
    await followDot({ hover: true, hold: 900 });

    await caption("Move near a dot and it tells you what happens after you click.", 3400);
    await followDot({ hold: 1200 });

    await caption("Four steps. He never learned the word “withdraw”, and never called support.", 4200);
    hideCaption();
    await wait(1200);

    // --- scene 2: the target is off-screen
    goHome();
    await wait(900);
    await caption("A different errand. This time the answer is three screens down.", 3400);
    hideCaption();
    await type("something is wrong, i want to raise a complaint");

    await waitFor(overlayArrow);
    await caption("It points. It does not grab the page and scroll it for him.", 3800);
    hideCaption();
    scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    await wait(1800);
    await followDot({ hold: 1600 });
    await wait(800);

    // --- scene 3: the same task again, quieter
    goHome();
    scrollTo({ top: 0, behavior: "instant" });
    await wait(900);
    await caption("Now watch what happens the second time he does the first task.", 3600);
    hideCaption();
    await type("i want to take my money out");

    await caption("Same dots. No words. He did this once, so it stopped explaining.", 4200);
    await followDot({ hold: 900 });
    await followDot({ hold: 900 });
    hideCaption();
    await wait(600);

    await caption("Five clean repetitions and the dot disappears altogether. That is the product: it is trying to stop being needed.", 5200);
    await wait(600);
    hideCaption();
  }

  addEventListener("load", () => setTimeout(run, 600));
})();
