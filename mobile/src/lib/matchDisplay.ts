import type { ListingMatchSummary } from './types'

/** User-facing % uses blended final score (ranking), falling back to raw match components. */
export function matchFitDisplayPercent(summary: ListingMatchSummary): number {
  const raw =
    typeof summary.finalScore === 'number' && !Number.isNaN(summary.finalScore)
      ? summary.finalScore
      : typeof summary.matchScore === 'number'
        ? summary.matchScore
        : 0
  return Math.max(0, Math.min(100, Math.round(Number(raw) || 0)))
}
