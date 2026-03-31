import { useState, useMemo } from 'react'
import cardLibrary from '../data/cardLibrary.json'

interface LibCard {
  id: string
  name: string
  source: string
  category: string
  type: string
  rarity: string
  cost: number | null
  attack?: number | null
  health?: number | null
  counter?: number | null
  description: string
  image?: string | null
  traits?: string[]
  tags?: string[]
}

const cards = cardLibrary as LibCard[]

const SOURCES = [...new Set(cards.map(c => c.source))].sort()
const TYPES = [...new Set(cards.map(c => c.type))].sort()
const RARITIES = [...new Set(cards.map(c => c.rarity))].sort()

const SOURCE_LABELS: Record<string, string> = {
  slay_the_spire: 'Slay the Spire',
  monster_train: 'Monster Train',
  wildfrost: 'Wildfrost',
}

const SOURCE_COLORS: Record<string, string> = {
  slay_the_spire: '#3b82f6',
  monster_train: '#e05555',
  wildfrost: '#86efac',
}

const PAGE_SIZE = 40

interface CardBrowserScreenProps {
  onClose?: () => void
}

export default function CardBrowserScreen({ onClose }: CardBrowserScreenProps) {
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [rarity, setRarity] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<LibCard | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cards.filter(c => {
      if (source !== 'all' && c.source !== source) return false
      if (type !== 'all' && c.type !== type) return false
      if (rarity !== 'all' && c.rarity !== rarity) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, source, type, rarity])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageCards = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const withImages = filtered.filter(c => c.image).length

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <h2 style={{
          fontFamily: 'var(--font-gothic)', color: 'var(--color-gold)',
          margin: 0, fontSize: '1.3rem',
        }}>Card Library</h2>
        <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>
          {filtered.length} cards ({withImages} with images)
        </span>
        {onClose && (
          <button type="button" onClick={onClose} style={{
            marginLeft: 'auto', background: 'none',
            border: '1px solid rgba(200,144,42,0.15)', borderRadius: 6,
            color: 'var(--color-text-dim)', padding: '4px 12px', cursor: 'pointer',
            fontSize: '0.7rem',
          }}>Close</button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16,
        padding: '12px 16px', borderRadius: 10,
        background: 'rgba(42,26,10,0.5)', border: '1px solid rgba(200,144,42,0.08)',
      }}>
        <input
          type="text" placeholder="Search cards..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          style={{
            flex: '1 1 200px', padding: '6px 12px', borderRadius: 6,
            border: '1px solid rgba(200,144,42,0.15)', background: 'rgba(26,14,5,0.8)',
            color: 'var(--color-text)', fontSize: '0.8rem',
          }}
        />
        <select value={source} onChange={e => { setSource(e.target.value); setPage(0) }}
          style={selectStyle}>
          <option value="all">All Games</option>
          {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(0) }}
          style={selectStyle}>
          <option value="all">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={rarity} onChange={e => { setRarity(e.target.value); setPage(0) }}
          style={selectStyle}>
          <option value="all">All Rarities</option>
          {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        {pageCards.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelected(card)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, padding: '10px 8px',
              border: `1px solid ${selected?.id === card.id ? 'var(--color-gold)' : 'rgba(200,144,42,0.1)'}`,
              borderRadius: 10,
              background: selected?.id === card.id
                ? 'rgba(200,144,42,0.08)'
                : 'linear-gradient(180deg, rgba(42,26,10,0.6), rgba(26,14,5,0.9))',
              color: 'var(--color-text)', cursor: 'pointer',
              transition: 'all 150ms ease', textAlign: 'center',
            }}
          >
            {card.image ? (
              <img
                src={card.image} alt={card.name}
                style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 6 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: 6,
                background: 'rgba(200,144,42,0.05)', fontSize: '1.8rem',
              }}>🃏</div>
            )}
            <strong style={{
              fontFamily: 'var(--font-gothic)', fontSize: '0.68rem',
              lineHeight: 1.2, maxHeight: '2.4em', overflow: 'hidden',
            }}>{card.name}</strong>
            <span style={{
              fontSize: '0.55rem', color: SOURCE_COLORS[card.source] || 'var(--color-text-dim)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{SOURCE_LABELS[card.source] || card.source}</span>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}
            style={pageBtnStyle}>Prev</button>
          <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', alignSelf: 'center' }}>
            {page + 1} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            style={pageBtnStyle}>Next</button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
        }} onClick={() => setSelected(null)}>
          <div style={{
            maxWidth: 420, width: '90%', padding: 28, borderRadius: 16,
            background: 'linear-gradient(180deg, #2a1a0a, #1a0e05)',
            border: '1px solid rgba(200,144,42,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 16 }}>
              {selected.image ? (
                <img src={selected.image} alt={selected.name}
                  style={{ width: 120, height: 160, objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <div style={{
                  width: 120, height: 160, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'rgba(200,144,42,0.05)',
                  borderRadius: 8, fontSize: '3rem',
                }}>🃏</div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: 'var(--font-gothic)', color: 'var(--color-text)',
                  margin: '0 0 4px', fontSize: '1.1rem',
                }}>{selected.name}</h3>
                <span style={{
                  fontSize: '0.65rem', color: SOURCE_COLORS[selected.source],
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{SOURCE_LABELS[selected.source]}</span>
                <div style={{
                  display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap',
                  fontSize: '0.7rem', color: 'var(--color-text-dim)',
                }}>
                  <span>Type: {selected.type}</span>
                  <span>Rarity: {selected.rarity}</span>
                  {selected.cost !== null && <span>Cost: {selected.cost}</span>}
                  {selected.attack != null && <span>ATK: {selected.attack}</span>}
                  {selected.health != null && <span>HP: {selected.health}</span>}
                  {selected.counter != null && <span>Counter: {selected.counter}</span>}
                </div>
              </div>
            </div>
            <p style={{
              marginTop: 12, fontSize: '0.8rem', color: 'var(--color-text-dim)',
              lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>{selected.description || 'No description.'}</p>
            {selected.traits && selected.traits.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.traits.map(t => (
                  <span key={t} style={{
                    fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(200,144,42,0.1)', color: 'var(--color-gold)',
                    border: '1px solid rgba(200,144,42,0.2)',
                  }}>{t}</span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setSelected(null)} style={{
              marginTop: 16, width: '100%', padding: '8px',
              background: 'none', border: '1px solid rgba(200,144,42,0.15)',
              borderRadius: 6, color: 'var(--color-text-dim)',
              cursor: 'pointer', fontSize: '0.72rem',
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6,
  border: '1px solid rgba(200,144,42,0.15)', background: 'rgba(26,14,5,0.8)',
  color: 'var(--color-text)', fontSize: '0.75rem',
}

const pageBtnStyle: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 6,
  border: '1px solid rgba(200,144,42,0.15)', background: 'rgba(42,26,10,0.6)',
  color: 'var(--color-text-dim)', cursor: 'pointer', fontSize: '0.72rem',
  fontFamily: 'var(--font-gothic)',
}
