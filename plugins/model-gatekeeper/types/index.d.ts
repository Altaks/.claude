export type Tier = 'haiku' | 'sonnet' | 'opus'

export type Decision = {
  type: string
  description: string
  tier: Tier
  reason: string
  /** The spawned agent, to price it when it reports. */
  agentId?: string
  /** The model of the loop that spawned it: what it would have run on. */
  parentModel?: string
  /** Estimated $ saved against `parentModel`, set when the agent reports. */
  savedUsd?: number
}

declare module 'claude-code' {
  interface PluginState {
    'model-gatekeeper': {
      isOn: boolean
      decisions: Shaped<Decision[]>
    }
  }
}
