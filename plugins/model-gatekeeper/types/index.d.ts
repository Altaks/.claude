export type Tier = 'haiku' | 'sonnet' | 'opus'

export type Decision = {
  type: string
  description: string
  tier: Tier
  reason: string
}

declare module 'claude-code' {
  interface PluginState {
    'model-gatekeeper': {
      isOn: boolean
      decisions: Shaped<Decision[]>
    }
  }
}
