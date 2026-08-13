#!/usr/bin/env node
// Печатает список customer_id Google Ads из Реестра, через запятую.
//
// Это готовое значение переменной GOOGLE_ADS_ALLOWED_CUSTOMER_IDS в .env форка
// google-ads-mcp на сервере: сервер отклоняет вызовы инструментов для Аккаунтов
// вне списка (docs/adr/0003). Подключили Клиента — перегенерируйте и обновите
// .env, иначе агенту откажут по Аккаунту, который в Реестре уже есть.
//
//   npm run allowed-ids

import { readRegistry } from "./lib/registry.mjs";

const { clients } = readRegistry();
const ids = clients
  .map((client) => client.accounts.google_ads)
  .filter(Boolean)
  .sort();

if (ids.length === 0) {
  console.error("В Реестре нет ни одного Аккаунта google_ads");
  process.exit(1);
}

console.log(ids.join(","));
