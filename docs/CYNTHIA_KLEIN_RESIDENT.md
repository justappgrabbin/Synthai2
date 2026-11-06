# Cynthia Klein resident — original, unchanged

Source repository: https://github.com/justappgrabbin/klein-agent
Pinned source commit: `78ea0e28c70d7a5d4c288279025a493ceccbde5d`

The git submodule `vendor/klein-agent` carries the original trained model and Klein tools, including `run/model.pt` and `run/tokenizer.json`. Source code, weights, and tools are not rewritten by the Computer integration.

To run the source on a Linux/macOS computer with Python 3.12 and Node.js:

```bash
git submodule update --init --recursive
cd vendor/klein-agent
bash setup.sh
bash start.sh
```

The original interface listens on `http://127.0.0.1:7860`. It requires real PyTorch support and has not been packaged into the Android WebView APK. Before any claims of on-device operation, the original checkpoint must be run and checked on the phone or its supported host.

## Start both programs without changing Cynthia

From the Synthai2 repository root on a Linux/macOS host:

```bash
bash scripts/start-with-original-cynthia.sh
```

This checks the pinned model and tokenizer hashes, installs original dependencies if needed, and copies the original repository into `data/cynthia-resident/` on first launch. The trained source checkpoint stays untouched. Cynthia runs from that private working copy at 127.0.0.1:7860; Synthai2 runs on port 5000. Open **Computer → Cynthia Klein**, or **Agent → Cynthia Klein (original)**. Feedback, chat history and optional learning affect the working copy, not the pinned original. No automatic retraining is performed by the bridge.

The launcher prints an owner token for signing in from another device on your network, and saves it in ignored `data/cynthia-resident-owner-token`. Do not publish this token. Exposing the Computer over public HTTP is not recommended; production owner login requires HTTPS for its secure cookie. The original model itself binds only to 127.0.0.1.

The Android build provides the interface only. It does **not** embed the trained Python/PyTorch runtime, and the original model needs an accessible running host. The gateway reports unavailable instead of generating a substitute response.

Original source SHA: `78ea0e28c70d7a5d4c288279025a493ceccbde5d`. This exact donor is pinned as a Git submodule and copied to a separate working directory to make trying it reversible.
