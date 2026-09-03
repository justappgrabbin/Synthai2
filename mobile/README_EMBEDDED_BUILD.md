# Embedded build acceptance

The phone build is accepted only when:

1. Android starts the embedded Linux residence itself.
2. Node is already present inside both supported rootfs architectures.
3. Server dependencies are already present; first boot never runs a package installer.
4. The Synthai2 app is the served UI inside the Synthia residence.
5. The local server starts on the port supplied by the Android native service.
6. The phone sync worker pulls versioned Synthia updates, verifies SHA-256, persists them locally, and acknowledges only after successful persistence.
7. Phone-originated files persist locally first and can be published upstream when online.
8. The app survives process kill/restart and reconnects without reinstalling dependencies.
9. The APK is signed with the existing Synthia update identity.
