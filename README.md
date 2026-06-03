# Forge

Forge is a Codex-style hardware MVP planning workbench. It turns an ongoing hardware conversation into a `ProductPlan`: scope, parts list (BOM), risk limits, model/3D placeholder, electronics layout placeholder, quote assumptions, and a local human review packet.

当前原型保留中英两套界面文案。默认语言是简体中文，可在 `Forge 设置 -> 语言` 切换到 English。

Current enclosure boundary: every MVP shell is treated as a standardized 3D printed enclosure. Woodgrain, sage, graphite, and branded looks are finish treatments on that shell path, not separate manufacturing processes.

Current order boundary: `提交审核下单` writes a local human review packet only. It does not collect payment, start manufacturing, or contact suppliers.

## What Exists

- Single-page UI prototype in `index.html`, `styles.css`, and `app.js`
- Core planning pipeline under `src/core`
- ProductPlan, asset, job, model placeholder, electronics layout placeholder, quote assumption, and local review APIs
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
- No enclosure process beyond standardized 3D printing
- No final CAD or real 3D generation yet; v1 reserves provider/job interfaces and placeholder assets

Every visible button should still produce a concrete UI state: view switch, popover, panel, filter, mock queue state, or mock notice.

## Key Docs

- [Project Plan](docs/PROJECT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contracts](docs/CONTRACTS.md)
- [Observability](docs/operations/OBSERVABILITY.md)
