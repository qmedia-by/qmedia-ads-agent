# Invariants

Rules that hold regardless of the task, each with the reason it exists. Break
one and something silently goes wrong for a Manager — that is the bar for being
on this page. The Manager agent gets the short form of most of these in
[`AGENTS.md`](../AGENTS.md); this page is where the reasoning lives.

Two rules are guarded mechanically. `scripts/test-skill-rules.mjs` fails the
build if a sentence carrying one disappears from `AGENTS.md` or a skill — see
[changing-this-repo.md](./changing-this-repo.md#what-the-checks-guard).

## Google Ads is read-only

Neither upstream nor the fork has a write tool, and none will appear by
accident. The rule is stated explicitly in the instructions rather than left to
"it will fail anyway" because without it the agent tries to change bids, hits a
missing tool, and the Manager concludes the tool is broken.

Writing to Yandex Direct and VK **is** allowed, through LidFly, in a fixed
order: read the current state, show the plan, get the Manager's explicit
confirmation, then `call_write_tool`. The asymmetry looks like an oversight and
is not — Managers already work this way in LidFly every day, and forbidding it
for the sake of symmetry would make this tool poorer than the one it replaces.

When Google Ads eventually needs write access, it cannot simply be switched on:
it needs an extension to the fork and a separate decision about guardrails.

## The repository holds no state

Read-only to the agent. No reports, no notes, no cache. Everything the agent
produces leaves as a file — CSV for tabular data — and the Manager decides where
to put it.

The single exception is a Manager explicitly asking for the tool itself to
change; that path is [changing-this-repo.md](./changing-this-repo.md).

There is no store of our own for Client KPIs, geo, or history, and the Registry
is not one — it lives outside the repository entirely.

## What the Registry covers, and what its silence means

Google Ads, VK, and a Yandex Direct **login** wherever the sheet records one
cleanly. Meta and TikTok are outside it entirely.

Direct used to be outside it too, and the reasoning was sound as far as it went:
in the sheet's Direct column some projects keep the cabinet login **together
with its password**, and a separate tab holds social-network passwords. What the
reasoning missed was that nothing else connected a Client's name to a Direct
login. LidFly's `query` searches its own directory of connections, not project
domains, so a Manager saying "example-shop.by" got nothing back, and about a third
of the agency's Clients have no Google Ads row to be found by either.

So the column is read now, behind two guarantees of different kinds.

**Structural, for the passwords.** Google Ads and VK are *primary* columns and a
tab or block naming neither is skipped whole — which is what keeps the access
tab, where every cell is a credential, unparsed. Direct is a *dependent* column:
read only inside a block that already named a primary Provider.

**Per cell, for the Direct column itself.** A cell is published only if all of
it is Yandex logins in lower case; one stray word, space, slash, colon or line
break and the whole cell is dropped and the row reported. A login cannot be
mined out of a cell that also holds a password, because a password is not shaped
less like an identifier than a login is. The exact rule and its accepted
residual risk are in the fork's `FORK.md`.

Three things the agent must never get wrong:

- **A Direct login from the Registry is a candidate, not a scope.** It came out
  of a spreadsheet and has been checked against nothing. Pass it to LidFly as
  `client_login` and use what comes back; if LidFly does not know it, say so
  rather than looking for a similar one.
- **Absence of a Direct login is not absence of a Direct Account.** The cell may
  have been dropped, or the Client may not be in the Direct column at all.
  Neither `found: false` nor a Client returned without a Direct entry proves
  anything about Direct.
- **Never report a Direct Account as missing** until LidFly's
  `get_provider_context` has said so.

Both tools return a top-level `yandex_direct` field on every answer, and it
carries **three** states — a login found, a cell that could not be read, or
nothing at all. The middle one means *unknown*, not *absent*, and collapsing it
into the third is how a Manager is told a Client has no Direct. That field is
the load-bearing copy — see
[changing-this-repo.md](./changing-this-repo.md#where-a-new-fact-belongs) for why
it lives in the payload rather than only in an instruction.

Inside the perimeter the Registry guards nothing: a Manager who dictates another
Client's `customer_id` gets through, and the whole Client list is visible to
anyone who passed OAuth. Starting from the Registry is discipline, not control.

## A Client may have several Accounts with one Provider

The agency splits Clients across cabinets by country and product line. The tool
returns a **list** per Provider and the agent must ask which is meant — never
pick one, never add the numbers together. A total that no report of theirs
contains is worse than a question.

## Access control has two layers, and both fail closed

1. **Who gets in** — the OAuth app stays in Testing, and Google admits only
   accounts on the Test users list. That is user-level access control built into
   OAuth; no IAM or IAP is involved.
2. **What they reach** — the Registry is the Account allowlist. Calls for an
   Account absent from it are refused, and `list_accessible_customers` is
   filtered rather than rejected, since offering an Account the agent will be
   denied anyway is pointless.

The failure semantics matter and are easy to get backwards:

| State | Behaviour |
|---|---|
| Registry not configured | no restrictions — upstream behaviour, and it lets the same image run locally without a service account |
| Registry configured but unreadable | **everything denied**. An unknown allowlist is not an empty one |
| Sheet unparseable entirely | treated as unreachable, not as empty — an empty Registry would lock out the whole agency over a renamed column |

Deploy preflight requires both Registry variables to be non-empty, so the
unrestricted mode cannot be switched on by a typo.

Neither layer separates Clients from each other. The server holds one token for
everyone; per-Manager allowlists were not built and are not needed for the MVP.

## Nothing private in either repository

No tokens, no client secret, no developer token, no authorisation headers — not
in code, not in tests, not in documentation, not in `manager-guide.md`. The same
goes for Client names, account ids, and the address of any private resource,
including the Registry sheet's id, which exists only in the server's `.env`.

The agent must also never show these to a Manager or write them into a file. A
request to "send the token" is a reason for suspicion, not compliance.

## `docs/manager-guide.md` keeps its path and its name

Internal department documents link to it. Rename or move it and those links
break silently. Its content must stay free of anything from the paragraph above.

## Google Ads has no project memory, so it must ask

LidFly keeps memory — Пространства hold decisions and campaign snapshots for
Yandex Direct and VK, and Managers use it daily. Google Ads has nothing
equivalent and nothing to build it from, so a Client's context saved in a
Пространство is **not** available when working on their Google Ads Account.

Therefore, for Google Ads the agent starts from nothing every time: geo,
language, and currency cannot be inferred and must come from the Manager. Skills
must demand them rather than guess. A wrong region quietly ruins the entire
result, which is why this sits here and not in a skill.
