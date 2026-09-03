# Existing launcher contract

The Synthai2 server must be made compatible with the existing Synthia Android launcher/native service rather than introducing a new runtime.

Required behavior:
- honor `PORT` from the launcher/native residence
- honor `DATA_DIR` for persistent Synthia state
- serve the built Synthai2 client from the same local server
- start without downloading Node or npm packages
- keep all runtime dependencies bundled at build time
- allow the Android launcher to own start/restart lifecycle

This replaces the prior Termux/port-5000 assumption for the phone build lane.
