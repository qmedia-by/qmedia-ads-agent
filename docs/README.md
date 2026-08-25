# Documentation map

## Two agents use this repository

The same checkout is opened by two kinds of agent, and almost nothing is true
for both. Keeping their instructions apart is the point of this layout: a
campaign session must not pay for maintenance rules, and a maintenance session
must not be steered by campaign rules.

| | **Manager agent** | **Development agent** |
|---|---|---|
| Asked to | run campaigns: semantics, reports, audits, builds | change the tool: skills, instructions, docs, configs |
| Writes to | nothing in the repo — artefacts go out as files | the repo, and only the repo |
| Reads | [`AGENTS.md`](../AGENTS.md), [`CONTEXT.md`](../CONTEXT.md), the nine task skills | this folder, via the `repo-maintenance` skill |
| Loaded | every session | on demand, when the Manager asks for a change |

The routing between them is one line in `AGENTS.md`: a request to change the
tool sends the agent to `repo-maintenance`, which sends it here. Everything
below is written for that second agent. The exceptions are [`manager-setup.md`](./manager-setup.md) and
[`manager-guide.md`](./manager-guide.md) — Russian, written for the humans who
use the tool.

## Map

| File | Answers |
|---|---|
| [architecture.md](./architecture.md) | What exists, how the pieces connect, what was rejected |
| [invariants.md](./invariants.md) | What must not be broken, and why |
| [providers.md](./providers.md) | Per-Provider facts: access, identifiers, memory, limits |
| [environments.md](./environments.md) | The six Environments, what each one reads |
| [changing-this-repo.md](./changing-this-repo.md) | How to make a change, and where a new fact belongs |
| [manager-setup.md](./manager-setup.md) | Russian, for humans. Setting a machine up from nothing |
| [manager-guide.md](./manager-guide.md) | Russian, for humans. Tasks and troubleshooting |

Terminology is in [`CONTEXT.md`](../CONTEXT.md) — Провайдер, Аккаунт, Клиент,
Менеджер, Реестр, Среда, Модель, Пространство. Use those words; the Manager
agent answers in Russian and these are the Russian words it answers with.
`CONTEXT.md` stays at the root rather than moving here because it is loaded with
the root instructions every session, not consulted like a reference.

## How these documents are kept

They replaced a folder of thirteen dated ADRs. That format failed here for
reasons worth not repeating: records were appended rather than edited, so a
decision that later changed left the old file standing as a lie — `0008` claimed
a Client absent from the Registry has no reachable Account, and `0012` claimed
VS Code cannot read skills. Both were false by the time anyone relied on them.
And because records were filed by decision event rather than by topic,
answering "how does the Registry work" meant reading four of them and guessing
which was current.

The rules that follow exist to stop that recurring:

1. **One topic per file**, named as the question it answers.
2. **A fact has exactly one home.** Other files link to it and never restate it.
   Two copies of a fact become two different facts the moment one is edited.
3. **The reason lives beside the rule**, in the same file and the same edit. A
   rule whose justification sits in a separate document gets edited without it.
4. **Edit in place.** No dated records, no "superseded by", no history. Git
   holds the history; these files hold what is true now.
5. **A rejected alternative is worth one line**, in
   [architecture.md](./architecture.md#alternatives-rejected) — enough to keep it
   from being proposed again, not a document of its own.
6. **English here, Russian in the two Manager documents and `CONTEXT.md`.**
