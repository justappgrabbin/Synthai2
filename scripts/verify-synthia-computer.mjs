// Non-destructive Synthia computer integration smoke test.
// Run against an already-started local Synthia server:
// SYNTHIA_BASE_URL=http://127.0.0.1:5000 node scripts/verify-synthia-computer.mjs
const base = process.env.SYNTHIA_BASE_URL || 'http://127.0.0.1:5000';
const endpoints = [
  ['/api/container/status', 'terminal runtime'],
  ['/api/workspace/status', 'persistent workspace'],
  ['/api/workspace/files', 'file manager'],
  ['/api/apps', 'application registry'],
  ['/api/mesh/status', 'event mesh'],
  ['/api/python/status', 'Python service'],
];
let failures = 0;
for (const [path, capability] of endpoints) {
  try {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(5000) });
    const body = await response.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = null; }
    const ok = response.ok && parsed !== null;
    console.log(JSON.stringify({ capability, path, httpStatus: response.status, result: ok ? 'reachable' : 'FAIL', sample: body.slice(0, 160) }));
    if (!ok) failures++;
  } catch (error) {
    failures++;
    console.log(JSON.stringify({ capability, path, result: 'FAIL', error: String(error) }));
  }
}
console.log(JSON.stringify({ checks: endpoints.length, failed: failures, note: 'Reachability only. Does not verify execution, persistence, safety, or recovery.' }));
if (failures) process.exitCode = 1;
