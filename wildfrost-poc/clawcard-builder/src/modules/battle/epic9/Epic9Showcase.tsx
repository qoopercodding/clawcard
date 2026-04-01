// Epic9Showcase.tsx — Epic 9: Room Trigger System

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Epic9Showcase.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type TriggerType = 'combat' | 'service' | 'exploration' | 'passive'
type ServiceType = 'merchant' | 'campfire' | 'gospoda' | 'studnia'
type ExplorationType = 'cartographer' | 'lore_npc' | 'treasure' | 'secret'

interface RoomTrigger {
  type: TriggerType
  serviceType?: ServiceType
  explorationType?: ExplorationType
  combatDifficulty?: 'normal' | 'hard' | 'boss'
  effect?: string
  amount?: number
  rewards?: string[]
}

interface RoomDef {
  key: string
  label: string
  emoji: string
  trigger: RoomTrigger
}

interface LogEntry {
  id: number
  roomKey: string
  emoji: string
  message: string
  triggerType: TriggerType
  ts: number
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROOM_DEFS: RoomDef[] = [
  {
    key: 'chamber',
    label: 'Chamber',
    emoji: '⚔',
    trigger: { type: 'combat', combatDifficulty: 'normal', rewards: ['gold', 'card_choice'] },
  },
  {
    key: 'hard_chamber',
    label: 'Hard Chamber',
    emoji: '💀',
    trigger: { type: 'combat', combatDifficulty: 'hard', rewards: ['gold_x2', 'card_choice'] },
  },
  {
    key: 'boss_chamber',
    label: 'Boss Chamber',
    emoji: '👑',
    trigger: { type: 'combat', combatDifficulty: 'boss', rewards: ['relic', 'card_choice_x3'] },
  },
  {
    key: 'campfire',
    label: 'Campfire',
    emoji: '🔥',
    trigger: { type: 'service', serviceType: 'campfire' },
  },
  {
    key: 'shop',
    label: 'Shop',
    emoji: '🏪',
    trigger: { type: 'service', serviceType: 'merchant' },
  },
  {
    key: 'gospoda',
    label: 'Gospoda',
    emoji: '🍺',
    trigger: { type: 'service', serviceType: 'gospoda' },
  },
  {
    key: 'studnia',
    label: 'Studnia',
    emoji: '💧',
    trigger: { type: 'service', serviceType: 'studnia' },
  },
  {
    key: 'echo_spring',
    label: 'Echo Spring',
    emoji: '🌊',
    trigger: { type: 'passive', effect: 'addEchoes', amount: 12 },
  },
  {
    key: 'treasure',
    label: 'Treasure',
    emoji: '💎',
    trigger: { type: 'exploration', explorationType: 'treasure' },
  },
  {
    key: 'cartographer',
    label: 'Cartographer',
    emoji: '🗺',
    trigger: { type: 'exploration', explorationType: 'cartographer' },
  },
  {
    key: 'lore_npc',
    label: 'Lore NPC',
    emoji: '📖',
    trigger: { type: 'exploration', explorationType: 'lore_npc' },
  },
  {
    key: 'secret',
    label: 'Secret',
    emoji: '🔮',
    trigger: { type: 'exploration', explorationType: 'secret' },
  },
  {
    key: 'corridor',
    label: 'Corridor',
    emoji: '🚪',
    trigger: { type: 'passive', effect: 'addGold', amount: 2 },
  },
  {
    key: 'crossroads',
    label: 'Crossroads',
    emoji: '✦',
    trigger: { type: 'passive', effect: 'addEchoes', amount: 5 },
  },
  {
    key: 'curse_room',
    label: 'Curse Room',
    emoji: '💢',
    trigger: { type: 'passive', effect: 'addCurse' },
  },
  {
    key: 'charm_smith',
    label: 'Charm Smith',
    emoji: '🔨',
    trigger: { type: 'service', serviceType: 'gospoda' },
  },
  {
    key: 'shrine',
    label: 'Shrine',
    emoji: '✨',
    trigger: { type: 'passive', effect: 'heal', amount: 5 },
  },
  {
    key: 'void_portal',
    label: 'Void Portal',
    emoji: '🌀',
    trigger: { type: 'exploration', explorationType: 'secret' },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLogMessage(room: RoomDef): string {
  const { trigger } = room
  switch (trigger.type) {
    case 'combat': {
      const rewards = trigger.rewards?.join(', ') ?? '—'
      return `⚔ COMBAT → ${trigger.combatDifficulty} difficulty | Rewards: ${rewards}`
    }
    case 'service':
      return `🏪 SERVICE → ${trigger.serviceType} screen would open`
    case 'exploration':
      return `🔍 EXPLORATION → ${trigger.explorationType} encounter`
    case 'passive': {
      const amountStr = trigger.amount !== undefined ? `: ${trigger.amount}` : ''
      return `✨ PASSIVE → ${trigger.effect}${amountStr}`
    }
  }
}

const TRIGGER_COLORS: Record<TriggerType, string> = {
  combat: '#c0392b',
  service: '#2471a3',
  exploration: '#1e8449',
  passive: '#5d6d7e',
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  combat: 'Combat',
  service: 'Service',
  exploration: 'Explore',
  passive: 'Passive',
}

// ─── RoomTile ─────────────────────────────────────────────────────────────────

interface RoomTileProps {
  room: RoomDef
  highlighted: boolean
  onClick: (room: RoomDef) => void
}

function RoomTile({ room, highlighted, onClick }: RoomTileProps) {
  const { trigger } = room
  const color = TRIGGER_COLORS[trigger.type]

  return (
    <motion.button
      className={`${styles.tile} ${styles[`tile_${trigger.type}`]}`}
      onClick={() => onClick(room)}
      animate={
        highlighted
          ? { borderColor: '#c8902a', boxShadow: `0 0 14px #c8902a88` }
          : { borderColor: `${color}44`, boxShadow: 'none' }
      }
      transition={{ duration: 0.18 }}
      whileHover={{ scale: 1.05, borderColor: `${color}bb` }}
      whileTap={{ scale: 0.96 }}
    >
      <span className={styles.tileEmoji}>{room.emoji}</span>
      <span className={styles.tileName}>{room.label}</span>
      <span
        className={styles.tileBadge}
        style={{ background: `${color}33`, color, border: `1px solid ${color}55` }}
      >
        {TRIGGER_LABELS[trigger.type]}
      </span>
    </motion.button>
  )
}

// ─── LogEntry ─────────────────────────────────────────────────────────────────

interface LogEntryProps {
  entry: LogEntry
}

function LogEntryItem({ entry }: LogEntryProps) {
  const color = TRIGGER_COLORS[entry.triggerType]
  return (
    <motion.div
      className={styles.logEntry}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.28, ease: 'easeOut' as const }}
      style={{ borderLeftColor: color }}
    >
      <span className={styles.logTs}>{entry.ts}s</span>
      <span className={styles.logEmoji}>{entry.emoji}</span>
      <span className={styles.logMsg}>{entry.message}</span>
    </motion.div>
  )
}

// ─── Summary ──────────────────────────────────────────────────────────────────

interface SummaryProps {
  log: LogEntry[]
}

function Summary({ log }: SummaryProps) {
  const counts: Record<TriggerType, number> = {
    combat: 0,
    service: 0,
    exploration: 0,
    passive: 0,
  }
  for (const entry of log) {
    counts[entry.triggerType]++
  }

  const types: TriggerType[] = ['combat', 'service', 'exploration', 'passive']

  return (
    <div className={styles.summary}>
      <p className={styles.summaryTitle}>Room → Trigger Summary</p>
      <div className={styles.summaryGrid}>
        {types.map(t => {
          const color = TRIGGER_COLORS[t]
          return (
            <div
              key={t}
              className={styles.summaryCell}
              style={{ borderColor: `${color}44`, background: `${color}11` }}
            >
              <span className={styles.summaryCellLabel} style={{ color }}>
                {TRIGGER_LABELS[t]}
              </span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={counts[t]}
                  className={styles.summaryCellCount}
                  style={{ color }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  {counts[t]}
                </motion.span>
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

let nextId = 1

export function Epic9Showcase() {
  const [log, setLog] = useState<LogEntry[]>([])
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const startTs = useRef(Date.now())

  const handleRoomClick = useCallback((room: RoomDef) => {
    // Highlight tile briefly
    setHighlighted(room.key)
    setTimeout(() => setHighlighted(null), 600)

    // Add log entry
    const ts = Math.floor((Date.now() - startTs.current) / 1000)
    const entry: LogEntry = {
      id: nextId++,
      roomKey: room.key,
      emoji: room.emoji,
      message: buildLogMessage(room),
      triggerType: room.trigger.type,
      ts,
    }

    setLog(prev => [entry, ...prev].slice(0, 20))
  }, [])

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Epic 9 — Room Trigger System</h2>

      <div className={styles.mainLayout}>
        {/* ── Left: Room Grid ── */}
        <div className={styles.gridPanel}>
          <p className={styles.panelTitle}>Rooms — click to enter</p>
          <div className={styles.roomGrid}>
            {ROOM_DEFS.map(room => (
              <RoomTile
                key={room.key}
                room={room}
                highlighted={highlighted === room.key}
                onClick={handleRoomClick}
              />
            ))}
          </div>
        </div>

        {/* ── Right: Console ── */}
        <div className={styles.consolePanel}>
          <div className={styles.consolePanelHeader}>
            <p className={styles.panelTitle}>Trigger Console</p>
            {log.length > 0 && (
              <button
                className={styles.clearBtn}
                onClick={() => setLog([])}
              >
                Clear
              </button>
            )}
          </div>

          <div className={styles.consoleLog}>
            {log.length === 0 && (
              <p className={styles.consoleEmpty}>Click a room tile to simulate entering...</p>
            )}
            <AnimatePresence initial={false}>
              {log.map(entry => (
                <LogEntryItem key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>

          {/* ── Summary ── */}
          <Summary log={log} />
        </div>
      </div>
    </div>
  )
}
