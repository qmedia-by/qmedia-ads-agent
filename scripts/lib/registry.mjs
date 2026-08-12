// Минимальный разбор registry.yaml.
//
// Осознанно понимает только ту схему, которую задаёт сам registry.yaml, и
// падает на всём остальном. Это дешевле внешней зависимости и честнее
// «умного» парсера, который тихо проглотит структуру, какой мы не ждали.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const registryPath = path.join(root, "registry.yaml");

export const PROVIDERS = ["google_ads", "yandex_direct", "vk"];

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 1)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** @returns {{clients: Array<{name: string, notes?: string, accounts: Record<string,string>, line: number}>}} */
export function readRegistry(source = fs.readFileSync(registryPath, "utf8")) {
  const clients = [];
  let current = null;
  let inAccounts = false;

  const lines = source.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.replace(/\s+$/, "");
    const lineNumber = index + 1;

    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (line === "clients:") continue;

    const client = line.match(/^ {2}- name:\s*(.+)$/);
    if (client) {
      current = { name: stripQuotes(client[1]), accounts: {}, line: lineNumber };
      clients.push(current);
      inAccounts = false;
      continue;
    }

    if (!current) {
      throw new Error(`registry.yaml:${lineNumber}: строка вне записи клиента: ${line.trim()}`);
    }

    if (line === "    accounts:") {
      inAccounts = true;
      continue;
    }

    const field = line.match(/^ {4}([a-z_]+):\s*(.*)$/);
    if (field && !inAccounts) {
      current[field[1]] = stripQuotes(field[2]);
      continue;
    }

    const account = line.match(/^ {6}([a-z_]+):\s*(.+)$/);
    if (account && inAccounts) {
      current.accounts[account[1]] = stripQuotes(account[2]);
      continue;
    }

    throw new Error(`registry.yaml:${lineNumber}: непонятная строка: ${line}`);
  }

  return { clients };
}
