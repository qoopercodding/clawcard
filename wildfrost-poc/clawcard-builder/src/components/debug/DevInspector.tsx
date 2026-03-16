import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { AnyCard } from '../../types/card.types'
import './DevInspector.css'

// =============================================================================
// DevInspector.tsx — stały sidebar developerski
// =============================================================================
//
// ODPOWIADA ZA:
//   - Stały panel 320px po prawej z pełnymi danymi klikniętej karty
//   - Toggle przez Ctrl+Shift+D lub przycisk "🔍 Inspector" w topbarze
//   - Kliknięcie karty → sidebar otwiera się z jej obiektem
//   - Statystyki z paskami, abilities rozwinięte, raw JSON z copy
//   - Historia ostatnich 10 inspekcji
//
// NIE ODPOWIADA ZA:
//   - Hover tooltip (→ HoverTooltip.tsx)
//   - Store kart (tylko odczyt przez props)
//   - Logikę gry
//
// GLOBALNE EKSPORTY:
//   DevInspectorProvider  — owija <App />, dostarcza context
//   useDevInspector()     — hook: { inspect, isOpen, toggle }
//
// UŻYWA: AnyCard (card.types.ts)
//
// JAK PODPIĄĆ NOWY KOMPONENT:
//   const { inspect } = useDevInspector()
//   <div onClick={() => inspect(card, 'NazwaKomponentu')}>...</div>
// =============================================================================

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

/**
 * Jeden wpis historii — karta + timestamp + skąd przyszło kliknięcie.
 */
interface InspectEntry {
  card: AnyCard
  inspectedAt: number
  sourceComponent: string
}

/**
 * Wartości dostępne przez useDevInspector().
 *
 * @example
 * const { inspect, isOpen, toggle } = useDevInspector()
 * // Wpisz kartę do inspectora po kliknięciu:
 * <article onClick={() => inspect(card, 'CompanionFrame')}>...</article>
 */
interface DevInspectorContextValue {
  inspect: (card: AnyCard, sourceComponent: string) => void
  isOpen: boolean
  toggle: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DevInspectorCtx = createContext<DevInspectorContextValue>({
  inspect: () => {},
  isOpen: false,
  toggle: () => {},
})

/**
 * Hook zwracający funkcje i stan DevInspectora.
 * Musi być użyty wewnątrz <DevInspectorProvider>.
 *
 * @returns { inspect, isOpen, toggle }
 *
 * @example
 * const { inspect } = useDevInspector()
 * <article onClick={() => inspect(card, 'CompanionFrame')}>...</article>
 */
export function useDevInspector(): DevInspectorContextValue {
  return useContext(DevInspectorCtx)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Owija <App /> i dostarcza context DevInspectora do całego drzewa.
 * Renderuje też sam sidebar — nie trzeba go dodawać osobno nigdzie.
 *
 * @example
 * // main.tsx:
 * <DevInspectorProvider>
 *   <App />
 * </DevInspectorProvider>
 */
export function DevInspectorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<InspectEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<InspectEntry | null>(null)

  // Ctrl+Shift+D toggle
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function inspect(card: AnyCard, sourceComponent: string) {
    const entry: InspectEntry = { card, inspectedAt: Date.now(), sourceComponent }
    setActiveEntry(entry)
    setHistory(prev => [entry, ...prev].slice(0, 10))
    setIsOpen(true)
  }

  function toggle() {
    setIsOpen(prev => !prev)
  }

  return (
    <DevInspectorCtx.Provider value={{ inspect, isOpen, toggle }}>
      {children}
      <DevInspectorSidebar
        isOpen={isOpen}
        activeEntry={activeEntry}
        history={history}
        onToggle={toggle}
        onSelectEntry={setActiveEntry}
      />
    </DevInspectorCtx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface SidebarProps {
  isOpen: boolean
  activeEntry: InspectEntry | null
  history: InspectEntry[]
  onToggle: () => void
  onSelectEntry: (entry: InspectEntry) => void
}

function DevInspectorSidebar({
  isOpen, activeEntry, history, onToggle, onSelectEntry,
}: SidebarProps) {
  return (
    <>
      <button
        className="dev-inspector-toggle"
        onClick={onToggle}
        title="Dev Inspector (Ctrl+Shift+D)"
        aria-label="Toggle developer inspector"
        aria-expanded={isOpen}
      >
        <span className="dev-inspector-toggle__icon">{isOpen ? '›' : '‹'}</span>
        <span className="dev-inspector-toggle__label">DEV</span>
      </button>

      <aside className={`dev-inspector ${isOpen ? 'dev-inspector--open' : ''}`}>
        <header className="dev-inspector__header">
          <span className="dev-inspector__title">Inspector</span>
          <kbd className="dev-inspector__shortcut">Ctrl+Shift+D</kbd>
          <button className="dev-inspector__close" onClick={onToggle} aria-label="Close">×</button>
        </header>

        <div className="dev-inspector__body">
          {activeEntry
            ? <ActiveCardPanel entry={activeEntry} />
            : <EmptyState />
          }
          {history.length > 1 && (
            <HistoryPanel
              history={history}
              activeEntry={activeEntry}
              onSelect={onSelectEntry}
            />
          )}
        </div>
      </aside>
    </>
  )
}

// ---------------------------------------------------------------------------
// ActiveCardPanel
// ---------------------------------------------------------------------------

function ActiveCardPanel({ entry }: { entry: InspectEntry }) {
  const { card, inspectedAt, sourceComponent } = entry
  return (
    <div className="inspector-card-panel">
      <div className="inspector-section">
        <div className="inspector-section__label">Źródło</div>
        <div className="inspector-chip inspector-chip--source">{sourceComponent}</div>
        <div className="inspector-section__label" style={{ marginTop: 6 }}>Czas</div>
        <div className="inspector-value inspector-value--muted">
          {new Date(inspectedAt).toLocaleTimeString()}
        </div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section__title">Identyfikacja</div>
        <FieldRow label="id"           value={card.id}           mono />
        <FieldRow label="name"         value={card.name} />
        <FieldRow label="type"         value={card.type}  chip chipColor={TYPE_COLORS[card.type]} />
        <FieldRow label="tribe"        value={card.tribe} />
        <FieldRow label="fallback"     value={card.imageFallback} />
        <FieldRow label="imageUrl"     value={card.imageUrl ?? 'null'} muted={!card.imageUrl} />
      </div>

      <StatsSection card={card} />
      <ExtrasSection card={card} />
      <RawJsonSection card={card} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatsSection — różna per typ karty
// ---------------------------------------------------------------------------

/**
 * Renderuje statystyki odpowiednie dla danego typu karty.
 *
 * Jak rozszerzać — gdy dodasz nowy CardType:
 * 1. Dodaj case tutaj
 * 2. Dodaj kolor w TYPE_COLORS na dole pliku
 */
function StatsSection({ card }: { card: AnyCard }) {
  if (card.type === 'companion') {
    return (
      <div className="inspector-section">
        <div className="inspector-section__title">Statystyki</div>
        <StatBar label="HP"      value={card.hp}      max={20} color="#eb6255" />
        <StatBar label="ATK"     value={card.attack}  max={10} color="#5faff6" />
        <StatBar label="Counter" value={card.counter} max={9}  color="#f3c75b" />
      </div>
    )
  }
  if (card.type === 'clunker') {
    return (
      <div className="inspector-section">
        <div className="inspector-section__title">Statystyki</div>
        <StatBar label="Scrap"   value={card.scrap}   max={10} color="#9ca3af" />
        <StatBar label="ATK"     value={card.attack}  max={10} color="#5faff6" />
        <StatBar label="Counter" value={card.counter} max={9}  color="#f3c75b" />
      </div>
    )
  }
  if (card.type === 'shade') {
    return (
      <div className="inspector-section">
        <div className="inspector-section__title">Statystyki</div>
        <StatBar label="HP"      value={card.hp}      max={20} color="#c084fc" />
        <StatBar label="ATK"     value={card.attack}  max={10} color="#5faff6" />
        <StatBar label="Counter" value={card.counter} max={9}  color="#f3c75b" />
        <FieldRow label="decay"     value={String(card.decayOnTrigger)} />
        <FieldRow label="summonedBy" value={card.summonedBy || '—'} muted={!card.summonedBy} />
      </div>
    )
  }
  if (card.type === 'item') {
    return (
      <div className="inspector-section">
        <div className="inspector-section__title">Efekt</div>
        <FieldRow label="target"  value={card.target}         chip chipColor="#86efac" />
        <FieldRow label="consume" value={String(card.consume)} />
        {card.effect.damage   !== undefined && <StatBar label="damage"  value={card.effect.damage}   max={20} color="#eb6255" />}
        {card.effect.heal     !== undefined && <StatBar label="heal"    value={card.effect.heal}     max={20} color="#86efac" />}
        {card.effect.snow     !== undefined && <StatBar label="snow"    value={card.effect.snow}     max={9}  color="#67e8f9" />}
        {card.effect.shield   !== undefined && <StatBar label="shield"  value={card.effect.shield}   max={10} color="#60a5fa" />}
        {card.effect.overburn !== undefined && <StatBar label="overburn" value={card.effect.overburn} max={20} color="#fb923c" />}
      </div>
    )
  }
  if (card.type === 'charm') {
    return (
      <div className="inspector-section">
        <div className="inspector-section__title">Efekt charmu</div>
        <div className="inspector-section__label">compatibleWith</div>
        <div className="inspector-chips-row">
          {card.compatibleWith.map(t => (
            <span
              key={t}
              className="inspector-chip"
              style={{ background: TYPE_COLORS[t] + '22', color: TYPE_COLORS[t], border: `1px solid ${TYPE_COLORS[t]}` }}
            >
              {t}
            </span>
          ))}
        </div>
        {card.effect.addAttack  !== undefined && <FieldRow label="+attack"  value={String(card.effect.addAttack)} />}
        {card.effect.addHp      !== undefined && <FieldRow label="+hp"      value={String(card.effect.addHp)} />}
        {card.effect.addCounter !== undefined && <FieldRow label="+counter" value={String(card.effect.addCounter)} />}
        {card.effect.addKeyword !== undefined && <FieldRow label="+keyword" value={String(card.effect.addKeyword)} chip chipColor="#c084fc" />}
      </div>
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// ExtrasSection — opis + abilities
// ---------------------------------------------------------------------------

function ExtrasSection({ card }: { card: AnyCard }) {
  const abilities = (card.type === 'companion' || card.type === 'clunker' || card.type === 'shade')
    ? card.abilities
    : []

  return (
    <div className="inspector-section">
      <div className="inspector-section__title">Opis</div>
      <div className="inspector-value inspector-value--desc">
        {card.description || <span className="inspector-value--muted">(brak)</span>}
      </div>

      {abilities.length > 0 && (
        <>
          <div className="inspector-section__title" style={{ marginTop: 8 }}>
            Abilities ({abilities.length})
          </div>
          {abilities.map((ab, i) => (
            <div key={ab.id} className="inspector-ability">
              <div className="inspector-ability__index">#{i + 1}</div>
              <div className="inspector-ability__body">
                <div className="inspector-ability__label">{ab.label}</div>
                <div className="inspector-ability__desc">{ab.description}</div>
                {ab.value !== undefined && <div className="inspector-ability__value">value: {ab.value}</div>}
                <div className="inspector-ability__id">id: {ab.id}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RawJsonSection
// ---------------------------------------------------------------------------

function RawJsonSection({ card }: { card: AnyCard }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(card, null, 2)

  function handleCopy() {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="inspector-section">
      <div className="inspector-section__header-row">
        <div className="inspector-section__title">Raw JSON</div>
        <button className="inspector-copy-btn" onClick={handleCopy}>
          {copied ? '✓ skopiowano' : 'kopiuj'}
        </button>
      </div>
      <pre className="inspector-json">{json}</pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HistoryPanel
// ---------------------------------------------------------------------------

function HistoryPanel({
  history, activeEntry, onSelect,
}: {
  history: InspectEntry[]
  activeEntry: InspectEntry | null
  onSelect: (entry: InspectEntry) => void
}) {
  return (
    <div className="inspector-section">
      <div className="inspector-section__title">Historia ({history.length})</div>
      {history.map((entry, i) => (
        <button
          key={entry.inspectedAt}
          className={`inspector-history-item ${entry === activeEntry ? 'inspector-history-item--active' : ''}`}
          onClick={() => onSelect(entry)}
        >
          <span className="inspector-history-item__dot" style={{ background: TYPE_COLORS[entry.card.type] }} />
          <span className="inspector-history-item__name">{entry.card.name}</span>
          <span className="inspector-history-item__type">{entry.card.type}</span>
          {i === 0 && <span className="inspector-history-item__badge">nowa</span>}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="inspector-empty">
      <div className="inspector-empty__icon">🔍</div>
      <div className="inspector-empty__title">Kliknij kartę</div>
      <div className="inspector-empty__hint">
        Kliknij dowolną kartę w aplikacji żeby zobaczyć jej pełne dane.
      </div>
      <div className="inspector-empty__shortcut">
        Toggle: <kbd>Ctrl+Shift+D</kbd>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers — małe komponenty UI
// ---------------------------------------------------------------------------

function FieldRow({
  label, value, mono, muted, chip, chipColor,
}: {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
  chip?: boolean
  chipColor?: string
}) {
  return (
    <div className="inspector-field">
      <span className="inspector-field__label">{label}</span>
      {chip ? (
        <span
          className="inspector-chip"
          style={chipColor ? {
            background: chipColor + '22',
            color: chipColor,
            border: `1px solid ${chipColor}`,
          } : undefined}
        >
          {value}
        </span>
      ) : (
        <span className={`inspector-field__value ${mono ? 'mono' : ''} ${muted ? 'inspector-value--muted' : ''}`}>
          {value}
        </span>
      )}
    </div>
  )
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="inspector-stat">
      <span className="inspector-stat__label">{label}</span>
      <div className="inspector-stat__track">
        <div className="inspector-stat__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="inspector-stat__value" style={{ color }}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stałe
// ---------------------------------------------------------------------------

/**
 * Kolory identyfikujące każdy typ karty — używane w chipach, historii, paskach.
 * Dodaj tutaj nowe typy gdy rozszerzysz CardType.
 */
const TYPE_COLORS: Record<string, string> = {
  companion: '#d4a96a',
  item:      '#f3c75b',
  clunker:   '#9ca3af',
  shade:     '#c084fc',
  charm:     '#86efac',
}
