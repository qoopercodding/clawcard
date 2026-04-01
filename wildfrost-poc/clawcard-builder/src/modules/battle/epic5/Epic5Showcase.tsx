// Epic5Showcase.tsx — Epic 5: Animacje z Framer Motion

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import { isCompanion, isItem, isClunker, isPower } from '../types/cards'
import type { AnyBattleCard } from '../types/cards'
import styles from './Epic5Showcase.module.css'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CardInstance {
  instanceId: string
  card: AnyBattleCard
  entryDelay: number
}

interface BoardInstance {
  instanceId: string
  card: AnyBattleCard
  owner: 'player' | 'enemy'
}

interface ShuffleParticle {
  id: string
  delay: number
  rot: number
  yOffset: number
}

// ─── Unique ID generator ───────────────────────────────────────────────────────

let _uid = 0
const uid = () => `i${++_uid}`

// ─── Initial state builders ────────────────────────────────────────────────────

const BOARD_PLAYER_IDS = ['namandi', 'berry_sis', 'sneezle']
const BOARD_ENEMY_IDS  = ['foxee', 'snoof', 'wallop']
const ALL_BOARD_IDS    = [...BOARD_PLAYER_IDS, ...BOARD_ENEMY_IDS]

function buildBoard(): BoardInstance[] {
  const player = BOARD_PLAYER_IDS.map(id => {
    const card = SHOWCASE_CARDS.find(c => c.id === id)!
    return { instanceId: id + '_b', card, owner: 'player' as const }
  })
  const enemy = BOARD_ENEMY_IDS.map(id => {
    const card = SHOWCASE_CARDS.find(c => c.id === id)!
    return { instanceId: id + '_b', card, owner: 'enemy' as const }
  })
  return [...player, ...enemy]
}

function buildDrawPile(): CardInstance[] {
  return SHOWCASE_CARDS
    .filter(c => !ALL_BOARD_IDS.includes(c.id))
    .map((card, i) => ({ instanceId: `d${i}_${card.id}`, card, entryDelay: 0 }))
}

// ─── Card face visual ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  companion: '#0f2a1a',
  item:      '#0f1f2e',
  clunker:   '#211407',
  power:     '#1a0f2e',
  curse:     '#2e0f0f',
}

function cardStats(card: AnyBattleCard): string {
  if (isCompanion(card)) return `${card.attack}⚔ ${card.hp}❤ ${card.counter}⏱`
  if (isItem(card))      return `${card.energyCost}◆ ${card.targets}`
  if (isClunker(card))   return `${card.attack}⚔ ${card.scrap}🔩`
  if (isPower(card))     return `${card.energyCost}◆ power`
  return 'curse'
}

function CardFace({
  card,
  showDebug,
  instanceId,
}: {
  card: AnyBattleCard
  showDebug: boolean
  instanceId: string
}) {
  return (
    <div
      className={styles.cardFace}
      style={{ background: TYPE_COLORS[card.cardType] ?? '#111' }}
    >
      <div className={styles.cardEmoji}>{card.imageFallback}</div>
      <div className={styles.cardName}>{card.name}</div>
      <div className={styles.cardStats}>{cardStats(card)}</div>
      {showDebug && (
        <div className={styles.debugId}>{instanceId.slice(0, 12)}</div>
      )}
    </div>
  )
}

// ─── Main showcase component ───────────────────────────────────────────────────

export function Epic5Showcase() {
  const [drawPile,  setDrawPile]  = useState<CardInstance[]>(buildDrawPile)
  const [hand,      setHand]      = useState<CardInstance[]>([])
  const [board,     setBoard]     = useState<BoardInstance[]>(buildBoard)
  const [discardInstances, setDiscardInstances] = useState<CardInstance[]>([])
  const [animSpeed,    setAnimSpeed]    = useState(1)
  const [showDebug,    setShowDebug]    = useState(false)
  const [attackingCards, setAttackingCards] = useState<ReadonlySet<string>>(new Set())
  const [shuffleParticles, setShuffleParticles] = useState<ShuffleParticle[]>([])

  const timeoutIds = useRef<number[]>([])
  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timeoutIds.current.push(id)
  }

  // ─── Draw cards ────────────────────────────────────────────────────────────

  const drawCards = useCallback((n: number) => {
    setDrawPile(prev => {
      const count = Math.min(n, prev.length)
      if (count === 0) return prev
      const drawn = prev.slice(0, count).map((c, i) => ({
        ...c,
        entryDelay: i * 0.08 / animSpeed,
      }))
      setHand(h => [...h, ...drawn])
      return prev.slice(count)
    })
  }, [animSpeed])

  // ─── Discard hand ─────────────────────────────────────────────────────────

  const discardHand = useCallback(() => {
    setHand(prev => {
      if (prev.length === 0) return prev
      setDiscardInstances(d => [...d, ...prev])
      return []
    })
  }, [])

  // ─── Play card to board ────────────────────────────────────────────────────

  const playCard = useCallback(() => {
    if (hand.length === 0) return
    const toPlay = hand[0]
    setHand(prev => prev.slice(1))
    setBoard(prev => [
      ...prev,
      { instanceId: toPlay.instanceId, card: toPlay.card, owner: 'player' },
    ])
  }, [hand])

  // ─── Trigger attack ────────────────────────────────────────────────────────

  const triggerAttack = useCallback(() => {
    const alive = board.filter(c => c.owner === 'player')
    if (alive.length === 0) return
    const target = alive[Math.floor(Math.random() * alive.length)]
    setAttackingCards(prev => new Set([...prev, target.instanceId]))
    schedule(() => {
      setAttackingCards(prev => {
        const s = new Set(prev)
        s.delete(target.instanceId)
        return s
      })
    }, Math.round(400 / animSpeed))
  }, [board, animSpeed]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Kill unit ─────────────────────────────────────────────────────────────

  const killUnit = useCallback(() => {
    const enemies = board.filter(c => c.owner === 'enemy')
    if (enemies.length === 0) return
    const target = enemies[Math.floor(Math.random() * enemies.length)]
    setBoard(prev => prev.filter(c => c.instanceId !== target.instanceId))
  }, [board])

  // ─── Shuffle discard into draw ─────────────────────────────────────────────

  const shuffle = useCallback(() => {
    if (discardInstances.length === 0) return
    const count = Math.min(7, discardInstances.length)
    const particles: ShuffleParticle[] = Array.from({ length: count }, (_, i) => ({
      id: uid(),
      delay: i * 0.07 / animSpeed,
      rot: (Math.random() - 0.5) * 40,
      yOffset: (Math.random() - 0.5) * 16,
    }))
    setShuffleParticles(particles)
    const lastDelay = particles[particles.length - 1].delay
    const totalMs = (lastDelay + 0.55 / animSpeed) * 1000
    schedule(() => {
      setDrawPile(prev => [
        ...prev,
        ...discardInstances.map(c => ({ ...c, entryDelay: 0 })),
      ])
      setDiscardInstances([])
      setShuffleParticles([])
    }, totalMs)
  }, [discardInstances, animSpeed]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    timeoutIds.current.forEach(clearTimeout)
    timeoutIds.current = []
    setDrawPile(buildDrawPile())
    setHand([])
    setBoard(buildBoard())
    setDiscardInstances([])
    setAttackingCards(new Set())
    setShuffleParticles([])
  }, [])

  // ─── Fan layout helpers ────────────────────────────────────────────────────

  const handCount = hand.length
  const fanAngles = hand.map((_, i) => {
    const mid = (handCount - 1) / 2
    return (i - mid) * Math.min(10, 60 / handCount)
  })
  const fanLifts = hand.map((_, i) => {
    const mid = (handCount - 1) / 2
    return Math.abs(i - mid) * 3
  })

  const playerBoard = board.filter(c => c.owner === 'player')
  const enemyBoard  = board.filter(c => c.owner === 'enemy')

  const springIn = { type: 'spring' as const, stiffness: 260 * animSpeed, damping: 24 }

  return (
    <div className={styles.showcase}>

      {/* ── Control Panel ─────────────────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.controlsTitle}>Kontrolki</div>

        <button className={styles.btn} onClick={() => drawCards(1)}>
          Draw 1 Card
        </button>
        <button className={styles.btn} onClick={() => drawCards(5)}>
          Draw 5 Cards
        </button>
        <button className={styles.btn} onClick={discardHand}>
          Discard Hand
        </button>
        <button className={styles.btn} onClick={playCard} disabled={hand.length === 0}>
          Play Card to Board
        </button>
        <button className={styles.btn} onClick={triggerAttack} disabled={playerBoard.length === 0}>
          Trigger Attack
        </button>
        <button className={styles.btn} onClick={killUnit} disabled={enemyBoard.length === 0}>
          Kill Unit
        </button>
        <button
          className={styles.btn}
          onClick={shuffle}
          disabled={discardInstances.length === 0}
        >
          Shuffle
        </button>

        <div className={styles.sep} />

        <label className={styles.sliderLabel}>
          <span>Speed: {animSpeed.toFixed(1)}×</span>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={animSpeed}
            onChange={e => setAnimSpeed(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </label>

        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={showDebug}
            onChange={e => setShowDebug(e.target.checked)}
          />
          Show Debug
        </label>

        <div className={styles.sep} />

        <button className={`${styles.btn} ${styles.btnReset}`} onClick={reset}>
          ↺ Reset
        </button>

        {showDebug && (
          <div className={styles.debugPanel}>
            <div>Draw: {drawPile.length}</div>
            <div>Hand: {hand.length}</div>
            <div>Board: {board.length}</div>
            <div>Discard: {discardInstances.length}</div>
            <div>Attacking: {attackingCards.size}</div>
          </div>
        )}
      </div>

      {/* ── Battle Area ───────────────────────────────────────── */}
      <LayoutGroup id="epic5-layout">
        <div className={styles.battleArea}>

          {/* Board */}
          <div className={styles.boardArea}>

            {/* Player side */}
            <div className={styles.boardSide}>
              <div className={styles.boardLabel}>Gracz</div>
              <div className={styles.boardSlots}>
                <AnimatePresence>
                  {playerBoard.map(c => (
                    <motion.div
                      key={c.instanceId}
                      layoutId={`card-${c.card.id}-${c.instanceId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.4, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.3,
                        y: 20,
                        transition: { duration: 0.35 / animSpeed },
                      }}
                      transition={springIn}
                      whileHover={{ scale: 1.08 }}
                      className={styles.boardCard}
                    >
                      <motion.div
                        animate={
                          attackingCards.has(c.instanceId)
                            ? { x: [0, 52, 0] }
                            : { x: 0 }
                        }
                        transition={{
                          duration: 0.32 / animSpeed,
                          times: [0, 0.45, 1],
                          ease: 'easeInOut',
                        }}
                      >
                        <CardFace
                          card={c.card}
                          showDebug={showDebug}
                          instanceId={c.instanceId}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {playerBoard.length === 0 && (
                  <div className={styles.emptyBoard}>brak</div>
                )}
              </div>
            </div>

            <div className={styles.vsDivider}>VS</div>

            {/* Enemy side */}
            <div className={styles.boardSide}>
              <div className={styles.boardLabel}>Wrogowie</div>
              <div className={styles.boardSlots}>
                <AnimatePresence>
                  {enemyBoard.map(c => (
                    <motion.div
                      key={c.instanceId}
                      layoutId={`card-${c.card.id}-${c.instanceId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.4, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.3,
                        y: 20,
                        transition: { duration: 0.35 / animSpeed },
                      }}
                      transition={springIn}
                      whileHover={{ scale: 1.08 }}
                      className={styles.boardCard}
                    >
                      <motion.div
                        animate={
                          attackingCards.has(c.instanceId)
                            ? { x: [0, -52, 0] }
                            : { x: 0 }
                        }
                        transition={{
                          duration: 0.32 / animSpeed,
                          times: [0, 0.45, 1],
                          ease: 'easeInOut',
                        }}
                      >
                        <CardFace
                          card={c.card}
                          showDebug={showDebug}
                          instanceId={c.instanceId}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {enemyBoard.length === 0 && (
                  <div className={styles.emptyBoard}>brak</div>
                )}
              </div>
            </div>
          </div>

          {/* Hand */}
          <div className={styles.handArea}>
            <AnimatePresence mode="popLayout">
              {hand.map((c, i) => (
                <motion.div
                  key={c.instanceId}
                  layoutId={`card-${c.card.id}-${c.instanceId}`}
                  initial={{ opacity: 0, x: -160, y: 80, rotate: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: fanLifts[i] ?? 0,
                    rotate: fanAngles[i] ?? 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: 180,
                    y: 60,
                    rotate: 18,
                    transition: {
                      duration: 0.28 / animSpeed,
                      ease: 'easeIn',
                    },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200 * animSpeed,
                    damping: 20,
                    delay: c.entryDelay,
                  }}
                  whileHover={{
                    y: (fanLifts[i] ?? 0) - 32,
                    scale: 1.15,
                    zIndex: 100,
                    rotate: 0,
                  }}
                  className={styles.handCard}
                >
                  <CardFace
                    card={c.card}
                    showDebug={showDebug}
                    instanceId={c.instanceId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {hand.length === 0 && (
              <div className={styles.handEmpty}>Ręka pusta</div>
            )}
          </div>

          {/* Pile bar */}
          <div className={styles.pileBar}>

            {/* Draw pile */}
            <div className={styles.pile}>
              <span className={styles.pileIcon}>🂠</span>
              <motion.span
                key={`draw-${drawPile.length}`}
                initial={{ scale: 1.4, color: '#c8902a' }}
                animate={{ scale: 1, color: '#e8d5b0' }}
                transition={{ duration: 0.25 }}
                className={styles.pileCount}
              >
                {drawPile.length}
              </motion.span>
              <span className={styles.pileLabel}>Dobierz</span>
            </div>

            {/* Shuffle particles */}
            <div className={styles.shuffleTrack}>
              <AnimatePresence>
                {shuffleParticles.map(p => (
                  <motion.div
                    key={p.id}
                    className={styles.shuffleParticle}
                    initial={{ x: 110, y: 0, rotate: p.rot, opacity: 1 }}
                    animate={{ x: -110, y: p.yOffset, rotate: 0, opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.5 / animSpeed,
                      delay: p.delay,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Discard pile */}
            <div className={styles.pile}>
              <span className={styles.pileIcon}>🂡</span>
              <motion.span
                key={`dis-${discardInstances.length}`}
                initial={{ scale: 1.4, color: '#c8902a' }}
                animate={{ scale: 1, color: '#e8d5b0' }}
                transition={{ duration: 0.25 }}
                className={styles.pileCount}
              >
                {discardInstances.length}
              </motion.span>
              <span className={styles.pileLabel}>Odrzucone</span>
            </div>
          </div>

        </div>
      </LayoutGroup>
    </div>
  )
}
