import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { decide } from '../hooks/decide'
import type { SpawnFacts } from '../hooks/decide'

const facts = (extra: Partial<SpawnFacts> = {}): SpawnFacts => ({
  subagentType: 'general-purpose',
  description: 'add date parser tests',
  prompt: 'Write unit tests for parseDate in src/date.ts.',
  parentModel: 'claude-opus-5-5',
  fork: false,
  ...extra,
})
const says = (label: string) => async () => label
const fails = async (): Promise<string | undefined> => {
  throw new Error('classifier down')
}

test('Explore runs on haiku without asking the classifier', async () => {
  const verdict = await decide(facts({ subagentType: 'Explore' }), fails)

  expect(verdict).toEqual({ tier: 'haiku', reason: 'type rule', isInherit: false })
})

test('a general-purpose task goes to the tier the classifier names', async () => {
  expect((await decide(facts(), says('simple-lookup')))?.tier).toBe('haiku')
  expect((await decide(facts(), says('standard-coding')))?.tier).toBe('sonnet')
  expect(await decide(facts({ subagentType: 'claude' }), says('standard-coding'))).toMatchObject({
    tier: 'sonnet',
    isInherit: false,
  })
})

test('a hard task on an opus parent inherits the parent model', async () => {
  expect(await decide(facts(), says('hard-reasoning'))).toEqual({
    tier: 'opus',
    reason: 'hard-reasoning',
    isInherit: true,
  })
})

test('a classifier failure or an unknown label falls back to sonnet', async () => {
  expect(await decide(facts(), fails)).toMatchObject({ tier: 'sonnet', reason: 'classifier failed' })
  expect(await decide(facts(), says('banana'))).toMatchObject({ tier: 'sonnet', reason: 'unclassified' })
})

test('nothing is routed above the parent model', async () => {
  expect(await decide(facts({ parentModel: 'claude-sonnet-5-5' }), says('hard-reasoning'))).toEqual({
    tier: 'sonnet',
    reason: 'hard-reasoning, capped at parent model',
    isInherit: true,
  })
})

test('an explicit model, a fork, a resume, a workflow agent, Plan and custom types are left alone', async () => {
  const cases: Partial<SpawnFacts>[] = [
    { model: 'opus' },
    { fork: true },
    { resume: { agentId: 'a1' } },
    { workflow: { runId: 'wf_1', agentIndex: 1 } },
    { subagentType: 'Plan' },
    { subagentType: 'security-reviewer' },
  ]
  for (const extra of cases) expect(await decide(facts(extra), says('simple-lookup'))).toBeUndefined()
})

// The hook, with hooks beneath standing for the engine.
function engine(on: On, deny?: string) {
  const seen: { model?: string }[] = []
  on('command.register', () => ({ value: { command: 'gatekeeper' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('model.classify', () => ({ value: 'simple-lookup' }))
  on('agent.spawn', (_, e) => {
    seen.push({ ...(e.model !== undefined ? { model: e.model } : {}) })

    return deny === undefined ? { model: e.model ?? 'inherit', agentId: 'a1' } : { deny }
  })

  return seen
}
const spawn = (description: string, subagentType: string) => ({
  prompt: 'Where is auth parsed?',
  description,
  subagentType,
  tool_use_id: 'toolu_1',
  provider: { plugin: 'engine', tier: 'core' as const },
  parentModel: 'claude-opus-5-5',
  background: false,
  fork: false,
})
const typed = (args: string) => ({
  command: 'gatekeeper',
  args,
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen: true, columns: 120 },
})

test('the hook sets the model at spawn and records it', async ($, on) => {
  const seen = engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.agent.spawn(spawn('find auth', 'Explore'))

  expect(seen[0]?.model).toBe('haiku')
  expect((await $.command.run(typed(''))).text).toMatch(/Explore +find auth +haiku +type rule/)
})

test('a refused spawn is not counted', async ($, on) => {
  engine(on, 'blocked by policy')
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.agent.spawn(spawn('find auth', 'Explore'))

  expect((await $.command.run(typed(''))).text).toMatch(/No subagent routed yet/)
})

test('/gatekeeper off stops routing, /gatekeeper on resumes it', async ($, on) => {
  const seen = engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const off = await $.command.run(typed('off'))
  await $.agent.spawn(spawn('a', 'general-purpose'))
  await $.command.run(typed('on'))
  await $.agent.spawn(spawn('b', 'general-purpose'))

  expect(off.text).toMatch(/Gatekeeper off/)
  expect(seen[0]?.model).toBeUndefined()
  expect(seen[1]?.model).toBe('haiku')
})
