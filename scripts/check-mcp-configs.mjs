#!/usr/bin/env node
// Восемь Сред — восемь файлов с одними и теми же адресами MCP-серверов.
//
// Генерировать их из общего источника дороже, чем сами данные: схема у каждой
// своя — `mcpServers` против `servers`, `url` против `serverUrl` и `httpUrl`,
// у Codex вдобавок свои таймауты. Поэтому держим руками, а от расхождения
// страхуемся сверкой: `.mcp.json` — канон, остальные обязаны упоминать те же
// серверы по тем же адресам. Ловим ровно те отказы, которые случаются на
// практике: сервер переехал и поправили не все файлы; Среду добавили, а в
// README о ней не написали; в конфиг вписали статический ключ вместо OAuth.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const canonPath = ".mcp.json"; // Claude Code
const mirrors = [
  ".codex/config.toml", // Codex
  ".cursor/mcp.json", // Cursor
  ".gemini/settings.json", // Gemini CLI
  ".openclaw/openclaw.example.json", // OpenClaw
  ".vscode/mcp.json", // VS Code
  ".windsurf/mcp.json", // Windsurf
  ".cline/mcp_settings.json", // Cline
];

// Ни один Провайдер здесь не авторизуется статикой: и Google Ads, и LidFly
// ходят через браузерный OAuth. Заголовок или ключ в конфиге не просто лишний
// — он перебивает OAuth, и Менеджер получает необъяснимый отказ. А ещё это
// секрет в публичном репозитории.
const secretPatterns = [
  [/authorization/i, "заголовок Authorization"],
  [/bearer/i, "Bearer-токен"],
  [/api[_-]?key/i, "API-ключ"],
  [/access_token/i, "access token"],
  [/"headers"/, "статические заголовки"],
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

const readme = read("README.md") ?? "";
const problems = [];

function checkForSecrets(relative, source) {
  for (const [pattern, what] of secretPatterns) {
    if (pattern.test(source)) problems.push(`${relative}: похоже на ${what} — здесь только OAuth`);
  }
}

checkForSecrets(canonPath, canonSource);

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
  checkForSecrets(mirror, source);
}

// Конфиг, о котором не написано в README, Менеджер не найдёт, а ревьюер не
// заметит, что Сред стало больше.
for (const relative of [canonPath, ...mirrors]) {
  if (!readme.includes(relative)) {
    problems.push(`${relative}: не упомянут в README.md — Среда не описана`);
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
