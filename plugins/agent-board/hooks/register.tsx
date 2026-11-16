import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentNode, Mode, TaskStatus } from '../types'
import {
  ACTIVE,
  GAP,
  MAIN,
  SLOT_W,
  STATUS_COLOR,
  TIER_COLOR,
  addMessage,
  applyUpdate,
  cardOf,
  createTask,
  describeCall,
  displayNames,
  elapsed,
  labelOf,
  layoutGraph,
  mergeAgents,
  runsOf,
  setTodos,
  tierOf,
} from './board'

const PANE = 'agent-board'
const TITLE = 'Agents'
const REFRESH_MS = 3000
const KEPT_CLEARED = 200
const USAGE = 'Usage: /agent-board [graph]'

// Values outlive a reload; bump a shape tag when that value's meaning changes.
const tasks = atom({ plugin: 'agent-board', key: 'tasks' } as const, [], { shape: 'tasks-1' })
const todos = atom({ plugin: 'agent-board', key: 'todos' } as const, {}, { shape: 'todos-1' })
const agents = atom({ plugin: 'agent-board', key: 'agents' } as const, [], { shape: 'agents-1' })
const models = atom({ plugin: 'agent-board', key: 'models' } as const, {}, { shape: 'models-1' })
const messages = atom({ plugin: 'agent-board', key: 'messages' } as const, [], {
  shape: 'messages-1',
})
const activity = atom({ plugin: 'agent-board', key: 'activity' } as const, {}, {
  shape: 'activity-1',
})
const page = atom({ plugin: 'agent-board', key: 'page' } as const, 0, { shape: 'page-1' })
const mode = atom({ plugin: 'agent-board', key: 'mode' } as const, 'cards' as Mode, { shape: 'mode-1' })
const isClosed = atom({ plugin: 'agent-board', key: 'isClosed' } as const, false, {
  shape: 'closed-1',
})
const cleared = atom({ plugin: 'agent-board', key: 'cleared' } as const, [], { shape: 'cleared-1' })

const GLYPH: Record<TaskStatus, string> = { pending: '[ ]', in_progress: '[~]', completed: '[x]' }
const GLYPH_COLOR: Record<TaskStatus, string> = {
  pending: 'inactive',
  in_progress: 'claude',
  completed: 'success',
}

// Only writes when the list changed, so an idle board never redraws.
async function refreshAgents($: EngineInterface): Promise<void> {
  const fresh: AgentNode[] = (await $.agent.list()).map(one => ({
    id: one.id,
    type: one.type,
    description: one.description,
    status: one.status,
    ...(one.parentId !== undefined ? { parentId: one.parentId } : {}),
    ...(one.name !== undefined ? { name: one.name } : {}),
  }))
  const known = await read($, agents)
  const merged = mergeAgents(known, fresh)
  if (JSON.stringify(merged) !== JSON.stringify(known)) {
    await update($, agents, current => mergeAgents(current, fresh))
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agent-board',
      description: 'Open the agents pane: a card per running subagent (graph: open on the graph)',
    })
    $.clock.every(REFRESH_MS, () => {
      refreshAgents($).catch(() => undefined)
    })

    return next(e)
  })

  on('command.run', { command: 'agent-board' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg !== '' && arg !== 'graph' && arg !== 'cards') return { text: USAGE }
    await update($, mode, () => (arg === 'graph' ? 'graph' : 'cards'))
    await update($, isClosed, () => false)
    await refreshAgents($).catch(() => undefined)
    const { isPlaced } = await $.ui.open({ id: PANE, title: TITLE })

    return { text: isPlaced ? 'Agents pane opened.' : 'Agents pane opens once there is room.' }
  })

  // Closed by the person: stay closed this session until /agent-board.
  on('ui.close', { id: PANE }, async ($, e, next) => {
    if (e.origin.kind === 'person') await update($, isClosed, () => true)

    return next(e)
  }).catch(($, e, next) => next(e))

  // Shared tasks and checklists. Observers record after the call ran and let it through on any error.
  on('tool.call', { tool: ['TaskCreate', 'TaskUpdate', 'TodoWrite'] }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran
    const who = e.agentId ?? MAIN
    if (who !== MAIN && !(await read($, agents)).some(node => node.id === who)) {
      await refreshAgents($)
    }

    if (e.tool === 'TaskCreate') {
      const created = (ran.result as { task?: { id: string; subject: string } }).task
      if (created) await update($, tasks, list => createTask(list, created, who))
    } else if (e.tool === 'TaskUpdate') {
      if ((ran.result as { success?: boolean }).success !== false) {
        await update($, tasks, list => applyUpdate(list, e))
      }
    } else if (e.tool === 'TodoWrite') {
      await update($, todos, all => setTodos(all, who, e.todos))
    }

    return ran
  }).catch(($, e, next) => next(e))

  // A subagent's live activity. Agent and Workflow are left unmatched: a hook around a spawn
  // would stop hearing the agents it spawns.
  on('tool.call', { tool: /^(?!(Agent|Workflow)$)/ }, async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) return next(e)
    const now = await $.clock.now()
    const last = describeCall(String(e.tool), e as unknown as Record<string, unknown>)
    await update($, activity, all => {
      const before = all[id]

      return {
        ...all,
        [id]: { last, count: (before?.count ?? 0) + 1, startedAt: before?.startedAt ?? now, lastAt: now },
      }
    })

    return next(e)
  }).catch(($, e, next) => next(e))

  // A subagent starting: note when, and bring the pane up unless the person closed it.
  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    const id = e.agentId
    if (id === undefined) return started
    await refreshAgents($)
    const now = await $.clock.now()
    await update($, activity, all =>
      all[id] ? all : { ...all, [id]: { last: 'starting', count: 0, startedAt: now, lastAt: now } },
    )
    const isUp = (await $.ui.panes()).some(pane => pane.id === PANE)
    if (!isUp && !(await read($, isClosed))) await $.ui.open({ id: PANE, title: TITLE })

    return started
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const model = e.usage?.model
    const key = e.agentId ?? MAIN
    if (model !== undefined && (await read($, models))[key] !== model) {
      await update($, models, all => ({ ...all, [key]: model }))
    }
    if (e.agentId !== undefined) await refreshAgents($)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('session.send', async ($, e, next) => {
    const sent = await next(e)
    if ((sent as { isDelivered?: boolean }).isDelivered === false) return sent
    const at = new Date(await $.clock.now()).toTimeString().slice(0, 5)
    const text = e.text.replace(/\s+/g, ' ').trim().slice(0, 120)
    await update($, messages, list => addMessage(list, { from: e.agentId ?? MAIN, to: e.to, text, at }))

    return sent
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const nodes = await read($, agents)
    const sent = await read($, messages)
    const modelOf = await read($, models)
    const width = Math.max(20, e.props.bodyColumns)
    const running = nodes.filter(node => node.status === 'running').length
    const switchTo = (next: Mode) => () => void update($, mode, () => next)

    if ((await read($, mode)) === 'cards') {
      const hiddenIds = new Set(await read($, cleared))
      const active = nodes.filter(node => ACTIVE.has(node.status))
      const done = nodes.filter(node => !ACTIVE.has(node.status) && !hiddenIds.has(node.id))
      const taskList = await read($, tasks)
      const todoMap = await read($, todos)
      const doing = await read($, activity)
      const now = await $.clock.now()
      const names = displayNames(nodes)
      const nameOf = (id: string) => names[id] ?? labelOf(id, nodes)
      const tierFor = (id: string) => {
        const model = modelOf[id]

        return model === undefined ? undefined : tierOf(model)
      }

      return (
        <Box flexDirection="column">
          <Text>
            <Text bold>Agents</Text>
            <Text dimColor> · {running} running</Text>
          </Text>
          {active.length === 0 && done.length === 0 && (
            <Text dimColor>No subagents yet. A card appears here when one starts.</Text>
          )}
          {active.map(node => {
            const card = cardOf(node.id, taskList, todoMap, sent, nodes)
            const tier = tierFor(node.id)
            const act = doing[node.id]
            const hasParent = node.parentId !== undefined && nodes.some(one => one.id === node.parentId)
            const parent = hasParent && node.parentId !== undefined ? nameOf(node.parentId) : MAIN
            const statusColor = STATUS_COLOR[node.status] ?? 'inactive'

            return (
              <Box key={node.id} flexDirection="column" borderStyle="round" borderColor={statusColor} paddingX={1}>
                <Box flexDirection="row" justifyContent="space-between">
                  <Text wrap="truncate-end">
                    <Text bold>{nameOf(node.id)}</Text>
                    {tier !== undefined && <Text color={TIER_COLOR[tier]}> · {tier}</Text>}
                    <Text color={statusColor}> · {node.status}</Text>
                  </Text>
                  {card.total > 0 && (
                    <Text dimColor>
                      {card.done}/{card.total} tasks
                    </Text>
                  )}
                </Box>
                <Text wrap="truncate-end" dimColor>
                  {node.description} · from {parent}
                </Text>
                {act && <Text wrap="truncate-end">{act.last}</Text>}
                {act && (
                  <Text dimColor>
                    {act.count} action{act.count === 1 ? '' : 's'} · {elapsed(now - act.startedAt)}
                  </Text>
                )}
                {card.open.map(item => (
                  <Text wrap="truncate-end">
                    <Text color={GLYPH_COLOR[item.status]}>{GLYPH[item.status]}</Text> {item.text}
                  </Text>
                ))}
                {card.last && (
                  <Text wrap="truncate-end">
                    {card.last.isSent ? '→' : '←'} {card.last.other} <Text dimColor>"{card.last.text}"</Text>
                  </Text>
                )}
              </Box>
            )
          })}
          {done.length > 0 && (
            <Box flexDirection="row" columnGap={1}>
              <Text wrap="truncate-end">
                <Text dimColor>done</Text>
                {done.flatMap(node => {
                  const tier = tierFor(node.id)
                  const isFailed = node.status !== 'completed'

                  return [
                    `  ${nameOf(node.id)}`,
                    ...(tier !== undefined ? [<Text color={TIER_COLOR[tier]}> · {tier}</Text>] : []),
                    ...(isFailed ? [<Text color={STATUS_COLOR[node.status] ?? 'error'}> · {node.status}</Text>] : []),
                  ]
                })}
              </Text>
              <Button
                key="clear"
                label="clear"
                onPress={() =>
                  void update($, cleared, ids => [...new Set([...ids, ...done.map(node => node.id)])].slice(-KEPT_CLEARED))
                }
              />
            </Box>
          )}
          <Box marginTop={1}>
            <Button key="graph" label="graph" hotkey="g" onPress={switchTo('graph')} />
          </Box>
        </Box>
      )
    }

    const graph = layoutGraph(nodes, modelOf, sent)
    const latest = sent[sent.length - 1]
    // Page by whole slots so a box is never cut in half.
    const perPage = Math.max(1, Math.floor((width + GAP) / SLOT_W))
    const pages = Math.max(1, Math.ceil(graph.slots / perPage))
    const shownPage = Math.min(await read($, page), pages - 1)
    const from = shownPage * perPage * SLOT_W
    const to = from + Math.min(width, perPage * SLOT_W)
    const nameOf = (key: string) => graph.names[key] ?? labelOf(key, nodes)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" columnGap={1}>
          <Text>
            <Text bold>Graph</Text>
            <Text dimColor>
              {' '}
              · {nodes.length} agents · {running} running · {sent.length} messages
            </Text>
          </Text>
          <Button key="cards" label="cards" hotkey="c" onPress={switchTo('cards')} />
        </Box>
        {pages > 1 && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>
              page {shownPage + 1}/{pages}
            </Text>
            <Button key="prev" label="prev" hotkey="h" onPress={() => void update($, page, n => Math.max(0, n - 1))} />
            <Button
              key="next"
              label="next"
              hotkey="l"
              onPress={() => void update($, page, n => Math.min(pages - 1, n + 1))}
            />
          </Box>
        )}
        <Box flexDirection="column" marginTop={1}>
          {graph.rows.map(row => (
            <Text wrap="truncate-end">
              {runsOf(row, from, to).map(run => (run.color ? <Text color={run.color}>{run.text}</Text> : run.text))}
            </Text>
          ))}
        </Box>
        {nodes.length === 0 && <Text dimColor>No subagents yet.</Text>}
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>{'── spawned   ┄┄> messages, with count'}</Text>
          {graph.undrawn.length > 0 && (
            <Text wrap="truncate-end" dimColor>
              not drawn:{' '}
              {graph.undrawn.map(pair => `${nameOf(pair.from)} → ${nameOf(pair.to)} (${pair.count})`).join(', ')}
            </Text>
          )}
          {latest && (
            <Text wrap="truncate-end">
              <Text dimColor>last {latest.at}</Text> {labelOf(latest.from, nodes)} → {labelOf(latest.to, nodes)}{' '}
              <Text dimColor>"{latest.text}"</Text>
            </Text>
          )}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={1} marginTop={1}>
          <Text dimColor>open:</Text>
          <Button key="open-main" plain onPress={() => void $.ui.view({})}>
            main
          </Button>
          {nodes.map(node => (
            <Button key={`open-${node.id}`} plain onPress={() => void $.ui.view({ agentId: node.id })}>
              {nameOf(node.id)}
            </Button>
          ))}
        </Box>
      </Box>
    )
  })
}
