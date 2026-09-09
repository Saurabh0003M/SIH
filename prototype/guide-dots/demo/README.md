# Disha demo harness

Runs the **real** extension code on a plain web page, so the guide can be seen,
recorded and regression-tested without installing anything in Chrome.

```bash
python -m http.server 8777 --directory prototype/guide-dots
```

then open <http://localhost:8777/demo/index.html>.

`shim.js` supplies the four `chrome.*` calls a content script needs, backed by
`localStorage`. Everything under `../lib` and `../content.js` is loaded
unmodified — if it works here, it is the shipping code that works.

## The scripted run

Type **"i want to take my money out"** and follow the dots:

| Step | Dot lands on | Colour |
|---|---|---|
| 1 | `Wallet` in the nav | amber 60% |
| 2 | `Withdraw` button | amber 57% |
| 3 | `Amount to withdraw` field | **red 51%** |
| 4 | `Confirm and send money` | amber 75% |

Step 3 going red is the point, not a bug: `Confirm and send money` scores almost
as well, and a narrow win is reported as a narrow win.

Other things worth showing:

- **"i want to raise a complaint"** — the target is in the footer, so you get a
  bouncing *scroll down* arrow instead of a dot, and the dot appears as you reach it.
- **Move the pointer near any dot** — the one-line reason opens into a card.
- **Ask the same thing five times** — the dot fades and finally disappears
  (`lib/fade.js`). *Reset practice memory* in the grey strip puts it back.

## No model is running

The default provider is `offline`: `lib/local.js` matches your words against the
page with a synonym table, no network at all. That is why the colours here are
amber and red — an offline match is capped below green on purpose.

To run it against a real model, in the console:

```js
gdDemoConfig.set({ provider: "gemini", apiKey: "…" });
location.reload();
```

The portal is fictional. No real brokerage, money, accounts or advice.
