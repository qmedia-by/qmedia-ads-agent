---
name: workspace-project-manager
description: "Управлять Пространствами LidFly: проекты, привязка кабинетов и кампаний, документы, решения, настройки, задачи и AI-автозапуски. Использовать для любой записи в память Workspace с точным workspace_project_id."
---

# Workspace Project Manager

Use when the Manager asks about saved context, decisions, documents, settings, campaign snapshots, tasks, reminders, or scheduled AI checks.

Пространство is LidFly's memory. It covers **Yandex Direct and VK only** — the Providers we reach through LidFly. Google Ads has no equivalent and nothing here applies to it: never offer to save a Google Ads audit into a Пространство, and never assume context saved here is available when working on a Google Ads Account.

## Model

- **Пространство** — the memory container the Manager sees.
- **Workspace project** — one business inside it. In our terms this is a Client, and `workspace_project_id` is its canonical id for memory writes.
- Provider identifiers are external entities, never project ids: `client_login` (Yandex Direct), `client_id` / `vk_client_id` (VK), `counter_id` (Metrika). In our terms these identify Accounts, and an Account is not a project.

Note that a Client's Accounts come from the Registry — `registry_find_client` — while its memory lives in a Пространство. The two are separate: the Registry never carries a `workspace_project_id`, and a Пространство never authorises access to an Account. The Registry also does not list Yandex Direct Accounts, so do not reach for it to resolve LidFly scope.

## Project scope

Before writing audits, documents, decisions, snapshots, settings, provider links, campaign links, or provider-scoped tasks:

1. If the exact `workspace_project_id` is known, use it.
2. Otherwise call `workspace_prepare_project_scope` with every selector you have: `project_name`, `provider`, `external_entity_key`, `external_campaign_id`, `client_login`, `vk_client_id`, `metrika_counter_id`, `campaign_name`.
3. If resolved, write with the returned `workspace_project_id`.
4. If ambiguous, show the candidates and ask for the exact `workspace_project_id`.
5. If nothing matches, offer to create a project with `workspace_create_project`. **Never create one silently** — least of all a catch-all named «Основной проект», which turns into a dumping ground nobody can untangle later.

## Tools

Find internal Workspace tools with `search_tools({ provider: "workspace", ... })` and read each schema with `get_tool_schema` before its first call. Never pass top-level meta-tools such as `search_tools` as `tool_name`.

Read through `call_tool`: `workspace_list_projects`, `workspace_get_project`, `workspace_prepare_project_scope`, `workspace_prepare_project_deletion`, `workspace_get_settings`, `workspace_get_tasks`, `workspace_get_scheduled_ai_tasks`.

Write through `call_write_tool`: `workspace_create_project`, `workspace_delete_project`, `workspace_upsert_provider_entity`, `workspace_link_campaign`, `workspace_update_settings`, `workspace_add_tasks`, `workspace_schedule_ai_task`.

## Permanent deletion

Owner-only, irreversible, and never allowed inside an AI autostart.

1. Resolve and use the exact `workspace_project_id`. Never pick a deletion target by name resemblance.
2. Call read-only `workspace_prepare_project_deletion`.
3. If `can_delete=false`, explain the returned blocker. Archive an active project only if the Manager asked; protected accounting history means the project stays archived.
4. Show `confirmation_message`, the deletion counts and the retained activity-history count. Wait for explicit textual confirmation.
5. Call `workspace_delete_project` with the unchanged `workspace_project_id`, `expected_project_name` and `expected_updated_at` from that preflight.
6. If the target changed, re-run the preflight and ask again. After a transport-uncertain delete, reread the project before considering any retry.

## Reminders are not autostarts

These two look similar and behave completely differently. Choosing wrong either does nothing when the Manager expected action, or acts unsupervised when they expected a question.

`workspace_add_tasks` is a **manual reminder**: it stores a prompt and a due date, and the due date only sends email. It never runs AI or Provider tools. Use it whenever the future check must be shown to the Manager, asks a question, or needs a new decision.

`workspace_schedule_ai_task` is an **AI autostart**: LidFly executes the saved plan at the appointed time with no further confirmation. Every object, action, value and conditional branch must be approved before you schedule it. `allowed_tools` must list real domain tools for the future run, not v3 meta-tools; include `workspace_project_id` for Provider or campaign tasks; for a future write, include concrete target items and a confirmed plan.

## Output

State which project was selected, what was created, whether it will run automatically, what the Manager must do next, and what remains unconfirmed.
