// SPACED PRACTICE. A procedure you did once is not a procedure you can do in
// three weeks, so a mastered recipe gets a next-review date instead of being
// marked "done" forever. This is the spaced-retrieval claim on the impact slide
// (g = 0.74) made real in code rather than asserted on a slide.
//
// Ported from fsrs4anki (MIT) — https://github.com/open-spaced-repetition/fsrs4anki
// commit ff7c85c, file fsrs4anki_scheduler.js. The FSRS-5 formulas and default
// weights are theirs; the wiring to fade.js mastery and to a per-recipe store is
// ours. See ATTRIBUTION.md.
//
// Two deliberate simplifications, because a learner clicking through a portal is
// not a flashcard:
//   - No "again/hard/good/easy" button. We infer the rating from what actually
//     happened: a clean unaided run is `good`, a run with a wrong click is
//     `again`, and a run that was mastered and stayed mastered is `easy`.
//   - No fuzz. Anki spreads load across a big deck; we have a handful of
//     recipes and a demo that has to be reproducible.

const GD_FSRS_W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666,
  0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542
];
const GD_FSRS_RETENTION = 0.9; // aim to recall 90% of the time
const GD_FSRS_MAX_DAYS = 365;
const GD_REVIEW_KEY = "gd_review";

const GD_DECAY = -GD_FSRS_W[20];
const GD_FACTOR = Math.pow(0.9, 1 / GD_DECAY) - 1;
const GD_RATING = { again: 1, hard: 2, good: 3, easy: 4 };

const gdClampD = (d) => Math.min(Math.max(+d.toFixed(2), 1), 10);

function gdInitStability(rating) {
  return +Math.max(GD_FSRS_W[GD_RATING[rating] - 1], 0.1).toFixed(2);
}
function gdInitDifficulty(rating) {
  return gdClampD(GD_FSRS_W[4] - Math.exp(GD_FSRS_W[5] * (GD_RATING[rating] - 1)) + 1);
}
// How likely the learner still remembers, given days elapsed and stability.
function gdRecallProbability(days, stability) {
  return Math.pow(1 + GD_FACTOR * days / stability, GD_DECAY);
}
function gdNextDifficulty(d, rating) {
  const deltaD = -GD_FSRS_W[6] * (GD_RATING[rating] - 3);
  const damped = d + (deltaD * (10 - d)) / 9; // linear damping
  const reverted = GD_FSRS_W[7] * gdInitDifficulty("easy") + (1 - GD_FSRS_W[7]) * damped;
  return gdClampD(reverted);
}
function gdNextRecallStability(d, s, r, rating) {
  const hardPenalty = rating === "hard" ? GD_FSRS_W[15] : 1;
  const easyBonus = rating === "easy" ? GD_FSRS_W[16] : 1;
  return +(
    s *
    (1 +
      Math.exp(GD_FSRS_W[8]) *
        (11 - d) *
        Math.pow(s, -GD_FSRS_W[9]) *
        (Math.exp((1 - r) * GD_FSRS_W[10]) - 1) *
        hardPenalty *
        easyBonus)
  ).toFixed(2);
}
function gdNextForgetStability(d, s, r) {
  const sMin = s / Math.exp(GD_FSRS_W[17] * GD_FSRS_W[18]);
  return +Math.min(
    GD_FSRS_W[11] *
      Math.pow(d, -GD_FSRS_W[12]) *
      (Math.pow(s + 1, GD_FSRS_W[13]) - 1) *
      Math.exp((1 - r) * GD_FSRS_W[14]),
    sMin
  ).toFixed(2);
}
// Days until recall probability decays to the retention target.
function gdIntervalDays(stability) {
  const raw = (stability / GD_FACTOR) * (Math.pow(GD_FSRS_RETENTION, 1 / GD_DECAY) - 1);
  return Math.min(Math.max(Math.round(raw), 1), GD_FSRS_MAX_DAYS);
}

const gdDayMs = 86400000;

async function gdReviewAll() {
  const store = await chrome.storage.local.get(GD_REVIEW_KEY);
  return store[GD_REVIEW_KEY] || {};
}

// Record one completed run of a recipe and return its next review date.
// `rating`: "again" (a wrong click happened) | "good" (clean) | "easy" (mastered).
async function gdReviewRecord(recipeKey, rating = "good") {
  const all = await gdReviewAll();
  const now = Date.now();
  const prior = all[recipeKey];
  let d, s;

  if (!prior) {
    d = gdInitDifficulty(rating);
    s = gdInitStability(rating);
  } else {
    const days = Math.max(0, (now - prior.last) / gdDayMs);
    const r = gdRecallProbability(days, prior.s);
    d = gdNextDifficulty(prior.d, rating);
    s = rating === "again"
      ? gdNextForgetStability(prior.d, prior.s, r)
      : gdNextRecallStability(prior.d, prior.s, r, rating);
  }

  const interval = gdIntervalDays(s);
  const entry = { d, s, last: now, due: now + interval * gdDayMs, interval, reps: (prior?.reps || 0) + 1 };
  all[recipeKey] = entry;
  await chrome.storage.local.set({ [GD_REVIEW_KEY]: all });
  return entry;
}

// What the popup shows. Sorted so the most overdue is first.
async function gdReviewDue(limit = 5) {
  const all = await gdReviewAll();
  const now = Date.now();
  return Object.entries(all)
    .map(([key, e]) => ({
      key,
      ...e,
      overdueDays: Math.floor((now - e.due) / gdDayMs),
      recall: gdRecallProbability(Math.max(0, (now - e.last) / gdDayMs), e.s)
    }))
    .sort((a, b) => a.due - b.due)
    .slice(0, limit);
}

// "Withdraw money" on "bharatinvest.demo" -> one stable key.
function gdRecipeKey(goal, origin) {
  return `${origin || location.host}::${String(goal).trim().toLowerCase().slice(0, 60)}`;
}

function gdReviewLabel(entry) {
  const days = Math.round((entry.due - Date.now()) / gdDayMs);
  if (days <= 0) return "due now";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}
