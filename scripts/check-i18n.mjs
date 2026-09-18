#!/usr/bin/env node
// Verify that lang/en.json and lang/ru.json have identical key sets.
// No dependencies. Exit code 1 on drift so it can gate commits/CI.
// Usage: node scripts/check-i18n.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const langDir = join(dirname(fileURLToPath(import.meta.url)), "..", "lang");
const files = { en: join(langDir, "en.json"), ru: join(langDir, "ru.json") };

function load(name, path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`check-i18n: cannot read/parse ${name} (${path}): ${err.message}`);
    process.exit(1);
  }
}

const en = load("en", files.en);
const ru = load("ru", files.ru);

const enKeys = new Set(Object.keys(en));
const ruKeys = new Set(Object.keys(ru));

const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k)).sort();
const missingInEn = [...ruKeys].filter((k) => !enKeys.has(k)).sort();

// Flag keys whose value equals the English one (likely an untranslated copy).
const untranslated = [...enKeys]
  .filter((k) => ruKeys.has(k) && typeof en[k] === "string" && en[k] === ru[k])
  .sort();

let failed = false;

if (missingInRu.length) {
  failed = true;
  console.error(`\nMissing in ru.json (${missingInRu.length}):`);
  for (const k of missingInRu) console.error(`  - ${k}`);
}

if (missingInEn.length) {
  failed = true;
  console.error(`\nMissing in en.json (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`  - ${k}`);
}

if (untranslated.length) {
  console.warn(`\nWarning: ${untranslated.length} ru value(s) identical to en (possibly untranslated):`);
  for (const k of untranslated) console.warn(`  - ${k}`);
}

if (failed) {
  console.error(`\ncheck-i18n: FAIL — en has ${enKeys.size} keys, ru has ${ruKeys.size}.`);
  process.exit(1);
}

console.log(`check-i18n: OK — ${enKeys.size} keys, en/ru in sync.`);
