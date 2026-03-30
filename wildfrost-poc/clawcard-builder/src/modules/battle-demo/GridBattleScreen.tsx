// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  initGridBattle, gridPlayCard, gridDrawCard, gridEndTurn,
  ENEMY_WAVES, GRID_COLS, GRID_ROWS, GRID_SLOTS,
  slotToRowCol,
} from './gridBattleEngine'
import type { GridBattleState } from './gridBattleEngine'
import type { BattleCard, HandCard, LogType } from './battleEngine'
import './GridBattleScreen.css'

const LOG_COLORS: Record<LogType, string> = {
  attack: '#f87171', damage: '#fbbf24', heal: '#86efac', snow: '#67e8f9',
  shield: '#60a5fa', death: '#f87171', draw: '#a78bfa', counter: '#6b7280',
  system: '#fbbf24', frenzy: '#f97316', teeth: '#facc15', poison: '#4ade80',
}

export function GridBattleScreen() {
  const [waveIdx, setWaveIdx] = useState(0)
  const [state, setState] = useState<GridBattleState>(() => initGridBattle(0))
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [animSlot, setAnimSlot] = useState<{ side: 'player' | 'enemy'; slot: number } | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0
  }, [state.log.length])

  const selectedHandCard = state.hand.find(c => c.id === selectedCard) ?? null
  const needsTarget = selectedHandCard && (
    (selectedHandCard.target === 'enemy' || selectedHandCard.target === 'all_enemies') ||
    (selectedHandCard.target === 'ally') ||
    (selectedHandCard.target === 'self')
  )

  function handleSelectHandCard(cardId: string) {
    if (state.phase !== 'play' || state.energy < 1) return
    setSelectedCard(prev => prev === cardId ? null : cardId)
  }

  function handleClickSlot(side: 'player' | 'enemy', slot: number) {
    if (!selectedCard || state.phase !== 'play') return
    const card = state.hand.find(c => c.id === selectedCard)
    if (!card) return

    // Validate target
    if (card.target === 'enemy' && side !== 'enemy') return
    if (card.target === 'ally' && side !== 'player') return
    if (card.target === 'self' && side !== 'player') return

    // Animate
    setAnimSlot({ side, slot })
    setTimeout(() => setAnimSlot(null), 400)

    setState(prev => gridPlayCard(prev, selectedCard!, slot))
    setSelectedCard(null)
  }

  function handleDraw() {
    setState(prev => gridDrawCard(prev))
  }

  function handleEndTurn() {
    setState(prev => gridEndTurn(prev))
  }

  function handleNextWave() {
    const next = (waveIdx + 1) % ENEMY_WAVES.length
    setWaveIdx(next)
    setState(initGridBattle(next))
    setSelectedCard(null)
  }

  function handleRestart() {
    setState(initGridBattle(waveIdx))
    setSelectedCard(null)
  }

  const isDone = state.phase === 'won' || state.phase === 'lost'
  const wave = ENEMY_WAVES[waveIdx % ENEMY_WAVES.length]

  return (
    <div className="grid-battle">
      {/* Header */}
      <header className="gb-header">
        <div className="gb-turn">Tura {state.turn}</div>
        <div className="gb-wave-name">{wave.emoji} {wave.name}</div>
        <div className="gb-energy">
          {Array.from({ length: state.maxEnergy }, (_, i) => (
            <span key={i} className={`gb-energy-orb ${i < state.energy ? 'gb-energy-orb--full' : ''}`} />
          ))}
        </div>
        <div className="gb-wave-dots">
          {ENEMY_WAVES.map((w, i) => (
            <span key={w.name} className={`gb-wave-dot ${i === waveIdx ? 'active' : i < waveIdx ? 'done' : ''}`}>
              {i < waveIdx ? '✓' : w.emoji}
            </span>
          ))}
        </div>
      </header>

      <div className="gb-main">
        {/* Arena: Player 3x2 | VS | Enemy 3x2 */}
        <div className="gb-arena">
          <div className="gb-side gb-side--player">
            <div className="gb-side-label">GRACZ</div>
            <div className="gb-grid">
              {Array.from({ length: GRID_SLOTS }, (_, slot) => (
                <GridSlot
                  key={`p${slot}`}
                  card={state.playerGrid[slot]}
                  slot={slot}
                  side="player"
                  isTarget={!!selectedCard && selectedHandCard?.target === 'ally'}
                  isAnimating={animSlot?.side === 'player' && animSlot?.slot === slot}
                  onClick={() => handleClickSlot('player', slot)}
                />
              ))}
            </div>
          </div>

          <div className="gb-vs">VS</div>

          <div className="gb-side gb-side--enemy">
            <div className="gb-side-label">WRÓG</div>
            <div className="gb-grid">
              {Array.from({ length: GRID_SLOTS }, (_, slot) => (
                <GridSlot
                  key={`e${slot}`}
                  card={state.enemyGrid[slot]}
                  slot={slot}
                  side="enemy"
                  isTarget={!!selectedCard && (selectedHandCard?.target === 'enemy' || selectedHandCard?.target === 'all_enemies')}
                  isAnimating={animSlot?.side === 'enemy' && animSlot?.slot === slot}
                  onClick={() => handleClickSlot('enemy', slot)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="gb-log" ref={logRef}>
          {state.log.map(entry => (
            <div key={entry.id} className="gb-log-entry" style={{ color: LOG_COLORS[entry.type] ?? '#9ca3af' }}>
              {entry.text}
              {entry.value !== undefined && entry.value > 0 && (
                <span className="gb-log-val">
                  {entry.type === 'heal' ? `+${entry.value}` : `-${entry.value}`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Win/Lose overlay */}
      {isDone && (
        <div className={`gb-overlay ${state.phase === 'won' ? 'gb-overlay--won' : 'gb-overlay--lost'}`}>
          <div className="gb-overlay__icon">{state.phase === 'won' ? '🏆' : '💀'}</div>
          <div className="gb-overlay__title">{state.phase === 'won' ? 'Zwycięstwo!' : 'Przegrana...'}</div>
          <div className="gb-overlay__actions">
            {state.phase === 'won' && waveIdx < ENEMY_WAVES.length - 1 && (
              <button className="gb-btn gb-btn--next" onClick={handleNextWave}>Następna fala →</button>
            )}
            <button className="gb-btn gb-btn--restart" onClick={handleRestart}>🔄 Restart</button>
          </div>
        </div>
      )}

      {/* Hand + actions */}
      <div className="gb-hand-area">
        {selectedCard && (
          <div className="gb-targeting-hint">
            Wybierz cel na {selectedHandCard?.target === 'ally' ? 'planszy gracza' : 'planszy wroga'}
            <button className="gb-cancel-btn" onClick={() => setSelectedCard(null)}>✕ Anuluj</button>
          </div>
        )}
        <div className="gb-hand">
          {state.hand.map(card => (
            <HandCardEl
              key={card.id}
              card={card}
              isSelected={selectedCard === card.id}
              disabled={isDone || state.energy < 1}
              onClick={() => handleSelectHandCard(card.id)}
            />
          ))}
          {state.hand.length === 0 && (
            <div className="gb-hand-empty">Ręka pusta — dobierz kartę</div>
          )}
        </div>
        <div className="gb-actions">
          <button className="gb-btn gb-btn--draw" onClick={handleDraw} disabled={isDone || (state.deck.length === 0 && state.discard.length === 0)}>
            📥 Dobierz <span className="gb-pile-count">{state.deck.length + state.discard.length}</span>
          </button>
          <button className="gb-btn gb-btn--endturn" onClick={handleEndTurn} disabled={isDone}>
            ⏩ Koniec tury
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GridSlot — pojedynczy slot na siatce
// ---------------------------------------------------------------------------

interface GridSlotProps {
  card: BattleCard | null
  slot: number
  side: 'player' | 'enemy'
  isTarget: boolean
  isAnimating: boolean
  onClick: () => void
}

function GridSlot({ card, slot, side, isTarget, isAnimating, onClick }: GridSlotProps) {
  const { row, col } = slotToRowCol(slot)
  const isFront = row === 0

  if (!card) {
    return (
      <div className={`gb-slot gb-slot--empty ${isTarget ? 'gb-slot--targetable' : ''}`} data-row={row} data-col={col}>
        <span className="gb-slot__label">{isFront ? 'F' : 'B'}{col + 1}</span>
      </div>
    )
  }

  const hpPct = Math.max(0, (card.hp / card.maxHp) * 100)
  const cntPct = (card.counter / card.maxCounter) * 100
  const isFrozen = card.snow > 0

  return (
    <div
      className={[
        'gb-slot gb-slot--filled',
        `gb-slot--${side}`,
        isFrozen ? 'gb-slot--frozen' : '',
        isTarget ? 'gb-slot--targetable' : '',
        isAnimating ? 'gb-slot--anim' : '',
        card.isLeader ? 'gb-slot--leader' : '',
        card.counter <= 1 ? 'gb-slot--ready' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      data-row={row}
      data-col={col}
    >
      {/* Status badges */}
      <div className="gb-slot__badges">
        {card.snow > 0 && <span className="gb-badge gb-badge--snow">❄{card.snow}</span>}
        {card.shield > 0 && <span className="gb-badge gb-badge--shield">🛡{card.shield}</span>}
        {card.teeth > 0 && <span className="gb-badge gb-badge--teeth">🦷{card.teeth}</span>}
        {card.poison > 0 && <span className="gb-badge gb-badge--poison">☠{card.poison}</span>}
      </div>

      <div className="gb-slot__emoji">{card.emoji}</div>
      <div className="gb-slot__name">{card.name}{card.isLeader ? ' 👑' : ''}</div>

      {/* HP bar */}
      <div className="gb-slot__hp-wrap">
        <div className="gb-slot__hp-bar" style={{
          width: `${hpPct}%`,
          background: hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444'
        }} />
      </div>

      {/* Stats */}
      <div className="gb-slot__stats">
        <span className="gb-stat gb-stat--atk">⚔{card.attack}</span>
        <div className={`gb-counter ${isFrozen ? 'gb-counter--frozen' : ''}`} style={{ '--pct': `${cntPct}%` } as React.CSSProperties}>
          {card.counter}
        </div>
        <span className="gb-stat gb-stat--hp">❤{card.hp}/{card.maxHp}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HandCardEl
// ---------------------------------------------------------------------------

interface HandCardElProps {
  card: HandCard
  isSelected: boolean
  disabled: boolean
  onClick: () => void
}

function HandCardEl({ card, isSelected, disabled, onClick }: HandCardElProps) {
  const effectStr = [
    card.effect.damage     ? `⚔${card.effect.damage}` : '',
    card.effect.snow       ? `❄${card.effect.snow}` : '',
    card.effect.heal       ? `💚+${card.effect.heal}` : '',
    card.effect.shield     ? `🛡+${card.effect.shield}` : '',
    card.effect.addTeeth   ? `🦷+${card.effect.addTeeth}` : '',
    card.effect.poison     ? `☠${card.effect.poison}` : '',
    card.effect.strength   ? `💪+${card.effect.strength}` : '',
    card.effect.weak       ? `😵${card.effect.weak}` : '',
    card.effect.vulnerable ? `🎯${card.effect.vulnerable}` : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={`gb-hand-card ${isSelected ? 'gb-hand-card--selected' : ''} ${disabled ? 'gb-hand-card--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="gb-hand-card__cost">1</div>
      <div className="gb-hand-card__emoji">{card.emoji}</div>
      <div className="gb-hand-card__name">{card.name}</div>
      <div className="gb-hand-card__effect">{effectStr}</div>
      <div className="gb-hand-card__target">→ {card.target}</div>
    </button>
  )
}
