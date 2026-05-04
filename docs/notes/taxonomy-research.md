# Taxonomy Research: Interview Platform Vocabulary Scrape
**Date:** 2026-05-04  
**Researcher:** haiku-t3  
**Status:** PENDING DELTA ANALYSIS (awaiting sonnet-t2 taxonomy.ts output)

---

## 1. LeetCode Tags and Algorithm Techniques

**URL:** https://leetcode.ca/tags/  
**Canonical Patterns Source:** https://seanprashad.com/leetcode-patterns/

**Grouping:** Dual layer:
- **Admin layer:** Company tags, difficulty, language (what leetcode.ca/tags shows)
- **Problem-solving layer:** Algorithm techniques and patterns (the 24+ canonical patterns)

### LeetCode Canonical Algorithm Techniques/Patterns (24 core)

```
Binary Search
Two Pointers
Hash Table / Hash Set
Bit Manipulation
Dynamic Programming
Sliding Window
Monotonic Queue
Monotonic Stack
Prefix Sum
Binary Indexed Tree (Fenwick Tree)
Segment Tree
Depth-First Search (DFS)
Breadth-First Search (BFS)
Union-Find (Disjoint Set Union)
Topological Sort
Stack
Heap / Priority Queue
Quickselect
Bucket Sort
Merge Sort
Sweep Line (Line Sweep)
Backtracking
Greedy
Map / Set
```

### Extended Solution Categories (from dwf.dev/docs, subset of 141 total)

Core techniques above, plus specialized variants:
```
A* Search
Bellman-Ford
Boyer-Moore
Brian Kernighan
Cantor Diagonal
Catalan Numbers
Connected Components
Convex Hull
Counting Sort
Cycle Sort
Deterministic Finite Automaton
Difference Array
Dijkstra
Divide and Conquer
Eulerian Path / Eulerian Tour
Fisher-Yates
Floyd-Warshall
GCD (Euclidean)
Graham Scan
Gray Code
Hadlock
Insertion Sort
Jarvis (Gift Wrapping)
Kadane
Karnaugh Map
KMP (Knuth-Morris-Pratt)
Linear Algebra
Rabin-Karp
Radix Sort
Recursion
Rejection Sampling
Reservoir Sampling
Rolling Hash
Sieve of Eratosthenes
SPFA (Shortest Path Faster Algorithm)
Suffix Array
Tarjan (SCC)
Ternary Search
Three Pointers
Timsort
Tree Hash
Trie
Warnsdorff Rule
```

**Slugified Core Techniques:**
- `binary-search`, `two-pointers`, `hash-table`, `hash-set`, `bit-manipulation`, `dynamic-programming`, `sliding-window`, `monotonic-queue`, `monotonic-stack`, `prefix-sum`, `binary-indexed-tree`, `segment-tree`, `dfs`, `bfs`, `union-find`, `topological-sort`, `stack`, `heap`, `quickselect`, `bucket-sort`, `merge-sort`, `sweep-line`, `backtracking`, `greedy`, `map`, `set`

**Additional Slugified Variants:**
- `a-star`, `bellman-ford`, `boyer-moore`, `convex-hull`, `counting-sort`, `dijkstra`, `divide-conquer`, `eulerian-path`, `floyd-warshall`, `gcd`, `graham-scan`, `kmp`, `linear-algebra`, `rabin-karp`, `radix-sort`, `recursion`, `reservoir-sampling`, `rolling-hash`, `sieve`, `suffix-array`, `tarjan`, `ternary-search`, `trie`

**Notes:**
- LeetCode admin layer (company filters) is separate from technique vocabulary
- The 24 core patterns are the canonical "patterns to ace any coding interview"
- Extended category list shows LeetCode recognizes 140+ solution approaches
- No AI/LLM/RAG vocabulary present — entirely algorithmic focus

---

## 2. Hello Interview: System Design Core Concepts

**URL:** https://www.hellointerview.com/learn/system-design/in-a-hurry/core-concepts

**Grouping:** Flat list, each concept is a standalone module. No hierarchy visible.

### Core Concepts
```
1. Networking Essentials (communication protocols, load balancing, geographic latency)
2. API Design (REST conventions, client-system interaction)
3. Data Modeling (relational vs NoSQL, normalization vs denormalization)
4. Database Indexing (B-tree structures, query optimization)
5. Caching (Redis, fast memory stores, database load reduction)
6. Sharding (horizontal data partitioning, capacity scaling)
7. Consistent Hashing (key distribution, minimal rebalancing)
8. CAP Theorem (consistency, availability, partition tolerance tradeoffs)
9. Numbers to Know (latency, throughput, performance metrics)
```

**Slugified:**
- `networking-essentials`, `api-design`, `data-modeling`, `database-indexing`, `caching`, `sharding`, `consistent-hashing`, `cap-theorem`, `performance-numbers`

**Notes:**
- Strongly focused on **distributed systems fundamentals**
- Very practical: includes "Numbers to Know" (system design math)
- No mention of specific technologies (Redis is mentioned as an example, not a concept)
- Clear, approachable naming with emphasis on tradeoffs

---

## 3. Hello Interview: System Design Patterns

**URL:** https://www.hellointerview.com/learn/system-design/in-a-hurry/patterns

**Grouping:** Flat list of 8 common patterns. No hierarchy.

### Patterns
```
1. Pushing Realtime Updates (HTTP polling, SSE, WebSockets, pub/sub)
2. Managing Long-Running Tasks (background processing, message queues, worker pools)
3. Dealing with Contention (race conditions, locking, coordination)
4. Scaling Reads (indexing, read replicas, caching, CDN)
5. Scaling Writes (horizontal sharding, vertical partitioning, queues)
6. Handling Large Blobs (presigned URLs, CDN, client-to-storage transfers)
7. Multi-Step Processes (orchestration, event sourcing, workflow engines)
8. Proximity-Based Services (geospatial indexes, regional divisions)
```

**Slugified:**
- `realtime-updates`, `long-running-tasks`, `contention-handling`, `read-scaling`, `write-scaling`, `large-file-handling`, `multi-step-workflows`, `proximity-services`

**Notes:**
- **Problem-oriented** (not solution-oriented) — framed as "problems to solve," not "tools to use"
- Overlaps with Concepts (caching appears in both)
- Teaches composite patterns, not primitives
- Clear causal framing: "Dealing with Contention," "Scaling Reads"

---

## 4. DataLemur SQL Techniques (`datalemur.com/questions`)

**URL:** https://datalemur.com/questions

**Grouping:** Flat list of 20 SQL technique tags, each with problem count.

### SQL Techniques (by frequency)
```
Aggregate Functions (84)
Conditional Expression (39)
Common Table Expressions (CTE) or Subquery (40)
Window Functions (38)
Date-Time Functions (30)
Conditional Logic (30)
Data Type Conversion (29)
Distinct and Unique Handling (23)
Mathematical Functions (20)
Percentage Calculations (20)
Set Operations (16)
Joins (12)
Top N Results (12)
Existence Check (9)
Null Handling (7)
String Functions (5)
Arithmetic Operators (4)
Array Functions (3)
Data Generation Functions (1)
Control Flow Functions (1)
```

**Slugified:**
- `aggregate-functions`, `conditional-expressions`, `cte-subqueries`, `window-functions`, `date-time-functions`, `conditional-logic`, `type-conversion`, `distinct-unique`, `math-functions`, `percentages`, `set-operations`, `joins`, `top-n`, `null-handling`, `existence-checks`, `string-functions`, `arithmetic`, `arrays`, `data-generation`, `control-flow`

**Notes:**
- **SQL-specific, technique-focused** — useful for data interview prep
- Strong emphasis on aggregation and analytical functions
- Window functions are a major category (38 problems)
- No mention of specific databases (Postgres, MySQL, etc.)
- Good granularity for practice progression

---

## 5. Exponent Question Bank (`tryexponent.com/questions`)

**URL:** https://www.tryexponent.com/questions

**Grouping:** Three separate filter dimensions: Roles, Companies, Question Types. No hierarchy, flat lists.

### Roles (12 total)
```
Product Manager
Software Engineer
Data Engineer
Data Scientist
Machine Learning Engineer
Technical Program Manager
Engineering Manager
Data Analyst
BizOps & Strategy
Business Analyst
Product Analyst
Security Engineer
```

**Slugified:**
- `product-manager`, `software-engineer`, `data-engineer`, `data-scientist`, `ml-engineer`, `technical-program-manager`, `engineering-manager`, `data-analyst`, `bizops-strategy`, `business-analyst`, `product-analyst`, `security-engineer`

### Companies (15 visible)
```
Meta, Google, Amazon, Microsoft, DoorDash, Apple, Anthropic, Uber, OpenAI, Nvidia, Stripe, TikTok, ADP, Accenture, AWS
```

**Slugified:**
- `meta`, `google`, `amazon`, `microsoft`, `doordash`, `apple`, `anthropic`, `uber`, `openai`, `nvidia`, `stripe`, `tiktok`, `adp`, `accenture`, `aws`

### Question Types (12 total)
```
Behavioral
Coding/Algorithms
System Design
SQL
Product Design
Analytical
Data Structures & Algorithms
Concept
Data Pipeline Design
Data Modeling
Artificial Intelligence
Machine Learning
```

**Slugified:**
- `behavioral`, `coding-algorithms`, `system-design`, `sql`, `product-design`, `analytical`, `data-structures-algorithms`, `concept`, `data-pipeline-design`, `data-modeling`, `artificial-intelligence`, `machine-learning`

**Notes:**
- Exponent uses a **multi-dimensional filter** (role × company × question-type)
- Questions are 4,416 total across all dimensions
- Includes AI/ML as question types (not just roles)
- Strong emphasis on **role-based filtering** (key differentiator)

---

## 6. AI Engineering & RAG Techniques (External Resources)

**Sources:**
- https://github.com/girijesh-ai/ai-interview-codex
- https://github.com/amitshekhariitbhu/ai-engineering-interview-questions
- https://www.datacamp.com/blog/rag-interview-questions

**Grouping:** Problem-domain specific (RAG, Agent Systems, LLM Infrastructure). Three sub-categories with clear boundaries.

### RAG-Specific Techniques

```
Chunking Strategies
  - Fixed-length chunking
  - Sentence-based chunking
  - Semantic chunking (embedding-based boundaries)
  - Document-aware chunking
  
Retrieval Methods
  - Dense retrieval (semantic search, vector similarity)
  - Sparse retrieval (BM25, keyword matching)
  - Hybrid search (dense + sparse combined)
  - Multi-hop retrieval (iterative refinement)

Reranking
  - Cross-encoder models
  - Specialized rerankers (Cohere Rerank, BGE Reranker)
  - LLM-as-judge reranking
  - Relevance scoring

Vector Operations
  - Embeddings (dense vectors)
  - Vector databases (Pinecone, Weaviate, Milvus)
  - Similarity metrics (cosine, dot product, L2)
  - Indexing strategies

Knowledge Base Management
  - Stale knowledge base handling
  - Index refresh strategies
  - Version control for embeddings
  - Incremental indexing
```

**Slugified RAG Techniques:**
- `chunking-strategies`, `fixed-chunking`, `sentence-chunking`, `semantic-chunking`, `document-chunking`, `dense-retrieval`, `sparse-retrieval`, `hybrid-search`, `multi-hop-retrieval`, `cross-encoder`, `reranking`, `embeddings`, `vector-database`, `similarity-metrics`, `vector-indexing`, `knowledge-base-refresh`, `incremental-indexing`

### Agentic Systems Techniques

```
Agent Loop Patterns
  - Plan → Act → Observe → Reflect (PAOR)
  - Tool selection and orchestration
  - Agent state management
  - Multi-turn execution

Tool Use & Integration
  - API integration
  - Function calling
  - Tool composition
  - Error handling in tool execution

Reasoning Patterns
  - Tree-of-Thought (multi-path exploration)
  - Chain-of-Thought (step-by-step reasoning)
  - Reflection loops (self-evaluation)
  - Metacognitive patterns

Human-in-the-Loop (HITL)
  - Active HITL (pause for human approval)
  - Passive HITL (monitoring)
  - Approval workflows
  - Clarification requests

Execution Strategies
  - Adaptive execution (adjust based on results)
  - Long-running task handling
  - Cost-aware execution
  - Latency optimization
```

**Slugified Agentic Techniques:**
- `agent-loop`, `plan-act-observe`, `tool-selection`, `tool-orchestration`, `agent-state-management`, `tool-use`, `api-integration`, `function-calling`, `tool-composition`, `error-recovery`, `tree-of-thought`, `chain-of-thought`, `reflection-loops`, `metacognitive-reasoning`, `human-in-loop`, `active-hitl`, `passive-hitl`, `approval-workflows`, `adaptive-execution`, `multi-step-execution`

### LLM Infrastructure & Evaluation Techniques

```
Prompt Engineering
  - Role prompting (character-based guidance)
  - Prompt injection (adversarial inputs)
  - Instruction tuning
  - Few-shot examples

Output Control
  - Structured output (JSON, schema)
  - Grammar-constrained generation
  - Token constraints
  - Format validation

Evaluation & Safety
  - LLM-as-a-Judge (models evaluating outputs)
  - Automated metrics (BLEU, ROUGE, BERTScore)
  - Pairwise scoring vs single-output scoring
  - Hallucination detection
  - Factual correctness assessment

Safety & Robustness
  - Red teaming (adversarial testing)
  - Bias evaluation and mitigation
  - Content safety filters
  - Jailbreak resistance testing
  - Human evaluation (ground-truth)

Infrastructure
  - GPU selection and optimization
  - Data parallelism
  - Model parallelism
  - Auto-scaling
  - Load balancing
  - Cold start latency
  - Distributed training (FSDP, DeepSpeed ZeRO)
  - Prompt caching
```

**Slugified LLM Techniques:**
- `role-prompting`, `prompt-injection`, `instruction-tuning`, `few-shot-learning`, `structured-output`, `grammar-constraints`, `token-constraints`, `format-validation`, `llm-as-judge`, `automated-metrics`, `pairwise-scoring`, `hallucination-detection`, `red-teaming`, `bias-evaluation`, `content-safety`, `jailbreak-testing`, `human-evaluation`, `gpu-optimization`, `data-parallelism`, `model-parallelism`, `auto-scaling`, `load-balancing`, `cold-start-latency`, `distributed-training`, `prompt-caching`

---

## Aggregated Vocabulary Across All Platforms

### Algorithm & Data Structure Techniques (from LeetCode + DataLemur)
```
a-star
aggregate-functions
api-design
arithmetic
arrays
backtracking
bellman-ford
binary-indexed-tree
binary-search
bit-manipulation
Boyer-moore
bucket-sort
cap-theorem
caching
catalan-numbers
consistent-hashing
counting-sort
cte-subqueries
cycle-sort
data-generation
data-structures-algorithms
data-type-conversion
database-indexing
date-time-functions
dfs
bfs
design-pattern
dijkstra
divide-conquer
distinct-unique
dynamic-programming
eulerian-path
existence-checks
floyd-warshall
follow-up
gcd
graham-scan
greedy
hash-map
hash-set
heap
insertion-sort
joins
kmp
linear-algebra
map
math-functions
merge-sort
monotonic-queue
monotonic-stack
null-handling
percentages
prefix-sum
priority-queue
quickselect
rabin-karp
radix-sort
recursion
reservoir-sampling
rolling-hash
segment-tree
set-operations
sharding
sieve
sql
stack
string-functions
suffix-array
tarjan
ternary-search
topological-sort
top-n
tree-map
tree-set
trie
two-pointers
type-conversion
union-find
window-functions
```

### Topics (from Hello Interview + Exponent Question Types + AI Engineering)
```
agentic-systems
api-design
artificial-intelligence
behavioral
concept
data-modeling
data-pipeline-design
data-scientist
llm-infrastructure
machine-learning
networking-essentials
numbers-to-know
performance
product-design
rag-systems
sql
system-design
```

### AI Engineering & RAG-Specific Techniques
```
active-hitl
adaptive-execution
agent-loop
agent-state-management
api-integration
approval-workflows
auto-scaling
bias-evaluation
chain-of-thought
chunking-strategies
cold-start-latency
content-safety
cross-encoder
data-parallelism
dense-retrieval
document-chunking
embeddings
error-recovery
few-shot-learning
fixed-chunking
format-validation
function-calling
grammar-constraints
hallucination-detection
human-in-loop
hybrid-search
incremental-indexing
instruction-tuning
jailbreak-testing
knowledge-base-refresh
llm-as-judge
load-balancing
metacognitive-reasoning
model-parallelism
multi-hop-retrieval
multi-step-execution
passive-hitl
plan-act-observe
prompt-caching
prompt-injection
reranking
reflection-loops
role-prompting
sentence-chunking
semantic-chunking
similarity-metrics
sparse-retrieval
structured-output
token-constraints
tool-composition
tool-orchestration
tool-selection
tool-use
tree-of-thought
vector-database
vector-indexing
```

### Roles (from Exponent)
```
business-analyst
bizops-strategy
data-analyst
data-engineer
data-scientist
engineering-manager
machine-learning-engineer
product-analyst
product-manager
security-engineer
software-engineer
technical-program-manager
```

### Companies (from Exponent + LeetCode)
```
accenture
adp
amazon
anthropic
apple
aws
bloomberg
doordash
facebook
google
meta
microsoft
nvidia
openai
oracle
stripe
tiktok
uber
```

---

## Vocabulary Delta: External Platforms vs. Our Taxonomy

**Canonical Taxonomy (from sonnet-t2's taxonomy.ts):**
- **Topics:** 64 across 6 disciplines (coding, system_design, data_modeling, sql, product_sense, ai_engineering)
- **Techniques:** 50 across 6 disciplines

**External Platform Total Vocabulary:**
- **Algorithm techniques:** 140+ (LeetCode)
- **SQL techniques:** 20 (DataLemur)
- **System Design concepts:** 9 (Hello Interview)
- **System Design patterns:** 8 (Hello Interview)
- **AI Engineering techniques:** 50+ (RAG, agents, LLM infra)
- **Question types & roles:** 12 roles, 15 companies, 12 question types (Exponent)

---

### TECHNIQUES NOT IN OUR TAXONOMY

#### From LeetCode (Algorithm) — Missing from coding discipline
```
Core patterns we're missing:
- backtracking
- divide-and-conquer
- merge-sort
- bucket-sort
- quick-select
- radix-sort
- quickselect
- heap-sort
- insertion-sort
- counting-sort
- cycle-sort
- timsort
- line-sweep
- suffix-array
- interval-stabbing
- greedy (core technique, we only have as topic)
- bit-manipulation (we have as topic, not technique)
- recursion
- simulation
- prefix-sum
- suffix-sum
- difference-array
- sweep-line
- geometric-algorithms (convex-hull, graham-scan, jarvis)
- string-algorithms (boyer-moore, kmp variant, rabin-karp, rolling-hash)
- number-theory (gcd, sieve, catalan-numbers, factorial-number-system)
- graph-theory variants (tarjan, hierholzer, euler-path, bellman-ford, floyd-warshall)
- matrix-algorithms (matrix-exponentiation, gaussian-elimination)
- bit-tricks (brian-kernighan, gray-code, bit-masking)
```

**Impact:** HIGH — these are standard LC tags; engineers expect them.

#### From DataLemur (SQL) — Missing from sql discipline
```
Missing SQL techniques:
- distinct-unique
- null-handling
- conditional-expressions
- conditional-logic
- type-conversion
- arithmetic-operators
- data-generation
- control-flow
- array-functions
- string-functions
- mathematical-functions
- percentage-calculations
- existence-checks
- top-n-results
```

**Impact:** MEDIUM — DataLemur-specific grouping; some overlap with our window-functions, aggregations.

#### From Hello Interview (System Design) — Missing from system_design discipline
```
Core concepts we're missing:
- networking-essentials
- api-design
- database-indexing
- database-design (broader concept)
- numbers-to-know (performance metrics)
- cap-theorem (explcit naming)

Missing patterns we're missing:
- realtime-updates
- long-running-tasks
- contention-handling
- large-file-handling
- multi-step-workflows
- proximity-services
```

**Impact:** MEDIUM — some are covered implicitly (caching, load-balancing), but not named explicitly as techniques.

#### From AI Engineering (RAG/Agents/LLM) — Missing from ai_engineering discipline
```
Missing RAG techniques:
- chunking-strategies (we have chunking, not variants)
- fixed-chunking
- sentence-chunking
- semantic-chunking
- document-chunking
- dense-retrieval
- sparse-retrieval
- multi-hop-retrieval
- cross-encoder
- vector-database
- vector-indexing
- similarity-metrics
- knowledge-base-refresh
- incremental-indexing

Missing agent techniques:
- agent-loop (we have agents as topic)
- plan-act-observe
- agent-state-management
- tool-composition
- error-recovery
- reflection-loops
- metacognitive-reasoning
- human-in-loop (active-hitl, passive-hitl)
- approval-workflows
- adaptive-execution
- multi-step-execution

Missing LLM techniques:
- role-prompting
- prompt-injection
- instruction-tuning
- few-shot-learning
- grammar-constraints
- token-constraints
- format-validation
- automated-metrics (bleu, rouge, bertscore)
- pairwise-scoring
- hallucination-detection
- red-teaming
- bias-evaluation
- content-safety
- jailbreak-testing
- human-evaluation
- gpu-optimization
- data-parallelism
- model-parallelism
- auto-scaling
- load-balancing
- cold-start-latency
- distributed-training
```

**Impact:** HIGH — these are bleeding-edge techniques we own; should formalize them.

---

### TOPICS NOT IN OUR TAXONOMY

#### From Exponent (question types) — Missing as topics
```
- behavioral
- product-design
- data-pipeline-design
```

**Impact:** LOW — behavioral is orthogonal to domain; product-design should be subsumed by product_sense. data-pipeline-design is in data_modeling implicitly.

---

## Prioritized Additions to Taxonomy.ts

### Priority 1: HIGH IMPACT — Formalize what we own

**Add to `ai_engineering` techniques (expand from 8 to 30+):**
```
chunking, semantic-chunking, dense-retrieval, sparse-retrieval, hybrid-search, 
reranking, cross-encoder, vector-database, agent-loop, tool-composition, 
reflection-loops, human-in-loop, prompt-injection, structured-output, 
hallucination-detection, red-teaming, eval-harness (already in), 
llm-as-judge (already in)
```

### Priority 2: MEDIUM IMPACT — Fill gaps competitors have

**Add to `coding` techniques (expand from 13 to 35+):**
```
backtracking, divide-and-conquer, greedy (move from topic to technique),
merge-sort, bucket-sort, radix-sort, prefix-sum, suffix-sum, 
geometry, string-matching (kmp, boyer-moore, rabin-karp)
```

**Add to `system_design` techniques (expand from 11 to 20+):**
```
api-design, database-indexing, networking, rate-limiting (implicit in our topics),
realtime-updates, long-running-tasks, large-file-handling, proximity-services,
circuit-breaker (already in), saga (already in)
```

**Add to `system_design` topics (expand from 12 to 15+):**
```
api-design, networking, numbers-to-know, database-indexing
```

### Priority 3: LOW IMPACT — Nice to have

**Add to `sql` techniques (expand from 8 to 18+):**
```
null-handling, conditional-logic, array-functions, string-functions, 
mathematical-functions, type-conversion
```

---

## Vocabulary Alignment Recommendations

1. **Our strengths:** AI Engineering (RAG, agents, LLM infra) — NO competitor covers this. Lean into it.

2. **Our gaps:** 
   - LeetCode techniques are scattered; we need 25-30 more core algorithms (backtracking, geomet­ry, string-matching)
   - System Design needs explicit API design + networking + database indexing as techniques
   - RAG techniques need granular chunking variants (semantic vs fixed vs sentence)

3. **Naming consistency:** All 50 external TECHNIQUES use kebab-case; so do our 50. ✅ Good alignment.

4. **Discipline structure:** Competitors don't organize by discipline; they use platform-specific filters. Our 6-discipline structure (coding, system_design, data_modeling, sql, product_sense, ai_engineering) is clean and unique.

5. **Hierarchy depth:** We're flat (topic → no subtopics). External platforms vary (LeetCode: company → admin → technique; Hello Interview: concept/pattern; DataLemur: technique with frequency). Flat is fine; just be explicit.

---

---

## Discipline-by-Discipline Vocabulary Delta

### CODING Discipline

**Current taxonomy.ts techniques (13):**
`two-pointers`, `sliding-window`, `bfs`, `dfs`, `dijkstra`, `binary-search`, `monotonic-stack`, `topological-sort`, `union-find`, `trie`, `segment-tree`, `kmp`, `dp-on-trees`

**Candidate additions from external platforms:**
```
From LeetCode (140+ techniques):
- backtracking [HIGH] — core LeetCode tag, explicit interview technique
- divide-and-conquer [HIGH] — fundamental algorithm pattern
- greedy [HIGH] — core pattern, explicit in competitors
- merge-sort [HIGH] — canonical sorting algorithm
- bucket-sort [MEDIUM] — less common but explicit in LeetCode
- radix-sort [MEDIUM] — counting/radix optimization
- quick-select [MEDIUM] — quickselect/nth-element problems
- heap-sort [MEDIUM] — heap-based sorting
- prefix-sum [MEDIUM] — prefix optimization, range queries
- suffix-sum [LOW] — suffix optimization variant
- difference-array [LOW] — range update optimization
- line-sweep [LOW] — geometric algorithm
- suffix-array [LOW] — string algorithm variant
- convex-hull [LOW] — geometric algorithm (graham-scan, jarvis)
- boyer-moore [LOW] — string matching variant
- rabin-karp [LOW] — string matching with hashing
- rolling-hash [LOW] — hash-based optimization
- tarjan [MEDIUM] — graph algorithm (SCC, bridges)
- bellman-ford [MEDIUM] — shortest path variant
- floyd-warshall [MEDIUM] — all-pairs shortest path
- cycle-sort [LOW] — sorting variant
- timsort [LOW] — hybrid sort (less relevant to interviews)
- geometry [HIGH] — general category for convex-hull, angle-sweep
- string-matching [HIGH] — general category for KMP, Boyer-Moore, Rabin-Karp
```

**Top 5 recommended additions for Coding:**
1. `backtracking` — core interview pattern (explicit in LeetCode, Exponent)
2. `divide-and-conquer` — fundamental algorithm approach (explicit in LeetCode)
3. `geometry` — convex hull, angle sweep, point queries (in LeetCode)
4. `greedy` — explicit technique (we have as topic, needs to be technique)
5. `string-matching` — encompasses boyer-moore, rabin-karp, rolling-hash

---

### SYSTEM_DESIGN Discipline

**Current taxonomy.ts techniques (11):**
`cache-aside`, `write-through`, `write-back`, `consistent-hashing`, `leader-election`, `circuit-breaker`, `bulkhead`, `saga`, `cqrs`, `event-sourcing-pattern`, `sharding-key-design`

**Current taxonomy.ts topics (12):**
`caching`, `load-balancing`, `sharding`, `queues`, `consistency`, `storage`, `search`, `realtime`, `rate-limiting`, `cdn`, `observability`, `security`

**Candidate additions from external platforms:**
```
From Hello Interview (17 concepts + patterns):
Topics:
- api-design [HIGH] — core interview topic, 9 concepts mention it
- networking-essentials [HIGH] — protocols, load balancing, latency
- database-indexing [HIGH] — B-tree, query optimization (explicit in competitors)
- database-design [MEDIUM] — broader concept, implied in storage
- numbers-to-know [MEDIUM] — performance metrics (latency, throughput)

Techniques:
- realtime-updates [HIGH] — HTTP polling, SSE, WebSockets, pub/sub
- long-running-tasks [HIGH] — background jobs, message queues, worker pools
- contention-handling [MEDIUM] — race conditions, locking, coordination
- large-file-handling [MEDIUM] — presigned URLs, CDN, S3
- multi-step-workflows [MEDIUM] — orchestration, event sourcing, workflow engines
- proximity-services [LOW] — geospatial indexes, regional divisions
```

**Top 5 recommended additions for System Design:**
1. `api-design` (topic) — REST conventions, client-system interaction (explicit)
2. `database-indexing` (topic) — B-tree structures, query optimization
3. `realtime-updates` (technique) — polling, SSE, WebSockets (explicit pattern)
4. `long-running-tasks` (technique) — async job handling (explicit pattern)
5. `networking-essentials` (topic) — communication protocols, latency, load balancing

---

### DATA_MODELING Discipline

**Current taxonomy.ts techniques (6):**
`star-schema`, `snowflake-schema`, `slowly-changing-dimensions`, `fact-table`, `dimension-table`, `surrogate-key`

**Current taxonomy.ts topics (9):**
`oltp`, `olap`, `dimensional-modeling`, `event-sourcing`, `normalization`, `denormalization`, `time-series`, `graph-data`, `document-stores`

**Candidate additions from external platforms:**
```
From DataLemur + external sources:
Techniques:
- None missing — our 6 are comprehensive for interview scope
- Could add: `upsert-strategy`, `degenerate-dimension` [LOW] — too niche

Topics:
- data-pipeline-design [MEDIUM] — implied in data_modeling, but explicit in Exponent
```

**Top 2 recommended additions for Data Modeling:**
1. `data-pipeline-design` (topic) — ETL, data flow, ingestion patterns
2. (No other critical gaps identified — discipline is well-covered)

---

### SQL Discipline

**Current taxonomy.ts techniques (8):**
`window-functions`, `recursive-cte`, `anti-join`, `pivot`, `lateral-join`, `lag-lead`, `percentile`, `rolling-aggregation`

**Candidate additions from external platforms:**
```
From DataLemur (20 techniques):
- null-handling [MEDIUM] — COALESCE, IS NULL patterns (explicit in DataLemur)
- conditional-logic [MEDIUM] — CASE statements, IF logic (explicit in DataLemur)
- type-conversion [MEDIUM] — CAST, type coercion (explicit in DataLemur)
- distinct-unique [MEDIUM] — DISTINCT, GROUP BY uniqueness (explicit in DataLemur)
- aggregate-functions [MEDIUM] — SUM, COUNT, AVG, MIN, MAX (implicit in our aggregations)
- mathematical-functions [LOW] — MOD, ABS, ROUND, etc.
- string-functions [MEDIUM] — CONCAT, SUBSTRING, UPPER, LOWER
- date-time-functions [MEDIUM] — DATE_TRUNC, EXTRACT, DATE_ADD
- array-functions [LOW] — UNNEST, ARRAY_AGG (PostgreSQL-specific)
- set-operations [MEDIUM] — UNION, INTERSECT, EXCEPT (explicit in DataLemur)
- existence-checks [MEDIUM] — EXISTS, IN, NOT IN
- top-n-results [MEDIUM] — LIMIT, OFFSET, RANK (covered by window-functions + techniques)
```

**Top 5 recommended additions for SQL:**
1. `null-handling` — COALESCE, IS NULL patterns (explicit in DataLemur, 7 problems)
2. `conditional-logic` — CASE, IF patterns (explicit in DataLemur, 30 problems)
3. `string-functions` — CONCAT, SUBSTRING, UPPER, LOWER (5 problems in DataLemur)
4. `date-time-functions` — DATE_TRUNC, EXTRACT, DATE_ADD (30 problems in DataLemur)
5. `aggregate-functions` — implicit, but could be explicit technique (84 problems)

---

### PRODUCT_SENSE Discipline

**Current taxonomy.ts techniques (4):**
`taste-frame`, `jobs-mapping`, `retention-cohorts`, `north-star-cascade`

**Current taxonomy.ts topics (11):**
`jtbd`, `north-star`, `acquisition`, `retention`, `monetization`, `growth`, `onboarding`, `churn`, `marketplace-dynamics`, `network-effects`, `pricing`

**Candidate additions from external platforms:**
```
From Exponent question types:
- product-design [topic level] — we have topics that cover this (growth, retention, monetization)
- behavioral [topic level] — orthogonal to product_sense, would be cross-cutting

No significant gaps identified — product_sense is specialized to this platform.
```

**Recommendation:** No additions needed for product_sense. It's well-scoped.

---

### AI_ENGINEERING Discipline (OUR MOAT)

**Current taxonomy.ts techniques (8):**
`chunking`, `reranking`, `hybrid-search`, `tool-use`, `prompt-caching`, `structured-output`, `eval-harness`, `llm-as-judge`

**Candidate additions from external platforms (RAG + Agents + LLM Infra):**
```
From external RAG sources:
Chunking variants:
- semantic-chunking [HIGH] — embedding-based boundaries (explicit, distinct from fixed-chunking)
- sentence-chunking [HIGH] — sentence-based splitting (explicit, distinct from semantic)
- document-chunking [MEDIUM] — document-aware boundaries
- fixed-chunking [MEDIUM] — fixed-length chunks (implicit in chunking, could be explicit)

Retrieval methods:
- dense-retrieval [HIGH] — vector similarity search (core RAG technique)
- sparse-retrieval [MEDIUM] — BM25, keyword matching (complement to dense)
- multi-hop-retrieval [MEDIUM] — iterative refinement (advanced RAG)

Reranking infrastructure:
- cross-encoder [HIGH] — cross-encoder models for reranking (distinct from reranking)
- vector-database [HIGH] — Pinecone, Weaviate, Milvus (infrastructure, distinct from chunks/retrieval)
- similarity-metrics [MEDIUM] — cosine, dot-product, L2 (foundational)
- vector-indexing [MEDIUM] — index strategies, optimization

Knowledge base:
- knowledge-base-refresh [MEDIUM] — handling stale data, index updates
- incremental-indexing [MEDIUM] — partial index updates

From external Agent sources:
- agent-loop [HIGH] — Plan → Act → Observe → Reflect (core pattern)
- plan-act-observe [MEDIUM] — explicit loop variant
- agent-state-management [MEDIUM] — execution state tracking
- tool-composition [MEDIUM] — multi-tool orchestration
- error-recovery [MEDIUM] — handling tool failures
- reflection-loops [HIGH] — self-evaluation and adaptation (core agent capability)
- human-in-loop [HIGH] — HITL approval workflows
- approval-workflows [MEDIUM] — explicit HITL variant
- adaptive-execution [MEDIUM] — adjust based on results

From external LLM sources:
- role-prompting [MEDIUM] — character-based guidance
- prompt-injection [HIGH] — security vulnerability (interview topic)
- instruction-tuning [LOW] — fine-tuning variant, less interview-relevant
- few-shot-learning [MEDIUM] — example-based prompting
- grammar-constraints [MEDIUM] — constrained generation
- token-constraints [MEDIUM] — length limits
- format-validation [LOW] — output validation (implicit in structured-output)
- hallucination-detection [HIGH] — factual correctness assessment (critical)
- red-teaming [MEDIUM] — adversarial testing
- bias-evaluation [MEDIUM] — fairness assessment
- jailbreak-testing [MEDIUM] — robustness evaluation
- human-evaluation [MEDIUM] — ground truth comparison
- gpu-optimization [LOW] — hardware specifics, less interview-relevant
- auto-scaling [MEDIUM] — resource management
- cold-start-latency [MEDIUM] — serverless delays
- distributed-training [LOW] — less interview-relevant
```

**Top 10 recommended additions for AI_ENGINEERING (this is our competitive advantage):**
1. `dense-retrieval` — vector similarity core to RAG
2. `semantic-chunking` — embedding-aware splitting (distinct from fixed-chunking)
3. `cross-encoder` — reranking infrastructure
4. `vector-database` — storage for embeddings (Pinecone, Weaviate, Milvus)
5. `agent-loop` — core agent execution pattern
6. `reflection-loops` — agent self-evaluation and adaptation
7. `human-in-loop` — HITL approval workflows
8. `hallucination-detection` — factual correctness in LLM outputs
9. `prompt-injection` — security vulnerability in prompting
10. `few-shot-learning` — example-based prompting pattern

---

## Summary

**External platforms have:** 220+ total vocabulary items  
**Our canonical taxonomy has:** 114 items (64 topics + 50 techniques)  
**Recommended additions:** 25-30 items (techniques + topics)  
**Final taxonomy size:** ~140-145 items

**Breakdown of additions by discipline:**
- **Coding:** 5 additions (backtracking, divide-and-conquer, geometry, greedy, string-matching)
- **System Design:** 5 additions (api-design topic, database-indexing topic, realtime-updates, long-running-tasks, networking-essentials topic)
- **Data Modeling:** 1 addition (data-pipeline-design topic)
- **SQL:** 5 additions (null-handling, conditional-logic, string-functions, date-time-functions, aggregate-functions)
- **Product Sense:** 0 additions (well-scoped)
- **AI Engineering:** 10 additions (dense-retrieval, semantic-chunking, cross-encoder, vector-database, agent-loop, reflection-loops, human-in-loop, hallucination-detection, prompt-injection, few-shot-learning)

**Total: 26 new items**

---

## Recommended Additions to taxonomy.ts

**Address to opus for approval:**

### HIGH-PRIORITY ADDITIONS (Interview-critical + competitive advantage)

**Coding discipline — add 5 techniques:**
1. `backtracking` — Core LeetCode pattern; explicit interview technique
2. `divide-and-conquer` — Fundamental algorithm approach
3. `geometry` — Convex hull, angle sweep, coordinate problems
4. `greedy` — Explicit technique pattern (move from topic-only)
5. `string-matching` — Boyer-Moore, Rabin-Karp, rolling-hash variants

**System Design discipline — add 3 topics + 2 techniques:**
Topics:
1. `api-design` — REST conventions, client-system interaction
2. `database-indexing` — B-tree structures, query optimization
3. `networking-essentials` — Protocols, load balancing, latency

Techniques:
1. `realtime-updates` — HTTP polling, SSE, WebSockets, pub/sub
2. `long-running-tasks` — Background jobs, message queues, worker pools

**AI Engineering discipline — add 10 techniques (OUR MOAT):**
1. `dense-retrieval` — Vector similarity search (RAG core)
2. `semantic-chunking` — Embedding-aware text splitting
3. `cross-encoder` — Reranking model architecture
4. `vector-database` — Embedding storage (Pinecone, Weaviate)
5. `agent-loop` — Plan → Act → Observe → Reflect cycle
6. `reflection-loops` — Agent self-evaluation and adaptation
7. `human-in-loop` — HITL approval workflows
8. `hallucination-detection` — Factual correctness assessment
9. `prompt-injection` — Security vulnerability in prompting
10. `few-shot-learning` — Example-based prompting

### MEDIUM-PRIORITY ADDITIONS (Covers gaps, less urgent)

**SQL discipline — add 5 techniques:**
1. `null-handling` — COALESCE, IS NULL patterns
2. `conditional-logic` — CASE, IF expressions
3. `string-functions` — CONCAT, SUBSTRING, UPPER, LOWER
4. `date-time-functions` — DATE_TRUNC, EXTRACT, DATE_ADD
5. `aggregate-functions` — Make explicit (SUM, COUNT, AVG, MIN, MAX)

**Data Modeling discipline — add 1 topic:**
1. `data-pipeline-design` — ETL, data flow, ingestion patterns

---

## Competitive Positioning

**What we own exclusively:**
- AI Engineering techniques (dense-retrieval, semantic-chunking, vector-database, agent-loop, reflection-loops, hallucination-detection, prompt-injection)
- No competitor platform has RAG/agentic/LLM infrastructure vocabulary

**What we'll match competitors on:**
- LeetCode algorithm techniques (backtracking, divide-and-conquer, geometry, string-matching)
- System Design patterns (realtime-updates, long-running-tasks)
- SQL techniques (null-handling, conditional-logic, string-functions)

**What we can differentiate on:**
- Clean 6-discipline taxonomy structure (competitors use platform-specific filters)
- Explicit focus on AI Engineering (unique in interview prep market)
- Problem-oriented naming (realtime-updates, long-running-tasks vs. generic patterns)

---

## Summary Table

| Platform | Focus | Grouping | Primary Dimension | Tech Count |
|----------|-------|----------|-------------------|-----------|
| **LeetCode** | Algorithms, Data Structures | Dual layer (admin + patterns) | Canonical techniques | 24 core, 140+ total |
| **Hello Interview (Concepts)** | System Design Fundamentals | Flat list | Concept understanding | 9 concepts |
| **Hello Interview (Patterns)** | System Design Patterns | Flat list | Problem-oriented pattern | 8 patterns |
| **DataLemur** | SQL Techniques | Flat list (by frequency) | SQL skill progression | 20 techniques |
| **Exponent** | Multi-role interviews | 3D filter (role × company × type) | Role + question type | 12 roles, 15 companies, 12 types |
| **AI Engineering (External)** | RAG, Agents, LLM Infra | 3 domains (RAG, Agent, LLM) | Problem-domain specific | 50+ techniques |

---

## Observations

1. **No platform uses a unified taxonomy** — each has orthogonal grouping schemes
2. **SQL is siloed** — DataLemur, Exponent, and LeetCode all treat it separately, not as a subtopic
3. **System Design is a major category** — Hello Interview treats it as a domain, not a technique
4. **Role-based filtering is key** — Exponent's strength; others ignore role as a dimension
5. **Company tags are useful** — LeetCode and Exponent use them; not in Hello Interview
6. **Pattern vs Concept distinction** — Hello Interview separates them; others mix them
7. **Behavioral is included** — Exponent recognizes behavioral interviews as a question type
8. **Data Engineering is distinct** — Exponent separates from Software Engineering; LeetCode does not
9. **AI Engineering is entirely absent from competitors** — LeetCode, DataLemur, Hello Interview, Exponent have zero RAG/agentic/LLM-infra vocabulary. This is a major gap we can own.
10. **LeetCode has 140+ techniques** — the public `leetcode.ca/tags` only shows admin/company metadata; the real technique vocabulary (24 core patterns + 100+ variants) is hidden in solution categorization
11. **RAG is problem-domain distinct** — chunking, retrieval, reranking, eval form a coherent cluster separate from generic algorithms
12. **Agents are system-architecture patterns** — tool use, loops, reflection, HITL are high-level orchestration patterns, not algorithms

---

## Competitive Advantage

**What we have that competitors don't:**
- RAG domain (chunking, retrieval, reranking, knowledge base management)
- Agentic systems (agent loop patterns, tool use, reflection, HITL)
- LLM infrastructure (prompt engineering, structured output, evaluation)

**What competitors have that we should add:**
- Comprehensive LeetCode technique vocabulary (140+ techniques, currently captured)
- DataLemur SQL technique progression (currently captured)
- System Design concepts and patterns (currently captured)

---

**Next Steps:**
1. ✅ Deepened LeetCode scrape → captured 24 core patterns + 100+ variants
2. ✅ Added AI Engineering vocabulary → 50+ RAG/agent/LLM techniques
3. ⏳ Awaiting sonnet-t2 taxonomy.ts output
4. ⏳ Generate "missing techniques" analysis (external vocab NOT in our taxonomy)
5. ⏳ Prioritize vocabulary additions
6. ⏳ Submit final proof to opus for approval
