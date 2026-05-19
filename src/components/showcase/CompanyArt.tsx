interface CompanyArtProps {
  name: string;
  slug: string;
  accent?: string;
  variant?: 'tile' | 'hero' | 'mini';
  className?: string;
}

function getArtKind(slug: string) {
  if (slug === 'airbnb') return 'arrow';
  if (slug === 'google' || slug === 'gmail') return 'envelope';
  if (slug === 'spotify') return 'wave';
  if (slug === 'notion') return 'blocks';
  if (slug === 'buffer' || slug === 'intercom') return 'chat';
  if (slug === 'stripe') return 'lines';
  if (slug === 'duolingo') return 'streak';
  return 'lines';
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

export function CompanyArt({
  name,
  slug,
  accent = '#4a7c59',
  variant = 'tile',
  className = '',
}: CompanyArtProps) {
  const artKind = getArtKind(slug);
  const initials = getInitials(name);

  return (
    <div className={`sc-company-art sc-company-art--${variant} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${slug}-paper`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#faf6f0" />
            <stop offset="0.58" stopColor="#f0e9d8" />
            <stop offset="1" stopColor="#e9dfc6" />
          </linearGradient>
          <pattern id={`${slug}-grid`} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke={accent} strokeWidth="0.45" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#${slug}-paper)`} />
        <rect width="400" height="300" fill={`url(#${slug}-grid)`} opacity="0.55" />

        {artKind === 'arrow' && (
          <>
            <rect x="240" y="40" width="110" height="220" rx="6" fill="#fbe1d0" stroke={accent} strokeOpacity="0.18" />
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x="252" y={56 + i * 24} width="86" height="6" rx="2" fill={accent} opacity="0.16" />
            ))}
            <rect x="50" y="120" width="100" height="80" rx="10" fill="#1e3528" />
            <rect x="62" y="132" width="76" height="42" rx="5" fill={accent} opacity="0.55" />
            <rect x="62" y="180" width="44" height="6" rx="2" fill="#f3ede0" opacity="0.82" />
            <path d="M 150 160 C 210 90, 240 70, 280 100" stroke="#1e3528" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="280" cy="100" r="6" fill="#c9933a" />
          </>
        )}

        {artKind === 'lines' && (
          <>
            <rect x="40" y="60" width="320" height="180" rx="14" fill="#fdfbf6" stroke={accent} strokeOpacity="0.2" />
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <g key={i} opacity={0.55 + (i % 2) * 0.22}>
                <rect x="60" y={88 + i * 18} width={[18, 14, 22, 16, 20, 18, 12][i]} height="6" rx="2" fill={accent} opacity="0.35" />
                <rect x={[84, 80, 88, 82, 86, 84, 78][i]} y={88 + i * 18} width={[120, 80, 100, 110, 90, 130, 70][i]} height="6" rx="2" fill="#1e1b14" opacity="0.50" />
                <rect x={[210, 166, 194, 198, 182, 220, 156][i]} y={88 + i * 18} width={[40, 60, 30, 50, 70, 30, 80][i]} height="6" rx="2" fill={accent} opacity="0.78" />
              </g>
            ))}
            <circle cx="335" cy="78" r="5" fill={accent} opacity="0.85" />
          </>
        )}

        {artKind === 'blocks' && (
          <>
            <rect x="60" y="60" width="280" height="38" rx="6" fill="#fdfbf6" stroke={accent} strokeOpacity="0.22" />
            <text x="74" y="84" fontFamily="Literata, Georgia, serif" fontSize="18" fill={accent}>/</text>
            <rect x="86" y="68" width="200" height="22" rx="3" fill={accent} opacity="0.12" />
            <rect x="60" y="112" width="280" height="58" rx="6" fill="#ece8e0" />
            <rect x="60" y="184" width="180" height="38" rx="6" fill="#fdfbf6" stroke={accent} strokeOpacity="0.2" />
            <rect x="248" y="184" width="92" height="38" rx="6" fill={accent} opacity="0.55" />
            <rect x="60" y="236" width="120" height="22" rx="3" fill={accent} opacity="0.20" />
          </>
        )}

        {artKind === 'wave' && (
          <>
            {Array.from({ length: 32 }).map((_, i) => {
              const h = 30 + 80 * Math.abs(Math.sin(i * 0.6));
              return (
                <rect
                  key={i}
                  x={40 + i * 11}
                  y={150 - h / 2}
                  width="6"
                  height={h}
                  rx="3"
                  fill={accent}
                  opacity={0.30 + (i % 3) * 0.18}
                />
              );
            })}
          </>
        )}

        {artKind === 'envelope' && (
          <>
            <rect x="80" y="80" width="200" height="140" rx="10" fill="#fdfbf6" stroke={accent} strokeOpacity="0.30" />
            <path d="M 80 90 L 180 165 L 280 90" stroke={accent} strokeOpacity="0.50" fill="none" strokeWidth="1.6" />
            <circle cx="290" cy="200" r="38" fill="#fbd9d0" stroke={accent} strokeOpacity="0.40" />
            <path d="M 290 178 L 290 200 L 308 210" stroke={accent} strokeWidth="3" strokeLinecap="round" fill="none" />
            <text x="244" y="252" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="10" fill={accent} opacity="0.75">5s</text>
          </>
        )}

        {artKind === 'chat' && (
          <>
            <rect x="60" y="80" width="180" height="42" rx="14" fill="#fdfbf6" stroke={accent} strokeOpacity="0.25" />
            <rect x="160" y="138" width="180" height="42" rx="14" fill={accent} opacity="0.82" />
            <rect x="60" y="196" width="140" height="42" rx="14" fill="#fdfbf6" stroke={accent} strokeOpacity="0.25" />
            <circle cx="320" cy="68" r="22" fill={accent} />
            <text x="313" y="74" fontFamily="Nunito Sans, system-ui, sans-serif" fontSize="14" fill="#fdfbf6" fontWeight="700">3</text>
          </>
        )}

        {artKind === 'streak' && (
          <>
            <circle cx="200" cy="150" r="80" fill="#dcf4cb" stroke={accent} strokeWidth="2" strokeOpacity="0.4" strokeDasharray="6 4" />
            <path d="M 200 100 C 180 130, 175 150, 200 180 C 225 150, 220 130, 200 100 Z" fill={accent} />
            <text x="172" y="160" fontFamily="Literata, Georgia, serif" fontSize="28" fill="#fdfbf6" fontWeight="700">365</text>
          </>
        )}

        <g opacity="0.08">
          <text
            x="330"
            y="258"
            textAnchor="middle"
            fontFamily="Literata, Georgia, serif"
            fontSize="72"
            fontWeight="700"
            fill="#1e1b14"
          >
            {initials}
          </text>
        </g>
      </svg>
    </div>
  );
}
