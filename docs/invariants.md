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

**Meta sits between the two, and the line runs through creation.** Budgets,
statuses, bids and targeting on entities that already exist may be changed,
under the same read → plan → confirm → write order. Campaigns, ad sets and ads
may not be created. That line is not where the server's capabilities end —
`ads_create_campaign` and its neighbours are there and would work — so it holds
only as long as the sentence carrying it stays in `AGENTS.md` and in
`meta-ads-context`, which is why `test-skill-rules.mjs` guards both. Creation
pulls in creatives, Pages, Instagram accounts and catalogues; it is a separate
decision, and nobody has made it.

One thing about Meta writes has no counterpart elsewhere: **a budget edit
applies to a live account immediately**. Creation lands paused and needs a
separate activation, and LidFly writes are reviewed in a plan the Manager reads
in a familiar tool. A budget change has neither, so the plan must name the old
value, the new value and the account currency every time. There is deliberately
no percentage above which a change is refused: a threshold goes stale, and it
invites splitting one edit into two rather than reconsidering it.

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

Google Ads, VK, Meta, and a Yandex Direct **login** wherever the sheet records
one cleanly. TikTok is outside it entirely.

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

## The Registry is a boundary for Google Ads and navigation for everyone else

One sheet, two jobs, and reading the second as the first is how an agent
refuses work it should have done.

For Google Ads the Registry **is** the allowlist. The server holds the agency's
developer token, the endpoint is public, and a mistyped `customer_id` would
otherwise reach another agency's numbers — so an Account absent from the sheet
is refused, and refusing is correct.

Every other Provider is on somebody else's server. LidFly decides what a
`client_login` reaches; Meta decides which cabinets a Manager's Business
Manager can see. Nothing written or not written in our spreadsheet changes
either. There the Registry does one job only: it turns a Client's name into an
identifier faster than asking would. When it cannot, the answer is to ask the
Provider — never to conclude the Account does not exist, and never to decline.

The failure this prevents is specific and was worth writing down: an agent that
has learned "not in the Registry means refused" from Google Ads carries it to
Meta, tells the Manager their Client has no cabinet — which this sheet is in no
position to know — and stops. That is why `registry_find_client` says it in the
payload rather than only here, and why `AGENTS.md` repeats it: see
[changing-this-repo.md](./changing-this-repo.md#where-a-new-fact-belongs).

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

## Providers without memory have to ask

LidFly keeps memory — Пространства hold decisions and campaign snapshots for
Yandex Direct and VK, and Managers use it daily. Google Ads and Meta have
nothing equivalent and nothing to build it from, so a Client's context saved in
a Пространство is **not** available when working on their Accounts there.

Therefore, for Google Ads and Meta the agent starts from nothing every time:
geo, language, currency and KPI cannot be inferred and must come from the
Manager. Skills must demand them rather than guess. A wrong region quietly
ruins the entire result, which is why this sits here and not in a skill.

Meta adds two of its own that behave the same way, because they belong to the
ad account rather than to the Manager: its **time zone** and its **attribution
window**. A figure reported without them looks comparable to a Google Ads
figure and is not.
