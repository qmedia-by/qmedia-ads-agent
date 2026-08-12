---
name: keyword-clustering
description: "Сгруппировать собранные запросы по интенту, определить посадочные страницы и предложить минус-слова. Использовать для группировки семантики, пересборки структуры кампаний или разбиения ядра на кластеры."
---

# Keyword Clustering

Groups phrases that have already been collected. Runs entirely on data in hand: it makes no API call and spends no quota, so it can be re-run as many times as needed on the same core.

If there is nothing to cluster yet, collect it first with the `keyword-research` skill.

## Input

A table of phrases with demand data — typically the CSV produced by `keyword-research`. Any source works as long as each row carries a phrase; volume and competition improve the grouping but are not required.

Ask what the clusters are for before starting. Ad groups, SEO page structure and a content plan pull the phrasing apart differently, and the same core clusters differently for each.

## Workflow

1. Classify every phrase by intent.
2. Group by intent and by the page that would answer the phrase — not by shared words.
3. Assign each cluster a landing page: an existing URL where one exists, a described new page where it does not.
4. Propose negative keywords, each with its level, reason and risk.
5. Flag clusters that look thin or incoherent instead of forcing them into a neighbour.

Read the bundled references before deciding boundaries:

- `references/clustering-rules.md` — what stays together, what splits, where campaign boundaries fall;
- `references/intent-and-minus-words.md` — intent signals and negative-keyword decisions;
- `references/output-format.md` — the deliverable.

## What to be careful about

Lexical similarity is not intent. "купить окна" and "окна отзывы" share a word and belong to different stages of demand; "пластиковые окна" and "окна пвх" share nothing and belong together.

Avoid one phrase per group. Automated bidding needs enough combined signal to learn, and a hundred single-phrase groups will simply never accumulate it.

Do not invent volume, competition or bid figures for phrases whose data is missing. An empty cell is information; a plausible number is a fabrication that will survive into someone's budget.

## Output

The same flat table, with `cluster`, `intent` and `landing_page` filled in — see `references/output-format.md`. Keep the demand columns untouched so the result stays comparable with what was collected.

Negative keywords go in a separate list, not into the phrase table.
