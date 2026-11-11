#!/usr/bin/env node
/**
 * Guards the token boundary.
 *
 * Every colour value in the product must resolve to a design-system token.
 * The only files allowed to contain literal colour values are the token
 * sources themselves (`src/design-system/tokens/**`).
 *
 * Usage: node scripts/check-tokens.mjs
 * Exit code 0 = clean, 1 = violations found.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "..", "src");
const tokenDir = path.join(srcDir, "design-system", "tokens");

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".js", ".jsx"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage"]);

const PATTERNS = [
  {
    name: "hex colour",
    re: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
  },
  {
    name: "rgb/hsl colour",
    re: /\b(?:rgba?|hsla?)\(/g,
  },
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name);
    }
  }
}

const violations = [];

for (const file of walk(srcDir)) {
  if (file.startsWith(tokenDir)) continue;

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    // Allow Tailwind opacity modifiers and comments that merely mention values.
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;

    for (const pattern of PATTERNS) {
      pattern.re.lastIndex = 0;
      let match;
      while ((match = pattern.re.exec(line)) !== null) {
        violations.push({
          file: path.relative(path.resolve(here, ".."), file),
          line: index + 1,
          text: match[0],
          kind: pattern.name,
        });
      }
    }
  });
}

if (violations.length === 0) {
  console.log("✔ No raw colour values outside src/design-system/tokens.");
  process.exit(0);
}

console.error(`✖ Found ${violations.length} raw colour value(s) outside the token layer:\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.kind} "${v.text}"`);
}
console.error("\nMove the value into src/design-system/tokens and reference the token instead.");
process.exit(1);
