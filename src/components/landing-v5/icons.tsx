import type { ReactNode } from "react";

type IconProps = { size?: number; className?: string };

function IconFrame({ children, size = 24, className = "" }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function CodeIcon(p: IconProps) {
  return <IconFrame {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconFrame>;
}
export function SqlIcon(p: IconProps) {
  return <IconFrame {...p}><ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke="currentColor" strokeWidth="1.8"/></IconFrame>;
}
export function SystemIcon(p: IconProps) {
  return <IconFrame {...p}><rect x="9" y="3" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="16" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="15" y="16" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M6 16v-4h12v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconFrame>;
}
export function JudgmentIcon(p: IconProps) {
  return <IconFrame {...p}><path d="M12 3v18M5 7h14M7 7l-3 6h6L7 7ZM17 7l-3 6h6l-3-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconFrame>;
}
export function AgentIcon(p: IconProps) {
  return <IconFrame {...p}><path d="M12 3l1.5 4.1L18 8.5l-4.5 1.4L12 14l-1.5-4.1L6 8.5l4.5-1.4L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m5 14 .9 2.2L8 17l-2.1.8L5 20l-.9-2.2L2 17l2.1-.8L5 14ZM19 13l.7 1.8 1.8.7-1.8.7L19 18l-.7-1.8-1.8-.7 1.8-.7L19 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></IconFrame>;
}
export function ArrowIcon(p: IconProps) {
  return <IconFrame {...p}><path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></IconFrame>;
}
export function CheckIcon(p: IconProps) {
  return <IconFrame {...p}><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></IconFrame>;
}
export function MenuIcon(p: IconProps) {
  return <IconFrame {...p}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconFrame>;
}
export function CloseIcon(p: IconProps) {
  return <IconFrame {...p}><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></IconFrame>;
}
