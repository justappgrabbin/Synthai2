# YOU-N-I-VERSE OS unified container
# Studio UI + Synthia Node MCP bus + Synthia Python consciousness API

FROM node:24-alpine AS studio-builder
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:24-alpine AS synthia-node-builder
WORKDIR /build
COPY synthia-server/package.json synthia-server/package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash ca-certificates curl git supervisor unzip zip \
  && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /workspace /app/data

RUN pip install --no-cache-dir \
    fastapi>=0.120.4 \
    "uvicorn[standard]>=0.38.0" \
    sse-starlette>=2.0.0 \
    httpx>=0.26.0 \
    matplotlib>=3.10.7 \
    numpy>=1.24.0 \
    pydantic>=2.12.3 \
    websockets>=12.0 \
  && pip install --no-cache-dir onnxruntime>=1.16.0 2>/dev/null || true \
  && pip install --no-cache-dir pyswisseph>=2.10.0 2>/dev/null || true

WORKDIR /app/synthia-server
COPY --from=synthia-node-builder /build/node_modules ./node_modules
COPY synthia-server/ ./

WORKDIR /app/studio
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY --from=studio-builder /build/dist ./dist
COPY shared ./shared
COPY you_n_i_verse ./you_n_i_verse

COPY docker/supervisord.conf /etc/supervisor/conf.d/you-n-i-verse.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production
ENV PORT=5000
ENV SYNTHIA_NODE_PORT=10000
ENV SYNTHIA_PYTHON_PORT=8001
ENV NODE_MODE=full
ENV SYNTHIA_URL=http://localhost:8001
ENV VITE_SYNTHIA_API_URL=http://localhost:10000
ENV VITE_SYNTHIA_WS_URL=ws://localhost:10000/ws
ENV LINUX_CONTAINER_ENABLED=true
ENV LINUX_CONTAINER_WORKDIR=/workspace
ENV LINUX_CONTAINER_SHELL=/bin/bash
ENV MESH_DATA_DIR=/workspace
ENV PYTHON_API_AUTOSTART=false
ENV PYTHON_API_URL=http://localhost:8001

EXPOSE 5000 10000

HEALTHCHECK --interval=30s --timeout=8s --start-period=45s --retries=3 \
  CMD curl -sf http://localhost:5000/api/health && curl -sf http://localhost:10000/health || exit 1

CMD ["/start.sh"]
