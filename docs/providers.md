# Providers

| Provider | Endpoint | Account identifier | Access | Memory |
|---|---|---|---|---|
| Google Ads | the agency's server | `customer_id` (10 digits) | read only | none |
| Yandex Direct | LidFly `mcp/v3` | `client_login` | read and write | Пространства |
| VK | LidFly `mcp/v3` | `client_id` | read and write | Пространства |
| Meta, TikTok | — | — | not connected | — |

Meta and TikTok are after the MVP. Both have official MCP servers; Meta's is in
open beta with per-account rollout. Asked for data on either, say plainly that
the Provider is not connected and do not offer a workaround.

## Google Ads

**Tools, with their namespace prefixes** — the bare names do not exist:
`search_search` (GAQL), `metadata_get_resource_metadata`,
`customers_list_accessible_customers`, `planning_generate_keyword_ideas`,
`registry_find_client`, `registry_list_clients`. There is no write tool; see
[invariants.md](./invariants.md#google-ads-is-read-only).

**Finding the Account.** Always `registry_find_client`, never
`list_accessible_customers` — the latter returns bare numbers with no names, and
picking by resemblance silently reports on the wrong Client. Use it only to
confirm that an id from the Registry is actually reachable.

**GAQL.** Query resources, not services. `keyword_view` for existing keywords,
`search_term_view` for what people typed, `campaign` / `ad_group` for structure,
`customer_client` for discovery under a manager account, `geo_target_constant`
for region ids. New keyword ideas are not reachable through GAQL at all — that
is `planning_generate_keyword_ideas`. Always bound reporting queries by date.

**Money is in micros.** Divide by 1,000,000 and state the currency: it belongs
to the Account and is not necessarily the one the Manager has in mind.

**OAuth expires every seven days.** Google revokes refresh tokens for unverified
apps, and the app stays in Testing deliberately: `.../auth/adwords` is a
sensitive scope, Internal needs a Google Workspace the agency does not have, and
verification needs a verified domain, a public homepage, a privacy policy and a
demo video, which takes weeks. So every Manager signs in again weekly and sees
"Google hasn't verified this app" — expected, not a fault. The ceiling is 100
Test users, added by hand. This is the tool's most visible rough edge and it is
fixed by buying Workspace, not by code.

Rotating `GOOGLE_ADS_MCP_JWT_SIGNING_KEY` invalidates every issued session and
forces the same re-login for everyone. Schedule it for a quiet hour.

Authorisation errors mid-session are the expiry, not a breakage; the agent
routes them to the `connection-doctor` skill rather than diagnosing them or
interrogating the Manager about configs.

**Russia has been unavailable since 2022.** Semantics cannot be collected for
it; stop and say so rather than returning an empty table.

**`planning_generate_keyword_ideas` needs the right token tier.** It works only
with a developer token holding the "Researching keywords and recommendations"
permissible use — blocked at Explorer level, and no code works around it. The
agency's token is Standard and access has been confirmed by a direct REST call.

## Yandex Direct

Reached only through LidFly, whose meta-tools resolve scope before any provider
tool is called: `get_provider_context`, `resolve_campaign_scope`, `search_tools`,
`get_tool_schema`, then `call_tool` for reads and `call_write_tool` for writes.
Call the meta-tools directly — never pass one as `tool_name` to `call_tool`.

**Start at the Registry, finish at LidFly.** `registry_find_client` often has
the Client's Direct login, and it is the only thing that maps a project domain
to one — LidFly's `query` searches its own directory of connections, so
"example-shop.by" finds nothing there. Take the login to
`get_provider_context({ provider: "yandex", client_login: "<login>" })`; with no
login in the Registry, fall back to `query: "<Client name>"`. Either way LidFly
decides what is real. See
[invariants.md](./invariants.md#what-the-registry-covers-and-what-its-silence-means) for
the three states of the Registry's `yandex_direct` field and why its silence
proves nothing.

**Never derive a `client_login`** from a Client's name, a project name, an
`external_entity_name`, an `external_entity_key`, or a Direct `ClientId`. Copy
`tool_args`, `scope_arguments` or `next_call.arguments` back verbatim. A partial
recovered scope is not a scope: accept it only when `workspace_project_id`,
`connection_id` and `client_login` all come back together.

**Modern campaigns by default** — `add_unified_campaign` → `add_adgroup` with
`adgroup_type: UNIFIED_AD_GROUP` → `add_keywords_batch` → `add_responsive_ad`.
`add_adgroups` creates legacy `TEXT_AD_GROUP` groups and must not be used for
unified ones. The legacy `add_campaign` / `add_ad` / `add_ads` path is
compatibility only; if it is used, say so out loud and re-read the ad `Type`
after creation.

**Budgets are in roubles**, not micro-units. Search-only by default; enable
networks only when asked.

**Landing pages cannot be edited.** Yandex's public API cannot read block
settings or create, change, publish or delete content on `clients.site` and
turbo pages. `get_turbo_pages` reads metadata of published pages,
`get_leads` reads submitted forms, and that is all. This is an API boundary, not
an outage — do not open a LidFly support ticket about it, and do not substitute
an ad write for a page edit.

**Wordstat covers Yandex demand only.** Google demand comes from
`planning_generate_keyword_ideas`. They are different markets; never merge them
into one column without labelling the source.

## VK

Same LidFly path, keyed by `connection_id` and optional `client_id`. VK **is**
in the Registry, so a Client's `client_id` can come from `registry_find_client`
as well as from provider context.

## Пространства (LidFly memory)

Decisions, documents, campaign snapshots and follow-up tasks for Yandex Direct
and VK. A project inside a Пространство corresponds to one of our Clients, but
only through people — the Registry does not store `workspace_project_id`.

Write to a Пространство only with a resolved `workspace_project_id`. For
agency and team Пространства include it explicitly in campaign writes unless
preflight returned exactly one unambiguous scope.

Nothing equivalent exists for Google Ads; see
[invariants.md](./invariants.md#google-ads-has-no-project-memory-so-it-must-ask).
