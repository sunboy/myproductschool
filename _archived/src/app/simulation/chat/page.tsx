"use client";

import { Suspense, useReducer, useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, X, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SCENARIOS,
  INTERRUPT_SCRIPTS,
  INTERRUPT_META,
  type ChatMessage,
  type LumaInterruptType,
  type SimulationScenario,
} from "@/lib/simulation";
import { LumaSymbol } from "@/components/luma-symbol";

function LumaAvatar() {
  return (
    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
      <LumaSymbol size="sm" active />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4 animate-msg-in">
      <LumaAvatar />
      <div className="rounded-lg rounded-bl-sm bg-muted px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

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

type State = { messages: ChatMessage[]; userTurns: number; thinking: boolean; ended: boolean; };
type Action =
  | { type: "ADD_USER"; content: string }
  | { type: "ADD_LUMA"; content: string; interruptType?: LumaInterruptType }
  | { type: "SET_THINKING"; value: boolean }
  | { type: "END" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_USER":
      return { ...state, userTurns: state.userTurns + 1, messages: [...state.messages, { id: crypto.randomUUID(), role: "user", content: action.content, timestamp: Date.now() }] };
    case "ADD_LUMA":
      return { ...state, messages: [...state.messages, { id: crypto.randomUUID(), role: "luma", content: action.content, interruptType: action.interruptType ?? "neutral", timestamp: Date.now() }] };
    case "SET_THINKING":
      return { ...state, thinking: action.value };
    case "END":
      return { ...state, ended: true };
    default:
      return state;
  }
}

function LumaMessage({ msg }: { msg: ChatMessage }) {
  const meta = INTERRUPT_META[msg.interruptType ?? "neutral"];
  const showTag = msg.interruptType && !["opening", "neutral"].includes(msg.interruptType);
  return (
    <div className="flex items-end gap-2 mb-5 animate-msg-in">
      <LumaAvatar />
      <div className="max-w-[82%] sm:max-w-[72%]">
        {showTag && <p className={`text-[10px] font-mono font-semibold uppercase tracking-[0.1em] mb-1 ml-1 ${meta.labelColor}`}>{meta.label}</p>}
        <div className={`rounded-lg rounded-bl-sm bg-muted px-4 py-3 border-l-[3px] ${meta.borderColor}`}>
          <p className="text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end mb-5 animate-msg-in">
      <div className="max-w-[82%] sm:max-w-[72%] rounded-lg rounded-br-sm bg-primary px-4 py-3">
        <p className="text-[15px] leading-[1.7] text-primary-foreground whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function EndScreen({ elapsed }: { elapsed: number }) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setRedirecting(true); router.push("/simulation/debrief"); }, 2800);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-6 px-6 text-center z-50">
      <div className="animate-luma-pulse">
        <LumaSymbol size="lg" active />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Simulation complete</h2>
        <p className="text-muted-foreground text-[15px]">{redirecting ? "Redirecting to your debrief…" : "Luma is preparing your debrief…"}</p>
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-mono font-medium tabular-nums text-foreground">{formatTime(elapsed)}</span> elapsed
      </div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => <span key={i} className="block h-1.5 w-1.5 rounded-full bg-primary animate-typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />)}
      </div>
    </div>
  );
}

function AutoTextarea({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!disabled && value.trim()) onSend(); } }}
      disabled={disabled}
      rows={1}
      placeholder="Think out loud…"
      aria-label="Your response"
      className="flex-1 resize-none bg-transparent text-[15px] leading-[1.6] text-foreground placeholder:text-muted-foreground/50 outline-none min-h-[40px] max-h-[160px] py-2 pr-2"
    />
  );
}

function EndConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-base font-semibold text-foreground mb-2">End simulation?</h3>
        <p className="text-sm text-muted-foreground mb-5">Luma will prepare a debrief based on everything you've said so far.</p>
        <div className="flex gap-3">
          <Button onClick={onConfirm} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">Yes, end it</Button>
          <Button onClick={onCancel} variant="outline" className="flex-1 cursor-pointer">Keep going</Button>
        </div>
      </div>
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenarioId = searchParams.get("scenario") ?? "collab-metrics";
  const scenario: SimulationScenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const interruptScript = INTERRUPT_SCRIPTS[scenario.id] ?? INTERRUPT_SCRIPTS["collab-metrics"];
  const openingContent = `${scenario.context}\n\n${scenario.prompt}\n\n${scenario.openingNote}`;

  const [state, dispatch] = useReducer(reducer, {
    messages: [{ id: "opening", role: "luma", content: openingContent, interruptType: "opening", timestamp: Date.now() }],
    userTurns: 0, thinking: false, ended: false,
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
    const onScroll = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const fireLumaResponse = useCallback((userTurns: number) => {
    const nextRule = interruptScript.find((r, i) => i >= pendingInterruptRef.current && r.triggerAfterUserTurns <= userTurns);
    if (!nextRule) return;
    pendingInterruptRef.current = interruptScript.indexOf(nextRule) + 1;
    dispatch({ type: "SET_THINKING", value: true });
    setTimeout(() => {
      dispatch({ type: "SET_THINKING", value: false });
      dispatch({ type: "ADD_LUMA", content: nextRule.message, interruptType: nextRule.type });
    }, 1200 + Math.random() * 1200);
  }, [interruptScript]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || state.thinking || state.ended) return;
    setInput("");
    dispatch({ type: "ADD_USER", content: trimmed });
  }, [input, state.thinking, state.ended]);

  useEffect(() => { if (state.userTurns > 0) fireLumaResponse(state.userTurns); }, [state.userTurns, fireLumaResponse]);

  const endSimulation = useCallback(() => { setTimerRunning(false); dispatch({ type: "END" }); setShowEndConfirm(false); }, []);
  useEffect(() => { if (elapsed >= 30 * 60 && !state.ended) endSimulation(); }, [elapsed, state.ended, endSimulation]);

  if (state.ended) return <EndScreen elapsed={elapsed} />;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      <header className="flex-shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-md z-30">
        <div className="mx-auto max-w-[720px] px-4 h-14 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">Interview Simulation — {scenario.company}</p>
            <p className="text-[11px] font-mono text-muted-foreground">{scenario.domain}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-muted-foreground shrink-0">
            <Clock size={13} className={elapsed > 0 ? "text-primary" : ""} />
            <span className={elapsed >= 25 * 60 ? "text-[var(--warning)]" : ""}>{formatTime(elapsed)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(true)} className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer text-xs gap-1.5">
            <X size={13} />End
          </Button>
        </div>
      </header>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[720px] px-4 pt-6 pb-4">
          <div className="mb-6 rounded-xl bg-muted/60 border border-border/60 px-4 py-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-0.5">Scenario — {scenario.domain}</p>
            <p className="text-xs text-muted-foreground">{scenario.company} · Interview simulation</p>
          </div>
          {state.messages.map((msg) => msg.role === "luma" ? <LumaMessage key={msg.id} msg={msg} /> : <UserMessage key={msg.id} msg={msg} />)}
          {state.thinking && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {showScrollBtn && (
        <button onClick={() => scrollToBottom(true)} className="absolute bottom-20 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer" aria-label="Scroll to bottom">
          <ChevronDown size={14} />
        </button>
      )}

      <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-[720px] px-4 py-3">
          <div className="flex items-end gap-3 rounded-lg border border-border bg-card px-4 py-2 focus-within:border-primary/50 transition-colors">
            <AutoTextarea value={input} onChange={setInput} onSend={handleSend} disabled={state.thinking || state.ended} />
            <button onClick={handleSend} disabled={!input.trim() || state.thinking || state.ended} aria-label="Send message" className="flex-shrink-0 mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all cursor-pointer">
              <Send size={14} />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {showEndConfirm && <EndConfirmModal onConfirm={endSimulation} onCancel={() => setShowEndConfirm(false)} />}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-background" />}>
      <ChatContent />
    </Suspense>
  );
}
