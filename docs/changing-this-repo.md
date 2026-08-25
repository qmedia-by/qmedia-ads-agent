# Changing this repository

You are here because a Manager asked for the **tool** to change, not for a
campaign task. That is the only case in which this repository is writable; every
other session treats it as read-only.

## Where a new fact belongs

Decide this before writing anything. Putting a rule in the wrong layer is the
most common way a change looks done and is not.

| Layer | Put a fact here when | Cost |
|---|---|---|
| **A tool's response** (the fork's payload) | losing it gives the Manager a wrong answer | needs a server change and a deploy |
| **`AGENTS.md`** | it is true in every session and dangerous to break | paid for in every session, including trivial ones |
| **A skill** | it applies to one Provider or one kind of task | loads only when the skill does |
| **`docs/`** | it is for the agent changing the tool | never loaded by a campaign session |
| **`manager-guide.md`** | a human needs to act on it | Russian, and nothing sensitive |
| **`manager-setup.md`** | it changes how a machine is set up | Russian, screenshots, no Environment choices |

**The first row is the rule that matters most, and it was learned the hard
way.** `registry_find_client` knew Yandex Direct lives in LidFly and said so in
two docstrings. A docstring is read *before* the call, mixed in with every other
tool; the answer is read *after*, as the reply to the question actually asked.
Agents on Auto Models got a Google Ads id, found no Direct, and either guessed
arguments at LidFly or told the Manager the Client has no Direct Account. Worse,
on a Registry miss the payload actively told the agent to report the Client as
unknown — false for the third of the agency's Clients who run Direct only.

So: **a fact whose loss produces a wrong answer is returned by a tool, not
stated in an instruction.** Instructions then repeat it, for the sessions that
never reach the tool, but they stop being the load-bearing copy. A skill is text
an Environment may not load and a Model may not choose; a tool's response lands
in the context every time, in every Environment, including the ones with no
skills at all. We control none of those; we control our own payload completely.

Two corollaries:

- Say the negative fact, not just the positive route. "Direct is not here" has
  to be in the answer, or its absence reads as "this Client has no Direct".
- Never encode an absence as an empty value. `"yandex_direct": []` inside
  `accounts` would read as "no Direct Account" — the exact false statement being
  prevented. It is a top-level field with words in it.

**Keep `AGENTS.md` under about a hundred lines.** It is read at every start, so
each line is paid for in sessions that only wanted keywords regrouped. It holds
Providers, write policy, Account selection, "the repository is read-only",
"artefacts go out as files", the stale-token route, and the skill map. Nothing
else. For scale: a neighbouring project's root file is 24 KB for one Provider
with one meta-layer; the same approach across four Providers would be near a
hundred kilobytes, and at that size an agent follows instructions selectively
and unpredictably.

`CLAUDE.md` is a **symlink** to `AGENTS.md`, not a copy — two files with the
same content diverge on the first edit.

## Editing skills

Edit `skills-source/` only. Everything under `.agents/`, `.claude/` and
`.gemini/` is generated:

```bash
npm run sync
```

Then, always:

```bash
npm test
```

A skill's `description` is its retrieval key — it is how a Model decides to load
it. Write it in the words a Manager actually uses, not in internal jargon. It
must be in Russian and under 500 characters; the body is English, for the Model.

References go in `<skill>/references/*.md` and must be linked from `SKILL.md` in
backticks; the lint checks both directions, so an unreferenced bundle fails.

### What the checks guard

| Script | Guards |
|---|---|
| `lint-skills.mjs` | frontmatter, `name` matching the directory, description language and length, references linked both ways, and that the generated copies match source |
| `test-skill-rules.mjs` | that specific load-bearing sentences still exist in `AGENTS.md` and in skills |
| `check-mcp-configs.mjs` | that all six Environment configs point at the same three URLs, are listed in `README.md`, and carry no static keys |

`test-skill-rules.mjs` is deliberately small. Add a rule only when losing the
sentence would put a false statement in front of a Manager or let the agent
write where it must not. Every extra check makes it more tempting to loosen a
regex than to fix the text.

### When CI runs them

Only on a pull request into `dev` — when it is opened, on every push to the
branch while it is open, and on reopen. Nothing runs on a branch without a PR,
and nothing runs on `dev` after a merge.

That last part is the trade. `npm test` is one cheap job, but it used to run
twice for the same work: once on the PR and again on the push that merged it,
and the `pull_request` trigger carried no branch filter, so a PR into anything
ran it too. Superseded runs on the same PR are now cancelled as well.

With no check on `dev` itself, the merge-time safety net has to be GitHub's:
**require a branch to be up to date before merging**. Without that setting, two
PRs that pass separately can still break `dev` together, and nothing here will
say so. The fork's CI has no such gap — its deploy workflow runs the whole suite
against the merge commit before shipping.

## Keeping the documentation honest

When behaviour changes, update in the **same change**: the skill or instruction
that carries it, [`manager-guide.md`](./manager-guide.md) if a Manager must act
differently, and whichever file in `docs/` owns the fact. The rules for these
documents — one home per fact, reasons beside rules, edit in place — are in
[README.md](./README.md#how-these-documents-are-kept).

Both Manager documents keep their paths and names; see
[invariants.md](./invariants.md#the-two-manager-documents-keep-their-paths).

## Changes that span both repositories

The order is fixed and reversing it breaks production:

1. Merge and deploy `google-ads-mcp`.
2. Verify against a real Client.
3. Only then merge `qmedia-ads-agent`.

The reverse order ships instructions that reference a server behaviour which
does not exist yet. The same ordering applied to the Registry migration, where
getting it wrong would have left Managers with no Registry at all.

## Maintaining the fork

Two independent axes, both of which bite on their own schedule:

- **Upstream releases.** The patch sits on a pinned commit, so every update
  means re-applying it. Keeping the delta minimal is what makes that survivable.
- **Google Ads API versions.** A major version lives about a year, then requests
  fail with `UNSUPPORTED_VERSION`. Do not defer the bump until semantics
  collection stops for the whole department at once.

Everything else about the server — environment variables, deployment,
preflight, the Registry parser, failure behaviour — is in the fork's `FORK.md`.
It is the authority; link to it rather than restating it here.
