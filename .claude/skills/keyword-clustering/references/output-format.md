# Output Format

The deliverable is a flat CSV — one phrase per row, clusters as a column. Not a nested document.

Flat is deliberate: the Manager sorts and filters this in a spreadsheet, and nested structure makes that impossible. It also keeps the demand columns byte-identical to what `keyword-research` collected, so the two outputs stay comparable.

## Columns

```
phrase, avg_monthly_searches, competition, top_of_page_bid_low, top_of_page_bid_high, cluster, intent, landing_page
```

| Column | Filled by | Notes |
|---|---|---|
| `phrase` | research | verbatim, never rewritten |
| `avg_monthly_searches` | research | empty means no data, not zero |
| `competition` | research | LOW / MEDIUM / HIGH as returned |
| `top_of_page_bid_low` | research | account currency, already divided by 1,000,000 |
| `top_of_page_bid_high` | research | same |
| `cluster` | clustering | short human name, repeated across the cluster's rows |
| `intent` | clustering | one of the categories in `intent-and-minus-words.md` |
| `landing_page` | clustering | URL, or a description of the page to be built |

Never rewrite or normalise `phrase`: it is the join key against what Google actually returned.

## Negative keywords

A second CSV, not extra columns in the first:

```
phrase, level, reason, risk
```

`level` is account, campaign or group. `risk` is low, medium or high — how much relevant demand this negative might cost.

## Alongside the files

State the currency, the region and the language the core was collected for, and how many phrases came back with no volume data. Without those three, the numbers cannot be interpreted later by anyone — including you in the next session, since nothing is remembered between them.
