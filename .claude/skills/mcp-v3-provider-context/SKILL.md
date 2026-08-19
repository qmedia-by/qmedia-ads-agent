---
name: mcp-v3-provider-context
description: "Находить Аккаунт Яндекс Директа или VK по имени Клиента и разрешать provider scope в LidFly MCP v3 через get_provider_context и resolve_campaign_scope. Использовать, когда логин Директа, подключение, проект или кампания неизвестны либо названы человеческим именем, — в том числе когда Клиента не оказалось в Реестре."
---

# MCP v3 Provider Context

Use before any LidFly task — Yandex Direct or VK — where the account, client, connection or campaign is not already exact.

Google Ads does not go through LidFly. Its Accounts come from the Registry, via `registry_find_client`; see the `google-ads-context` skill.

**Call `registry_find_client` first for a Direct question, then come back here.** It often has the Client's Direct login, and it is the only thing that maps a project domain to one: `query` searches LidFly's own directory of connections, so "example-shop.by" finds nothing there. That gap is what this instruction exists for.

The Registry is never a substitute for the scope resolution below — a login from it is a candidate that LidFly validates, not a resolved scope. Resolve Direct and VK scope here, through LidFly's own meta-tools, however you came by the login.

Read the Registry's `yandex_direct` field, which has three states and no two of them mean the same thing. A **login** goes into `client_login`. A note that the cell **could not be read** means unknown, not absent — the Account almost certainly exists and the sheet needs tidying, so resolve by `query` and tell the Manager which row to fix. **Nothing at all** is not evidence either: neither `found: false` nor a Client returned without a Direct entry means the Client has no Direct Account. Never tell the Manager a Direct Account is missing until `get_provider_context` has said so.

## Required Sequence

1. Resolve provider scope with the top-level meta-tools:
   - account/client/project unknown: `get_provider_context({ provider, query? })`;
   - Direct login known — from the Manager or from `registry_find_client`: `get_provider_context({ provider: "yandex", query?, client_login })`;
   - campaign named by user: `resolve_campaign_scope({ provider, query, workspace_project_id? })`.
2. Find internal provider tools with `search_tools`, passing resolved provider/project scope when supported.
3. Read each internal tool schema with `get_tool_schema` before its first call.
4. Copy only returned `tool_args`, `scope_arguments`, or `next_call.arguments` into the internal provider call.
5. Read with `call_tool`; write with `call_write_tool`.

Call `search_tools`, `get_tool_schema`, `get_provider_context`, and `resolve_campaign_scope` directly. Never pass these top-level meta-tools as `tool_name` to `call_tool` or `call_write_tool`.

## Scope Rules

- Do not infer `client_login`, `client_id`, `counter_id`, or `connection_id` from a human name. A login from `registry_find_client` is not an inference — it is a value somebody recorded — so passing it as `client_login` is allowed. It still faces the same live-directory check, and a `login-not-found` on it is an answer, not an invitation to try a similar string.
- `query` is free project/name/INN/display-identifier search. For Yandex, put an exact Direct login only in `client_login`; both fields may be sent together and are resolved independently. A login-shaped string arriving in `query` is a compatibility candidate only — it still has to pass the same live-directory check before you use it.
- Inspect `scope_issues`. Automatically execute only a read-only `next_action` with `may_execute_automatically=true`. Never bypass `manual_scope_review`, ambiguity, conflict, directory outage, or login-not-found by guessing arguments.
- An `external_entity_key`, project name, or `external_entity_name` is never an executable `client_login`. Identifiers you pass on are the ones the tool returned: copy `tool_args`, `scope_arguments` or `next_call.arguments` verbatim rather than assembling arguments yourself from parts of the answer.
- If `resolve_campaign_scope` returns candidates, ask for the exact `workspace_project_id` or campaign id.
- For campaign write in agency/team Пространства, include `workspace_project_id` unless preflight returned one unambiguous scope.
- If provider context says a tool is available only in a selected Пространство, fail closed and ask for that project id.

## Provider Keys

- Yandex Direct: `connection_id`, optional `client_login`.
- Metrika: `counter_id`, optional `connection_id`; no `client_login`.
- VK Ads: `connection_id`, optional `client_id`.

## Output

Tell the Manager which scope was selected in human terms and include the exact id only where it is useful for verification. Never expose tokens or secrets.
