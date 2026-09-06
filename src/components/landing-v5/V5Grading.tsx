import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "./icons";
import { Reveal } from "./motion";

const dims = [
  ["Framing & scoping", 90],
  ["Architecture", 85],
  ["Tradeoffs", 80],
  ["Failure modes", 76],
  ["Failure handling", 95],
] as const;

export function V5Grading() {
  return (
    <section className="section grading-section" id="grading">
      <div className="page-shell grading-grid">
        <Reveal className="grading-copy">
          <div className="eyebrow">HOW REVIEW WORKS</div>
          <h2>See how your reasoning is reviewed.</h2>
          <p>Hatch reviews your approach, decisions, assumptions, and tradeoffs so you know exactly what held up and what needs work.</p>
          <ul className="check-list">
            <li><span><CheckIcon size={16}/></span>Detailed feedback on strengths and gaps</li>
            <li><span><CheckIcon size={16}/></span>Evidence across concrete problem dimensions</li>
            <li><span><CheckIcon size={16}/></span>Review that explains why an answer is strong or weak</li>
          </ul>
        </Reveal>
        <Reveal className="product-panel" delay={80}>
          <div className="product-topbar">
            <div><span className="product-dot"/>System Design <span className="muted">/ Example submission review</span></div>
            <Link
              href="/practice"
              style={{
                background: "var(--forest)",
                color: "var(--cream)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 10,
              }}
            >
              New practice
            </Link>
          </div>
          <div className="product-body">
            <aside className="product-sidebar"><Image src="/landing-v5/hackproduct-mark.svg" alt="" width={24} height={24} className="product-sidebar-mark" /><i/><i/><i/><i/></aside>
            <div className="score-column">
              <small>OVERALL SCORE</small>
              <div className="score-ring"><strong>87</strong><span>/100</span></div>
              <p>Strong framing and architecture. Go deeper on failure modes.</p>
              <div className="dimension-list">
                {dims.map(([name, score]) => (
                  <div className="dimension" key={name}>
                    <div><span>{name}</span><strong>{score}</strong></div>
                    <div className="dimension-bar"><i style={{ "--score": `${score}%` } as React.CSSProperties}/></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="feedback-column">
              <div className="feedback-title"><Image src="/landing-v5/hackproduct-mark.svg" alt="" width={25} height={25}/><strong>Hatch feedback</strong></div>
              <div className="feedback-card positive"><b>Strong</b><p>Good call using a cache layer and separating read/write paths.</p></div>
              <div className="feedback-card improve"><b>Go deeper</b><p>What happens during a regional outage? Explain failover and data consistency.</p></div>
              <div className="feedback-card question"><b>Follow-up</b><p>How would the design change at 10× traffic?</p></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
