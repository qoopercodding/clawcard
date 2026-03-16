import { useDevInspector } from '../../components/debug/DevInspector'
import type { CompanionCard } from '../../types/card.types'
import './CompanionFrame.css'

interface CompanionFrameProps {
  card: CompanionCard
  /** Jeśli true, kliknięcie karty otwiera DevInspector z danymi tej karty. Domyślnie true. */
  inspectable?: boolean
}

/**
 * Renderuje kartę companion w CSS-owym stylu z badgami statystyk.
 *
 * Kliknięcie karty automatycznie wpisuje jej obiekt do DevInspectora
 * (prawy sidebar). Wyłącz przez inspectable={false} jeśli potrzeba.
 *
 * Obiekty które renderuje:
 *   - CompanionCard.name         → banderola
 *   - CompanionCard.hp           → czerwony badge lewy-górny
 *   - CompanionCard.attack       → niebieski badge prawy-górny
 *   - CompanionCard.counter      → złoty badge dół-środek
 *   - CompanionCard.imageUrl     → obrazek w art area (lub emoji fallback)
 *   - CompanionCard.imageFallback → emoji gdy brak obrazka
 *   - CompanionCard.description  → opis w dolnej sekcji
 *
 * @param props.card         - Karta companion do wyrenderowania
 * @param props.inspectable  - Czy kliknięcie otwiera DevInspector (domyślnie true)
 *
 * @example
 * <CompanionFrame card={tuskCard} />
 * <CompanionFrame card={foxeeCard} inspectable={false} />
 */
export function CompanionFrame({ card, inspectable = true }: CompanionFrameProps) {
  const { inspect } = useDevInspector()

  function handleClick() {
    if (inspectable) {
      inspect(card, 'CompanionFrame')
    }
  }

  const artContent = card.imageUrl ? (
    <img className="companion-frame__image" src={card.imageUrl} alt={card.name} />
  ) : (
    <span className="companion-frame__emoji" aria-hidden="true">
      {card.imageFallback}
    </span>
  )

  return (
    <article
      className={`companion-frame ${inspectable ? 'companion-frame--inspectable' : ''}`}
      aria-label={`${card.name} companion card`}
      onClick={handleClick}
      title={inspectable ? 'Kliknij aby zbadać w Inspector' : undefined}
    >
      <div className="companion-frame__art">{artContent}</div>

      <div className="companion-frame__banner">
        <h2 className="companion-frame__name">{card.name}</h2>
      </div>

      <div className="companion-frame__description">
        <p>{card.description}</p>
      </div>

      {/* HP — lewy górny */}
      <div
        className="companion-frame__badge companion-frame__badge--hp"
        aria-label={`HP ${card.hp}`}
      >
        {card.hp}
      </div>

      {/* ATK — prawy górny */}
      <div
        className="companion-frame__badge companion-frame__badge--attack"
        aria-label={`Attack ${card.attack}`}
      >
        {card.attack}
      </div>

      {/* Counter — dół środek */}
      <div
        className="companion-frame__badge companion-frame__badge--counter"
        aria-label={`Counter ${card.counter}`}
      >
        {card.counter}
      </div>

      {/* Inspect hint — pojawia się przy hover gdy inspectable */}
      {inspectable && (
        <div className="companion-frame__inspect-hint" aria-hidden="true">
          🔍
        </div>
      )}
    </article>
  )
}
