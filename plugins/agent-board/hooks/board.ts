// Pure data helpers for the board: no `$`, so the hooks module stays about events and drawing.
import type { AgentNode, Message, Task, TaskStatus, Todo } from '../types'

export const MAIN = 'main'

const MAX_TASKS = 200
const MAX_TODOS = 50
const MAX_AGENTS = 100
const MAX_MESSAGES = 50

export const TIER_COLOR: Readonly<Record<string, string>> = {
  haiku: 'success',
  sonnet: 'suggestion',
  opus: 'warning',
}
export const STATUS_COLOR: Readonly<Record<string, string>> = {
  running: 'claude',
  completed: 'success',
  failed: 'error',
  killed: 'error',
}
export const EDGE_COLOR = 'permission'
const DIM = 'inactive'

export type TaskUpdateInput = {
  taskId: string
  subject?: string
  status?: TaskStatus | 'deleted'
  owner?: string
  addBlockedBy?: string[]
}

export function createTask(
  list: readonly Task[],
  task: { id: string; subject: string },
  creator: string,
): Task[] {
  const fresh: Task = { id: task.id, subject: task.subject, status: 'pending', blockedBy: [], creator }

  return [...list.filter(one => one.id !== task.id), fresh].slice(-MAX_TASKS)
}

export function applyUpdate(list: readonly Task[], change: TaskUpdateInput): Task[] {
  const { status } = change
  if (status === 'deleted') return list.filter(one => one.id !== change.taskId)

  return list.map(one => {
    if (one.id !== change.taskId) return one
    const blockedBy = [...new Set([...one.blockedBy, ...(change.addBlockedBy ?? [])])]

    return {
      ...one,
      ...(change.subject !== undefined ? { subject: change.subject } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(change.owner !== undefined ? { owner: change.owner } : {}),
      blockedBy,
    }
  })
}

export function setTodos(
  all: Readonly<Record<string, Todo[]>>,
  who: string,
  todos: readonly { content: string; status: TaskStatus }[],
): Record<string, Todo[]> {
  const rows = todos.slice(0, MAX_TODOS).map(({ content, status }) => ({ content, status }))

  return { ...all, [who]: rows }
}

// The agent list may drop finished agents: keep what was seen, overlay what is fresh.
export function mergeAgents(known: readonly AgentNode[], fresh: readonly AgentNode[]): AgentNode[] {
  const byId = new Map(known.map(node => [node.id, node]))
  for (const node of fresh) byId.set(node.id, node)

  return [...byId.values()].slice(-MAX_AGENTS)
}

export function addMessage(list: readonly Message[], message: Message): Message[] {
  return [...list, message].slice(-MAX_MESSAGES)
}

export function findAgent(key: string, agents: readonly AgentNode[]): AgentNode | undefined {
  return agents.find(node => node.id === key || node.name === key)
}

// A message address that names no known agent is the main conversation.
export function resolveKey(address: string, agents: readonly AgentNode[]): string {
  return findAgent(address, agents)?.id ?? MAIN
}

// Names as shown in the graph and on the open buttons: two unnamed Explore agents read "Explore 1", "Explore 2".
export function displayNames(agents: readonly AgentNode[]): Record<string, string> {
  const totals = new Map<string, number>()
  for (const node of agents) if (!node.name) totals.set(node.type, (totals.get(node.type) ?? 0) + 1)
  const seen = new Map<string, number>()
  const names: Record<string, string> = { [MAIN]: MAIN }
  for (const node of agents) {
    if (node.name) {
      names[node.id] = node.name
      continue
    }
    const nth = (seen.get(node.type) ?? 0) + 1
    seen.set(node.type, nth)
    names[node.id] = (totals.get(node.type) ?? 0) > 1 ? `${node.type} ${nth}` : node.type
  }

  return names
}

export function labelOf(key: string, agents: readonly AgentNode[]): string {
  if (key === MAIN) return MAIN
  const node = findAgent(key, agents)

  return node ? (displayNames(agents)[node.id] ?? node.type) : key.slice(0, 16)
}

export function tierOf(model: string): string {
  const id = model.toLowerCase()
  for (const tier of ['haiku', 'sonnet', 'opus', 'fable']) if (id.includes(tier)) return tier

  return model.slice(0, 7)
}

export type Group = { key: string; shared: Task[]; todos: Todo[] }

// Shared tasks group by owner (resolved to an agent when a name matches), else by creator.
export function groupTasks(
  tasks: readonly Task[],
  todos: Readonly<Record<string, Todo[]>>,
  agents: readonly AgentNode[],
): Group[] {
  const groups = new Map<string, Group>()
  const groupOf = (key: string): Group => {
    const found = groups.get(key)
    if (found) return found
    const made: Group = { key, shared: [], todos: [] }
    groups.set(key, made)

    return made
  }
  for (const task of tasks) {
    const key = task.owner ? (findAgent(task.owner, agents)?.id ?? task.owner) : task.creator
    groupOf(key).shared.push(task)
  }
  for (const [key, rows] of Object.entries(todos)) if (rows.length > 0) groupOf(key).todos.push(...rows)

  const order = [MAIN, ...agents.map(node => node.id)]
  const rank = (key: string) => {
    const at = order.indexOf(key)

    return at === -1 ? order.length : at
  }

  return [...groups.values()].sort((a, b) => rank(a.key) - rank(b.key))
}

// ---- Live activity: what a subagent last did, from its own tool calls.

const base = (path: unknown) => (typeof path === 'string' ? (path.split('/').pop() ?? path) : '')
const short = (text: unknown, columns = 40) => (typeof text === 'string' ? fit(text.replace(/\s+/g, ' ').trim(), columns) : '')

/** One line naming a tool call: `Read date.ts`, `Bash ls skills/`, `Grep "--color"`. */
export function describeCall(tool: string, input: Readonly<Record<string, unknown>>): string {
  const target =
    tool === 'Bash'
      ? short(input.command)
      : tool === 'Grep' || tool === 'Glob'
        ? `"${short(input.pattern, 30)}"`
        : tool === 'WebFetch'
          ? short(input.url)
          : tool === 'WebSearch'
            ? `"${short(input.query, 30)}"`
            : base(input.file_path ?? input.notebook_path ?? input.path)

  return target ? `${tool} ${target}` : tool
}

/** `0:42`, `12:05`, `1:02:03`. */
export function elapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const [h, m, s] = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
  const pad = (n: number) => String(n).padStart(2, '0')

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

// ---- Cards: one per subagent still at work.

/** Statuses that keep a card open; the rest fold into the done line. */
export const ACTIVE: ReadonlySet<string> = new Set(['running', 'waiting', 'pending', 'idle'])

export type CardItem = { text: string; status: TaskStatus }
export type CardData = {
  done: number
  total: number
  open: CardItem[]
  last?: { isSent: boolean; other: string; text: string }
}

const OPEN_ITEMS = 2

export function cardOf(
  id: string,
  tasks: readonly Task[],
  todos: Readonly<Record<string, Todo[]>>,
  messages: readonly Message[],
  agents: readonly AgentNode[],
): CardData {
  const shared = tasks.filter(task =>
    task.owner ? findAgent(task.owner, agents)?.id === id : task.creator === id,
  )
  const items: CardItem[] = [
    ...shared.map(task => ({ text: `#${task.id} ${task.subject}`, status: task.status })),
    ...(todos[id] ?? []).map(todo => ({ text: todo.content, status: todo.status })),
  ]
  const open = [
    ...items.filter(item => item.status === 'in_progress'),
    ...items.filter(item => item.status === 'pending'),
  ].slice(0, OPEN_ITEMS)
  const mine = messages.filter(
    message => resolveKey(message.from, agents) === id || resolveKey(message.to, agents) === id,
  )
  const latest = mine[mine.length - 1]
  const card: CardData = {
    done: items.filter(item => item.status === 'completed').length,
    total: items.length,
    open,
  }
  if (!latest) return card
  const isSent = resolveKey(latest.from, agents) === id
  const other = isSent ? resolveKey(latest.to, agents) : resolveKey(latest.from, agents)

  return { ...card, last: { isSent, other: labelOf(other, agents), text: latest.text } }
}

export function fit(text: string, columns: number): string {
  if (columns <= 1) return ''

  return text.length <= columns ? text : `${text.slice(0, columns - 1)}…`
}

// ---- Graph layout: boxes on a character canvas, rows by spawn depth.

export type Cell = { ch: string; color?: string }
export type Pair = { from: string; to: string; count: number }
export type GraphLayout = {
  rows: Cell[][]
  width: number
  slots: number
  undrawn: Pair[]
  names: Record<string, string>
}

const INNER = 16
export const BOX_W = INNER + 2
export const GAP = 5
export const SLOT_W = BOX_W + GAP
const BOX_H = 5
const LINK_H = 2
const ROW_H = BOX_H + LINK_H
const HALF = 9 // the connector column inside a box

const STATUS_WORD: Readonly<Record<string, string>> = { completed: 'done' }

type Placed = { key: string; depth: number; center: number; children: Placed[]; parent?: Placed }

export function layoutGraph(
  agents: readonly AgentNode[],
  models: Readonly<Record<string, string>>,
  messages: readonly Message[],
): GraphLayout {
  const names = displayNames(agents)
  const ids = new Set(agents.map(node => node.id))
  const byId = new Map(agents.map(node => [node.id, node]))
  const childIds = (parent: string) =>
    agents
      .filter(node =>
        parent === MAIN
          ? node.parentId === undefined || !ids.has(node.parentId)
          : node.parentId === parent,
      )
      .map(node => node.id)

  // Tidy tree: leaves take the next slot, a parent centers over its children.
  let slots = 0
  const seen = new Set<string>()
  const all: Placed[] = []
  const place = (key: string, depth: number, parent?: Placed): Placed => {
    seen.add(key)
    const me: Placed = { key, depth, center: 0, children: [], ...(parent ? { parent } : {}) }
    all.push(me)
    for (const id of childIds(key)) if (!seen.has(id)) me.children.push(place(id, depth + 1, me))
    const first = me.children[0]
    const last = me.children[me.children.length - 1]
    if (first && last) me.center = Math.round((first.center + last.center) / 2)
    else me.center = slots++ * SLOT_W + HALF

    return me
  }
  place(MAIN, 0)

  const depth = Math.max(...all.map(one => one.depth))
  const width = Math.max(BOX_W, slots * SLOT_W - GAP)
  const height = (depth + 1) * BOX_H + depth * LINK_H
  const rows: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ ch: ' ' })),
  )
  const put = (row: number, col: number, text: string, color?: string) => {
    ;[...text].forEach((ch, at) => {
      const cell = rows[row]?.[col + at]
      if (cell) {
        cell.ch = ch
        if (color) cell.color = color
        else delete cell.color
      }
    })
  }

  for (const one of all) {
    const top = one.depth * ROW_H
    const left = one.center - HALF
    const node = byId.get(one.key)
    const border = (l: string, r: string, joint: string | undefined) => {
      const line = [...`${l}${'─'.repeat(INNER)}${r}`]
      if (joint) line[HALF] = joint

      return line.join('')
    }
    put(top, left, border('┌', '┐', one.depth > 0 ? '┴' : undefined))
    put(top + 4, left, border('└', '┘', one.children.length > 0 ? '┬' : undefined))
    for (let at = 1; at <= 3; at++) put(top + at, left, `│${' '.repeat(INNER)}│`)
    put(top + 1, left + 2, fit(names[one.key] ?? one.key, INNER - 1))
    put(top + 2, left + 2, fit(node ? node.description : 'conversation', INNER - 1), DIM)
    const model = models[one.key]
    if (model !== undefined) {
      const tier = tierOf(model)
      put(top + 3, left + 2, tier, TIER_COLOR[tier])
    }
    if (node) {
      put(top + 3, left + 10, fit(STATUS_WORD[node.status] ?? node.status, 7), STATUS_COLOR[node.status] ?? DIM)
    }
  }

  for (const one of all) {
    const first = one.children[0]
    const last = one.children[one.children.length - 1]
    if (!first || !last) continue
    const bus = one.depth * ROW_H + BOX_H
    const centers = one.children.map(kid => kid.center)
    if (one.children.length === 1) put(bus, one.center, '│')
    else {
      put(bus, first.center, '─'.repeat(last.center - first.center + 1))
      for (const x of centers) {
        const isParent = x === one.center
        const ch =
          x === first.center ? (isParent ? '├' : '┌') : x === last.center ? (isParent ? '┤' : '┐') : isParent ? '┼' : '┬'
        put(bus, x, ch)
      }
      if (!centers.includes(one.center)) put(bus, one.center, '┴')
    }
    for (const x of centers) put(bus + 1, x, '│')
  }

  // Messages: counted per pair; drawn on a spawn line or between neighbours in a row.
  const placedByKey = new Map(all.map(one => [one.key, one]))
  const pairs = new Map<string, { a: string; b: string; ab: number; ba: number }>()
  for (const message of messages) {
    const from = resolveKey(message.from, agents)
    const to = resolveKey(message.to, agents)
    if (from === to) continue
    const [a, b] = from < to ? [from, to] : [to, from]
    const pair = pairs.get(`${a} ${b}`) ?? { a, b, ab: 0, ba: 0 }
    if (from === a) pair.ab += 1
    else pair.ba += 1
    pairs.set(`${a} ${b}`, pair)
  }
  const undrawn: Pair[] = []
  for (const pair of pairs.values()) {
    const pa = placedByKey.get(pair.a)
    const pb = placedByKey.get(pair.b)
    const total = pair.ab + pair.ba
    const words = `${total} msg${total === 1 ? '' : 's'}`
    const child = pa && pb ? (pa.parent === pb ? pa : pb.parent === pa ? pb : undefined) : undefined
    if (child?.parent) {
      put(child.parent.depth * ROW_H + BOX_H + 1, child.center + 2, words, EDGE_COLOR)
      continue
    }
    const row = pa && pb && pa.depth === pb.depth ? all.filter(one => one.depth === pa.depth) : []
    const sorted = [...row].sort((x, y) => x.center - y.center)
    const ia = pa ? sorted.indexOf(pa) : -1
    const ib = pb ? sorted.indexOf(pb) : -1
    if (pa && pb && ia !== -1 && ib !== -1 && Math.abs(ia - ib) === 1) {
      const [left, right, rightward, leftward] =
        ia < ib ? [pa, pb, pair.ab, pair.ba] : [pb, pa, pair.ba, pair.ab]
      const start = left.center - HALF + BOX_W
      const length = right.center - HALF - start
      const dashes = [...'┄'.repeat(length)]
      if (leftward > 0) dashes[0] = '<'
      if (rightward > 0) dashes[length - 1] = '>'
      put(left.depth * ROW_H + 2, start, dashes.join(''), EDGE_COLOR)
      put(left.depth * ROW_H + 3, start, fit(length >= words.length ? words : String(total), length), EDGE_COLOR)
      continue
    }
    if (pair.ab > 0) undrawn.push({ from: pair.a, to: pair.b, count: pair.ab })
    if (pair.ba > 0) undrawn.push({ from: pair.b, to: pair.a, count: pair.ba })
  }

  return { rows, width, slots, undrawn, names }
}

// One canvas row, cut to [from, to), as runs of one color each.
export function runsOf(row: readonly Cell[], from: number, to: number): { text: string; color?: string }[] {
  const runs: { text: string; color?: string }[] = []
  for (const cell of row.slice(from, to)) {
    const last = runs[runs.length - 1]
    if (last && last.color === cell.color) last.text += cell.ch
    else runs.push({ text: cell.ch, ...(cell.color ? { color: cell.color } : {}) })
  }

  return runs
}
