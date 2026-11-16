import type { AgentInfo, On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { describeCall, elapsed } from '../hooks/board'

const PANE = {
  plugin: 'agent-board',
  component: 'Pane',
  requestId: 'agent-board',
  props: {
    title: 'Agents',
    isFocused: false,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop', 'vscode', 'mobile'] as const

const EXPLORER = { id: 'a1', type: 'Explore', description: 'find auth code', status: 'completed' as const }
const WRITER = {
  id: 'a2',
  type: 'general-purpose',
  description: 'write tests',
  status: 'running' as const,
  name: 'tests',
}
const NESTED = {
  id: 'a3',
  type: 'Explore',
  description: 'locate fixtures',
  status: 'running' as const,
  parentId: 'a2',
}

// Hooks here sit beneath the mod and stand for the engine.
function engine(on: On, list: AgentInfo[] = [EXPLORER, WRITER, NESTED]) {
  let nextId = 0
  on('agent.list', () => ({ value: list }))
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 16, 12, 4) }))
  on('session.send', () => ({ isDelivered: true as const }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('tool.call', (_, e) => {
    if (e.tool === 'TaskCreate') {
      nextId += 1

      return { result: { task: { id: String(nextId), subject: e.subject } } }
    }
    if (e.tool === 'TaskUpdate') return { result: { success: true, taskId: e.taskId, updatedFields: [] } }

    return { result: {} }
  })
}

const command = (args: string, columns = 120) => ({
  command: 'agent-board',
  args,
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen: true, columns },
})
const send = (to: string, text: string, agentId?: string) => ({
  to,
  text,
  origin: { kind: 'model' as const },
  ...(agentId ? { agentId } : {}),
})

test('a call reads as its tool and target, and time as m:ss', () => {
  expect(describeCall('Read', { file_path: '/repo/src/date.ts' })).toBe('Read date.ts')
  expect(describeCall('Bash', { command: 'ls   skills/' })).toBe('Bash ls skills/')
  expect(describeCall('Grep', { pattern: '--color' })).toBe('Grep "--color"')
  expect(describeCall('ToolSearch', {})).toBe('ToolSearch')
  expect(elapsed(42_000)).toBe('0:42')
  expect(elapsed(3_723_000)).toBe('1:02:03')
})

test('each running subagent gets a card in the pane, on every surface', async ($, on) => {
  engine(on)
  await $.tool.call({
    tool: 'TodoWrite',
    agentId: 'a2',
    todos: [
      { content: 'Read the parser', status: 'completed', activeForm: 'Reading' },
      { content: 'Draft the pane test', status: 'in_progress', activeForm: 'Drafting' },
      { content: 'Run plugin test', status: 'pending', activeForm: 'Running' },
    ],
  })
  await $.tool.call({ tool: 'Read', file_path: '/repo/src/date.ts', agentId: 'a2' })
  await $.session.send(send('a1', 'auth lives in src/auth', 'a2'))

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const text = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text

    expect(await text(/^Agents/)).toBe('Agents · 2 running')
    expect(await text(/^tests/)).toBe('tests · running')
    expect(await text(/tasks$/)).toBe('1/3 tasks')
    expect(await text(/^write tests/)).toBe('write tests · from main')
    expect(await text(/^Read/)).toBe('Read date.ts')
    expect(await text(/actions/)).toBe('2 actions · 0:00')
    expect(await text(/Draft/)).toBe('[~] Draft the pane test')
    expect(await text(/^→/)).toBe('→ Explore 1 "auth lives in src/auth"')
    expect(await text(/^locate fixtures/)).toBe('locate fixtures · from tests')
    expect(await text(/^done/)).toBe('done  Explore 1')
    await ui.unmount()
  }
})

test("the main conversation's calls make no activity", async ($, on) => {
  engine(on)
  await $.command.run(command(''))
  await $.tool.call({ tool: 'Read', file_path: '/repo/README.md' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /README/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /actions?/ })).toBeUndefined()
  await ui.unmount()
})

test('clear hides finished agents', async ($, on) => {
  engine(on, [EXPLORER])
  await $.command.run(command(''))

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /^done/ }))?.text).toBe('done  Explore')

  await ui.press({ key: 'clear' })
  expect(await ui.find({ type: 'Text', text: /^done/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^No subagents yet/ })).toBeDefined()
  await ui.unmount()
})

test('g and c switch the same pane between cards and graph', async ($, on) => {
  engine(on)
  expect((await $.command.run(command(''))).text).toBe('Agents pane opened.')

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^Agents/ })).toBeDefined()
  await ui.press({ key: 'graph' })
  expect(await ui.find({ type: 'Text', text: /^Graph/ })).toBeDefined()
  await ui.press({ key: 'cards' })
  expect(await ui.find({ type: 'Text', text: /^Agents/ })).toBeDefined()
  expect((await $.command.run(command('tabs'))).text).toMatch(/Usage/)
  await ui.unmount()
})

test('the graph draws agents as boxes with spawn and message edges', async ($, on) => {
  engine(on)
  await $.session.send(send('tests', 'stop after the fixtures file'))
  await $.session.send(send('a1', 'auth lives in src/auth', 'a2'))
  await $.session.send(send('a1', 'fixtures found', 'a3'))

  await $.command.run(command('graph'))
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const row = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text

  expect(await row(/^Graph/)).toMatch(/3 agents · 2 running · 3 messages/)
  expect(await row(/┌─+┴─+┐/)).toBeDefined()
  expect(await row(/│ Explore 1 +│ +│ tests +│/)).toBeDefined()
  expect(await row(/│ +1 msg/)).toBeDefined()
  expect(await row(/│<┄┄┄┄│/)).toBeDefined()
  expect(await row(/not drawn/)).toMatch(/Explore 2 → Explore 1 \(1\)/)
  expect(await row(/^last/)).toMatch(/Explore 2 → Explore 1 "fixtures found"/)
  expect((await ui.find({ key: 'open-a2' }))?.text).toMatch(/tests/)
  await ui.unmount()
})

test('a graph wider than the pane pages by whole boxes', async ($, on) => {
  engine(on)
  await $.command.run(command('graph', 30))

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, bodyColumns: 30 } })
  expect((await ui.find({ type: 'Text', text: /^page/ }))?.text).toBe('page 1/2')
  expect(await ui.find({ type: 'Text', text: /│ Explore 1/ })).toBeDefined()

  await ui.press({ key: 'next' })
  expect((await ui.find({ type: 'Text', text: /^page/ }))?.text).toBe('page 2/2')
  expect(await ui.find({ type: 'Text', text: /│ tests/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /│ Explore 1/ })).toBeUndefined()
  await ui.unmount()
})

test('a value an earlier version stored is declined', async ($, on) => {
  on('state.get', () => ({ value: { value: [{ subject: 'old shape' }], version: 1 } }))
  on('clock.now', () => ({ value: 0 }))

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /No subagents yet/ })).toBeDefined()
  await ui.unmount()
})
