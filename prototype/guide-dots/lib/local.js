// OFFLINE PLANNER — picks the next element with no network, no key, no model.
//
// Two reasons this exists, and both are product reasons, not demo tricks:
//   1. The person we are building for is on a weak connection. An assistant that
//      dies without internet is useless to them.
//   2. When the model call fails, falling back to this beats showing nothing.
//      Its answer is capped at amber in ground.js, so it can never claim
//      model-grade certainty.
//
// It is deliberately dumb: lexical overlap between what the person typed and the
// control's accessible name, bridged by a vocabulary of the words Indians
// actually type versus the words interfaces actually use.

// Left = what the interface calls it. Right = what a person might say instead.
// Matching runs BOTH ways: "money" reaches "withdraw", and having reached
// "withdraw" it also reaches that group's other words, which is how
// "take my money out" gets from a nav item to an amount field.
const GD_SYNONYMS = {
  withdraw: ["money", "cash", "paisa", "paise", "rupee", "out", "take", "transfer", "payout", "redeem", "send"],
  wallet: ["money", "balance", "fund", "cash", "amount", "account", "purse"],
  profile: ["me", "my", "account", "myself", "user", "name"],
  login: ["signin", "enter", "access", "start"],
  logout: ["exit", "quit", "leave"],
  admission: ["apply", "join", "enroll", "enrol", "prospectus", "seat", "course", "college"],
  register: ["signup", "join", "create", "new", "enroll"],
  grievance: ["complaint", "problem", "issue", "help", "support", "query", "wrong", "stuck"],
  payment: ["pay", "fee", "bill", "charge", "recharge"], // deliberately NOT "money": paying in and taking out are opposite errands
  download: ["save", "get", "copy", "print", "receipt", "certificate"],
  submit: ["send", "done", "finish", "confirm", "proceed", "continue", "next", "ok"],
  search: ["find", "look", "where"],
  status: ["track", "progress", "check", "stage", "history"]
};

// word -> Set(every word in every group it belongs to)
const GD_HINTS = (() => {
  const map = new Map();
  for (const [head, words] of Object.entries(GD_SYNONYMS)) {
    const group = new Set([head, ...words]);
    for (const w of group) {
      if (!map.has(w)) map.set(w, new Set());
      group.forEach((g) => map.get(w).add(g));
    }
  }
  return map;
})();

// Just enough stemming that "withdrawal" and "withdraw", "fees" and "fee",
// "applying" and "apply" are the same word. A real stemmer is overkill and
// mangles Hinglish; this only strips the four endings that actually bite.
function gdStem(word) {
  return word
    .replace(/(ing|ies|es|s|al)$/, (m) => (word.length - m.length >= 4 ? "" : m))
    .replace(/i$/, "y");
}

// Typos are not an edge case here. "adress update" and "tatkal tickket" both
// came from real use in front of a judge, and both matched nothing at all,
// because every comparison in this file was exact. Someone typing at speed is
// the normal case, not the unlucky one.

// Bounded edit distance: true when `a` and `b` are within `max` single-character
// edits. Bails out the moment a whole row exceeds the budget, so it stays cheap
// across the 150 controls a real page has.
function gdWithin(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  if (a === b) return true;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (row[j] < best) best = row[j];
    }
    if (best > max) return false; // nothing below this row can come back under budget
    prev = row;
  }
  return prev[b.length] <= max;
}

// One edit for medium words, two for long ones, none for short. "cat" and "cot"
// being one edit apart means nothing; "tickket" and "ticket" being one apart is
// the entire point. Both words must be long enough, or "to" reaches "do".
function gdTypoBudget(word) {
  return word.length >= 7 ? 2 : word.length >= 5 ? 1 : 0;
}

function gdNearMiss(token, goal) {
  const tb = gdTypoBudget(token);
  if (!tb) return false;
  for (const g of goal.expanded) {
    const gb = gdTypoBudget(g);
    if (!gb) continue;
    const max = Math.min(tb, gb);
    if (Math.abs(g.length - token.length) > max) continue;
    if (gdWithin(token, g, max)) return true;
  }
  return false;
}

function gdExpandGoal(goal) {
  const base = new Set([...gdTokens(goal)].map(gdStem));
  const expanded = new Set(base);
  base.forEach((t) => {
    const hints = GD_HINTS.get(t);
    if (hints) hints.forEach((h) => expanded.add(gdStem(h)));
  });
  return { base, expanded };
}

// Roles a person is asked to *act* on, in rough order of how often a task step
// lands on them. Used only to break ties between equally-worded candidates.
const GD_ROLE_PRIOR = {
  button: 0.10, link: 0.09, tab: 0.07, menuitem: 0.07,
  combobox: 0.05, select: 0.05, textbox: 0.05, checkbox: 0.03, radio: 0.03
};

function gdLocalScore(candidate, goal) {
  const nameTokens = new Set([...gdTokens(candidate.name)].map(gdStem));
  if (!nameTokens.size) return 0; // an unnamed control is unexplainable — never point at it

  // A word the person actually typed outranks one we inferred — but only just.
  // The vocabulary above is hand-picked and domain-specific, so a hop through it
  // is nearly as good as a literal match; discounting it hard would make the
  // whole table pointless.
  const GD_INFERRED = 0.85;
  // Below inferred on purpose: a hop through the hand-picked vocabulary is
  // better evidence than a word that merely looks similar to one.
  const GD_FUZZY = 0.7;
  let direct = 0;
  let inferred = 0;
  let fuzzy = 0;
  nameTokens.forEach((t) => {
    if (goal.base.has(t)) direct += 1;
    else if (goal.expanded.has(t)) inferred += 1;
    else if (gdNearMiss(t, goal)) fuzzy += 1;
  });
  if (!direct && !inferred && !fuzzy) return 0;

  const matched = direct + GD_INFERRED * inferred + GD_FUZZY * fuzzy;
  // Coverage, not raw hits: "Withdraw" matching its one word beats "Withdraw
  // money from your linked bank account" matching one of seven.
  const coverage = matched / nameTokens.size;
  const strength = Math.min(1, matched / 2);
  const score = 0.55 * coverage + 0.35 * strength + (GD_ROLE_PRIOR[candidate.role] || 0);
  return Math.max(0, Math.min(1, score));
}

// Same shape the model returns: { id, confidence, reason, next } — the caller
// cannot tell, and must not care, which of the two answered.
//
// `clicked` is the list of element fingerprints already used in this run. Skipping
// them by identity, not by wording, is what stops the guide pointing at the same
// nav item forever while still allowing two steps that share a word.
function gdLocalPick(elements, goal, clicked) {
  const expanded = gdExpandGoal(goal);
  const used = new Set(clicked || []);

  let best = null;
  let bestScore = 0;
  let runnerUp = 0;
  elements.forEach((e) => {
    if (used.has(gdFingerprint(e))) return;
    const s = gdLocalScore(e, expanded);
    if (s > bestScore) {
      runnerUp = bestScore;
      bestScore = s;
      best = e;
    } else if (s > runnerUp) {
      runnerUp = s;
    }
  });

  if (!best) {
    return {
      id: -1,
      confidence: 0,
      reason: "offline: nothing on this screen matches those words",
      offline: true
    };
  }

  // A win by a nose is not a win. Confidence has to reflect the margin, or the
  // colour is lying — and exposed confidence is the whole product.
  const margin = bestScore - runnerUp;
  const confidence = Math.max(
    0,
    Math.min(0.75, bestScore * (0.55 + 0.45 * Math.min(1, margin / 0.3)))
  );

  // Below this floor the "match" is one weak word in common, and pointing at it
  // is worse than admitting we cannot tell. Asked to book a movie ticket, this
  // pointed at a film poster at 30%; asked about tatkal, at a disability
  // concession checkbox at 34%. Whoever sees that stops trusting the green ones
  // too, and the trustworthy green dot is the entire product.
  const GD_LOCAL_FLOOR = 0.35;
  if (confidence < GD_LOCAL_FLOOR) {
    return {
      id: -1,
      confidence,
      reason: `offline: nothing here clearly matches - closest was "${best.name}"`,
      offline: true
    };
  }

  return {
    id: best.id,
    confidence,
    reason: `"${best.name}" matches what you asked`,
    next: "",
    offline: true
  };
}
