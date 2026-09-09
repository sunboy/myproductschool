"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AgentIcon, CodeIcon, JudgmentIcon, SqlIcon, SystemIcon } from "./icons";

const areas = [
  { key: "coding", title: "Coding / DSA", desc: <>Real problems. Clean code.<br />Optimal solutions.</>, icon: <CodeIcon />, href: "/challenges?type=algorithm" },
  { key: "sql", title: "SQL & Data", desc: <>Write queries. Analyze data.<br />Interpret results.</>, icon: <SqlIcon />, href: "/challenges?type=sql" },
  { key: "system", title: "System Design", desc: <>Design systems that scale.<br />Make the right tradeoffs.</>, icon: <SystemIcon />, href: "/challenges?type=system_design" },
  { key: "product", title: "Product Judgment", desc: <>Solve ambiguous problems.<br />Show product sense.</>, icon: <JudgmentIcon />, href: "/challenges?type=product_sense" },
  { key: "agent", title: "AI-Directed Analytics", desc: <>Work with AI to explore data,<br />build insights, drive decisions.</>, icon: <AgentIcon />, href: "/claude-code-analytics" },
];

const roleAreas: Record<string, string[]> = {
  "Software Engineer": ["coding", "sql", "system"],
  "Tech Lead": ["system", "product", "agent"],
  "Staff Engineer": ["system", "product", "agent"],
  "Engineering Manager": ["system", "product"],
  "AI Engineer": ["coding", "system", "agent"],
  "Forward-Deployed Engineer": ["sql", "system", "product", "agent"],
};

export function V5PracticeGrid() {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => setActiveRole((event as CustomEvent<string | null>).detail || null);
    window.addEventListener("hp-role-focus", handler as EventListener);
    return () => window.removeEventListener("hp-role-focus", handler as EventListener);
  }, []);

  const activeAreas = activeRole ? roleAreas[activeRole] ?? [] : [];

  return (
    <section className="reference-practice-strip" id="practice">
      <div className="reference-practice-grid">
        {areas.map((area) => {
          const active = !activeRole || activeAreas.includes(area.key);
          return (
            <Link
              key={area.key}
              href={area.href}
              className={`reference-practice-item ${active ? "is-role-active" : "is-role-muted"}`}
            >
              <div className="reference-practice-icon">{area.icon}</div>
              <div>
                <h2>{area.title}</h2>
                <p>{area.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
