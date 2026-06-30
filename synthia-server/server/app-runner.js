const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const multer = require('multer');
const JSZip = require('jszip');
const { createClient } = require('@supabase/supabase-js');

const APP_DATA_DIR = process.env.APP_DATA_DIR || path.join(process.cwd(), 'data', 'apps');
const SUPABASE_APP_BUCKET = process.env.SUPABASE_APP_BUCKET || 'synthia-apps';
const MAX_OUTPUT = Number(process.env.APP_RUNNER_MAX_OUTPUT || 120000);
const TIMEOUT_MS = Number(process.env.APP_RUNNER_TIMEOUT_MS || 120000);

function supabaseStorage() {
  const url = process.env.SUPABASE_PRIMARY_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PRIMARY_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key).storage.from(SUPABASE_APP_BUCKET);
}

function safeName(value) {
  return String(value || 'uploaded-app')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'uploaded-app';
}

function appId(name) {
  return `${safeName(name)}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function resolveAppPath(id) {
  const target = path.resolve(APP_DATA_DIR, id);
  const root = path.resolve(APP_DATA_DIR);
  if (!target.startsWith(root)) throw new Error('invalid_app_path');
  return target;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function writeJson(file, value) {
  await ensureDir(path.dirname(file));
  await fsp.writeFile(file, JSON.stringify(value, null, 2));
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function listFiles(dir, base = dir, acc = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '__pycache__', '.venv', 'venv'].includes(entry.name)) {
        await listFiles(full, base, acc);
      }
    } else {
      acc.push(rel);
    }
  }
  return acc.slice(0, 500);
}

async function extractZip(buffer, destination) {
  const zip = await JSZip.loadAsync(buffer);
  const extracted = [];
  const writes = [];

  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    const normalized = relativePath.replace(/\\/g, '/');
    if (normalized.includes('../') || normalized.startsWith('/')) return;
    writes.push((async () => {
      const target = path.resolve(destination, normalized);
      if (!target.startsWith(path.resolve(destination))) return;
      await ensureDir(path.dirname(target));
      await fsp.writeFile(target, await file.async('nodebuffer'));
      extracted.push(normalized);
    })());
  });

  await Promise.all(writes);
  return extracted;
}

async function detectRunCommand(appPath) {
  const files = await listFiles(appPath);
  const packagePath = path.join(appPath, 'package.json');

  if (fs.existsSync(packagePath)) {
    const pkg = await readJson(packagePath, {});
    if (pkg.scripts?.start) return 'npm start';
    if (pkg.scripts?.dev) return 'npm run dev -- --host 0.0.0.0';
    if (pkg.scripts?.build) return 'npm run build';
    return 'npm install';
  }

  const html = files.find((file) => file.toLowerCase().endsWith('.html'));
  if (html) return `node -e "console.log('Static HTML app uploaded: ${html}')"`;

  const py = files.find((file) => file.toLowerCase().endsWith('.py'));
  if (py) return `python ${JSON.stringify(py)}`;

  const js = files.find((file) => file.toLowerCase().endsWith('.js'));
  if (js) return `node ${JSON.stringify(js)}`;

  const sh = files.find((file) => file.toLowerCase().endsWith('.sh'));
  if (sh) return `sh ${JSON.stringify(sh)}`;

  return 'ls -la';
}

function runCommand(appPath, command) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    exec(command, {
      cwd: appPath,
      env: process.env,
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_OUTPUT,
      shell: true,
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        command,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        stdout: String(stdout || '').slice(-MAX_OUTPUT),
        stderr: String(stderr || '').slice(-MAX_OUTPUT),
        error: error ? error.message : null,
        code: error && typeof error.code !== 'undefined' ? error.code : 0,
      });
    });
  });
}

async function summarize(id) {
  const dir = resolveAppPath(id);
  const manifest = await readJson(path.join(dir, '.synthia-app.json'), { id });
  const files = await listFiles(dir);
  return { ...manifest, files, file_count: files.length };
}

function attachAppRunner(app) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 250 * 1024 * 1024, files: 100 } });
  const storage = supabaseStorage();

  async function mirrorToSupabase(id, relativePath, buffer, contentType) {
    if (!storage) return null;
    const objectPath = `${id}/${relativePath}`.replace(/\\/g, '/');
    const { error } = await storage.upload(objectPath, buffer, {
      upsert: true,
      contentType: contentType || 'application/octet-stream',
    });
    return error ? { path: objectPath, error: error.message } : { path: objectPath, ok: true };
  }

  app.get('/api/apps', async (_req, res) => {
    await ensureDir(APP_DATA_DIR);
    const ids = (await fsp.readdir(APP_DATA_DIR, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    res.json({ ok: true, apps: await Promise.all(ids.map(summarize)) });
  });

  app.post('/api/apps/upload', upload.array('files', 100), async (req, res) => {
    await ensureDir(APP_DATA_DIR);
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ ok: false, error: 'files_required' });

    const name = safeName(req.body?.name || files[0].originalname.replace(/\.[^.]+$/, ''));
    const id = appId(name);
    const dir = resolveAppPath(id);
    await ensureDir(dir);
    const storage_results = [];

    for (const file of files) {
      if (file.originalname.toLowerCase().endsWith('.zip')) {
        const extracted = await extractZip(file.buffer, dir);
        storage_results.push(await mirrorToSupabase(id, file.originalname, file.buffer, file.mimetype));
        for (const relative of extracted) {
          const extractedBuffer = await fsp.readFile(path.join(dir, relative));
          storage_results.push(await mirrorToSupabase(id, relative, extractedBuffer, 'application/octet-stream'));
        }
      } else {
        const relative = String(file.originalname || file.fieldname).replace(/\\/g, '/').replace(/^\/+/, '');
        if (relative.includes('../')) continue;
        const target = path.resolve(dir, relative);
        if (!target.startsWith(dir)) continue;
        await ensureDir(path.dirname(target));
        await fsp.writeFile(target, file.buffer);
        storage_results.push(await mirrorToSupabase(id, relative, file.buffer, file.mimetype));
      }
    }

    const run_command = req.body?.run_command || await detectRunCommand(dir);
    const manifest = {
      id,
      name,
      run_command,
      status: 'uploaded',
      storage: storage ? { provider: 'supabase', bucket: SUPABASE_APP_BUCKET } : { provider: 'local' },
      storage_results: storage_results.filter(Boolean),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await writeJson(path.join(dir, '.synthia-app.json'), manifest);
    res.json({ ok: true, app: await summarize(id) });
  });

  app.post('/api/apps/:id/run', async (req, res) => {
    const dir = resolveAppPath(req.params.id);
    if (!fs.existsSync(dir)) return res.status(404).json({ ok: false, error: 'app_not_found' });
    const manifestFile = path.join(dir, '.synthia-app.json');
    const manifest = await readJson(manifestFile, { id: req.params.id });
    const command = String(req.body?.command || manifest.run_command || await detectRunCommand(dir)).trim();
    const result = await runCommand(dir, command);
    const run = { ...result, id: `run-${Date.now()}` };
    const runs = await readJson(path.join(dir, '.synthia-runs.json'), []);
    runs.unshift(run);
    await writeJson(path.join(dir, '.synthia-runs.json'), runs.slice(0, 50));
    await writeJson(manifestFile, { ...manifest, run_command: command, status: result.ok ? 'ran' : 'error', updated_at: new Date().toISOString() });
    res.json({ ok: result.ok, run, app: await summarize(req.params.id) });
  });

  app.get('/api/apps/:id/runs', async (req, res) => {
    const dir = resolveAppPath(req.params.id);
    if (!fs.existsSync(dir)) return res.status(404).json({ ok: false, error: 'app_not_found' });
    res.json({ ok: true, runs: await readJson(path.join(dir, '.synthia-runs.json'), []) });
  });

  app.delete('/api/apps/:id', async (req, res) => {
    const dir = resolveAppPath(req.params.id);
    if (!fs.existsSync(dir)) return res.status(404).json({ ok: false, error: 'app_not_found' });
    await fsp.rm(dir, { recursive: true, force: true });
    res.json({ ok: true, deleted: req.params.id });
  });
}

module.exports = attachAppRunner;
