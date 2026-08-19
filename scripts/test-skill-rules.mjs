#!/usr/bin/env node
// Проверяет, что критичные правила не выпали из инструкций при переписывании.
//
// Здесь только те утверждения, потеря которых опасна: агент начнёт писать
// туда, куда нельзя, или молча подставит выдуманные гео и язык. Не добавляйте
// сюда проверки «на всякий случай»: чем их больше, тем сильнее соблазн
// ослабить регулярку вместо того, чтобы починить текст.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

const checks = [
  {
    file: "AGENTS.md",
    rules: [
      [/[Вв] Google Ads писать нельзя/, "запрет записи в Google Ads (docs/invariants.md)"],
      [/call_write_tool/, "порядок записи через LidFly (docs/invariants.md)"],
      [/registry_find_client/, "выбор Аккаунта через Реестр (docs/invariants.md)"],
      [/только на чтение/, "репозиторий read-only (docs/invariants.md)"],
      [/connection-doctor/, "маршрут при протухшем токене (docs/providers.md)"],
      [/get_provider_context/, "Аккаунт Директа берётся у LidFly, а не из Реестра (docs/invariants.md)"],
      [
        /ничего не говорит про Директ/,
        "промах Реестра — не доказательство отсутствия Директа (docs/invariants.md)",
      ],
    ],
  },
  {
    file: "skills-source/google-ads-context/SKILL.md",
    rules: [
      [/read-only|only reads|no write/i, "Google Ads доступен только на чтение"],
      [/registry_find_client/, "Аккаунт выбирается через Реестр"],
      [
        /fall back to `list_accessible_customers`/,
        "при недоступном Реестре нет отката на list_accessible_customers",
      ],
    ],
  },
  {
    file: "skills-source/keyword-research/SKILL.md",
    rules: [
      [/geoTargetConstants/, "гео передаётся константами, а не названиями"],
      [/languageConstants/, "язык передаётся константой"],
      [/ask|Ask/, "недостающие гео и язык запрашиваются, а не угадываются"],
      [/`references\/geo-targets\.md`/, "таблица гео подключена"],
    ],
  },
  {
    file: "skills-source/keyword-clustering/SKILL.md",
    rules: [
      [/without .{0,40}API|no .{0,20}API call/i, "кластеризация не тратит квоту API"],
      [/`references\/clustering-rules\.md`/, "правила кластеризации подключены"],
    ],
  },
];

let failures = 0;

for (const { file, rules } of checks) {
  const source = read(file);
  for (const [pattern, description] of rules) {
    try {
      assert.match(source, pattern, `${file}: потеряно правило — ${description}`);
    } catch (error) {
      console.error(`  - ${error.message}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\nПравил потеряно: ${failures}`);
  process.exit(1);
}

console.log(`Критичные правила на месте: ${checks.length} файлов.`);
