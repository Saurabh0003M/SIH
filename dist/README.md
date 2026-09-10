# dist/ — the file you hand to a judge

`disha-extension.zip` (62 KB) is the whole working extension, ready to load.

Rebuild it with:

```bash
python deck/build/package.py
```

## What is in it, and what is deliberately not

**In:** `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, all of `lib/`, the
practice portal in `demo/`, the measurement rigs in `test/`, and a one-page **`INSTALL.md`** written
for someone who has never seen the project.

**Out:** the real `config.local.js`, `CLAUDE.md`, `.cursor/`, `.gitignore`.

`config.local.js` **is** in the zip, but as a stub containing no key — it only tells Disha to start in
no-model mode. `popup.html` loads that filename, so omitting it entirely would print a failed-fetch
error in the console every time a judge opened the popup. The packaging script scans every text file
in the finished archive for `sk-`, `AIza` and `agentrouter` before it reports success.

## It was tested, not assumed

The zip was extracted to a temp folder and loaded into a **clean Chrome profile**, then pointed at a
plain page it had never seen (four controls, no Disha code of its own):

```
overlay mounted : true
ask bar mounted : gd-chat-host  (shadow root, "Disha")
typed           : "i want to take my money out"
result          : Not sure - verify this one:
                  offline guess: "Amount to withdraw (₹)" matches what you asked (51%)
```

A red dot, on a page nobody scripted for, with the confidence stated out loud. That is the product
working from the shipped artefact.

**Note for whoever automates this next:** Chrome 152 **ignores `--load-extension`** — the switch was
removed, and `--disable-features=DisableLoadExtensionCommandLineSwitch` no longer brings it back. Launch
with `--enable-unsafe-extension-debugging` and call the CDP method `Extensions.loadUnpacked({path})` on
the browser endpoint instead.

## Before this folder leaves your hands

- **Rotate the AgentRouter key.** It sat in `config.local.js` and in a chat transcript. It is not in
  this zip and never was pushed, but rotate it anyway.
- **Never zip the working `prototype/guide-dots` folder by hand** — your real `config.local.js` lives
  there. Use the script.
