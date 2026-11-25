import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Decision } from '../types'
import { agentRowBody } from './agent-row'
import { cellParts } from './cell'
import { decide } from './decide'
import { savedUsd, usd } from './savings'

// Values outlive a reload; bump a shape tag when that value's meaning changes.
const isOn = atom({ plugin: 'model-gatekeeper', key: 'isOn' } as const, true)
const decisions = atom(
  { plugin: 'model-gatekeeper', key: 'decisions' } as const,
  [],
  { shape: 'decisions-3' },
)

const KEPT_DECISIONS = 100

function report(list: readonly Decision[], on: boolean): string {
  const head = on ? 'Gatekeeper on.' : 'Gatekeeper off: subagents use their default model.'
  const rows = list
    .slice(-10)
    .map(
      one =>
        `  ${one.type.padEnd(16)} ${one.description.slice(0, 32).padEnd(32)} ${one.tier.padEnd(7)} ${one.reason}` +
        (one.savedUsd === undefined ? '' : `  ~${usd(one.savedUsd)} saved`),
    )
  const body = rows.length === 0 ? ['  No subagent routed yet.'] : rows
  const saved = list.reduce((sum, one) => sum + (one.savedUsd ?? 0), 0)
  const total = list.length === 0 ? [] : [`Estimated savings this session: ~${usd(saved)} (list prices, an estimate).`]

  return [head, 'Last decisions:', ...body, ...total, '/gatekeeper off | on'].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'gatekeeper',
      description: 'Show model-gatekeeper decisions, or switch it off or on',
    })
    $.ui.status(undefined) // clears the status entry versions before 0.4.0 set

    return next(e)
  })

  on('command.run', { command: 'gatekeeper' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'off' || arg === 'on') await update($, isOn, () => arg === 'on')

    return { text: report(await read($, decisions), await read($, isOn)) }
  })

  // The counter beside the prompt: subagents per tier and the estimated savings.
  on('ui.render', { component: 'BesidePrompt' }, async ($, e, next) => {
    const parts = cellParts(await read($, decisions), await read($, isOn), e.props.maxColumns)
    if (parts === undefined) return next(e)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        {parts.map((part, index) => (
          <Text key={String(index)} {...(part.color === undefined ? {} : { color: part.color })} dimColor={part.dim === true}>
            {part.text}
          </Text>
        ))}
      </Box>
    )
  }).catch(($, e, next) => next(e))

  // Each subagent row: its branch in the spawn tree, type and model. Claude Code keeps the nesting.
  // A row the person's settings already draw, or a hidden one, is left alone; any error falls back.
  on('ui.render', { component: 'AgentRow' }, async ($, e, next) => {
    if (e.props.body !== undefined || e.props.isHidden) return next(e)
    const rows = (await $.agent.list()).filter(agent => agent.hasRow)

    return next({ ...e, props: { ...e.props, body: agentRowBody(e.props, rows) } })
  }).catch(($, e, next) => next(e))

  // When a routed agent reports, price what it cost against its parent's model. Observe only.
  on('agent.report', async ($, e, next) => {
    const result = await next(e)
    try {
      const list = await read($, decisions)
      const routed = list.find(one => one.agentId === e.agentId)
      if (routed !== undefined) {
        const agent = (await $.agent.list()).find(one => one.id === e.agentId)
        const saved = savedUsd(agent?.cost?.usd ?? 0, agent?.model, routed.parentModel)
        await update($, decisions, all => all.map(one => (one.agentId === e.agentId ? { ...one, savedUsd: saved } : one)))
      }
    } catch {
      // A missing price or agent leaves the decision unpriced.
    }

    return result
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
        ...(spawned.agentId === undefined ? {} : { agentId: spawned.agentId }),
        ...(e.parentModel === undefined ? {} : { parentModel: e.parentModel }),
      }
      await update($, decisions, list => [...list, decision].slice(-KEPT_DECISIONS))
    }

    return spawned
  }).catch(($, e, next) => next(e))
}
