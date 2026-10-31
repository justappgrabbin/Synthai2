import test from "node:test";
import assert from "node:assert/strict";
import { chartToMorphDesign } from "../client/src/lib/humanDesignMorphBridge.ts";

const chart = {
  summary: { type:"Manifesting Generator", strategy:"Wait to Respond, then Inform", authority:"Sacral", profile:"3/5", crossGates:[6,36,11,12] },
  centers: { defined:["head","sacral","root"], undefined:["ajna","throat","g","heart","solar","spleen"] },
  gates: [6, 11, 12, 36],
  channels: [{ gates:[6, 36], name:"Sample" }],
  variables: {
    determination: {name:"Appetite"},
    environment: {name:"Kitchens"},
    perspective: {name:"Possibility"},
    motivation: {name:"Hope"},
  },
};
test("preserves all field values that exist in Morph's real HumanDesign contract", () => {
  const m = chartToMorphDesign(chart);
  assert.equal(m.type, "Manifesting Generator");
  assert.equal(m.strategy, chart.summary.strategy);
  assert.deepEqual(m.profile, [3, 5]);
  assert.deepEqual(m.definedCenters, [0, 5, 8]); // existing Morph ordering
  assert.deepEqual(m.undefinedCenters, [1, 2, 3, 4, 6, 7]);
  assert.deepEqual(m.gates, chart.gates);
  assert.deepEqual(m.channels, [[6, 36]]);
  assert.equal(m.incarnationCross, "Cross gates: 6/36/11/12");
  assert.deepEqual(m.variables, {digestion:"Appetite",environment:"Kitchens",awareness:"Possibility",motivation:"Hope"});
});
test("does not invent undefined types, profiles or incarnation cross names", () => {
  assert.throws(() => chartToMorphDesign({...chart, summary:{...chart.summary,type:"Unknown"}}), /chart type/);
  assert.throws(() => chartToMorphDesign({...chart, summary:{...chart.summary,profile:"bad"}}), /profile/);
  assert.throws(() => chartToMorphDesign({...chart, summary:{...chart.summary,crossGates:[6]}}), /four/);
  assert.throws(() => chartToMorphDesign({...chart, centers:{...chart.centers,defined:["unspecified"]}}), /Unrecognized/);
});
test("does not mutate the chart stored by Human Design Studio", () => {
  const original = JSON.stringify(chart);
  const mapped = chartToMorphDesign(chart);
  mapped.gates.push(99);
  mapped.channels[0][0] = 1;
  assert.equal(JSON.stringify(chart), original);
});
