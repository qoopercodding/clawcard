import { useState, useMemo } from 'react'

interface EventChoice {
  text: string
  emoji: string
  outcome: string
  effect: 'gain_gold' | 'lose_hp' | 'gain_card' | 'gain_relic' | 'heal' | 'gain_max_hp' | 'lose_gold'
  value: number
}

interface GameEvent {
  id: string
  title: string
  emoji: string
  description: string
  choices: EventChoice[]
}

const EVENTS: GameEvent[] = [
  {
    id: 'e1', title: 'The Forgotten Shrine', emoji: '⛩️',
    description: 'A crumbling stone shrine glows faintly in the darkness. Ancient runes pulse with residual magic. Do you dare approach?',
    choices: [
      { text: 'Pray at the shrine', emoji: '🙏', outcome: 'The shrine blesses you with vigor.', effect: 'gain_max_hp', value: 5 },
      { text: 'Take the offering', emoji: '💰', outcome: 'You pocket the golden coins left by pilgrims.', effect: 'gain_gold', value: 40 },
      { text: 'Smash it', emoji: '💥', outcome: 'A curse strikes you! But you find a relic in the rubble.', effect: 'lose_hp', value: 8 },
    ],
  },
  {
    id: 'e2', title: 'Wounded Traveler', emoji: '🤕',
    description: 'A wounded traveler sits against a tree, clutching a leather satchel. "Please... help me..." they whisper.',
    choices: [
      { text: 'Help them', emoji: '❤️', outcome: 'Grateful, they share their healing knowledge.', effect: 'heal', value: 15 },
      { text: 'Rob them', emoji: '🗡️', outcome: 'You take their gold, ignoring their pleas.', effect: 'gain_gold', value: 60 },
      { text: 'Trade supplies', emoji: '🤝', outcome: 'A fair exchange. You both benefit.', effect: 'gain_card', value: 1 },
    ],
  },
  {
    id: 'e3', title: 'The Cursed Well', emoji: '🕳️',
    description: 'A well emanates an eerie purple glow. You hear whispers echoing from its depths, promising power at a price.',
    choices: [
      { text: 'Drink the water', emoji: '🥤', outcome: 'Power surges through you, but at a cost.', effect: 'lose_hp', value: 10 },
      { text: 'Throw in a coin', emoji: '🪙', outcome: 'The well grants you a boon.', effect: 'lose_gold', value: 20 },
      { text: 'Walk away', emoji: '🚶', outcome: 'Wisdom is knowing when to leave.', effect: 'heal', value: 5 },
    ],
  },
  {
    id: 'e4', title: 'Goblin Merchant', emoji: '👺',
    description: 'A goblin emerges from the bushes, jingling a bag of trinkets. "Deals! Deals! Best deals for brave adventurer!"',
    choices: [
      { text: 'Buy the mystery box', emoji: '📦', outcome: 'Inside you find something useful!', effect: 'gain_relic', value: 1 },
      { text: 'Gamble with the goblin', emoji: '🎲', outcome: 'Lucky roll! The goblin pays up.', effect: 'gain_gold', value: 50 },
      { text: 'Intimidate', emoji: '😤', outcome: 'The goblin runs, dropping some coins.', effect: 'gain_gold', value: 25 },
    ],
  },
  {
    id: 'e5', title: 'Ancient Library', emoji: '📚',
    description: 'Dusty tomes line the walls of a hidden chamber. A magical book floats before you, its pages turning on their own.',
    choices: [
      { text: 'Read the tome', emoji: '📖', outcome: 'You learn a powerful new technique.', effect: 'gain_card', value: 1 },
      { text: 'Sell the books', emoji: '💰', outcome: 'A collector pays handsomely.', effect: 'gain_gold', value: 75 },
      { text: 'Rest here', emoji: '💤', outcome: 'The quiet chamber is a perfect place to recover.', effect: 'heal', value: 12 },
    ],
  },
]

const EFFECT_LABELS: Record<string, (v: number) => string> = {
  gain_gold: (v) => `+${v} gold`,
  lose_hp: (v) => `-${v} HP`,
  gain_card: () => '+1 card',
  gain_relic: () => '+1 relic',
  heal: (v) => `+${v} HP`,
  gain_max_hp: (v) => `+${v} max HP`,
  lose_gold: (v) => `-${v} gold`,
}

const EFFECT_COLORS: Record<string, string> = {
  gain_gold: 'var(--color-gold)',
  lose_hp: 'var(--color-danger, #e05555)',
  gain_card: '#a78bfa',
  gain_relic: '#f5c563',
  heal: '#86efac',
  gain_max_hp: '#86efac',
  lose_gold: 'var(--color-danger, #e05555)',
}

interface EventScreenProps {
  seed?: number
  onComplete?: (effect: string, value: number) => void
  onLeave?: () => void
}

export default function EventScreen({ seed, onComplete, onLeave }: EventScreenProps) {
  const [chosenIdx, setChosenIdx] = useState<number | null>(null)

  const event = useMemo(() => {
    const s = seed ?? Date.now()
    return EVENTS[s % EVENTS.length]
  }, [seed])

  function handleChoice(idx: number) {
    setChosenIdx(idx)
    const choice = event.choices[idx]
    onComplete?.(choice.effect, choice.value)
  }

  const chosen = chosenIdx !== null ? event.choices[chosenIdx] : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 28, padding: 48, minHeight: '100vh', maxWidth: 600, margin: '0 auto',
    }}>
      <span style={{ fontSize: '3.5rem' }}>{event.emoji}</span>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-gothic)', fontSize: '0.75rem',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#a78bfa', margin: '0 0 8px',
        }}>Event</p>
        <h2 style={{
          fontFamily: 'var(--font-gothic-decorative, var(--font-gothic))',
          color: 'var(--color-text)', margin: 0, fontSize: '1.5rem',
        }}>{event.title}</h2>
      </div>

      <p style={{
        color: 'var(--color-text-dim)', fontSize: '0.88rem',
        lineHeight: 1.7, textAlign: 'center', fontStyle: 'italic',
      }}>
        {event.description}
      </p>

      {chosen === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {event.choices.map((choice, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChoice(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', width: '100%',
                border: '1px solid rgba(200,144,42,0.15)',
                borderRadius: 10,
                background: 'linear-gradient(180deg, rgba(42,26,10,0.8), rgba(26,14,5,0.95))',
                color: 'var(--color-text)', cursor: 'pointer',
                transition: 'all 200ms ease', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{choice.emoji}</span>
              <div>
                <strong style={{ fontSize: '0.88rem' }}>{choice.text}</strong>
                <span style={{
                  display: 'block', fontSize: '0.7rem',
                  color: EFFECT_COLORS[choice.effect], marginTop: 2,
                }}>
                  {EFFECT_LABELS[choice.effect](choice.value)}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            padding: '24px 32px', borderRadius: 14,
            border: '1px solid rgba(200,144,42,0.2)',
            background: 'rgba(42,26,10,0.6)',
          }}>
            <p style={{
              fontStyle: 'italic', color: 'var(--color-text)',
              fontSize: '0.92rem', margin: '0 0 8px',
            }}>
              {chosen.outcome}
            </p>
            <p style={{
              color: EFFECT_COLORS[chosen.effect],
              fontFamily: 'var(--font-gothic)',
              fontSize: '1rem', margin: 0,
            }}>
              {EFFECT_LABELS[chosen.effect](chosen.value)}
            </p>
          </div>

          <button
            type="button"
            onClick={onLeave}
            style={{
              marginTop: 20, background: 'none',
              border: '1px solid rgba(200,144,42,0.15)',
              borderRadius: 8, color: 'var(--color-text-dim)',
              padding: '8px 24px', cursor: 'pointer',
              fontFamily: 'var(--font-gothic)', fontSize: '0.72rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
