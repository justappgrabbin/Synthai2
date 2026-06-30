# YOU-N-I-VERSE Linux Container

This project can run as a self-hosted Linux container with the creator studio, Synthia Node MCP/WebSocket bus, Synthia Python consciousness API, and a real in-app terminal bridge.

## Runtime Shape

```text
supervisor
├─ studio          port 5000   YOU-N-I-VERSE React OS + Express API
├─ synthia-node    port 10000  MCP bus, WebSocket mesh, morph/app runner
└─ synthia-python  port 8001   FastAPI consciousness/GNN/oracle service
```

External ports are `5000` and `10000`. Python stays internal and is reached through `SYNTHIA_URL` or the Studio proxy.

## Run with Docker Compose

```bash
docker compose up --build
```

Open:

```text
http://localhost:5000
```

Synthia API/WebSocket:

```text
http://localhost:10000
ws://localhost:10000/ws
```

The app mounts `./workspace` into the container at `/workspace`. The in-app Terminal runs commands from that directory when `LINUX_CONTAINER_ENABLED=true`.

## Useful Environment Variables

```text
PORT=5000
LINUX_CONTAINER_ENABLED=true
LINUX_CONTAINER_WORKDIR=/workspace
LINUX_CONTAINER_SHELL=/bin/bash
LINUX_CONTAINER_TIMEOUT_MS=30000
```

## API Bridge

```text
GET  /api/container/status
POST /api/container/exec
GET  http://localhost:10000/health
WS   ws://localhost:10000/ws
GET  /api/mesh/status
GET  /api/mesh/events
POST /api/mesh/events
GET  /mcp/status
POST /mcp/call
GET  /api/python/status
POST /api/python/start
POST /api/python/stop
ANY  /api/python/proxy/*
GET  /api/workspace/status
GET  /api/workspace/files
POST /api/workspace/files
GET  /api/workspace/files/:path
GET  /api/apps
POST /api/apps/mount
GET  /api/apps/:id
POST /api/apps/:id/run
GET  /api/apps/:id/runs
```

Example body:

```json
{
  "command": "pwd && ls -la"
}
```

The command working directory is restricted to `LINUX_CONTAINER_WORKDIR`.

## Upload or Mount a File

```json
{
  "path": "uploads/hello.js",
  "content": "console.log('hello from YOU-N-I-VERSE');"
}
```

Binary files can use `base64` instead of `content`.

## Mount an App for the Tray

```json
{
  "name": "Hello Tool",
  "icon": "terminal",
  "files": [
    {
      "path": "hello.js",
      "content": "console.log('hello from a mounted app')"
    }
  ],
  "runCommand": "node hello.js"
}
```

ZIP files can be mounted by sending a file with a `.zip` path and `base64` content. Mounted apps are stored under `workspace/apps`, listed by `GET /api/apps`, and executable through `POST /api/apps/:id/run`.

## Python ERN Service

The Node server can manage the Python FastAPI organism. In Docker Compose it autostarts with:

```text
PYTHON_API_AUTOSTART=true
PYTHON_API_PORT=8000
```

Example proxy calls:

```text
GET  /api/python/proxy/
POST /api/python/proxy/ern/initialize
GET  /api/python/proxy/ern/state
POST /api/python/proxy/ern/oracle/ask
```
