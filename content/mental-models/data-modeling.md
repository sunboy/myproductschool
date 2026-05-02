# Mental Models Framework — Data Modeling
## How Expert Data Thinking Maps to FLOW

**Version:** 1.0
**Date:** 2026-05-01

---

## 1. Why This Doc Exists

Behind every table is a thing in the world that the table is trying to represent. When the representation is wrong, the queries are wrong, the reports are wrong, and the engineers who come after inherit a data model that fights them at every turn. This doc maps four data traditions into FLOW's rubric criteria and competency dimensions, so that Hatch's feedback on a data modeling challenge connects to the underlying reasoning move, not just to "your schema is incorrect." The goal is to build a learner who can name why a schema is wrong before trying to fix it: the entity wasn't identified correctly, the grain was set at the wrong level, the normalization decision wasn't a decision at all, or the model was designed for the source system instead of the query. No thinker names appear in the product. The frameworks surface as reasoning patterns.

---

## 2. The Competency Taxonomy

### `entity_identification`

**What it measures:** Recognizing the real-world things a data model is trying to represent, before designing the tables that represent them.

A table is not a thing. It's a representation of a thing. Entity identification is the move of stepping back from the schema design and asking: what is this data actually about? What are the real-world objects, events, and relationships that need to be tracked? The discipline is separating the source system's representation (how the data arrives) from the conceptual model (what the data means).

**Failure mode it prevents:** Modeling the source, not the domain. A learner who designs tables to match an API response or a CSV export, rather than asking what the underlying entities are, will produce a model that is brittle to source changes and difficult to query across entities.

**Sample coaching language:**
"You have an `order_items` table, but what is an order item, really? Is it a product at a point in time, a price commitment, or an inventory allocation? The answer changes what columns belong in the table and how it relates to `products`."

"You copied the API response structure into a table. That model breaks the moment the API versioning changes. What's the entity behind the API response?"

**Reasoning move:** Name the thing before naming the table.

---

### `normalization_judgment`

**What it measures:** Knowing when to normalize, when to denormalize, and, critically, making that a deliberate choice rather than an accident.

Normalization eliminates redundancy and preserves referential integrity. Denormalization trades those properties for read performance or query simplicity. Normalization judgment is the discipline of knowing which trade-off the use case requires, stating it explicitly, and not arriving at the answer by accident or by habit.

**Failure mode it prevents:** Normalization as a reflex (normalize everything because that's what relational means) or denormalization as a reflex (flatten everything for performance). Both are failures of reasoning. The learner who cannot say why they normalized a particular relationship cannot justify the schema when the query patterns change.

**Sample coaching language:**
"You've denormalized the product name into `order_items`. Is that a decision you made, or a shortcut? What's the update anomaly you're accepting, and when does it matter?"

"You normalized this to 4NF. The query that matters most joins seven tables to answer. Was that trade-off named when you made the normalization decision?"

**Reasoning move:** Normalization is a decision, not a default. Name what you're trading and why.

---

### `grain_definition`

**What it measures:** The ability to state precisely what one row in a table means, and to hold that definition consistently across every column in the table.

The grain of a table is the single most important decision in data modeling. It answers the question: at what level of detail does this table represent the world? One row per order? One row per order-item? One row per order-item per day? If the grain is wrong, or undefined, the table becomes a trap: queries produce double-counting, joins produce fans, and aggregates produce numbers no one can explain.

**Failure mode it prevents:** Grain drift. A learner who doesn't state the grain explicitly will add columns that violate it, a dimension attribute added to a fact table, a fact column added to a dimension, a header attribute mixed with a line-item attribute. The table becomes ambiguous and the queries that use it become wrong in subtle ways.

**Sample coaching language:**
"Tell me what one row in `user_events` means. One event per user per session? One event per user per action type per day? The grain determines which aggregations are valid."

"You have `total_revenue` on the `orders` table and also on the `order_items` table. Which one is the fact? The grain of these two tables is different, what does that mean for how they're joined?"

**Reasoning move:** State the grain before adding any columns. Every column must be true at that grain.

---

### `query_pattern_awareness`

**What it measures:** Designing a data model for the questions it will be asked, not for the source it was built from.

Data models are read far more than they are written. A model that is normalized for correct updates but produces 12-table joins for the most common analytical query is a model that was designed for the source, not for the reader. Query pattern awareness is the discipline of starting from the questions, what will analysts, engineers, and product features need to ask?, and working backward to the schema that makes those questions easy to answer.

**Failure mode it prevents:** Source-oriented modeling. The learner designs a perfectly normalized schema that mirrors the operational system, without asking what the downstream query patterns are. Reports require expensive transformations, dashboards require workarounds, and every new question requires a schema change.

**Sample coaching language:**
"You've modeled this correctly for writes. Walk me through how a product analyst answers 'what was the 7-day retention for users who signed up in January?' on this schema."

"Your grain is one row per raw event. The most common question is 'daily active users.' How many steps does it take to answer that from your schema? What does that tell you about the grain decision?"

**Reasoning move:** Model for the question, not the source.

---

## 3. The Thinker Traditions Absorbed

### RELATIONAL THEORY

**Contribution:** Normalization eliminates redundancy and preserves dependencies. Normal forms are proofs about which updates are safe.

The relational tradition starts from a mathematical claim: a relation (table) should represent exactly one subject, and the columns in that relation should describe nothing but that subject. Every departure from this principle creates an update anomaly, a place where changing one fact requires changing it in multiple places, and where inconsistency becomes possible.

The normal forms (1NF through BCNF, 3NF in practice) are not aesthetic preferences. They are proofs. A table in 3NF is a table where you can guarantee that changing any non-key attribute does not silently corrupt the values of other non-key attributes. This is the mathematical foundation that makes a relational database trustworthy.

What this tradition contributes to FLOW is the reasoning discipline behind normalization decisions. Not "normalize everything" but "know which update anomalies you're preventing and which you're accepting." The key test is always: if I update this fact in one row, are there other rows that now contain a contradictory value? If yes, the schema is not normalized.

**Absorbed:**
- Update anomaly identification as the primary diagnostic for normalization decisions
- Functional dependency reasoning: which columns determine which other columns?
- Primary and foreign key design as a commitment to referential integrity

**Left Behind:**
- Higher normal forms beyond BCNF (4NF, 5NF, DKNF). Theoretically complete; rarely encountered in practice. The FLOW rubric grades the reasoning behind normalization decisions, and the practical ceiling is 3NF/BCNF reasoning.

**Reasoning move:** Every normalization decision prevents a specific update anomaly. Name the anomaly.

---

### DIMENSIONAL

**Contribution:** Design for the question, not the source. The grain is the most important decision in analytics modeling.

The dimensional tradition is the discipline of designing data for analysis, not for operations. Operational data models optimize for correct transactional updates. Dimensional models optimize for analytical queries, the kind where you filter on dimensions (product category, user geography, signup cohort) and aggregate facts (revenue, events, sessions) across them.

The central insight is grain definition. Before any column is added to a fact table, the modeler must state what one row represents. One sale per transaction? One revenue line per order-item? One user event per session action? The grain is the contract that every downstream query depends on. Violate it, by mixing grains in one table, or by adding fact columns to a dimension, and the queries that depend on it become wrong in ways that are hard to diagnose.

This tradition also contributes the slow-changing dimension problem: things in the world change over time (users change their region, products change their category), and a data model that doesn't handle this makes historical analysis wrong by default. The discipline is explicit: for each dimension, decide whether you care about historical accuracy and, if so, which SCD strategy you're using.

**Absorbed:**
- Star schema as the canonical analytical model shape: one fact table, multiple dimension tables
- Grain as the first decision in fact table design, not an afterthought
- Slowly changing dimensions as an explicit design decision, not a problem to discover in production

**Left Behind:**
- Snowflake schema and highly normalized dimension tables. Theoretically cleaner than star schema; practically slower for the queries analysts actually write. FLOW grades modeling decisions at the grain and join-path level, not at snowflake vs. star.

**Reasoning move:** State the grain. Design for the question. Handle change explicitly.

---

### ENTERPRISE WAREHOUSE

**Contribution:** Conformed dimensions are how organizations agree on what they mean.

The enterprise warehouse tradition starts from an organizational problem, not a technical one: in a large organization, "customer" means different things to the sales team, the support team, and the product team. If each team builds its own data model, the organization cannot answer cross-functional questions ("what was the support cost for our top 100 customers last quarter?") because the definition of "customer" is different in each team's data.

Conformed dimensions are the solution: a single, authoritative definition of each shared entity that all downstream data products agree to use. A conformed `customer_dim` means that when the sales dashboard and the support dashboard both filter on customer, they're filtering on the same thing. The technical implementation is less important than the organizational agreement it encodes.

This tradition also contributes the bus architecture insight: if you define your facts and dimensions first, you can route any combination of data through the same dimensional infrastructure. This is why the enterprise warehouse tradition resisted the move to team-specific data marts, local optimization defeats global consistency.

**Absorbed:**
- Conformed dimensions as the primary tool for cross-functional analytical agreement
- The data warehouse bus architecture: design dimensions first, route facts through them
- The distinction between fact tables (measurements) and dimension tables (context)

**Left Behind:**
- The full enterprise data warehouse governance model (data stewardship committees, master data management programs). The reasoning move (define shared entities before building local models) is gradeable; the governance bureaucracy is organizational change management, not a modeling reasoning pattern.

**Reasoning move:** Agree on what each entity means before modeling it. Shared definition is the product.

---

### MODERN STACK

**Contribution:** Storage, compute, and modeling are separate concerns. Models become reviewable, tested code.

The modern data stack tradition separates what used to be one thing into three distinct concerns. Storage: where the raw data lives (cheap, scalable cloud storage). Compute: where transformations happen (on-demand, separate from storage). Modeling: how raw data becomes analysis-ready data (version-controlled SQL, tested like software).

The key contribution for FLOW is treating data models as code: reviewable, versioned, tested, and decomposable into layers. A raw layer contains the source data untouched. A staging layer cleans and conforms it. A marts layer applies business logic for specific analytical use cases. Each layer has a defined grain and a defined contract with the layers that depend on it.

This tradition also contributes the documentation-as-schema discipline: a model without a description of its grain, its source, and its intended use case is a model that will be misused. When models are code, their documentation is part of the commit.

**Absorbed:**
- Layered modeling: raw, staging, and marts as distinct concerns with defined contracts
- Testing as a first-class modeling practice: row count tests, primary key uniqueness tests, referential integrity tests
- Documentation as part of the schema: grain, sources, and intended use case in the model definition

**Left Behind:**
- Specific tool configurations and orchestration patterns (specific dbt macros, Airflow DAG design). These are implementation details that change with the tooling. The reasoning move (model as code, test model assumptions) applies regardless of which tool implements it.

**Reasoning move:** Models are code. They should be testable, documented, and layered by concern.

---

## 4. Competency x FLOW Step Mapping

This is the connective tissue between the grading system and the mental models. The grading rubric encodes these mappings. Every challenge feedback page renders the relevant mappings for the steps the user completed.

| Step | Competency | The reasoning move being built |
|---|---|---|
| FRAME | `entity_identification` | Name the domain entities before naming any tables or columns |
| FRAME | `grain_definition` | State what level of detail the model must represent and why |
| FRAME | `query_pattern_awareness` | Identify the downstream questions the model must answer before modeling |
| LIST | `entity_identification` | Generate a complete list of entities and relationships before committing to a schema |
| LIST | `normalization_judgment` | List the normalization options and the anomalies each one accepts or prevents |
| LIST | `query_pattern_awareness` | List the query patterns that will constrain the schema design |
| OPTIMIZE | `normalization_judgment` | Choose a normalization level and name the anomaly you're accepting in exchange |
| OPTIMIZE | `grain_definition` | Commit to a grain for each fact table and verify each column is consistent with it |
| OPTIMIZE | `query_pattern_awareness` | Evaluate each schema option against the key query patterns, not just correctness |
| WIN | `grain_definition` | State the committed grain for each table in the final recommendation |
| WIN | `normalization_judgment` | Justify the normalization decision with the specific trade-off it encodes |
| WIN | `entity_identification` | Show that all required entities are represented and the relationships are correct |

---

## 5. The Four FLOW Steps for Data Modeling

### Frame, Name the domain and the questions before naming any tables

Frame in data modeling is the move of refusing to design a schema until you understand what the model is for. What entities does the domain contain? What questions will analysts and features ask of this data? What grain does the use case require? These questions precede the first column name.

A Frame done poorly in data modeling produces a schema that mirrors the operational source system, columns that match API field names, tables that match microservice resource shapes, without asking whether that representation serves the analytical or product use case. Frame done well identifies the entities, the key relationships, and the primary query patterns before the first CREATE TABLE.

**Rubric criteria:**

- **F1, Entity naming:** Identify the real-world things the model must represent. Not "table names", the underlying domain entities. What are the subjects? What are the events? What are the relationships?
- **F2, Query requirement framing:** Name two to three key questions the model must be able to answer efficiently. These become the test cases for the schema.
- **F3, Grain requirement:** State at what level of detail the model must represent the world. One row per what?
- **F4, Source vs. domain distinction:** Identify where the source system's representation diverges from the domain model. What must be transformed, not just loaded?

**Anti-patterns:**
- Copying the API or application schema directly into the analytical model
- Designing tables before naming what queries they must support
- Treating all entities as equal without identifying which ones are facts and which are dimensions

**Reasoning move:** Name the domain first. Tables come after entities, not before.

---

### List, Map the entities, relationships, and normalization options

List in data modeling is the move of laying out the modeling choices before committing to a schema. What are all the entities and their relationships? What normalization options exist for each relationship, and what does each option trade? What are the candidate schemas that could answer the key queries?

Good listing in data modeling includes the normalization alternatives explicitly. Not just "here is the schema" but "here is the normalized version (prevents update anomalies, requires joins), here is the denormalized version (faster queries, risks inconsistency), and here is the decision I need to make between them."

**Rubric criteria:**

- **L1, Complete entity inventory:** Name all entities and their relationships before committing to a schema. Missing entities at List time become missing joins at query time.
- **L2, Normalization options:** For each key relationship, list the normalized and denormalized options with the anomaly or performance implication each carries.
- **L3, Grain candidates:** If there is ambiguity about grain (could be per-event or per-session, per-item or per-order), list the candidate grains and what each one enables and forecloses.

**Anti-patterns:**
- Jumping to a single schema without exploring alternatives
- Listing columns without reasoning about the relationships they represent
- Omitting the grain decision from the list of modeling choices

**Reasoning move:** List the modeling alternatives. Include the grain as an explicit choice, not an assumption.

---

### Optimize, Commit to grain, normalization level, and query strategy

Optimize in data modeling is the move of choosing between modeling alternatives while naming the trade-off each choice encodes. Every schema decision is a choice: normalize to 3NF and accept that the query joins four tables, or denormalize and accept that updates require maintaining consistency across multiple rows. The engineering discipline is making that choice explicitly and stating what it costs.

Optimize done poorly is "I'll normalize it properly." Optimize done well is "Third normal form here prevents price drift across historical orders. The join cost is acceptable because this query runs on an analytical warehouse, not a transactional database."

**Rubric criteria:**

- **O1, Normalization rationale:** State the normalization level and the specific anomaly it prevents. Not "it's normalized" but "this is 3NF, which prevents the price update anomaly in historical orders."
- **O2, Grain commitment:** State the committed grain for each fact-like table and verify it's consistent across every column. Flag any column that doesn't belong at that grain.
- **O3, Query path evaluation:** Show that the key queries from Frame can be answered efficiently on the chosen schema. If a key query requires a cross-grain join or a 12-table path, that's a signal the grain or normalization decision is wrong.
- **O4, Change handling:** Name how the schema handles change over time for each key entity. SCD strategy, event-append, or snapshot, each is a trade-off.

**Anti-patterns:**
- Normalizing or denormalizing by instinct without naming the trade-off
- Committing to a schema without verifying the key queries against it
- Ignoring how the schema handles historical changes

**Reasoning move:** The grain is a contract. Every column must honor it.

---

### Win, Make the schema recommendation with the grain stated and the trade-offs named

Win in data modeling is the move of committing to a specific schema, at the level of tables and relationships, with the grain stated for each table and the normalization decision justified. The recommendation names what the schema is optimizing for, what it's accepting as a consequence, and what would require revisiting the schema.

A Win without a stated grain is not a recommendation, it's a draft. A Win without a named trade-off is advice, not a design decision.

**Rubric criteria:**

- **W1, Grain statement:** State the grain of each fact or event table in the recommendation. One row per what.
- **W2, Normalization justification:** State the normalization decision and the trade-off it encodes for the key relationships. What anomalies are prevented? What join costs are accepted?
- **W3, Query verification:** Show that the key queries identified in Frame can be answered on this schema, with at most two to three joins for the primary access patterns.
- **W4, Evolution path:** Name what would cause the schema to need to change, and in which direction. What's the signal that the grain decision needs to be revisited?

**Anti-patterns:**
- Presenting a schema without a grain statement
- Justifying a design by saying "it's more normalized" without naming what that prevents
- Leaving "how do we handle historical changes?" as a future problem

**Reasoning move:** State the grain. Name the trade-off. Show the query path works.

---

## 6. How This Surfaces in the Product

### a. Per-MCQ Option Explanations

Each answer option shows which reasoning move it demonstrates or violates. The explanation has two layers:

**Layer 1, What this option does right or wrong (rubric layer):**
> "Denormalizing the product name into `order_items` removes a join from the common query path. But it also means that if the product name changes, every historical order row either shows the old name or must be updated. Whether that's acceptable depends on whether the use case requires point-in-time accuracy for historical orders."

**Layer 2, Which reasoning pattern it's building (framework layer):**
> Normalization Judgment: The question isn't 'denormalize or normalize.' It's 'which update anomaly are we accepting, and is that anomaly acceptable for this use case?'

For wrong answers:
> "Adding `total_revenue` to the orders table and also to `order_items` means the revenue grain is ambiguous. Which table is the source of truth? This is a grain violation, two tables claiming to represent the same measurement at different granularities."
>
> Grain Definition: Every column in a table must be true at the table's grain. If you have revenue at both order and order-item grain, one of them doesn't belong where it is.

---

### b. Per-Step Grading Output

Hatch's step-level feedback includes a `competency_signal` block alongside the standard `detected` / `missed` / `coaching` output:

```json
{
  "score": "partial",
  "criteria_scores": { "F1": "strong", "F2": "partial", "F3": "needs_work", "F4": "needs_work" },
  "detected": "You named the entities correctly, order, order item, product, customer. The relationships are mostly right...",
  "missed": "You didn't state the grain before naming the schema. The `user_events` table has columns that belong at event grain and columns that belong at session grain, that's a signal the grain wasn't defined before the columns were added.",
  "coaching": "Entity identification is strong. The missing move is grain definition, state what one row means before adding any columns. A mixed-grain table is a source of silent query errors.",
  "competency_signal": {
    "primary": "grain_definition",
    "signal": "You found the entities. The next level is naming the grain before adding columns. One row per what? The answer to that question determines which columns belong and which ones violate the grain.",
    "framework_hint": "Grain Definition: the grain is the contract. Every column in a table must be true at that grain, not sometimes, not usually, always."
  }
}
```

---

### c. Post-Challenge Mental Models Breakdown

After completing all four FLOW steps, the feedback page shows a map from this challenge back to the reasoning moves being built:

```
What you were building in this challenge
─────────────────────────────────────────

FRAME   →   Entity Identification + Query Pattern Awareness
            You were practicing: name the domain before naming
            the tables. What are the real-world things this model
            represents? What questions must it answer? Those two
            moves constrain everything downstream.

LIST    →   Normalization Judgment + Grain Definition
            You were practicing: lay out the modeling alternatives
            before choosing. What does normalized look like here?
            What does denormalized look like? At what grain does
            each option represent the data? The decision comes after
            the options are visible, not before.

OPTIMIZE →  Grain Definition + Query Pattern Awareness
            You were practicing: commit to a grain and verify that
            the key queries can be answered. If the query requires
            six joins to answer a question that will run thousands
            of times a day, the grain decision is wrong.

WIN     →   Normalization Judgment + Entity Identification
            You were practicing: state the trade-off, not just the
            schema. "3NF here prevents price drift in historical
            orders" is a recommendation. "It's normalized" is not.

─────────────────────────────────────────
Your weakest competency this challenge: Grain Definition

You designed an events table with columns at three different
grains: per-event columns, per-session columns, and per-user
columns, all in the same table. A mixed-grain table means every
aggregation query is subtly wrong. The grain definition move is
the first thing you set, not the last thing you discover.

Next challenge to develop this:
→ The Analytics Funnel (Data · Grain Track)
  Requires designing a funnel model where every aggregation
  depends on getting the grain right at each layer.
```

---

## 7. Coaching Language Style Guide

Hatch talks about data models as representations of the world, and the coaching surfaces when the representation doesn't match the world it's supposed to capture.

**Voice principles:**

The coaching language names the anomaly or the query failure, not the schema rule. "Your table violates 3NF" is not coaching. "If the product category changes, this schema leaves historical orders with the old category, which makes your category-based revenue reports wrong for historical periods" is coaching.

Hatch coaches toward grain precision. Vague coaching ("the grain is off") is not useful. "The `user_events` table has `signup_date`, which is a user-level attribute, not an event-level attribute. Which grain are you committing to?" is the move.

The coaching voice surfaces the consequence of the modeling decision, not just the decision itself. The learner should finish a grading turn knowing what breaks if they leave the schema as-is, not just that it's incorrect.

**Phrasings to use:**
- "What does one row in this table represent?"
- "If this value changes, which rows need to be updated?"
- "Walk me through how you'd answer [key query] on this schema."
- "What's the update anomaly you're accepting with this denormalization?"
- "This column is at session grain. The table is at event grain. Which one changes?"
- "State the grain before naming any columns."
- "What does historical accuracy require here, point-in-time snapshot, or current value?"

**Phrasings to avoid:**
- "Good schema design!" (no specificity)
- "This is well-normalized" (normalized is not a quality; name what it prevents)
- "Just add an index" (performance is not a schema design fix)
- "This doesn't follow best practices" (name the specific practice and the specific consequence)
- "The schema is too complex" (complexity is relative; name what makes it hard to query)

**Tone calibration:**
Data modeling coaching is precise and curious. "Which grain are you using here?" is not an accusation, it's a diagnostic question. The coaching surfaces the reasoning gap by naming the consequence, then asking the learner to articulate the decision they made or didn't make.

---

## 8. Open Questions

**1. Should `normalization_judgment` be split into two competencies?**
In practice, learners fail at normalization in two distinct ways: they don't recognize update anomalies (a reasoning failure), and they can't reason about the query cost of highly normalized schemas (a performance failure). These may require distinct coaching. Consider splitting into `anomaly_reasoning` and `denormalization_judgment` if grading data shows learners are strong on one and weak on the other.

**2. How do schema evolution challenges fit?**
The current FLOW step definitions assume a greenfield schema design. Many real data modeling problems are migrations or evolutions of an existing schema. Does Frame look different when the constraint is backward compatibility? How does Win change when the recommendation must phase the migration? This is unresolved for v1.

**3. Is `query_pattern_awareness` gradeable from MCQ responses alone?**
Evaluating whether a schema supports a given query pattern may require the learner to write (or read) a query, which is closer to coding than to MCQ selection. Can this competency be adequately graded through MCQ options, or does it require a freeform or open-ended step?

**4. How should NoSQL and non-relational modeling be handled?**
The current taxonomy assumes relational modeling. A document store or a wide-column store has different normalization concepts and different grain semantics. The entity identification and query pattern awareness moves are transferable; normalization judgment is less so. Should there be a separate challenge track for non-relational modeling, or should the rubric handle both?
