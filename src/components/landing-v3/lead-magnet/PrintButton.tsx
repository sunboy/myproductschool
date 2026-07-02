'use client'

/** Tiny client component that triggers window.print(). */
export function PrintButton() {
  return (
    <button
      type="button"
      className="lm-btn lm-btn-secondary lm-no-print"
      onClick={() => window.print()}
    >
      Save as PDF
    </button>
  )
}
