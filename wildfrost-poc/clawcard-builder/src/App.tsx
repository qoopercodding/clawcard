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
import GameScreen from './pages/GameScreen'
import { StartPage } from './pages/StartPage'
import type { AppView } from './pages/StartPage'
import './App.css'

function App() {
  const [view, setView] = useState<AppView>('start')
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
      case 'map-editor':     return <MapEditorScreen />
      case 'game':           return <GameScreen />
      case 'dev-game':
        return (<><HoverTooltip /><GameScreen /></>)
      default: return <StartPage onSelectView={setView} />
    }
  }

  return (
    <div className="app-shell">
      {view !== 'start' && (
        <header className="app-shell__topbar">
          <button className="app-shell__back" type="button" onClick={() => setView('start')}>← Start</button>
          <span className="app-shell__view-label">{VIEW_LABELS[view] ?? ''}</span>
          <button
            className={`app-shell__dev-btn ${inspectorOpen ? 'app-shell__dev-btn--active' : ''}`}
            type="button" onClick={toggleInspector} title="Dev Inspector (Ctrl+Shift+D)"
          >🔍 Inspector</button>
        </header>
      )}
      {renderView()}
    </div>
  )
}

const VIEW_LABELS: Record<Exclude<AppView, 'start'>, string> = {
  'last-language': '📖 Ostatni Język',
  battle:          '🗡️ Battle Demo',
  'grid-battle':   '⚔️ Grid Battle 3×2',
  gallery:         '🃏 Galeria kart',
  'card-editor':   '✏️ Card Editor',
  'frame-editor':  '🗺 Frame Editor',
  'frame-test':    '🧪 Frame Config Test',
  'test-env':      '🎮 Test Environment',
  'map-editor':    '🗺️ Map Editor',
  game:            '🎮 Zagraj',
  'dev-game':      'Dev Game',
}

export default App
