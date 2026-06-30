# Self-host Synthia Server

This runs the Synthia backend locally in Docker. No hosted platform is required.

## Run

```bash
docker compose up --build
```

Open:

```text
http://localhost:10000
```

Health check:

```text
http://localhost:10000/health
```

WebSocket endpoint:

```text
ws://localhost:10000/ws
```

## Optional environment

Create a local `.env` file if you want database-backed routes or terminal control:

```env
TERMINAL_TOKEN=choose-a-long-private-token
SUPABASE_PRIMARY_URL=
SUPABASE_PRIMARY_KEY=
SUPABASE_SECONDARY_URL=
SUPABASE_SECONDARY_KEY=
TRIDENT_ONNX_ENABLED=false
```

Without Supabase values, the server starts in degraded database mode and still exposes the core health, graph, artifact, and WebSocket routes.

## Notes

- Default host port: `10000`
- Container port: `10000`
- Start command: `npm run start:full`
- Base image: `node:24-bookworm-slim`
