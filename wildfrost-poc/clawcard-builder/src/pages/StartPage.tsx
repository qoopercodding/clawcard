export type AppView =
  | 'start'
  | 'battle'
  | 'gallery'
  | 'card-editor'
  | 'frame-editor'
  | 'frame-test'
  | 'test-env'
  | 'game'
  | 'dev-game'

interface StartPageProps {
  onSelectView: (view: Exclude<AppView, 'start'>) => void
}

interface StartOption {
  id: Exclude<AppView, 'start'>
  emoji: string
  title: string
  subtitle: string
  description: string
  badge?: string
  highlight?: boolean
}

const START_OPTIONS: StartOption[] = [
  {
    id: 'battle', emoji: '⚔️', title: 'Battle Demo', subtitle: 'Grywalne demo',
    description: 'Pełna walka: Snow, Shield, Teeth, Poison, countery, 5 wrogów.',
    badge: 'NOWE', highlight: true,
  },
  {
    id: 'test-env', emoji: '🎮', title: 'Test Environment', subtitle: 'Symulacja runów',
    description: 'Wybierz karty do ręki → uruchom 2 runy → sprawdź balance report.',
    badge: 'NOWE', highlight: true,
  },
  {
    id: 'card-editor', emoji: '✏️', title: 'Card Editor', subtitle: 'Tworzenie kart',
    description: 'Formularz z live preview. Zapis do biblioteki, eksport .js do kodu.',
  },
  {
    id: 'frame-editor', emoji: '🗺', title: 'Frame Editor', subtitle: 'Kalibracja ramek',
    description: 'Przeciągaj prostokąty na PNG ramki. Zapisz nowy typ do kodu.',
  },
  {
    id: 'frame-test', emoji: '🧪', title: 'Frame Test', subtitle: 'Test e2e',
    description: 'Weryfikuje PNG, FRAME_CONFIGS, Vite plugin i render kart.',
    badge: 'DEV',
  },
  {
    id: 'gallery', emoji: '🃏', title: 'Galeria kart', subtitle: 'Browse & inspect',
    description: 'Karty z vanilla POC. Kliknij kartę → dane w Dev Inspector.',
  },
  {
    id: 'dev-game', emoji: '🔬', title: 'Dev Game', subtitle: 'Hover inspector',
    description: 'Game screen z aktywnym Hover Inspector.',
  },
]

export function StartPage({ onSelectView }: StartPageProps) {
  return (
    <main className="start-page">
      <section className="start-page__hero">
        <p className="start-page__eyebrow">ClawCard Builder</p>
        <h1>Wybierz moduł</h1>
        <p className="start-page__lead">Battle Demo · Card Editor · Frame Editor · Galeria</p>
      </section>
      <section className="start-page__grid">
        {START_OPTIONS.map(option => (
          <button
            key={option.id}
            className={`start-option ${option.highlight ? 'start-option--highlight' : ''}`}
            type="button"
            onClick={() => onSelectView(option.id)}
          >
            <span className="start-option__emoji">{option.emoji}</span>
            <div className="start-option__header">
              <strong className="start-option__title">{option.title}</strong>
              {option.badge && (
                <span className={`start-option__badge ${option.highlight ? 'start-option__badge--hot' : ''}`}>
                  {option.badge}
                </span>
              )}
            </div>
            <span className="start-option__subtitle">{option.subtitle}</span>
            <span className="start-option__description">{option.description}</span>
          </button>
        ))}
      </section>
    </main>
  )
}
