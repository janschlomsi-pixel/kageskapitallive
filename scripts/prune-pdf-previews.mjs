import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pdfDir = path.join(root, "tmp", "pdfs");
const keepCount = 3;

if (!fs.existsSync(pdfDir)) {
  console.log("No tmp/pdfs directory found.");
  process.exit(0);
}

const entries = fs.readdirSync(pdfDir, { withFileTypes: true });

const parseVersion = (name, prefix) => {
  const match = name.match(new RegExp(`^${prefix}(\\d+)(?:\\.pdf)?$`));
  return match ? Number.parseInt(match[1], 10) : null;
};

const previews = entries
  .filter((entry) => entry.isFile())
  .map((entry) => ({ entry, version: parseVersion(entry.name, "depot-police-preview-v") }))
  .filter((item) => item.version !== null)
  .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

const renders = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ entry, version: parseVersion(entry.name, "rendered-v") }))
  .filter((item) => item.version !== null)
  .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

const removeTargets = [
  ...previews.slice(keepCount).map((item) => path.join(pdfDir, item.entry.name)),
  ...renders.slice(keepCount).map((item) => path.join(pdfDir, item.entry.name)),
];

const legacyTargets = [
  "depot-police-preview.pdf",
  "rendered",
  "depot-modal.png",
  "depot-page.png",
  ".DS_Store",
]
  .map((name) => path.join(pdfDir, name))
  .filter((target) => fs.existsSync(target));

removeTargets.push(...legacyTargets);

for (const target of removeTargets) {
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Deleted ${path.relative(root, target)}`);
}

if (removeTargets.length === 0) {
  console.log("Nothing to prune.");
}
