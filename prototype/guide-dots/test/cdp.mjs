// Minimal Chrome DevTools Protocol client - no npm packages.
// Node 22+ has a global WebSocket and fetch, so this file is the whole client.
//
// Start Chrome with:
//   chrome.exe --headless=new --remote-debugging-port=9333 \
//              --user-data-dir=<temp> --window-size=1280,720 --hide-scrollbars
// (drop --headless=new to watch it happen).
export async function connect(port = 9333) {
  let list = null;
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (list.length) break;
    } catch { /* Chrome not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  const page = list && list.find((t) => t.type === "page");
  if (!page) throw new Error(`no page target on port ${port} - is Chrome running with --remote-debugging-port?`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const api = {
    events: [],
    onEvent: null, // set to a function to stream events (screencast frames, logs)
    send: (method, params = {}) =>
      new Promise((res, rej) => {
        const n = ++id;
        pending.set(n, { res, rej });
        ws.send(JSON.stringify({ id: n, method, params }));
      }),
    close: () => ws.close()
  };

  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      if (api.onEvent) api.onEvent(msg);
      else api.events.push(msg);
    }
  });

  return api;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Evaluate an async body in the page and return its value.
export async function evaluate(cdp, body) {
  const r = await cdp.send("Runtime.evaluate", {
    expression: `(async () => { ${body} })()`,
    awaitPromise: true,
    returnByValue: true
  });
  if (r.exceptionDetails) {
    throw new Error("page error: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
  }
  return r.result.value;
}
