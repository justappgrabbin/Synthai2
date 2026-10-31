# Android bundled-start repair (SynthAi2)

Android now opens the **bundled Vite/Capacitor application**, without forcing
WebView to load localhost:5000. This fixes the blank/unavailable startup
when there is no local web server.

The IDE Terminal is an existing component. Its offline mode now operates on
the REAL persistent IDE project files using the existing FileSystem class.
Use **start app** inside that terminal to load the current IDE project into
the existing preview panel. Real OS commands continue to flow through the
existing /api/container/exec bridge **only** if the bridge reports enabled.
No simulated filesystem/process/network output is produced.

## Scope / still needed
- An Android native Node/Python execution host is **not included** in this
  patch. Android WebView does not provide OS-level process execution.
- Server-backed functions require an actual backend; booting the UI is not
  equivalent to running the server.
- The adaptive builder's Python backend is unchanged.
- This patch does not introduce a new computer, OS, or task management layer.
- Do not claim that native app builds, long-running background work, or
  arbitrary shell execution work offline until those capabilities are shipped
  and tested with the Android native runtime.
