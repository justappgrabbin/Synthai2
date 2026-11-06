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
