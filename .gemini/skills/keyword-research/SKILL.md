---
name: keyword-research
description: "Собрать семантику через Google Ads: идеи запросов, частотность и конкуренцию по региону и языку. Использовать, когда нужно собрать ядро или расширить список запросов для кампании."
---

# Keyword Research

Collects demand data from Google Ads. Grouping the result is a separate job — see the `keyword-clustering` skill.

Resolve the Account first with the `google-ads-context` skill.

## Ask before you collect

This repository keeps no memory between sessions, so you do not know the Client's market. Two inputs are required and must never be guessed:

- **region** — wrong region returns plausible numbers for the wrong country, and nothing in the output will reveal the mistake;
- **language** — determines which phrasings appear at all.

Ask for both if the Manager did not state them. Also ask, when it is not obvious: the product or service, the landing page, and any wording the Client is not allowed to use.

Note that Google Ads has not served Russia since 2022. If the Manager names Russia as the target market, stop and say so rather than returning an empty or misleading result.

## Region and language are ids, not names

`planning_generate_keyword_ideas` takes constants, not words. Look them up in `references/geo-targets.md`, which also carries the GAQL query for regions that are not listed there yet.

A request combines a seed with those constants:

```json
{
  "language": "languageConstants/1031",
  "geoTargetConstants": ["geoTargetConstants/2112"],
  "keywordSeed": { "keywords": ["seed phrase", "another seed"] }
}
```

At most 10 `geoTargetConstants` per call. Seeds can also come from a page (`urlSeed`) or from a page plus keywords (`keywordAndUrlSeed`) — a landing page usually produces better coverage than keywords alone, so ask for the URL when there is one.

## Workflow

1. Confirm Account, region and language.
2. Build 5–15 seed phrases from the product, the page and the way the Client's customers actually speak. Include synonyms and colloquial variants, not just the official product name.
3. Call `planning_generate_keyword_ideas`. Widen with new seeds drawn from the results if coverage looks thin.
4. Drop phrases that clearly belong to another business — but keep everything you are unsure about and flag it. Discarding demand is cheap to redo, discovering missed demand is not.
5. Deliver the table.

## Output

A flat CSV, one phrase per row, with columns:

`phrase, avg_monthly_searches, competition, top_of_page_bid_low, top_of_page_bid_high, cluster, intent, landing_page`

Leave `cluster`, `intent` and `landing_page` empty — `keyword-clustering` fills them in without spending any API quota. Bid fields come back in micros: divide by 1,000,000 and state the currency.

Say how many phrases were returned and which seeds produced them. If Google returned no volume for a phrase, leave the cell empty rather than writing zero — those are different facts.
