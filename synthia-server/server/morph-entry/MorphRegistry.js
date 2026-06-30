const { REGISTRY_FILE, ensureDir, readJson, writeJson, MORPH_DATA_DIR } = require('./MorphUtils');

async function loadRegistry() {
  await ensureDir(MORPH_DATA_DIR);
  const registry = await readJson(REGISTRY_FILE, { version: 1, entries: [] });
  if (!Array.isArray(registry.entries)) registry.entries = [];
  return registry;
}

async function saveRegistry(registry) {
  registry.updated_at = new Date().toISOString();
  await writeJson(REGISTRY_FILE, registry);
  return registry;
}

async function listEntries() {
  const registry = await loadRegistry();
  return registry.entries.sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
}

async function getEntry(id) {
  const entries = await listEntries();
  return entries.find((entry) => entry.id === id) || null;
}

async function upsertEntry(entry) {
  const registry = await loadRegistry();
  const now = new Date().toISOString();
  const next = { ...entry, updated_at: now, created_at: entry.created_at || now };
  const index = registry.entries.findIndex((existing) => existing.id === entry.id);
  if (index >= 0) registry.entries[index] = { ...registry.entries[index], ...next };
  else registry.entries.unshift(next);
  await saveRegistry(registry);
  return next;
}

async function deleteEntry(id) {
  const registry = await loadRegistry();
  const before = registry.entries.length;
  registry.entries = registry.entries.filter((entry) => entry.id !== id);
  await saveRegistry(registry);
  return before !== registry.entries.length;
}

module.exports = { loadRegistry, saveRegistry, listEntries, getEntry, upsertEntry, deleteEntry };
