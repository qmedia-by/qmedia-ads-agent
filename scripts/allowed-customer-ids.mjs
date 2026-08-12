#!/usr/bin/env node
// Печатает список customer_id Google Ads из Реестра, через запятую.
//
// Задумывался как источник для серверного allowlist, но такой переменной у
// официального сервера не существует (docs/adr/0003). Пока allowlist не
// реализован в форке, скрипт годится только для ручной сверки: сравнить, что
// в Реестре, с тем, что реально доступно через customers_list_accessible_customers.
//
//   node scripts/allowed-customer-ids.mjs

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
