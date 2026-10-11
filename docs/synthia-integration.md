# Synthia conversation, hover controls, and GitHub hands

This change extends the existing Synthai2 assistant. It does not replace the original Synthia modules or claim implementation of the NSNF v0.9 neural field.

## What is connected

- The existing persistent assistant is named Synthia. Existing history, voice playback, code-to-IDE buttons, AI backend selection, and other app panels remain in place.
- Floating controls support click/touch, optional delayed hover opening, Alt+S (configurable to Alt+A or Alt+J), Escape, and microphone dictation where the browser supports SpeechRecognition. Dictation fills the message box; Send explicitly submits the request. Browser microphone permission is required. Audio is not stored or analyzed by this change.
- Remote AI providers now use `/api/synthia/chat` on the app server, avoiding provider CORS restrictions in the browser. Existing Settings keys are sent over the same-origin connection to a fixed provider allowlist for that request. Local Ollama keeps its existing path. No provider key is bundled or configured by this change.
- User messages `check my GitHub connection` and `push my app to GitHub as my-app-name` execute real GitHub integration calls. `/github status` and `/github push my-app-name` also work. These explicit commands do not require a language model. Arbitrary assistant text is not executed as a tool call.
- GitHub saves use the current local IDE files, not the Synthai2 source checkout or all mounted apps. One commit includes all supplied files; existing repository files outside the workspace are preserved. Existing repositories retain visibility. New repositories are private. Saves require the app's Replit GitHub integration and never return success for an unchecked failed write. The GitHub connection available to this editing session is separate from the deployed app's connection.
- The uploaded B.A.N.T.U. v0.2 archive is copied byte-for-byte to `client/public/contact-lab`. Access it from the toolbar settings link or `/contact-lab/index.html`. Its encoding and particle motion are a standalone experiment. The original README lists the unsupported capabilities.

## Source and evidence

The supplied audit is preserved in `docs/v0.9-gap-audit.md`; attachment SHA-256 values are recorded in `docs/synthia-source-hashes.json`. The supplied NSNF README describes a separate prototype whose Python source and tests are not included in these attachments. Its claimed test results are not results for this repository.

Research reference: https://arxiv.org/html/2511.16680v1 — *Shona spaCy: A Morphological Analyzer for an Under-Resourced Bantu Language*. This is language-specific morphology research, not speech recognition or tool automation. The full Shona spaCy package is not installed. A source-bounded Shona example/rule layer is implemented and connected through `/shona analyze TEXT`, `analyze this Shona: TEXT`, and `/contact-lab`. It attributes exact source examples and preserves ambiguous prefix matches as candidates. It does not claim the paper’s reported accuracy or implement its full agreement/tonal grammar.

Every assistant request now constructs a common contact trace with observed parts, typed relations, constraints, investigation, action, and recorded outcome. First-person expression candidates use a source-grounded topic from the primary Human Design guide (Part Seven p.101), while the actual clause is observed from user text. No personal gate, trait, or biological consequence is inferred. Failed GitHub saves trigger a connection recheck before another save. This is tested outcome-conditioned routing, not neural training or cross-component learning. The last 100 traces are stored in this browser and inspectable in `/contact-lab`.

The supplied NSNF spec was read through §74. Primary-source excerpts inspected: Ra Uru Hu, *The Complete Guide to the Human Design System* (2008–2012), Part Four pp.50–51 (larynx/articulation) and Part Seven pp.101–102 (Throat/expression). Inspection is limited to these passages and surrounding text, not the entire book. Source claims remain separate from measured behavior; no gate-to-expression predictive rule was invented.

The existing MorphMemoryEngine and MRNN engine were inspected, not replaced. MorphMemoryEngine’s `selfModify` reports changes without applying the corresponding mutations; MRNN uses a five-coordinate B.T.C.G.L schema and manually weighted transitions, rather than the v0.9 complete address or a verified 5×64 learned neural field. Connecting either as if it met v0.9 would overstate the evidence.

No canonical gate/address precision, nine-center emergence, acoustic differentiation, ontology rule, shared learning, or swarm tool assembly is invented or represented as implemented. A microphone transcript does not provide measured prosody or neural-field execution. The previous standalone `/workspace/automata` scheduler is not connected to Synthai2 yet; background builds and deployment remain separate unfinished work.

## Verification

Node 24+:

```bash
node tests/synthia-github.test.mjs
node - <<'JS'
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const filename=path.resolve('client/public/contact-lab/test.js');
vm.runInThisContext('(function(require,__dirname){'+fs.readFileSync(filename,'utf8')+'})',{filename})(require,path.dirname(filename));
JS
```

The wrapper runs the supplied CommonJS test unchanged inside this ES-module repository. Thirteen focused tests cover explicit tool intent, export contents, unsafe paths, failed GitHub calls, atomic commits, fixed AI destinations, relay routing, Shona attribution/uncertainty, contact constraints, and outcome-conditioned rechecks. These tests use mocked HTTP responses; they do not prove live credentials work.

Full `npm run check`, `npm run build`, browser/microphone checks, and a live GitHub save have not been verified in this session because dependency installation did not complete. This remains a draft integration until those checks pass in the complete checkout.

Manual acceptance after deployment: configure and test an AI provider in Settings; send a normal chat message; use Talk and send its transcript; toggle hover; reload and verify shortcuts; connect GitHub in Replit; ask for connection status; save a disposable IDE project; inspect every file in the resulting commit; revoke GitHub access and verify a failure is shown. Verify the contact lab's text round trip separately.
