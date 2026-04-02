import type { EnrichedCard } from './types'

interface CardMechanicsCardProps {
  card: EnrichedCard
  onKeywordClick: (keyword: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  approved: '✅ Zweryfikowane',
  pending: '🟡 W toku',
  needs_fix: '❌ Wymaga poprawki',
}

const GAME_EMOJI: Record<string, string> = {
  slay_the_spire: '⚔️',
  monster_train: '🚂',
  wildfrost: '❄️',
}

export function CardMechanicsCard({ card, onKeywordClick }: CardMechanicsCardProps) {
  return (
    <div className={`mech-card mech-card--${card.qa_status}`}>
      <div className="mech-card__top">
        <span className="mech-card__game">{GAME_EMOJI[card.game] || '🎮'}</span>
        <span className="mech-card__cost">{card.cost ?? '?'}</span>
      </div>

      <strong className="mech-card__name">{card.name}</strong>
      <span className="mech-card__type">{card.type} · {card.rarity}</span>

      <div className="mech-card__desc-divider" />

      <p className="mech-card__desc-raw" title="Oryginalny opis">
        {card.desc_raw}
      </p>

      <div className="mech-card__desc-divider" />

      <p className="mech-card__desc-clean">
        {card.desc_clean}
      </p>

      {card.keywords.length > 0 && (
        <div className="mech-card__keywords">
          {card.keywords.map(kw => (
            <button
              key={kw}
              className="mech-card__keyword-badge"
              onClick={() => onKeywordClick(kw)}
              title={card.keyword_details[kw]?.definition_short || kw}
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {card.mechanic_summary && (
        <p className="mech-card__summary">{card.mechanic_summary}</p>
      )}

      <div className="mech-card__footer">
        <span className={`mech-card__status mech-card__status--${card.qa_status}`}>
          {STATUS_LABELS[card.qa_status] || card.qa_status}
        </span>
        {card.qa_critic_score !== null && (
          <span className="mech-card__score">QA: {card.qa_critic_score}/5</span>
        )}
      </div>
    </div>
  )
}
