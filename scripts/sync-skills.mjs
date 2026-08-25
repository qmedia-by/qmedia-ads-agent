#!/usr/bin/env node
// Раскладывает skills-source/ по каталогам Сред.
// Правится только skills-source/; всё остальное генерируется.
//
//   node scripts/sync-skills.mjs           записать копии
//   node scripts/sync-skills.mjs --check   проверить без записи
//
// Генератор недеструктивен: он отказывается перезаписывать файл, который
// расходится с исходником и при этом не значится в манифесте прошлой
// генерации, — такой файл правили руками, и молча потерять правку нельзя.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "skills-source");
const manifestName = ".qmedia-generated-skills.json";

// Каталогов меньше, чем Сред, и это намеренно: `.agents/skills` читают Codex,
// Cursor и OpenClaw, `.claude/skills` — Claude Code. Свой каталог заводится
// только там, где Среда чужие не читает, — см. docs/environments.md.
//
// VS Code читает .agents/skills и .claude/skills, своего каталога ему тоже не
// нужно. Windsurf и Cline скиллы не грузили вовсе и по этой причине сняты с
// поддержки — каталога для них нет и не было.
const targets = [
  ".agents/skills", // Codex, Cursor, OpenClaw
  ".claude/skills", // Claude Code
  ".gemini/skills", // Gemini CLI
];

const checkOnly = process.argv.includes("--check");

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Все файлы каталога рекурсивно, путями относительно него, в стабильном порядке. */
function listFiles(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFiles(path.join(dir, entry.name), relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

function readManifest(targetDir) {
  const manifestPath = path.join(targetDir, manifestName);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error(`${manifestName} в ${targetDir} повреждён — удалите его и повторите sync`);
  }
}

if (!fs.existsSync(sourceRoot)) {
  console.error(`Нет каталога ${path.relative(root, sourceRoot)}`);
  process.exit(1);
}

const sourceFiles = listFiles(sourceRoot);
const sourceContents = new Map(
  sourceFiles.map((file) => [file, fs.readFileSync(path.join(sourceRoot, file))]),
);

const problems = [];
let written = 0;
let removed = 0;

for (const target of targets) {
  const targetDir = path.join(root, target);
  const previous = readManifest(targetDir);
  const previousFiles = new Set(previous?.files?.map((entry) => entry.path) ?? []);

  for (const file of sourceFiles) {
    const destination = path.join(targetDir, file);
    const expected = sourceContents.get(file);

    if (fs.existsSync(destination)) {
      const actual = fs.readFileSync(destination);
      if (actual.equals(expected)) continue;

      // Расхождение в файле, которого нет в манифесте, — ручная правка.
      if (!previousFiles.has(file)) {
        problems.push(
          `${target}/${file}: расходится с исходником и не значится в манифесте. ` +
            `Перенесите правку в skills-source/${file}, затем удалите копию.`,
        );
        continue;
      }
      if (checkOnly) {
        problems.push(`${target}/${file}: устарел относительно skills-source/${file}`);
        continue;
      }
    } else if (checkOnly) {
      problems.push(`${target}/${file}: отсутствует`);
      continue;
    }

    if (!checkOnly) {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, expected);
      written += 1;
    }
  }

  // Удаляем только то, что генерировали сами и что исчезло из исходников.
  for (const stale of previousFiles) {
    if (sourceContents.has(stale)) continue;
    const destination = path.join(targetDir, stale);
    if (!fs.existsSync(destination)) continue;
    if (checkOnly) {
      problems.push(`${target}/${stale}: лишний, удалён из skills-source`);
      continue;
    }
    fs.rmSync(destination);
    removed += 1;
  }

  if (!checkOnly) {
    const manifest = {
      schema_version: 1,
      files: sourceFiles.map((file) => ({
        path: file,
        sha256: sha256(sourceContents.get(file)),
      })),
    };
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, manifestName),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
}

if (problems.length > 0) {
  console.error("Копии скиллов в каталогах Сред разошлись с skills-source:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(checkOnly ? "\nЗапустите: npm run sync" : "");
  process.exit(1);
}

const skillCount = new Set(sourceFiles.map((file) => file.split("/")[0])).size;
console.log(
  checkOnly
    ? `Копии актуальны: ${skillCount} скиллов, ${sourceFiles.length} файлов.`
    : `Синхронизировано ${skillCount} скиллов в ${targets.length} каталога: записано ${written}, удалено ${removed}.`,
);
