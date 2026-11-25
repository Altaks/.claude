import { expect, test } from 'claude-code/testing'

import { priceOf, savedUsd, usd } from '../hooks/savings'
import { segment, withSegment } from '../hooks/segment'
import type { Decision } from '../types'

const plain = (text: string | undefined) => text?.replace(/\u001b\[[0-9;]*m/g, '')
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

test('the segment shows each used tier and the savings, nothing before the first routing', () => {
  expect(segment([], true)).toBeUndefined()
  const list = [
    decision({ savedUsd: 0.3 }),
    decision({ savedUsd: 0.1 }),
    decision({ tier: 'sonnet', savedUsd: Number.NaN }),
  ]

  expect(plain(segment(list, true))).toBe('●1 ●2 ~$0.40 éco.')
  expect(plain(segment(list, false))).toBe('gk off')
})

test('the segment joins the first group with a dot, before the first separator', () => {
  const box = '  \u001b[38;2;91;96;120m│\u001b[0m  '
  const line = `\u001b[1mOpus 5.5\u001b[0m (high)${box}.claude${box}ctx 8%\nsecond line`

  expect(plain(withSegment(line, 'GK'))).toBe('Opus 5.5 (high) · GK  │  .claude  │  ctx 8%\nsecond line')
  expect(plain(withSegment('Opus 5.5 (high) | .claude', 'GK'))).toBe('Opus 5.5 (high) · GK | .claude')
  expect(plain(withSegment('Opus 5.5 (high)', 'GK'))).toBe('Opus 5.5 (high) · GK')
  expect(withSegment(null, 'GK')).toBe('GK')
  expect(withSegment('  ', 'GK')).toBe('GK')
})
