import { useState } from 'react'
import type { RunCard } from '../store/GameState'

interface CampfireScreenProps {
  playerHp?: number
  maxHp?: number
  deckCards?: RunCard[]
  onRest?: (healed: number) => void
  onUpgradeCard?: (cardId: string) => void
  onLeave?: () => void
}

export default function CampfireScreen({
  playerHp = 22,
  maxHp = 30,
  deckCards = [],
  onRest,
  onUpgradeCard,
  onLeave,
}: CampfireScreenProps) {
  const [choice, setChoice] = useState<'none' | 'rest' | 'upgrade' | 'done'>('none')
  const [upgradedId, setUpgradedId] = useState<string | null>(null)

  const healAmount = Math.floor(maxHp * 0.3)
  const newHp = Math.min(maxHp, playerHp + healAmount)

  const upgradeable = deckCards.filter(c => !c.upgraded)

  function handleRest() {
    setChoice('done')
    onRest?.(healAmount)
  }

  function handleUpgrade(card: RunCard) {
    setUpgradedId(card.id)
    setChoice('done')
    onUpgradeCard?.(card.id)
  }

  const upgradedCard = upgradedId ? deckCards.find(c => c.id === upgradedId) : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 32, padding: 48, minHeight: '100vh',
    }}>
      <div style={{ fontSize: '4rem', lineHeight: 1 }}>🔥</div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.75rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#f5c563', margin: '0 0 8px',
        }}>Campfire</p>
        <h2 style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          color: 'var(--color-text)', margin: 0, fontSize: '1.6rem',
        }}>A Moment of Rest</h2>
        <p style={{
          color: 'var(--color-text-dim)', fontSize: '0.82rem', marginTop: 8,
        }}>
          HP: {playerHp} / {maxHp}
        </p>
      </div>

      {choice === 'none' && (
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            type="button"
            onClick={() => setChoice('rest')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '28px 32px',
              border: '1px solid rgba(134,239,172,0.2)',
              borderRadius: 14,
              background: 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
              color: 'var(--color-text)', cursor: 'pointer',
              transition: 'all 200ms ease', width: 200,
            }}
          >
            <span style={{ fontSize: '2.4rem' }}>💤</span>
            <strong style={{ fontFamily: 'var(--font-gothic)', fontSize: '1rem' }}>Rest</strong>
            <span style={{ fontSize: '0.76rem', color: '#86efac' }}>
              Heal {healAmount} HP ({playerHp} → {newHp})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setChoice('upgrade')}
            disabled={upgradeable.length === 0}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '28px 32px',
              border: '1px solid rgba(200,144,42,0.2)',
              borderRadius: 14,
              background: 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
              color: 'var(--color-text)', cursor: upgradeable.length > 0 ? 'pointer' : 'default',
              transition: 'all 200ms ease', width: 200,
              opacity: upgradeable.length > 0 ? 1 : 0.4,
            }}
          >
            <span style={{ fontSize: '2.4rem' }}>⬆️</span>
            <strong style={{ fontFamily: 'var(--font-gothic)', fontSize: '1rem' }}>Upgrade</strong>
            <span style={{ fontSize: '0.76rem', color: 'var(--color-gold)' }}>
              {upgradeable.length > 0 ? `${upgradeable.length} cards available` : 'No cards to upgrade'}
            </span>
          </button>
        </div>
      )}

      {choice === 'rest' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#86efac', fontSize: '1.1rem', fontFamily: 'var(--font-gothic)' }}>
            Healed {healAmount} HP
          </p>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.82rem', marginTop: 4 }}>
            {playerHp} → {newHp} HP
          </p>
          <button
            type="button"
            onClick={handleRest}
            style={{
              marginTop: 16, background: 'rgba(134,239,172,0.12)',
              border: '1px solid rgba(134,239,172,0.3)',
              borderRadius: 8, color: '#86efac',
              padding: '8px 24px', cursor: 'pointer',
              fontFamily: 'var(--font-gothic)', fontSize: '0.75rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            Confirm Rest
          </button>
        </div>
      )}

      {choice === 'upgrade' && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12, maxWidth: 600, width: '100%',
        }}>
          {upgradeable.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleUpgrade(card)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '16px 12px',
                border: '1px solid rgba(200,144,42,0.15)',
                borderRadius: 10,
                background: 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
                color: 'var(--color-text)', cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{card.emoji}</span>
              <strong style={{ fontFamily: 'var(--font-gothic)', fontSize: '0.82rem' }}>{card.name}</strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                {card.attack > 0 ? `ATK ${card.attack}` : ''} {card.hp > 0 ? `HP ${card.hp}` : ''} Cost {card.cost}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-gold)' }}>Upgrade</span>
            </button>
          ))}
        </div>
      )}

      {choice === 'done' && (
        <div style={{ textAlign: 'center' }}>
          {upgradedCard ? (
            <p style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-gothic)' }}>
              {upgradedCard.emoji} {upgradedCard.name} upgraded!
            </p>
          ) : (
            <p style={{ color: '#86efac', fontFamily: 'var(--font-gothic)' }}>
              Well rested. HP restored to {newHp}.
            </p>
          )}
          <button
            type="button"
            onClick={onLeave}
            style={{
              marginTop: 16, background: 'none',
              border: '1px solid rgba(200,144,42,0.15)',
              borderRadius: 8, color: 'var(--color-text-dim)',
              padding: '8px 24px', cursor: 'pointer',
              fontFamily: 'var(--font-gothic)', fontSize: '0.72rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            Continue Journey
          </button>
        </div>
      )}
    </div>
  )
}
