import { useState, useCallback } from 'react'
import { HoverTooltip } from './components/debug/HoverTooltip'
import { useDevInspector } from './components/debug/DevInspector'
import RunHUD from './components/RunHUD'
import { useRunState } from './store/useRunState'
import { CardBuilderScreen } from './modules/card-builder/CardBuilderScreen'
import { CardEditorScreen } from './modules/card-editor/CardEditorScreen'
import { FrameEditorScreen } from './modules/frame-editor/FrameEditorScreen'
import { FrameConfigTest } from './modules/frame-editor/FrameConfigTest'
import { BattleDemoScreen } from './modules/battle-demo/BattleDemoScreen'
import { GridBattleScreen } from './modules/battle-demo/GridBattleScreen'
import { TestEnvScreen } from './modules/test-env/TestEnvScreen'
import { LastLanguageScreen } from './modules/last-language/LastLanguageScreen'
import MapEditorScreen from './modules/map-editor/MapEditorScreen'
import MapScreen from './pages/MapScreen'
import RewardScreen from './pages/RewardScreen'
import ShopScreen from './pages/ShopScreen'
import CampfireScreen from './pages/CampfireScreen'
import EventScreen from './pages/EventScreen'
import TreasureScreen from './pages/TreasureScreen'
import GameOverScreen from './pages/GameOverScreen'
import DeckViewScreen from './pages/DeckViewScreen'
import CombatScreen from './pages/CombatScreen'
import GameScreen from './pages/GameScreen'
import { StartPage } from './pages/StartPage'
import type { AppView } from './pages/StartPage'
import type { MapNodeType } from './store/GameState'
import './App.css'

interface NavItem {
  id: Exclude<AppView, 'start'>
  icon: string
  label: string
  group: 'play' | 'tools' | 'dev'
}

const NAV_ITEMS: NavItem[] = [
  { id: 'last-language', icon: '\u{1F4D6}', label: 'Ostatni Jezyk', group: 'play' },
  { id: 'grid-battle',   icon: '\u{2694}\uFE0F',  label: 'Grid Battle',    group: 'play' },
  { id: 'battle',        icon: '\u{1F5E1}\uFE0F',  label: 'Battle Demo',    group: 'play' },
  { id: 'test-env',      icon: '\u{1F3AE}', label: 'Test Env',       group: 'play' },
  { id: 'map',           icon: '\u{1F3F0}', label: 'Dungeon Map',    group: 'play' },
  { id: 'card-editor',   icon: '\u{270F}\uFE0F',  label: 'Card Editor',    group: 'tools' },
  { id: 'frame-editor',  icon: '\u{1F5BC}',  label: 'Frame Editor',   group: 'tools' },
  { id: 'map-editor',    icon: '\u{1F5FA}\uFE0F',  label: 'Map Editor',     group: 'tools' },
  { id: 'gallery',       icon: '\u{1F0CF}', label: 'Galeria',        group: 'tools' },
  { id: 'frame-test',    icon: '\u{1F9EA}', label: 'Frame Test',     group: 'dev' },
  { id: 'dev-game',      icon: '\u{1F52C}', label: 'Dev Game',       group: 'dev' },
]

const NODE_VIEW_MAP: Record<MapNodeType, AppView> = {
  combat: 'grid-battle',
  elite: 'grid-battle',
  boss: 'grid-battle',
  shop: 'shop',
  campfire: 'campfire',
  event: 'event',
  treasure: 'treasure',
}

const RUN_VIEWS = new Set<AppView>(['map', 'reward', 'shop', 'campfire', 'event', 'treasure', 'game-over', 'victory'])

function App() {
  const [view, setView] = useState<AppView>('start')
  const [prevView, setPrevView] = useState<AppView>('map')
  const [combatTier, setCombatTier] = useState<'combat' | 'elite' | 'boss'>('combat')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const { toggle: toggleInspector, isOpen: inspectorOpen } = useDevInspector()
  const runState = useRunState()

  const handleNavigate = (v: string) => {
    setView(v as AppView)
  }

  const handleStartRun = useCallback(() => {
    runState.startRun()
    setView('map')
  }, [runState.startRun])

  const handleMapNode = useCallback((_nodeId: string, type: MapNodeType) => {
    runState.advanceFloor()
    if (type === 'combat' || type === 'elite' || type === 'boss') {
      setCombatTier(type)
      setView('combat')
    } else {
      const target = NODE_VIEW_MAP[type]
      if (target) setView(target)
    }
  }, [runState.advanceFloor])

  const handleReturnToMap = useCallback(() => {
    if (runState.run && runState.run.player.hp <= 0) {
      setView('game-over')
    } else {
      setView('map')
    }
  }, [runState.run])

  const handleNewRun = useCallback(() => {
    runState.startRun()
    setView('map')
  }, [runState.startRun])

  const p = runState.run?.player
  const showHUD = RUN_VIEWS.has(view) && runState.isRunActive && p

  function renderView() {
    switch (view) {
      case 'start':          return <StartPage
        hasSavedRun={runState.hasSavedRun}
        onContinueRun={() => setView('map')}
        onSelectView={(v) => {
          if (v === 'map') { handleStartRun(); return }
          setView(v)
        }}
      />
      case 'last-language':  return <LastLanguageScreen />
      case 'battle':         return <BattleDemoScreen />
      case 'grid-battle':    return <GridBattleScreen />
      case 'gallery':        return <CardBuilderScreen />
      case 'card-editor':    return <CardEditorScreen />
      case 'frame-editor':   return <FrameEditorScreen onNavigate={handleNavigate} />
      case 'frame-test':     return <FrameConfigTest />
      case 'test-env':       return <TestEnvScreen />
      case 'map':            return <MapScreen onSelectNode={handleMapNode} />
      case 'reward':         return <RewardScreen
        gold={runState.run?.player.gold}
        onPickCard={(card) => {
          runState.addCardToDeck({ ...card, upgraded: false })
          runState.addScore(50)
          handleReturnToMap()
        }}
        onSkip={handleReturnToMap}
      />
      case 'shop':           return <ShopScreen
        playerGold={runState.run?.player.gold}
        onBuy={(item) => {
          runState.addGold(-item.price)
          if (item.type === 'card') {
            runState.addCardToDeck({
              id: `shop-${item.id}-${Date.now()}`,
              name: item.name, emoji: item.emoji, cost: 1,
              attack: 0, hp: 0, description: item.description,
              rarity: item.rarity, upgraded: false,
            })
          }
        }}
        onLeave={handleReturnToMap}
      />
      case 'campfire':       return <CampfireScreen
        playerHp={p?.hp}
        maxHp={p?.maxHp}
        onRest={(healed) => { runState.heal(healed); handleReturnToMap() }}
        onLeave={handleReturnToMap}
      />
      case 'event':          return <EventScreen
        onComplete={(effect, value) => {
          if (effect === 'gain_gold') runState.addGold(value)
          else if (effect === 'heal') runState.heal(value)
          else if (effect === 'lose_hp') runState.takeDamage(value)
          else if (effect === 'gain_max_hp') runState.addMaxHp(value)
          else if (effect === 'lose_gold') runState.addGold(-value)
        }}
        onLeave={handleReturnToMap}
      />
      case 'treasure':       return <TreasureScreen
        onTake={(item) => {
          if (item.type === 'gold') runState.addGold(item.value)
          runState.addScore(30)
        }}
        onLeave={handleReturnToMap}
      />
      case 'game-over':      return <GameOverScreen
        victory={false}
        stats={{ floorsCleared: runState.run?.floor ?? 0, goldEarned: runState.run?.gold ?? 0 }}
        onRestart={handleNewRun}
        onMenu={() => setView('start')}
      />
      case 'combat':         return <CombatScreen
        tier={combatTier}
        playerHp={p?.hp}
        playerMaxHp={p?.maxHp}
        deckSize={runState.run?.deck.cards.length}
        onVictory={(_dealt, taken) => {
          runState.takeDamage(taken)
          runState.addGold(15 + (combatTier === 'elite' ? 20 : combatTier === 'boss' ? 50 : 0))
          runState.addScore(combatTier === 'boss' ? 200 : combatTier === 'elite' ? 100 : 50)
          if (combatTier === 'boss') { setView('victory') }
          else { setView('reward') }
        }}
        onDefeat={() => { runState.endRun('lost'); setView('game-over') }}
      />
      case 'deck-view':      return <DeckViewScreen cards={runState.run?.deck.cards} onClose={() => setView(prevView)} />
      case 'victory':        return <GameOverScreen
        victory={true}
        stats={{ floorsCleared: runState.run?.floor ?? 0, goldEarned: runState.run?.gold ?? 0 }}
        onRestart={handleNewRun}
        onMenu={() => setView('start')}
      />
      case 'map-editor':     return <MapEditorScreen />
      case 'game':           return <GameScreen />
      case 'dev-game':
        return (<><HoverTooltip /><GameScreen /></>)
      default: return <StartPage onSelectView={setView} />
    }
  }

  const isStart = view === 'start'

  return (
    <div className={`app-shell ${!isStart ? 'app-shell--with-sidebar' : ''}`}>
      {!isStart && (
        <nav
          className={`sidebar ${sidebarExpanded ? 'sidebar--expanded' : ''}`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <button
            className="sidebar__home"
            type="button"
            onClick={() => setView('start')}
            title="Start"
          >
            <span className="sidebar__home-icon">CC</span>
            {sidebarExpanded && <span className="sidebar__home-label">ClawCard</span>}
          </button>

          <div className="sidebar__divider" />

          {(['play', 'tools', 'dev'] as const).map(group => (
            <div key={group} className="sidebar__group">
              {sidebarExpanded && (
                <span className="sidebar__group-label">
                  {group === 'play' ? 'Play' : group === 'tools' ? 'Tools' : 'Dev'}
                </span>
              )}
              {NAV_ITEMS.filter(n => n.group === group).map(item => (
                <button
                  key={item.id}
                  className={`sidebar__item ${view === item.id ? 'sidebar__item--active' : ''}`}
                  type="button"
                  onClick={() => setView(item.id)}
                  title={item.label}
                >
                  <span className="sidebar__item-icon">{item.icon}</span>
                  {sidebarExpanded && <span className="sidebar__item-label">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <button
            className={`sidebar__item sidebar__item--inspector ${inspectorOpen ? 'sidebar__item--active' : ''}`}
            type="button"
            onClick={toggleInspector}
            title="Dev Inspector (Ctrl+Shift+D)"
          >
            <span className="sidebar__item-icon">{'\u{1F50D}'}</span>
            {sidebarExpanded && <span className="sidebar__item-label">Inspector</span>}
          </button>
        </nav>
      )}

      <div className="app-shell__content">
        {showHUD && (
          <RunHUD
            hp={p.hp}
            maxHp={p.maxHp}
            gold={runState.run!.gold}
            floor={runState.run!.floor}
            relicCount={0}
            deckSize={runState.run!.deck.cards.length}
            onDeckClick={() => { setPrevView(view); setView('deck-view') }}
          />
        )}
        {renderView()}
      </div>
    </div>
  )
}

export default App
