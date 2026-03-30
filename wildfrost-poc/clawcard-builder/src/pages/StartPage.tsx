export type AppView =
  | 'start'
  | 'last-language'
  | 'battle'
  | 'grid-battle'
  | 'gallery'
  | 'card-editor'
  | 'frame-editor'
  | 'frame-test'
  | 'test-env'
  | 'map-editor'
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
    id: 'last-language', emoji: '📖', title: 'Ostatni Język', subtitle: 'Dark fantasy deck builder',
    description: 'Dwa decki: Karty + Słowa. Hive Mind. Tabu. Zapominanie.',
    badge: 'NOWE', highlight: true,
  },
  {
    id: 'grid-battle', emoji: '⚔️', title: 'Grid Battle', subtitle: 'Siatka 3×2 vs 3×2',
    description: 'Wildfrost-style walka na siatce. Countery, targetowanie, energy system, 4 fale wrogów.',
    badge: 'NOWE', highlight: true,
  },
  {
    id: 'battle', emoji: '🗡️', title: 'Battle Demo', subtitle: '1v1 demo',
    description: 'Klasyczna walka 1v1: Snow, Shield, Teeth, Poison, countery.',
  },
  {
    id: 'test-env', emoji: '🎮', title: 'Test Environment', subtitle: 'Symulacja runów',
    description: 'Wybierz karty do ręki → uruchom 2 runy → sprawdź balance report.',
    badge: 'NOWE', highlight: true,
  },
  {
    id: 'map-editor', emoji: '🗺️', title: 'Map Editor', subtitle: 'Edytor mapy',
    description: 'Twórz węzły i ścieżki. Przeciągaj, łącz, zmieniaj typy. Eksport JSON.',
  },
  {
    id: 'card-editor', emoji: '✏️', title: 'Card Editor', subtitle: 'Tworzenie kart',
    description: 'Formularz z live preview. Zapis do biblioteki, eksport .js do kodu.',
  },
  {
    id: 'frame-editor', emoji: '🖼', title: 'Frame Editor', subtitle: 'Kalibracja ramek',
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

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    '--size': `${2 + Math.random() * 4}px`,
    '--duration': `${6 + Math.random() * 8}s`,
    '--delay': `${Math.random() * 6}s`,
    '--drift-y': `${-80 - Math.random() * 160}px`,
    '--drift-x': `${-40 + Math.random() * 80}px`,
    '--peak-opacity': `${0.25 + Math.random() * 0.45}`,
    left: `${5 + Math.random() * 90}%`,
    bottom: `${-5 + Math.random() * 30}%`,
  } as React.CSSProperties,
}))

export function StartPage({ onSelectView }: StartPageProps) {
  return (
    <main className="start-page">
      <div className="start-page__bg-pulse" />
      <div className="start-page__particles">
        {PARTICLES.map(p => (
          <div key={p.id} className="start-page__particle" style={p.style} />
        ))}
      </div>
      <section className="start-page__hero">
        <p className="start-page__eyebrow">ClawCard Builder</p>
        <h1 className="start-page__title">
          Forge Your <span className="start-page__gold">Destiny</span>
        </h1>
        <p className="start-page__lead">
          Narzędzia do tworzenia kart, ramek, map i mechanik dark fantasy deck buildera
        </p>
        <div className="start-page__divider" />
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
            <div className="start-option__body">
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
            </div>
          </button>
        ))}
      </section>
      <footer className="start-page__footer">
        <span>ClawCard v1.4</span>
        <span className="start-page__separator">·</span>
        <span>Dark Fantasy Deck Builder</span>
      </footer>
    </main>
  )
}
