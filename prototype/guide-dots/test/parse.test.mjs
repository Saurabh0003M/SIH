// Exercise gdParseReply against the shapes models actually return.
// background.js is a classic service-worker script, so load it into a context
// with the globals it expects and pull the function out.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const ctx = {
  self: {}, console,
  chrome: { storage: { local: { get: async () => ({}), set: async () => {} } },
            runtime: { onMessage: { addListener() {} } } },
  fetch: async () => { throw new Error("no network in this test"); },
  setTimeout
};
vm.createContext(ctx);
new vm.Script(src + "\n;globalThis.__parse = gdParseReply;").runInContext(ctx);
const parse = ctx.__parse;

const cases = [
  ["plain", '{"id":3,"confidence":0.82,"reason":"wallet link","next":"wallet page"}', 3],
  ["fenced", '```json\n{"id":5,"confidence":0.4,"reason":"x","next":"y"}\n```', 5],
  ["fenced no lang", '```\n{"id":6,"confidence":0.4,"reason":"x","next":"y"}\n```', 6],
  ["chatty prefix", 'Sure! Here is the answer:\n{"id":7,"confidence":0.9,"reason":"a","next":"b"}', 7],
  ["trailing prose", '{"id":8,"confidence":0.5,"reason":"a","next":"b"}\nHope that helps!', 8],
  ["TWO objects", '{"id":9,"confidence":0.5,"reason":"a","next":"b"}\n{"id":99,"confidence":0.1}', 9],
  ["brace in string", '{"id":10,"confidence":0.5,"reason":"the {x} button","next":"b"}', 10],
  ["null id", '{"id":null,"confidence":0.1,"reason":"nothing matches","next":""}', -1],
  ["nested object", '{"id":11,"confidence":0.5,"reason":"a","next":"b","meta":{"k":1}}', 11]
];

let pass = 0, fail = 0;
for (const [name, input, wantId] of cases) {
  try {
    const got = parse(input);
    const ok = got.id === wantId;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(16)} id=${got.id} (want ${wantId})`);
    ok ? pass++ : fail++;
  } catch (e) {
    console.log(`FAIL  ${name.padEnd(16)} threw: ${e.message}`);
    fail++;
  }
}

// These MUST throw, with a message a human can act on.
const bad = [
  ["empty", ""],
  ["prose only", "I could not find anything relevant on this page."],
  ["truncated", '{"id":3,"confidence":0.8,"reason":"wal'],
  ["malformed", "{id: 3, confidence: oops}"]
];
for (const [name, input] of bad) {
  try {
    parse(input);
    console.log(`FAIL  ${name.padEnd(16)} should have thrown`);
    fail++;
  } catch (e) {
    console.log(`PASS  ${name.padEnd(16)} threw: "${e.message.slice(0, 58)}"`);
    pass++;
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
