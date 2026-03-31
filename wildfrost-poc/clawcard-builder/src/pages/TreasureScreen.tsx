import { useState, useMemo } from 'react'

interface TreasureItem {
  id: string
  name: string
  emoji: string
  type: 'relic' | 'gold' | 'card'
  description: string
  value: number
}

const TREASURE_POOL: TreasureItem[] = [
  { id: 't1', name: 'Crown of Thorns', emoji: '👑', type: 'relic', description: 'Gain 1 energy at the start of each combat.', value: 1 },
  { id: 't2', name: 'Soul Gem', emoji: '💎', type: 'relic', description: 'Draw 1 extra card each turn.', value: 1 },
  { id: 't3', name: 'Obsidian Amulet', emoji: '🔮', type: 'relic', description: 'Start each combat with 3 block.', value: 1 },
  { id: 't4', name: 'Dragon Hoard', emoji: '🪙', type: 'gold', description: 'A pile of ancient coins.', value: 100 },
  { id: 't5', name: 'Merchant Stash', emoji: '💰', type: 'gold', description: 'A hidden cache of gold.', value: 65 },
  { id: 't6', name: 'Ancient Scroll', emoji: '📜', type: 'card', description: 'Learn a rare technique.', value: 1 },
  { id: 't7', name: 'Demon Heart', emoji: '🖤', type: 'relic', description: '+10 max HP, but take 1 damage per turn in combat.', value: 1 },
  { id: 't8', name: 'Frozen Eye', emoji: '🧊', type: 'relic', description: 'See the top card of your draw pile.', value: 1 },
]

function pickTreasure(seed: number): TreasureItem {
  let s = seed
  s = (s * 16807) % 2147483647
  return TREASURE_POOL[s % TREASURE_POOL.length]
}

interface TreasureScreenProps {
  seed?: number
  onTake?: (item: TreasureItem) => void
  onLeave?: () => void
}

export default function TreasureScreen({ seed, onTake, onLeave }: TreasureScreenProps) {
  const [taken, setTaken] = useState(false)
  const treasure = useMemo(() => pickTreasure(seed ?? Date.now()), [seed])

  function handleTake() {
    setTaken(true)
    onTake?.(treasure)
  }

  const valueLabel = treasure.type === 'gold' ? `+${treasure.value} gold` :
    treasure.type === 'card' ? '+1 rare card' : 'New relic acquired'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 28, padding: 48, minHeight: '100vh',
    }}>
      <div style={{
        fontSize: '4rem', lineHeight: 1,
        animation: 'treasure-glow 2s ease-in-out infinite alternate',
      }}>
        💎
      </div>
      <style>{`
        @keyframes treasure-glow {
          0% { filter: drop-shadow(0 0 8px rgba(56,189,248,0.3)); }
          100% { filter: drop-shadow(0 0 20px rgba(56,189,248,0.6)); }
        }
        @keyframes chest-open {
          0% { transform: scale(1); }
          50% { transform: scale(1.15) rotate(-3deg); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.75rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#38bdf8', margin: '0 0 8px',
        }}>Treasure</p>
        <h2 style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          color: 'var(--color-text)', margin: 0, fontSize: '1.6rem',
        }}>Ancient Chest</h2>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 14, padding: '32px 40px',
        border: `1px solid ${taken ? 'rgba(56,189,248,0.3)' : 'rgba(200,144,42,0.15)'}`,
        borderRadius: 16,
        background: taken
          ? 'linear-gradient(180deg, rgba(56,189,248,0.08), rgba(26,14,5,0.95))'
          : 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
        transition: 'all 300ms ease',
        animation: taken ? 'chest-open 0.4s ease' : 'none',
        minWidth: 260,
      }}>
        <span style={{ fontSize: '3rem' }}>{treasure.emoji}</span>
        <strong style={{
          fontFamily: 'var(--font-gothic)', fontSize: '1.1rem',
          color: '#38bdf8',
        }}>{treasure.name}</strong>
        <span style={{
          fontSize: '0.65rem', textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: treasure.type === 'relic' ? '#f5c563' : treasure.type === 'gold' ? 'var(--color-gold)' : '#a78bfa',
        }}>{treasure.type}</span>
        <p style={{
          margin: 0, fontSize: '0.82rem', color: 'var(--color-text-dim)',
          lineHeight: 1.5, textAlign: 'center', maxWidth: 280,
        }}>{treasure.description}</p>

        {taken && (
          <span style={{
            fontFamily: 'var(--font-gothic)', fontSize: '0.85rem',
            color: '#86efac', marginTop: 4,
          }}>{valueLabel}</span>
        )}
      </div>

      {!taken ? (
        <button
          type="button"
          onClick={handleTake}
          style={{
            background: 'rgba(56,189,248,0.12)',
            border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 8, color: '#38bdf8',
            padding: '10px 28px', cursor: 'pointer',
            fontFamily: 'var(--font-gothic)', fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          Open Chest
        </button>
      ) : (
        <button
          type="button"
          onClick={onLeave}
          style={{
            background: 'none',
            border: '1px solid rgba(200,144,42,0.15)',
            borderRadius: 8, color: 'var(--color-text-dim)',
            padding: '8px 24px', cursor: 'pointer',
            fontFamily: 'var(--font-gothic)', fontSize: '0.72rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          Continue
        </button>
      )}
    </div>
  )
}
