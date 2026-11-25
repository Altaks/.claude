// The gatekeeper's segment of the status line, as plain text, so it is tested without `$`.
import type { Decision, Tier } from '../types'
import { TIERS } from './decide'
import { usd } from './savings'

type Rgb = readonly [number, number, number]

const TIER_RGB: Readonly<Record<Tier, Rgb>> = {
  haiku: [166, 218, 149],
  sonnet: [138, 173, 244],
  opus: [198, 160, 246],
}
const MUTED: Rgb = [128, 135, 162]
const RESET = '\u001b[0m'
const paint = ([r, g, b]: Rgb, text: string) => `\u001b[38;2;${r};${g};${b}m${text}${RESET}`

/** Undefined when there is nothing to show: routing on and no subagent routed yet. */
export function segment(list: readonly Decision[], isOn: boolean): string | undefined {
  if (!isOn) return paint(MUTED, 'gk off')
  if (list.length === 0) return undefined

  // Most expensive first: opus, sonnet, haiku.
  const counts = [...TIERS].reverse().flatMap(tier => {
    const count = list.filter(one => one.tier === tier).length

    return count === 0 ? [] : [paint(TIER_RGB[tier], `●${count}`)]
  })
  const saved = list.reduce((sum, one) => sum + (Number.isFinite(one.savedUsd) ? (one.savedUsd ?? 0) : 0), 0)

  return `${counts.join(' ')} ${paint(MUTED, `~${usd(saved)} éco.`)}`
}

// A group separator as statusline scripts draw it: `|` or `│` between spaces, possibly wrapped in SGR styles.
const SEPARATOR = / +(?:\u001b\[[0-9;]*m)*[|│](?:\u001b\[[0-9;]*m)* +/

/**
 * The status line with the segment joined to its first group (the model, in the usual layouts) by
 * a `·`; at the end of the first line where it has no separator, alone where empty.
 */
export function withSegment(text: string | null, added: string): string {
  if (text === null || text.trim() === '') return added
  const [first = '', ...rest] = text.split('\n')
  const found = SEPARATOR.exec(first)
  const joined = ` ${paint(MUTED, '·')} ${added}`
  const line =
    found === null ? `${first}${joined}` : `${first.slice(0, found.index)}${joined}${first.slice(found.index)}`

  return [line, ...rest].join('\n')
}
