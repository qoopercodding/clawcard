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
  | 'card-browser'
  | 'combat'
  | 'game'
  | 'dev-game'
  | 'battle-showcase'
  | 'card-mechanics'

interface StartPageProps {
  onSelectView: (view: Exclude<AppView, 'start'>) => void
  hasSavedRun?: boolean
  onContinueRun?: () => void
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
    id: 'battle-showcase', emoji: '📋', title: 'Battle Showcase', subtitle: 'Epiki 0–11',
    description: 'Interaktywny showcase systemu walki. Dropdown epików, live preview.',
    badge: 'NOWE', highlight: true, group: 'play',
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
    id: 'card-browser', emoji: '📚', title: 'Card Library', subtitle: '668 kart z 3 gier',
    description: 'Przeglądaj karty z StS, Monster Train i Wildfrost z obrazkami.',
    badge: 'NOWE', highlight: true, group: 'tools',
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
  {
    id: 'card-mechanics', emoji: '🧠', title: 'Mechaniki Kart', subtitle: 'Epic 7 — Enrichment Pipeline',
    description: 'Wzbogacone karty z wiki-weryfikacją, keywords, i mechanic browser.',
    badge: 'NOWE', highlight: true, group: 'tools',
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

import { useState } from 'react'
import { getBestScore, getTotalRuns, getWinRate } from '../store/runHistory'

const groups = ['play', 'tools', 'dev'] as const

type HubMode = 'hub' | 'legacy' | 'new'

export function StartPage({ onSelectView, hasSavedRun, onContinueRun }: StartPageProps) {
  const [hubMode, setHubMode] = useState<HubMode>('hub')
  const totalRuns = getTotalRuns()
  const bestScore = getBestScore()
  const winRate = getWinRate()

  const renderHero = () => (
    <section className="start-page__hero">
      <p className="start-page__eyebrow">ClawCard Builder</p>
      <h1 className="start-page__title">
        Forge Your <span className="start-page__gold">Destiny</span>
      </h1>
      <p className="start-page__lead">
        Dark fantasy roguelike deck builder — twórz karty, mechaniki i mapy
      </p>
      <div className="start-page__divider" />

      {hasSavedRun && (
        <button
          type="button"
          className="start-page__continue"
          onClick={onContinueRun}
        >
          Continue Run
        </button>
      )}

      {totalRuns > 0 && (
        <div className="start-page__stats">
          <span>Runs: {totalRuns}</span>
          <span className="start-page__separator">·</span>
          <span>Best: {bestScore}</span>
          <span className="start-page__separator">·</span>
          <span>Win Rate: {winRate}%</span>
        </div>
      )}
    </section>
  )

  const renderHub = () => (
    <section className="start-page__hub">
      <div className="hub-tiles">
        <button
          className="hub-tile hub-tile--new"
          type="button"
          onClick={() => setHubMode('new')}
        >
          <div className="hub-tile__glow" />
          <span className="hub-tile__emoji">✨</span>
          <strong className="hub-tile__title">Nowe Rzeczy</strong>
          <span className="hub-tile__subtitle">WOEC — nowe eksperymenty</span>
          <span className="hub-tile__desc">Nowe prototypy i mechaniki w rozwoju</span>
        </button>

        <button
          className="hub-tile hub-tile--legacy"
          type="button"
          onClick={() => setHubMode('legacy')}
        >
          <div className="hub-tile__glow" />
          <span className="hub-tile__emoji">📦</span>
          <strong className="hub-tile__title">Stare POC</strong>
          <span className="hub-tile__subtitle">Wszystkie prototypy</span>
          <span className="hub-tile__desc">Oryginalne proof-of-concept ekrany i narzędzia</span>
        </button>
      </div>
    </section>
  )

  const NEW_CARDS: NavCard[] = [
    {
      id: 'card-mechanics', emoji: '🧠', title: 'Mechaniki Kart', subtitle: 'Epic 7 — Enrichment Pipeline',
      description: 'Wzbogacone karty z wiki-weryfikacją, keywords, i mechanic browser.',
      badge: 'NOWE', highlight: true, group: 'tools',
    },
  ]

  const renderNew = () => (
    <section className="start-page__section">
      <div className="start-page__back-row">
        <button className="start-page__back" type="button" onClick={() => setHubMode('hub')}>
          ← Powrót
        </button>
        <h2 className="start-page__section-title">Nowe Rzeczy</h2>
      </div>
      <div className="start-page__grid">
        {NEW_CARDS.map(card => (
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

  const renderLegacy = () => (
    <>
      <div className="start-page__back-row">
        <button className="start-page__back" type="button" onClick={() => setHubMode('hub')}>
          ← Powrót
        </button>
        <h2 className="start-page__section-title" style={{ margin: 0 }}>Stare POC</h2>
      </div>
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
    </>
  )

  return (
    <main className="start-page">
      <div className="start-page__bg-pulse" />
      <div className="start-page__particles">
        {PARTICLES.map(p => (
          <div key={p.id} className="start-page__particle" style={p.style} />
        ))}
      </div>

      {renderHero()}

      {hubMode === 'hub' && renderHub()}
      {hubMode === 'new' && renderNew()}
      {hubMode === 'legacy' && renderLegacy()}

      <footer className="start-page__footer">
        <span>ClawCard v1.5</span>
        <span className="start-page__separator">·</span>
        <span>Dark Fantasy Deck Builder</span>
      </footer>
    </main>
  )
}
