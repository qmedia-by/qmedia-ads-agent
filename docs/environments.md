# Environments

An **Среда** is the program a Manager runs the agent in. A **Модель** is the
network doing the work inside it. Supporting a Model is not a thing: "add
DeepSeek" means supporting OpenClaw or VS Code, where it runs. No
`.deepseek/` directory will ever be correct.

| Environment | MCP config | Skills | Root instructions |
|---|---|---|---|
| Claude Code | `.mcp.json` | `.claude/skills` | `CLAUDE.md` → `AGENTS.md` |
| Codex | `.codex/config.toml` | `.agents/skills` | `AGENTS.md` |
| Cursor | `.cursor/mcp.json` | `.agents/skills` | `AGENTS.md` |
| Gemini CLI | `.gemini/settings.json` | `.gemini/skills` | `AGENTS.md` via `context.fileName` |
| OpenClaw | `.openclaw/openclaw.example.json` | `.agents/skills` | `AGENTS.md` |
| VS Code | `.vscode/mcp.json` | `.agents/skills`, `.claude/skills` | `AGENTS.md` with `chat.useAgentsMdFile` |

A config per Environment costs ten lines and no maintenance; the schemas differ
but the addresses are one set, and `scripts/check-mcp-configs.mjs` keeps all
six pointing at the same three URLs with no static keys in place of OAuth.

## One Environment is offered to Managers

Since 2026-08-25 a Manager is told to install VS Code with the Codex extension
and nothing else. The six configs above stay. They cost ten lines each, the
development agent runs in Claude Code, and none of them is on a Manager's path
any more.

The reason is the shape of the old guide, not a fault in any Environment. It
asked someone who does not know what a terminal is to pick an Environment,
install it, and then find where that particular one hides MCP login — six
branches, each with its own way to fail, and every branch a support call. One
path can be written as nine numbered steps with screenshots; six cannot.

Codex is the one because it loses nothing. Checked on Codex CLI 0.147: a
project-level `.codex/config.toml` supplies all three MCP servers without
touching any file in the home directory, `.agents/skills` loads all ten skills,
and `AGENTS.md` is read. It also has the only mechanism here for keeping a
checkout current without a terminal — a `SessionStart` hook, which is why
`.codex/hooks.json` exists and no equivalent does for the other five.

The sign that this was wrong would be Managers asking for a different
Environment for a reason other than habit. The fix would be adding it back to
their documents; nothing would need adding to the repository, because nothing
was removed from it.

## Three skill directories, not five

A directory is created only where an Environment reads no one else's:
`.agents/skills` serves Codex, Cursor, OpenClaw and VS Code; `.claude/skills`
serves Claude Code; `.gemini/skills` serves Gemini CLI. Cursor also picks up
`.claude/skills` as a legacy path, so our skills reach it by two routes at once
— checked by hand on 3.15.6, no duplicates in the list.

This rests on someone else's guarantee. If Cursor stops reading `.agents/skills`
the skills vanish there silently and `npm test` stays green — nothing in this
repository would notice. The sign is Cursor offering no skill from the repo
while Codex sees them all; the fix is adding `.cursor/skills` as a fourth
target in `scripts/sync-skills.mjs`, about a minute's work, which is why the
risk was accepted.

Gemini CLI has one trap worth remembering: by default it reads `GEMINI.md`, not
`AGENTS.md`. We keep no second root file, so `.gemini/settings.json` carries
`context.fileName` instead. Without that line Gemini would connect to both
servers and run with no invariants at all, silently.

## Windsurf and Cline were dropped

They read MCP and not the SKILL.md format, so a Manager working there got every
Provider's write tools with none of the instructions for using them safely —
the read → plan → confirm → write order, VK's `goal_mode`, the ban on Direct's
legacy path. That could not be closed technically: the write tools belong to
LidFly and to Meta, and there is no way to disable a tool for one Environment.

While two write Providers went through a plan the Manager reads in a familiar
tool, this was an accepted risk carrying an honest warning in the Manager's
guide. Meta ended that. Its budget edits apply to a live account immediately —
no paused state, no confirmation screen of its own — so in an Environment with
no rules loaded, the plan that is supposed to precede them does not exist.

This page used to say what the sign would be that keeping them was wrong, and
that the fix was dropping the Environment rather than writing another file of
rules a client does not read. Widening the hole counted as that sign, and the
fix was taken. It cost nothing: nobody had deployed either one, so there was no
migration to arrange and nothing to announce.

VS Code stays, and the row above is about Copilot inside it — not about the
Codex extension, which is what Managers actually install and which reads skills
and `AGENTS.md` in full. Whether the Copilot gap is even real on a current
version is the open question below.

## Open question: VS Code is under-served

The table above reflects what VS Code does today: it reads skills from
`.github/skills`, `.claude/skills` and `.agents/skills`, and reads `AGENTS.md`
when `chat.useAgentsMdFile` is on. Two of those three directories this repo
already generates, so Copilot gets invariants and skills for free.

This no longer reaches a Manager either way: the guide names no Environments,
and the one they install is Codex. The question is now only about the table
above, and it stays open until someone confirms on a live version whether
`chat.useAgentsMdFile` is on by default. Note that Copilot in VS Code is a
different thing from the Codex extension running inside VS Code — the row above
is about the former.

## Weak Models drop instructions, and that is a design input

Instructions are text, not a switch. The weaker the Model, the more selectively
it follows them — the "Auto" model setting in Copilot and Codex is where this
shows first. A rule that only exists as prose is a rule a weak Model may skip.

This is not a caveat, it is a constraint on where rules are written: anything
whose loss produces a wrong answer belongs in a tool's response, which lands in
the context unconditionally. See
[changing-this-repo.md](./changing-this-repo.md#where-a-new-fact-belongs).
