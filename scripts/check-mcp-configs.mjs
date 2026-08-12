#!/usr/bin/env node
// Три Среды — три файла с одними и теми же адресами MCP-серверов.
//
// Генерировать их из общего источника дороже, чем сами данные: у Codex свои
// таймауты, у Cursor своя схема без `type`. Поэтому держим руками, а от
// расхождения страхуемся сверкой: `.mcp.json` — канон, остальные обязаны
// упоминать те же серверы по тем же адресам. Ловим ровно тот отказ, который
// случается на практике: сервер переехал, поправили не все файлы.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const canonPath = ".mcp.json"; // Claude Code
const mirrors = [
  ".codex/config.toml", // Codex
  ".cursor/mcp.json", // Cursor
];

function read(relative) {
  const file = path.join(root, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

const canonSource = read(canonPath);
if (canonSource === null) {
  console.error(`Нет ${canonPath} — сверять не с чем`);
  process.exit(1);
}

const servers = Object.entries(JSON.parse(canonSource).mcpServers ?? {});
if (servers.length === 0) {
  console.error(`В ${canonPath} не объявлено ни одного MCP-сервера`);
  process.exit(1);
}

const problems = [];

for (const mirror of mirrors) {
  const source = read(mirror);
  if (source === null) {
    problems.push(`${mirror}: отсутствует — эта Среда останется без MCP`);
    continue;
  }
  for (const [name, config] of servers) {
    if (!source.includes(name)) {
      problems.push(`${mirror}: нет сервера «${name}»`);
      continue;
    }
    if (config.url && !source.includes(config.url)) {
      problems.push(`${mirror}: у «${name}» адрес разошёлся с ${canonPath} — ждали ${config.url}`);
    }
  }
}

if (problems.length > 0) {
  console.error("MCP-конфиги Сред разошлись:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\nКанон — ${canonPath}, остальные приводятся к нему.`);
  process.exit(1);
}

console.log(
  `MCP-конфиги согласованы: серверов — ${servers.length}, Сред — ${mirrors.length + 1}.`,
);
