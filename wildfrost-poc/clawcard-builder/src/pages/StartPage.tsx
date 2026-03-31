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
  | 'map'
  | 'reward'
  | 'shop'
  | 'campfire'
  | 'event'
  | 'treasure'
  | 'game-over'
  | 'victory'
  | 'deck-view'
  | 'combat'
  | 'game'
  | 'dev-game'

interface StartPageProps {
  onSelectView: (view: Exclude<AppView, 'start'>) => void
}

interface NavCard {
  id: Exclude<AppView, 'start'>
  emoji: string
  title: string
  subtitle: string
  description: string
  badge?: string
  highlight?: boolean
  group: 'play' | 'tools' | 'dev'
}

const NAV_CARDS: NavCard[] = [
  {
    id: 'last-language', emoji: '📖', title: 'Ostatni Język', subtitle: 'Dark fantasy deck builder',
    description: 'Dwa decki: Karty + Słowa. Hive Mind. Tabu. Zapominanie.',
    badge: 'NOWE', highlight: true, group: 'play',
  },
  {
    id: 'grid-battle', emoji: '⚔️', title: 'Grid Battle', subtitle: 'Siatka 3×2 vs 3×2',
    description: 'Wildfrost-style walka na siatce. Countery, targetowanie, energy system.',
    badge: 'NOWE', highlight: true, group: 'play',
  },
  {
    id: 'battle', emoji: '🗡️', title: 'Battle Demo', subtitle: '1v1 demo',
    description: 'Klasyczna walka 1v1: Snow, Shield, Teeth, Poison, countery.',
    group: 'play',
  },
  {
    id: 'test-env', emoji: '🎮', title: 'Test Environment', subtitle: 'Symulacja runów',
    description: 'Wybierz karty do ręki → uruchom 2 runy → sprawdź balance report.',
    badge: 'NOWE', highlight: true, group: 'play',
  },
  {
    id: 'map', emoji: '🏰', title: 'Dungeon Map', subtitle: 'Proceduralna mapa',
    description: 'SVG mapa z 7 typami węzłów. Losowe generowanie, nawigacja po ścieżkach.',
    badge: 'NOWE', highlight: true, group: 'play',
  },
  {
    id: 'map-editor', emoji: '🗺️', title: 'Map Editor', subtitle: 'Edytor mapy',
    description: 'Twórz węzły i ścieżki. Przeciągaj, łącz, zmieniaj typy. Eksport JSON.',
    group: 'tools',
  },
  {
    id: 'card-editor', emoji: '✏️', title: 'Card Editor', subtitle: 'Tworzenie kart',
    description: 'Formularz z live preview. Zapis do biblioteki, eksport .js do kodu.',
    group: 'tools',
  },
  {
    id: 'frame-editor', emoji: '🖼', title: 'Frame Editor', subtitle: 'Kalibracja ramek',
    description: 'Przeciągaj prostokąty na PNG ramki. Zapisz nowy typ do kodu.',
    group: 'tools',
  },
  {
    id: 'frame-test', emoji: '🧪', title: 'Frame Test', subtitle: 'Test e2e',
    description: 'Weryfikuje PNG, FRAME_CONFIGS, Vite plugin i render kart.',
    badge: 'DEV', group: 'dev',
  },
  {
    id: 'gallery', emoji: '🃏', title: 'Galeria kart', subtitle: 'Browse & inspect',
    description: 'Karty z vanilla POC. Kliknij kartę → dane w Dev Inspector.',
    group: 'tools',
  },
  {
    id: 'dev-game', emoji: '🔬', title: 'Dev Game', subtitle: 'Hover inspector',
    description: 'Game screen z aktywnym Hover Inspector.',
    badge: 'DEV', group: 'dev',
  },
]

const GROUP_LABELS: Record<string, string> = {
  play: 'Play & Battle',
  tools: 'Builder Tools',
  dev: 'Developer',
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  style: {
    '--size': `${2 + Math.random() * 5}px`,
    '--duration': `${6 + Math.random() * 10}s`,
    '--delay': `${Math.random() * 8}s`,
    '--drift-y': `${-100 - Math.random() * 200}px`,
    '--drift-x': `${-50 + Math.random() * 100}px`,
    '--peak-opacity': `${0.2 + Math.random() * 0.5}`,
    left: `${5 + Math.random() * 90}%`,
    bottom: `${-5 + Math.random() * 25}%`,
  } as React.CSSProperties,
}))

const groups = ['play', 'tools', 'dev'] as const

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
          Dark fantasy roguelike deck builder — twórz karty, mechaniki i mapy
        </p>
        <div className="start-page__divider" />
      </section>

      {groups.map(group => {
        const cards = NAV_CARDS.filter(c => c.group === group)
        return (
          <section key={group} className="start-page__section">
            <h2 className="start-page__section-title">{GROUP_LABELS[group]}</h2>
            <div className="start-page__grid">
              {cards.map(card => (
                <button
                  key={card.id}
                  className={`nav-card ${card.highlight ? 'nav-card--highlight' : ''}`}
                  type="button"
                  onClick={() => onSelectView(card.id)}
                >
                  <div className="nav-card__icon-wrap">
                    <span className="nav-card__emoji">{card.emoji}</span>
                  </div>
                  <div className="nav-card__body">
                    <div className="nav-card__header">
                      <strong className="nav-card__title">{card.title}</strong>
                      {card.badge && (
                        <span className={`nav-card__badge ${card.badge === 'NOWE' ? 'nav-card__badge--hot' : 'nav-card__badge--dev'}`}>
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <span className="nav-card__subtitle">{card.subtitle}</span>
                    <span className="nav-card__description">{card.description}</span>
                  </div>
                  <div className="nav-card__glow" />
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <footer className="start-page__footer">
        <span>ClawCard v1.5</span>
        <span className="start-page__separator">·</span>
        <span>Dark Fantasy Deck Builder</span>
      </footer>
    </main>
  )
}
