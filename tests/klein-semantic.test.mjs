import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeKleinContact } from '../client/src/lib/klein/semanticContact.mjs';
import { AutoLingMemory } from '../client/src/lib/klein/vendor/klein-tools.mjs';

test('supplied AutoLing recognizes a real rule and rejects unmatched text', () => {
  const result = analyzeKleinContact('tool belongs to workspace');
  assert.equal(result.autoling.matches[0].relation, 'PART_OF');
  assert.equal(result.autoling.matches[0].bindings.$whole, 'workspace');
  assert.equal(analyzeKleinContact('What do I do now?').autoling.semanticStatus, 'unresolved');
});
test('DISEMINER uses user context without carrying it into another conversation', () => {
  const withContext = analyzeKleinContact('tool', ['tool builds app', 'system builds app']);
  const isolated = analyzeKleinContact('tool');
  assert.equal(withContext.diseminer.documentCount, 3);
  assert.ok(withContext.diseminer.neighbors[0].neighbors.some(item => item.term === 'system'));
  assert.deepEqual(isolated.diseminer.neighbors[0].neighbors, []);
});
test('Unicode text survives the supplied memory tokenizer', () => {
  const result = analyzeKleinContact('mwana école 日本語');
  assert.deepEqual(result.diseminer.neighbors.map(item => item.term), ['mwana', 'école', '日本語']);
});
test('grammar generation substitutes exact variables and preserves literal dollar text', () => {
  const memory = new AutoLingMemory();
  memory.learn({relation:'PAIR',pattern:['$a','$ab'],template:'$a then $ab'});
  assert.equal(memory.generate('PAIR', ['$&', 'second']).surface, '$& then second');
  assert.equal(memory.generate('PAIR', ['first']).ok, false);
});
test('malformed rules and unbound template variables cannot be learned', () => {
  const memory = new AutoLingMemory();
  assert.throws(() => memory.learn({relation:'BAD',pattern:[7],template:'x'}), /Rule requires/);
  assert.throws(() => memory.learn({relation:'BAD',pattern:['$a'],template:'$missing'}), /absent/);
  assert.throws(() => memory.learn({relation:'BAD',pattern:['$a'],template:'$a',arity:2}), /Arity/);
});
