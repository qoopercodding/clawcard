import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Epic10Showcase.module.css'

// ─── Sandbox definitions ──────────────────────────────────────────────────────

interface SandboxDef {
  id: SandboxId
  route: string
  icon: string
  title: string
  description: string
  tags: string[]
}

type SandboxId =
  | 'battle'
  | 'cards'
  | 'hand'
  | 'board'
  | 'merchant'
  | 'campfire'
  | 'room-sequence'

const SANDBOXES: SandboxDef[] = [
  {
    id: 'battle',
    route: '/sandbox/battle',
    icon: '⚔️',
    title: '/sandbox/battle',
    description: 'Pełna walka z kontrolkami debug',
    tags: ['Combat', 'HP', 'Energy', 'Enemy AI'],
  },
  {
    id: 'cards',
    route: '/sandbox/cards',
    icon: '🃏',
    title: '/sandbox/cards',
    description: 'Biblioteka kart',
    tags: ['Cards', 'Filter', 'Taxonomy'],
  },
  {
    id: 'hand',
    route: '/sandbox/hand',
    icon: '✋',
    title: '/sandbox/hand',
    description: 'Tylko ręka i piles',
    tags: ['Hand', 'Draw', 'Discard'],
  },
  {
    id: 'board',
    route: '/sandbox/board',
    icon: '🏟️',
    title: '/sandbox/board',
    description: 'Tylko plansza',
    tags: ['Board', 'Units', 'Status'],
  },
  {
    id: 'merchant',
    route: '/sandbox/merchant',
    icon: '🛒',
    title: '/sandbox/merchant',
    description: 'Ekran sklepu',
    tags: ['Shop', 'Gold', 'Items'],
  },
  {
    id: 'campfire',
    route: '/sandbox/campfire',
    icon: '🔥',
    title: '/sandbox/campfire',
    description: 'Ekran ogniska',
    tags: ['Campfire', 'Heal', 'Upgrade'],
  },
  {
    id: 'room-sequence',
    route: '/sandbox/room-sequence',
    icon: '🗺️',
    title: '/sandbox/room-sequence',
    description: 'Symulacja sekwencji pokoi',
    tags: ['Rooms', 'Sequence', 'Flow'],
  },
]

// ─── Flash button hook ────────────────────────────────────────────────────────

function useFlash() {
  const [flashing, setFlashing] = useState<string | null>(null)

  const flash = useCallback((key: string) => {
    setFlashing(key)
    setTimeout(() => setFlashing(null), 1200)
  }, [])

  return { flashing, flash }
}

// ─── Mock controls per sandbox ────────────────────────────────────────────────

interface BattleControlsProps {
  flash: (key: string) => void
  flashing: string | null
}

function BattleControls({ flash, flashing }: BattleControlsProps) {
  const [playerHp, setPlayerHp] = useState(80)
  const [energy, setEnergy] = useState(3)
  const [gold, setGold] = useState(200)
  const [enemyPreset, setEnemyPreset] = useState('normal')
  const [noAnims, setNoAnims] = useState(false)
  const [showLayout, setShowLayout] = useState(false)

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Parametry</h4>
        <SliderControl label="Player HP" value={playerHp} min={0} max={100} onChange={setPlayerHp} />
        <SliderControl label="Energy" value={energy} min={0} max={10} onChange={setEnergy} />
        <SliderControl label="Gold" value={gold} min={0} max={1000} onChange={setGold} />
        <SelectControl
          label="Enemy Preset"
          value={enemyPreset}
          options={['easy', 'normal', 'hard', 'boss']}
          onChange={setEnemyPreset}
        />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Akcje</h4>
        <FlashButton id="add-card" label="Add Random Card to Hand" flash={flash} flashing={flashing} />
        <FlashButton id="kill-enemies" label="Kill All Enemies" flash={flash} flashing={flashing} />
        <FlashButton id="win-battle" label="Win Battle" flash={flash} flashing={flashing} />
        <ToggleControl label="Disable Animations" value={noAnims} onChange={setNoAnims} />
        <ToggleControl label="Show Layout Debug" value={showLayout} onChange={setShowLayout} />
      </div>
    </div>
  )
}

function CardsControls({ flash, flashing }: BattleControlsProps) {
  const [showMissingMechanics, setShowMissingMechanics] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [typeCompanion, setTypeCompanion] = useState(true)
  const [typeItem, setTypeItem] = useState(true)
  const [typeClunker, setTypeClunker] = useState(true)
  const [typePower, setTypePower] = useState(false)
  const [typeCurse, setTypeCurse] = useState(false)
  const [srcWildfrost, setSrcWildfrost] = useState(true)
  const [srcCustom, setSrcCustom] = useState(false)

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Typ kart</h4>
        <CheckboxControl label="Companion" value={typeCompanion} onChange={setTypeCompanion} />
        <CheckboxControl label="Item" value={typeItem} onChange={setTypeItem} />
        <CheckboxControl label="Clunker" value={typeClunker} onChange={setTypeClunker} />
        <CheckboxControl label="Power" value={typePower} onChange={setTypePower} />
        <CheckboxControl label="Curse" value={typeCurse} onChange={setTypeCurse} />
        <h4 className={styles.controlsSectionTitle} style={{ marginTop: '0.75rem' }}>Źródło</h4>
        <CheckboxControl label="Wildfrost" value={srcWildfrost} onChange={setSrcWildfrost} />
        <CheckboxControl label="Custom" value={srcCustom} onChange={setSrcCustom} />
        <CheckboxControl label="Show Only Missing Mechanics" value={showMissingMechanics} onChange={setShowMissingMechanics} />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Sortowanie i eksport</h4>
        <SelectControl
          label="Sort by"
          value={sortBy}
          options={['name', 'rarity', 'type']}
          onChange={setSortBy}
        />
        <FlashButton id="export-json" label="Export Filtered as JSON" flash={flash} flashing={flashing} />
      </div>
    </div>
  )
}

function HandControls({ flash, flashing }: BattleControlsProps) {
  const [handSize, setHandSize] = useState(5)
  const [animSpeed, setAnimSpeed] = useState(1.0)
  const [showBacks, setShowBacks] = useState(false)

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Parametry</h4>
        <SliderControl label="Hand Size" value={handSize} min={1} max={10} onChange={setHandSize} />
        <SliderControl
          label={`Animation Speed (${animSpeed.toFixed(1)}x)`}
          value={animSpeed * 10}
          min={1}
          max={30}
          onChange={v => setAnimSpeed(v / 10)}
        />
        <ToggleControl label="Show Card Backs" value={showBacks} onChange={setShowBacks} />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Akcje</h4>
        <FlashButton id="draw-x" label="Draw X Cards" flash={flash} flashing={flashing} />
        <FlashButton id="discard-all" label="Discard All" flash={flash} flashing={flashing} />
        <FlashButton id="force-shuffle" label="Force Shuffle" flash={flash} flashing={flashing} />
      </div>
    </div>
  )
}

function BoardControls({ flash, flashing }: BattleControlsProps) {
  const [playerUnits, setPlayerUnits] = useState(2)
  const [enemyUnits, setEnemyUnits] = useState(3)
  const [statusType, setStatusType] = useState('Snow')

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Parametry</h4>
        <SliderControl label="Player Units" value={playerUnits} min={0} max={4} onChange={setPlayerUnits} />
        <SliderControl label="Enemy Units" value={enemyUnits} min={0} max={6} onChange={setEnemyUnits} />
        <SelectControl
          label="Status Type"
          value={statusType}
          options={['Snow', 'Poison', 'Shield']}
          onChange={setStatusType}
        />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Akcje</h4>
        <FlashButton id="trigger-attacks" label="Trigger All Attacks" flash={flash} flashing={flashing} />
        <FlashButton id="kill-random" label="Kill Random Enemy" flash={flash} flashing={flashing} />
        <FlashButton id="apply-status" label="Apply Status to All" flash={flash} flashing={flashing} />
      </div>
    </div>
  )
}

function MerchantControls({ flash, flashing }: BattleControlsProps) {
  const [startGold, setStartGold] = useState(300)
  const [confirmPurchase, setConfirmPurchase] = useState(false)
  const [shopSeed, setShopSeed] = useState('seed1')

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Parametry</h4>
        <SliderControl label="Starting Gold" value={startGold} min={0} max={1000} onChange={setStartGold} />
        <SelectControl
          label="Shop Seed"
          value={shopSeed}
          options={['seed1', 'seed2', 'seed3', 'random']}
          onChange={setShopSeed}
        />
        <ToggleControl label="Enable Purchase Confirmation" value={confirmPurchase} onChange={setConfirmPurchase} />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Akcje</h4>
        <FlashButton id="restock" label="Restock Shop" flash={flash} flashing={flashing} />
      </div>
    </div>
  )
}

function CampfireControls({ flash, flashing }: BattleControlsProps) {
  const [playerHpPct, setPlayerHpPct] = useState(55)
  const [hasMaterials, setHasMaterials] = useState(true)
  const [slowFire, setSlowFire] = useState(false)

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Parametry</h4>
        <SliderControl label="Player HP %" value={playerHpPct} min={0} max={100} onChange={setPlayerHpPct} />
        <ToggleControl label="Has Upgrade Materials" value={hasMaterials} onChange={setHasMaterials} />
        <ToggleControl label="Slow Fire Animation" value={slowFire} onChange={setSlowFire} />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Akcje</h4>
        <FlashButton id="reset-choices" label="Reset Choices" flash={flash} flashing={flashing} />
      </div>
    </div>
  )
}

function RoomSequenceControls({ flash, flashing }: BattleControlsProps) {
  const [sequence, setSequence] = useState('medium')
  const [autoAdvance, setAutoAdvance] = useState(false)

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Parametry</h4>
        <SelectControl
          label="Sequence"
          value={sequence}
          options={['short (3 rooms)', 'medium (5 rooms)', 'long (8 rooms)']}
          onChange={setSequence}
        />
        <ToggleControl label="Auto-advance" value={autoAdvance} onChange={setAutoAdvance} />
      </div>
      <div className={styles.controlsSection}>
        <h4 className={styles.controlsSectionTitle}>Akcje</h4>
        <FlashButton id="start-sequence" label="Start Sequence" flash={flash} flashing={flashing} />
        <FlashButton id="reset-sequence" label="Reset" flash={flash} flashing={flashing} />
      </div>
    </div>
  )
}

// ─── Reusable primitive controls ──────────────────────────────────────────────

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function SliderControl({ label, value, min, max, onChange }: SliderControlProps) {
  return (
    <label className={styles.controlRow}>
      <span className={styles.controlLabel}>{label}</span>
      <div className={styles.sliderRow}>
        <input
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span className={styles.sliderValue}>{value}</span>
      </div>
    </label>
  )
}

interface SelectControlProps {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}

function SelectControl({ label, value, options, onChange }: SelectControlProps) {
  return (
    <label className={styles.controlRow}>
      <span className={styles.controlLabel}>{label}</span>
      <select
        className={styles.mockSelect}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  )
}

interface ToggleControlProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

function ToggleControl({ label, value, onChange }: ToggleControlProps) {
  return (
    <label className={styles.controlRow}>
      <span className={styles.controlLabel}>{label}</span>
      <button
        type="button"
        className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className={styles.toggleKnob} />
      </button>
    </label>
  )
}

interface CheckboxControlProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

function CheckboxControl({ label, value, onChange }: CheckboxControlProps) {
  return (
    <label className={styles.checkboxRow}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={value}
        onChange={e => onChange(e.target.checked)}
      />
      <span className={styles.checkboxLabel}>{label}</span>
    </label>
  )
}

interface FlashButtonProps {
  id: string
  label: string
  flash: (key: string) => void
  flashing: string | null
}

function FlashButton({ id, label, flash, flashing }: FlashButtonProps) {
  const isFlashing = flashing === id
  return (
    <button
      type="button"
      className={`${styles.mockBtn} ${isFlashing ? styles.mockBtnFlash : ''}`}
      onClick={() => flash(id)}
    >
      {isFlashing ? '✓ Wykonano' : label}
    </button>
  )
}

// ─── Controls dispatcher ──────────────────────────────────────────────────────

interface SandboxControlsProps {
  sandboxId: SandboxId
  flash: (key: string) => void
  flashing: string | null
}

function SandboxControls({ sandboxId, flash, flashing }: SandboxControlsProps) {
  switch (sandboxId) {
    case 'battle':        return <BattleControls flash={flash} flashing={flashing} />
    case 'cards':         return <CardsControls flash={flash} flashing={flashing} />
    case 'hand':          return <HandControls flash={flash} flashing={flashing} />
    case 'board':         return <BoardControls flash={flash} flashing={flashing} />
    case 'merchant':      return <MerchantControls flash={flash} flashing={flashing} />
    case 'campfire':      return <CampfireControls flash={flash} flashing={flashing} />
    case 'room-sequence': return <RoomSequenceControls flash={flash} flashing={flashing} />
  }
}

// ─── Hub card ─────────────────────────────────────────────────────────────────

interface HubCardProps {
  sandbox: SandboxDef
  isSelected: boolean
  onSelect: () => void
}

function HubCard({ sandbox, isSelected, onSelect }: HubCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <motion.div
      className={`${styles.hubCard} ${isSelected ? styles.hubCardSelected : ''}`}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      onClick={onSelect}
    >
      <div className={styles.hubCardIcon}>{sandbox.icon}</div>
      <div className={styles.hubCardTitle}>{sandbox.title}</div>
      <div className={styles.hubCardDesc}>{sandbox.description}</div>
      <div className={styles.hubCardTags}>
        {sandbox.tags.map(tag => (
          <span key={tag} className={styles.hubCardTag}>{tag}</span>
        ))}
      </div>
      <div className={styles.hubCardFooter}>
        <div
          className={styles.openBtnWrap}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            type="button"
            className={styles.openBtn}
            disabled
            onClick={e => e.stopPropagation()}
          >
            Otwórz
          </button>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                className={styles.tooltip}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
              >
                Sandbox routes are showcased below
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Epic10Showcase() {
  const [selectedId, setSelectedId] = useState<SandboxId>('battle')
  const { flashing, flash } = useFlash()

  const selectedSandbox = SANDBOXES.find(s => s.id === selectedId)!

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Epic 10 — Sandbox Routes</h2>

      {/* ── Sandbox Hub grid ── */}
      <section className={styles.hubSection}>
        <div className={styles.hubHeader}>
          <span className={styles.hubIcon}>🗂️</span>
          <h3 className={styles.hubTitle}>Sandbox Hub</h3>
          <span className={styles.hubSubtitle}>7 isolated test environments</span>
        </div>
        <div className={styles.hubGrid}>
          {SANDBOXES.map(sandbox => (
            <HubCard
              key={sandbox.id}
              sandbox={sandbox}
              isSelected={selectedId === sandbox.id}
              onSelect={() => setSelectedId(sandbox.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Interactive panel ── */}
      <section className={styles.panelSection}>
        <div className={styles.panelHeader}>
          <span className={styles.panelIcon}>🔧</span>
          <h3 className={styles.panelTitle}>Mock Controls</h3>
          <span className={styles.panelSubtitle}>Wybierz sandbox powyżej aby zobaczyć jego kontrolki</span>
        </div>

        {/* Tab row */}
        <div className={styles.tabs} role="tablist">
          {SANDBOXES.map(sandbox => (
            <button
              key={sandbox.id}
              type="button"
              role="tab"
              aria-selected={selectedId === sandbox.id}
              className={`${styles.tab} ${selectedId === sandbox.id ? styles.tabActive : ''}`}
              onClick={() => setSelectedId(sandbox.id)}
            >
              <span className={styles.tabIcon}>{sandbox.icon}</span>
              <span className={styles.tabLabel}>{sandbox.id}</span>
              {selectedId === sandbox.id && (
                <motion.div
                  className={styles.tabUnderline}
                  layoutId="tab-underline"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className={styles.panelContent}>
          <div className={styles.panelContentHeader}>
            <span className={styles.panelContentIcon}>{selectedSandbox.icon}</span>
            <div>
              <div className={styles.panelContentTitle}>{selectedSandbox.title}</div>
              <div className={styles.panelContentDesc}>{selectedSandbox.description}</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <SandboxControls sandboxId={selectedId} flash={flash} flashing={flashing} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
