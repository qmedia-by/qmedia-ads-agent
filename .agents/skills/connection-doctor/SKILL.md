---
name: connection-doctor
description: "Подключить рекламные кабинеты в первый раз и чинить сбои подключения к Google Ads, LidFly или Meta: вход в MCP, протухший OAuth, неверный config клиента, timeout транспорта, недоступный инструмент. Использовать на фразы «подключи кабинеты», «войди в MCP», при ошибках авторизации, Failed, Authenticate/Login и когда инструмент не отвечает."
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

## Signing in to the MCP servers, in Codex

A Manager on the supported path — VS Code with the Codex extension — cannot do
this themselves: the extension's MCP settings screen shows server status and
offers no way to start the OAuth flow. Checked on extension 26.818, and it is
why the Manager's setup page tells them to ask you instead. So sign them in.

`codex mcp login <name>` is the command, one server at a time, for `google-ads`,
`lidfly` and `meta`. Two things it needs:

**Find the binary.** `codex` is not on the PATH of the shell you are given
unless the Manager installed the CLI separately, which the setup page does not
ask them to do. Try in this order and stop at the first hit:

```bash
command -v codex
readlink -f "$(command -v apply_patch)"          # Codex puts this on PATH; it points at its own binary
ls ~/.vscode/extensions/openai.chatgpt-*/bin/*/codex
ls /Applications/ChatGPT.app/Contents/Resources/codex
```

**Escalate.** The shell runs with `CODEX_SANDBOX_NETWORK_DISABLED=1`, and the
command both talks to the network and opens a browser. Request escalated
permissions with a one-line justification instead of reporting a sandbox error
as a failure.

The command waits for the Manager to finish in the browser, so it can outrun the
tool timeout. **A timeout here is not a failure and must not be retried** — the
browser flow may well have completed. Check the real state instead:

```bash
codex mcp list
```

The `Auth` column reads `OAuth` for a server that is signed in. Report per
server, name the ones that are still out, and offer to repeat only those. Tell
the Manager that Google will warn about an unverified app on the `google-ads`
flow — that is our own server, and **Advanced** → continue is correct.

## Identify the client first

Eight clients are supported and each reads a different file. Use available context, do not guess:

| Client | Config | Skills |
|---|---|---|
| Claude Code | `.mcp.json` | `.claude/skills` |
| Codex | `.codex/config.toml` | `.agents/skills` |
| Cursor | `.cursor/mcp.json` | `.agents/skills` |
| Gemini CLI | `.gemini/settings.json` | `.gemini/skills` |
| OpenClaw | `~/.openclaw/openclaw.json`, copied from `.openclaw/openclaw.example.json` | `.agents/skills` |
| VS Code | `.vscode/mcp.json` | none |

Never hand a Claude Code user a Codex config, or the reverse. Do not create a parallel config for a client that is not in use.

**Windsurf and Cline are not supported and have no config here.** If a Manager reports working in one of them, that is the fault: they load MCP but not skills, so every Provider's write tools arrive with none of the rules for using them. Point them at a supported client rather than reconstructing a config.

Two clients need a note the others do not. **OpenClaw** reads its config from the home directory, not the project: a correct `.openclaw/openclaw.example.json` proves nothing until it has been copied to `~/.openclaw/openclaw.json`. **Gemini CLI** reads `GEMINI.md` by default, so the root instructions reach it only through `context.fileName` in `.gemini/settings.json` — if that key is missing, tools work while every invariant is silently absent, which looks like a badly behaved agent rather than a configuration fault.

**VS Code does not load skills at all.** That is the design, not a fault: it does not read the SKILL.md format from the paths this repository generates. Never tell such a Manager to run `npm run sync`, and never diagnose absent skills as an error there. Say instead that this client has limited support, that write safety rules are not loaded, and that changes to campaigns should be made from a fully supported client.

## Meta: two failures that look alike and are not

**A tool unavailable for one ad account is the beta, not authorisation.** Meta's connectors are in open beta and tools are rolled out per ad account, so one connection can serve one cabinet fully and another only partly. Recognise it: other Meta calls succeed, other accounts succeed, and only some tools are missing for this one. There is nothing to fix on our side and re-authorising does not help. Say which tool is unavailable for which account and stop there.

**Meta's token does not expire weekly.** Do not carry the Google Ads answer across. Meta authorises through Facebook Login for Business and its sessions are long-lived, so an authorisation error a few days after signing in is *not* the routine expiry it would be for Google Ads. Treat it as a real failure and diagnose it: the connection was revoked, the Manager's access to that cabinet was removed in Business Manager, or the sign-in never completed. Reaching for "it has been a week, sign in again" here sends the Manager round a loop that fixes nothing.

When it genuinely is authorisation, one action:

> Re-authorise the `meta` server in your client and repeat the request.

If that succeeds and the account is still refused, the next thing to check is the Manager's access to that cabinet in Meta Business Manager. That is outside this repository and outside the agent — say so plainly rather than guessing at it.

## Diagnose in order

1. Is the remote endpoint configured in the current client's format? Transport must be HTTP/Streamable HTTP, never SSE.
2. Is MCP OAuth complete for the failing server?
3. Only after OAuth succeeds — are the server's tools listed?
4. Only after tools are available — is the Provider's own connection present? For LidFly check with `get_provider_context`; for Meta, whether the connection can list any ad account at all. None at all is a connection fault; some but not the wanted one is access in Business Manager, not a fault here.
5. Only after the connection works — are the project skills present, in sync, and is the checkout current with `origin/dev`?

Do not tie health to a fixed number of tools.

## States

**Waiting for OAuth.** The client shows `Failed` with an `Authenticate` or `Login` button. Give one action: press it, complete the browser sign-in, retry. Do not call this a timeout, do not discuss provider tools yet.

**Config missing or wrong.** Fix only the detected client's config, and in that client's own schema — the key is `mcpServers` in most, `servers` in VS Code, and the address field is `url`, `serverUrl` or `httpUrl` depending on the client. Google Ads and LidFly are separate entries; a broken one does not affect the other.

Neither server carries credentials — if you see an `Authorization` header or an API key in a config, that is the fault: it overrides OAuth. Third-party setup guides for VS Code and OpenClaw do suggest a static Bearer key, so a Manager may have added one in good faith. Report it without printing the value.

**Access denied for a specific Account.** Not an authorization layer problem. The server's allowlist *is* the Registry, so there is one thing to check, not two: does `registry_find_client` return this Client, and is the refused `customer_id` among the ids it gives? If it is not, the Account is not in the Registry, and that is the whole explanation. A newly signed Client is the usual cause; the fix is a row in the Registry, not a server change. Note the Registry refreshes every five minutes, so a row added a moment ago may take that long to take effect for `search_search` — a lookup by name sees it immediately.

**The Registry itself is unreachable.** The `registry_*` tools refuse outright, and calls to Accounts are refused with a message about the server not knowing which Accounts are allowed. This is a server-side fault, not the Manager's: the Registry sheet stopped being shared with the server's service account, was moved, or its columns were renamed. One action: tell the Manager the Registry is unreachable, ask them to name the `customer_id` directly if the work cannot wait, and report it to whoever administers the server. Do not diagnose OAuth here — it is unrelated, and re-authorising will not help.

A `warning` in a `registry_*` answer is a milder version of the same thing: the Registry is being served from a copy that could not be refreshed. Work continues; pass the warning on so someone checks the sheet.

**Connection timeout.** Diagnose this only after config is correct and OAuth is not waiting on the Manager. Retry one safe read. Never retry a write.

**Skills missing or stale.** Only for a client that loads skills at all — check the table above before reaching for this. Prove tools are available first, then compare that client's skills directory against `skills-source/` and suggest running `npm run sync`. Missing skills are not an OAuth or transport error.

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
