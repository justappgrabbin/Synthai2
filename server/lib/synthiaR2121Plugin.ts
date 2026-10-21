import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import JSZip from "jszip";

export const R2121_SHA256 = "8a56ece94beff95519e15c86ec9374f18ef695ae4461362840802c27dfc1d702";
export const R2121_SIZE = 1011909;
export const R2121_ENTRY = "core/SynthiaUnit.mjs";

/** Preserve the original donor ZIP. No code is executed or activated by verification. */
export async function verifyR2121Archive(buffer: Buffer) {
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  if (buffer.length !== R2121_SIZE || sha256 !== R2121_SHA256) {
    throw new Error("r21.21 original fingerprint mismatch");
  }
  const zip = await JSZip.loadAsync(buffer, {checkCRC32:true});
  const names = Object.keys(zip.files);
  if (!zip.file(R2121_ENTRY)) throw new Error("r21.21 missing core/SynthiaUnit.mjs");
  for (const name of names) {
    if (name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || /^[a-zA-Z]:/.test(name)) {
      throw new Error("Unsafe donor ZIP path");
    }
  }
  return {verified:true, sha256, bytes:buffer.length, entries:names.length, unit:R2121_ENTRY};
}

/** Address by provenance and lineage, not fabricated Gate/Line/DMS coordinates. */
export function addressR2121Donor() {
  return {
    identity:"synthia.r21.21.core-organism",
    lineage:"r21.21",
    role:"optional-plugin-source",
    source:"00-Synthia-Core-Organism-r21.21.zip",
    entry:R2121_ENTRY,
    sha256:R2121_SHA256,
    canonicalCoordinates:null,
    coordinatesStatus:"awaiting-source-supported-mapping",
    activation:"owner-approved-only",
    execution:"inactive",
  };
}

export async function stageR2121Donor(buffer: Buffer, root: string) {
  const receipt = await verifyR2121Archive(buffer);
  const directory = path.resolve(root, "vendor", "synthia-originals", "r21.21");
  await fs.promises.mkdir(directory, {recursive:true});
  const destination = path.join(directory, "00-Synthia-Core-Organism-r21.21.zip");
  try {
    await fs.promises.writeFile(destination, buffer, {flag:"wx"});
  } catch (error: any) {
    if (error?.code !== "EEXIST") throw error;
    const existing = await fs.promises.readFile(destination);
    await verifyR2121Archive(existing);
  }
  return {...receipt, address:addressR2121Donor(), destination, connected:false};
}
