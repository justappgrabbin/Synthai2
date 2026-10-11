import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ArtifactMemory } from '../client/src/engine/ArtifactMemory';
import { ResonanceOrchestrator } from '../client/src/engine/ResonanceOrchestrator';
import { AIService } from '../client/src/lib/AIService';
import { NovelArchitectureGenerator } from '../client/src/engine/NovelArchitectureGenerator';
import { MorphMemoryEngine } from '../client/src/engine/MorphMemoryEngine';

test('exact recovery preserves source bytes including overlapping-chunk boundaries', () => {
  const memory = new ArtifactMemory();
  const source = '  first\r\n' + 'x'.repeat(4500) + '\nlast  ';
  memory.store({ id: 'one', originalName: 'one.ts', originalContent: source, type: 'code',
    userId: 'alice', understanding: { intent: 'same intent' } });
  memory.storeChunks('one', [source.slice(0, 2000), source.slice(1800, 3800), source.slice(3600)]);
  assert.equal(memory.exact('same intent', 'alice', 'one').code, source);
  assert.throws(() => memory.exact('same intent', 'bob', 'one'), /No stored artifact/);
  memory.store({ id: 'two', originalName: 'two.ts', originalContent: '', type: 'code',
    userId: 'alice', understanding: { intent: 'same intent' } });
  assert.throws(() => memory.exact('same intent', 'alice'), /Multiple artifacts/);
  assert.equal(memory.exact('same intent', 'alice', 'two').code, '');
});

test('orchestrator restores a selected artifact and does not claim generated code was verified', async () => {
  const orchestrator = new ResonanceOrchestrator('', false);
  const artifact = { id: 'file', originalName: 'file.ts', originalContent: 'const x = 1;\n',
    type: 'code' as const, userId: 'alice', understanding: { intent: 'example' } };
  orchestrator.storeArtifactUnderstanding(artifact);
  orchestrator.storeCodeChunks('file', [artifact.originalContent]);
  const exact = await orchestrator.regenerateFromMemory('example', undefined, 'exact', 'alice', 'file');
  assert.equal(exact.code, artifact.originalContent);
  assert.equal(exact.usedEntries[0].metadata.artifactId, 'file');
  const original = AIService.sendMessage;
  try {
    AIService.sendMessage = async () => ({ content: '```ts\nconst x = 2;\n```' });
    const improved = await orchestrator.regenerateFromMemory('example', undefined, 'improved', 'alice', 'file');
    assert.equal(improved.code, 'const x = 2;');
    assert.equal(improved.confidence, 0);
    AIService.sendMessage = async () => ({ content: '', error: 'Provider unavailable' });
    await assert.rejects(orchestrator.improviseCode('change it', 'file', 'alice'), /Provider unavailable/);
    const engine = new MorphMemoryEngine(orchestrator);
    await assert.rejects(engine.improvise('change it', undefined, 'alice'), /Provider unavailable/);
    assert.equal(engine.getOperations().at(-1)?.status, 'failed');
  } finally { AIService.sendMessage = original; }
});

test('novel architecture can store metadata without accessing a private routing method', async () => {
  const orchestrator = new ResonanceOrchestrator('', false);
  const generator = new NovelArchitectureGenerator(orchestrator, '');
  const originalFetch = globalThis.fetch;
  const activation = {gate: 1, line: 2, color: 3, tone: 4, base: 1,
    planet: 'Sun', zodiac: 'Aries', house: 1, arcDegree: 12, side: 'conscious'};
  const fixture = { userId: 'trial-user', type: 'Generator', strategy: 'Wait to respond',
    authority: 'Sacral', definedCenters: [4, 6], undefinedCenters: [0, 1, 2, 3, 5, 7, 8],
    consciousGates: [activation], unconsciousGates: [], channels: [], hangingGates: [1],
    incarnationCross: 'test fixture', profile: '3/5', variables: [] };
  globalThis.fetch = async () => Response.json(fixture);
  try {
    await generator.loadHumanDesignChart('trial-user');
    const result = await generator.generateNovelArchitecture('trial-user', 'a small app');
    const entry = orchestrator.getSuperBaseEntries().find(entry => entry.id === result.id);
    assert.ok(entry);
    assert.equal(entry.metadata.userId, 'trial-user');
    assert.equal(entry.metadata.gate, entry.address.node + 1);
    assert.equal(entry.address.line, activation.line);
    assert.equal(entry.address.color, activation.color);
    assert.equal(entry.address.arcDegree, activation.arcDegree);
  } finally { globalThis.fetch = originalFetch; }
});
