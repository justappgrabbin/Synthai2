# SynthAi2 Specialist Studio — attached backend

## Integration
The new `/specialists` screen is a route in SynthAi2's existing React application. Its requests are handled by `server/services/specialistStudio.ts`, mounted from the **same existing Express server** in `server/index.ts`. No new competing dashboard or independent cloud app is created.

- First message creates a domain-specific lead specialist, a goal, and explicit task checkpoints; multi-domain requests also create supporting specialist roles.
- Tools are registered server-side and executed there. A generated tool is currently an executable *pipeline* of approved primitive operations, not arbitrary generated JavaScript.
- Model Maker creates reusable instruction/persona profiles. It does **not** train a large language model.
- Neural Net Maker trains and stores actual weights for a small deterministic 2–4–1 sigmoid classifier (two numeric inputs, binary label). It is **not** a general-purpose neural architecture designer.
- Personal Store catalogs and exports created assignments, tools, profiles and trained networks. It is **not** a public marketplace.
- Each state change and local execution is recorded in the server-side audit log. No task is automatically marked complete by a tool execution; completion requires recorded evidence.

## Backend and local model
Run as part of the existing SynthAi2 server (`npm run dev` for local development). The specialist backend itself works without a language model.

For generative replies, attach a compatible **local Ollama runtime** and configure:
- `SYNTHAI_LOCAL_MODEL_URL` (default `http://127.0.0.1:11434`)
- `SYNTHAI_LOCAL_MODEL` (default `llama3.2`)

The service checks availability and returns an explicit unavailable status if the runtime/model isn't available. Model runtime binaries or trained LLM weights are **not** bundled in this pull request.

Server state is persisted in `SYNTHAI_SPECIALIST_DATA_DIR` (default `./data/specialist-studio`). Use a persistent data volume on a hosted deployment. A random browser-side workspace token scopes records; it is a bearer secret, not a substitute for login/authentication. Deploy behind authenticated HTTPS access before public multi-user use.

## Android / Termux limitation
**Capacitor APK packaging does not automatically embed or launch the Node/Express backend.** A browser/PWA hosted from the full SynthAi2 server runs both layers together. A native Android build still needs an intentionally configured bridge to a local Termux backend or a packaged Android-native runtime. Do not claim fully standalone offline APK functionality from this branch.

## Verification
Run from repo root:
```sh
npm ci
npm run check
npx tsx --test server/services/specialistStudio.test.ts
npm run build
```
Tests verify domain selection, real tool outputs, a basic trained network, action persistence, rejection of blank completion evidence, generated tool execution, and workspace isolation. A green compilation alone is not the acceptance criterion.

## Scope
The feature branch does not replace existing Agents, Grove Store, Mesh, AIService, Python service, or other SynthAi2 systems. Follow-up integration should reuse their established interfaces rather than creating conflicting layers.
