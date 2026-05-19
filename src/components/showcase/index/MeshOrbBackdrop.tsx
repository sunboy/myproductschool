'use client';

/**
 * Fixed-position mesh orb backdrop for the showcase wing.
 *
 * Phase 1: static. The CSS keyframes (orb-drift-1/2/3) are defined in
 * showcase.css but not applied here — they ship in Phase 2.
 *
 * backdrop-filter is NOT used here; orbs are purely radial-gradient + blur.
 * This element must remain position:fixed so it sits behind all content.
 */
export function MeshOrbBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      {/* Orb 1 — emerald, top-left */}
      <div
        className="mesh-orb-1 fixed"
        style={{
          top: '-10%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          maxWidth: '800px',
          maxHeight: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,160,0.13) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
        }}
      />
      {/* Orb 2 — amber, bottom-right */}
      <div
        className="mesh-orb-2 fixed"
        style={{
          bottom: '-15%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: '720px',
          maxHeight: '720px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,179,71,0.10) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      {/* Orb 3 — emerald tint, center-right, dimmer */}
      <div
        className="mesh-orb-3 fixed"
        style={{
          top: '35%',
          right: '15%',
          width: '30vw',
          height: '30vw',
          maxWidth: '420px',
          maxHeight: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          zIndex: 0,
        }}
      />
    </div>
  );
}
