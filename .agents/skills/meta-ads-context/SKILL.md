---
name: meta-ads-context
description: "Выбрать рекламный кабинет Meta и работать с кампаниями Facebook и Instagram: отчёты и инсайты, правка бюджетов, статусов, ставок и таргетинга. Использовать перед любой задачей по Meta — в том числе когда Клиента нет в Реестре или кабинет назван человеческим именем."
---

# Meta Ads Context

Use before any Meta task. Resolves which ad account to work in, and what may be done to it.

Meta is reached through its own server, `meta` — not through LidFly, which does not carry it, and not through the agency's Google Ads server, which only holds the Registry. Пространства do not exist for Meta: LidFly's memory covers Yandex Direct and VK only, so a Client's decisions and campaign snapshots saved there are **not** available here. Geo, language, KPI and audience history have to come from the Manager.

## The Account

Start at `registry_find_client`, the same as for Google Ads and VK. The answer carries a `meta` field on every call — read it, because it says which of three cases you are in and they do not mean the same thing.

- **An id under `meta` in `accounts`.** Ready to use. The Registry stores bare digits and Meta's own tools want `act_` in front of them, so pass `act_<digits>`.
- **The field says the cell could not be read.** Unknown, not absent. The cabinet almost certainly exists and the Registry row needs tidying — say which row, and resolve the account the other way, below.
- **The field says the Registry has nothing.** Also not absence. Resolve the other way.

**A Client absent from the Registry is not a refusal.** This is where Meta differs from Google Ads and the difference is easy to get backwards. For Google Ads the Registry is also the server's allowlist, so an Account missing from it is genuinely refused and refusing is correct. For Meta the Registry is **navigation only**: the cabinets that can be worked with are the ones the Manager's Meta Business Manager can see, and nothing in a spreadsheet of ours limits that. Never tell a Manager their Client has no Meta cabinet on the strength of a Registry miss, and never decline the task for want of a row.

When the Registry gives no id, ask Meta itself: list the ad accounts the connection can see and show the Manager the human names, then use the one they pick. Their names are Meta's own and current, which is why they are worth more here than a name copied into a sheet. Ask — never pick one because it resembles the Client's name.

More than one id, from either route, means the agency runs that Client through several cabinets. Ask which is meant. Never work across all of them and add the numbers up.

## Reading

The tool catalogue belongs to Meta and grows; discover it from the server rather than assuming. Read a tool's schema before its first call, as with any Provider here.

Three properties of an ad account decide whether a number means what it looks like, and all three are the account's, not the Manager's:

- **Currency**, and money in minor units — divide before reporting, and say which currency.
- **Time zone.** A "yesterday" in the account is not necessarily the Manager's yesterday.
- **Attribution window.** Conversions counted under one window are not comparable to conversions counted under another.

State all three beside any figure you report. An unstated attribution window is how two correct numbers turn into one wrong conclusion.

**Do not merge Meta and Google Ads into one total.** A combined report is fine and often what was asked for, but every row carries its source, currency, time zone and attribution window, and there is no "total conversions" line across Providers. The windows differ; the numbers do not add up, and a number in a file outlives the conversation that explained it.

## Writing

**Existing entities may be changed. Nothing new may be created.** Budgets, statuses, bids and targeting on campaigns, ad sets and ads that already exist — yes. Never create a campaign, ad set or ad, and never activate an entity somebody else created in a paused state. Creation pulls in creatives, Pages, Instagram accounts and catalogues; it is a separate decision that has not been made. Meta's server does expose creation tools — `ads_create_campaign`, `ads_create_ad_set`, `ads_create_ad` and the activation that follows them — and their being available is not permission to use them.

If the Manager asks for a new campaign, say plainly that the agent does not create them in Meta and that it has to be done in Ads Manager. Do not promise it for later in the session.

Every change follows the same order as VK and Yandex Direct, and it is not optional:

1. **Read** the current state of the exact entities you are about to touch.
2. **Show the plan** — every entity, every field, the value now and the value after.
3. **Get the Manager's explicit confirmation.** Silence is not confirmation, and neither is an earlier "yes" to a different change.
4. **Write**, then read back and report what actually changed.

**Budget changes need the old value, the new value and the currency in the plan**, every time. Meta applies a budget edit to a live account immediately — there is no paused state to catch it and no confirmation screen of its own, unlike entity creation. The plan is the only place the Manager sees the change before it is real.

There is no percentage limit above which a change is refused. A number like that goes stale, and it invites the change to be split in two rather than reconsidered. The protection is that the Manager saw both values and said yes.

## The beta, and what it is not

Meta's connectors are in open beta and tools are rolled out per ad account. A tool that is unavailable for one account while the connection is healthy is that rollout, **not** an authorisation failure and not a broken account. Do not send the Manager to re-authorise over it, and do not work around it in another cabinet. Say which tool is unavailable for which account and stop there. Anything that is genuinely an authorisation or connection failure goes to `connection-doctor`.

## Output

Name the Client in words and state which ad account was used, with its id, so the Manager can check you worked in the right cabinet. Mark any figure you estimated rather than read. Never print access tokens or authorisation headers, and never write them into a file.
