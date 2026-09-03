# Node runtime decision

Do not add a second Node installation path.

The existing Synthia Android launcher/native residence already contains the preferred Node startup mechanism. The embedded-linux birth candidate must reuse that launcher-managed Node runtime and point it at the Synthai2 server payload.

Consequences:
- no Termux backend
- no first-boot package download
- no duplicate Node runtime in the Linux rootfs
- no separate desktop/server prerequisite
- preserve the existing Android launcher/native service and signing identity
- replace only the unfinished app/server payload with Synthai2 plus the current sync wiring

The build should adapt Synthai2 to the launcher's existing port/data-dir contract instead of changing the launcher to match Synthai2.
