import { useState } from 'react'
import { ENRICHED_CARDS, TOTAL_CARDS } from '../../data/enriched'
import { CardMechanicsCard } from './CardMechanicsCard'
import { KeywordPanel } from './KeywordPanel'

export function CardMechanicsView() {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'needs_fix'>('all')

  const filtered = filter === 'all'
    ? ENRICHED_CARDS
    : ENRICHED_CARDS.filter(c => c.qa_status === filter)

  const approvedCount = ENRICHED_CARDS.filter(c => c.qa_status === 'approved').length
  const progressPct = Math.round((ENRICHED_CARDS.length / TOTAL_CARDS) * 100)

  // Collect all unique keywords
  const allKeywords = Array.from(
    new Set(ENRICHED_CARDS.flatMap(c => c.keywords))
  ).sort()

  return (
    <div className="card-mechanics">
      <header className="card-mechanics__header">
        <div className="card-mechanics__title-row">
          <h1 className="card-mechanics__title">Mechaniki Kart</h1>
          <span className="card-mechanics__progress">
            {ENRICHED_CARDS.length}/{TOTAL_CARDS} kart
          </span>
        </div>

        <div className="card-mechanics__progress-bar">
          <div
            className="card-mechanics__progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="card-mechanics__stats">
          <span>✅ {approvedCount} approved</span>
          <span>📊 Avg QA: {(ENRICHED_CARDS.reduce((s, c) => s + (c.qa_critic_score || 0), 0) / ENRICHED_CARDS.length).toFixed(1)}/5</span>
          <span>🔑 {allKeywords.length} keywords</span>
        </div>

        <div className="card-mechanics__filters">
          {(['all', 'approved', 'pending', 'needs_fix'] as const).map(f => (
            <button
              key={f}
              className={`card-mechanics__filter ${filter === f ? 'card-mechanics__filter--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Wszystkie' : f === 'approved' ? '✅ OK' : f === 'pending' ? '🟡 Pending' : '❌ Fix'}
            </button>
          ))}
        </div>
      </header>

      <div className="card-mechanics__body">
        <div className="card-mechanics__grid">
          {filtered.map(card => (
            <CardMechanicsCard
              key={card.id}
              card={card}
              onKeywordClick={setSelectedKeyword}
            />
          ))}
        </div>

        {selectedKeyword && (
          <div className="card-mechanics__panel-overlay" onClick={() => setSelectedKeyword(null)}>
            <div onClick={e => e.stopPropagation()}>
              <KeywordPanel
                keyword={selectedKeyword}
                onClose={() => setSelectedKeyword(null)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card-mechanics__keyword-bar">
        <span className="card-mechanics__keyword-bar-label">Keywords:</span>
        {allKeywords.map(kw => (
          <button
            key={kw}
            className={`card-mechanics__keyword-tag ${selectedKeyword === kw ? 'card-mechanics__keyword-tag--active' : ''}`}
            onClick={() => setSelectedKeyword(selectedKeyword === kw ? null : kw)}
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  )
}
