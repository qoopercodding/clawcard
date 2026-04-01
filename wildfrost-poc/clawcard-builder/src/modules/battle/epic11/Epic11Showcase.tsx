import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Epic11Showcase.module.css'

// ─── Transition definitions ───────────────────────────────────────────────────

const TRANSITION_IDS = [
  'map-battle',
  'battle-reward',
  'reward-map',
  'map-merchant',
  'map-campfire',
  'boss-death',
  'full-loop',
] as const

type TransitionId = (typeof TRANSITION_IDS)[number]

interface TransitionDef {
  id: TransitionId
  label: string
  icon: string
  description: string
}

const TRANSITIONS: TransitionDef[] = [
  { id: 'map-battle',    label: 'Map → Battle',    icon: '⚔️',  description: 'Scale + opacity zoom from center' },
  { id: 'battle-reward', label: 'Battle → Reward',  icon: '🏆',  description: 'Fade out → staggered card reveal' },
  { id: 'reward-map',    label: 'Reward → Map',     icon: '🗺️',  description: 'Slide up / slide in from bottom' },
  { id: 'map-merchant',  label: 'Map → Merchant',   icon: '🛒',  description: 'Horizontal slide swap' },
  { id: 'map-campfire',  label: 'Map → Campfire',   icon: '🔥',  description: 'Blur overlay + warm glow' },
  { id: 'boss-death',    label: 'Boss Death',       icon: '💀',  description: 'Flash → black → new area from top' },
  { id: 'full-loop',     label: 'Full Loop',        icon: '🔄',  description: 'All transitions in sequence' },
]

// ─── Screen mock definitions ──────────────────────────────────────────────────

type ScreenId = 'map' | 'battle' | 'reward' | 'merchant' | 'campfire' | 'boss' | 'next-area'

interface ScreenMock {
  id: ScreenId
  label: string
  icon: string
  bg: string
  accentColor: string
}

const SCREENS: Record<ScreenId, ScreenMock> = {
  map:       { id: 'map',       label: 'World Map',    icon: '🗺️',  bg: '#0a1408', accentColor: '#3a7a2a' },
  battle:    { id: 'battle',    label: 'Battle Arena', icon: '⚔️',  bg: '#180808', accentColor: '#8a1a1a' },
  reward:    { id: 'reward',    label: 'Card Reward',  icon: '🏆',  bg: '#120c1e', accentColor: '#6a3aaa' },
  merchant:  { id: 'merchant',  label: 'Merchant',     icon: '🛒',  bg: '#1a1004', accentColor: '#c8902a' },
  campfire:  { id: 'campfire',  label: 'Campfire',     icon: '🔥',  bg: '#0d0804', accentColor: '#e06010' },
  boss:      { id: 'boss',      label: 'BOSS FIGHT',   icon: '💀',  bg: '#1a0000', accentColor: '#cc0000' },
  'next-area': { id: 'next-area', label: 'New Area',   icon: '✨',  bg: '#080e08', accentColor: '#40aa40' },
}

// ─── Transition variant builders ──────────────────────────────────────────────

function makeVariants(dur: number) {
  const d = (base: number) => base / dur // invert: higher speed = shorter duration

  return {
    'map-battle': {
      exitMap: {
        initial: { scale: 1,    opacity: 1 },
        animate: { scale: 1,    opacity: 1 },
        exit:    { scale: 1.6,  opacity: 0, transition: { duration: d(0.5), ease: 'easeIn' as const } },
      },
      enterBattle: {
        initial: { scale: 0.5, opacity: 0 },
        animate: { scale: 1,   opacity: 1, transition: { duration: d(0.5), ease: 'easeOut' as const } },
        exit:    { scale: 1,   opacity: 1 },
      },
    },
    'battle-reward': {
      exitBattle: {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 1, scale: 1 },
        exit:    { opacity: 0, scale: 0.95, transition: { duration: d(0.4) } },
      },
      enterReward: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0,  transition: { duration: d(0.45) } },
        exit:    { opacity: 0, y: -20 },
      },
    },
    'reward-map': {
      exitReward: {
        initial: { y: 0,    opacity: 1 },
        animate: { y: 0,    opacity: 1 },
        exit:    { y: '-100%', opacity: 0, transition: { duration: d(0.5), ease: 'easeIn' as const } },
      },
      enterMap: {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0,     opacity: 1, transition: { duration: d(0.5), ease: 'easeOut' as const } },
        exit:    { y: 0,     opacity: 1 },
      },
    },
    'map-merchant': {
      exitMap: {
        initial: { x: 0,      opacity: 1 },
        animate: { x: 0,      opacity: 1 },
        exit:    { x: '-100%', opacity: 0, transition: { duration: d(0.45), ease: 'easeInOut' as const } },
      },
      enterMerchant: {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0,      opacity: 1, transition: { duration: d(0.45), ease: 'easeInOut' as const } },
        exit:    { x: 0,      opacity: 1 },
      },
    },
    'map-campfire': {
      exitMap: {
        initial: { filter: 'blur(0px)', opacity: 1 },
        animate: { filter: 'blur(0px)', opacity: 1 },
        exit:    { filter: 'blur(12px)', opacity: 0, transition: { duration: d(0.6) } },
      },
      enterCampfire: {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1,   transition: { duration: d(0.5), delay: d(0.1) } },
        exit:    { opacity: 0 },
      },
    },
    'boss-death': {
      exitBoss: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit:    { opacity: 0, transition: { duration: d(0.15) } },
      },
      enterNextArea: {
        initial: { y: '-100%', opacity: 1 },
        animate: { y: 0,       opacity: 1, transition: { duration: d(0.5), ease: 'easeOut' as const } },
        exit:    { y: 0,       opacity: 1 },
      },
    },
  }
}

// ─── Full loop sequence ───────────────────────────────────────────────────────

const LOOP_SEQUENCE: TransitionId[] = [
  'map-battle',
  'battle-reward',
  'reward-map',
  'map-merchant',
  'map-campfire',
  'boss-death',
]

// ─── Reward cards (static mock) ───────────────────────────────────────────────

const REWARD_CARDS = [
  { id: 'r1', name: 'Frost Spike', type: 'Item',      color: '#1a3a6a' },
  { id: 'r2', name: 'Snow Pup',    type: 'Companion',  color: '#1a5a3a' },
  { id: 'r3', name: 'Blizzard',    type: 'Item',       color: '#3a1a6a' },
]

// ─── Map node dots (static pattern) ──────────────────────────────────────────

const MAP_NODES = [
  { x: 20, y: 30 }, { x: 35, y: 20 }, { x: 50, y: 40 }, { x: 65, y: 25 },
  { x: 80, y: 35 }, { x: 28, y: 55 }, { x: 48, y: 65 }, { x: 68, y: 60 },
  { x: 85, y: 70 }, { x: 15, y: 70 }, { x: 55, y: 80 }, { x: 42, y: 48 },
]

// ─── Screen mock component ────────────────────────────────────────────────────

interface ScreenMockProps {
  screen: ScreenMock
  showRewardCards?: boolean
  showBlurOverlay?: boolean
  showCampfireGlow?: boolean
  showBossFlash?: boolean
  showParticles?: boolean
  speed: number
}

function ScreenMockView({
  screen,
  showRewardCards,
  showBlurOverlay,
  showCampfireGlow,
  showBossFlash,
  showParticles,
}: ScreenMockProps) {
  return (
    <div
      className={styles.screenMock}
      style={{ background: screen.bg, '--accent': screen.accentColor } as React.CSSProperties}
    >
      {/* Map nodes */}
      {screen.id === 'map' && (
        <div className={styles.mapNodes}>
          {MAP_NODES.map((node, i) => (
            <div
              key={i}
              className={styles.mapNode}
              style={{ left: `${node.x}%`, top: `${node.y}%`, '--accent': screen.accentColor } as React.CSSProperties}
            />
          ))}
          <svg className={styles.mapLines} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M20,30 L35,20 L50,40 L65,25 L80,35" stroke="#3a7a2a44" strokeWidth="0.5" fill="none" />
            <path d="M20,30 L28,55 L48,65 L68,60 L85,70" stroke="#3a7a2a44" strokeWidth="0.5" fill="none" />
            <path d="M50,40 L42,48 L48,65 L55,80" stroke="#3a7a2a33" strokeWidth="0.5" fill="none" />
          </svg>
        </div>
      )}

      {/* Battle arena details */}
      {screen.id === 'battle' && (
        <div className={styles.battleDetails}>
          <div className={styles.battleBar} style={{ '--accent': screen.accentColor } as React.CSSProperties} />
          <div className={styles.battleBar} style={{ '--accent': screen.accentColor, width: '60%' } as React.CSSProperties} />
          <div className={styles.battleUnits}>
            <div className={styles.battleUnit} style={{ '--accent': screen.accentColor } as React.CSSProperties}>☠</div>
            <div className={styles.battleUnit} style={{ '--accent': screen.accentColor } as React.CSSProperties}>☠</div>
          </div>
        </div>
      )}

      {/* Reward cards */}
      {screen.id === 'reward' && showRewardCards && (
        <div className={styles.rewardCards}>
          {REWARD_CARDS.map((card, i) => (
            <motion.div
              key={card.id}
              className={styles.rewardCard}
              style={{ background: card.color }}
              initial={{ y: 40, opacity: 0, rotateY: 90 }}
              animate={{ y: 0, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.35, delay: i * 0.12, ease: 'easeOut' }}
            >
              <div className={styles.rewardCardName}>{card.name}</div>
              <div className={styles.rewardCardType}>{card.type}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Merchant shelves */}
      {screen.id === 'merchant' && (
        <div className={styles.merchantShelves}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.merchantShelf} style={{ '--accent': screen.accentColor } as React.CSSProperties} />
          ))}
        </div>
      )}

      {/* Campfire glow */}
      {screen.id === 'campfire' && (
        <div className={styles.campfireGlowWrap}>
          {showCampfireGlow && (
            <motion.div
              className={styles.campfireGlow}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              🔥
            </motion.div>
          )}
        </div>
      )}

      {/* Boss particles */}
      {(screen.id === 'boss' || screen.id === 'next-area') && showParticles && (
        <div className={styles.particles}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{ '--i': i } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Boss flash overlay */}
      {showBossFlash && (
        <div className={styles.bossFlash} />
      )}

      {/* Campfire blur overlay */}
      {showBlurOverlay && (
        <motion.div
          className={styles.campfireOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Screen label */}
      <div className={styles.screenLabel}>
        <span className={styles.screenIcon}>{screen.icon}</span>
        <span className={styles.screenName}>{screen.label}</span>
      </div>
    </div>
  )
}

// ─── Transition preview area ──────────────────────────────────────────────────

interface PreviewAreaProps {
  activeTransition: TransitionId | null
  playing: boolean
  speed: number
  phase: 'idle' | 'exit' | 'enter' | 'done'
  fromScreen: ScreenId
  toScreen: ScreenId
}

function PreviewArea({ activeTransition, playing, speed, phase, fromScreen, toScreen }: PreviewAreaProps) {
  const showFrom = phase === 'idle' || phase === 'exit'
  const showTo = phase === 'enter' || phase === 'done'
  const showRewardCards = toScreen === 'reward' && phase === 'enter'
  const showCampfireGlow = toScreen === 'campfire' && phase === 'enter'
  const showBlurOverlay = activeTransition === 'map-campfire' && phase === 'exit'
  const showBossFlash = activeTransition === 'boss-death' && phase === 'exit'
  const showParticles = activeTransition === 'boss-death' && (phase === 'exit' || phase === 'enter')
  const v = makeVariants(speed)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type MotionVariant = { initial: any; animate: any; exit: any }
  const EMPTY_V: MotionVariant = { initial: {}, animate: {}, exit: {} }

  const getExitVariants = (): MotionVariant => {
    if (!activeTransition || activeTransition === 'full-loop') return EMPTY_V
    switch (activeTransition) {
      case 'map-battle':    return v['map-battle'].exitMap
      case 'battle-reward': return v['battle-reward'].exitBattle
      case 'reward-map':    return v['reward-map'].exitReward
      case 'map-merchant':  return v['map-merchant'].exitMap
      case 'map-campfire':  return v['map-campfire'].exitMap
      case 'boss-death':    return v['boss-death'].exitBoss
    }
  }

  const getEnterVariants = (): MotionVariant => {
    if (!activeTransition || activeTransition === 'full-loop') return EMPTY_V
    switch (activeTransition) {
      case 'map-battle':    return v['map-battle'].enterBattle
      case 'battle-reward': return v['battle-reward'].enterReward
      case 'reward-map':    return v['reward-map'].enterMap
      case 'map-merchant':  return v['map-merchant'].enterMerchant
      case 'map-campfire':  return v['map-campfire'].enterCampfire
      case 'boss-death':    return v['boss-death'].enterNextArea
    }
  }

  const exitV = getExitVariants()
  const enterV = getEnterVariants()

  if (!activeTransition) {
    return (
      <div className={styles.previewArea}>
        <div className={styles.previewIdle}>
          <div className={styles.previewIdleIcon}>🎬</div>
          <div className={styles.previewIdleText}>Select a transition to preview</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.previewArea}>
      <div className={styles.previewInner}>
        <AnimatePresence mode="wait">
          {showFrom && (
            <motion.div
              key="from"
              className={styles.screenWrapper}
              initial={exitV.initial ?? {}}
              animate={exitV.animate ?? {}}
              exit={exitV.exit ?? {}}
            >
              <ScreenMockView
                screen={SCREENS[fromScreen]}
                showBossFlash={showBossFlash}
                showBlurOverlay={showBlurOverlay}
                showParticles={showParticles}
                speed={speed}
              />
            </motion.div>
          )}
          {showTo && (
            <motion.div
              key="to"
              className={styles.screenWrapper}
              initial={enterV.initial ?? {}}
              animate={enterV.animate ?? {}}
              exit={enterV.exit ?? {}}
            >
              <ScreenMockView
                screen={SCREENS[toScreen]}
                showRewardCards={showRewardCards}
                showCampfireGlow={showCampfireGlow}
                showParticles={showParticles}
                speed={speed}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playing indicator */}
      {playing && (
        <div className={styles.playingBadge}>
          <span className={styles.playingDot} />
          Playing
        </div>
      )}
    </div>
  )
}

// ─── Transition timing map (ms at 1x speed) ───────────────────────────────────

const TRANSITION_DURATIONS: Record<TransitionId, number> = {
  'map-battle':    1100,
  'battle-reward': 1100,
  'reward-map':    1100,
  'map-merchant':  1000,
  'map-campfire':  1300,
  'boss-death':    1400,
  'full-loop':     0, // managed separately
}

// Screens used by each transition
const TRANSITION_SCREENS: Record<TransitionId, { from: ScreenId; to: ScreenId }> = {
  'map-battle':    { from: 'map',    to: 'battle' },
  'battle-reward': { from: 'battle', to: 'reward' },
  'reward-map':    { from: 'reward', to: 'map' },
  'map-merchant':  { from: 'map',    to: 'merchant' },
  'map-campfire':  { from: 'map',    to: 'campfire' },
  'boss-death':    { from: 'boss',   to: 'next-area' },
  'full-loop':     { from: 'map',    to: 'battle' },
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Epic11Showcase() {
  const [speed, setSpeed] = useState(1)
  const [loop, setLoop] = useState(false)
  const [activeTransition, setActiveTransition] = useState<TransitionId | null>(null)
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter' | 'done'>('idle')
  const [fromScreen, setFromScreen] = useState<ScreenId>('map')
  const [toScreen, setToScreen] = useState<ScreenId>('battle')
  const [playing, setPlaying] = useState(false)
  const [loopIndex, setLoopIndex] = useState(0)

  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (loopTimeoutRef.current) { clearTimeout(loopTimeoutRef.current); loopTimeoutRef.current = null }
    if (phaseTimeoutRef.current) { clearTimeout(phaseTimeoutRef.current); phaseTimeoutRef.current = null }
  }, [])

  const runTransition = useCallback((tid: TransitionId) => {
    if (tid === 'full-loop') return // handled separately
    const screens = TRANSITION_SCREENS[tid]
    const totalMs = TRANSITION_DURATIONS[tid] / speed

    setActiveTransition(tid)
    setFromScreen(screens.from)
    setToScreen(screens.to)
    setPhase('exit')
    setPlaying(true)

    phaseTimeoutRef.current = setTimeout(() => {
      setPhase('enter')
      phaseTimeoutRef.current = setTimeout(() => {
        setPhase('done')
        setPlaying(false)
      }, totalMs * 0.55)
    }, totalMs * 0.45)
  }, [speed])

  // Full loop runner
  const runFullLoop = useCallback((startIdx: number) => {
    const tid = LOOP_SEQUENCE[startIdx % LOOP_SEQUENCE.length]
    const nextIdx = (startIdx + 1) % LOOP_SEQUENCE.length
    const screens = TRANSITION_SCREENS[tid]
    const totalMs = TRANSITION_DURATIONS[tid] / speed

    setActiveTransition(tid)
    setFromScreen(screens.from)
    setToScreen(screens.to)
    setPhase('exit')
    setPlaying(true)
    setLoopIndex(startIdx % LOOP_SEQUENCE.length)

    phaseTimeoutRef.current = setTimeout(() => {
      setPhase('enter')
      phaseTimeoutRef.current = setTimeout(() => {
        setPhase('done')
        // Schedule next
        loopTimeoutRef.current = setTimeout(() => {
          runFullLoop(nextIdx)
        }, 400 / speed)
      }, totalMs * 0.55)
    }, totalMs * 0.45)
  }, [speed])

  const handleTransitionClick = useCallback((tid: TransitionId) => {
    clearTimers()

    if (tid === 'full-loop') {
      setActiveTransition('full-loop')
      setPlaying(true)
      runFullLoop(0)
      return
    }

    runTransition(tid)
  }, [clearTimers, runTransition, runFullLoop])

  // Loop mode: restart when done
  useEffect(() => {
    if (!loop || playing || !activeTransition || activeTransition === 'full-loop') return
    if (phase !== 'done') return

    loopTimeoutRef.current = setTimeout(() => {
      runTransition(activeTransition)
    }, 600 / speed)

    return () => {
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    }
  }, [loop, playing, phase, activeTransition, runTransition, speed])

  // Stop full loop if loop unchecked
  useEffect(() => {
    if (!loop && activeTransition === 'full-loop') {
      clearTimers()
      setPlaying(false)
      setPhase('idle')
    }
  }, [loop, activeTransition, clearTimers])

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers])

  const currentTransitionDef = activeTransition
    ? TRANSITIONS.find(t => t.id === activeTransition)
    : null

  const statusText = currentTransitionDef
    ? activeTransition === 'full-loop'
      ? `Full Loop — step ${loopIndex + 1}/${LOOP_SEQUENCE.length}: ${TRANSITIONS.find(t => t.id === LOOP_SEQUENCE[loopIndex])?.label ?? ''}`
      : `Currently showing: ${currentTransitionDef.label}`
    : 'Select a transition below'

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Epic 11 — Full Transitions</h2>

      {/* ── Controls bar ── */}
      <div className={styles.controlsBar}>
        <label className={styles.sliderLabel}>
          <span className={styles.sliderLabelText}>Speed</span>
          <input
            type="range"
            className={styles.speedSlider}
            min={1}
            max={30}
            step={1}
            value={Math.round(speed * 10)}
            onChange={e => setSpeed(Number(e.target.value) / 10)}
          />
          <span className={styles.sliderValue}>{speed.toFixed(1)}x</span>
        </label>

        <label className={styles.loopLabel}>
          <input
            type="checkbox"
            className={styles.loopCheckbox}
            checked={loop}
            onChange={e => setLoop(e.target.checked)}
          />
          <span className={styles.loopLabelText}>Loop</span>
        </label>
      </div>

      {/* ── Transition buttons ── */}
      <div className={styles.transitionButtons}>
        {TRANSITIONS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`${styles.transBtn} ${activeTransition === t.id ? styles.transBtnActive : ''}`}
            onClick={() => handleTransitionClick(t.id)}
            title={t.description}
          >
            <span className={styles.transBtnIcon}>{t.icon}</span>
            <span className={styles.transBtnLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Preview area ── */}
      <PreviewArea
        activeTransition={activeTransition}
        playing={playing}
        speed={speed}
        phase={phase}
        fromScreen={fromScreen}
        toScreen={toScreen}
      />

      {/* ── Status bar ── */}
      <div className={styles.statusBar}>
        <span className={styles.statusDot} data-playing={playing} />
        <span className={styles.statusText}>{statusText}</span>
        {playing && (
          <span className={styles.statusPhase}>
            [{phase}]
          </span>
        )}
      </div>
    </div>
  )
}
