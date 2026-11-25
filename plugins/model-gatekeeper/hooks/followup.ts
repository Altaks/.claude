// What the parent hears about a routed agent's report, free of `$` so it is tested on its own.
import type { Decision, Tier } from '../types'
import { TIERS, rankOf } from './decide'

/** Whether the agent ran on a cheaper tier than the loop that spawned it. */
export function isCheaper(routed: Decision): boolean {
  return TIERS.indexOf(routed.tier) < rankOf(routed.parentModel)
}

/** A line under a successful report from a cheaper model: the parent checks before relying on it. */
export function checkNote(routed: Decision): string {
  if (!isCheaper(routed)) return ''

  return (
    `\n\n[model-gatekeeper] This report came from ${routed.tier}, a cheaper model than yours. ` +
    'Check its key claims (paths, line numbers, figures, conclusions) before relying on them.'
  )
}

export type Escalation = { tier: Tier; model: string }

/**
 * One tier up after a failure, never above the parent: the parent's own model id when that is the
 * next tier. Undefined when the agent already ran at the parent's tier or its prompt is gone.
 */
export function escalation(routed: Decision): Escalation | undefined {
  if (routed.prompt === undefined || !isCheaper(routed)) return undefined
  const next = TIERS[TIERS.indexOf(routed.tier) + 1]
  if (next === undefined) return undefined
  const isParentTier = TIERS.indexOf(next) >= rankOf(routed.parentModel)

  return { tier: next, model: isParentTier && routed.parentModel !== undefined ? routed.parentModel : next }
}

export function retryNote(step: Escalation, routed: Decision, isStarted: boolean): string {
  return isStarted
    ? `\n\n[model-gatekeeper] This agent failed on ${routed.tier}. It was started again on ${step.tier} with the ` +
        'same task; its report arrives separately. Wait for it rather than redoing the work.'
    : `\n\n[model-gatekeeper] This agent failed on ${routed.tier}, and starting it again on ${step.tier} was ` +
        `refused. If the task still matters, spawn it again with model "${step.model}".`
}
