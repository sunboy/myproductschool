# Challenge: Checkout funnel drop-off

## Business context
The mobile checkout completion rate has been falling for three weeks. Revenue from
mobile accounts for 58% of order volume but 23% of completed purchases. The data
is in BigQuery. Thirty days of event-level logs are available.

## Your task
Work through three sub-problems using SQL, charts, and written analysis:

### Sub-problem 1 — Locate the drop (weight 30%)
Find the checkout step with the biggest conversion drop. Produce a ranked table
showing each step, the number of sessions that reached it, and the drop-off rate
to the next step.

### Sub-problem 2 — Find the segment (weight 40%)
Segment by device and region. Where does the drop concentrate? A comparative
table or chart comparing mobile, desktop, and tablet conversion at the critical
step is the expected artifact.

### Sub-problem 3 — Recommend a fix (weight 30%)
Recommend one product change based on what the data shows. Name the guardrail
metric you would monitor to detect a regression. A paragraph with a named metric
and a threshold is the expected artifact.

## Dataset
- BigQuery project: `hackproduct`
- Dataset: `case_001_checkout_funnel`
- Table: `events`

Run `bq show hackproduct:case_001_checkout_funnel.events` to inspect the schema,
or query the data dictionary at the top of the right-panel file tree.

## Time budget
30 minutes. The session timer is visible in the top bar.

## Workflow hints
- Start with a schema inspection query, not assumptions.
- Mark each sub-problem done in the right panel when you have a supporting artifact.
- You can paste SQL, describe a chart you produced, or reference a file in /workspace.