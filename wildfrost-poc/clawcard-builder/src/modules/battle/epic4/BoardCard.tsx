// BoardCard.tsx — Epic 4: Karty na boardzie

import { isCompanion } from '../types/cards'
import type { BattleCompanionCard, BattleClunkerCard } from '../types/cards'
import styles from './BoardCard.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusEffects {
  snow:     number
  poison:   number
  strength: number
  shell:    number
  overburn: number
  vim:      number
}

export type VisualState = 'normal' | 'attacking' | 'hit' | 'healed' | 'dead' | 'selected'

export interface DamageNumberData {
  id: number
  value: number
  type: 'damage' | 'crit' | 'heal' | 'snow'
}

export interface BoardCardState {
  card:           BattleCompanionCard | BattleClunkerCard
  owner:          'player' | 'enemy'
  currentHp:      number
  currentCounter: number
  statuses:       StatusEffects
  visualState:    VisualState
  damageNumbers:  DamageNumberData[]
}

export function createBoardCardState(
  card: BattleCompanionCard | BattleClunkerCard,
  owner: 'player' | 'enemy',
): BoardCardState {
  return {
    card,
    owner,
    currentHp:      isCompanion(card) ? card.hp      : card.scrap,
    currentCounter: card.counter,
    statuses:       { snow: 0, poison: 0, strength: 0, shell: 0, overburn: 0, vim: 0 },
    visualState:    'normal',
    damageNumbers:  [],
  }
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  snow:     { icon: '❄', label: 'Snow',     desc: 'Frozen — reduces counter',   cls: styles.statusSnow     },
  poison:   { icon: '☠', label: 'Poison',   desc: 'Takes damage each turn',     cls: styles.statusPoison   },
  strength: { icon: '💪', label: 'Strength', desc: 'Bonus attack damage',        cls: styles.statusStrength },
  shell:    { icon: '🛡', label: 'Shell',    desc: 'Absorbs incoming damage',    cls: styles.statusShell    },
  overburn: { icon: '🔥', label: 'Overburn', desc: 'Burns away each turn',       cls: styles.statusOverburn },
  vim:      { icon: '💫', label: 'Vim',      desc: 'Extra energy on trigger',    cls: styles.statusVim      },
} as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function Counter({ value }: { value: number }) {
  const cls =
    value === 0 ? styles.counterZero :
    value === 1 ? styles.counterWarning :
                  styles.counterNormal
  return (
    <div className={`${styles.counter} ${cls}`}>
      {value}
    </div>
  )
}

function HPBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const fillCls =
    pct > 50 ? styles.hpFull :
    pct > 25 ? styles.hpHalf :
               styles.hpCritical
  return (
    <div className={styles.hpBarTrack}>
      <div className={`${styles.hpBarFill} ${fillCls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function HPDisplay({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const numCls =
    pct > 50 ? styles.hpNumFull :
    pct > 25 ? styles.hpNumHalf :
               styles.hpNumCritical
  return (
    <div className={styles.hpStat}>
      <span className={styles.hpIcon}>❤</span>
      <span className={`${styles.hpNum} ${numCls}`}>{current}/{max}</span>
    </div>
  )
}

function ScrapDisplay({ current, max }: { current: number; max: number }) {
  return (
    <div className={styles.scrapStat}>
      <span className={styles.scrapIcon}>⚙</span>
      <span className={styles.scrapNum}>{current}/{max}</span>
    </div>
  )
}

function AtkDisplay({ value }: { value: number }) {
  return (
    <div className={styles.atkStat}>
      <span className={styles.atkIcon}>⚔</span>
      <span className={styles.atkNum}>{value}</span>
    </div>
  )
}

function StatusRow({ statuses }: { statuses: StatusEffects }) {
  const active = (Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>)
    .filter(k => statuses[k] > 0)

  if (active.length === 0) return <div className={styles.statusRow} />

  return (
    <div className={styles.statusRow}>
      {active.map(key => {
        const cfg = STATUS_CONFIG[key]
        return (
          <div key={key} className={`${styles.statusBubble} ${cfg.cls}`}>
            <span className={styles.statusIcon}>{cfg.icon}</span>
            <span className={styles.statusNum}>{statuses[key]}</span>
            <div className={styles.statusTooltip}>{cfg.label}: {cfg.desc}</div>
          </div>
        )
      })}
    </div>
  )
}

function DamageNumberLayer({ numbers }: { numbers: DamageNumberData[] }) {
  if (numbers.length === 0) return null
  return (
    <div className={styles.damageNumbersLayer}>
      {numbers.map(n => {
        const colorCls =
          n.type === 'heal' ? styles.damageNumberHeal :
          n.type === 'snow' ? styles.damageNumberSnow :
          n.type === 'crit' ? styles.damageNumberCrit :
                              styles.damageNumberDamage
        const prefix = n.type === 'heal' ? '+' : n.value < 0 ? '' : '-'
        return (
          <div
            key={n.id}
            className={`${styles.damageNumber} ${colorCls}`}
          >
            {prefix}{Math.abs(n.value)}
          </div>
        )
      })}
    </div>
  )
}

// ─── BoardCard ────────────────────────────────────────────────────────────────

export function BoardCard({ state }: { state: BoardCardState }) {
  const { card, owner, currentHp, currentCounter, statuses, visualState, damageNumbers } = state

  const companion = isCompanion(card) ? card : null
  const clunker   = !companion ? (card as BattleClunkerCard) : null
  const maxHp     = companion ? companion.maxHp : clunker!.maxScrap

  const ownerCls  = owner === 'player' ? styles.boardCardPlayer : styles.boardCardEnemy
  const stateCls  =
    visualState === 'attacking' ? (owner === 'player' ? styles.boardCardAttacking : `${styles.boardCardAttacking} ${styles.boardCardEnemy}`) :
    visualState === 'hit'       ? styles.boardCardHit     :
    visualState === 'healed'    ? styles.boardCardHealed  :
    visualState === 'dead'      ? styles.boardCardDead    :
    visualState === 'selected'  ? styles.boardCardSelected :
    ''

  return (
    <div className={`${styles.boardCard} ${ownerCls} ${stateCls}`}>
      <Counter value={currentCounter} />

      {/* Art */}
      <div className={styles.artArea}>
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={styles.artImage}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement!
              const fallback = document.createElement('span')
              fallback.className = styles.artEmoji
              fallback.textContent = card.imageFallback
              parent.appendChild(fallback)
            }}
          />
        ) : (
          <span className={styles.artEmoji}>{card.imageFallback}</span>
        )}
      </div>

      {/* Name */}
      <div className={styles.nameBanner}>
        <span className={styles.nameText}>{card.name}</span>
      </div>

      {/* HP bar */}
      {companion && <HPBar current={currentHp} max={maxHp} />}

      {/* Stats row */}
      <div className={styles.statsRow}>
        {companion  && <HPDisplay    current={currentHp} max={maxHp} />}
        {clunker    && <ScrapDisplay current={currentHp} max={maxHp} />}
        <AtkDisplay value={card.attack} />
      </div>

      {/* Status effects */}
      <StatusRow statuses={statuses} />

      {/* Damage numbers overlay */}
      <DamageNumberLayer numbers={damageNumbers} />
    </div>
  )
}
