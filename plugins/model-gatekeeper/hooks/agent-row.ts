// The text of one agent row, free of `$` so it is tested on its own.
// Claude Code draws the row's pointer and nesting; this is the body after them.
import type { AgentInfo } from 'claude-code'

export type RowFacts = Pick<
  AgentInfo,
  'id' | 'type' | 'name' | 'model' | 'label' | 'description' | 'tokenCount' | 'parentId' | 'startTime' | 'taskStatus'
>

const RESET = '\u001b[0m'
const BOLD = '\u001b[1m'
const DIM = '\u001b[2m'
const RED = '\u001b[38;2;237;135;150m'
const FAMILY_COLOR: Readonly<Record<string, string>> = {
  haiku: '\u001b[38;2;166;218;149m',
  sonnet: '\u001b[38;2;138;173;244m',
  opus: '\u001b[38;2;198;160;246m',
}

/** `claude-haiku-5-5` -> `{ family: 'haiku', text: 'haiku 5.5' }`; an unknown id is shown as is. */
export function shortModel(id: string | undefined): { family: string; text: string } {
  if (id === undefined || id === '') return { family: '', text: 'model ?' }
  const found = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?=$|[-[@])/.exec(id)
  const [, family, major, minor] = found ?? []
  if (family === undefined || major === undefined) return { family: '', text: id }

  return { family, text: minor === undefined ? `${family} ${major}` : `${family} ${major}.${minor}` }
}

/** Whether no later sibling (same parent, started after it) shares the list. */
export function isLastSibling(row: RowFacts, rows: readonly RowFacts[]): boolean {
  return !rows.some(
    other =>
      other.id !== row.id &&
      other.parentId === row.parentId &&
      (other.startTime > row.startTime || (other.startTime === row.startTime && other.id > row.id)),
  )
}

function tokens(count: number): string {
  if (count <= 0) return ''
  if (count < 1000) return `${count}`

  return `${Math.round(count / 1000)}k`
}

function status(taskStatus: RowFacts['taskStatus']): string {
  if (taskStatus === 'failed' || taskStatus === 'killed') return ` ${RED}${taskStatus}${RESET}`
  if (taskStatus === 'completed') return ` ${DIM}done${RESET}`

  return ''
}

export function agentRowBody(row: RowFacts, rows: readonly RowFacts[]): string {
  const branch = isLastSibling(row, rows) ? '└─' : '├─'
  const who = row.name !== undefined && row.name !== row.type ? `${row.name} (${row.type})` : row.type
  const model = shortModel(row.model)
  const color = FAMILY_COLOR[model.family] ?? DIM
  const doing = ((row.label || row.description).split('\n')[0] ?? '').trim()
  const used = tokens(row.tokenCount)

  return [
    `${DIM}${branch}${RESET} ${BOLD}${who}${RESET} ${color}${model.text}${RESET}`,
    doing === '' ? '' : ` ${DIM}${doing}${RESET}`,
    used === '' ? '' : ` ${DIM}${used}${RESET}`,
    status(row.taskStatus),
  ].join('')
}
