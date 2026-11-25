import { expect, test } from 'claude-code/testing'

import { checkNote, escalation, retryNote } from '../hooks/followup'
import type { Decision } from '../types'

const routed = (extra: Partial<Decision>): Decision => ({
  type: 'general-purpose',
  description: 'find auth',
  tier: 'haiku',
  reason: 'simple-lookup',
  agentId: 'a1',
  parentModel: 'claude-opus-5-5',
  prompt: 'Where is auth parsed?',
  ...extra,
})

test('a report from a cheaper model asks the parent to check it', () => {
  expect(checkNote(routed({}))).toMatch(/came from haiku, a cheaper model than yours\. Check its key claims/)
  expect(checkNote(routed({ tier: 'opus' }))).toBe('')
  expect(checkNote(routed({ tier: 'sonnet', parentModel: 'claude-sonnet-5-5' }))).toBe('')
})

test('a failure goes one tier up, the parent model id at the parent tier', () => {
  expect(escalation(routed({}))).toEqual({ tier: 'sonnet', model: 'sonnet' })
  expect(escalation(routed({ tier: 'sonnet' }))).toEqual({ tier: 'opus', model: 'claude-opus-5-5' })
  expect(escalation(routed({ parentModel: 'claude-sonnet-5-5' }))).toEqual({
    tier: 'sonnet',
    model: 'claude-sonnet-5-5',
  })
})

test('no escalation at the parent tier or without the kept prompt', () => {
  expect(escalation(routed({ tier: 'opus' }))).toBeUndefined()
  expect(escalation(routed({ tier: 'sonnet', parentModel: 'claude-sonnet-5-5' }))).toBeUndefined()
  const { prompt: _prompt, ...noPrompt } = routed({})
  expect(escalation(noPrompt)).toBeUndefined()
})

test('the failure note says whether the retry started', () => {
  const step = { tier: 'sonnet' as const, model: 'sonnet' }

  expect(retryNote(step, routed({}), true)).toMatch(/started again on sonnet .* arrives separately/)
  expect(retryNote(step, routed({}), false)).toMatch(/refused\. .*model "sonnet"/)
})
