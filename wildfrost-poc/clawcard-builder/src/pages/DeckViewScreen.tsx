import type { RunCard } from '../store/GameState'

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-text-dim)',
  uncommon: '#a78bfa',
  rare: '#f5c563',
}

interface DeckViewScreenProps {
  cards?: RunCard[]
  onClose?: () => void
}

export default function DeckViewScreen({ cards = [], onClose }: DeckViewScreenProps) {
  const sorted = [...cards].sort((a, b) => {
    if (a.rarity !== b.rarity) {
      const order = { rare: 0, uncommon: 1, common: 2 }
      return order[a.rarity] - order[b.rarity]
    }
    return a.cost - b.cost
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 24, padding: '32px 24px', minHeight: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 800 }}>
        <h2 style={{
          fontFamily: 'var(--font-gothic)', color: 'var(--color-gold)',
          margin: 0, fontSize: '1.3rem',
        }}>
          Your Deck
        </h2>
        <span style={{
          color: 'var(--color-text-dim)', fontSize: '0.75rem',
          fontFamily: 'var(--font-gothic)',
        }}>
          {cards.length} cards
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid rgba(200,144,42,0.15)',
            borderRadius: 8, color: 'var(--color-text-dim)',
            padding: '6px 16px', cursor: 'pointer',
            fontFamily: 'var(--font-gothic)', fontSize: '0.7rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          Close
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 12, maxWidth: 800, width: '100%',
      }}>
        {sorted.map((card, idx) => (
          <div
            key={`${card.id}-${idx}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, padding: '14px 10px',
              border: `1px solid ${card.upgraded ? 'rgba(134,239,172,0.3)' : 'rgba(200,144,42,0.12)'}`,
              borderRadius: 10,
              background: card.upgraded
                ? 'linear-gradient(180deg, rgba(134,239,172,0.06), rgba(26,14,5,0.95))'
                : 'linear-gradient(180deg, rgba(42,26,10,0.7), rgba(26,14,5,0.95))',
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>{card.emoji}</span>
            <strong style={{
              fontFamily: 'var(--font-gothic)', fontSize: '0.78rem',
              color: RARITY_COLORS[card.rarity],
              textAlign: 'center',
            }}>
              {card.name}{card.upgraded ? '+' : ''}
            </strong>

            <div style={{
              display: 'flex', gap: 8, fontSize: '0.68rem',
              color: 'var(--color-text-dim)',
            }}>
              <span style={{ color: 'var(--color-gold)' }}>Cost {card.cost}</span>
              {card.attack > 0 && <span>ATK {card.attack}</span>}
              {card.hp > 0 && <span>HP {card.hp}</span>}
            </div>

            <p style={{
              margin: 0, fontSize: '0.65rem', color: 'var(--color-text-dim)',
              lineHeight: 1.4, textAlign: 'center',
            }}>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
