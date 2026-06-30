const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const { getEntry, upsertEntry } = require('./MorphRegistry');
const { diagnoseRun } = require('./MorphRepair');
const { readJson, writeJson, ensureDir } = require('./MorphUtils');

const MAX_OUTPUT = Number(process.env.MORPH_EXECUTOR_MAX_OUTPUT || 120000);
const TIMEOUT_MS = Number(process.env.MORPH_EXECUTOR_TIMEOUT_MS || 120000);

function runCommand(cwd, command) {
  return new Promise((resolve) => {
    const started_at = new Date().toISOString();
    exec(command, { cwd, env: process.env, shell: true, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT }, (error, stdout, stderr) => {
      const run = {
        id: `morph-run-${Date.now()}`,
        ok: !error,
        command,
        cwd,
        started_at,
        finished_at: new Date().toISOString(),
        stdout: String(stdout || '').slice(-MAX_OUTPUT),
        stderr: String(stderr || '').slice(-MAX_OUTPUT),
        error: error ? error.message : null,
        code: error && typeof error.code !== 'undefined' ? error.code : 0,
      };
      run.repair = diagnoseRun(run);
      resolve(run);
    });
  });
}

async function runMorph(id, overrideCommand) {
  const entry = await getEntry(id);
  if (!entry) throw new Error('morph_not_found');
  const cwd = entry.nativeExecutable ? entry.sourcePath : entry.wrapperPath;
  if (!cwd || !fs.existsSync(cwd)) throw new Error('morph_path_missing');
  const command = String(overrideCommand || entry.runCommand || (entry.nativeExecutable ? 'npm start' : 'node server.js')).trim();
  const run = await runCommand(cwd, command);
  const runsFile = path.join(entry.sourcePath, '.morph-runs.json');
  await ensureDir(path.dirname(runsFile));
  const runs = await readJson(runsFile, []);
  runs.unshift(run);
  await writeJson(runsFile, runs.slice(0, 50));
  const updated = await upsertEntry({
    ...entry,
    runCommand: command,
    status: run.ok ? 'ran' : 'error',
    last_run: run,
    logs: runs.slice(0, 10),
  });
  return { entry: updated, run };
}

async function getRuns(id) {
  const entry = await getEntry(id);
  if (!entry) throw new Error('morph_not_found');
  return readJson(path.join(entry.sourcePath, '.morph-runs.json'), []);
}

module.exports = { runMorph, getRuns };
