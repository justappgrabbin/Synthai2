import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('Android build is real PRoot Linux Computer instead of Capacitor web shell',()=>{
  const workflow=read('.github/workflows/build-android-apk.yml');
  assert.match(workflow,/docker buildx build --platform linux\/arm64/);
  assert.match(workflow,/linux-rootfs\.bundle/);
  assert.match(workflow,/libproot\.so/);
  assert.doesNotMatch(workflow,/npx cap sync|cap add android/);
  assert.match(workflow,/Trained original Cynthia Klein/);
});
test('Native Activity waits for actual 4-service backend verification',()=>{
  const linux=read('android-linux/app/src/main/java/com/synthai/youniverse/LinuxContainer.java');
  for(const name of ['/api/health','/api/cynthia-resident/status','8001/health','10000/health'])assert.ok(linux.includes(name),name);
  assert.match(linux,/startAndVerify/);
  const activity=read('android-linux/app/src/main/java/com/synthai/youniverse/MainActivity.java');
  assert.match(activity,/ComputerBackendService\.isReady/);
  assert.match(activity,/127\.0\.0\.1:5000/);
});
test('Original weights are hashed, copied before feedback, and never rebuilt',()=>{
  const docker=read('android-linux/linux/Dockerfile');
  const guest=read('android-linux/guest/start.mjs');
  assert.match(docker,/vendor\/klein-agent/);
  assert.match(docker,/sha256sum -c/);
  assert.match(guest,/cynthia-working-copy/);
  assert.match(guest,/expectedModel/);
  assert.doesNotMatch(guest,/train_feedback|torch\.save/);
});
test('Guest Express binds only loopback in native phone mode',()=>{
  assert.match(read('server/index.ts'),/SYNTHIA_PHONE_CONTAINER === "1" \? "127\.0\.0\.1"/);
});
