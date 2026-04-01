import { useState, useRef, useMemo } from 'react'
import {
  CardType, isCompanion, isItem, isClunker, isPower, isCurse,
  type AnyBattleCard,
} from '../types/cards'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import { analyzeAll, type AnalysisResult, type ReadinessStatus } from '../systems/CardAnalyzer'
import styles from './Epic2Showcase.module.css'

// ─── Static config ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CardType, { label: string; color: string }> = {
  [CardType.Companion]: { label: 'Companion', color: '#fbbf24' },
  [CardType.Item]:      { label: 'Item',      color: '#60a5fa' },
  [CardType.Clunker]:   { label: 'Clunker',   color: '#fb923c' },
  [CardType.Power]:     { label: 'Power',     color: '#a78bfa' },
  [CardType.Curse]:     { label: 'Curse',     color: '#f87171' },
  [CardType.Charm]:     { label: 'Charm',     color: '#34d399' },
}

const STATUS_CONFIG: Record<ReadinessStatus, { label: string; icon: string; color: string; bg: string }> = {
  ready:   { label: 'Ready',   icon: '✓', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  partial: { label: 'Partial', icon: '⚠', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  missing: { label: 'Missing', icon: '✗', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

// Pre-compute analysis report once
const REPORT = analyzeAll(SHOWCASE_CARDS)
const RESULT_BY_ID = new Map<string, AnalysisResult>(
  REPORT.results.map(r => [r.cardId, r])
)

// ─── Card tile ────────────────────────────────────────────────────────────────

function CardTile({ card, result }: { card: AnyBattleCard; result: AnalysisResult }) {
  const [show, setShow] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const typeCfg   = TYPE_CONFIG[card.cardType]
  const statusCfg = STATUS_CONFIG[result.status]

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const tw = 240
      let left = rect.right + 8
      if (left + tw > window.innerWidth) left = rect.left - tw - 8
      setPos({ top: rect.top, left })
    }
    setShow(true)
  }

  return (
    <div
      ref={ref}
      className={styles.cardTile}
      data-status={result.status}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      {/* Art */}
      <div className={styles.cardArt}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.name} className={styles.cardImg} />
          : <span className={styles.cardEmoji}>{card.imageFallback}</span>
        }
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{card.name}</div>
        <div className={styles.badgeRow}>
          <span className={styles.typeBadge} style={{ color: typeCfg.color }}>
            {typeCfg.label}
          </span>
          <span
            className={styles.statusBadge}
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.icon} {statusCfg.label}
          </span>
        </div>

        {/* Quick stats */}
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
            </>
          )}
          {isClunker(card) && (
            <>
              <span className={styles.statClunker}>⚙ {card.scrap}</span>
              <span className={styles.statCnt}>⏱ {card.counter}</span>
            </>
          )}
          {isPower(card) && <span className={styles.statEnergy}>💎 {card.energyCost}</span>}
          {isCurse(card) && <span className={styles.statCurse}>☠</span>}
        </div>
      </div>

      {/* Tooltip */}
      {show && (
        <div className={styles.tooltipPortal} style={{ top: pos.top, left: pos.left }}>
          <div className={styles.tooltip}>
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipName}>{card.name}</span>
              <span className={styles.tooltipStatusBadge} style={{ color: statusCfg.color, background: statusCfg.bg }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
            </div>
            <p className={styles.tooltipDesc}>{card.description}</p>

            {result.implementedMechanics.length > 0 && (
              <div className={styles.tooltipSection}>
                <span className={styles.tooltipSectionLabel} style={{ color: '#4ade80' }}>
                  Implemented:
                </span>
                <span className={styles.tooltipSectionValue}>
                  {result.implementedMechanics.map(m => m.label).join(', ')}
                </span>
              </div>
            )}
            {result.missingMechanics.length > 0 && (
              <div className={styles.tooltipSection}>
                <span className={styles.tooltipSectionLabel} style={{ color: '#f87171' }}>
                  Missing:
                </span>
                <span className={styles.tooltipSectionValue}>
                  {result.missingMechanics.map(m => m.label).join(', ')}
                </span>
              </div>
            )}
            {result.parsedMechanics.length === 0 && (
              <div className={styles.tooltipSection}>
                <span className={styles.tooltipSectionLabel} style={{ color: '#9a8a70' }}>
                  No special mechanics detected
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bar chart row ────────────────────────────────────────────────────────────

function MechanicBar({
  mechanicId, label, cardCount, isImplemented, maxCount, active, onClick,
}: {
  mechanicId: string
  label: string
  cardCount: number
  isImplemented: boolean
  maxCount: number
  active: boolean
  onClick: () => void
}) {
  const pct = Math.round((cardCount / maxCount) * 100)
  const color = isImplemented ? '#4ade80' : '#f87171'

  return (
    <button
      className={`${styles.barRow} ${active ? styles.barRowActive : ''}`}
      onClick={onClick}
      title={`Filter: ${label}`}
      data-mechanic={mechanicId}
    >
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={styles.barCount} style={{ color }}>{cardCount}</span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type StatusFilter = ReadinessStatus | 'all'

export function Epic2Showcase() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [mechanicFilter, setMechanicFilter] = useState<string | null>(null)

  const filteredCards = useMemo(() => {
    return SHOWCASE_CARDS.filter(card => {
      const result = RESULT_BY_ID.get(card.id)!
      if (statusFilter !== 'all' && result.status !== statusFilter) return false
      if (mechanicFilter) {
        return result.parsedMechanics.some(p => p.mechanicId === mechanicFilter)
      }
      return true
    })
  }, [statusFilter, mechanicFilter])

  const maxCount = REPORT.mechanicFrequency[0]?.cardCount ?? 1

  const toggleMechanic = (id: string) => {
    setMechanicFilter(prev => prev === id ? null : id)
  }

  return (
    <div className={styles.showcase}>
      {/* Left panel — status filters */}
      <aside className={styles.leftPanel}>
        <h3 className={styles.panelTitle}>Status kart</h3>
        <div className={styles.statusFilters}>
          {(['all', 'ready', 'partial', 'missing'] as const).map(s => {
            const count = s === 'all'
              ? SHOWCASE_CARDS.length
              : REPORT.results.filter(r => r.status === s).length
            const cfg = s === 'all'
              ? { label: 'Wszystkie', color: '#e8d5b0' }
              : STATUS_CONFIG[s]
            return (
              <button
                key={s}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ''}`}
                style={statusFilter === s ? { borderColor: cfg.color, color: cfg.color } : undefined}
                onClick={() => { setStatusFilter(s); setMechanicFilter(null) }}
              >
                <span className={styles.filterDot} style={{ background: cfg.color }} />
                <span>{cfg.label}</span>
                <span className={styles.filterCount}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className={styles.divider} />
        <div className={styles.totalCount}>
          Showing: {filteredCards.length} / {SHOWCASE_CARDS.length}
        </div>

        <div className={styles.legend}>
          <h4 className={styles.legendTitle}>Legenda statusów</h4>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className={styles.legendItem}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Center — card grid */}
      <div className={styles.gridArea}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>Epic 2 — Engine Analizy Kart</h2>
          <p className={styles.gridSubtitle}>
            Hover na kartę → lista mechanik. Kliknij słupek w panelu prawym → filtruj karty.
            {mechanicFilter && (
              <button className={styles.clearFilter} onClick={() => setMechanicFilter(null)}>
                ✕ wyczyść filtr mechaniki
              </button>
            )}
          </p>
        </div>
        <div className={styles.cardGrid}>
          {filteredCards.map(card => (
            <CardTile
              key={card.id}
              card={card}
              result={RESULT_BY_ID.get(card.id)!}
            />
          ))}
          {filteredCards.length === 0 && (
            <div className={styles.emptyGrid}>Brak kart spełniających filtry.</div>
          )}
        </div>
      </div>

      {/* Right panel — mechanics report */}
      <aside className={styles.rightPanel}>
        <h3 className={styles.panelTitle}>Mechanics Report</h3>
        <div className={styles.reportSummary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Ready</span>
            <span className={styles.summaryValue} style={{ color: '#4ade80' }}>{REPORT.readyCount}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Partial</span>
            <span className={styles.summaryValue} style={{ color: '#fbbf24' }}>{REPORT.partialCount}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Missing</span>
            <span className={styles.summaryValue} style={{ color: '#f87171' }}>{REPORT.missingCount}</span>
          </div>
        </div>

        <div className={styles.divider} />
        <h4 className={styles.chartTitle}>Potrzebne mechaniki</h4>
        <p className={styles.chartHint}>Kliknij słupek aby filtrować karty</p>
        <div className={styles.barChart}>
          {REPORT.mechanicFrequency.map(({ mechanicId, label, cardCount, isImplemented }) => (
            <MechanicBar
              key={mechanicId}
              mechanicId={mechanicId}
              label={label}
              cardCount={cardCount}
              isImplemented={isImplemented}
              maxCount={maxCount}
              active={mechanicFilter === mechanicId}
              onClick={() => toggleMechanic(mechanicId)}
            />
          ))}
          {REPORT.mechanicFrequency.length === 0 && (
            <p className={styles.noMechanics}>Brak mechanik do wyświetlenia.</p>
          )}
        </div>

        <div className={styles.divider} />
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <span style={{ color: '#4ade80' }}>■</span> Zaimplementowane
          </div>
          <div className={styles.legendItem}>
            <span style={{ color: '#f87171' }}>■</span> Brakujące
          </div>
        </div>
      </aside>
    </div>
  )
}
