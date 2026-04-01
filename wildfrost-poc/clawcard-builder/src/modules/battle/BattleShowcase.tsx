import { useState, useEffect } from 'react'
import { Epic1Showcase } from './epic1/Epic1Showcase'
import { Epic2Showcase } from './epic2/Epic2Showcase'
import { Epic3Showcase } from './epic3/Epic3Showcase'
import styles from './BattleShowcase.module.css'

// ─── Epic registry ────────────────────────────────────────────────────────────

interface EpicMeta {
  id: number
  label: string
  status: 'done' | 'wip' | 'todo'
}

const EPICS: EpicMeta[] = [
  { id: 0,  label: 'Epic 0: Pusty ekran (baseline)',           status: 'done' },
  { id: 1,  label: 'Epic 1: Kategorie kart (taksonomia)',      status: 'done' },
  { id: 2,  label: 'Epic 2: Karty przeanalizowane (mechaniki)', status: 'done' },
  { id: 3,  label: 'Epic 3: Battle Screen layout',             status: 'done' },
  { id: 4,  label: 'Epic 4: Karty na boardzie',                status: 'todo' },
  { id: 5,  label: 'Epic 5: Animacje',                         status: 'todo' },
  { id: 6,  label: 'Epic 6: Draw/Discard/Exhaust Pile',        status: 'todo' },
  { id: 7,  label: 'Epic 7: Merchant Screen',                  status: 'todo' },
  { id: 8,  label: 'Epic 8: Campfire Screen',                  status: 'todo' },
  { id: 9,  label: 'Epic 9: Room Triggers',                    status: 'todo' },
  { id: 10, label: 'Epic 10: Sandbox Routes',                  status: 'todo' },
  { id: 11, label: 'Epic 11: Full Transitions',                status: 'todo' },
]

const STATUS_BADGE: Record<EpicMeta['status'], string> = {
  done: '✓',
  wip:  '⟳',
  todo: '○',
}

// ─── Epic content ─────────────────────────────────────────────────────────────

function EpicContent({ epicId }: { epicId: number }) {
  switch (epicId) {
    case 0:
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚔</div>
          <h2 className={styles.emptyTitle}>Battle Showcase — Baseline</h2>
          <p className={styles.emptySubtitle}>
            Wybierz epik z dropdown powyżej aby zobaczyć zawartość.
          </p>
          <div className={styles.emptyHint}>
            Każdy epik to osobny etap budowy systemu walki.
          </div>
        </div>
      )
    case 1:
      return <Epic1Showcase />
    case 2:
      return <Epic2Showcase />
    case 3:
      return <Epic3Showcase />
    default:
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚧</div>
          <h2 className={styles.emptyTitle}>Epic {epicId} — W budowie</h2>
          <p className={styles.emptySubtitle}>
            Ten epik nie jest jeszcze zaimplementowany.
          </p>
        </div>
      )
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BattleShowcase() {
  const [epicId, setEpicId] = useState<number>(() => {
    // Read ?epic=N from URL
    const params = new URLSearchParams(window.location.search)
    const n = parseInt(params.get('epic') ?? '0', 10)
    return isNaN(n) ? 0 : Math.max(0, Math.min(11, n))
  })

  // Sync URL param when epic changes
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('epic', String(epicId))
    window.history.replaceState(null, '', url.toString())
  }, [epicId])

  const currentEpic = EPICS[epicId]

  return (
    <div className={styles.showcase}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>⚔ Battle Showcase</span>
        <div className={styles.epicSelector}>
          <label className={styles.selectorLabel} htmlFor="epic-select">Epik:</label>
          <select
            id="epic-select"
            className={styles.select}
            value={epicId}
            onChange={e => setEpicId(Number(e.target.value))}
          >
            {EPICS.map(epic => (
              <option key={epic.id} value={epic.id}>
                {STATUS_BADGE[epic.status]} {epic.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.epicStatus}>
          <span
            className={styles.statusDot}
            data-status={currentEpic.status}
          />
          <span className={styles.statusText}>
            {currentEpic.status === 'done' ? 'Zaimplementowany' :
             currentEpic.status === 'wip'  ? 'W trakcie' : 'Do zrobienia'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <EpicContent epicId={epicId} />
      </div>
    </div>
  )
}
