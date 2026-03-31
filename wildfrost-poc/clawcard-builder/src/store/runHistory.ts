const HISTORY_KEY = 'clawcard_run_history'
const MAX_HISTORY = 20

export interface RunRecord {
  id: string
  seed: number
  result: 'won' | 'lost' | 'abandoned'
  score: number
  floor: number
  gold: number
  deckSize: number
  duration: number
  date: number
}

export function getRunHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRunToHistory(record: RunRecord) {
  const history = getRunHistory()
  history.unshift(record)
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function getBestScore(): number {
  return getRunHistory().reduce((best, r) => Math.max(best, r.score), 0)
}

export function getTotalRuns(): number {
  return getRunHistory().length
}

export function getWinRate(): number {
  const history = getRunHistory()
  if (history.length === 0) return 0
  const wins = history.filter(r => r.result === 'won').length
  return Math.round((wins / history.length) * 100)
}
