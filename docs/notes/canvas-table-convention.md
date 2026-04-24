# Canvas Table Convention (schema-as-text)

Excalidraw has no native concept of a database table with columns. This convention encodes column-level schema info directly in the body text of entity rectangles, so the scene parser, canvas executor, coach skill, and data-modeling grader all read from the same structure.

## Format spec

- **Line 1** — entity name, parsed as `entity.label`
- **Line 2** — optional separator: any line containing only `─`, `-`, `=`, or `--`
- **Lines 3+** — columns, one per line: `name [TYPE] [CONSTRAINTS]`

## Constraint syntax

| Token | Meaning |
|---|---|
| `PK` | Primary key |
| `FK→table.column` | Foreign key with explicit target |
| `UNIQUE` | Unique constraint |
| `NOT NULL` | Not-null constraint |
| `INDEX` | Indexed column |

Anything that doesn't match a recognized token stays as freeform text on that column — the parser never drops content.

## Example

```
users
──
id PK
email UNIQUE NOT NULL
tenant_id FK→tenants.id
created_at
```

```
posts
──
id PK
user_id FK→users.id NOT NULL
body
```

## Relationship modalities

Three ways to express a relationship — any one is enough for the grader; multiple signals = stronger score:

1. **Inline FK column** (`tenant_id FK→tenants.id`) — most precise; grader reads it directly from parsed columns
2. **Labeled connector arrow** — draw an arrow between two entity shapes, label it with cardinality ("1:N", "N:M")
3. **Articulation in chat** — describe the relationship to Hatch in the chat panel; captured in `conversation_summary`

## Backwards compatibility

Single-line entity rectangles (name only, no separator, no columns) remain valid. The parser returns `columns: []` for them. No existing challenges break.
