'use client'

export type LumaState = 'idle' | 'listening' | 'reviewing' | 'speaking' | 'celebrating' | 'none'

interface LumaGlyphProps {
  size?: number
  className?: string
  state?: LumaState
  /** @deprecated Use state='idle' instead */
  animated?: boolean
}

export function LumaGlyph({
  size = 32,
  className = '',
  state: stateProp,
  animated,
}: LumaGlyphProps) {
  const state: LumaState = stateProp ?? (animated ? 'idle' : 'none')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 72"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {/* ── Reviewing: thinking glow aura ── */}
      {state === 'reviewing' && (
        <g>
          <ellipse cx="32" cy="38" rx="30" ry="32" fill="none" stroke="#c8e8d0" strokeWidth="1.5" opacity="0.3">
            <animate attributeName="rx" values="30;33;30" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="ry" values="32;35;32" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="32" cy="38" rx="26" ry="28" fill="none" stroke="#8ecf9e" strokeWidth="1" opacity="0.2">
            <animate attributeName="rx" values="26;28;26" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="ry" values="28;30;28" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}

      {/* ── Celebrating: sparkles ── */}
      {state === 'celebrating' && (
        <g>
          <circle cx="8" cy="20" r="1.5" fill="#c4a66a">
            <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="cy" values="22;16;22" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="56" cy="18" r="1.5" fill="#c4a66a">
            <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="cy" values="20;14;20" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="50" r="1" fill="#8ecf9e">
            <animate attributeName="opacity" values="0;1;0" dur="0.6s" begin="0.15s" repeatCount="indefinite" />
          </circle>
          <circle cx="52" cy="52" r="1" fill="#8ecf9e">
            <animate attributeName="opacity" values="0;1;0" dur="0.6s" begin="0.45s" repeatCount="indefinite" />
          </circle>
          <path d="M50 6 L51 9 L54 10 L51 11 L50 14 L49 11 L46 10 L49 9 Z" fill="#c4a66a">
            <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.2s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="rotate" values="0 50 10;20 50 10;0 50 10" dur="1s" begin="0.2s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* ── Graduation cap ── */}
      <g>
        <polygon points="18,22 46,22 50,16 14,16" fill="#4a7c59" />
        <rect x="22" y="10" width="20" height="12" rx="1" fill="#4a7c59" />
        <circle cx="32" cy="10" r="1.5" fill="#4a7c59" />
        <line x1="42" y1="12" x2="46" y2="18" stroke="#4a7c59" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="46" cy="19" r="1.5" fill="#4a7c59" />

        {state === 'celebrating' && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;0,-5;0,0"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
        {state === 'idle' && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;0,-1;0,0"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
      </g>

      {/* ── Growth arrow (top-right) ── */}
      <g>
        <line x1="48" y1="18" x2="54" y2="10" stroke="#8ecf9e" strokeWidth="2.5" strokeLinecap="round" />
        <polyline points="50,10 54,10 54,14" stroke="#8ecf9e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {state === 'celebrating' && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0;3,-3;0,0"
            dur="0.8s"
            repeatCount="indefinite"
          />
        )}
        {state === 'reviewing' && (
          <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
        )}
      </g>

      {/* ── Listening: headphones ── */}
      {state === 'listening' && (
        <g>
          <path d="M10 36 Q10 14 32 14 Q54 14 54 36" stroke="#4a7c59" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="5" y="30" width="10" height="14" rx="4" fill="#4a7c59" stroke="#2e3230" strokeWidth="0.5">
            <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <rect x="49" y="30" width="10" height="14" rx="4" fill="#4a7c59" stroke="#2e3230" strokeWidth="0.5">
            <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
          </rect>
          <path d="M3 34 Q0 37 3 40" stroke="#8ecf9e" strokeWidth="1" fill="none" strokeLinecap="round">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite" />
          </path>
          <path d="M61 34 Q64 37 61 40" stroke="#8ecf9e" strokeWidth="1" fill="none" strokeLinecap="round">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* ── Ear nubs (hidden when headphones on) ── */}
      {state !== 'listening' && (
        <>
          <rect x="8" y="32" width="6" height="10" rx="3" fill="#4a7c59" />
          <rect x="50" y="32" width="6" height="10" rx="3" fill="#4a7c59" />
        </>
      )}

      {/* ── Head ── */}
      <rect x="14" y="22" width="36" height="30" rx="8" fill="#f5f1ea" stroke="#4a7c59" strokeWidth="3">
        {state === 'speaking' && (
          <animate attributeName="rx" values="8;9;8" dur="0.8s" repeatCount="indefinite" />
        )}
      </rect>

      {/* ── Eyes ── */}
      <g>
        {state === 'none' && (
          <>
            <circle cx="25" cy="36" r="2.5" fill="#4a7c59" />
            <circle cx="39" cy="36" r="2.5" fill="#4a7c59" />
          </>
        )}

        {state === 'idle' && (
          <>
            <ellipse cx="25" cy="36" rx="3" ry="1.5" fill="#4a7c59">
              <animate attributeName="ry" values="1.5;0.5;1.5" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="39" cy="36" rx="3" ry="1.5" fill="#4a7c59">
              <animate attributeName="ry" values="1.5;0.5;1.5" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </>
        )}

        {state === 'listening' && (
          <>
            <circle cx="25" cy="35" r="3" fill="#4a7c59">
              <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="39" cy="35" r="3" fill="#4a7c59">
              <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="26.5" cy="34" r="1" fill="white" opacity="0.9" />
            <circle cx="40.5" cy="34" r="1" fill="white" opacity="0.9" />
          </>
        )}

        {state === 'reviewing' && (
          <>
            <circle cx="25" cy="34" r="3" fill="#4a7c59">
              <animate attributeName="cy" values="34;32;34;34;34" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cx" values="25;26;25;24;25" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="39" cy="34" r="3" fill="#4a7c59">
              <animate attributeName="cy" values="34;32;34;34;34" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cx" values="39;40;39;38;39" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="26" cy="33" r="1" fill="white" opacity="0.8" />
            <circle cx="40" cy="33" r="1" fill="white" opacity="0.8" />
          </>
        )}

        {state === 'speaking' && (
          <>
            <circle cx="25" cy="35" r="3" fill="#4a7c59" />
            <circle cx="39" cy="35" r="3" fill="#4a7c59" />
            <circle cx="26.5" cy="34" r="1.2" fill="white" opacity="0.9" />
            <circle cx="40.5" cy="34" r="1.2" fill="white" opacity="0.9" />
          </>
        )}

        {state === 'celebrating' && (
          <>
            <path d="M22 36 Q25 33 28 36" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <animate attributeName="d" values="M22 36 Q25 33 28 36;M22 35 Q25 32 28 35;M22 36 Q25 33 28 36" dur="0.6s" repeatCount="indefinite" />
            </path>
            <path d="M36 36 Q39 33 42 36" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <animate attributeName="d" values="M36 36 Q39 33 42 36;M36 35 Q39 32 42 35;M36 36 Q39 33 42 36" dur="0.6s" repeatCount="indefinite" />
            </path>
          </>
        )}
      </g>

      {/* ── Mouth ── */}
      <g>
        {state === 'none' && (
          <line x1="27" y1="44" x2="37" y2="44" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" />
        )}

        {state === 'idle' && (
          <ellipse cx="32" cy="44" rx="4" ry="3" fill="#4a7c59" opacity="0.8">
            <animate attributeName="ry" values="3;5;5;3" dur="4s" repeatCount="indefinite" />
            <animate attributeName="rx" values="4;3;3;4" dur="4s" repeatCount="indefinite" />
          </ellipse>
        )}

        {state === 'listening' && (
          <path d="M27 43 Q32 46 37 43" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}

        {state === 'reviewing' && (
          <path d="M27 44 Q30 42 32 44 Q34 46 37 44" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" fill="none">
            <animate
              attributeName="d"
              values="M27 44 Q30 42 32 44 Q34 46 37 44;M27 43 Q30 45 32 43 Q34 41 37 43;M27 44 Q30 42 32 44 Q34 46 37 44"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        )}

        {state === 'speaking' && (
          <ellipse cx="32" cy="44" rx="4" ry="2" fill="#4a7c59" opacity="0.8">
            <animate attributeName="ry" values="2;4;1;3;2" dur="0.8s" repeatCount="indefinite" />
          </ellipse>
        )}

        {state === 'celebrating' && (
          <path d="M25 42 Q32 50 39 42" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <animate
              attributeName="d"
              values="M25 42 Q32 50 39 42;M25 41 Q32 51 39 41;M25 42 Q32 50 39 42"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </path>
        )}
      </g>

      {/* ── Reviewing: thought bubble ── */}
      {state === 'reviewing' && (
        <g>
          <circle cx="52" cy="22" r="1.5" fill="#c4c8bc">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="56" cy="16" r="2.5" fill="#c4c8bc">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" begin="0.3s" repeatCount="indefinite" />
          </circle>
          <ellipse cx="58" cy="8" rx="5" ry="4" fill="#c4c8bc" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.6s" repeatCount="indefinite" />
          </ellipse>
          <text x="56" y="11" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#4a7c59" opacity="0.7">
            <tspan>?</tspan>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="0.6s" repeatCount="indefinite" />
          </text>
        </g>
      )}

      {/* ── Listening: notepad ── */}
      {state === 'listening' && (
        <g>
          <rect x="46" y="50" width="12" height="14" rx="1.5" fill="#f5f1ea" stroke="#4a7c59" strokeWidth="1.5">
            <animate attributeName="y" values="50;49;50" dur="2s" repeatCount="indefinite" />
          </rect>
          <line x1="48.5" y1="54" x2="55.5" y2="54" stroke="#c4c8bc" strokeWidth="1" strokeLinecap="round" />
          <line x1="48.5" y1="57" x2="54" y2="57" stroke="#c4c8bc" strokeWidth="1" strokeLinecap="round" />
          <line x1="48.5" y1="60" x2="53" y2="60" stroke="#c4c8bc" strokeWidth="1" strokeLinecap="round">
            <animate attributeName="x2" values="49;53;49" dur="1.5s" repeatCount="indefinite" />
          </line>
          <line x1="56" y1="52" x2="59" y2="48" stroke="#c4a66a" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="x2" values="59;58;59" dur="1s" repeatCount="indefinite" />
            <animate attributeName="y2" values="48;47;48" dur="1s" repeatCount="indefinite" />
          </line>
        </g>
      )}

      {/* ── Idle: ZZZ ── */}
      {state === 'idle' && (
        <g>
          <text x="46" y="28" fontSize="7" fontWeight="bold" fill="#4a7c59" opacity="0">
            z
            <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite" />
            <animate attributeName="y" values="28;22;28" dur="4s" repeatCount="indefinite" />
          </text>
          <text x="52" y="22" fontSize="5" fontWeight="bold" fill="#4a7c59" opacity="0">
            z
            <animate attributeName="opacity" values="0;0.4;0" dur="4s" begin="0.8s" repeatCount="indefinite" />
            <animate attributeName="y" values="22;16;22" dur="4s" begin="0.8s" repeatCount="indefinite" />
          </text>
          <text x="56" y="18" fontSize="4" fontWeight="bold" fill="#4a7c59" opacity="0">
            z
            <animate attributeName="opacity" values="0;0.3;0" dur="4s" begin="1.6s" repeatCount="indefinite" />
            <animate attributeName="y" values="18;12;18" dur="4s" begin="1.6s" repeatCount="indefinite" />
          </text>
        </g>
      )}

      {/* ── Global idle float ── */}
      {state === 'idle' && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0;0,-1.5;0,0"
          dur="3s"
          repeatCount="indefinite"
        />
      )}
    </svg>
  )
}
