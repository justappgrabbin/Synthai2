function diagnoseRun(run) {
  const text = `${run?.stderr || ''}\n${run?.stdout || ''}\n${run?.error || ''}`.toLowerCase();
  const suggestions = [];
  if (text.includes('missing script') || text.includes('npm error')) suggestions.push('package.json exists but the chosen npm script is missing. Try npm run dev, npm run build, or add a start script.');
  if (text.includes('cannot find module')) suggestions.push('A Node dependency is missing. Run npm install in the Morph Entry source folder before running again.');
  if (text.includes('module not found')) suggestions.push('A module/import path is missing or broken. Check package dependencies and local filenames.');
  if (text.includes('enoent')) suggestions.push('The command points to a file/path that does not exist inside the extracted upload.');
  if (text.includes('permission denied')) suggestions.push('A script needs executable permission or should be run through sh script.sh.');
  if (text.includes('timeout')) suggestions.push('The process exceeded the configured timeout. It may be a long-running server; use a foreground-safe command or increase MORPH_EXECUTOR_TIMEOUT_MS.');
  if (!suggestions.length) suggestions.push('No obvious repair pattern found. Check stderr/stdout and confirm the run command matches the uploaded project.');
  return suggestions;
}

module.exports = { diagnoseRun };
