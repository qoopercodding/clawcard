import { useState, useRef } from 'react'
import {
  CardType, isCompanion, isItem, isClunker, isPower, isCurse,
  type AnyBattleCard, type BattleCompanionCard, type BattleItemCard,
  type BattleClunkerCard, type BattlePowerCard, type BattleCurseCard,
} from '../types/cards'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import styles from './Epic1Showcase.module.css'

// ─── Badge config ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CardType, { label: string; color: string; bg: string }> = {
  [CardType.Companion]: { label: 'Companion', color: '#fbbf24', bg: '#2a1e00' },
  [CardType.Item]:      { label: 'Item',      color: '#60a5fa', bg: '#001a2a' },
  [CardType.Clunker]:   { label: 'Clunker',   color: '#fb923c', bg: '#2a0e00' },
  [CardType.Power]:     { label: 'Power',     color: '#a78bfa', bg: '#1a0d2a' },
  [CardType.Curse]:     { label: 'Curse',     color: '#f87171', bg: '#2a0000' },
  [CardType.Charm]:     { label: 'Charm',     color: '#34d399', bg: '#002a1a' },
}

// ─── Tooltip content ─────────────────────────────────────────────────────────

function TooltipContent({ card }: { card: AnyBattleCard }) {
  const cfg = TYPE_CONFIG[card.cardType]
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{card.name}</span>
        <span className={styles.tooltipBadge} style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.label}
        </span>
      </div>
      <div className={styles.tooltipFields}>
        {isCompanion(card) && <CompanionTooltipFields card={card} />}
        {isItem(card)      && <ItemTooltipFields card={card} />}
        {isClunker(card)   && <ClunkerTooltipFields card={card} />}
        {isPower(card)     && <PowerTooltipFields card={card} />}
        {isCurse(card)     && <CurseTooltipFields card={card} />}
      </div>
      <div className={styles.tooltipDesc}>{card.description}</div>
      <div className={styles.tooltipMeta}>
        <span>Rarity: <strong>{card.rarity}</strong></span>
        <span>Faction: <strong>{card.faction.replace('_', ' ')}</strong></span>
        <span>Source: <strong>{card.source}</strong></span>
      </div>
    </div>
  )
}

function CompanionTooltipFields({ card }: { card: BattleCompanionCard }) {
  return (
    <>
      <TooltipField label="HP" value={`${card.hp} / ${card.maxHp}`} />
      <TooltipField label="ATK" value={card.attack} />
      <TooltipField label="Counter" value={card.counter} />
      {card.abilities.length > 0 && (
        <TooltipField label="Abilities" value={card.abilities.map(a => a.label).join(', ')} />
      )}
    </>
  )
}

function ItemTooltipFields({ card }: { card: BattleItemCard }) {
  return (
    <>
      <TooltipField label="Energy Cost" value={card.energyCost} />
      <TooltipField label="Target" value={card.targets} />
      <TooltipField label="Consume" value={card.isConsume ? 'Yes' : 'No'} />
      {card.effect.damage  && <TooltipField label="Damage" value={card.effect.damage} />}
      {card.effect.heal    && <TooltipField label="Heal"   value={card.effect.heal}   />}
      {card.effect.snow    && <TooltipField label="Snow"   value={card.effect.snow}   />}
      {card.effect.shield  && <TooltipField label="Shield" value={card.effect.shield} />}
    </>
  )
}

function ClunkerTooltipFields({ card }: { card: BattleClunkerCard }) {
  return (
    <>
      <TooltipField label="Scrap" value={`${card.scrap} / ${card.maxScrap}`} />
      <TooltipField label="ATK" value={card.attack} />
      <TooltipField label="Counter" value={card.counter} />
      {card.abilities.length > 0 && (
        <TooltipField label="Abilities" value={card.abilities.map(a => a.label).join(', ')} />
      )}
    </>
  )
}

function PowerTooltipFields({ card }: { card: BattlePowerCard }) {
  return (
    <>
      <TooltipField label="Energy Cost" value={card.energyCost} />
      <TooltipField label="Effect" value={card.permanentEffect} />
    </>
  )
}

function CurseTooltipFields({ card }: { card: BattleCurseCard }) {
  return (
    <>
      <TooltipField label="Penalty" value={card.penalty} />
      <TooltipField label="Removable" value={card.removable ? 'Yes' : 'No'} />
    </>
  )
}

function TooltipField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.tooltipField}>
      <span className={styles.tooltipFieldLabel}>{label}</span>
      <span className={styles.tooltipFieldValue}>{value}</span>
    </div>
  )
}

// ─── Card tile ────────────────────────────────────────────────────────────────

function CardTile({ card }: { card: AnyBattleCard }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const tileRef = useRef<HTMLDivElement>(null)
  const cfg = TYPE_CONFIG[card.cardType]

  const handleMouseEnter = () => {
    if (tileRef.current) {
      const rect = tileRef.current.getBoundingClientRect()
      const tooltipWidth = 220
      let left = rect.right + 8
      if (left + tooltipWidth > window.innerWidth) {
        left = rect.left - tooltipWidth - 8
      }
      setTooltipPos({ top: rect.top, left })
    }
    setShowTooltip(true)
  }

  return (
    <div
      ref={tileRef}
      className={styles.cardTile}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={styles.cardArt}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.name} className={styles.cardImg} />
          : <span className={styles.cardEmoji}>{card.imageFallback}</span>
        }
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{card.name}</div>
        <span
          className={styles.typeBadge}
          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + '44' }}
        >
          {cfg.label}
        </span>
        <div className={styles.cardStats}>
          {isCompanion(card) && (
            <>
              <span className={styles.statHp}>❤ {card.hp}</span>
              <span className={styles.statAtk}>⚔ {card.attack}</span>
              <span className={styles.statCnt}>⏱ {card.counter}</span>
            </>
          )}
          {isItem(card) && (
            <>
              <span className={styles.statEnergy}>💎 {card.energyCost}</span>
              {card.effect.damage && <span className={styles.statAtk}>⚔ {card.effect.damage}</span>}
              {card.effect.heal   && <span className={styles.statHp}>+ {card.effect.heal}</span>}
              {card.effect.snow   && <span className={styles.statCnt}>❄ {card.effect.snow}</span>}
            </>
          )}
          {isClunker(card) && (
            <>
              <span className={styles.statClunker}>⚙ {card.scrap}</span>
              {card.attack > 0 && <span className={styles.statAtk}>⚔ {card.attack}</span>}
              <span className={styles.statCnt}>⏱ {card.counter}</span>
            </>
          )}
          {isPower(card) && (
            <span className={styles.statEnergy}>💎 {card.energyCost}</span>
          )}
          {isCurse(card) && (
            <span className={styles.statCurse}>☠ Curse</span>
          )}
        </div>
      </div>
      {showTooltip && (
        <div
          className={styles.tooltipPortal}
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <TooltipContent card={card} />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const ALL_TYPES = [CardType.Companion, CardType.Item, CardType.Clunker, CardType.Power, CardType.Curse]

export function Epic1Showcase() {
  const [activeFilters, setActiveFilters] = useState<Set<CardType>>(new Set(ALL_TYPES))

  const toggleFilter = (type: CardType) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const filtered = SHOWCASE_CARDS.filter(c => activeFilters.has(c.cardType))

  // Count per type
  const counts = ALL_TYPES.reduce<Record<CardType, number>>((acc, t) => {
    acc[t] = SHOWCASE_CARDS.filter(c => c.cardType === t).length
    return acc
  }, {} as Record<CardType, number>)

  return (
    <div className={styles.showcase}>
      {/* Left panel */}
      <aside className={styles.panel}>
        <h3 className={styles.panelTitle}>Typy kart</h3>
        <div className={styles.counters}>
          {ALL_TYPES.map(type => {
            const cfg = TYPE_CONFIG[type]
            const active = activeFilters.has(type)
            return (
              <button
                key={type}
                className={`${styles.filterBtn} ${active ? styles.filterBtnActive : ''}`}
                style={active ? { borderColor: cfg.color, color: cfg.color } : undefined}
                onClick={() => toggleFilter(type)}
              >
                <span className={styles.filterDot} style={{ background: cfg.color }} />
                <span>{cfg.label}</span>
                <span className={styles.filterCount}>{counts[type]}</span>
              </button>
            )
          })}
        </div>
        <div className={styles.totalCount}>
          Showing: {filtered.length} / {SHOWCASE_CARDS.length}
        </div>
        <div className={styles.legend}>
          <h4 className={styles.legendTitle}>Legenda pól</h4>
          <div className={styles.legendItem}><span>❤</span> HP</div>
          <div className={styles.legendItem}><span>⚔</span> Atak</div>
          <div className={styles.legendItem}><span>⏱</span> Counter</div>
          <div className={styles.legendItem}><span>💎</span> Energia</div>
          <div className={styles.legendItem}><span>⚙</span> Scrap (Clunker)</div>
        </div>
      </aside>

      {/* Grid */}
      <div className={styles.gridArea}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>Epic 1 — Taksonomia Kart</h2>
          <p className={styles.gridSubtitle}>
            Hover na kartę aby zobaczyć pola interfejsu. Filtry po lewej.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {filtered.map(card => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  )
}
