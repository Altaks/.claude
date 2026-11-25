// The counter beside the prompt, as plain parts, so it is tested without `$`.
import type { Decision, Tier } from '../types'
import { TIERS } from './decide'
import { usd } from './savings'

export type Part = { text: string; color?: string; dim?: boolean }

export const TIER_COLOR: Readonly<Record<Tier, string>> = {
  haiku: '#a6da95',
  sonnet: '#8aadf4',
  opus: '#c6a0f6',
}

/** Undefined when there is nothing to show: no subagent routed yet. */
export function cellParts(list: readonly Decision[], isOn: boolean, maxColumns: number): Part[] | undefined {
  if (!isOn) return fit([{ text: 'gk off', dim: true }], maxColumns)
  if (list.length === 0) return undefined

  const counts: Part[] = TIERS.flatMap(tier => {
    const count = list.filter(one => one.tier === tier).length

    return count === 0 ? [] : [{ text: `●${count}`, color: TIER_COLOR[tier] }]
  }).flatMap((part, index) => (index === 0 ? [part] : [{ text: ' ' }, part]))
  const saved = list.reduce((sum, one) => sum + (Number.isFinite(one.savedUsd) ? (one.savedUsd ?? 0) : 0), 0)
  const withSaved: Part[] = [...counts, { text: ` ~${usd(saved)} éco.`, dim: true }]

  return fit(withSaved, maxColumns) ?? fit(counts, maxColumns)
}

function fit(parts: Part[], maxColumns: number): Part[] | undefined {
  const width = parts.reduce((sum, part) => sum + [...part.text].length, 0)

  return width <= maxColumns ? parts : undefined
}
