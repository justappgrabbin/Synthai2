# North Star — self-hosted computer slice

Branch: \`integration/autoapp-state-space-20261030\`. Adds to the **existing** Synthai2 application. No destructive merge or state-space replacement. Uses no Docker, hosted LLM, third-party signaling service, or external database as a **required** dependency.

## What works in this branch

- \`/north-star\`: visible from Synthai2 dashboard and navigation.
- \`/api/north-star/status\`: truthful backend status and configured AutoApp reachability (3-second health check).
- \`POST /api/north-star/entities\`: 13-field, source-required admission with validation; no filename hashing or fabricated coordinates.
- \`GET /api/north-star/entities\`: private list of admitted entities.
- \`POST /api/north-star/relationships\`: requires both endpoints previously admitted, with an explicit source.
- Data stored at \`$SYNTHAI_DATA_DIR/north-star-ontology.json\` using atomic rename and a single-process write queue. Mount this directory on **persistent local storage inside your Linux container**. Do not expose it to the public.
- P2P manual WebRTC offer/answer and a direct device-to-device data channel. This is a transport demonstration, not identity proof, authenticated matching or complete social networking.

## Container configuration — Linux (without Docker)

The existing Synthai2 server must run on a trusted private network. For persistence and administrator access, set:

\`\`\`sh
export SYNTHAI_DATA_DIR="$HOME/synthai2-data"
mkdir -p "$SYNTHAI_DATA_DIR"
chmod 700 "$SYNTHAI_DATA_DIR"
export SYNTHAI_ONTOLOGY_ADMIN_TOKEN="$(openssl rand -hex 32)"
npm run dev
\`\`\`

Keep the administrator token private. In North Star, enter it for writes; the page keeps it in React state only (it is not saved to browser localStorage). A reverse proxy with TLS and real user authentication is required before exposing these endpoints to the internet; **the admin token is not a substitute for multi-user account security**. Browser device connection can use a private VPN or a reachable LAN address. A Linux container on your tablet and a Linux machine elsewhere have different network routes; no tablet-specific runtime was assumed.

### AutoApp's original backend

The supplied \`AutoApp-main.zip\` is a separate TypeScript monorepo proof of concept. It uses pnpm, PostgreSQL, Google login through Better Auth unless intentionally disabled **for local development only**, and sandbox provisioning. It is not a standalone single-file builder and is not started merely by installing this Synthai2 branch.

Once its existing platform has been deployed to a private Linux service with its real dependencies, set on the Synthai2 backend:

\`\`\`sh
export SYNTHAI_AUTOAPP_URL="http://127.0.0.1:3001"
\`\`\`

That address is correct **only if AutoApp and Synthai2 share the same Linux network namespace** and AutoApp is listening on port 3001. Otherwise set it to the actual private, reachable backend address. For the tablet-facing launch action, set \`SYNTHAI_AUTOAPP_PUBLIC_URL\` to the address the tablet browser can really reach, with appropriate TLS and auth. Omit it until you have a reachable endpoint; we never fabricate a working public URL.

The dashboard's status checker only accesses \`/api/health\` at that preconfigured base URL; clients cannot supply arbitrary destinations. The UI opens AutoApp's existing \`/builder\` rather than copying or replacing its engine.

### P2P scope and limitations

North Star uses native \`RTCPeerConnection\` and a manually exchanged offer/answer. Start an offer on one device; copy it into the other device's remote signal box, produce an answer, then paste the answer into the first device and apply it. For people across NATs, supply your own STUN servers using \`SYNTHAI_P2P_ICE_URLS\` (comma-separated \`stun:\` or \`stuns:\` URLs). TURN credentials and encrypted identity verification still need a dedicated, reviewed implementation before public usage. No public STUN/TURN servers are configured by default.

Both sides need a person record locally admitted to start a connection, and remote peers are **not** automatically entered into the ontology. Receiving messages is not consent to admit another identity.

### Ontological identity

\`planetary.dimension.gate.line.color.tone.base.degree.minute.second.arc.zodiac.house\`

These thirteen fields are the user-defined address contract. Their derivation is **not** assumed from a filename, short hash, sequence number or a hard-coded gate. \`source\` is required. \`kind:ref\` is a stable record key **in addition** to the address, not a replacement for it. Relationship endpoints must be admitted first.

## Integration not yet claimed

- This branch does **not** yet make every legacy Synthai2 intake endpoint use the address gate. Audit \`/api/mesh/events\`, file/workspace ingests, \`/api/apps/mount\`, agent creation, and world-creation call sites before enforcing the requirement globally; changing those blindly could break current working apps.
- It does **not** merge the separate Simlish play branch or the full r21.22 cultivation donor. Preserve source and integrate after address/admission contracts and regressions are checked.
- It does **not** claim Crossformer forecasting is a hosting backend; that Python research model is optional independent functionality.
- \`AutoOrganizer-main.zip\` could not be read: Google Drive returned a malware/spam download-block response. Do not import uninspected contents.
- The concept images are visual references, **not live monitoring screenshots**. This branch's status display uses actual checks.
- The data JSON file is a single-instance MVP store, not multi-process transaction-safe nor a production multi-user authorization model.

## Verification

Run from the Synthai2 checkout:

\`\`\`sh
npx tsx --test tests/northStarAdmission.test.ts
npm run check
npm run build
\`\`\`

Then verify on your actual Linux host/tablet: status, an incomplete admission (must reject), a complete sourced admission (must persist across restart), a relationship to an unknown entity (must reject), an actual AutoApp health check and launch, and P2P offer/answer between two devices. Tests that pass in CI are not evidence that the separate AutoApp server or remote peers are reachable.
