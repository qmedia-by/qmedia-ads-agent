---
name: connection-doctor
description: "Диагностировать сбой подключения к Google Ads или LidFly: протухший OAuth, неверный config клиента, timeout транспорта, отсутствующее подключение Провайдера. Использовать при ошибках авторизации, Failed, Authenticate/Login и недоступных инструментах."
---

# Connection Doctor

Find which layer failed and give exactly one next action. Do not mix client configuration, MCP OAuth, provider connection and skills — they fail independently and their fixes do not substitute for one another.

## Google Ads: expired token is the usual answer

Our OAuth application runs in Testing status, so Google **invalidates refresh tokens every 7 days**. This is a known property of the setup, not a fault, and it is by far the most common failure here.

Recognise it: Google Ads calls fail with an authorization error, while the same session worked earlier, or the Manager last authorised roughly a week ago. LidFly is unaffected — it has its own OAuth.

There is a second cause with identical symptoms: rotating the server's JWT signing key invalidates every issued session at once. If several Managers lose access simultaneously rather than one by one, ask whether the server was redeployed — it is not a seven-day expiry.

One action:

> Re-authorise the `google-ads` server in your client and repeat the request.

Stop there. Do not propose config edits, do not blame the network, and do not suggest the Account lost permissions. If re-authorisation itself fails, only then continue below.

## Identify the client first

Use available context, do not guess:

- **Codex** — `AGENTS.md`, `.codex/config.toml`, `.agents/skills/`
- **Claude Code** — `claude` command, project `.mcp.json`, `CLAUDE.md`, `.claude/`
- **VS Code** — a shell only. Determine whether Codex or Claude Code runs inside it, then apply that client's instructions.

Never hand a Claude Code user a Codex config, or the reverse. Do not create a parallel config for a client that is not in use.

## Diagnose in order

1. Is the remote endpoint configured in the current client's format? Transport must be HTTP/Streamable HTTP, never SSE.
2. Is MCP OAuth complete for the failing server?
3. Only after OAuth succeeds — are the server's tools listed?
4. Only after tools are available — for LidFly, is the provider connection present? Check with `get_provider_context`.
5. Only after the connection works — are the project skills present, in sync, and is the checkout current with `origin/dev`?

Do not tie health to a fixed number of tools.

## States

**Waiting for OAuth.** The client shows `Failed` with an `Authenticate` or `Login` button. Give one action: press it, complete the browser sign-in, retry. Do not call this a timeout, do not discuss provider tools yet.

**Config missing or wrong.** Fix only the detected client's config. Google Ads and LidFly are separate entries; a broken one does not affect the other. Neither carries credentials — if you see an `Authorization` header or an API key in a config, that is the fault: it overrides OAuth. Report it without printing the value.

**Access denied for a specific Account.** Not an authorization layer problem. The server's allowlist *is* the Registry, so there is one thing to check, not two: does `registry_find_client` return this Client, and is the refused `customer_id` among the ids it gives? If it is not, the Account is not in the Registry, and that is the whole explanation. A newly signed Client is the usual cause; the fix is a row in the Registry, not a server change. Note the Registry refreshes every five minutes, so a row added a moment ago may take that long to take effect for `search_search` — a lookup by name sees it immediately.

**The Registry itself is unreachable.** The `registry_*` tools refuse outright, and calls to Accounts are refused with a message about the server not knowing which Accounts are allowed. This is a server-side fault, not the Manager's: the Registry sheet stopped being shared with the server's service account, was moved, or its columns were renamed. One action: tell the Manager the Registry is unreachable, ask them to name the `customer_id` directly if the work cannot wait, and report it to whoever administers the server. Do not diagnose OAuth here — it is unrelated, and re-authorising will not help.

A `warning` in a `registry_*` answer is a milder version of the same thing: the Registry is being served from a copy that could not be refreshed. Work continues; pass the warning on so someone checks the sheet.

**Connection timeout.** Diagnose this only after config is correct and OAuth is not waiting on the Manager. Retry one safe read. Never retry a write.

**Skills missing or stale.** Prove tools are available first. Then compare the client's skills directory — `.agents/skills` for Codex, `.claude/skills` for Claude Code — against `skills-source/`. Suggest running `npm run sync`. Missing skills are not an OAuth or transport error.

**The checkout is behind.** A different fault from the one above: there the generated copies disagree with `skills-source/`, here the whole repository is older than the current version. `dev` is that version.

Reach for this when tools and OAuth are healthy but the tool does not behave as written: a skill or tool named in these instructions is absent, or a rule the Manager quotes does not match the one in front of you. Check without touching the working tree:

```bash
git fetch --quiet origin dev && git rev-list --count HEAD..origin/dev
```

A non-zero count is how many commits behind the checkout is; report the number. Zero means this is not the fault — diagnose elsewhere. No git, no network or any error here makes the check inconclusive, not failed: say so plainly and move on rather than treating it as the answer. If `git rev-parse --abbrev-ref HEAD` is not `dev`, say which branch it is — a Manager is expected to be on `dev`.

**Never run `git pull` yourself.** The repository is read-only to you, and updating mid-session makes the state worse rather than better: the instructions and skills already loaded into your context stay old while the files on disk become new, and nothing afterwards tells the Manager which of the two produced an answer. One action:

> Run `git pull` and start a new session — the update only takes effect in a new one.

Being behind explains absent tools, absent skills and rules that no longer match. It does not explain an expired token, a refused Account or an unreachable Registry. Do not offer an update as the fix for those.

## Output

Report: the detected client, the failing layer (`config`, `oauth`, `transport`, `registry`, `account_access`, `skills`, `version`), one next action, and what to check after it.

Never print tokens, client secrets, developer tokens or authorization headers, and never ask the Manager to paste them.
