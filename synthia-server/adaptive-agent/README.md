# SynthAi2 Adaptive Builder bridge

The original user-supplied repaired Adaptive Agent is preserved **unaltered**
in source.zip (including its tests and original-upload.zip). bridge.py
extracts only its six Python modules and runs its existing
observe → analyze → evaluate → select → execute → feedback cycle.

This first integration is intentionally scoped to **actual non-destructive
build verification** of the existing SynthAi2 computer: inspect project
scripts → npm run check → npm run build. It logs real outputs and stops
on a failed check. It does **not** yet write code or control Android apps.
Automatic code repair requires a separately connected, permission-scoped
Hands coding executor. The UI says this explicitly.

## Android/Termux
The existing mobile/termux-bootstrap.sh installs Python and Node.
The existing APK connects to http://127.0.0.1:5000 while Termux hosts
the backend. Updating the APK alone does not embed a Python runtime.
Backend start/stop is loopback-only so remote visitors cannot run builds.

## Privacy
"Observe navigation" is OFF by default and only publishes SynthAi2 route
changes to its existing local mesh event log. No text inputs, Android
accessibility events, camera, microphone or screen recording.

## Tests
Extract source.zip and run the included unittest suite.
Run bridge.py in a local checkout with --project-root and --workspace.
Without --execute the original agent only simulates actions.
