const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const multer = require('multer');
const JSZip = require('jszip');
const { SOURCE_DIR, WRAPPER_DIR, ensureDir, assertInside, morphId, safeName, listFiles } = require('./MorphUtils');
const { makeMorphEntry, classifyFiles } = require('./MorphEntry');
const { generateWrapper } = require('./MorphWrapperFactory');
const { listEntries, getEntry, upsertEntry, deleteEntry } = require('./MorphRegistry');
const { runMorph, getRuns } = require('./MorphExecutor');

async function extractZip(buffer, destination) {
  const zip = await JSZip.loadAsync(buffer);
  const extracted = [];
  const writes = [];
  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized || normalized.includes('../')) return;
    writes.push((async () => {
      const target = assertInside(destination, path.join(destination, normalized));
      await ensureDir(path.dirname(target));
      await fsp.writeFile(target, await file.async('nodebuffer'));
      extracted.push(normalized);
    })());
  });
  await Promise.all(writes);
  return extracted;
}

async function writeUploadFiles(files, sourcePath) {
  const uploaded = [];
  for (const file of files) {
    const original = String(file.originalname || file.fieldname || 'upload.bin').replace(/\\/g, '/').replace(/^\/+/, '');
    if (original.toLowerCase().endsWith('.zip')) {
      const zipFolder = sourcePath;
      const extracted = await extractZip(file.buffer, zipFolder);
      uploaded.push(...extracted);
      continue;
    }
    if (!original || original.includes('../')) continue;
    const target = assertInside(sourcePath, path.join(sourcePath, original));
    await ensureDir(path.dirname(target));
    await fsp.writeFile(target, file.buffer);
    uploaded.push(original);
  }
  return uploaded;
}

function attachMorphEntryRoutes(app) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 250 * 1024 * 1024, files: 100 } });

  app.get('/api/morph/status', async (_req, res) => {
    await ensureDir(SOURCE_DIR);
    await ensureDir(WRAPPER_DIR);
    const entries = await listEntries();
    res.json({ ok: true, service: 'morph-entry', entries: entries.length, source_dir: SOURCE_DIR, wrapper_dir: WRAPPER_DIR });
  });

  app.get('/api/morph', async (_req, res) => {
    res.json({ ok: true, morphs: await listEntries() });
  });

  app.post('/api/morph/upload', upload.array('files', 100), async (req, res) => {
    try {
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ ok: false, error: 'files_required' });
      await ensureDir(SOURCE_DIR);
      await ensureDir(WRAPPER_DIR);

      const name = safeName(req.body?.name || files[0].originalname.replace(/\.[^.]+$/, ''), 'morph-entry');
      const id = morphId(name);
      const sourcePath = path.join(SOURCE_DIR, id);
      const wrapperPath = path.join(WRAPPER_DIR, id);
      await ensureDir(sourcePath);
      await writeUploadFiles(files, sourcePath);
      const sourceFiles = await listFiles(sourcePath);
      const classification = classifyFiles(sourceFiles);

      let finalWrapperPath = null;
      let wrapper = null;
      if (!classification.executable || req.body?.force_wrapper === 'true') {
        wrapper = await generateWrapper({ entryId: id, name, sourcePath, wrapperPath });
        finalWrapperPath = wrapperPath;
      }

      const entry = makeMorphEntry({
        id,
        name,
        sourcePath,
        wrapperPath: finalWrapperPath,
        files: sourceFiles,
        runCommand: req.body?.run_command || null,
        icon: req.body?.icon || '🧬',
      });
      entry.wrapper = wrapper;
      entry.mount = {
        tray: true,
        label: name,
        icon: entry.icon,
        open_url: finalWrapperPath ? `/api/morph/${encodeURIComponent(id)}/open` : null,
      };

      const saved = await upsertEntry(entry);
      res.json({ ok: true, morph: saved });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/morph/:id', async (req, res) => {
    const entry = await getEntry(req.params.id);
    if (!entry) return res.status(404).json({ ok: false, error: 'morph_not_found' });
    res.json({ ok: true, morph: entry });
  });

  app.post('/api/morph/:id/run', async (req, res) => {
    try {
      const result = await runMorph(req.params.id, req.body?.command);
      res.json({ ok: result.run.ok, ...result });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/morph/:id/runs', async (req, res) => {
    try {
      res.json({ ok: true, runs: await getRuns(req.params.id) });
    } catch (error) {
      res.status(404).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/morph/:id/open', async (req, res) => {
    const entry = await getEntry(req.params.id);
    if (!entry || !entry.wrapperPath) return res.status(404).send('Morph wrapper not found');
    const indexFile = path.join(entry.wrapperPath, 'index.html');
    if (!fs.existsSync(indexFile)) return res.status(404).send('Morph wrapper index missing');
    res.sendFile(indexFile);
  });

  app.get('/api/morph/:id/source/*', async (req, res) => {
    const entry = await getEntry(req.params.id);
    if (!entry) return res.status(404).send('Morph not found');
    const relative = req.params[0] || '';
    try {
      const target = assertInside(entry.sourcePath, path.join(entry.sourcePath, relative));
      if (!fs.existsSync(target)) return res.status(404).send('Source file not found');
      res.sendFile(target);
    } catch (error) {
      res.status(400).send(error.message);
    }
  });

  app.delete('/api/morph/:id', async (req, res) => {
    const entry = await getEntry(req.params.id);
    if (!entry) return res.status(404).json({ ok: false, error: 'morph_not_found' });
    await fsp.rm(entry.sourcePath, { recursive: true, force: true });
    if (entry.wrapperPath) await fsp.rm(entry.wrapperPath, { recursive: true, force: true });
    await deleteEntry(req.params.id);
    res.json({ ok: true, deleted: req.params.id });
  });
}

module.exports = attachMorphEntryRoutes;
