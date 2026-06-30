FROM node:24-bookworm-slim

ENV NODE_ENV=production
ENV PORT=10000
ENV NODE_MODE=full
ENV TRIDENT_ONNX_ENABLED=false

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:10000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start:full"]
