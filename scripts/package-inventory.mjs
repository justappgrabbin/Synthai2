import fs from "node:fs";
import path from "node:path";

/** Inspect actual packaging output; never remove, stage, or fetch program files. */
export function inventory(directory) {
  const root = path.resolve(directory);
  if (!fs.existsSync(root)) throw new Error(`Packaging directory is missing: ${directory}`);
  const files = [];
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const target = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile()) files.push({ path: path.relative(root, target).split(path.sep).join("/"), bytes: fs.statSync(target).size });
    }
  }
  walk(root);
  return { directory, files: files.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path)), fileCount: files.length, bytes: files.reduce((total, file) => total + file.bytes, 0) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const directories = process.argv.slice(2);
  if (!directories.length) throw new Error("Specify the actual packaging output directories to inventory");
  const report = {
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    note: "Uncompressed file sizes. This is an inventory of these output directories, not Git history, the installed app size, or proof of runtime capability.",
    outputs: directories.map(inventory),
  };
  fs.writeFileSync("package-inventory.json", JSON.stringify(report, null, 2) + "\n");
  for (const output of report.outputs) console.log(`${output.directory}: ${output.fileCount} files, ${output.bytes} uncompressed bytes`);
}
