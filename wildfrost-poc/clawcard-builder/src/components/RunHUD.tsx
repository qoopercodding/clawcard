import type { Potion, Relic } from '../store/GameState'

interface RunHUDProps {
  hp: number
  maxHp: number
  gold: number
  floor: number
  potions: Potion[]
  relics: Relic[]
  deckSize: number
  onDeckClick?: () => void
  onUsePotion?: (potionId: string) => void
}

export default function RunHUD({
  hp, maxHp, gold, floor, potions, relics, deckSize, onDeckClick, onUsePotion,
}: RunHUDProps) {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const hpColor = hpPercent > 60 ? '#86efac' : hpPercent > 30 ? '#f5c563' : '#e05555'

  return (
    <div className="run-hud">
      {/* HP bar */}
      <div className="run-hud__stat run-hud__hp">
        <span className="run-hud__icon">❤️</span>
        <div className="run-hud__bar-wrap">
          <div className="run-hud__bar" style={{ width: `${hpPercent}%`, background: hpColor }} />
        </div>
        <span className="run-hud__value" style={{ color: hpColor }}>{hp}/{maxHp}</span>
      </div>

      {/* Gold */}
      <div className="run-hud__stat">
        <span className="run-hud__icon">🪙</span>
        <span className="run-hud__value" style={{ color: 'var(--color-gold)' }}>{gold}</span>
      </div>

      {/* Floor */}
      <div className="run-hud__stat">
        <span className="run-hud__icon">🏔️</span>
        <span className="run-hud__label">Floor</span>
        <span className="run-hud__value">{floor}</span>
      </div>

      {/* Potions */}
      <div className="run-hud__stat" style={{ gap: 3 }}>
        <span className="run-hud__icon">🧪</span>
        {potions.length > 0 ? potions.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => onUsePotion?.(p.id)}
            title={`${p.name}: ${p.description}`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', padding: 0, lineHeight: 1,
            }}
          >
            {p.emoji}
          </button>
        )) : (
          <span className="run-hud__value" style={{ opacity: 0.3 }}>0/3</span>
        )}
      </div>

      {/* Relics */}
      <div className="run-hud__stat" style={{ gap: 3 }}>
        <span className="run-hud__icon">💎</span>
        {relics.length > 0 ? relics.map(r => (
          <span key={r.id} title={`${r.name}: ${r.description}`} style={{ fontSize: '0.75rem' }}>
            {r.emoji}
          </span>
        )) : (
          <span className="run-hud__value">{relics.length}</span>
        )}
      </div>

      {/* Deck */}
      <button type="button" className="run-hud__stat run-hud__deck-btn" onClick={onDeckClick}>
        <span className="run-hud__icon">🃏</span>
        <span className="run-hud__label">Deck</span>
        <span className="run-hud__value">{deckSize}</span>
      </button>
    </div>
  )
}
