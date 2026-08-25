---
name: google-ads-context
description: "Выбрать Аккаунт Google Ads через Реестр и корректно построить GAQL-запрос. Использовать перед любой задачей по Google Ads: сбор семантики, отчёты, аудит кампаний."
---

# Google Ads Context

Use before any Google Ads task. Resolves which Account to query and what may be asked of it.

## The Account comes from the Registry

Call `registry_find_client` with the Client's name as the Manager said it. Matching ignores case, spacing and punctuation, so a Client recorded as `example-shop.by` is found by "example-shop". `registry_list_clients` gives every name, for when nothing matches and you need to offer candidates.

Do **not** start from `list_accessible_customers`: it returns bare numeric ids with no names, and picking by resemblance silently reports on the wrong Client. Use that tool only to verify that an id from the Registry is actually reachable.

The tool returns a **list** of ids per Provider. More than one is normal — the agency splits a Client across cabinets by country or product line — and it means you must ask the Manager which cabinet they mean. Never query all of them and add the numbers up: the answer would be a total no report of theirs contains.

`google_ads` ids come back as 10 digits, no dashes, ready to pass on. The Manager may say them hyphenated, as the Google Ads interface shows them; that is the same Account.

The Registry covers Google Ads, VK, Meta, and a Yandex Direct login wherever the sheet records one cleanly. Only `google_ads` ids are Accounts you can query here. A `yandex_direct` login is a candidate to resolve through LidFly, see `mcp-v3-provider-context`; a `meta` id belongs to Meta's own server, see `meta-ads-context`. Neither one's absence proves anything: both come back as a field of their own saying which of three states this answer is.

### When the Client is not there

Two different answers, and they must not be confused:

- **`found: false`.** The Client has no Account under any Provider the Registry covers — the answer was checked against a fresh read, not a cached one. That is all it means: TikTok is outside the Registry entirely, and a Direct login the sheet wrote next to its password is not read. Say which Providers you actually checked rather than that the Client is unknown, and ask for a Registry row when Google Ads or VK is what was wanted — for those the row is the only route. Direct is still worth trying through LidFly (`mcp-v3-provider-context`), and Meta through Meta (`meta-ads-context`): for neither is a missing row a refusal.
- **The tool refuses with "the Registry could not be read".** Different thing entirely: the mapping is unknown, not empty. Say the Registry is unreachable and ask the Manager to name the `customer_id` directly. Do **not** fall back to `list_accessible_customers`, and do not guess.

A `warning` field means the answer came from a copy that could not be refreshed. Pass its substance to the Manager — a Client added since then would be missing — and carry on with the answer.

A `problems` field means the Registry itself is inconsistent for this Client, most often one Account listed under two Clients. Report it and ask which is right rather than choosing.

## This server only reads

Available tools — note the namespace prefixes, the bare names do not exist: `search_search` (GAQL), `metadata_get_resource_metadata`, `customers_list_accessible_customers`, `planning_generate_keyword_ideas`, `registry_find_client`, `registry_list_clients`.

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
