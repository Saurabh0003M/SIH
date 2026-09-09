// SCAFFOLD FADING — the pedagogy layer.
//
// The dots are not just navigation help, they are instructional scaffolding.
// Each time the learner successfully performs a step themselves, the guidance for
// THAT step gets quieter, until they are doing it unaided. This is the worked-example
// / guidance-fading pattern (show -> partial -> unaided).
//
// Crucially the fading is CONTINGENT, not on a timer: if the learner gets it wrong,
// support is restored. Research warns that fixed, monotonic fading can be worse than
// not fading at all, so mastery has to be earned and can be lost.

const GD_MASTERY_KEY = "gd_mastery";

// Stable across sessions and page reloads, unlike the per-run element id.
function gdFingerprint(candidate) {
  const name = (candidate.name || "").toLowerCase().replace(/\s+/g, " ").trim();
  return [location.origin, location.pathname, candidate.role, name].join("|");
}

async function gdMastery() {
  const store = await chrome.storage.local.get(GD_MASTERY_KEY);
  return store[GD_MASTERY_KEY] || {};
}

async function gdSetCount(fingerprint, count) {
  const all = await gdMastery();
  all[fingerprint] = Math.max(0, count);
  await chrome.storage.local.set({ [GD_MASTERY_KEY]: all });
}

// The learner did it themselves -> fade the scaffold one notch.
async function gdRecordSuccess(fingerprint) {
  const all = await gdMastery();
  await gdSetCount(fingerprint, (all[fingerprint] || 0) + 1);
}

// They went the wrong way -> restore support (drop two notches, not one).
async function gdRecordFailure(fingerprint) {
  const all = await gdMastery();
  await gdSetCount(fingerprint, (all[fingerprint] || 0) - 2);
}

// How much help should we show for this step right now?
async function gdScaffold(fingerprint) {
  const all = await gdMastery();
  const count = all[fingerprint] || 0;

  // full -> dot + written reason; partial -> quieter dot, no words;
  // faded -> a whisper; mastered -> they perform it unaided.
  let level = "full";
  if (count >= 5) level = "mastered";
  else if (count >= 3) level = "faded";
  else if (count >= 1) level = "partial";

  return {
    level,
    count,
    opacity: Math.max(0.15, 1 - 0.18 * count),
    showLabel: level === "full",
    hide: level === "mastered"
  };
}
