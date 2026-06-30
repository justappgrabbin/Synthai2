const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const MORPH_DATA_DIR = process.env.MORPH_DATA_DIR || path.join(process.cwd(), 'data', 'morphs');
const SOURCE_DIR = path.join(MORPH_DATA_DIR, 'sources');
const WRAPPER_DIR = path.join(MORPH_DATA_DIR, 'wrappers');
const REGISTRY_FILE = path.join(MORPH_DATA_DIR, 'registry.json');

function safeName(value, fallback = 'morph') {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || fallback;
}

function morphId(name) {
  return `${safeName(name)}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await ensureDir(path.dirname(file));
  await fsp.writeFile(file, JSON.stringify(value, null, 2));
}

function assertInside(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (!resolvedTarget.startsWith(resolvedRoot)) throw new Error('path_escape_blocked');
  return resolvedTarget;
}

async function listFiles(dir, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build'].includes(entry.name)) {
        await listFiles(full, base, acc);
      }
    } else {
      acc.push(rel);
    }
  }
  return acc.slice(0, 1000);
}

function extOf(file) {
  return path.extname(file || '').replace('.', '').toLowerCase();
}

module.exports = {
  MORPH_DATA_DIR,
  SOURCE_DIR,
  WRAPPER_DIR,
  REGISTRY_FILE,
  safeName,
  morphId,
  ensureDir,
  readJson,
  writeJson,
  assertInside,
  listFiles,
  extOf,
};
