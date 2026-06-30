const crypto = require('crypto');
const path = require('path');
const { extOf } = require('./MorphUtils');

function classifyFiles(files) {
  const lower = files.map((file) => file.toLowerCase());
  const hasPackage = lower.includes('package.json') || lower.some((file) => file.endsWith('/package.json'));
  const hasHtml = lower.some((file) => file.endsWith('.html'));
  const hasPython = lower.some((file) => file.endsWith('.py'));
  const hasJs = lower.some((file) => file.endsWith('.js') || file.endsWith('.mjs'));
  const hasShell = lower.some((file) => file.endsWith('.sh'));
  const doc = lower.find((file) => ['pdf', 'docx', 'xlsx', 'csv', 'json', 'md', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav'].includes(extOf(file)));

  if (hasPackage) return { type: 'node-app', executable: true, reason: 'package.json detected' };
  if (hasPython) return { type: 'python-script', executable: true, reason: 'python file detected' };
  if (hasJs) return { type: 'node-script', executable: true, reason: 'javascript file detected' };
  if (hasShell) return { type: 'shell-script', executable: true, reason: 'shell script detected' };
  if (hasHtml) return { type: 'static-html', executable: false, wrapped: true, reason: 'html viewer wrapper generated' };
  if (doc) return { type: `${extOf(doc) || 'document'}-artifact`, executable: false, wrapped: true, reason: `${extOf(doc)} artifact wrapper generated` };
  return { type: 'stored-artifact', executable: false, wrapped: true, reason: 'generic file wrapper generated' };
}

function detectRunCommand(files) {
  const lowerMap = new Map(files.map((file) => [file.toLowerCase(), file]));
  const packageFile = files.find((file) => file.toLowerCase() === 'package.json' || file.toLowerCase().endsWith('/package.json'));
  if (packageFile) {
    // package.json may live in a nested extracted project. Execute in source root; npm will only work when package.json is at root.
    return packageFile.toLowerCase() === 'package.json' ? 'npm start' : `cd ${JSON.stringify(path.dirname(packageFile))} && npm start`;
  }
  const py = files.find((file) => file.toLowerCase().endsWith('.py'));
  if (py) return `python ${JSON.stringify(py)}`;
  const js = files.find((file) => file.toLowerCase().endsWith('.js') || file.toLowerCase().endsWith('.mjs'));
  if (js) return `node ${JSON.stringify(js)}`;
  const sh = files.find((file) => file.toLowerCase().endsWith('.sh'));
  if (sh) return `sh ${JSON.stringify(sh)}`;
  if (lowerMap.has('index.html')) return 'node wrapper/server.js';
  return 'node wrapper/server.js';
}

function addressFor(entryName, classification, files) {
  const signature = crypto.createHash('sha1').update(`${entryName}:${classification.type}:${files.join('|')}`).digest('hex').slice(0, 12);
  const domain = classification.executable ? 'runtime' : 'archive';
  const layer = classification.wrapped ? 'wrapped' : 'native';
  return `${domain}/${layer}/${classification.type}/${signature}`;
}

function makeMorphEntry({ id, name, sourcePath, wrapperPath, files, icon = '🧬', runCommand }) {
  const classification = classifyFiles(files);
  const command = runCommand || detectRunCommand(files);
  return {
    id,
    name,
    sourcePath,
    wrapperPath: wrapperPath || null,
    type: classification.type,
    executable: Boolean(classification.executable || wrapperPath),
    nativeExecutable: Boolean(classification.executable),
    wrapped: Boolean(wrapperPath || classification.wrapped),
    runCommand: command,
    address: addressFor(name, classification, files),
    icon,
    status: 'mounted',
    reason: classification.reason,
    file_count: files.length,
    files: files.slice(0, 120),
    logs: [],
  };
}

module.exports = { classifyFiles, detectRunCommand, addressFor, makeMorphEntry };
