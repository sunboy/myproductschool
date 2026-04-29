'use client'

import { useState, useEffect } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

export function LivePreview_Practice() {
  const fullAnswer = "Spotify's session drop is likely a discovery problem: users land but don't find what they want. I'd frame this as a recommendation relevance issue first, then check…"
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (typed.length >= fullAnswer.length) {
      const t = setTimeout(() => setTyped(''), 2200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setTyped(fullAnswer.slice(0, typed.length + 1)), 28 + Math.random() * 30)
    return () => clearTimeout(t)
  }, [typed, fullAnswer])

  const score = Math.min(82, Math.round((typed.length / fullAnswer.length) * 82))

  return (
    <div className="lp-frame lp-cream">
      <div className="lp-tabs">
        <div className="lp-tab lp-tab--active">Spotify · 15% Drop</div>
        <div className="lp-tab">+ New scratch</div>
        <div style={{ flex: 1 }} />
        <div className="lp-pill lp-pill--amber">⏱ 12:48</div>
      </div>
      <div className="lp-practice-grid">
        <div className="lp-panel">
          <div className="lp-panel-head">
            <span className="lp-tag lp-tag--ai-native">AI-Native</span>
            <span className="lp-tag lp-tag--frame">Frame</span>
          </div>
          <h4 className="lp-h">Spotify&apos;s 15% session drop</h4>
          <p className="lp-p">DAU is steady but average session length has fallen 15% over 6 weeks. Eng says nothing changed. PM says retention looks fine. <b>Where do you start?</b></p>
          <div className="lp-mini-stat">
            <div><b>6.4M</b><span>DAU</span></div>
            <div><b>−15%</b><span>session</span></div>
            <div><b>0</b><span>incidents</span></div>
          </div>
        </div>
        <div className="lp-panel lp-panel--white">
          <div className="lp-answer-head"><span>Your answer</span></div>
          <div className="lp-textarea">{typed}<span className="lp-caret" /></div>
          {typed.length > 60 && (
            <div className="lp-luma-coach anim-fade-up">
              <HatchGlyph size={24} state="reviewing" />
              <div><b>Strong frame.</b> Now <i>list</i>: what are 3 hypotheses?</div>
            </div>
          )}
          <div className="lp-score">
            <div className="lp-score-head"><span>Frame score</span><b>{score}/100</b></div>
            <div className="lp-score-bar"><div style={{ width: `${score}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LivePreview_LiveInterview() {
  const lines = [
    { who: 'luma', text: 'How would you measure success for this feature?' },
    { who: 'you',  text: "I'd start with adoption: what % of eligible users try it…" },
    { who: 'luma', text: 'Good. Now, how would you separate adoption from value?' },
  ]
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setShown(s => (s + 1) % (lines.length + 1)), 2400)
    return () => clearInterval(t)
  }, [lines.length])

  return (
    <div className="lp-frame lp-dark">
      <div className="lp-iv-head">
        <div className="lp-iv-dot" /> LIVE · Mock interview · Senior PM
        <div style={{ flex: 1 }} />
        <span className="lp-iv-time">14:22</span>
      </div>
      <div className="lp-iv-stage">
        <div className="lp-iv-orb">
          <div className="lp-iv-rings"><span /><span /><span /></div>
          <HatchGlyph size={64} state="speaking" />
          <div className="lp-iv-name">Hatch · Senior PM Interviewer</div>
        </div>
        <div className="lp-iv-wave" aria-hidden>
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 60}ms`, height: 8 + Math.abs(Math.sin(i * 0.7)) * 28 }} />
          ))}
        </div>
        <div className="lp-iv-transcript">
          {lines.slice(0, shown).map((l, i) => (
            <div key={i} className={`lp-iv-line lp-iv-line--${l.who} anim-fade-up`}>
              <span className="lp-iv-who">{l.who === 'luma' ? 'Hatch' : 'You'}</span>
              <span>{l.text}</span>
            </div>
          ))}
          {shown < lines.length && (
            <div className="lp-iv-typing"><span /><span /><span /></div>
          )}
        </div>
      </div>
      <div className="lp-iv-controls">
        <button className="lp-iv-btn lp-iv-btn--mic">🎙 Speaking</button>
        <button className="lp-iv-btn">Pause</button>
        <button className="lp-iv-btn lp-iv-btn--end">End interview</button>
      </div>
    </div>
  )
}

export function LivePreview_StudyPlans() {
  const plans = [
    { id: 'ai',     title: 'AI-Native PM',    weeks: 6, role: 'PMs at AI-first companies', color: '#e37d4a', soft: '#fbe1d0', scenarios: 42 },
    { id: 'growth', title: 'Growth Loops',    weeks: 4, role: 'B2C product leaders',        color: '#a878d6', soft: '#ecdeff', scenarios: 28 },
    { id: 'agent',  title: 'Agentic Products',weeks: 5, role: 'Builders shipping agents',   color: '#4a7c59', soft: '#cfe3d3', scenarios: 36 },
  ]
  const [selected, setSelected] = useState('agent')
  const sel = plans.find(p => p.id === selected)!

  return (
    <div className="lp-frame lp-cream">
      <div className="lp-sp-head">
        <h4 className="lp-h" style={{ margin: 0 }}>Study plans, calibrated to your role</h4>
        <span className="lp-pill">14 plans</span>
      </div>
      <div className="lp-sp-grid">
        {plans.map(p => (
          <button
            key={p.id}
            className="lp-sp-card"
            style={selected === p.id ? { borderColor: p.color, background: p.soft } : undefined}
            onClick={() => setSelected(p.id)}
          >
            <div className="lp-sp-tile" style={{ background: p.color }}>
              {p.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="lp-sp-title">{p.title}</div>
              <div className="lp-sp-sub">{p.weeks} weeks · {p.scenarios} scenarios</div>
            </div>
          </button>
        ))}
      </div>
      <div className="lp-sp-detail" style={{ background: sel.soft }}>
        <div>
          <div className="lp-sp-detail-eyebrow">Selected · for {sel.role}</div>
          <div className="lp-sp-detail-h" style={{ color: sel.color }}>{sel.title}</div>
          <div className="lp-sp-weeks">
            {Array.from({ length: sel.weeks }).map((_, i) => (
              <div key={i} className="lp-sp-week">
                <div className="lp-sp-week-bar" style={{ background: i < 2 ? sel.color : 'rgba(0,0,0,0.1)' }} />
                <div className="lp-sp-week-label">W{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="lp-cta-pill" style={{ background: sel.color }}>Start plan →</button>
      </div>
    </div>
  )
}

export function LivePreview_LumaCoach() {
  const convo = [
    { who: 'you',  text: "I'm stuck framing this. The metric moved but I don't know which lever caused it." },
    { who: 'luma', text: "Stuck is fine. Let's narrow. Which metric, and what timeframe?", chips: ['Session length', 'Conversion', 'Retention'] },
    { who: 'you',  text: 'Session length, last 6 weeks.' },
    { who: 'luma', text: "Three quick hypotheses you'd bet on. Go." },
  ]
  const [step, setStep] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setStep(s => s >= convo.length ? 1 : s + 1), 2200)
    return () => clearInterval(t)
  }, [convo.length])

  return (
    <div className="lp-frame lp-cream lp-coach">
      <div className="lp-coach-head">
        <HatchGlyph size={32} state="reviewing" />
        <div>
          <div className="lp-coach-title">Ask Hatch</div>
          <div className="lp-coach-sub">Always-on · context-aware · brutally specific</div>
        </div>
        <span className="lp-pill lp-pill--green">● online</span>
      </div>
      <div className="lp-coach-stream">
        {convo.slice(0, step).map((m, i) => (
          <div key={i} className={`lp-msg lp-msg--${m.who} anim-fade-up`}>
            {m.who === 'luma' && <HatchGlyph size={24} state="idle" />}
            <div>
              <div className="lp-msg-bubble">{m.text}</div>
              {m.chips && (
                <div className="lp-msg-chips">
                  {m.chips.map(c => <button key={c} className="lp-chip">{c}</button>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {step < convo.length && (
          <div className="lp-msg lp-msg--luma">
            <HatchGlyph size={24} state="reviewing" />
            <div className="lp-msg-bubble lp-typing"><span /><span /><span /></div>
          </div>
        )}
      </div>
      <div className="lp-coach-input">
        <input placeholder="Ask Hatch anything…" disabled />
        <button>↑</button>
      </div>
    </div>
  )
}

export function LivePreview_Grading() {
  const [tab, setTab] = useState('frame')
  const tabs = [
    { id: 'frame', label: 'Frame',    score: 82, color: '#4a7c59' },
    { id: 'list',  label: 'List',     score: 64, color: '#6b8275' },
    { id: 'opt',   label: 'Optimize', score: 71, color: '#c9933a' },
    { id: 'win',   label: 'Win',      score: 58, color: '#a878d6' },
  ]
  const t = tabs.find(x => x.id === tab)!
  const c = 2 * Math.PI * 44

  const rubricMap: Record<string, Array<{ k: string; got: boolean; note?: string }>> = {
    frame: [
      { k: 'Picked the right problem',  got: true,  note: 'You called out discovery vs. supply.' },
      { k: 'Defined success up front',  got: true,  note: 'Clear: session length, leading indicator.' },
      { k: 'Named your assumption',     got: false, note: "'no eng changes' is a claim, not a fact." },
    ],
    list: [
      { k: 'Covered demand & supply',   got: true },
      { k: 'Considered seasonality',    got: false, note: 'World Cup happened in week 3.' },
      { k: 'Ranked by reversibility',   got: false },
    ],
    opt: [
      { k: 'Picked one to test first',  got: true },
      { k: 'Sized the bet',             got: true },
      { k: 'Defined kill criteria',     got: false },
    ],
    win: [
      { k: 'Connected to revenue',      got: true },
      { k: 'Wrote the ship/no-ship rule', got: false },
      { k: "Pre-mortem'd the risk",     got: false },
    ],
  }
  const rubric = rubricMap[tab]

  return (
    <div className="lp-frame lp-cream">
      <div className="lp-grade-head">
        <span className="lp-tag lp-tag--ai-native">Graded · AI-Native challenge</span>
        <h4 className="lp-h" style={{ margin: '6px 0 0' }}>Spotify&apos;s 15% session drop</h4>
      </div>
      <div className="lp-grade-body">
        <div className="lp-grade-ring">
          <svg viewBox="0 0 100 100" width="160" height="160">
            <circle cx="50" cy="50" r="44" stroke="rgba(0,0,0,0.08)" strokeWidth="6" fill="none" />
            <circle
              cx="50" cy="50" r="44"
              stroke={t.color} strokeWidth="6" fill="none"
              strokeDasharray={`${(t.score / 100) * c} ${c}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 700ms cubic-bezier(.2,.8,.2,1), stroke 300ms' }}
            />
          </svg>
          <div className="lp-grade-score">
            <div className="lp-grade-num" style={{ color: t.color }}>{t.score}</div>
            <div className="lp-grade-of">{t.label} score</div>
          </div>
        </div>
        <div className="lp-grade-rubric">
          <div className="lp-grade-tabs">
            {tabs.map(x => (
              <button
                key={x.id}
                className={`lp-grade-tab ${tab === x.id ? 'lp-grade-tab--active' : ''}`}
                onClick={() => setTab(x.id)}
                style={tab === x.id ? { color: x.color, borderColor: x.color } : undefined}
              >
                {x.label} <b>{x.score}</b>
              </button>
            ))}
          </div>
          <div className="lp-grade-list" key={tab}>
            {rubric.map((r, i) => (
              <div key={i} className={`lp-grade-row ${r.got ? 'lp-grade-row--got' : 'lp-grade-row--miss'} anim-fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="lp-grade-mark">{r.got ? '✓' : '—'}</div>
                <div>
                  <div className="lp-grade-k">{r.k}</div>
                  {r.note && <div className="lp-grade-note">{r.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
