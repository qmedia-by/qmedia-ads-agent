---
name: google-ads-context
description: "Выбрать Аккаунт Google Ads через Реестр и корректно построить GAQL-запрос. Использовать перед любой задачей по Google Ads: сбор семантики, отчёты, аудит кампаний."
---

# Google Ads Context

Use before any Google Ads task. Resolves which Account to query and what may be asked of it.

## The Account comes from the Registry

`registry.yaml` at the repo root maps each Client to its Accounts. Read it first.

Do **not** start from `list_accessible_customers`: it returns bare numeric ids with no names, and picking by resemblance silently reports on the wrong Client. Use that tool only to verify that an id from the Registry is actually reachable.

If the Client is missing from the Registry, say so and ask the Manager to add it through a pull request. Never guess a `customer_id`, and never fall back to "the only account I can see".

Google Ads ids are 10 digits, no dashes. A Client may legitimately have several Accounts — if the Registry lists more than one, ask which.

## This server only reads

Available tools — note the namespace prefixes, the bare names do not exist: `search_search` (GAQL), `metadata_get_resource_metadata`, `customers_list_accessible_customers`, `planning_generate_keyword_ideas`.

There is no write tool, by design. Do not attempt to change bids, budgets, statuses, keywords or ads, and do not tell the Manager you will do it later in this session — you will not. If they need a change made, say plainly that Google Ads is read-only here and the change has to happen in the Google Ads interface.

## GAQL essentials

Query resources, not services. `search` reaches anything with a queryable resource; anything else needs a dedicated tool.

- Existing keywords and their performance: `keyword_view`
- What people actually typed: `search_term_view`
- Campaign and group structure: `campaign`, `ad_group`
- Account discovery under a manager: `customer_client`
- Region ids by name or country: `geo_target_constant`

New keyword ideas and demand volumes are **not** reachable through GAQL — they need `planning_generate_keyword_ideas`. See the `keyword-research` skill.

Always bound reporting queries by date, for example `WHERE segments.date DURING LAST_30_DAYS`. An unbounded query over a large Account returns far more than anyone needs and slows the session.

## Metrics come back scaled

Money fields are in micros: divide by 1,000,000 to get the account currency. Report human-readable numbers, and state the currency — it belongs to the Account, and it is not necessarily the currency the Manager is thinking in.

## Output

Name the Client in words and state which Account id was used, so the Manager can verify you queried the right one. Mark any figure you estimated rather than read.
