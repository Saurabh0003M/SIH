// GROUNDING — decide which element the user should click, and how much to trust it.
//
// The model's self-reported confidence is NOT trustworthy on its own, so we combine it
// with deterministic page-quality signals computed locally. The dot colour comes from
// BOTH numbers. This is the honest-confidence layer that makes the dots meaningful.

const GD_STOPWORDS = new Set([
  "the", "a", "an", "to", "my", "i", "want", "how", "do", "does", "on", "in", "for",
  "of", "and", "is", "it", "this", "that", "please", "can", "me", "go", "with", "get"
]);

function gdTokens(text) {
  const words = String(text).toLowerCase().match(/[a-z0-9]+/g) || [];
  return new Set(words.filter((w) => w.length > 2 && !GD_STOPWORDS.has(w)));
}

// 0..1 — how confident the PAGE (not the model) makes us about this candidate.
function gdGroundingQuality(candidate, goal, all) {
  const name = (candidate.name || "").trim();
  let q = 0;

  if (name) q += 0.30;
  else q -= 0.25; // icon-only / unlabelled control

  const goalTokens = gdTokens(goal);
  const nameTokens = gdTokens(name);
  if ([...nameTokens].some((t) => goalTokens.has(t))) q += 0.20;

  const knownRoles = ["button", "link", "textbox", "checkbox", "radio", "select", "combobox", "tab"];
  if (knownRoles.includes(candidate.role)) q += 0.15;

  const twins = all.filter((o) => o.name === name && o.role === candidate.role).length;
  if (twins === 1) q += 0.15;
  else q -= 0.20; // several look-alikes: we can't tell them apart

  // is it actually the thing on top at that point, or covered by a banner/modal?
  const node = gdGetElement(candidate.id);
  if (node) {
    const r = node.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (top && (top === node || node.contains(top) || top.contains(node))) q += 0.10;
  }

  return Math.max(0, Math.min(1, q));
}

function gdBand(modelConfidence, quality) {
  if (modelConfidence >= 0.8 && quality >= 0.75) return "green";
  if (modelConfidence >= 0.55 && quality >= 0.55) return "amber";
  return "red";
}

// -> { targetId, confidence, band, reason, next }
//    targetId < 0 means "nothing to point at"
async function pickTarget(elements, goal, history, clicked) {
  if (!elements.length) {
    return { targetId: -1, confidence: 0, band: "red", reason: "no interactive elements found" };
  }

  const payload = elements.map((e) => ({ id: e.id, role: e.role, name: e.name, rect: e.rect }));

  // The offline planner is either the chosen provider or the safety net. Either
  // way its answer is capped at amber below — it never gets to claim green.
  const { provider } = await chrome.storage.local.get("provider");
  let res;
  if (provider === "offline") {
    res = gdLocalPick(payload, goal, clicked);
  } else {
    try {
      res = await chrome.runtime.sendMessage({
        type: "GROUND",
        goal,
        history: history || [],
        url: location.href,
        elements: payload
      });
    } catch (e) {
      res = { error: "extension messaging failed" };
    }
    if (!res || res.error) {
      // Degrade instead of dying. Tell the user we did, so the drop in
      // certainty is visible and not silent.
      const fallback = gdLocalPick(payload, goal, clicked);
      fallback.reason = fallback.id < 0
        ? `model unavailable, and ${fallback.reason}`
        : `offline guess: ${fallback.reason}`;
      res = fallback;
    }
  }

  // Treat the reply as untrusted input whoever produced it.
  const id = Number.isInteger(res.id) ? res.id : -1;
  const chosen = elements.find((e) => e.id === id);
  if (!chosen) {
    return {
      targetId: -1,
      confidence: 0,
      band: "red",
      reason: res.reason || "no matching element on this screen"
    };
  }

  const modelConfidence = Math.max(0, Math.min(1, Number(res.confidence) || 0));
  const quality = gdGroundingQuality(chosen, goal, elements);
  let band = gdBand(modelConfidence, quality);
  if (res.offline && band === "green") band = "amber"; // words alone never earn green

  return {
    targetId: id,
    // Show the WEAKER of the two numbers, not their average. An average lets a
    // confident model paper over a page we could barely read, and then the
    // percentage contradicts the colour — "Not sure (61%)" is exactly the kind of
    // mixed signal this product exists to stop giving people.
    confidence: Math.min(modelConfidence, quality),
    band,
    reason: res.reason || chosen.name,
    next: String(res.next || "").slice(0, 90),
    offline: Boolean(res.offline)
  };
}
