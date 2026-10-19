// Run: npx -y tsx --test tests/verified-wheel.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { longitudeToGateVerified, faganBradleyAyanamsa, FB_FIXTURES, WHEEL_FROM_41, GATE_41_START } from '../shared/verified-wheel';
import { longitudeToGate } from '../shared/transit-system';

test('anchors', () => {
  assert.equal(longitudeToGateVerified(302).address, '41.1.1.1.1');
  assert.equal(longitudeToGateVerified(358.25).gate, 25);
  assert.equal(longitudeToGateVerified(10).gate, 21);
});

const TABLE = '/workspace/research/calc/gate_table.md';
test('all 64 starts match verified table', { skip: !existsSync(TABLE) }, () => {
  const rows = readFileSync(TABLE, 'utf8').split('\n').filter((l) => /^\| \d+ \| \*\*/.test(l));
  assert.equal(rows.length, 64);
  for (const r of rows) {
    const c = r.split('|').map((s) => s.trim());
    assert.equal(longitudeToGateVerified(Number(c[3]) + 1e-6).gate, Number(c[2].replace(/\*/g, '')));
  }
});

test('same order as her client humanDesignEngine.ts GATE_ORDER', () => {
  const src = readFileSync(new URL('../client/src/lib/humanDesignEngine.ts', import.meta.url), 'utf8');
  const m = src.match(/const GATE_ORDER = \[([\s\S]*?)\]/)!;
  const order = m[1].split(',').map((s) => Number(s.trim())).filter(Boolean);
  const k = order.indexOf(41);
  assert.deepEqual([...order.slice(k), ...order.slice(0, k)], [...WHEEL_FROM_41]);
  assert.match(src, /GATE_OFFSET = 358\.25/);
});

test('fagan-bradley fixtures', () => {
  for (const [jd, v] of FB_FIXTURES) assert.ok(Math.abs(faganBradleyAyanamsa(jd) - v) < 1e-9);
});

test('documents the flag: existing shared longitudeToGate disagrees', () => {
  let differ = 0;
  for (let i = 0; i < 64; i++) {
    const mid = (GATE_41_START + i * 5.625 + 2.8125) % 360;
    if (longitudeToGate(mid).gate !== longitudeToGateVerified(mid).gate) differ++;
  }
  assert.ok(differ >= 60, `only ${differ} differ`);
  console.log(`  existing shared longitudeToGate differs at ${differ}/64 gate midpoints`);
});
