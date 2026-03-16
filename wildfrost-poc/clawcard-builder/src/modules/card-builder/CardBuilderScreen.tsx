import { useState } from 'react'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { SAMPLE_CARDS } from '../../data/sampleCards'
import type { AnyCard } from '../../types/card.types'
import './CardBuilderScreen.css'

// =============================================================================
// CardBuilderScreen.tsx — Galeria wszystkich kart z PNG ramką companion
// =============================================================================

type FilterType = 'all' | 'companion' | 'item' | 'clunker' | 'shade' | 'charm'

const FILTER_OPTIONS: { value: FilterType; label: string; emoji: string }[] = [
  { value: 'all',       label: 'Wszystkie', emoji: '🃏' },
  { value: 'companion', label: 'Companion', emoji: '🧝' },
  { value: 'item',      label: 'Item',      emoji: '⚔️'  },
  { value: 'clunker',   label: 'Clunker',   emoji: '⚙️'  },
  { value: 'shade',     label: 'Shade',     emoji: '👻' },
  { value: 'charm',     label: 'Charm',     emoji: '💎' },
]

export function CardBuilderScreen() {
  const [filter, setFilter] = useState<FilterType>('all')

  const allCards = Object.values(SAMPLE_CARDS)
  const filtered = filter === 'all'
    ? allCards
    : allCards.filter(c => c.type === filter)

  return (
    <section className="card-builder">
      <header className="card-builder__header">
        <div>
          <p className="workspace-screen__eyebrow">Card Builder</p>
          <h2>Galeria kart</h2>
          <p className="card-builder__subtitle">
            {allCards.length} kart · ramka companion na wszystkich · kliknij → Inspector
          </p>
        </div>

        <nav className="card-builder__filters" aria-label="Filtruj po typie">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filter === opt.value ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </nav>
      </header>

      {filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map(card => (
            <CardFrame
              key={card.id}
              card={card}
              width={200}
              height={294}
            />
          ))}
        </div>
      ) : (
        <div className="card-builder__empty">Brak kart dla tego filtra.</div>
      )}
    </section>
  )
}
