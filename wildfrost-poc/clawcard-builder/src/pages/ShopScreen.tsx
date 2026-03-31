import { useState, useMemo } from 'react'
import type { RunCard } from '../store/GameState'

interface ShopItem {
  id: string
  name: string
  emoji: string
  type: 'card' | 'relic' | 'potion'
  price: number
  description: string
  rarity: 'common' | 'uncommon' | 'rare'
}

const SHOP_POOL: ShopItem[] = [
  { id: 's1', name: 'Venom Dagger', emoji: '🗡️', type: 'card', price: 50, description: 'Deal 3 damage. Apply Poison 2.', rarity: 'common' },
  { id: 's2', name: 'Stone Wall', emoji: '🧱', type: 'card', price: 60, description: 'Gain 8 block.', rarity: 'common' },
  { id: 's3', name: 'Necromancy', emoji: '💀', type: 'card', price: 120, description: 'Summon a 3/3 Skeleton.', rarity: 'uncommon' },
  { id: 's4', name: 'Inferno', emoji: '🔥', type: 'card', price: 150, description: 'Deal 6 damage to ALL enemies.', rarity: 'rare' },
  { id: 's5', name: 'Healing Salve', emoji: '🧪', type: 'potion', price: 40, description: 'Heal 15 HP.', rarity: 'common' },
  { id: 's6', name: 'Energy Tonic', emoji: '⚡', type: 'potion', price: 60, description: '+1 energy next combat.', rarity: 'uncommon' },
  { id: 's7', name: 'Skull Ring', emoji: '💍', type: 'relic', price: 200, description: 'Deal +2 damage per attack.', rarity: 'rare' },
  { id: 's8', name: 'Lucky Coin', emoji: '🪙', type: 'relic', price: 100, description: 'Gain 15 gold after each combat.', rarity: 'uncommon' },
  { id: 's9', name: 'Thornmail', emoji: '🌹', type: 'relic', price: 160, description: 'Reflect 1 damage when hit.', rarity: 'uncommon' },
  { id: 's10', name: 'Blood Chalice', emoji: '🏆', type: 'relic', price: 180, description: 'Heal 2 HP per kill.', rarity: 'rare' },
]

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-text-dim)',
  uncommon: '#a78bfa',
  rare: '#f5c563',
}

const TYPE_LABELS: Record<string, string> = {
  card: 'Card', relic: 'Relic', potion: 'Potion',
}

function pickShopItems(seed: number): ShopItem[] {
  const shuffled = [...SHOP_POOL]
  let s = seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 6)
}

interface ShopScreenProps {
  playerGold?: number
  seed?: number
  deckCards?: RunCard[]
  onBuy?: (item: ShopItem) => void
  onRemoveCard?: (cardId: string) => void
  onLeave?: () => void
}

const REMOVE_COST = 50

export default function ShopScreen({ playerGold = 150, seed, deckCards = [], onBuy, onRemoveCard, onLeave }: ShopScreenProps) {
  const [gold, setGold] = useState(playerGold)
  const [bought, setBought] = useState<Set<string>>(new Set())
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set())
  const items = useMemo(() => pickShopItems(seed ?? Date.now()), [seed])

  function handleBuy(item: ShopItem) {
    if (gold < item.price || bought.has(item.id)) return
    setGold(g => g - item.price)
    setBought(prev => new Set([...prev, item.id]))
    onBuy?.(item)
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
          color: '#86efac', margin: '0 0 8px',
        }}>Merchant</p>
        <h2 style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          color: 'var(--color-text)', margin: 0, fontSize: '1.8rem',
        }}>Dark Bazaar</h2>
        <p style={{
          color: 'var(--color-gold)', fontSize: '1rem', marginTop: 12,
          fontFamily: 'var(--font-gothic)',
        }}>
          Gold: {gold}
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16, maxWidth: 800, width: '100%',
      }}>
        {items.map(item => {
          const isBought = bought.has(item.id)
          const canAfford = gold >= item.price
          return (
            <button
              key={item.id}
              type="button"
              disabled={isBought || !canAfford}
              onClick={() => handleBuy(item)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, padding: '20px 14px',
                border: `1px solid ${isBought ? 'rgba(134,239,172,0.3)' : canAfford ? 'rgba(200,144,42,0.2)' : 'rgba(200,144,42,0.08)'}`,
                borderRadius: 12,
                background: isBought
                  ? 'rgba(134,239,172,0.05)'
                  : 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
                color: 'var(--color-text)',
                cursor: isBought || !canAfford ? 'default' : 'pointer',
                opacity: isBought ? 0.4 : canAfford ? 1 : 0.5,
                transition: 'all 200ms ease',
              }}
            >
              <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
              <strong style={{
                fontFamily: 'var(--font-gothic)', fontSize: '0.88rem',
                color: RARITY_COLORS[item.rarity],
              }}>{item.name}</strong>
              <span style={{
                fontSize: '0.6rem', textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--color-text-dim)',
              }}>{TYPE_LABELS[item.type]} · {item.rarity}</span>
              <p style={{
                margin: 0, fontSize: '0.72rem', color: 'var(--color-text-dim)',
                lineHeight: 1.4, textAlign: 'center',
              }}>{item.description}</p>
              <span style={{
                fontFamily: 'var(--font-gothic)', fontSize: '0.9rem',
                color: isBought ? '#86efac' : canAfford ? 'var(--color-gold)' : 'var(--color-danger, #e05555)',
              }}>
                {isBought ? 'SOLD' : `${item.price} gold`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card removal */}
      {deckCards.length > 0 && (
        <div style={{ width: '100%', maxWidth: 800 }}>
          <h3 style={{
            fontFamily: 'var(--font-gothic)', fontSize: '0.72rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#e05555', margin: '0 0 12px',
            borderTop: '1px solid rgba(200,144,42,0.08)',
            paddingTop: 16,
          }}>Remove a Card — {REMOVE_COST} gold</h3>
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            {deckCards.filter(c => !removedCards.has(c.id)).map((card, idx) => {
              const canRemove = gold >= REMOVE_COST
              return (
                <button
                  key={`${card.id}-${idx}`}
                  type="button"
                  disabled={!canRemove}
                  onClick={() => {
                    if (!canRemove) return
                    setGold(g => g - REMOVE_COST)
                    setRemovedCards(prev => new Set([...prev, card.id]))
                    onRemoveCard?.(card.id)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', fontSize: '0.72rem',
                    border: '1px solid rgba(224,85,85,0.15)',
                    borderRadius: 6,
                    background: 'rgba(42,26,10,0.6)',
                    color: 'var(--color-text)',
                    cursor: canRemove ? 'pointer' : 'default',
                    opacity: canRemove ? 1 : 0.4,
                  }}
                >
                  <span>{card.emoji}</span>
                  <span>{card.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onLeave}
        style={{
          background: 'none', border: '1px solid rgba(200,144,42,0.15)',
          borderRadius: 8, color: 'var(--color-text-dim)',
          padding: '8px 24px', cursor: 'pointer',
          fontFamily: 'var(--font-gothic)', fontSize: '0.72rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}
      >
        Leave Shop
      </button>
    </div>
  )
}
