"""Build the judges' zip of the extension.

Staged into a temp folder first, so the real config.local.js in the working tree
is never touched and the key can never ride along.
"""
import io
import os
import shutil
import zipfile

SRC = r"F:\SIH\prototype\guide-dots"
STAGE = r"C:\Users\saura\AppData\Local\Temp\claude\F--SIH\b8180a50-e7e4-4132-a2a2-54639e8c3ea6\scratchpad\stage\disha"
OUT = r"F:\SIH\dist\disha-extension.zip"

# never ship: the key file, the agent notes, editor config, VCS bookkeeping
SKIP_FILES = {"config.local.js", "CLAUDE.md", ".gitignore"}
SKIP_DIRS = {".cursor", "__pycache__", "node_modules"}

STUB = """// Defaults only. THERE IS NO API KEY IN THIS FILE.
//
// Disha starts in no-model mode: it matches your words against the page's own
// control names, works with no internet, and is capped below green by design.
// To get a green dot, open the popup, pick "Gemini API" and paste a free key
// from https://aistudio.google.com/apikey - it is stored in your browser, not here.
const GD_CONFIG = {
  provider: "offline",
  apiKey: "",
  baseUrl: "",
  models: ""
};
"""

if os.path.exists(STAGE):
    shutil.rmtree(STAGE)
os.makedirs(STAGE)

copied = []
for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    rel = os.path.relpath(root, SRC)
    for f in files:
        if f in SKIP_FILES:
            continue
        srcp = os.path.join(root, f)
        relp = os.path.normpath(os.path.join(rel, f))
        dstp = os.path.join(STAGE, relp)
        os.makedirs(os.path.dirname(dstp), exist_ok=True)
        shutil.copy2(srcp, dstp)
        copied.append(relp.replace("\\", "/"))

# popup.html loads config.local.js by name; without it Chrome logs a failed
# fetch on every popup open, which is a poor first impression for a judge.
io.open(os.path.join(STAGE, "config.local.js"), "w", encoding="utf-8").write(STUB)
copied.append("config.local.js (stub, no key)")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
if os.path.exists(OUT):
    os.remove(OUT)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(STAGE):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, STAGE))

print("staged:", len(copied), "files")
for c in sorted(copied):
    print("   ", c)
print("\nzip:", OUT, os.path.getsize(OUT), "bytes")

# hard check: no key material anywhere in the archive
with zipfile.ZipFile(OUT) as z:
    names = z.namelist()
    assert "config.local.js" in names
    bad = []
    for n in names:
        if not n.endswith((".js", ".json", ".html", ".md", ".mjs")):
            continue
        body = z.read(n).decode("utf-8", "replace")
        for marker in ("sk-", "AIza", "AgentRouter", "agentrouter"):
            if marker in body:
                bad.append((n, marker))
    print("key-material scan:", "CLEAN" if not bad else bad)
