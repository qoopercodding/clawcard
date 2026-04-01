import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import type { AnyBattleCard } from '../types/cards'
import styles from './Epic6Showcase.module.css'

// ─── Deck state ───────────────────────────────────────────────────────────────

interface DeckState {
  draw: AnyBattleCard[]
  hand: AnyBattleCard[]
  discard: AnyBattleCard[]
  exhaust: AnyBattleCard[]
}

const INITIAL_DRAW = SHOWCASE_CARDS.slice(0, 10)

function makeInitialState(): DeckState {
  return {
    draw: [...INITIAL_DRAW],
    hand: [],
    discard: [],
    exhaust: [],
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: number
  label: string
  color?: string
}

function AnimatedCounter({ value, label, color }: AnimatedCounterProps) {
  return (
    <div className={styles.counterWrap}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          className={styles.counterNum}
          style={color ? { color } : undefined}
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className={styles.counterLabel}>{label}</span>
    </div>
  )
}

interface CardChipProps {
  card: AnyBattleCard
  highlight?: boolean
}

function CardChip({ card, highlight }: CardChipProps) {
  return (
    <div className={`${styles.cardChip} ${highlight ? styles.cardChipHighlight : ''}`}>
      <span className={styles.cardChipEmoji}>{card.imageFallback}</span>
      <span className={styles.cardChipName}>{card.name}</span>
      <span className={styles.cardChipType}>{card.cardType}</span>
    </div>
  )
}

interface PileModalProps {
  title: string
  cards: AnyBattleCard[]
  onClose: () => void
}

function PileModal({ title, cards, onClose }: PileModalProps) {
  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring' as const, stiffness: 320, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        {cards.length === 0 ? (
          <p className={styles.emptyNote}>— empty —</p>
        ) : (
          <div className={styles.modalList}>
            {cards.map(card => (
              <CardChip key={card.id} card={card} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Log ──────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: number
  message: string
}

let logSeq = 0

function addLog(prev: LogEntry[], msg: string): LogEntry[] {
  return [{ id: ++logSeq, message: msg }, ...prev].slice(0, 20)
}

// ─── Main component ───────────────────────────────────────────────────────────

type ModalTarget = 'discard' | 'exhaust' | null

export function Epic6Showcase() {
  const [deck, setDeck] = useState<DeckState>(makeInitialState)
  const [modal, setModal] = useState<ModalTarget>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  const pushLog = useCallback((msg: string) => {
    setLog(prev => addLog(prev, msg))
  }, [])

  // Draw 5 cards. If draw pile is empty, shuffle discard into draw first.
  const handleStartTurn = useCallback(() => {
    setDeck(prev => {
      let draw = [...prev.draw]
      let discard = [...prev.discard]
      const hand = [...prev.hand]
      const exhaust = [...prev.exhaust]

      // Discard current hand before drawing new one
      const newDiscard = [...discard, ...hand]
      const newHand: AnyBattleCard[] = []

      let newDraw = draw

      if (newDraw.length === 0 && newDiscard.length > 0) {
        newDraw = shuffleArray(newDiscard)
        discard = []
        pushLog('Draw pile empty — shuffled discard into draw pile.')
      } else {
        discard = newDiscard
      }

      const drawCount = Math.min(5, newDraw.length)
      const drawn = newDraw.slice(0, drawCount)
      newDraw = newDraw.slice(drawCount)

      pushLog(`Start Turn: drew ${drawCount} card(s).`)

      return {
        draw: newDraw,
        hand: [...newHand, ...drawn],
        discard: discard.length === newDiscard.length ? discard : [],
        exhaust,
      }
    })
  }, [pushLog])

  const handleEndTurn = useCallback(() => {
    setDeck(prev => {
      if (prev.hand.length === 0) {
        pushLog('End Turn: hand already empty.')
        return prev
      }
      pushLog(`End Turn: discarded ${prev.hand.length} card(s).`)
      return {
        ...prev,
        discard: [...prev.discard, ...prev.hand],
        hand: [],
      }
    })
  }, [pushLog])

  const handlePlayCard = useCallback(() => {
    setDeck(prev => {
      if (prev.hand.length === 0) {
        pushLog('No cards in hand to play.')
        return prev
      }
      const [played, ...rest] = prev.hand
      pushLog(`Played: ${played.name} → discard pile.`)
      return {
        ...prev,
        hand: rest,
        discard: [...prev.discard, played],
      }
    })
  }, [pushLog])

  const handleExhaustCard = useCallback(() => {
    setDeck(prev => {
      if (prev.hand.length === 0) {
        pushLog('No cards in hand to exhaust.')
        return prev
      }
      const [exhausted, ...rest] = prev.hand
      pushLog(`Exhausted: ${exhausted.name} → exhaust pile.`)
      return {
        ...prev,
        hand: rest,
        exhaust: [...prev.exhaust, exhausted],
      }
    })
  }, [pushLog])

  const handleConsumeCard = useCallback(() => {
    setDeck(prev => {
      if (prev.hand.length === 0) {
        pushLog('No cards in hand to consume.')
        return prev
      }
      const [consumed, ...rest] = prev.hand
      pushLog(`Consumed: ${consumed.name} — removed from game.`)
      return { ...prev, hand: rest }
    })
  }, [pushLog])

  const handleReset = useCallback(() => {
    setDeck(makeInitialState())
    setLog([])
    pushLog('Deck reset.')
  }, [pushLog])

  const modalCards = modal === 'discard' ? deck.discard : modal === 'exhaust' ? deck.exhaust : []
  const modalTitle = modal === 'discard' ? 'Discard Pile' : modal === 'exhaust' ? 'Exhaust Pile' : ''

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Epic 6 — Draw / Discard / Exhaust</h2>

      <div className={styles.layout}>
        {/* ── Left panel: controls + log ── */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Controls</h3>

          <div className={styles.btnGroup}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStartTurn}>
              Start Turn <span className={styles.btnHint}>(draw 5)</span>
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleEndTurn}>
              End Turn <span className={styles.btnHint}>(discard hand)</span>
            </button>
          </div>

          <div className={styles.btnGroup}>
            <button className={styles.btn} onClick={handlePlayCard}>
              Play Card <span className={styles.btnHint}>(1st → discard)</span>
            </button>
            <button className={styles.btn} onClick={handleExhaustCard}>
              Exhaust Card <span className={styles.btnHint}>(1st → exhaust)</span>
            </button>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleConsumeCard}>
              Consume Card <span className={styles.btnHint}>(1st → removed)</span>
            </button>
          </div>

          <button className={`${styles.btn} ${styles.btnReset}`} onClick={handleReset}>
            Reset Deck
          </button>

          <h3 className={styles.sidebarTitle} style={{ marginTop: '1.5rem' }}>Action Log</h3>
          <div className={styles.log}>
            <AnimatePresence initial={false}>
              {log.map(entry => (
                <motion.div
                  key={entry.id}
                  className={styles.logEntry}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {entry.message}
                </motion.div>
              ))}
            </AnimatePresence>
            {log.length === 0 && (
              <p className={styles.emptyNote}>No actions yet.</p>
            )}
          </div>
        </aside>

        {/* ── Right area: pile visualizer ── */}
        <main className={styles.main}>
          {/* Pile counters row */}
          <div className={styles.pilesRow}>
            <PileTile
              icon="🎴"
              label="Draw Pile"
              count={deck.draw.length}
              accentColor="#6eb5ff"
            />
            <PileTile
              icon="🗑️"
              label="Discard"
              count={deck.discard.length}
              accentColor="#c8902a"
              clickable
              onClickLabel="view"
              onClick={() => setModal('discard')}
            />
            <PileTile
              icon="💀"
              label="Exhaust"
              count={deck.exhaust.length}
              accentColor="#a060c0"
              clickable
              onClickLabel="view"
              onClick={() => setModal('exhaust')}
            />
          </div>

          {/* Hand */}
          <section className={styles.handSection}>
            <h3 className={styles.handTitle}>
              Hand
              <AnimatedCounter value={deck.hand.length} label="cards" color="#e8d5b0" />
            </h3>

            <div className={styles.hand}>
              <AnimatePresence>
                {deck.hand.length === 0 && (
                  <motion.p
                    className={styles.emptyNote}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Hand is empty — click Start Turn to draw.
                  </motion.p>
                )}
                {deck.hand.map((card, i) => (
                  <motion.div
                    key={card.id}
                    className={styles.handCard}
                    initial={{ opacity: 0, y: -24, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7, x: 40 }}
                    transition={{
                      type: 'spring' as const,
                      stiffness: 350,
                      damping: 26,
                      delay: i * 0.04,
                    }}
                  >
                    <span className={styles.handCardEmoji}>{card.imageFallback}</span>
                    <div className={styles.handCardInfo}>
                      <span className={styles.handCardName}>{card.name}</span>
                      <span className={styles.handCardType}>{card.cardType}</span>
                    </div>
                    {i === 0 && <span className={styles.firstTag}>next</span>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Deck state summary */}
          <section className={styles.deckState}>
            <h3 className={styles.deckStateTitle}>Deck State</h3>
            <div className={styles.deckStateGrid}>
              <PileList
                label="Draw Pile"
                cards={deck.draw}
                color="#6eb5ff"
                showCount
              />
              <PileList
                label="Discard"
                cards={deck.discard}
                color="#c8902a"
                onHeaderClick={() => setModal('discard')}
              />
              <PileList
                label="Exhaust"
                cards={deck.exhaust}
                color="#a060c0"
                onHeaderClick={() => setModal('exhaust')}
              />
            </div>
          </section>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <PileModal
            title={modalTitle}
            cards={modalCards}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PileTile ─────────────────────────────────────────────────────────────────

interface PileTileProps {
  icon: string
  label: string
  count: number
  accentColor: string
  clickable?: boolean
  onClickLabel?: string
  onClick?: () => void
}

function PileTile({ icon, label, count, accentColor, clickable, onClickLabel, onClick }: PileTileProps) {
  return (
    <div
      className={`${styles.pileTile} ${clickable ? styles.pileTileClickable : ''}`}
      style={{ borderColor: accentColor + '55' }}
      onClick={clickable ? onClick : undefined}
    >
      <span className={styles.pileTileIcon}>{icon}</span>
      <AnimatedCounter value={count} label={label} color={accentColor} />
      {clickable && (
        <span className={styles.pileTileHint}>{onClickLabel}</span>
      )}
    </div>
  )
}

// ─── PileList ─────────────────────────────────────────────────────────────────

interface PileListProps {
  label: string
  cards: AnyBattleCard[]
  color: string
  showCount?: boolean
  onHeaderClick?: () => void
}

function PileList({ label, cards, color, showCount, onHeaderClick }: PileListProps) {
  return (
    <div className={styles.pileList}>
      <div
        className={`${styles.pileListHeader} ${onHeaderClick ? styles.pileListHeaderClickable : ''}`}
        style={{ color }}
        onClick={onHeaderClick}
      >
        <span>{label}</span>
        <span className={styles.pileListCount}>{cards.length}</span>
      </div>
      <div className={styles.pileListBody}>
        {cards.length === 0 && (
          <p className={styles.emptyNote}>empty</p>
        )}
        {(showCount ? cards.slice(0, 5) : cards).map(card => (
          <CardChip key={card.id} card={card} />
        ))}
        {showCount && cards.length > 5 && (
          <p className={styles.emptyNote}>+{cards.length - 5} more (hidden)</p>
        )}
      </div>
    </div>
  )
}
