/** Shared, non-interactive geometry from the approved visual review. */
export function LearningGeometry({ quiet = false }: { quiet?: boolean }) {
  return <div className={`learning-geometry${quiet ? ' learning-geometry-quiet' : ''}`} aria-hidden="true">
    <i className="learning-plane" /><i className="learning-orb" />
    <i className="learning-sage" /><i className="learning-forest" />
  </div>
}

export function LearningArtwork() {
  return <div className="learning-artwork" aria-hidden="true">
    <i className="learning-art-disc" /><i className="learning-art-sheet one" />
    <i className="learning-art-sheet two" /><i className="learning-art-sheet three" />
  </div>
}
