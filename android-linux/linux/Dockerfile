# Actual Android ARM64 Linux rootfs, not a static WebView-only preview.
# Studio, Synthia Node, Synthia Python and the original trained Klein model are in the guest.
FROM --platform=$BUILDPLATFORM node:24-bookworm-slim AS webbuild
WORKDIR /source
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build
RUN test -f dist/index.js && test -f dist/public/index.html

FROM node:24-bookworm-slim AS nodearm
FROM python:3.12-slim-bookworm AS guest
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash ca-certificates curl libstdc++6 libgomp1 libatomic1 \
    libglib2.0-0 libgl1 git tini \
    && rm -rf /var/lib/apt/lists/*
COPY --from=nodearm /usr/local/bin/node /usr/local/bin/node
COPY --from=nodearm /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
RUN node --version && python3 --version

WORKDIR /opt/synthai/studio
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=webbuild /source/dist ./dist
COPY shared ./shared
COPY you_n_i_verse ./you_n_i_verse

WORKDIR /opt/synthai/synthia-server
COPY synthia-server/ ./
# Only trim native Node modules not loaded by Synthia's existing lite.js.
# The source repository is not changed.
RUN node -e "const fs=require('fs'),p=JSON.parse(fs.readFileSync('package.json','utf8')); for(const n of ['onnxruntime-node','exceljs','pdf-parse','mammoth'])delete p.dependencies[n];delete p.devDependencies;fs.writeFileSync('package.json',JSON.stringify(p))" \
    && npm install --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force \
    && node -e "require('express');require('cors');require('helmet')" \
    && test -f server/lite.js && test -f server.py
# Prevent the Synthia MCP bus from listening on the phone's public interfaces.
RUN sed -i 's/app.listen(PORT, () => {/app.listen(PORT, "127.0.0.1", () => {/' server/lite.js

# PRoot is a glibc Linux environment; use ARM64 Linux wheels, not Android host wheels.
WORKDIR /opt/synthai/klein-source
COPY vendor/klein-agent/ ./
RUN test -f run/model.pt && test -f run/tokenizer.json \
    && echo 'ed94061b70e07d83aab5da6a1519cc293c413d541f183eac5d95a1525574f75e  run/model.pt' | sha256sum -c - \
    && echo '8c61e8b0bc628d165b4d5a8c6f485399765b8c236b71e0cb901a910e3671f73a  run/tokenizer.json' | sha256sum -c -
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
RUN pip install --no-cache-dir "fastapi>=0.110" "uvicorn>=0.27" "sse-starlette>=2" \
    "httpx>=0.26" "mcp>=1" "onnxruntime>=1.16" "websockets>=12" "aiortc>=1.6" \
    && python3 -c 'import torch,tokenizers,fastapi,uvicorn;print("Cynthia ARM64 original dependencies:",torch.__version__)'
# REA is a real JavaScript skill dependency; do not install or change other donor source.
RUN if [ -f skills/rea/package-lock.json ]; then cd skills/rea && npm ci --omit=dev --ignore-scripts --no-audit --no-fund; fi

WORKDIR /opt/synthai
COPY android-linux/guest/start.mjs ./guest/start.mjs
RUN mkdir -p /var/lib/synthai /root /tmp \
    && test -f studio/dist/index.js \
    && test -f studio/dist/public/index.html \
    && test -f synthia-server/server/lite.js \
    && test -f synthia-server/server.py \
    && test -f klein-source/web_app.py \
    && test -f guest/start.mjs
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV NODE_ENV=production
ENV SYNTHIA_PHONE_CONTAINER=1
ENV HOME=/root
CMD ["node","/opt/synthai/guest/start.mjs"]
