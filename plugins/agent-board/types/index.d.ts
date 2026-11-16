export type TaskStatus = 'pending' | 'in_progress' | 'completed'

/** A shared task from TaskCreate / TaskUpdate. `creator` is 'main' or an agent id. */
export type Task = {
  id: string
  subject: string
  status: TaskStatus
  owner?: string
  blockedBy: string[]
  creator: string
}

/** One row of an agent's own TodoWrite checklist. */
export type Todo = { content: string; status: TaskStatus }

/** A subagent or teammate as $.agent.list() last reported it. */
export type AgentNode = {
  id: string
  parentId?: string
  type: string
  description: string
  status: string
  name?: string
}

/** A SendMessage between agents; `from` is 'main' or an agent id, `to` as addressed. */
export type Message = { from: string; to: string; text: string; at: string }

/** What a subagent is doing: its last tool call, how many so far, and when (epoch ms). */
export type Activity = { last: string; count: number; startedAt: number; lastAt: number }

export type Mode = 'cards' | 'graph'

declare module 'claude-code' {
  interface PluginState {
    'agent-board': {
      tasks: Shaped<Task[]>
      todos: Shaped<Record<string, Todo[]>>
      agents: Shaped<AgentNode[]>
      models: Shaped<Record<string, string>>
      messages: Shaped<Message[]>
      activity: Shaped<Record<string, Activity>>
      page: Shaped<number>
      mode: Shaped<Mode>
      isClosed: Shaped<boolean>
      cleared: Shaped<string[]>
    }
  }
}
