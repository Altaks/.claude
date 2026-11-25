import { expect, test } from 'claude-code/testing'

import { cellParts } from '../hooks/cell'
import { priceOf, savedUsd, usd } from '../hooks/savings'
import type { Decision } from '../types'

const text = (parts: { text: string }[] | undefined) => parts?.map(part => part.text).join('')
const decision = (extra: Partial<Decision>): Decision => ({
  type: 'Explore',
  description: 'find',
  tier: 'haiku',
  reason: 'type rule',
  ...extra,
})

test('prices match the longest model id prefix', () => {
  expect(priceOf('claude-opus-5-5')).toBe(4)
  expect(priceOf('claude-opus-5')).toBe(5)
  expect(priceOf('claude-opus-5-5[1m]')).toBe(4)
  expect(priceOf('claude-sonnet-5-5-20261001')).toBe(2)
  expect(priceOf('claude-opus-50')).toBeUndefined()
  expect(priceOf('haiku')).toBeUndefined()
  expect(priceOf('us.anthropic.claude-opus-4-8-v1:0')).toBe(5)
  expect(priceOf('CLAUDE-HAIKU-5-5')).toBe(0.1)
})

test('savings compare the cost against the parent model', () => {
  // $0.01 on haiku 5.5 would have been 40x on opus 5.5.
  expect(Math.round(savedUsd(0.01, 'claude-haiku-5-5', 'claude-opus-5-5') * 100) / 100).toBe(0.39)
  expect(savedUsd(0.5, 'claude-opus-5-5', 'claude-opus-5-5')).toBe(0)
  expect(savedUsd(0.5, 'claude-opus-5-5', 'claude-sonnet-5-5')).toBe(0)
  expect(savedUsd(0.5, undefined, 'claude-opus-5-5')).toBe(0)
  expect(savedUsd(Number.NaN, 'claude-haiku-5-5', 'claude-opus-5-5')).toBe(0)
  expect(savedUsd(Number.POSITIVE_INFINITY, 'claude-haiku-5-5', 'claude-opus-5-5')).toBe(0)
})

test('amounts read as dollars', () => {
  expect(usd(0)).toBe('$0')
  expect(usd(0.004)).toBe('<$0.01')
  expect(usd(0.392)).toBe('$0.39')
  expect(usd(Number.NaN)).toBe('$0')
})

test('the cell shows each used tier and the savings, nothing before the first routing', () => {
  expect(cellParts([], true, 40)).toBeUndefined()
  const list = [
    decision({ savedUsd: 0.3 }),
    decision({ savedUsd: 0.1 }),
    decision({ tier: 'sonnet', savedUsd: Number.NaN }),
  ]

  expect(text(cellParts(list, true, 40))).toBe('●2 ●1 ~$0.40 éco.')
})

test('a narrow cell drops the savings first, then itself', () => {
  const list = [decision({ savedUsd: 0.3 })]

  expect(text(cellParts(list, true, 5))).toBe('●1')
  expect(cellParts(list, true, 1)).toBeUndefined()
  expect(text(cellParts(list, false, 40))).toBe('gk off')
})
