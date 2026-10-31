# Pascal Editor in Synthai2 — PR #10

**What this is:** the actual [Pascal Editor](https://github.com/pascalorg/editor), an MIT-licensed, local-first **3D building editor** with React Three Fiber, WebGPU, scene editing and an optional MCP service. It is NOT a Pascal programming-language editor or a mock drawing canvas.

## Where it lives

Open Synthai2 → **IDE** → **Pascal 3D Builder**. The existing **Code Editor** remains available as its own tab. The Pascal tab checks a real Pascal server before showing the independently hosted editor in a frame, and includes **Open full Pascal** in case frame, login or browser policies prevent embedded editing.

The official Pascal web editor is its own Next.js application and has separate dependencies, authentication, persistent SQLite data and agent tooling. This integration **deliberately does not vendor** Pascal's large source tree or force its Three.js / React Three Fiber version into Synthai2, which is already using older versions. We avoid replacing anything you built.

## Run in your self-hosted Linux environment (no Docker)

Pascal's upstream CLI instructions:

```sh
node --version
npx @pascal-app/cli editor --no-open
```

Check that Node.js is a supported recent release: 22.23.4+ on the 22 line, 24.22.1+ on the 24 line, or 26.12.1+. The first launch downloads a versioned runtime archive. See [Pascal SETUP.md](https://github.com/pascalorg/editor/blob/main/SETUP.md) and [CLI instructions](https://github.com/pascalorg/editor/blob/main/packages/cli/README.md).

The CLI's managed runtime normally binds to a random **loopback port** (often shown with the hostname `pascal.localhost`). Don't invent a fixed port, and don't assume that your Android tablet can connect to `localhost` on another machine. If exposing it beyond the host, use a secure private network, an authenticated reverse proxy, and/or Pascal's own self-host auth; upstream requires a password on network-accessible instances (`PASCAL_ADMIN_PASSWORD`) unless already secured by an authenticating proxy. Never publish an unauthenticated editor to the Internet.

The separate Pascal runtime stores scenes locally (default `~/.pascal/data/pascal.db`). Keep a persistent data directory, even if you rebuild or reinstall the computer. It can be run as a managed service on your existing Linux host. Docker is optional, not required.

Configure these **Synthai2 backend** environment variables with *actual* reachable addresses after installing Pascal:

```sh
export SYNTHAI_PASCAL_EDITOR_URL="http://127.0.0.1:<actual-pascal-port>"
export SYNTHAI_PASCAL_EDITOR_PUBLIC_URL="https://<your-authenticated-private-pascal-host>"
```

Those are **placeholders**, not working addresses; replace them with the endpoint Pascal actually reports. If the Linux container is on the tablet itself, the private browser address may differ from the address on a separate computer.

Restart Synthai2's backend, open **IDE → Pascal 3D Builder**, and press Refresh. The status check calls `GET /api/health` on the configured Pascal backend and requires `{"status":"ok","app":"editor"}`. When it passes and a tablet-accessible URL exists, the pane loads the original editor. The standalone Open button is the fallback if cross-origin session cookies or frame policies block the embedded tab. A configured URL alone is not reported as online.

## Capability boundaries

- This implementation provides a **real editor integration path** and launch status, not an automatic Pascal installation or background process manager.
- Pascal's official MCP service remains part of Pascal's own CLI. Agent pairing and scene/tool synchronization are not yet wired into Synthai2's existing MCP catalog.
- Pascal's **read-only public embeds** (`/embed/<project-id>`) are supported upstream, but are not the same as embedding the authenticated editor; don't expose projects by default.
- Saved scenes remain in Pascal's store. Later linkage to Synthai2's canonical 13-field ontology requires actual project provenance, not a fabricated gate or an arbitrary hash-based mapping.
- This is a non-destructive change on `integration/autoapp-state-space-20261030`, the branch for PR #10. It does not update or merge `main`.

## Validation

```sh
npx tsx --test tests/pascalEditorService.test.ts
npm run check
npm run build
```

A passing code test proves endpoint handling; **it does not prove Pascal was installed or that an authenticated tablet actually edited and saved a 3D scene**. Verify a complete edit/save/reopen cycle on your own Linux host and tablet after setup.
