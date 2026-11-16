// The routing decision, free of `$` so it is tested on its own.
import type { Tier } from '../types'

export type SpawnFacts = {
  subagentType: string
  description: string
  prompt: string
  model?: string
  parentModel?: string
  fork: boolean
  resume?: unknown
  workflow?: unknown
}

/** `isInherit`: the pick is the parent's own tier, so the spawn is left to inherit its exact model. */
export type Verdict = { tier: Tier; reason: string; isInherit: boolean }

export type Classify = (text: string, labels: readonly string[]) => Promise<string | undefined>

// Built-in agent types only: a custom agent keeps its own `model:` setting.
const TYPE_RULES: Readonly<Record<string, Tier | 'keep' | 'classify'>> = {
  Explore: 'haiku',
  'claude-code-guide': 'haiku',
  'statusline-setup': 'haiku',
  Plan: 'keep',
  'general-purpose': 'classify',
  claude: 'classify',
}

const LABELS = ['simple-lookup', 'standard-coding', 'hard-reasoning'] as const
const TIER_OF_LABEL: Readonly<Record<string, Tier>> = {
  'simple-lookup': 'haiku',
  'standard-coding': 'sonnet',
  'hard-reasoning': 'opus',
}
const FALLBACK: Tier = 'sonnet'
export const TIERS: readonly Tier[] = ['haiku', 'sonnet', 'opus']
const PROMPT_CHARS = 3000

// Unknown ids (fable, a custom id, none) rank as top tier, so the cap does nothing.
export function rankOf(model: string | undefined): number {
  const id = (model ?? '').toLowerCase()
  if (id.includes('haiku')) return 0
  if (id.includes('sonnet')) return 1

  return 2
}

async function classified(facts: SpawnFacts, classify: Classify): Promise<{ tier: Tier; reason: string }> {
  const text = `Agent type: ${facts.subagentType}\nTask: ${facts.description}\n\n${facts.prompt.slice(0, PROMPT_CHARS)}`
  try {
    const label = await classify(text, LABELS)
    const tier = label === undefined ? undefined : TIER_OF_LABEL[label]

    return tier === undefined || label === undefined
      ? { tier: FALLBACK, reason: 'unclassified' }
      : { tier, reason: label }
  } catch {
    return { tier: FALLBACK, reason: 'classifier failed' }
  }
}

/** Undefined: leave the spawn as asked. */
export async function decide(facts: SpawnFacts, classify: Classify): Promise<Verdict | undefined> {
  const isAsked = facts.model !== undefined || facts.fork || facts.resume !== undefined || facts.workflow !== undefined
  const rule = TYPE_RULES[facts.subagentType]
  if (isAsked || rule === undefined || rule === 'keep') return undefined

  const { tier, reason } = rule === 'classify' ? await classified(facts, classify) : { tier: rule, reason: 'type rule' }
  const parentRank = rankOf(facts.parentModel)
  if (TIERS.indexOf(tier) < parentRank) return { tier, reason, isInherit: false }

  const parentTier = TIERS[parentRank] ?? tier
  const capped = TIERS.indexOf(tier) > parentRank ? ', capped at parent model' : ''

  return { tier: parentTier, reason: `${reason}${capped}`, isInherit: true }
}
