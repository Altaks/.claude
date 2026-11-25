// What routing a subagent down saved, free of `$` so it is tested on its own.

// Input list price in $ per million tokens (output is 5x input for every one of these, so one
// number per model is enough for a ratio). Longest id prefix wins: `claude-opus-5-5` over
// `claude-opus-5`. From the Claude API pricing table, 2026-11.
const INPUT_PRICE: Readonly<Record<string, number>> = {
  'claude-haiku-5-5': 0.1,
  'claude-haiku-4-5': 1,
  'claude-sonnet-5-5': 2,
  'claude-sonnet-5': 2,
  'claude-sonnet-4-6': 3,
  'claude-opus-5-5': 4,
  'claude-opus-5': 5,
  'claude-opus-4-8': 5,
  'claude-opus-4-7': 5,
  'claude-opus-4-6': 5,
  'claude-fable-5-2': 8,
  'claude-fable-5-1': 10,
  'claude-fable-5': 10,
}

export function priceOf(model: string | undefined): number | undefined {
  if (model === undefined) return undefined
  const key = Object.keys(INPUT_PRICE)
    .filter(id => model === id || (model.startsWith(id) && !/[a-z0-9]/.test(model.charAt(id.length))))
    .sort((a, b) => b.length - a.length)[0]

  return key === undefined ? undefined : INPUT_PRICE[key]
}

/**
 * The agent's cost had it run on its parent's model, minus what it cost: an estimate, as the cost
 * itself is. 0 when either price is unknown or the agent did not run cheaper.
 */
export function savedUsd(costUsd: number, agentModel: string | undefined, parentModel: string | undefined): number {
  const ran = priceOf(agentModel)
  const would = priceOf(parentModel)
  if (ran === undefined || would === undefined || ran <= 0 || would <= ran || costUsd <= 0) return 0

  return costUsd * (would / ran - 1)
}

export function usd(amount: number): string {
  if (amount <= 0) return '$0'
  if (amount < 0.01) return '<$0.01'

  return `$${amount.toFixed(2)}`
}
