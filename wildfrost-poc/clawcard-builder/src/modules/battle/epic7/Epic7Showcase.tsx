// Epic7Showcase.tsx — Epic 7: Merchant Screen

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SHOWCASE_CARDS } from '../data/showcaseCards'
import type { AnyBattleCard } from '../types/cards'
import styles from './Epic7Showcase.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const STARTING_GOLD = 500

const MERCHANT_DIALOGS = [
  'Witaj, podróżniku! Co cię sprowadza do mego skromnego sklepu?',
  'Doskonały wybór! Ten towar naprawdę warto mieć przy sobie.',
  'Ha! Wiem, co lubisz. Mam jeszcze kilka skarbów w zanadrzu.',
  'Kupujesz jak ktoś, kto wie czego chce. Szanuję to!',
  'Hmm, ciekawy smak. Jestem pod wrażeniem twojego wyboru.',
  'Rzadko widuję tak zdecydowanych klientów. Dobry znak!',
  'Wróć kiedy chcesz, zawsze mam coś nowego na składzie.',
]

// ─── Shop item types ──────────────────────────────────────────────────────────

interface ShopCard {
  card: AnyBattleCard
  price: number
  bought: boolean
}

interface ShopCharm {
  id: string
  icon: string
  name: string
  description: string
  price: number
  bought: boolean
}

interface ShopItem {
  id: string
  icon: string
  name: string
  description: string
  price: number
  bought: boolean
}

// ─── Static shop data ─────────────────────────────────────────────────────────

const SHOP_CARDS: ShopCard[] = [
  { card: SHOWCASE_CARDS[0], price: 250, bought: false },
  { card: SHOWCASE_CARDS[1], price: 180, bought: false },
  { card: SHOWCASE_CARDS[2], price: 300, bought: false },
  { card: SHOWCASE_CARDS[6], price: 100, bought: false },
  { card: SHOWCASE_CARDS[7], price: 120, bought: false },
]

const INITIAL_CHARMS: ShopCharm[] = [
  {
    id: 'charm_frenzy',
    icon: '⚡',
    name: 'Urok Furii',
    description: '+1 atak dla wybranej karty.',
    price: 200,
    bought: false,
  },
  {
    id: 'charm_shield',
    icon: '🛡️',
    name: 'Urok Tarczy',
    description: '+3 HP dla wybranej karty.',
    price: 250,
    bought: false,
  },
  {
    id: 'charm_mystery',
    icon: '❓',
    name: 'Tajemniczy Charm',
    description: 'Nieznany efekt. Kupisz w ciemno?',
    price: 100,
    bought: false,
  },
]

const INITIAL_ITEMS: ShopItem[] = [
  {
    id: 'item_potion',
    icon: '🧪',
    name: 'Eliksir Mocy',
    description: '+2 atak na jedną turę.',
    price: 60,
    bought: false,
  },
  {
    id: 'item_scroll',
    icon: '📜',
    name: 'Zwój Lodu',
    description: 'Nałóż 3 Snow na wszystkich wrogów.',
    price: 80,
    bought: false,
  },
  {
    id: 'item_bread',
    icon: '🍞',
    name: 'Magiczny Chleb',
    description: 'Ulecz 5 HP wybranego sojusznika.',
    price: 30,
    bought: false,
  },
]

// ─── Charm Equip Screen ───────────────────────────────────────────────────────

interface CharmEquipScreenProps {
  charm: ShopCharm
  onEquip: (cardId: string) => void
  onClose: () => void
}

const EQUIP_CARDS = SHOWCASE_CARDS.slice(0, 4)

function CharmEquipScreen({ charm, onEquip, onClose }: CharmEquipScreenProps) {
  const [equipped, setEquipped] = useState<string | null>(null)

  const handleEquip = useCallback((cardId: string) => {
    setEquipped(cardId)
    setTimeout(() => {
      onEquip(cardId)
    }, 800)
  }, [onEquip])

  return (
    <motion.div
      className={styles.equipOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.equipPanel}
        initial={{ scale: 0.88, opacity: 0, y: 32 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 32 }}
        transition={{ type: 'spring' as const, stiffness: 340, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.equipHeader}>
          <span className={styles.equipCharmIcon}>{charm.icon}</span>
          <div>
            <h3 className={styles.equipTitle}>Wybierz kartę dla uroku</h3>
            <p className={styles.equipSubtitle}>{charm.name}: {charm.description}</p>
          </div>
          <button className={styles.equipClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.equipCardGrid}>
          {EQUIP_CARDS.map(card => {
            const isEquipped = equipped === card.id
            return (
              <motion.button
                key={card.id}
                className={`${styles.equipCard} ${isEquipped ? styles.equipCardDone : ''}`}
                onClick={() => !equipped && handleEquip(card.id)}
                whileHover={!equipped ? { scale: 1.04 } : {}}
                whileTap={!equipped ? { scale: 0.97 } : {}}
              >
                <span className={styles.equipCardEmoji}>{card.imageFallback}</span>
                <span className={styles.equipCardName}>{card.name}</span>
                {isEquipped && (
                  <motion.span
                    className={styles.equipBadge}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring' as const, stiffness: 500, damping: 20 }}
                  >
                    {charm.icon} Założono!
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'karty' | 'charmy' | 'itemy'

const TABS: { id: TabId; label: string }[] = [
  { id: 'karty', label: 'Karty' },
  { id: 'charmy', label: 'Charmy' },
  { id: 'itemy', label: 'Itemy' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function Epic7Showcase() {
  const [gold, setGold] = useState(STARTING_GOLD)
  const [activeTab, setActiveTab] = useState<TabId>('karty')
  const [shopCards, setShopCards] = useState<ShopCard[]>(SHOP_CARDS.map(sc => ({ ...sc })))
  const [charms, setCharms] = useState<ShopCharm[]>(INITIAL_CHARMS.map(c => ({ ...c })))
  const [items, setItems] = useState<ShopItem[]>(INITIAL_ITEMS.map(i => ({ ...i })))
  const [dialogIndex, setDialogIndex] = useState(0)
  const [equipCharm, setEquipCharm] = useState<ShopCharm | null>(null)
  const [leaving, setLeaving] = useState(false)

  const advanceDialog = useCallback(() => {
    setDialogIndex(prev => (prev + 1) % MERCHANT_DIALOGS.length)
  }, [])

  const buyCard = useCallback((idx: number) => {
    const sc = shopCards[idx]
    if (sc.bought || gold < sc.price) return
    setGold(g => g - sc.price)
    setShopCards(prev => prev.map((c, i) => i === idx ? { ...c, bought: true } : c))
    advanceDialog()
  }, [shopCards, gold, advanceDialog])

  const buyCharm = useCallback((idx: number) => {
    const charm = charms[idx]
    if (charm.bought || gold < charm.price) return
    setGold(g => g - charm.price)
    setCharms(prev => prev.map((c, i) => i === idx ? { ...c, bought: true } : c))
    setEquipCharm(charm)
    advanceDialog()
  }, [charms, gold, advanceDialog])

  const buyItem = useCallback((idx: number) => {
    const item = items[idx]
    if (item.bought || gold < item.price) return
    setGold(g => g - item.price)
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, bought: true } : it))
    advanceDialog()
  }, [items, gold, advanceDialog])

  const handleLeave = useCallback(() => {
    setLeaving(true)
    setTimeout(() => setLeaving(false), 1800)
  }, [])

  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Epic 7 — Ekran Kupca</h2>

      {/* ── Merchant area ── */}
      <div className={styles.merchantArea}>
        <div className={styles.merchantFigure}>
          <span className={styles.merchantEmoji}>🧙</span>
          <span className={styles.merchantLabel}>Kupiec</span>
        </div>
        <div className={styles.speechBubble}>
          <AnimatePresence mode="wait">
            <motion.p
              key={dialogIndex}
              className={styles.speechText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {MERCHANT_DIALOGS[dialogIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className={styles.tabContent}>
        <AnimatePresence mode="wait">
          {activeTab === 'karty' && (
            <motion.div
              key="karty"
              className={styles.tabPane}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {shopCards.map((sc, idx) => (
                <ShopCardRow
                  key={sc.card.id}
                  emoji={sc.card.imageFallback}
                  name={sc.card.name}
                  description={sc.card.description}
                  price={sc.price}
                  bought={sc.bought}
                  canAfford={gold >= sc.price}
                  onBuy={() => buyCard(idx)}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'charmy' && (
            <motion.div
              key="charmy"
              className={styles.tabPane}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.charmGrid}>
                {charms.map((charm, idx) => (
                  <CharmTile
                    key={charm.id}
                    charm={charm}
                    canAfford={gold >= charm.price}
                    onBuy={() => buyCharm(idx)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'itemy' && (
            <motion.div
              key="itemy"
              className={styles.tabPane}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {items.map((item, idx) => (
                <ShopCardRow
                  key={item.id}
                  emoji={item.icon}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  bought={item.bought}
                  canAfford={gold >= item.price}
                  onBuy={() => buyItem(idx)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Resources bar ── */}
      <div className={styles.resourcesBar}>
        <div className={styles.goldDisplay}>
          <span className={styles.goldIcon}>💰</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={gold}
              className={styles.goldAmount}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring' as const, stiffness: 420, damping: 22 }}
            >
              {gold}g
            </motion.span>
          </AnimatePresence>
        </div>
        <button className={styles.leaveBtn} onClick={handleLeave}>
          Opuść sklep
        </button>
      </div>

      {/* ── Charm equip screen ── */}
      <AnimatePresence>
        {equipCharm && (
          <CharmEquipScreen
            charm={equipCharm}
            onEquip={() => setEquipCharm(null)}
            onClose={() => setEquipCharm(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Leave overlay ── */}
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
              Opuściłeś sklep
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ShopCardRow ──────────────────────────────────────────────────────────────

interface ShopCardRowProps {
  emoji: string
  name: string
  description: string
  price: number
  bought: boolean
  canAfford: boolean
  onBuy: () => void
}

function ShopCardRow({ emoji, name, description, price, bought, canAfford, onBuy }: ShopCardRowProps) {
  return (
    <motion.div
      className={`${styles.shopRow} ${bought ? styles.shopRowBought : ''}`}
      layout
    >
      <span className={styles.shopRowEmoji}>{emoji}</span>
      <div className={styles.shopRowInfo}>
        <span className={styles.shopRowName}>{name}</span>
        <span className={styles.shopRowDesc}>{description}</span>
      </div>
      <div className={styles.shopRowAction}>
        <span className={styles.shopRowPrice}>💰 {price}g</span>
        {bought ? (
          <motion.span
            className={styles.boughtBadge}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' as const, stiffness: 500, damping: 18 }}
          >
            Kupiono!
          </motion.span>
        ) : (
          <button
            className={styles.buyBtn}
            disabled={!canAfford}
            onClick={onBuy}
          >
            Kup
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── CharmTile ────────────────────────────────────────────────────────────────

interface CharmTileProps {
  charm: ShopCharm
  canAfford: boolean
  onBuy: () => void
}

function CharmTile({ charm, canAfford, onBuy }: CharmTileProps) {
  return (
    <div className={`${styles.charmTile} ${charm.bought ? styles.charmTileBought : ''}`}>
      <div className={styles.charmCircle}>
        <span className={styles.charmCircleIcon}>{charm.icon}</span>
      </div>
      <span className={styles.charmName}>{charm.name}</span>
      <span className={styles.charmDesc}>{charm.description}</span>
      <span className={styles.charmPrice}>💰 {charm.price}g</span>
      {charm.bought ? (
        <motion.span
          className={styles.boughtBadge}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' as const, stiffness: 500, damping: 18 }}
        >
          Kupiono!
        </motion.span>
      ) : (
        <button
          className={styles.buyBtn}
          disabled={!canAfford}
          onClick={onBuy}
        >
          Kup
        </button>
      )}
    </div>
  )
}
