---
name: mcp-v3-provider-context
description: "Разрешать provider scope в LidFly MCP v3 через get_provider_context и resolve_campaign_scope. Использовать вместе со скиллом Провайдера, когда кабинет, подключение или кампания заданы неточно либо названы по имени."
---

# MCP v3 Provider Context

Use before any LidFly task — Yandex Direct or VK — where the account, client, connection or campaign is not already exact.

Google Ads does not go through LidFly. Its Accounts come from the Registry, via `registry_find_client`; see the `google-ads-context` skill.

The Registry does not hold Yandex Direct Accounts, and it is not a substitute for the scope resolution below. Resolve Direct and VK scope here, through LidFly's own meta-tools.

## Required Sequence

1. Resolve provider scope with the top-level meta-tools:
   - account/client/project unknown: `get_provider_context({ provider, query? })`;
   - exact Yandex Direct login known: `get_provider_context({ provider: "yandex", query?, client_login })`;
   - campaign named by user: `resolve_campaign_scope({ provider, query, workspace_project_id? })`.
2. Find internal provider tools with `search_tools`, passing resolved provider/project scope when supported.
3. Read each internal tool schema with `get_tool_schema` before its first call.
4. Copy only returned `tool_args`, `scope_arguments`, or `next_call.arguments` into the internal provider call.
5. Read with `call_tool`; write with `call_write_tool`.

Call `search_tools`, `get_tool_schema`, `get_provider_context`, and `resolve_campaign_scope` directly. Never pass these top-level meta-tools as `tool_name` to `call_tool` or `call_write_tool`.

## Scope Rules

- Do not infer `client_login`, `client_id`, `counter_id`, or `connection_id` from a human name.
- `query` is free project/name/INN/display-identifier search. For Yandex, put an exact Direct login only in `client_login`; both fields may be sent together and are resolved independently.
- Inspect `scope_issues`. Automatically execute only a read-only `next_action` with `may_execute_automatically=true`. Never bypass `manual_scope_review`, ambiguity, conflict, directory outage, or login-not-found by guessing arguments.
- An `external_entity_key`, project name, or `external_entity_name` is never an executable `client_login`.
- If `resolve_campaign_scope` returns candidates, ask for the exact `workspace_project_id` or campaign id.
- For campaign write in agency/team Пространства, include `workspace_project_id` unless preflight returned one unambiguous scope.
- If provider context says a tool is available only in a selected Пространство, fail closed and ask for that project id.

## Provider Keys

- Yandex Direct: `connection_id`, optional `client_login`.
- Metrika: `counter_id`, optional `connection_id`; no `client_login`.
- VK Ads: `connection_id`, optional `client_id`.

## Output

Tell the Manager which scope was selected in human terms and include the exact id only where it is useful for verification. Never expose tokens or secrets.
