import { useState } from 'react'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { useCardStore } from '../../store/cardStore'
import type { AnyCard } from '../../types/card.types'
import './CardBuilderScreen.css'

// =============================================================================
// CardBuilderScreen.tsx — Galeria kart
// TASK 4: Dynamiczne filtry + user_cards ze store
// =============================================================================
//
// Źródła kart:
//   - sampleCards — wbudowane karty z Wildfrost
//   - userCards   — karty dodane przez użytkownika w Card Editorze
//
// Filtry generowane dynamicznie z unikalnych typów w allCards.
// Zakładka "Moje karty" pokazuje tylko user_cards.
// =============================================================================

type GalleryTab = 'all' | 'mine'

export function CardBuilderScreen() {
  const { allCards, userCards, removeCard } = useCardStore()
  const [tab, setTab]       = useState<GalleryTab>('all')
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<AnyCard | null>(null)

  // Dynamiczne filtry z unikalnych typów
  const typesInAll  = ['all', ...Array.from(new Set(allCards.map(c => c.type))).sort()]
  const typesInMine = ['all', ...Array.from(new Set(Object.values(userCards).map(c => c.type))).sort()]
  const activeTypes = tab === 'all' ? typesInAll : typesInMine

  const sourceCards = tab === 'all' ? allCards : Object.values(userCards)
  const filtered = filter === 'all'
    ? sourceCards
    : sourceCards.filter(c => c.type === filter)

  const userCount = Object.values(userCards).length

  return (
    <section className="card-builder">
      <header className="card-builder__header">
        <div>
          <p className="workspace-screen__eyebrow">Galeria kart</p>
          <h2>Karty</h2>
          <p className="card-builder__subtitle">
            {allCards.length} kart łącznie · {userCount} moich
          </p>
        </div>

        {/* Zakładki */}
        <div className="card-builder__tabs">
          <button
            className={`gallery-tab ${tab==='all'?'gallery-tab--active':''}`}
            onClick={() => { setTab('all'); setFilter('all') }}
          >
            🃏 Wszystkie ({allCards.length})
          </button>
          <button
            className={`gallery-tab ${tab==='mine'?'gallery-tab--active':''}`}
            onClick={() => { setTab('mine'); setFilter('all') }}
          >
            ✏ Moje ({userCount})
          </button>
        </div>

        {/* Filtry typów — dynamiczne */}
        <nav className="card-builder__filters" aria-label="Filtruj po typie">
          {activeTypes.map(type => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? '🃏 Wszystkie' : type}
            </button>
          ))}
        </nav>
      </header>

      {filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map(card => (
            <div
              key={card.id}
              className={`card-grid__item ${selected?.id === card.id ? 'card-grid__item--selected' : ''}`}
              onClick={() => setSelected(selected?.id === card.id ? null : card)}
            >
              <CardFrame card={card} width={160} height={235} />
              {/* Przycisk usunięcia tylko dla user cards */}
              {userCards[card.id] && (
                <button
                  className="card-grid__remove"
                  onClick={e => { e.stopPropagation(); removeCard(card.id); if (selected?.id === card.id) setSelected(null) }}
                  title="Usuń z galerii"
                >✕</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-builder__empty">
          {tab === 'mine'
            ? 'Brak własnych kart. Utwórz kartę w Card Editorze i kliknij "Dodaj do galerii".'
            : 'Brak kart dla tego filtra.'}
        </div>
      )}

      {/* Panel podglądu wybranej karty */}
      {selected && (
        <div className="card-preview-panel" onClick={() => setSelected(null)}>
          <div className="card-preview-panel__inner" onClick={e => e.stopPropagation()}>
            <button className="card-preview-panel__close" onClick={() => setSelected(null)}>✕</button>
            <CardFrame card={selected} width={240} height={353} />
            <div className="card-preview-panel__meta">
              <div className="card-preview-panel__name">{selected.name}</div>
              <div className="card-preview-panel__type">{selected.type}</div>
              <div className="card-preview-panel__desc">{selected.description}</div>
              {userCards[selected.id] && (
                <div className="card-preview-panel__badge">✏ Twoja karta</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
