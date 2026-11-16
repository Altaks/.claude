import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Decision } from '../types'
import { TIERS, decide } from './decide'

// Values outlive a reload; bump a shape tag when that value's meaning changes.
const isOn = atom({ plugin: 'model-gatekeeper', key: 'isOn' } as const, true)
const decisions = atom(
  { plugin: 'model-gatekeeper', key: 'decisions' } as const,
  [],
  { shape: 'decisions-2' },
)

const KEPT_DECISIONS = 100

function summary(list: readonly Decision[]): string {
  const counts = TIERS.map(tier => `${list.filter(one => one.tier === tier).length} ${tier}`)

  return `gatekeeper ${counts.join(' · ')}`
}

function report(list: readonly Decision[], on: boolean): string {
  const head = on ? 'Gatekeeper on.' : 'Gatekeeper off: subagents use their default model.'
  const rows = list
    .slice(-10)
    .map(
      one =>
        `  ${one.type.padEnd(16)} ${one.description.slice(0, 32).padEnd(32)} ${one.tier.padEnd(7)} ${one.reason}`,
    )
  const body = rows.length === 0 ? ['  No subagent routed yet.'] : rows

  return [head, 'Last decisions:', ...body, '/gatekeeper off | on'].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'gatekeeper',
      description: 'Show model-gatekeeper decisions, or switch it off or on',
    })
    const list = await read($, decisions)
    if (list.length > 0) $.ui.status(summary(list))

    return next(e)
  })

  on('command.run', { command: 'gatekeeper' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'off' || arg === 'on') {
      await update($, isOn, () => arg === 'on')
      $.ui.status(arg === 'on' ? summary(await read($, decisions)) : 'gatekeeper off')
    }

    return { text: report(await read($, decisions), await read($, isOn)) }
  })

  // Routes at spawn time, after auto mode reviewed the Agent call as written: only the model changes.
  // Fail open: any error lets the spawn go on as asked.
  on('agent.spawn', async ($, e, next) => {
    if (!(await read($, isOn))) return next(e)
    const verdict = await decide(e, (text, labels) => $.model.classify(text, labels))
    if (verdict === undefined) return next(e)

    const spawned = await next(verdict.isInherit ? e : { ...e, model: verdict.tier })
    if (spawned.deny === undefined) {
      const decision: Decision = {
        type: e.subagentType,
        description: e.description,
        tier: verdict.tier,
        reason: verdict.reason,
      }
      await update($, decisions, list => [...list, decision].slice(-KEPT_DECISIONS))
      $.ui.status(summary(await read($, decisions)))
    }

    return spawned
  }).catch(($, e, next) => next(e))
}
