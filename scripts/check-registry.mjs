#!/usr/bin/env node
// Проверяет Реестр: схему, формат идентификаторов и отсутствие дублей.
// Дубль Аккаунта между Клиентами — не косметика: агент выберет не того Клиента.

import { readRegistry, PROVIDERS } from "./lib/registry.mjs";

const problems = [];
let registry;

try {
  registry = readRegistry();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (registry.clients.length === 0) {
  problems.push("Реестр пуст: нет ни одного Клиента");
}

const seenNames = new Map();
const seenAccounts = new Map();

for (const client of registry.clients) {
  const where = `registry.yaml:${client.line}`;

  if (!client.name) {
    problems.push(`${where}: у Клиента пустое имя`);
  } else if (seenNames.has(client.name)) {
    problems.push(`${where}: имя «${client.name}» уже занято (${seenNames.get(client.name)})`);
  } else {
    seenNames.set(client.name, where);
  }

  const accounts = Object.entries(client.accounts);
  if (accounts.length === 0) {
    problems.push(`${where}: у Клиента «${client.name}» нет ни одного Аккаунта`);
  }

  for (const [provider, id] of accounts) {
    if (!PROVIDERS.includes(provider)) {
      problems.push(
        `${where}: неизвестный Провайдер «${provider}» (допустимы: ${PROVIDERS.join(", ")})`,
      );
      continue;
    }

    if (provider === "google_ads" && !/^\d{10}$/.test(id)) {
      problems.push(
        `${where}: google_ads «${id}» — ожидается customer_id из 10 цифр без дефисов`,
      );
    }

    const key = `${provider}:${id}`;
    if (seenAccounts.has(key)) {
      problems.push(
        `${where}: Аккаунт ${provider} «${id}» уже закреплён за «${seenAccounts.get(key)}»`,
      );
    } else {
      seenAccounts.set(key, client.name);
    }
  }
}

if (problems.length > 0) {
  console.error("Реестр невалиден:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Реестр в порядке: ${registry.clients.length} Клиентов, ${seenAccounts.size} Аккаунтов.`);
