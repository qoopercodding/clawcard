// Epic4Showcase.tsx — Epic 4: Karty na boardzie

import { useState, useCallback, useRef } from 'react'
import { BoardCard, createBoardCardState } from './BoardCard'
import type { BoardCardState, VisualState } from './BoardCard'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import { isCompanion, isClunker } from '../types/cards'
import type { BattleCompanionCard, BattleClunkerCard } from '../types/cards'
import styles from './Epic4Showcase.module.css'

// ─── Initial board setup ──────────────────────────────────────────────────────

const companions = SHOWCASE_CARDS.filter(isCompanion) as BattleCompanionCard[]
const clunkers   = SHOWCASE_CARDS.filter(isClunker)   as BattleClunkerCard[]

const PLAYER_CARDS: (BattleCompanionCard | BattleClunkerCard)[] = [
  companions[0], // Namandi
  companions[1], // Berry Sis
  clunkers[0],   // Woodhead
]

const ENEMY_CARDS: (BattleCompanionCard | BattleClunkerCard)[] = [
  companions[3], // Wallop
  companions[4], // Snoof
  clunkers[1],   // Iron Bastion
  companions[2], // Foxee
]

function buildInitialState(): BoardCardState[] {
  return [
    ...PLAYER_CARDS.map(c => createBoardCardState(c, 'player')),
    ...ENEMY_CARDS.map(c  => createBoardCardState(c, 'enemy')),
  ]
}

let dmgIdCounter = 0

// ─── State helpers ────────────────────────────────────────────────────────────

function withCard(
  states: BoardCardState[],
  index: number,
  updater: (s: BoardCardState) => BoardCardState,
): BoardCardState[] {
  return states.map((s, i) => i === index ? updater(s) : s)
}

function clearVisualState(states: BoardCardState[], index: number): BoardCardState[] {
  return withCard(states, index, s => ({ ...s, visualState: 'normal' as VisualState }))
}

function removeDamageNumber(states: BoardCardState[], index: number, dmgId: number): BoardCardState[] {
  return withCard(states, index, s => ({
    ...s,
    damageNumbers: s.damageNumbers.filter(d => d.id !== dmgId),
  }))
}

// ─── Showcase component ───────────────────────────────────────────────────────

export function Epic4Showcase() {
  const [cards, setCards] = useState<BoardCardState[]>(buildInitialState)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  const scheduleCleanup = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timeouts.current.push(t)
  }, [])

  // ─── Actions ─────────────────────────────────────────────────────

  const handleHit = useCallback(() => {
    setCards(prev => {
      const aliveEnemy = prev
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.owner === 'enemy' && s.visualState !== 'dead')
      if (aliveEnemy.length === 0) return prev

      const { i: idx } = aliveEnemy[Math.floor(Math.random() * aliveEnemy.length)]
      const dmg    = 4 + Math.floor(Math.random() * 6)
      const dmgId  = ++dmgIdCounter

      const updated = withCard(prev, idx, s => ({
        ...s,
        currentHp:    Math.max(0, s.currentHp - dmg),
        visualState:  'hit' as VisualState,
        damageNumbers: [...s.damageNumbers, { id: dmgId, value: dmg, type: 'damage' as const }],
      }))

      scheduleCleanup(() => {
        setCards(p => clearVisualState(p, idx))
      }, 320)

      scheduleCleanup(() => {
        setCards(p => removeDamageNumber(p, idx, dmgId))
      }, 1200)

      return updated
    })
  }, [scheduleCleanup])

  const handleHitPlayer = useCallback(() => {
    setCards(prev => {
      const alivePlayer = prev
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.owner === 'player' && s.visualState !== 'dead')
      if (alivePlayer.length === 0) return prev

      const { i: idx } = alivePlayer[Math.floor(Math.random() * alivePlayer.length)]
      const dmg   = 4 + Math.floor(Math.random() * 6)
      const dmgId = ++dmgIdCounter

      const updated = withCard(prev, idx, s => ({
        ...s,
        currentHp:    Math.max(0, s.currentHp - dmg),
        visualState:  'hit' as VisualState,
        damageNumbers: [...s.damageNumbers, { id: dmgId, value: dmg, type: 'damage' as const }],
      }))

      scheduleCleanup(() => {
        setCards(p => clearVisualState(p, idx))
      }, 320)
      scheduleCleanup(() => {
        setCards(p => removeDamageNumber(p, idx, dmgId))
      }, 1200)

      return updated
    })
  }, [scheduleCleanup])

  const handleKill = useCallback(() => {
    setCards(prev => {
      const alive = prev
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.visualState !== 'dead')
      if (alive.length === 0) return prev

      const { i: idx } = alive[Math.floor(Math.random() * alive.length)]
      return withCard(prev, idx, s => ({
        ...s,
        currentHp:   0,
        visualState: 'dead' as VisualState,
      }))
    })
  }, [])

  const handleApplySnow = useCallback(() => {
    setCards(prev => {
      const targets = prev
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.visualState !== 'dead')
      if (targets.length === 0) return prev

      const { i: idx } = targets[Math.floor(Math.random() * targets.length)]
      const snowAmt = 1 + Math.floor(Math.random() * 3)
      const dmgId   = ++dmgIdCounter

      const updated = withCard(prev, idx, s => ({
        ...s,
        statuses:     { ...s.statuses, snow: s.statuses.snow + snowAmt },
        damageNumbers: [...s.damageNumbers, { id: dmgId, value: snowAmt, type: 'snow' as const }],
      }))

      scheduleCleanup(() => {
        setCards(p => removeDamageNumber(p, idx, dmgId))
      }, 1200)

      return updated
    })
  }, [scheduleCleanup])

  const handleHeal = useCallback(() => {
    setCards(prev => {
      const targets = prev
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.visualState !== 'dead')
      if (targets.length === 0) return prev

      const { i: idx } = targets[Math.floor(Math.random() * targets.length)]
      const healAmt = 2 + Math.floor(Math.random() * 4)
      const card    = prev[idx].card
      const maxHp   = isCompanion(card) ? card.maxHp : (card as BattleClunkerCard).maxScrap
      const dmgId   = ++dmgIdCounter

      const updated = withCard(prev, idx, s => ({
        ...s,
        currentHp:    Math.min(maxHp, s.currentHp + healAmt),
        visualState:  'healed' as VisualState,
        damageNumbers: [...s.damageNumbers, { id: dmgId, value: healAmt, type: 'heal' as const }],
      }))

      scheduleCleanup(() => {
        setCards(p => clearVisualState(p, idx))
      }, 320)
      scheduleCleanup(() => {
        setCards(p => removeDamageNumber(p, idx, dmgId))
      }, 1200)

      return updated
    })
  }, [scheduleCleanup])

  const handleReset = useCallback(() => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
    setCards(buildInitialState())
  }, [])

  // ─── Board layout ─────────────────────────────────────────────────

  const playerCards = cards.slice(0, PLAYER_CARDS.length)
  const enemyCards  = cards.slice(PLAYER_CARDS.length)

  const PLAYER_SLOTS = 4
  const ENEMY_SLOTS  = 6
  const HAND_ROTATIONS = [-10, -5, 0, 5, 10]
  const HAND_TRANSLATES = [6, 2, 0, 2, 6]

  return (
    <div className={styles.showcase}>

      {/* Demo control bar */}
      <div className={styles.controlBar}>
        <span className={styles.controlLabel}>Demo:</span>
        <button className={`${styles.controlBtn} ${styles.controlBtnHit}`}   onClick={handleHit}>⚔ Hit Enemy</button>
        <button className={`${styles.controlBtn} ${styles.controlBtnHit}`}   onClick={handleHitPlayer}>⚔ Hit Player</button>
        <button className={`${styles.controlBtn} ${styles.controlBtnKill}`}  onClick={handleKill}>💀 Kill Card</button>
        <button className={`${styles.controlBtn} ${styles.controlBtnSnow}`}  onClick={handleApplySnow}>❄ Apply Snow</button>
        <button className={`${styles.controlBtn} ${styles.controlBtnHeal}`}  onClick={handleHeal}>💚 Heal Card</button>
        <div className={styles.controlSep} />
        <button className={`${styles.controlBtn} ${styles.controlBtnReset}`} onClick={handleReset}>↺ Reset</button>
      </div>

      {/* Battle screen */}
      <div className={styles.battleBody}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <span className={styles.runIndicator}>Akt I · Walka 3/5</span>
          <div className={styles.hpBar}>
            <span className={styles.hpIcon}>❤</span>
            <span className={styles.hpNum}>42/60</span>
            <div className={styles.hpTrack}>
              <div className={`${styles.hpFill} ${styles.hpYellow}`} style={{ width: '70%' }} />
            </div>
          </div>
          <div className={styles.energyDisplay}>
            {[0, 1, 2].map(i => (
              <span key={i} className={`${styles.crystal} ${i < 2 ? styles.energyActive : styles.energySpent}`}>◆</span>
            ))}
          </div>
          <div className={styles.goldDisplay}>
            <span className={styles.goldCoin}>⬡</span>
            <span className={styles.goldNum}>87</span>
          </div>
          <button className={styles.endTurnBtn}>Koniec Tury</button>
        </div>

        {/* Arena */}
        <div className={styles.arena}>
          {/* Player board */}
          <div className={styles.boardWrap}>
            <div className={styles.boardLabel}>Gracz</div>
            <div className={`${styles.boardGrid} ${styles.boardGridPlayer}`}>
              {Array.from({ length: PLAYER_SLOTS }, (_, i) => {
                const cardState = playerCards[i]
                return (
                  <div
                    key={i}
                    className={`${styles.cell} ${styles.cellPlayer} ${cardState ? styles.cellOccupied : ''}`}
                  >
                    {cardState && <BoardCard state={cardState} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* VS divider */}
          <div className={styles.vsDivider}>
            <span className={styles.vsLabel}>VS</span>
          </div>

          {/* Enemy board */}
          <div className={styles.boardWrap}>
            <div className={styles.boardLabel}>Wrogowie</div>
            <div className={`${styles.boardGrid} ${styles.boardGridEnemy}`}>
              {Array.from({ length: ENEMY_SLOTS }, (_, i) => {
                const cardState = enemyCards[i]
                return (
                  <div
                    key={i}
                    className={`${styles.cell} ${styles.cellEnemy} ${cardState ? styles.cellOccupied : ''}`}
                  >
                    {cardState && <BoardCard state={cardState} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Intent bar */}
        <div className={styles.intentBar}>
          <span className={styles.intentLabel}>Wróg planuje:</span>
          <span className={styles.intentItem}>⚔ 12</span>
          <span className={styles.intentSep}>|</span>
          <span className={styles.intentItem}>🛡 8</span>
        </div>

        {/* Hand */}
        <div className={styles.handArea}>
          <div className={styles.handFan}>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={styles.handCard}
                style={{
                  transform: `rotate(${HAND_ROTATIONS[i]}deg) translateY(${HAND_TRANSLATES[i]}px)`,
                }}
              >
                <span className={styles.handCardNum}>{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <div className={styles.pileWidget}>
            <span className={styles.pileIcon}>🂠</span>
            <span className={styles.pileCount}>18</span>
            <span className={styles.pileLabel}>Dobierz</span>
          </div>
          <div className={`${styles.pileWidget} ${styles.pileCenter}`}>
            <span className={styles.pileIcon}>✦</span>
            <span className={styles.pileCount}>2</span>
            <span className={styles.pileLabel}>Wyczerpane</span>
          </div>
          <div className={styles.pileWidget}>
            <span className={styles.pileIcon}>🂡</span>
            <span className={styles.pileCount}>5</span>
            <span className={styles.pileLabel}>Odrzucone</span>
          </div>
        </div>
      </div>
    </div>
  )
}
