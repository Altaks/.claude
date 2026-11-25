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
  /** The task and type to start again one tier up if it fails; dropped once it reports. */
  prompt?: string
  /** The agent this one retries after a failure. */
  retryOf?: string
}

declare module 'claude-code' {
  interface PluginState {
    'model-gatekeeper': {
      isOn: boolean
      decisions: Shaped<Decision[]>
    }
  }
}
