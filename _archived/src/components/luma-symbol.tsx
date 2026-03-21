import { cn } from "@/lib/utils";

const sizes = {
  sm: 16,
  md: 24,
  lg: 48,
} as const;

type LumaSize = keyof typeof sizes;

interface LumaSymbolProps {
  size?: LumaSize | number;
  active?: boolean;
  className?: string;
  id?: string;
}

export function LumaSymbol({
  size = "md",
  active = false,
  className,
  id,
}: LumaSymbolProps) {
  const px = typeof size === "number" ? size : sizes[size];
  const gradientId = id ?? `luma-${px}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn(active && "animate-luma-pulse", "shrink-0", className)}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          {active ? (
            <>
              <stop offset="0%" stopColor="#D4FF2A" />
              <stop offset="100%" stopColor="#B8E600" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="currentColor" />
              <stop offset="100%" stopColor="currentColor" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M16 3 L29 16 L16 29 L3 16 Z"
        fill={`url(#${gradientId})`}
        opacity="0.9"
      />
      <circle
        cx="16"
        cy="16"
        r="6"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle
        cx="16"
        cy="16"
        r="10"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="0.75"
        opacity="0.25"
      />
    </svg>
  );
}

export function LumaSymbolLarge({
  active = true,
  className,
  id = "lumaLarge",
}: {
  active?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(active && "animate-luma-pulse", className)}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke={`url(#${id})`}
        strokeWidth="1.5"
        opacity="0.3"
      />
      <circle
        cx="60"
        cy="60"
        r="40"
        stroke={`url(#${id})`}
        strokeWidth="2"
        opacity="0.6"
      />
      <path
        d="M60 20L90 60L60 100L30 60Z"
        fill={`url(#${id})`}
        opacity="0.15"
      />
      <path
        d="M60 20L90 60L60 100L30 60Z"
        stroke={`url(#${id})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="60" r="6" fill={`url(#${id})`} />
      <line x1="60" y1="38" x2="60" y2="28" stroke={`url(#${id})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="60" y1="92" x2="60" y2="82" stroke={`url(#${id})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="38" y1="60" x2="28" y2="60" stroke={`url(#${id})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="92" y1="60" x2="82" y2="60" stroke={`url(#${id})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <defs>
        <linearGradient
          id={id}
          x1="20"
          y1="20"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          {active ? (
            <>
              <stop stopColor="#D4FF2A" />
              <stop offset="0.5" stopColor="#C8F020" />
              <stop offset="1" stopColor="#B8E600" />
            </>
          ) : (
            <>
              <stop stopColor="currentColor" />
              <stop offset="1" stopColor="currentColor" />
            </>
          )}
        </linearGradient>
      </defs>
    </svg>
  );
}
