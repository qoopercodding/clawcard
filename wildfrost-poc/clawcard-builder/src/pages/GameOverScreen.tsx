interface RunStats {
  floorsCleared: number
  enemiesDefeated: number
  cardsCollected: number
  goldEarned: number
  relicsFound: number
  timePlayed: string
}

interface GameOverScreenProps {
  victory: boolean
  stats?: Partial<RunStats>
  onRestart?: () => void
  onMenu?: () => void
}

const DEFAULT_STATS: RunStats = {
  floorsCleared: 7,
  enemiesDefeated: 12,
  cardsCollected: 8,
  goldEarned: 245,
  relicsFound: 3,
  timePlayed: '14:32',
}

export default function GameOverScreen({
  victory,
  stats: partialStats,
  onRestart,
  onMenu,
}: GameOverScreenProps) {
  const stats = { ...DEFAULT_STATS, ...partialStats }

  const statRows: { label: string; value: string | number; emoji: string }[] = [
    { label: 'Floors Cleared', value: stats.floorsCleared, emoji: '🏔️' },
    { label: 'Enemies Defeated', value: stats.enemiesDefeated, emoji: '💀' },
    { label: 'Cards Collected', value: stats.cardsCollected, emoji: '🃏' },
    { label: 'Gold Earned', value: stats.goldEarned, emoji: '🪙' },
    { label: 'Relics Found', value: stats.relicsFound, emoji: '💎' },
    { label: 'Time Played', value: stats.timePlayed, emoji: '⏱️' },
  ]

  const accentColor = victory ? '#86efac' : '#e05555'
  const bgGlow = victory
    ? 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(134,239,172,0.08), transparent 60%)'
    : 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(224,85,85,0.08), transparent 60%)'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 32, padding: 48, minHeight: '100vh',
      background: bgGlow,
    }}>
      <span style={{ fontSize: '4rem', lineHeight: 1 }}>
        {victory ? '👑' : '💀'}
      </span>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.75rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: accentColor, margin: '0 0 8px',
        }}>{victory ? 'Victory' : 'Defeat'}</p>
        <h2 style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          color: 'var(--color-text)', margin: 0, fontSize: '2rem',
        }}>
          {victory ? 'The Dungeon Falls' : 'You Have Fallen'}
        </h2>
        <p style={{
          color: 'var(--color-text-dim)', fontSize: '0.85rem', marginTop: 10,
          maxWidth: 400,
        }}>
          {victory
            ? 'The ancient evil has been vanquished. Your name shall echo through the ages.'
            : 'The darkness claims another soul. But legends never truly die...'}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gap: 1, width: '100%', maxWidth: 360,
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid rgba(200,144,42,0.12)`,
      }}>
        {statRows.map((row) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'rgba(42,26,10,0.6)',
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: '0.82rem', color: 'var(--color-text-dim)',
            }}>
              <span>{row.emoji}</span> {row.label}
            </span>
            <strong style={{
              fontFamily: 'var(--font-gothic)', fontSize: '0.95rem',
              color: 'var(--color-text)',
            }}>{row.value}</strong>
          </div>
        ))}
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.7rem',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--color-text-dim)', margin: '0 0 4px',
        }}>Final Score</p>
        <p style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          fontSize: '2.2rem', color: 'var(--color-gold)', margin: 0,
        }}>
          {stats.floorsCleared * 100 + stats.enemiesDefeated * 25 + stats.goldEarned + stats.relicsFound * 50}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button
          type="button"
          onClick={onRestart}
          style={{
            background: `rgba(${victory ? '134,239,172' : '200,144,42'},0.12)`,
            border: `1px solid ${accentColor}44`,
            borderRadius: 8, color: accentColor,
            padding: '10px 28px', cursor: 'pointer',
            fontFamily: 'var(--font-gothic)', fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          New Run
        </button>
        <button
          type="button"
          onClick={onMenu}
          style={{
            background: 'none',
            border: '1px solid rgba(200,144,42,0.15)',
            borderRadius: 8, color: 'var(--color-text-dim)',
            padding: '10px 28px', cursor: 'pointer',
            fontFamily: 'var(--font-gothic)', fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          Main Menu
        </button>
      </div>
    </div>
  )
}
