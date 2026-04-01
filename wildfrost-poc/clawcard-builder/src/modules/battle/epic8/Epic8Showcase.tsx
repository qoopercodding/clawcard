// Epic8Showcase.tsx — Epic 8: Campfire Screen

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import styles from './Epic8Showcase.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_HP = 45
const MOCK_MAX_HP = 100
const REST_HP_GAIN = 30

const MOCK_DECK_CARDS = SHOWCASE_CARDS.slice(0, 8)
const UPGRADE_CARDS = SHOWCASE_CARDS.slice(0, 5)

type MainAction = 'rest' | 'upgrade' | 'forge' | null

// ─── Campfire ─────────────────────────────────────────────────────────────────

function Campfire() {
  return (
    <div className={styles.campfireWrap}>
      <div className={styles.fireGlow} />
      <div className={styles.fireContainer}>
        <div className={`${styles.flame} ${styles.flameBack}`} />
        <div className={`${styles.flame} ${styles.flameMid}`} />
        <div className={`${styles.flame} ${styles.flameFront}`} />
        <div className={`${styles.ember} ${styles.ember1}`} />
        <div className={`${styles.ember} ${styles.ember2}`} />
        <div className={`${styles.ember} ${styles.ember3}`} />
      </div>
      <div className={styles.logs} />
    </div>
  )
}

// ─── HP Bar ───────────────────────────────────────────────────────────────────

interface HpBarProps {
  current: number
  max: number
  animating: boolean
}

function HpBar({ current, max, animating }: HpBarProps) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  const color = pct >= 66 ? '#4caf50' : pct >= 33 ? '#ffcc00' : '#ff4444'

  return (
    <div className={styles.hpBarWrap}>
      <span className={styles.hpLabel}>HP:</span>
      <div className={styles.hpTrack}>
        <motion.div
          className={styles.hpFill}
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: animating ? 1.2 : 0, ease: 'easeOut' as const }}
        />
      </div>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={current}
          className={styles.hpText}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
        >
          {current}/{max}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// ─── Upgrade sub-panel ────────────────────────────────────────────────────────

interface UpgradePanelProps {
  onDone: () => void
}

function UpgradePanel({ onDone }: UpgradePanelProps) {
  const [upgraded, setUpgraded] = useState<string | null>(null)

  const handleUpgrade = useCallback((id: string) => {
    if (upgraded) return
    setUpgraded(id)
    setTimeout(onDone, 900)
  }, [upgraded, onDone])

  return (
    <motion.div
      className={styles.upgradePanel}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' as const }}
    >
      <p className={styles.upgradePanelTitle}>Wybierz kartę do ulepszenia:</p>
      <div className={styles.upgradeCardRow}>
        {UPGRADE_CARDS.map(card => {
          const isUpgraded = upgraded === card.id
          return (
            <motion.button
              key={card.id}
              className={`${styles.upgradeCard} ${isUpgraded ? styles.upgradeCardDone : ''}`}
              onClick={() => handleUpgrade(card.id)}
              whileHover={!upgraded ? { scale: 1.06 } : {}}
              whileTap={!upgraded ? { scale: 0.95 } : {}}
              disabled={!!upgraded && !isUpgraded}
            >
              <span className={styles.upgradeCardEmoji}>{card.imageFallback}</span>
              <span className={styles.upgradeCardName}>{card.name}</span>
              <AnimatePresence>
                {isUpgraded && (
                  <motion.span
                    className={styles.upgradedBadge}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring' as const, stiffness: 500, damping: 22 }}
                  >
                    ↑ Ulepszona
                  </motion.span>
                )}
              </AnimatePresence>
              {isUpgraded && <div className={styles.sparkleRing} />}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Deck overlay ─────────────────────────────────────────────────────────────

interface DeckOverlayProps {
  onClose: () => void
}

function DeckOverlay({ onClose }: DeckOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      className={styles.deckOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.deckPanel}
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: 'spring' as const, stiffness: 340, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.deckPanelHeader}>
          <h3 className={styles.deckPanelTitle}>Studium Talii</h3>
          <button className={styles.deckCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.deckCardGrid}>
          {MOCK_DECK_CARDS.map(card => (
            <div key={card.id} className={styles.deckCard}>
              <span className={styles.deckCardEmoji}>{card.imageFallback}</span>
              <span className={styles.deckCardName}>{card.name}</span>
              <span className={styles.deckCardDesc}>{card.description}</span>
            </div>
          ))}
        </div>
        <p className={styles.deckHint}>ESC lub ✕ aby zamknąć</p>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Epic8Showcase() {
  const [hp, setHp] = useState(MOCK_HP)
  const [hpAnimating, setHpAnimating] = useState(false)
  const [chosenAction, setChosenAction] = useState<MainAction>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showDeck, setShowDeck] = useState(false)
  const [floatingHp, setFloatingHp] = useState(false)
  const [heartPulse, setHeartPulse] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isLowHp = hp < MOCK_MAX_HP * 0.5

  const handleRest = useCallback(() => {
    if (chosenAction) return
    setChosenAction('rest')
    setHpAnimating(true)
    setHeartPulse(true)
    setFloatingHp(true)
    setHp(prev => Math.min(MOCK_MAX_HP, prev + REST_HP_GAIN))
    setTimeout(() => setFloatingHp(false), 1400)
    setTimeout(() => setHeartPulse(false), 1000)
    setTimeout(() => setHpAnimating(false), 1400)
  }, [chosenAction])

  const handleUpgradeChoice = useCallback(() => {
    if (chosenAction) return
    setChosenAction('upgrade')
    setShowUpgrade(true)
  }, [chosenAction])

  const handleUpgradeDone = useCallback(() => {
    setShowUpgrade(false)
  }, [])

  const handleLeave = useCallback(() => {
    setLeaving(true)
    setTimeout(() => setLeaving(false), 1800)
  }, [])

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Epic 8 — Ognisko</h2>

      {/* ── HP bar top ── */}
      <HpBar current={hp} max={MOCK_MAX_HP} animating={hpAnimating} />

      {/* ── Main layout ── */}
      <div className={styles.mainLayout}>

        {/* ── Campfire center ── */}
        <div className={styles.campfireArea}>
          <Campfire />
          <p className={styles.campfireCaption}>Odpoczywasz przy ognisku</p>
        </div>

        {/* ── Actions panel ── */}
        <div className={styles.actionsPanel}>
          <p className={styles.actionsPanelTitle}>Co robisz przy ognisku?</p>

          {/* Action 1: Rest */}
          <div className={styles.actionBlock}>
            <motion.button
              className={`${styles.actionBtn} ${chosenAction === 'rest' ? styles.actionBtnDone : ''} ${chosenAction && chosenAction !== 'rest' ? styles.actionBtnDisabled : ''}`}
              onClick={handleRest}
              disabled={!!chosenAction && chosenAction !== 'rest'}
              whileHover={!chosenAction ? { scale: 1.02 } : {}}
              whileTap={!chosenAction ? { scale: 0.98 } : {}}
            >
              <span className={`${styles.actionIcon} ${heartPulse ? styles.heartPulse : ''}`}>❤️</span>
              <div className={styles.actionInfo}>
                <span className={styles.actionName}>Odpoczynek</span>
                <span className={styles.actionDesc}>
                  Przywróć 30% HP (+{REST_HP_GAIN} HP)
                </span>
              </div>
              {isLowHp && chosenAction !== 'rest' && (
                <motion.span
                  className={styles.recommendedBadge}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                >
                  Zalecane
                </motion.span>
              )}
              {chosenAction === 'rest' && (
                <span className={styles.doneBadge}>Zrobione ✓</span>
              )}
            </motion.button>

            {/* Floating +HP message */}
            <AnimatePresence>
              {floatingHp && (
                <motion.span
                  className={styles.floatingHp}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -28 }}
                  exit={{ opacity: 0, y: -48 }}
                  transition={{ duration: 0.9, ease: 'easeOut' as const }}
                >
                  +{REST_HP_GAIN} HP
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Action 2: Upgrade */}
          <motion.button
            className={`${styles.actionBtn} ${chosenAction === 'upgrade' ? styles.actionBtnDone : ''} ${chosenAction && chosenAction !== 'upgrade' ? styles.actionBtnDisabled : ''}`}
            onClick={handleUpgradeChoice}
            disabled={!!chosenAction && chosenAction !== 'upgrade'}
            whileHover={!chosenAction ? { scale: 1.02 } : {}}
            whileTap={!chosenAction ? { scale: 0.98 } : {}}
          >
            <span className={styles.actionIcon}>✨</span>
            <div className={styles.actionInfo}>
              <span className={styles.actionName}>Ulepszenie Karty</span>
              <span className={styles.actionDesc}>Ulepsz jedną kartę z talii</span>
            </div>
            {chosenAction === 'upgrade' && (
              <span className={styles.doneBadge}>Zrobione ✓</span>
            )}
          </motion.button>

          {/* Upgrade sub-panel */}
          <AnimatePresence>
            {showUpgrade && (
              <UpgradePanel onDone={handleUpgradeDone} />
            )}
          </AnimatePresence>

          {/* Action 3: Forge (disabled - no materials) */}
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDisabled}`}
            disabled
          >
            <span className={styles.actionIcon}>🔨</span>
            <div className={styles.actionInfo}>
              <span className={styles.actionName}>Kucie Charmu</span>
              <span className={styles.actionDesc}>Wymagane: Surowiec</span>
            </div>
            <span className={styles.missingBadge}>Brak surowca</span>
          </button>

          {/* Action 4: Study deck — always available, no consume */}
          <motion.button
            className={styles.actionBtn}
            onClick={() => setShowDeck(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.actionIcon}>📖</span>
            <div className={styles.actionInfo}>
              <span className={styles.actionName}>Studium Talii</span>
              <span className={styles.actionDesc}>Przejrzyj talię (zawsze dostępne)</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* ── Leave button ── */}
      <div className={styles.bottomBar}>
        <motion.button
          className={styles.leaveBtn}
          onClick={handleLeave}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Ruszaj dalej →
        </motion.button>
      </div>

      {/* ── Deck overlay ── */}
      <AnimatePresence>
        {showDeck && (
          <DeckOverlay onClose={() => setShowDeck(false)} />
        )}
      </AnimatePresence>

      {/* ── Leaving overlay ── */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            className={styles.leaveOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.span
              className={styles.leaveText}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
            >
              Wyruszasz w dalszą podróż...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
