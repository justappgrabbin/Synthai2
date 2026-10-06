# Your computer app hub

This adds the supplied Web Linux desktop as a runnable app inside SynthAI2:
**Your Computer** on the Dashboard, or `/computer-desktop`.
The compiled JavaScript, CSS, and wallpaper files are included in
`client/public/computer`; the launcher does not require users to write JSON.

Phones and larger screens both retain the supplied Web Linux desktop,
Activities launcher and dock. Phones support single-tap icons and fitted windows. The hub launches the existing
SynthAI2 routes as well as the bundled Synthia phone interface.

Dashboard **Background** selects the supplied Web Linux background, Night, or
an uploaded image. Existing **Edit** controls still arrange the tray and widgets.
Inside Your Computer, **System Settings → Background / Appearance** customizes
its wallpaper, theme and accent; icons and pinned dock apps remain customizable.
Preferences save on the device. No host operating-system settings are changed.

Human-readable analysis summaries replace raw structured-data displays in the
bundled phone interface. Internal machine records preserve evidence and approval
fingerprints. Training, local model jobs, and GitHub publication use the separately
configured local service; a hosted iframe alone does not start a local CPU worker.

The desktop source and its browser smoke test live in
`justappgrabbin/Stellarproximology-lab` on the reviewed evolution branch under
`computer-app/`. Rebuild with Node 22 (`npm ci --ignore-scripts`, `npm run build`)
and copy its `dist/` into `client/public/computer`. The source archive was provided
at https://drive.google.com/file/d/1QBds9DdhQGfjbl4JgXOAtWKk3vrUTiGC/view.

This draft does not merge or deploy either repository. The existing installed
Human Design route and its chart storage are preserved. Private Drive source
corpus, personal charts, credentials, training data and model weights are not
committed to this public repository.
