# Embedded Linux Phone Build Lane

This branch replaces the Termux phone backend with Synthia's existing native Android + embedded Linux residence.

Canonical composition:

- Android package/signing/native residence: existing Synthia v0.4.5 phone APK donor
- App/UI/server source: Synthai2
- Runtime: embedded PRoot Linux residence inside the APK
- Node/npm: preinstalled into both ARM64 and ARM rootfs images at build time
- JS dependencies: prebundled at build time; no first-boot npm install
- Sync/backend: Synthia Supabase sync ledger and binary delivery
- Device identity: dedicated phone sync credential injected only during the private signed build

No Termux, no computer dependency, and no network package installation on first boot.
