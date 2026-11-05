# SynthAi2 MCP Apps bridge

This is an additive integration for the existing SynthAi2 Studio Express server. It does not replace the separate synthia-server, change Human Design rules, modify the app/game asset pipeline, or expose shell/file-write actions.

## Existing services presented as MCP Apps

| MCP tool | UI resource | Existing source |
| --- | --- | --- |
| `synthia_system_overview` | `ui://synthai2/control-center.html` | mesh, container, Python and workspace status |
| `synthia_mesh_events` | same UI | mesh event metadata; payloads intentionally omitted |
| `synthia_mounted_apps` | same UI | mounted app manifests; no launch/execution |

Each tool returns text for ordinary MCP clients and structured content for MCP Apps-capable hosts. The interface provides tabs and refresh controls using the MCP Apps host bridge. A native `/mcp-apps` page and AppRegistry entry expose a matching view inside SynthAi2.

## Runtime and dependency compatibility

The current Studio uses Zod 3. MCP Apps 2.x requires Zod 4.2+, whereas MCP Apps 1.7.5 supports Zod 3.25+ and the MCP SDK 1.29+ with the same MCP Apps wire protocol. This branch avoids forcing a major Zod upgrade.

## Install and build

1. In repository root run `npm install` to install the new packages and regenerate `package-lock.json`.
2. Commit the refreshed `package-lock.json` before any Docker build. Docker invokes `npm ci`, which requires a matching lockfile.
3. Run `npm run check`, `npm run test:mcp-apps`, and `npm run build`.
4. Configure a unique high-entropy secret (32+ characters), for example `export SYNTHIA_MCP_TOKEN="$(openssl rand -hex 32)"`.
5. Start the existing Studio with `npm run start` or existing container runtime. MCP Streamable HTTP is served at `/mcp` on the same Studio port.

The build script bundles the view locally with SynthAi2's existing esbuild dependency, stages the HTML with it, and embeds both into the `ui://` resource. It does not call a CDN or a hosted generation API.

## Permissions and transport

- New `/mcp` requires `Authorization: Bearer <SYNTHIA_MCP_TOKEN>`.
- If the token is absent or shorter than 32 characters, `/mcp` fails closed.
- Origin headers are checked against `SYNTHIA_MCP_ALLOWED_ORIGINS`, a comma-separated list of exact approved origins. Do not use a wildcard.
- For a web browser that sends CORS preflight, configure the exact browser origin. Server-to-server MCP hosts commonly omit Origin.
- Remote access must use HTTPS. Static bearer authentication does not by itself satisfy every external MCP host's OAuth expectations; validate the target host's required auth before publishing it.
- This bridge exposes only status, mesh metadata and mounted app names. It excludes commands, file contents, event payloads, birth information and user records.
- Existing `/mcp/status` and `/mcp/call` routes remain unchanged.
- The separate Synthia MCP bus remains independent.
- Source changes are additive: existing assets and tray preferences are not reset.

## Validation

Run `npm run test:mcp-apps` for authentication smoke tests. In a supported MCP host, connect to `/mcp` with its bearer token, discover tools and invoke `synthia_system_overview`, `synthia_mesh_events` and `synthia_mounted_apps`. Check that the linked UI resource renders and that the tabs and Refresh control call the same tools.

Verify `/mcp/status` and `/mcp/call` independently to confirm backwards compatibility.

## Implementation boundary

The first version serves the Studio's existing read-only functionality. Existing Human Design and specialized Synthia-server tools are not re-registered here yet because the deployment separates those runtimes and their permission models. They are not mocked or substituted.

**Review status:** This feature branch is not deployed. The package lock must be regenerated and automated build/host integration tests completed before merging.
