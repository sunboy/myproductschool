import { HatchImage } from '@/components/redesign/HatchImage'
import type { DisciplineId } from './disciplines'

type RubricRow = { name: string; w: number; s: string }

function Rubric({ rows }: { rows: RubricRow[] }) {
  return (
    <div className="ds-rubric">
      {rows.map((r) => (
        <div key={r.name} className="ds-rubric-row">
          <div className="ds-rubric-name">{r.name}</div>
          <div className="ds-rubric-bar"><div style={{ width: `${r.w}%` }} /></div>
          <div className="ds-rubric-num">{r.s}</div>
        </div>
      ))}
    </div>
  )
}

function Overall({ score }: { score: string }) {
  return (
    <div style={{ marginTop: 'auto' }}>
      <div className="ds-label" style={{ marginBottom: 4 }}>▸ Overall</div>
      <div className="ds-score-big">{score} <small>/ 10</small></div>
    </div>
  )
}

function ScreenSQL() {
  return (
    <div className="ds" data-d="sql">
      <div className="ds-left">
        <div className="ds-label">SQL · Window Functions · Rep 0247</div>
        <div className="ds-title">For each customer, show their <em>3rd</em> most recent order.</div>
        <pre className="ds-code">
{``}<span className="cm">{`-- your query`}</span>{`
`}<span className="kw">SELECT</span>{` customer_id, order_id, order_date
`}<span className="kw">FROM</span>{` (
  `}<span className="kw">SELECT</span>{` *,
    `}<span className="fn">ROW_NUMBER</span>{`() `}<span className="kw">OVER</span>{` (
      `}<span className="kw">PARTITION BY</span>{` customer_id
      `}<span className="kw">ORDER BY</span>{` order_date `}<span className="kw">DESC</span>{`
    ) `}<span className="kw">AS</span>{` rn
  `}<span className="kw">FROM</span>{` orders
) ranked
`}<span className="kw">WHERE</span>{` rn = `}<span className="st">3</span>{`;`}
        </pre>
        <div className="ds-pillrow">
          <span className="ds-pill ok">✓ Correct</span>
          <span className="ds-pill hot">Edge case missed</span>
          <span className="ds-pill">Tie-breaking</span>
        </div>
      </div>
      <div className="ds-right">
        <div className="ds-coach">
          <div className="ds-coach-av"><HatchImage state="reviewing" size={32} /></div>
          <div>
            <div className="ds-coach-name">▸ Hatch · SQL Coach</div>
            <div className="ds-coach-text">Window function: <b>nailed it</b>. Watch ties. Two orders on the same day will both rank 3, so pick <b>row_number</b> vs <b>rank</b> deliberately.</div>
          </div>
        </div>
        <div className="ds-label">▸ Rubric</div>
        <Rubric rows={[
          { name: 'Correctness', w: 88, s: '8.8' },
          { name: 'Efficiency',  w: 76, s: '7.6' },
          { name: 'Edge cases',  w: 62, s: '6.2' },
          { name: 'Readability', w: 91, s: '9.1' },
        ]} />
        <Overall score="7.9" />
      </div>
    </div>
  )
}

function ScreenCoding() {
  return (
    <div className="ds" data-d="coding">
      <div className="ds-left">
        <div className="ds-label">Coding · Strings · Rep 1184</div>
        <div className="ds-title">Find the <em>longest substring</em> without repeating characters.</div>
        <pre className="ds-code">
{``}<span className="kw">def</span>{` `}<span className="fn">longest_unique</span>{`(s: `}<span className="kw">str</span>{`) -> `}<span className="kw">int</span>{`:
    seen = {}
    left = best = `}<span className="st">0</span>{`
    `}<span className="kw">for</span>{` right, ch `}<span className="kw">in</span>{` `}<span className="fn">enumerate</span>{`(s):
        `}<span className="kw">if</span>{` ch `}<span className="kw">in</span>{` seen `}<span className="kw">and</span>{` seen[ch] >= left:
            left = seen[ch] + `}<span className="st">1</span>{`
        seen[ch] = right
        best = `}<span className="fn">max</span>{`(best, right - left + `}<span className="st">1</span>{`)
    `}<span className="kw">return</span>{` best`}
        </pre>
        <div className="ds-pillrow">
          <span className="ds-pill ok">✓ All 47 tests pass</span>
          <span className="ds-pill">O(n) time</span>
          <span className="ds-pill">O(min(n,Σ)) space</span>
        </div>
      </div>
      <div className="ds-right">
        <div className="ds-coach">
          <div className="ds-coach-av"><HatchImage state="speaking" size={32} /></div>
          <div>
            <div className="ds-coach-name">▸ Hatch · Coding Coach</div>
            <div className="ds-coach-text">Sliding window with hashmap, <b>clean</b>. Now walk me through your dry-run with <b>&quot;abba&quot;</b>. That&apos;s where most candidates trip.</div>
          </div>
        </div>
        <div className="ds-label">▸ Rubric</div>
        <Rubric rows={[
          { name: 'Correctness',   w: 100, s: '10' },
          { name: 'Complexity',    w: 92,  s: '9.2' },
          { name: 'Communication', w: 70,  s: '7.0' },
          { name: 'Tests',         w: 84,  s: '8.4' },
        ]} />
        <Overall score="8.7" />
      </div>
    </div>
  )
}

function ScreenSysDes() {
  const blocks = [
    { t: 'Client',         d: 'Mobile / Web',    c: 'var(--on-dark)' },
    { t: 'API Gateway',    d: 'Rate limit',      c: 'var(--d-sysdes)' },
    { t: 'Score Service',  d: 'Stateless',       c: 'var(--d-sysdes)' },
    { t: 'Redis ZSET',     d: 'Sorted set',      c: 'var(--amber-bright)' },
    { t: 'Postgres',       d: 'Source of truth', c: 'var(--on-dark-2)' },
    { t: 'WebSocket Pub',  d: 'Live updates',    c: 'var(--forest-bright)' },
  ]
  return (
    <div className="ds" data-d="sysdes">
      <div className="ds-left">
        <div className="ds-label">System Design · Rep 0411</div>
        <div className="ds-title">Design a <em>real-time leaderboard</em> for 50M players.</div>
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 14,
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          alignContent: 'start',
        }}>
          {blocks.map((b) => (
            <div key={b.t} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '10px 12px',
              borderLeft: `3px solid ${b.c}`,
            }}>
              <div style={{
                fontFamily: 'var(--v3-font-mono)',
                fontSize: 9.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: b.c,
                fontWeight: 700,
              }}>{b.t}</div>
              <div style={{ fontSize: 11.5, color: 'var(--on-dark-2)', marginTop: 2 }}>{b.d}</div>
            </div>
          ))}
        </div>
        <div className="ds-pillrow">
          <span className="ds-pill ok">✓ Functional req covered</span>
          <span className="ds-pill hot">Replication gap</span>
          <span className="ds-pill">Numbers asked</span>
        </div>
      </div>
      <div className="ds-right">
        <div className="ds-coach">
          <div className="ds-coach-av"><HatchImage state="reviewing" size={32} /></div>
          <div>
            <div className="ds-coach-name">▸ Hatch · Systems Coach</div>
            <div className="ds-coach-text">Redis ZSET, <b>good pick</b>. But you skipped the replication step. What happens if your primary dies mid-tournament?</div>
          </div>
        </div>
        <div className="ds-label">▸ Rubric</div>
        <Rubric rows={[
          { name: 'Requirements', w: 90, s: '9.0' },
          { name: 'Scale math',   w: 72, s: '7.2' },
          { name: 'Trade-offs',   w: 85, s: '8.5' },
          { name: 'Reliability',  w: 58, s: '5.8' },
        ]} />
        <Overall score="7.6" />
      </div>
    </div>
  )
}

function ScreenDataMod() {
  const tables = [
    { name: 'users',      fields: ['id PK', 'email', 'tier', 'created_at'],      color: 'var(--amber-bright)' },
    { name: 'orders',     fields: ['id PK', 'user_id FK', 'total', 'status'],    color: 'var(--d-coding)' },
    { name: 'line_items', fields: ['order_id FK', 'sku', 'qty', 'price'],        color: 'var(--forest-bright)' },
  ]
  return (
    <div className="ds" data-d="datamod">
      <div className="ds-left">
        <div className="ds-label">Data Modeling · E-commerce · Rep 0822</div>
        <div className="ds-title">Model an <em>order with discounts</em> applied at line vs cart level.</div>
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
          minHeight: 0,
        }}>
          {tables.map((t) => (
            <div key={t.name} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              overflow: 'hidden',
              borderLeft: `3px solid ${t.color}`,
            }}>
              <div style={{
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.3)',
                fontFamily: 'var(--v3-font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: t.color,
                letterSpacing: '0.04em',
              }}>{t.name}</div>
              <div style={{
                padding: '8px 12px',
                fontFamily: 'var(--v3-font-mono)',
                fontSize: 10.5,
                color: 'var(--on-dark-2)',
                lineHeight: 1.55,
              }}>
                {t.fields.map((f) => <div key={f}>{f}</div>)}
              </div>
            </div>
          ))}
        </div>
        <div className="ds-pillrow">
          <span className="ds-pill ok">3NF</span>
          <span className="ds-pill hot">Discount table?</span>
          <span className="ds-pill">Soft-deletes</span>
        </div>
      </div>
      <div className="ds-right">
        <div className="ds-coach">
          <div className="ds-coach-av"><HatchImage state="speaking" size={32} /></div>
          <div>
            <div className="ds-coach-name">▸ Hatch · Modeling Coach</div>
            <div className="ds-coach-text">Schema reads cleanly. But your line_items has <b>price</b>. Is that snapshot or live? Spell out the temporal contract.</div>
          </div>
        </div>
        <div className="ds-label">▸ Rubric</div>
        <Rubric rows={[
          { name: 'Normalization',  w: 92, s: '9.2' },
          { name: 'Indexes',        w: 70, s: '7.0' },
          { name: 'Temporal sense', w: 65, s: '6.5' },
          { name: 'Evolvability',   w: 80, s: '8.0' },
        ]} />
        <Overall score="7.7" />
      </div>
    </div>
  )
}

function ScreenProduct() {
  return (
    <div className="ds" data-d="product">
      <div className="ds-left">
        <div className="ds-label">Product Sense · Rep 0593</div>
        <div className="ds-title">SaaS trial conversion dropped <em>22%</em> in a week. Pricing was tested. Where do you look first?</div>
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
          minHeight: 0,
          fontFamily: 'var(--v3-font-mono)',
          fontSize: 11.5,
          lineHeight: 1.55,
          color: 'var(--on-dark)',
        }}>
          <div><span style={{ color: 'var(--forest-bright)' }}>1.</span> Frame: drop = symptom, not the question.</div>
          <div><span style={{ color: 'var(--forest-bright)' }}>2.</span> Slice: pricing-page traffic vs activation.</div>
          <div><span style={{ color: 'var(--forest-bright)' }}>3.</span> Cohort: new signups vs returning trials.</div>
          <div><span style={{ color: 'var(--forest-bright)' }}>4.</span> Timeline: anchor on the deploy.</div>
          <div style={{ color: 'var(--amber-bright)' }}>↵ Submitted · awaiting grade</div>
        </div>
        <div className="ds-pillrow">
          <span className="ds-pill ok">Structure</span>
          <span className="ds-pill ok">Hypothesis-driven</span>
          <span className="ds-pill hot">No metric tree</span>
        </div>
      </div>
      <div className="ds-right">
        <div className="ds-coach">
          <div className="ds-coach-av"><HatchImage state="speaking" size={32} /></div>
          <div>
            <div className="ds-coach-name">▸ Hatch · PM Coach</div>
            <div className="ds-coach-text">Strong frame. You separated symptom from cause. Skipped one move: <b>anchor on the timeline first</b>. Deploys narrow the surface area fast.</div>
          </div>
        </div>
        <div className="ds-label">▸ Rubric</div>
        <Rubric rows={[
          { name: 'Framing',    w: 92, s: '9.2' },
          { name: 'Trade-offs', w: 78, s: '7.8' },
          { name: 'Structure',  w: 84, s: '8.4' },
          { name: 'Risk',       w: 71, s: '7.1' },
        ]} />
        <Overall score="8.3" />
      </div>
    </div>
  )
}

function ScreenML() {
  return (
    <div className="ds" data-d="ml">
      <div className="ds-left">
        <div className="ds-label">ML / AI Engineering · Rep 0316</div>
        <div className="ds-title">Your RAG pipeline returns <em>wrong</em> docs 14% of the time. Where do you start?</div>
        <pre className="ds-code">
{``}<span className="cm">{`# evaluation harness`}</span>{`
`}<span className="kw">from</span>{` rag `}<span className="kw">import</span>{` retrieve, score

`}<span className="kw">def</span>{` `}<span className="fn">audit</span>{`(eval_set):
    miss = []
    `}<span className="kw">for</span>{` q, gold `}<span className="kw">in</span>{` eval_set:
        docs = `}<span className="fn">retrieve</span>{`(q, k=`}<span className="st">5</span>{`)
        `}<span className="kw">if</span>{` gold `}<span className="kw">not in</span>{` [d.id `}<span className="kw">for</span>{` d `}<span className="kw">in</span>{` docs]:
            miss.append((q, docs, gold))
    `}<span className="kw">return</span>{` miss   `}<span className="cm">{`# debug retrieval, not LLM`}</span>
        </pre>
        <div className="ds-pillrow">
          <span className="ds-pill ok">Isolated retrieval</span>
          <span className="ds-pill hot">No k-sweep</span>
          <span className="ds-pill">Embedding audit</span>
        </div>
      </div>
      <div className="ds-right">
        <div className="ds-coach">
          <div className="ds-coach-av"><HatchImage state="reviewing" size={32} /></div>
          <div>
            <div className="ds-coach-name">▸ Hatch · ML Coach</div>
            <div className="ds-coach-text">Right instinct: <b>separate retrieval from generation</b>. Now is it the embeddings, the chunking, or the reranker? Run k=1,3,5,10.</div>
          </div>
        </div>
        <div className="ds-label">▸ Rubric</div>
        <Rubric rows={[
          { name: 'Diagnostic mindset', w: 88, s: '8.8' },
          { name: 'Eval design',        w: 76, s: '7.6' },
          { name: 'Trade-offs',         w: 72, s: '7.2' },
          { name: 'Production sense',   w: 80, s: '8.0' },
        ]} />
        <Overall score="7.9" />
      </div>
    </div>
  )
}

const SCREENS: Record<DisciplineId, () => React.JSX.Element> = {
  sql:     ScreenSQL,
  coding:  ScreenCoding,
  sysdes:  ScreenSysDes,
  datamod: ScreenDataMod,
  product: ScreenProduct,
  ml:      ScreenML,
}

const STATIC_PROG: Record<DisciplineId, string> = {
  sql: '62%',
  coding: '78%',
  sysdes: '55%',
  datamod: '68%',
  product: '72%',
  ml: '60%',
}

type V3DisciplineScreenProps = {
  active: DisciplineId
  cycling?: boolean
  cycleMs?: number
}

export function V3DisciplineScreen({ active, cycling = false, cycleMs = 5000 }: V3DisciplineScreenProps) {
  const url = {
    sql: 'hackproduct.com/sql',
    coding: 'hackproduct.com/coding',
    sysdes: 'hackproduct.com/system-design',
    datamod: 'hackproduct.com/data-modeling',
    product: 'hackproduct.com/product-sense',
    ml: 'hackproduct.com/ml-ai',
  }[active]

  return (
    <div className="disc-screen" data-d={active}>
      <div className="disc-screen-chrome">
        <div className="lights"><span /><span /><span /></div>
        <div className="url">{url}</div>
        <div className="live">LIVE</div>
      </div>
      <div className="disc-screen-body">
        {(Object.keys(SCREENS) as DisciplineId[]).map((id) => {
          const Cmp = SCREENS[id]
          return (
            <div
              key={id}
              className={'disc-screen-slide' + (id === active ? ' active' : '')}
              aria-hidden={id !== active}
            >
              <Cmp />
            </div>
          )
        })}
      </div>
      <div
        className={'ds-prog disc-cycle-prog' + (cycling ? ' cycling' : '')}
        style={cycling ? ({ '--cycle-ms': `${cycleMs}ms` } as React.CSSProperties) : undefined}
      >
        <div
          key={`${active}-${cycling ? 'on' : 'off'}`}
          style={cycling ? undefined : { width: STATIC_PROG[active] }}
        />
      </div>
    </div>
  )
}
