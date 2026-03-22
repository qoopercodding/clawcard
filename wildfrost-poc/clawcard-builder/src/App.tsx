import { useState } from 'react'
import { HoverTooltip } from './components/debug/HoverTooltip'
import { useDevInspector } from './components/debug/DevInspector'
import { CardBuilderScreen } from './modules/card-builder/CardBuilderScreen'
import { CardEditorScreen } from './modules/card-editor/CardEditorScreen'
import { FrameEditorScreen } from './modules/frame-editor/FrameEditorScreen'
import { FrameConfigTest } from './modules/frame-editor/FrameConfigTest'
import { BattleDemoScreen } from './modules/battle-demo/BattleDemoScreen'
import { TestEnvScreen } from './modules/test-env/TestEnvScreen'
import { GameScreenPlaceholder } from './pages/GameScreenPlaceholder'
import { StartPage } from './pages/StartPage'
import type { AppView } from './pages/StartPage'
import './App.css'

function App() {
  const [view, setView] = useState<AppView>('start')
  const { toggle: toggleInspector, isOpen: inspectorOpen } = useDevInspector()

  function renderView() {
    switch (view) {
      case 'start':        return <StartPage onSelectView={setView} />
      case 'battle':       return <BattleDemoScreen />
      case 'gallery':      return <CardBuilderScreen />
      case 'card-editor':  return <CardEditorScreen />
      case 'frame-editor': return <FrameEditorScreen onNavigate={setView} />
      case 'frame-test':   return <FrameConfigTest />
      case 'test-env':     return <TestEnvScreen />
      case 'game':         return <GameScreenPlaceholder />
      case 'dev-game':
        return (<><HoverTooltip /><GameScreenPlaceholder devMode /></>)
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
  battle:        '⚔️ Battle Demo',
  gallery:       '🃏 Galeria kart',
  'card-editor': '✏️ Card Editor',
  'frame-editor':'🗺 Frame Editor',
  'frame-test':  '🧪 Frame Config Test',
  'test-env':    '🧪 Test Environment',
  game:          'Game Screen',
  'dev-game':    'Dev Game',
}

export default App
