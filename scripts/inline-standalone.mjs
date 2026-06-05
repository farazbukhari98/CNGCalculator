import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "dist", "standalone");
const inputHtml = path.join(outDir, "index.html");
const outputHtml = path.join(outDir, "CNGCalculator.html");
const portableDir = path.join(projectRoot, "standalone");
const portableHtml = path.join(portableDir, "CNGCalculator.html");

if (!fs.existsSync(inputHtml)) {
  throw new Error(`Standalone build output not found: ${inputHtml}`);
}

let html = fs.readFileSync(inputHtml, "utf8");

function readBuiltAsset(assetPath) {
  const normalized = assetPath.replace(/^\.\//, "").replace(/^\//, "");
  const fullPath = path.join(outDir, normalized);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Referenced build asset not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

html = html.replace(
  /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
  (_match, href) => `<style data-inlined-from="${href}">\n${readBuiltAsset(href)}\n</style>`,
);

html = html.replace(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
  (_match, src) => `<script type="module" data-inlined-from="${src}">\n${readBuiltAsset(src)}\n</script>`,
);

// Remove preload links after the modules have been inlined; keeping them would
// make the supposedly single-file artifact look for deleted asset files.
html = html.replace(/\n?\s*<link rel="modulepreload" crossorigin href="[^"]+">/g, "");

html = html.replace(
  "<head>",
  `<head>\n    <title>CNG Fleet Calculator - Standalone</title>\n    <meta name="application-name" content="CNG Fleet Calculator Standalone" />`,
);

fs.writeFileSync(outputHtml, html);

// Leave only the portable artifact in the standalone output directory.
for (const entry of fs.readdirSync(outDir)) {
  if (entry !== "CNGCalculator.html") {
    fs.rmSync(path.join(outDir, entry), { recursive: true, force: true });
  }
}

const sizeMb = (fs.statSync(outputHtml).size / (1024 * 1024)).toFixed(2);
console.log(`Created ${outputHtml} (${sizeMb} MB)`);

fs.mkdirSync(portableDir, { recursive: true });
fs.copyFileSync(outputHtml, portableHtml);
console.log(`Copied portable app to ${portableHtml}`);