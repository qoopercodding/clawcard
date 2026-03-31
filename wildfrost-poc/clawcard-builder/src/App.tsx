import { useState } from 'react'
import { HoverTooltip } from './components/debug/HoverTooltip'
import { useDevInspector } from './components/debug/DevInspector'
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
import GameScreen from './pages/GameScreen'
import { StartPage } from './pages/StartPage'
import type { AppView } from './pages/StartPage'
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

function App() {
  const [view, setView] = useState<AppView>('start')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const { toggle: toggleInspector, isOpen: inspectorOpen } = useDevInspector()

  const handleNavigate = (v: string) => {
    setView(v as AppView)
  }

  function renderView() {
    switch (view) {
      case 'start':          return <StartPage onSelectView={setView} />
      case 'last-language':  return <LastLanguageScreen />
      case 'battle':         return <BattleDemoScreen />
      case 'grid-battle':    return <GridBattleScreen />
      case 'gallery':        return <CardBuilderScreen />
      case 'card-editor':    return <CardEditorScreen />
      case 'frame-editor':   return <FrameEditorScreen onNavigate={handleNavigate} />
      case 'frame-test':     return <FrameConfigTest />
      case 'test-env':       return <TestEnvScreen />
      case 'map':            return <MapScreen />
      case 'reward':         return <RewardScreen onSkip={() => setView('map')} />
      case 'shop':           return <ShopScreen onLeave={() => setView('map')} />
      case 'campfire':       return <CampfireScreen onLeave={() => setView('map')} />
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
        {renderView()}
      </div>
    </div>
  )
}

export default App
