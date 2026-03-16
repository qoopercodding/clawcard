import { useCallback, useEffect, useRef, useState } from 'react'
import { useDevInspector } from '../../components/debug/DevInspector'
import {
  initBattle, playCard, drawCard, endTurn,
  ENEMY_SETS,
} from './battleEngine'
import type { BattleState, BattleCard, HandCard, LogType } from './battleEngine'
import './BattleDemoScreen.css'

// =============================================================================
// BattleDemoScreen.tsx — Grywalne demo walki
// =============================================================================
//
// Pełna pętla walki:
//   Zagrywanie kart z ręki → ticker counterów → ataki → animacje HP
//   Snow, Shield, Teeth, Poison — wszystkie mechaniki działają
//   5 wrogów w kolejności (Snoof → Wallop → Foxee → Tusk → Dregg boss)
//
// Rozszerzanie:
//   - Wiele kart gracza: zmień playerCard: BattleCard na playerCells: BattleCard[]
//   - Nowa mechanika: dodaj w battleEngine.ts do tickCounters i applyDamage*
//   - Nowa karta: dodaj do STARTER_HAND lub EXTRA_DECK w battleEngine.ts
// =============================================================================

const LOG_COLORS: Record<LogType, string> = {
  attack:  '#f87171',
  damage:  '#fbbf24',
  heal:    '#86efac',
  snow:    '#67e8f9',
  shield:  '#60a5fa',
  death:   '#f87171',
  draw:    '#a78bfa',
  counter: '#6b7280',
  system:  '#fbbf24',
  frenzy:  '#f97316',
  teeth:   '#facc15',
  poison:  '#4ade80',
}

export function BattleDemoScreen() {
  const [enemyIdx, setEnemyIdx] = useState(0)
  const [state, setState] = useState<BattleState>(() => initBattle(0))
  const [animCard, setAnimCard] = useState<string | null>(null) // ID animowanej karty w ręce
  const [flashPlayer, setFlashPlayer] = useState<'hit' | 'heal' | null>(null)
  const [flashEnemy, setFlashEnemy] = useState<'hit' | 'frozen' | null>(null)
  const [prevPlayerHp, setPrevPlayerHp] = useState<number | null>(null)
  const [prevEnemyHp, setPrevEnemyHp] = useState<number | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const { inspect } = useDevInspector()

  // Scroll log do góry przy nowych wpisach
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0
  }, [state.log.length])

  // Wykryj zmiany HP → flash animacja
  useEffect(() => {
    const pH = state.playerCard?.hp ?? null
    const eH = state.enemyCard?.hp ?? null

    if (prevPlayerHp !== null && pH !== null && pH < prevPlayerHp) {
      setFlashPlayer('hit')
      setTimeout(() => setFlashPlayer(null), 500)
    }
    if (prevPlayerHp !== null && pH !== null && pH > prevPlayerHp) {
      setFlashPlayer('heal')
      setTimeout(() => setFlashPlayer(null), 500)
    }
    if (prevEnemyHp !== null && eH !== null && eH < prevEnemyHp) {
      setFlashEnemy('hit')
      setTimeout(() => setFlashEnemy(null), 500)
    }
    if (state.enemyCard?.snow && prevEnemyHp === eH) {
      setFlashEnemy('frozen')
      setTimeout(() => setFlashEnemy(null), 600)
    }

    setPrevPlayerHp(pH)
    setPrevEnemyHp(eH)
  }, [state.playerCard?.hp, state.enemyCard?.hp])

  function handlePlayCard(cardId: string) {
    if (state.phase !== 'play') return
    setAnimCard(cardId)
    setTimeout(() => {
      setAnimCard(null)
      setState(prev => playCard(prev, cardId))
    }, 300)
  }

  function handleDraw() {
    setState(prev => drawCard(prev))
  }

  function handleEndTurn() {
    setState(prev => endTurn(prev))
  }

  function handleNextEnemy() {
    const next = (enemyIdx + 1) % ENEMY_SETS.length
    setEnemyIdx(next)
    setState(initBattle(next))
    setPrevPlayerHp(null)
    setPrevEnemyHp(null)
  }

  function handleRestart() {
    setState(initBattle(enemyIdx))
    setPrevPlayerHp(null)
    setPrevEnemyHp(null)
  }

  const isWon  = state.phase === 'won'
  const isLost = state.phase === 'lost'
  const isDone = isWon || isLost

  return (
    <div className="battle-demo">

      {/* ── Nagłówek ── */}
      <header className="bd-header">
        <div className="bd-turn-badge">Tura {state.turn}</div>
        <div className="bd-phase-badge bd-phase-badge--{state.phase}">{state.phase.toUpperCase()}</div>
        <div className="bd-enemy-row">
          {ENEMY_SETS.map((e, i) => (
            <div key={e.id} className={`bd-enemy-dot ${i === enemyIdx ? 'active' : i < enemyIdx ? 'done' : ''}`}>
              {i < enemyIdx ? '✓' : e.emoji}
            </div>
          ))}
        </div>
      </header>

      <div className="bd-main">

        {/* ── Arena ── */}
        <div className="bd-arena">

          {/* Gracz */}
          <div className={`bd-fighter bd-fighter--player ${flashPlayer ? `bd-flash-${flashPlayer}` : ''}`}>
            {state.playerCard ? (
              <CardOnBoard card={state.playerCard} side="player" onInspect={() => inspect(
                { id: state.playerCard!.id, name: state.playerCard!.name, type: 'companion',
                  tribe: 'none', imageUrl: null, imageFallback: state.playerCard!.emoji,
                  description: '', createdAt: 0, hp: state.playerCard!.hp,
                  attack: state.playerCard!.attack, counter: state.playerCard!.counter,
                  abilities: [] },
                'BattleDemo-Player'
              )} />
            ) : (
              <div className="bd-dead">💀</div>
            )}
          </div>

          {/* VS */}
          <div className="bd-vs">VS</div>

          {/* Wróg */}
          <div className={`bd-fighter bd-fighter--enemy ${flashEnemy ? `bd-flash-${flashEnemy}` : ''}`}>
            {state.enemyCard ? (
              <CardOnBoard card={state.enemyCard} side="enemy" onInspect={() => inspect(
                { id: state.enemyCard!.id, name: state.enemyCard!.name, type: 'companion',
                  tribe: 'none', imageUrl: null, imageFallback: state.enemyCard!.emoji,
                  description: '', createdAt: 0, hp: state.enemyCard!.hp,
                  attack: state.enemyCard!.attack, counter: state.enemyCard!.counter,
                  abilities: [] },
                'BattleDemo-Enemy'
              )} />
            ) : (
              <div className="bd-dead">💀</div>
            )}
          </div>
        </div>

        {/* ── Log ── */}
        <div className="bd-log" ref={logRef}>
          {state.log.map(entry => (
            <div
              key={entry.id}
              className="bd-log-entry"
              style={{ color: LOG_COLORS[entry.type] ?? '#9ca3af' }}
            >
              {entry.text}
              {entry.value !== undefined && entry.value > 0 && (
                <span className="bd-log-val">
                  {entry.type === 'heal' ? `+${entry.value}` : `-${entry.value}`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Overlay wynik ── */}
      {isDone && (
        <div className={`bd-overlay ${isWon ? 'bd-overlay--won' : 'bd-overlay--lost'}`}>
          <div className="bd-overlay__icon">{isWon ? '🏆' : '💀'}</div>
          <div className="bd-overlay__title">{isWon ? 'Zwycięstwo!' : 'Przegrana...'}</div>
          <div className="bd-overlay__actions">
            {isWon && enemyIdx < ENEMY_SETS.length - 1 && (
              <button className="bd-btn bd-btn--next" onClick={handleNextEnemy}>
                Następny wróg →
              </button>
            )}
            <button className="bd-btn bd-btn--restart" onClick={handleRestart}>
              🔄 Restart
            </button>
          </div>
        </div>
      )}

      {/* ── Ręka gracza ── */}
      <div className="bd-hand-area">
        <div className="bd-hand">
          {state.hand.map(card => (
            <HandCardEl
              key={card.id + Math.random()}
              card={card}
              isAnimating={animCard === card.id}
              disabled={isDone}
              onClick={() => handlePlayCard(card.id)}
            />
          ))}
          {state.hand.length === 0 && (
            <div className="bd-hand-empty">Ręka pusta — dobierz kartę</div>
          )}
        </div>

        {/* Akcje */}
        <div className="bd-actions">
          <button className="bd-btn bd-btn--draw" onClick={handleDraw} disabled={isDone || (state.deck.length === 0 && state.discard.length === 0)}>
            📥 Dobierz
            <span className="bd-pile-count">{state.deck.length + state.discard.length}</span>
          </button>
          <button className="bd-btn bd-btn--endturn" onClick={handleEndTurn} disabled={isDone}>
            ⏩ Koniec tury
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CardOnBoard — karta na planszy z HP barem, counterem, statusami
// ---------------------------------------------------------------------------

interface CardOnBoardProps {
  card: BattleCard
  side: 'player' | 'enemy'
  onInspect: () => void
}

function CardOnBoard({ card, side, onInspect }: CardOnBoardProps) {
  const hpPct = Math.max(0, (card.hp / card.maxHp) * 100)
  const cntPct = (card.counter / card.maxCounter) * 100
  const isFrozen = card.snow > 0

  return (
    <div
      className={`bd-card bd-card--${side} ${isFrozen ? 'bd-card--frozen' : ''} ${card.isLeader ? 'bd-card--leader' : ''}`}
      onClick={onInspect}
      title="Kliknij → Inspector"
    >
      {/* Statusi górne */}
      <div className="bd-card__top-badges">
        {card.snow > 0 && <span className="bd-badge bd-badge--snow">❄{card.snow}</span>}
        {card.shield > 0 && <span className="bd-badge bd-badge--shield">🛡{card.shield}</span>}
        {card.teeth > 0 && <span className="bd-badge bd-badge--teeth">🦷{card.teeth}</span>}
        {card.poison > 0 && <span className="bd-badge bd-badge--poison">☠{card.poison}</span>}
      </div>

      {/* Emoji */}
      <div className="bd-card__emoji">{card.emoji}</div>

      {/* Nazwa */}
      <div className="bd-card__name">
        {card.name}
        {card.isLeader && <span className="bd-leader-crown">👑</span>}
      </div>

      {/* HP bar */}
      <div className="bd-card__hp-bar-wrap">
        <div className="bd-card__hp-bar" style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444' }} />
      </div>
      <div className="bd-card__hp-text">{card.hp} / {card.maxHp}</div>

      {/* Stats row */}
      <div className="bd-card__stats">
        <span className="bd-stat bd-stat--atk">⚔{card.attack}</span>
        <div
          className={`bd-counter ${isFrozen ? 'bd-counter--frozen' : ''}`}
          style={{ '--pct': `${cntPct}%` } as React.CSSProperties}
        >
          {card.counter}
        </div>
        <span className="bd-stat bd-stat--hp">❤{card.hp}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HandCardEl — karta w ręce
// ---------------------------------------------------------------------------

interface HandCardElProps {
  card: HandCard
  isAnimating: boolean
  disabled: boolean
  onClick: () => void
}

function HandCardEl({ card, isAnimating, disabled, onClick }: HandCardElProps) {
  const effectStr = [
    card.effect.damage    ? `⚔ ${card.effect.damage} dmg`   : '',
    card.effect.snow      ? `❄ ${card.effect.snow} snow`     : '',
    card.effect.heal      ? `💚 +${card.effect.heal} heal`   : '',
    card.effect.shield    ? `🛡 +${card.effect.shield} shield` : '',
    card.effect.addTeeth  ? `🦷 +${card.effect.addTeeth} teeth` : '',
  ].filter(Boolean).join('  ')

  const targetStr = {
    enemy: 'wróg', ally: 'sojusznik',
    all_enemies: 'wszyscy wrogowie', self: 'ty'
  }[card.target] ?? card.target

  return (
    <button
      className={`bd-hand-card ${isAnimating ? 'bd-hand-card--play' : ''} ${disabled ? 'bd-hand-card--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="bd-hand-card__emoji">{card.emoji}</div>
      <div className="bd-hand-card__name">{card.name}</div>
      <div className="bd-hand-card__effect">{effectStr}</div>
      <div className="bd-hand-card__target">→ {targetStr}</div>
    </button>
  )
}
