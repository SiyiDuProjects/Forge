# Y Workbench

Y Workbench is a Codex-style hardware MVP planning workbench. It turns a natural-language hardware idea into a UI-only bench packet: scope, BOM, guardrails, quote band, firmware rules, and a DFM packet preview.

当前原型保留中英两套界面文案。默认语言是简体中文，可在 `工作台设置 -> 语言` 切换到 English。

## What Exists

- Single-page UI prototype in `index.html`, `styles.css`, and `app.js`
- Core planning pipeline under `src/core`
- Shared contracts under `src/contracts`
- Project and architecture docs under `docs`
- Node built-in test suite under `tests`
- GitHub Actions check workflow under `.github/workflows/check.yml`

## Run Locally

```bash
npm start
```

The server defaults to `http://127.0.0.1:8765`.

If the managed Codex sandbox reports `listen EPERM`, rerun in a normal local terminal/browser session before treating it as an app bug.

## Verify

```bash
npm run check
```

This runs syntax checks for `server.mjs` and `app.js`, then executes the Node test suite.

## Product Boundary

This is a complete clickable UI prototype, not a real manufacturing system.

- No real upload
- No real CAD generation
- No real supplier ordering
- No real payment or checkout
- No real manufacturing/export action

Every visible button should still produce a concrete UI state: view switch, popover, panel, filter, mock queue state, or mock notice.

## Key Docs

- [Project Plan](docs/PROJECT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contracts](docs/CONTRACTS.md)
- [Observability](docs/operations/OBSERVABILITY.md)
