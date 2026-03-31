interface RunHUDProps {
  hp: number
  maxHp: number
  gold: number
  floor: number
  relicCount: number
  deckSize: number
  onDeckClick?: () => void
}

export default function RunHUD({ hp, maxHp, gold, floor, relicCount, deckSize, onDeckClick }: RunHUDProps) {
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

      {/* Relics */}
      <div className="run-hud__stat">
        <span className="run-hud__icon">💎</span>
        <span className="run-hud__value">{relicCount}</span>
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
