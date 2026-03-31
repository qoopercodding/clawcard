import { useState, useMemo } from 'react'

interface RewardCard {
  id: string
  name: string
  cost: number
  attack: number
  hp: number
  emoji: string
  rarity: 'common' | 'uncommon' | 'rare'
  description: string
}

const CARD_POOL: RewardCard[] = [
  { id: 'r1', name: 'Shadow Strike', cost: 1, attack: 4, hp: 0, emoji: '🗡️', rarity: 'common', description: 'Deal 4 damage.' },
  { id: 'r2', name: 'Bone Shield', cost: 1, attack: 0, hp: 0, emoji: '🛡️', rarity: 'common', description: 'Gain 5 block.' },
  { id: 'r3', name: 'Blood Pact', cost: 2, attack: 8, hp: 0, emoji: '🩸', rarity: 'uncommon', description: 'Deal 8 damage. Lose 3 HP.' },
  { id: 'r4', name: 'Ember Wisp', cost: 1, attack: 3, hp: 3, emoji: '🔥', rarity: 'common', description: '3 ATK / 3 HP companion.' },
  { id: 'r5', name: 'Cursed Blade', cost: 2, attack: 12, hp: 0, emoji: '⚔️', rarity: 'rare', description: 'Deal 12 damage. Exhaust.' },
  { id: 'r6', name: 'Ghoul Servant', cost: 2, attack: 2, hp: 6, emoji: '👻', rarity: 'uncommon', description: '2 ATK / 6 HP. Taunt.' },
  { id: 'r7', name: 'Soul Drain', cost: 2, attack: 5, hp: 0, emoji: '💀', rarity: 'uncommon', description: 'Deal 5 damage. Heal 3 HP.' },
  { id: 'r8', name: 'Dark Ritual', cost: 0, attack: 0, hp: 0, emoji: '🌑', rarity: 'rare', description: 'Gain 2 energy this turn.' },
  { id: 'r9', name: 'Frostbite', cost: 1, attack: 2, hp: 0, emoji: '❄️', rarity: 'common', description: 'Deal 2 damage. Apply Snow 2.' },
  { id: 'r10', name: 'Iron Golem', cost: 3, attack: 4, hp: 10, emoji: '🤖', rarity: 'rare', description: '4 ATK / 10 HP. Counter 3.' },
  { id: 'r11', name: 'Plague Rat', cost: 1, attack: 1, hp: 2, emoji: '🐀', rarity: 'common', description: '1 ATK / 2 HP. Poison 1 on hit.' },
  { id: 'r12', name: 'Healing Herb', cost: 1, attack: 0, hp: 0, emoji: '🌿', rarity: 'common', description: 'Heal 6 HP.' },
]

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-text-dim)',
  uncommon: '#a78bfa',
  rare: '#f5c563',
}

function pickRewards(seed: number, count = 3): RewardCard[] {
  const shuffled = [...CARD_POOL]
  let s = seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

interface RewardScreenProps {
  gold?: number
  seed?: number
  onPickCard?: (card: RewardCard) => void
  onSkip?: () => void
}

export default function RewardScreen({ gold = 25, seed, onPickCard, onSkip }: RewardScreenProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const [bonusGold] = useState(() => 10 + Math.floor(Math.random() * 20))
  const rewards = useMemo(() => pickRewards(seed ?? Date.now()), [seed])

  function handlePick(card: RewardCard) {
    setPicked(card.id)
    onPickCard?.(card)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 32, padding: 48, minHeight: '100vh',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.75rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'var(--color-gold)', margin: '0 0 8px',
        }}>Victory</p>
        <h2 style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          color: 'var(--color-text)', margin: 0, fontSize: '1.8rem',
        }}>Choose Your Reward</h2>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.82rem', marginTop: 8 }}>
          +{bonusGold} gold earned (Total: {gold + bonusGold})
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${rewards.length}, 200px)`,
        gap: 20, justifyContent: 'center',
      }}>
        {rewards.map(card => {
          const isPicked = picked === card.id
          const isDisabled = picked !== null && !isPicked
          return (
            <button
              key={card.id}
              type="button"
              disabled={isDisabled}
              onClick={() => !picked && handlePick(card)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 10, padding: '24px 16px',
                border: `1px solid ${isPicked ? 'var(--color-gold)' : 'rgba(200,144,42,0.15)'}`,
                borderRadius: 14,
                background: isPicked
                  ? 'linear-gradient(180deg, rgba(200,144,42,0.15), rgba(42,26,10,0.9))'
                  : 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
                color: 'var(--color-text)',
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled ? 0.35 : 1,
                transition: 'all 200ms ease',
                transform: isPicked ? 'scale(1.05)' : 'none',
              }}
            >
              <span style={{ fontSize: '2.4rem' }}>{card.emoji}</span>
              <strong style={{
                fontFamily: 'var(--font-gothic)', fontSize: '0.95rem',
                color: RARITY_COLORS[card.rarity],
              }}>{card.name}</strong>
              <span style={{
                fontSize: '0.65rem', textTransform: 'uppercase',
                letterSpacing: '0.12em', color: RARITY_COLORS[card.rarity],
                opacity: 0.7,
              }}>{card.rarity}</span>
              {(card.attack > 0 || card.hp > 0) && (
                <div style={{
                  display: 'flex', gap: 12, fontSize: '0.8rem',
                  color: 'var(--color-text-dim)',
                }}>
                  {card.attack > 0 && <span>ATK {card.attack}</span>}
                  {card.hp > 0 && <span>HP {card.hp}</span>}
                  <span>Cost {card.cost}</span>
                </div>
              )}
              <p style={{
                margin: 0, fontSize: '0.76rem', color: 'var(--color-text-dim)',
                lineHeight: 1.4, textAlign: 'center',
              }}>{card.description}</p>
              {isPicked && (
                <span style={{
                  fontSize: '0.7rem', color: 'var(--color-gold)',
                  fontFamily: 'var(--font-gothic)', letterSpacing: '0.1em',
                }}>ADDED TO DECK</span>
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onSkip}
        style={{
          background: 'none', border: '1px solid rgba(200,144,42,0.15)',
          borderRadius: 8, color: 'var(--color-text-dim)',
          padding: '8px 24px', cursor: 'pointer',
          fontFamily: 'var(--font-gothic)', fontSize: '0.72rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          opacity: picked ? 1 : 0.6,
        }}
      >
        {picked ? 'Continue' : 'Skip Reward'}
      </button>
    </div>
  )
}
