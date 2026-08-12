#!/usr/bin/env node
// Структурная проверка скиллов: frontmatter, ссылки на references,
// синхронность клиентских копий с skills-source.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "skills-source");
const problems = [];

const skills = fs
  .readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (skills.length === 0) {
  console.error("В skills-source/ нет ни одного скилла");
  process.exit(1);
}

for (const skill of skills) {
  const skillDir = path.join(sourceRoot, skill);
  const skillFile = path.join(skillDir, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    problems.push(`${skill}: нет SKILL.md`);
    continue;
  }

  const source = fs.readFileSync(skillFile, "utf8");
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) {
    problems.push(`${skill}/SKILL.md: нет frontmatter`);
    continue;
  }

  const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter[1]
    .match(/^description:\s*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, "");

  if (name !== skill) {
    problems.push(`${skill}/SKILL.md: name «${name ?? "—"}» не совпадает с именем каталога`);
  }

  if (!description) {
    problems.push(`${skill}/SKILL.md: пустой description — клиент не увидит скилл`);
  } else {
    // Решение по языку: description читает Менеджер, тело читает модель.
    if (!/[а-яё]/i.test(description)) {
      problems.push(`${skill}/SKILL.md: description должен быть на русском`);
    }
    if (description.length > 500) {
      problems.push(`${skill}/SKILL.md: description длиннее 500 символов`);
    }
  }

  const body = source.slice(frontmatter[0].length);

  // Ссылки на бандлы вида `references/clustering-rules.md`.
  for (const match of body.matchAll(/`(references\/[\w./-]+\.md)`/g)) {
    if (!fs.existsSync(path.join(skillDir, match[1]))) {
      problems.push(`${skill}/SKILL.md: ссылка на несуществующий ${match[1]}`);
    }
  }

  // Обратная проверка: бандл есть, но на него никто не ссылается.
  const referencesDir = path.join(skillDir, "references");
  if (fs.existsSync(referencesDir)) {
    for (const file of fs.readdirSync(referencesDir)) {
      if (!body.includes(`references/${file}`)) {
        problems.push(`${skill}: references/${file} не упомянут в SKILL.md и не будет прочитан`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error("Скиллы не проходят проверку:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

execFileSync(process.execPath, [path.join(root, "scripts/sync-skills.mjs"), "--check"], {
  cwd: root,
  stdio: "inherit",
});

console.log(`Структура скиллов в порядке: ${skills.length} шт.`);
