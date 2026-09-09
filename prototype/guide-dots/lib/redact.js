// THE PRIVACY BOUNDARY, in code.
//
// The architecture diagram claims "only control names leave the device — never
// your text, never your credentials". That claim was true about page CONTENT
// but not airtight about NAMES: a badly built portal happily puts the value
// into the accessible name, so a field labelled by its own value can carry an
// Aadhaar number, an account number or an OTP straight into the prompt.
//
// Every name is scrubbed here before it leaves tree.js. The mask keeps the
// SHAPE — "Aadhaar «12-digit»" — because the model still has to be able to tell
// an Aadhaar field from a phone field to pick the right one; it just never sees
// the digits.
//
// Idea (not code) from ai-page-assist's `desensitize` module, which strips
// sensitive values before anything reaches a model. That repo carries NO
// licence, so nothing was copied from it — the patterns and the implementation
// below are ours. See ATTRIBUTION.md.

let gdRedactCount = 0;

// Ordered: the most specific pattern must win. An Aadhaar is 12 digits and a
// phone is 10, so Aadhaar is tested first or the tail of an Aadhaar would match
// as a phone number.
const GD_REDACTIONS = [
  // Aadhaar: 12 digits, commonly written 1234 5678 9012.
  [/\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g, "«aadhaar»"],
  // PAN: five letters, four digits, one letter.
  [/\b[A-Z]{5}\d{4}[A-Z]\b/g, "«pan»"],
  [/\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g, "«email»"],
  // Indian mobile, with or without +91, and with the space people actually
  // type: "+91 98765 43210" is the common form and a contiguous \d{9} misses it.
  [/(?:\+?91[ -]?)?\b[6-9]\d{4}[ -]?\d{5}\b/g, "«phone»"],
  // Bank account: 9-18 digits in one run.
  [/\b\d{9,18}\b/g, "«account»"],
  // A bare 4-8 digit run next to the word OTP/PIN/CVV.
  [/\b(otp|pin|cvv|passcode)\b([^\dA-Za-z]{0,8})\d{3,8}\b/gi, "$1$2«code»"],
  // Card number: four groups of four.
  [/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "«card»"]
];

// Card and Aadhaar both match 16 vs 12 digits; run card BEFORE account so a
// 16-digit card is not reported as an account number.
const GD_REDACTION_ORDER = [6, 0, 1, 2, 3, 5, 4];

function gdRedact(text) {
  if (!text) return text;
  let out = String(text);
  for (const i of GD_REDACTION_ORDER) {
    const [pattern, replacement] = GD_REDACTIONS[i];
    out = out.replace(pattern, (...args) => {
      gdRedactCount += 1;
      // Keep $1/$2 backreferences working for the OTP pattern.
      return replacement.replace(/\$(\d)/g, (_, n) => args[Number(n)] ?? "");
    });
  }
  return out;
}

// Called once per enumeration so the console shows a real number rather than a
// promise that nothing leaked.
function gdRedactReport(before) {
  const masked = gdRedactCount - before;
  if (masked > 0) {
    console.log(
      `[GuideDots] privacy: masked ${masked} sensitive value${masked === 1 ? "" : "s"} ` +
      `in control names before anything left the device`
    );
  }
  return masked;
}

const gdRedactTotal = () => gdRedactCount;
