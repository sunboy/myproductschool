"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "./icons";
import { Reveal } from "./motion";
import { V5Brand } from "./V5Brand";

function openSignup() {
  window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "signup" } }));
}

export function V5Footer() {
  return (
    <footer className="footer">
      <div className="page-shell">
        <Reveal className="final-cta">
          <div className="footer-hatch"><Image src="/landing-v5/hatch.png" alt="" width={210} height={210}/></div>
          <div>
            <div className="eyebrow">SEE HOW HACKPRODUCT GRADES YOU</div>
            <h2>Start with one practice session.</h2>
            <p>Pick an area, work through a realistic prompt, and see exactly how your reasoning is scored.</p>
          </div>
          <button className="button" type="button" onClick={openSignup}>
            Start a practice session <ArrowIcon size={18}/>
          </button>
        </Reveal>
        <div className="footer-bottom">
          <V5Brand />
          <nav>
            <a href="#grading">How it works</a>
            <Link href="/practice">Practice areas</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/claude-code-analytics">AI workflows</Link>
          </nav>
          <span>© {new Date().getFullYear()} HackProduct</span>
        </div>
      </div>
    </footer>
  );
}
