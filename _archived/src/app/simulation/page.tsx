"use client";

import {
  useReducer,
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, X, Clock, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LumaSymbol } from "@/components/luma-symbol";
import {
  SCENARIOS,
  INTERRUPT_SCRIPTS,
  INTERRUPT_META,
  type ChatMessage,
  type LumaInterruptType,
  type SimulationScenario,
} from "@/lib/simulation";
import Link from "next/link";

/* ─── Typing indicator ───────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4 animate-msg-in">
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
        <LumaSymbol size="sm" active />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Timer ──────────────────────────────────────────────────── */
function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return elapsed;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ─── Chat state ─────────────────────────────────────────────── */
type State = {
  messages: ChatMessage[];
  userTurns: number;
  thinking: boolean;
  ended: boolean;
};

type Action =
  | { type: "ADD_USER"; content: string }
  | { type: "ADD_LUMA"; content: string; interruptType?: LumaInterruptType }
  | { type: "SET_THINKING"; value: boolean }
  | { type: "END" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_USER":
      return {
        ...state,
        userTurns: state.userTurns + 1,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "user", content: action.content, timestamp: Date.now() },
        ],
      };
    case "ADD_LUMA":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "luma", content: action.content, interruptType: action.interruptType ?? "neutral", timestamp: Date.now() },
        ],
      };
    case "SET_THINKING":
      return { ...state, thinking: action.value };
    case "END":
      return { ...state, ended: true };
    default:
      return state;
  }
}

/* ─── Luma bubble ────────────────────────────────────────────── */
function LumaMessage({ msg }: { msg: ChatMessage }) {
  const meta = INTERRUPT_META[msg.interruptType ?? "neutral"];
  const showTag = msg.interruptType && !["opening", "neutral"].includes(msg.interruptType);
  return (
    <div className="flex items-end gap-2 mb-5 animate-msg-in">
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
        <LumaSymbol size="sm" active />
      </div>
      <div className="max-w-[82%] sm:max-w-[72%]">
        {showTag && (
          <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-1 ml-1 font-mono ${meta.labelColor}`}>
            {meta.label}
          </p>
        )}
        <div className={`rounded-2xl rounded-bl-sm bg-muted px-4 py-3 border-l-[3px] ${meta.borderColor}`}>
          <p className="text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap">
            {msg.content}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── User bubble ────────────────────────────────────────────── */
function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end mb-5 animate-msg-in">
      <div className="max-w-[82%] sm:max-w-[72%] rounded-2xl rounded-br-sm bg-foreground px-4 py-3">
        <p className="text-[15px] leading-[1.7] text-background whitespace-pre-wrap">
          {msg.content}
        </p>
      </div>
    </div>
  );
}

/* ─── End transition ─────────────────────────────────────────── */
function EndScreen({ elapsed }: { elapsed: number }) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setRedirecting(true); router.push("/simulation/debrief"); }, 2800);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-6 px-6 text-center z-50">
      <LumaSymbol size="lg" active />
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Simulation complete</h2>
        <p className="text-muted-foreground text-[15px]">
          {redirecting ? "Redirecting to your debrief\u2026" : "Luma is preparing your debrief\u2026"}
        </p>
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground font-mono tabular-nums">{formatTime(elapsed)}</span> elapsed
      </div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-1.5 w-1.5 rounded-full bg-foreground animate-typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Auto-resize textarea ───────────────────────────────────── */
function AutoTextarea({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!disabled && value.trim()) onSend(); }
  };
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKey}
      disabled={disabled}
      rows={1}
      placeholder="Think out loud\u2026"
      aria-label="Your response"
      className="flex-1 resize-none bg-transparent text-[15px] leading-[1.6] text-foreground placeholder:text-muted-foreground/50 outline-none min-h-[40px] max-h-[160px] py-2 pr-2"
    />
  );
}

/* ─── End confirm modal ──────────────────────────────────────── */
function EndConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-base font-semibold text-foreground mb-2">End simulation?</h3>
        <p className="text-sm text-muted-foreground mb-5">Luma will prepare a debrief based on everything you&apos;ve said so far.</p>
        <div className="flex gap-3">
          <Button onClick={onConfirm} className="flex-1 bg-foreground text-background hover:bg-foreground/90 cursor-pointer">Yes, end it</Button>
          <Button onClick={onCancel} variant="outline" className="flex-1 cursor-pointer">Keep going</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Scenario picker (no search params) ────────────────────── */
function ScenarioPicker() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-[680px] px-5 h-14 flex items-center">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">&larr; Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-[680px] px-5 py-12 flex-1">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <LumaSymbol size={22} active id="luma-picker" />
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 font-mono">Layer 4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Interview Simulation</h1>
          <p className="text-[15px] text-muted-foreground leading-[1.7]">
            Luma acts as a real interviewer &mdash; giving you an ambiguous prompt and pushing back on your answers in real time. Pick a scenario to begin.
          </p>
        </div>

        {/* Scenario cards */}
        <div className="flex flex-col gap-4 mb-10">
          {SCENARIOS.map((s) => (
            <Link key={s.id} href={`/simulation/chat?scenario=${s.id}`}>
              <div className="rounded-lg border border-border bg-card p-5 hover:border-foreground hover:shadow-sm transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 font-mono">{s.domain}</span>
                      <span className="text-muted-foreground/30">&middot;</span>
                      <span className="text-[11px] font-semibold text-foreground font-mono">{s.company}</span>
                    </div>
                    <p className="text-base font-semibold text-foreground mb-1.5">
                      {s.prompt}
                    </p>
                    <p className="text-sm text-muted-foreground leading-[1.6] line-clamp-2">
                      {s.context}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground/40 group-hover:text-foreground transition-colors mt-1 shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center">
          Simulations are typically 15&ndash;30 minutes. Luma evaluates your thinking in real time and delivers a debrief at the end.
        </p>
      </div>
    </div>
  );
}

/* ─── Chat interface ─────────────────────────────────────────── */
function ChatInterface({ scenario }: { scenario: SimulationScenario }) {
  const interruptScript = INTERRUPT_SCRIPTS[scenario.id] ?? INTERRUPT_SCRIPTS["collab-metrics"];
  const openingContent = `${scenario.context}\n\n${scenario.prompt}\n\n${scenario.openingNote}`;

  const [state, dispatch] = useReducer(reducer, {
    messages: [{ id: "opening", role: "luma", content: openingContent, interruptType: "opening", timestamp: Date.now() }],
    userTurns: 0,
    thinking: false,
    ended: false,
  });

  const [input, setInput] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const elapsed = useElapsedTimer(timerRunning && !state.ended);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingInterruptRef = useRef(0);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [state.messages, state.thinking, scrollToBottom]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const fireLumaResponse = useCallback((userTurns: number) => {
    const nextRule = interruptScript.find(
      (r, i) => i >= pendingInterruptRef.current && r.triggerAfterUserTurns <= userTurns
    );
    if (!nextRule) return;
    const ruleIndex = interruptScript.indexOf(nextRule);
    pendingInterruptRef.current = ruleIndex + 1;
    dispatch({ type: "SET_THINKING", value: true });
    const delay = 1200 + Math.random() * 1200;
    setTimeout(() => {
      dispatch({ type: "SET_THINKING", value: false });
      dispatch({ type: "ADD_LUMA", content: nextRule.message, interruptType: nextRule.type });
    }, delay);
  }, [interruptScript]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || state.thinking || state.ended) return;
    setInput("");
    dispatch({ type: "ADD_USER", content: trimmed });
  }, [input, state.thinking, state.ended]);

  useEffect(() => {
    if (state.userTurns === 0) return;
    fireLumaResponse(state.userTurns);
  }, [state.userTurns, fireLumaResponse]);

  const endSimulation = useCallback(() => {
    setTimerRunning(false);
    dispatch({ type: "END" });
    setShowEndConfirm(false);
  }, []);

  useEffect(() => {
    if (elapsed >= 30 * 60 && !state.ended) endSimulation();
  }, [elapsed, state.ended, endSimulation]);

  if (state.ended) return <EndScreen elapsed={elapsed} />;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-background z-30">
        <div className="mx-auto max-w-[720px] px-4 h-14 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              Interview Simulation &mdash; {scenario.company}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">{scenario.domain}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <Clock size={13} className={elapsed > 0 ? "text-foreground" : ""} />
            <span className={`font-mono tabular-nums ${elapsed >= 25 * 60 ? "text-[var(--warning)]" : ""}`}>{formatTime(elapsed)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(true)} className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer text-xs gap-1.5">
            <X size={13} />End
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[720px] px-4 pt-6 pb-4">
          <div className="mb-6 rounded-lg bg-muted/60 border border-border/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-0.5 font-mono">
              Scenario &mdash; {scenario.domain}
            </p>
            <p className="text-xs text-muted-foreground">{scenario.company} &middot; Interview simulation</p>
          </div>

          {state.messages.map((msg) =>
            msg.role === "luma"
              ? <LumaMessage key={msg.id} msg={msg} />
              : <UserMessage key={msg.id} msg={msg} />
          )}
          {state.thinking && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Scroll btn */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={14} />
        </button>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-background">
        <div className="mx-auto max-w-[720px] px-4 py-3">
          <div className="flex items-end gap-3 rounded-lg border border-border bg-card px-4 py-2 focus-within:border-foreground/50 transition-colors">
            <AutoTextarea value={input} onChange={setInput} onSend={handleSend} disabled={state.thinking || state.ended} />
            <button
              onClick={handleSend}
              disabled={!input.trim() || state.thinking || state.ended}
              aria-label="Send message"
              className="flex-shrink-0 mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all cursor-pointer"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
            Enter to send &middot; Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* End modal */}
      {showEndConfirm && (
        <EndConfirmModal onConfirm={endSimulation} onCancel={() => setShowEndConfirm(false)} />
      )}
    </div>
  );
}

/* ─── Router: picker vs chat ─────────────────────────────────── */
function SimulationRouter() {
  const searchParams = useSearchParams();
  // If no scenario param, show picker
  const scenarioId = searchParams.get("scenario");
  if (!scenarioId) return <ScenarioPicker />;

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return <ScenarioPicker />;

  return <ChatInterface scenario={scenario} />;
}

export default function SimulationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SimulationRouter />
    </Suspense>
  );
}
