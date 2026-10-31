#!/usr/bin/env node
/**
 * Resonance bundle transport helper.
 *
 * This NEVER edits the Resonance archive internally.
 * It only splits/reassembles the raw ZIP bytes for transport.
 *
 * Usage:
 *   node scripts/resonance-bundle.mjs split /path/to/Resonance-Network-Social-Organism-MCP-Wired.zip resonance-bundles
 *   node scripts/resonance-bundle.mjs join resonance-bundles /tmp/Resonance-Network-Social-Organism-MCP-Wired.zip
 *   node scripts/resonance-bundle.mjs verify resonance-bundles /tmp/Resonance-Network-Social-Organism-MCP-Wired.zip
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";

const DEFAULT_PART_BYTES = Number(process.env.RESONANCE_PART_BYTES || 32 * 1024 * 1024);
const MANIFEST_NAME = "Resonance-Network-Social-Organism-MCP-Wired.manifest.json";
const BASE_NAME = "Resonance-Network-Social-Organism-MCP-Wired.zip";

async function sha256File(file) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function split(input, outDir) {
  const stat = await fsp.stat(input);
  await fsp.mkdir(outDir, { recursive: true });

  const fd = await fsp.open(input, "r");
  const parts = [];

  try {
    let offset = 0;
    let index = 0;
    while (offset < stat.size) {
      const length = Math.min(DEFAULT_PART_BYTES, stat.size - offset);
      const buffer = Buffer.allocUnsafe(length);
      const { bytesRead } = await fd.read(buffer, 0, length, offset);
      const payload = buffer.subarray(0, bytesRead);
      const partName = `${BASE_NAME}.part${String(index).padStart(2, "0")}`;
      const partPath = path.join(outDir, partName);
      await fsp.writeFile(partPath, payload);
      parts.push({
        file: partName,
        bytes: bytesRead,
        sha256: crypto.createHash("sha256").update(payload).digest("hex"),
      });
      offset += bytesRead;
      index += 1;
    }
  } finally {
    await fd.close();
  }

  const manifest = {
    format: "synthia.resonance.raw-zip-transport.v1",
    archive: BASE_NAME,
    archiveBytes: stat.size,
    archiveSha256: await sha256File(input),
    partBytes: DEFAULT_PART_BYTES,
    parts,
    invariant: "Concatenating part files in manifest order MUST reproduce the original archive byte-for-byte.",
  };

  await fsp.writeFile(path.join(outDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify(manifest, null, 2));
}

async function readManifest(dir) {
  return JSON.parse(await fsp.readFile(path.join(dir, MANIFEST_NAME), "utf8"));
}

async function join(dir, output) {
  const manifest = await readManifest(dir);
  await fsp.mkdir(path.dirname(path.resolve(output)), { recursive: true });

  const out = fs.createWriteStream(output);
  for (const part of manifest.parts) {
    const file = path.join(dir, part.file);
    const digest = await sha256File(file);
    if (digest !== part.sha256) {
      out.destroy();
      throw new Error(`Part checksum mismatch: ${part.file}`);
    }
    await new Promise((resolve, reject) => {
      const input = fs.createReadStream(file);
      input.on("error", reject);
      input.on("end", resolve);
      input.pipe(out, { end: false });
    });
  }
  await new Promise((resolve, reject) => out.end((error) => error ? reject(error) : resolve()));

  const stat = await fsp.stat(output);
  const digest = await sha256File(output);
  if (stat.size !== manifest.archiveBytes || digest !== manifest.archiveSha256) {
    throw new Error(`Reassembled archive failed verification: bytes=${stat.size}, sha256=${digest}`);
  }
  console.log(`Verified ${output}`);
  console.log(`bytes: ${stat.size}`);
  console.log(`sha256: ${digest}`);
}

async function verify(dir, archive) {
  const manifest = await readManifest(dir);
  const stat = await fsp.stat(archive);
  const digest = await sha256File(archive);
  if (stat.size !== manifest.archiveBytes || digest !== manifest.archiveSha256) {
    throw new Error(`Archive verification failed: expected ${manifest.archiveBytes}/${manifest.archiveSha256}, got ${stat.size}/${digest}`);
  }
  console.log("Resonance archive verified byte-for-byte.");
}

const [command, a, b] = process.argv.slice(2);
if (command === "split" && a && b) await split(a, b);
else if (command === "join" && a && b) await join(a, b);
else if (command === "verify" && a && b) await verify(a, b);
else {
  console.error("Usage:");
  console.error("  node scripts/resonance-bundle.mjs split <archive.zip> <output-dir>");
  console.error("  node scripts/resonance-bundle.mjs join <parts-dir> <archive.zip>");
  console.error("  node scripts/resonance-bundle.mjs verify <parts-dir> <archive.zip>");
  process.exit(2);
}
