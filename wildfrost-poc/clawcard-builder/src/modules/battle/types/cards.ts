// Battle system card types — EPIC 1: Taksonomia kart

export const CardType = {
  Companion: 'companion',
  Item:      'item',
  Clunker:   'clunker',
  Power:     'power',
  Curse:     'curse',
  Charm:     'charm',
} as const
export type CardType = typeof CardType[keyof typeof CardType]

export const CardRarity = {
  Common:   'common',
  Uncommon: 'uncommon',
  Rare:     'rare',
  Boss:     'boss',
} as const
export type CardRarity = typeof CardRarity[keyof typeof CardRarity]

export const Faction = {
  Szponiarze:      'szponiarze',
  Cieniozmiennicy: 'cieniozmiennicy',
  ZelaznaGmina:    'zelazna_gmina',
  KosciLesne:      'kosci_lesne',
  Neutral:         'neutral',
} as const
export type Faction = typeof Faction[keyof typeof Faction]

export const CardSource = {
  Starter: 'starter',
  Reward:  'reward',
  Shop:    'shop',
  Event:   'event',
  Boss:    'boss',
} as const
export type CardSource = typeof CardSource[keyof typeof CardSource]

// ─── Base ───────────────────────────────────────────────────────────────────

export interface BaseCard {
  id: string
  name: string
  imageUrl: string | null
  imageFallback: string
  description: string
  cardType: CardType
  rarity: CardRarity
  faction: Faction
  source: CardSource
}

// ─── Card variants ───────────────────────────────────────────────────────────

export interface BattleCompanionCard extends BaseCard {
  cardType: typeof CardType.Companion
  hp: number
  maxHp: number
  attack: number
  counter: number
  position?: number
  abilities: BattleAbility[]
}

export interface BattleItemCard extends BaseCard {
  cardType: typeof CardType.Item
  energyCost: number
  targets: ItemTarget
  isConsume: boolean
  effect: ItemEffect
}

export interface BattleClunkerCard extends BaseCard {
  cardType: typeof CardType.Clunker
  scrap: number
  maxScrap: number
  attack: number
  counter: number
  abilities: BattleAbility[]
}

export interface BattlePowerCard extends BaseCard {
  cardType: typeof CardType.Power
  energyCost: number
  permanentEffect: string
  abilities: BattleAbility[]
}

export interface BattleCurseCard extends BaseCard {
  cardType: typeof CardType.Curse
  penalty: string
  removable: boolean
}

export interface BattleCharmCard {
  id: string
  name: string
  imageFallback: string
  description: string
  rarity: CardRarity
  compatibleWith: CardType[]
  bonusAttack?: number
  bonusHp?: number
  bonusCounter?: number
  addAbility?: BattleAbility
}

// ─── Supporting types ────────────────────────────────────────────────────────

export interface BattleAbility {
  id: string
  label: string
  description: string
  value?: number
}

export interface ItemEffect {
  damage?: number
  heal?: number
  snow?: number
  shield?: number
  draw?: number
}

export type ItemTarget = 'enemy' | 'ally' | 'all_enemies' | 'all_allies' | 'self'

export type AnyBattleCard =
  | BattleCompanionCard
  | BattleItemCard
  | BattleClunkerCard
  | BattlePowerCard
  | BattleCurseCard

// ─── Guard functions ─────────────────────────────────────────────────────────

export function isCompanion(card: AnyBattleCard): card is BattleCompanionCard {
  return card.cardType === CardType.Companion
}

export function isItem(card: AnyBattleCard): card is BattleItemCard {
  return card.cardType === CardType.Item
}

export function isClunker(card: AnyBattleCard): card is BattleClunkerCard {
  return card.cardType === CardType.Clunker
}

export function isPower(card: AnyBattleCard): card is BattlePowerCard {
  return card.cardType === CardType.Power
}

export function isCurse(card: AnyBattleCard): card is BattleCurseCard {
  return card.cardType === CardType.Curse
}
