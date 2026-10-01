#!/usr/bin/env node
import { ACTIONS, POLICY, resolveActions } from "./actions.js";

const args = process.argv.slice(2);
const requested = args[0] === "run" ? args.slice(1) : args;

if (!requested.length || requested.includes("--help") || requested.includes("-h")) {
  console.log(`
SynthAI Actions

  synthai finish
  synthai monetize
  synthai advertise
  synthai test
  synthai package
  synthai deploy
  synthai audit
  synthai status
  synthai launch
  synthai run finish monetize advertise

Policy: originals are read-only; work happens on copies/branches.
Publishing and external spend require explicit approval.
`.trim());
  process.exit(0);
}

const actions = resolveActions(requested);
console.log(JSON.stringify({
  command: "synthai",
  actions: actions.map((name) => ACTIONS[name]),
  policy: POLICY,
  state: "planned",
  message: "Action plan resolved. Execution adapters may now perform each step against authorized sources.",
}, null, 2));
