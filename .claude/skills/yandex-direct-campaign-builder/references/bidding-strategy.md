# Стратегии и обучение

Read before answering anything about a campaign's strategy, its goals, or whether it has finished learning.

## Learning status is an estimate, not a reading

The public Direct API does not expose the learning status shown in the web interface. `get_strategy_learning_status` reconstructs it from the Reports API, so it is our estimate of what Direct is doing — not what Direct says it is doing.

Say so whenever you report it. If the tool and the Direct panel disagree, the panel is right; explain the limitation instead of arguing with it.

## Calling it

- For one named campaign, pass its exact `campaign_ids`. Do not call it for the whole Account and filter afterwards.
- Without a manual `goals` argument the tool derives targets from `BiddingStrategy` and `PriorityGoals`. Let it: derived targets match the campaign, invented ones do not.
- Passing `goals` manually overrides the derived targets and may not match the campaign's actual strategy at all. If you pass them, say in the answer that the numbers are calculated against goals you supplied.

## `GoalId=13` is not thirteen goals

`GoalId=13` is a Direct sentinel meaning «all priority goals». It is not a count and not a goal id you can look up. To say how many goals a campaign optimises for, count the actual `PriorityGoals` items.

## Undetermined is not fine

`status not determined` means the estimate did not converge — never report it as «learning is normal» or «everything is fine». It is expected, and still undetermined, when goals are summed across several targets, a package strategy is in use, the target is engaged sessions (`GoalId=12`), goals are incomplete, or the report was unavailable.

Name the reason if the answer gives one, and offer the Direct panel as the place to check.
