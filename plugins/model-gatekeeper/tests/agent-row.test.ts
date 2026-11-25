import { expect, test } from 'claude-code/testing'

import { agentRowBody, isLastSibling, shortModel } from '../hooks/agent-row'
import type { RowFacts } from '../hooks/agent-row'

const plain = (text: string) => text.replace(/\u001b\[[0-9;]*m/g, '')
const row = (extra: Partial<RowFacts>): RowFacts => ({
  id: 'a1',
  type: 'general-purpose',
  model: 'claude-opus-5-5',
  label: 'Plan the routing refactor',
  description: 'plan',
  tokenCount: 12400,
  startTime: 1,
  taskStatus: 'running',
  ...extra,
})

test('model ids read as family and version', () => {
  expect(shortModel('claude-haiku-5-5')).toEqual({ family: 'haiku', text: 'haiku 5.5' })
  expect(shortModel('claude-opus-5-5[1m]').text).toBe('opus 5.5')
  expect(shortModel('claude-sonnet-5-5-20261001').text).toBe('sonnet 5.5')
  expect(shortModel(undefined).text).toBe('model ?')
  expect(shortModel('gpt-x').text).toBe('gpt-x')
})

test('the last child of a parent closes its branch', () => {
  const first = row({ id: 'a1', startTime: 1 })
  const second = row({ id: 'a2', startTime: 2 })
  const child = row({ id: 'c1', parentId: 'a1', startTime: 3 })
  const rows = [first, second, child]

  expect(isLastSibling(first, rows)).toBe(false)
  expect(isLastSibling(second, rows)).toBe(true)
  expect(isLastSibling(child, rows)).toBe(true)
})

test('a row shows branch, type, model, activity and tokens', () => {
  const only = row({})

  expect(plain(agentRowBody(only, [only]))).toBe('└─ general-purpose opus 5.5 Plan the routing refactor 12k')
})

test('a named agent shows its name with its type, and only the first line of its label', () => {
  const named = row({ name: 'reviewer', label: 'Review the diff\nsecond line', tokenCount: 0 })

  expect(plain(agentRowBody(named, [named]))).toBe('└─ reviewer (general-purpose) opus 5.5 Review the diff')
})

test('a failed agent says so', () => {
  const failed = row({ taskStatus: 'failed', tokenCount: 0, label: '' })

  expect(plain(agentRowBody(failed, [failed]))).toBe('└─ general-purpose opus 5.5 plan failed')
})
