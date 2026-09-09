import Image from "next/image";
import Link from "next/link";
import { AgentIcon, CheckIcon } from "./icons";
import { Reveal } from "./motion";

export function V5AIWork() {
  return (
    <section className="section ai-section" id="ai-work">
      <div className="page-shell ai-grid">
        <Reveal className="ai-visual">
          <div className="analysis-app">
            <div className="analysis-head"><span><AgentIcon size={18}/> AI-directed analysis</span><b>Example session</b></div>
            <div className="analysis-body">
              <aside className="analysis-chat">
                <div className="chat-label">HATCH</div>
                <p>What business question are you trying to answer?</p>
                <div className="chat-user">Which product categories drove the highest profit?</div>
                <div className="chat-label">AGENT PLAN</div>
                <ul><li>Define metric</li><li>Query dataset</li><li>Validate outliers</li></ul>
                <div className="agent-status"><CheckIcon size={14}/> User corrected aggregation</div>
              </aside>
              <div className="analysis-chart">
                <div className="chart-title"><strong>Profit percentage by category</strong><span>Result</span></div>
                <div className="bars">
                  {[78, 63, 55, 48, 40].map((h,i) => <i key={i} style={{ height: `${h}%` }}/>) }
                </div>
                <div className="bar-labels"><span>Accessories</span><span>Home</span><span>Apparel</span><span>Electronics</span><span>Beauty</span></div>
              </div>
              <aside className="analysis-review">
                <small>EXAMPLE REVIEW</small>
                <div className="review-score">82<span>/100</span></div>
                <div className="review-item good">✓ Clear scope</div>
                <div className="review-item warn">! Caught wrong aggregation</div>
                <div className="review-item good">✓ Validated result</div>
              </aside>
            </div>
          </div>
        </Reveal>
        <Reveal className="ai-copy" delay={70}>
          <div className="eyebrow">AI-DIRECTED ANALYTICS</div>
          <h2>Direct an AI agent through real analytical work.</h2>
          <p>Modern engineering work increasingly means supervising generated work: framing the problem, giving useful direction, checking assumptions, finding errors, and deciding when the output is good enough.</p>
          <div className="ai-points">
            <div><span>01</span><p><strong>Scope</strong> the problem before the agent starts.</p></div>
            <div><span>02</span><p><strong>Direct</strong> the workflow and adjust when it goes off course.</p></div>
            <div><span>03</span><p><strong>Inspect</strong> outputs, catch mistakes, and verify claims.</p></div>
            <div><span>04</span><p><strong>Defend</strong> the conclusion and the decisions that produced it.</p></div>
          </div>
          <div className="modern-role-note"><Image src="/landing-v5/hackproduct-mark.svg" alt="" width={28} height={28}/><p>Built for the shift toward AI engineering, FDE work, agentic systems, and AI-assisted development—not only traditional coding interviews.</p></div>
          <p className="ai-work-cta"><Link href="/claude-code-analytics">See Claude Code Analytics →</Link></p>
        </Reveal>
      </div>
    </section>
  );
}
