---
name: tool-update
description: "Обновить сам инструмент до свежей версии: подтянуть изменения из репозитория, когда Менеджер пишет «обнови инструмент» или «проверь обновления», а также когда агент ведёт себя не так, как описано в инструкции Менеджера."
---

# Tool Update

Bring the Manager's checkout up to date and tell them what to do next. This is
the one git operation a campaign session may perform. It stays a git operation:
never edit, create or delete a file in the repository here — that is
`repo-maintenance`, and it is a different request.

## Normally this already happened

A `SessionStart` hook runs the same update automatically at the start of every
chat. If the Manager is asking, one of three things is true: they are checking,
the hook was never trusted in Codex settings, or it failed. Do not assume the
first — if the update below finds nothing and the Manager expected something,
say that the automatic check may be switched off and point at step 7 of
[`docs/manager-setup.md`](../../docs/manager-setup.md) (Codex settings → Hooks →
**Trust**).

## The sequence

Read state, then act. Stop at the first line that does not hold.

```bash
git rev-parse --git-dir                       # a checkout at all?
git rev-parse --abbrev-ref HEAD               # must be dev
git fetch origin dev
git rev-list --count HEAD..origin/dev         # 0 means already current
git status --porcelain --untracked-files=no   # local edits to tracked files
git checkout -- .                             # only if the line above printed something
git merge --ff-only origin/dev
```

**Only on `dev`.** Any other branch means a developer is working in this
checkout; report the branch and change nothing.

**Discarding tracked edits is correct.** Nothing belonging to the Manager lives
in this repository — reports leave as files. Untracked files are the one thing
that might be theirs: leave them alone, and mention anything you discarded.

**Network is restricted in the sandbox.** `git fetch` can fail with a DNS or
connection error that is the sandbox, not the network. Re-run it with escalated
permissions and a one-line justification rather than reporting failure.

## What to tell the Manager

In Russian, in two sentences at most.

- Updated: say so, and say the new rules apply from the next chat — ask them to
  open **New chat**. This matters and is not decoration: instructions and skills
  are read once, at the start of a chat.
- Already current: say so plainly. Do not invent a changelog and do not
  paraphrase commit subjects — they are written for developers and mean nothing
  to a Manager.
- No `.git` directory: the folder was downloaded rather than cloned, so it can
  never update. Point at [`docs/manager-setup.md`](../../docs/manager-setup.md),
  step 5.
- `--ff-only` refused: histories diverged, which should not happen in a
  Manager's checkout. Do not force anything. Say that the tool needs attention
  from whoever maintains the repository.
