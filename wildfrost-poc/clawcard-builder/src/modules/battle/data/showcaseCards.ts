import {
  CardType, CardRarity, Faction, CardSource,
  type AnyBattleCard,
  type BattleCompanionCard, type BattleItemCard,
  type BattleClunkerCard, type BattlePowerCard, type BattleCurseCard,
} from '../types/cards'

const BASE = import.meta.env.BASE_URL
const IMG = (name: string) => `${BASE}cards/${name}.png`

// ─── Companions ──────────────────────────────────────────────────────────────

const NAMANDI: BattleCompanionCard = {
  id: 'namandi', name: 'Namandi Shellandi',
  imageUrl: null, imageFallback: '🦀',
  description: 'Lider drużyny. Jego śmierć kończy run.',
  cardType: CardType.Companion,
  rarity: CardRarity.Rare, faction: Faction.Szponiarze, source: CardSource.Starter,
  hp: 11, maxHp: 11, attack: 1, counter: 1, abilities: [],
}

const BERRY_SIS: BattleCompanionCard = {
  id: 'berry_sis', name: 'Berry Sis',
  imageUrl: IMG('Berry_Sis'), imageFallback: '🫐',
  description: 'When hit, add lost Health to a random ally.',
  cardType: CardType.Companion,
  rarity: CardRarity.Uncommon, faction: Faction.ZelaznaGmina, source: CardSource.Reward,
  hp: 8, maxHp: 8, attack: 2, counter: 3,
  abilities: [{ id: 'transfer_hp', label: 'HP Transfer', description: 'When hit, give lost HP to a random ally' }],
}

const FOXEE: BattleCompanionCard = {
  id: 'foxee', name: 'Foxee',
  imageUrl: IMG('Foxee'), imageFallback: '🦊',
  description: '×3 Frenzy — attacks 3 times per trigger.',
  cardType: CardType.Companion,
  rarity: CardRarity.Rare, faction: Faction.Cieniozmiennicy, source: CardSource.Reward,
  hp: 4, maxHp: 4, attack: 1, counter: 3,
  abilities: [{ id: 'frenzy', label: 'Frenzy ×3', description: 'Attacks 3 times per trigger', value: 3 }],
}

const WALLOP: BattleCompanionCard = {
  id: 'wallop', name: 'Wallop',
  imageUrl: IMG('Wallop'), imageFallback: '🐗',
  description: "Deal 8 additional damage to Snow'd targets.",
  cardType: CardType.Companion,
  rarity: CardRarity.Uncommon, faction: Faction.Szponiarze, source: CardSource.Reward,
  hp: 9, maxHp: 9, attack: 4, counter: 4,
  abilities: [{ id: 'snow_bonus', label: 'Snow Crusher', description: "Deal 8 bonus dmg to Snow'd targets", value: 8 }],
}

const SNOOF: BattleCompanionCard = {
  id: 'snoof', name: 'Snoof',
  imageUrl: IMG('Snoof'), imageFallback: '🐧',
  description: 'Apply 1 Snow on trigger.',
  cardType: CardType.Companion,
  rarity: CardRarity.Common, faction: Faction.ZelaznaGmina, source: CardSource.Reward,
  hp: 3, maxHp: 3, attack: 3, counter: 3,
  abilities: [{ id: 'snow_aura', label: 'Snow Aura', description: 'Apply Snow instead of dealing damage', value: 1 }],
}

const SNEEZLE: BattleCompanionCard = {
  id: 'sneezle', name: 'Sneezle',
  imageUrl: IMG('Sneezle'), imageFallback: '🤧',
  description: 'Draw 1 when hit.',
  cardType: CardType.Companion,
  rarity: CardRarity.Common, faction: Faction.ZelaznaGmina, source: CardSource.Reward,
  hp: 6, maxHp: 6, attack: 2, counter: 3,
  abilities: [{ id: 'draw_on_hit', label: 'Sneeze Draw', description: 'Draw 1 card when this unit is hit' }],
}

// ─── Items ───────────────────────────────────────────────────────────────────

const SWORD: BattleItemCard = {
  id: 'sword', name: 'Sword',
  imageUrl: null, imageFallback: '⚔️',
  description: '5 damage to one enemy.',
  cardType: CardType.Item,
  rarity: CardRarity.Common, faction: Faction.Neutral, source: CardSource.Starter,
  energyCost: 1, targets: 'enemy', isConsume: false,
  effect: { damage: 5 },
}

const SNOWBALL: BattleItemCard = {
  id: 'snowball', name: 'Snowball',
  imageUrl: null, imageFallback: '❄️',
  description: 'Apply 2 Snow to target.',
  cardType: CardType.Item,
  rarity: CardRarity.Common, faction: Faction.Neutral, source: CardSource.Starter,
  energyCost: 1, targets: 'enemy', isConsume: false,
  effect: { snow: 2 },
}

const HEALBERRY: BattleItemCard = {
  id: 'healberry', name: 'Healberry',
  imageUrl: null, imageFallback: '🍓',
  description: 'Restore 3 HP to an ally.',
  cardType: CardType.Item,
  rarity: CardRarity.Common, faction: Faction.Neutral, source: CardSource.Shop,
  energyCost: 1, targets: 'ally', isConsume: false,
  effect: { heal: 3 },
}

const BERRY_BLADE: BattleItemCard = {
  id: 'berry_blade', name: 'Berry Blade',
  imageUrl: IMG('Berry_Blade'), imageFallback: '🍇',
  description: '4 dmg. Heal front ally equal to damage.',
  cardType: CardType.Item,
  rarity: CardRarity.Uncommon, faction: Faction.ZelaznaGmina, source: CardSource.Reward,
  energyCost: 2, targets: 'enemy', isConsume: false,
  effect: { damage: 4, heal: 4 },
}

// ─── Clunkers ────────────────────────────────────────────────────────────────

const WOODHEAD: BattleClunkerCard = {
  id: 'woodhead', name: 'Woodhead',
  imageUrl: IMG('Woodhead'), imageFallback: '🪵',
  description: 'Clunker. Tanks hits for your team.',
  cardType: CardType.Clunker,
  rarity: CardRarity.Common, faction: Faction.Szponiarze, source: CardSource.Shop,
  scrap: 4, maxScrap: 4, attack: 0, counter: 4, abilities: [],
}

const IRON_BASTION: BattleClunkerCard = {
  id: 'iron_bastion', name: 'Iron Bastion',
  imageUrl: null, imageFallback: '🛡️',
  description: 'Shield 3 to all allies when hit.',
  cardType: CardType.Clunker,
  rarity: CardRarity.Uncommon, faction: Faction.Szponiarze, source: CardSource.Shop,
  scrap: 6, maxScrap: 6, attack: 0, counter: 5,
  abilities: [{ id: 'shield_pulse', label: 'Shield Pulse', description: 'Give Shield 3 to all allies when hit', value: 3 }],
}

const BOMB_CART: BattleClunkerCard = {
  id: 'bomb_cart', name: 'Bomb Cart',
  imageUrl: null, imageFallback: '💣',
  description: 'When scrapped: deal 8 dmg to all enemies.',
  cardType: CardType.Clunker,
  rarity: CardRarity.Rare, faction: Faction.Szponiarze, source: CardSource.Reward,
  scrap: 2, maxScrap: 2, attack: 2, counter: 3,
  abilities: [{ id: 'death_explosion', label: 'Death Blast', description: 'Deal 8 dmg to all enemies when scrapped', value: 8 }],
}

// ─── Powers ──────────────────────────────────────────────────────────────────

const WAR_CRY: BattlePowerCard = {
  id: 'war_cry', name: 'War Cry',
  imageUrl: null, imageFallback: '📯',
  description: 'All allies gain +2 Attack permanently.',
  cardType: CardType.Power,
  rarity: CardRarity.Uncommon, faction: Faction.Neutral, source: CardSource.Reward,
  energyCost: 2, permanentEffect: '+2 ATK to all allies',
  abilities: [{ id: 'atk_boost', label: 'War Cry', description: '+2 Attack to all allies', value: 2 }],
}

const FROST_CROWN: BattlePowerCard = {
  id: 'frost_crown', name: 'Frost Crown',
  imageUrl: null, imageFallback: '👑',
  description: 'At start of each turn, apply 1 Snow to all enemies.',
  cardType: CardType.Power,
  rarity: CardRarity.Rare, faction: Faction.ZelaznaGmina, source: CardSource.Boss,
  energyCost: 3, permanentEffect: 'Snow 1 all enemies per turn',
  abilities: [{ id: 'frost_aura', label: 'Frost Aura', description: 'Apply 1 Snow to all enemies each turn', value: 1 }],
}

// ─── Curses ──────────────────────────────────────────────────────────────────

const DEAD_WEIGHT: BattleCurseCard = {
  id: 'dead_weight', name: 'Dead Weight',
  imageUrl: null, imageFallback: '⚓',
  description: 'Costs 1 Energy. Does nothing.',
  cardType: CardType.Curse,
  rarity: CardRarity.Common, faction: Faction.Neutral, source: CardSource.Event,
  penalty: 'Costs 1 energy with no benefit', removable: true,
}

const FROSTBITE: BattleCurseCard = {
  id: 'frostbite', name: 'Frostbite',
  imageUrl: null, imageFallback: '🥶',
  description: 'Apply 1 Snow to a random ally when drawn.',
  cardType: CardType.Curse,
  rarity: CardRarity.Uncommon, faction: Faction.ZelaznaGmina, source: CardSource.Boss,
  penalty: 'Apply 1 Snow to random ally when drawn', removable: false,
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const SHOWCASE_CARDS: AnyBattleCard[] = [
  NAMANDI, BERRY_SIS, FOXEE, WALLOP, SNOOF, SNEEZLE,
  SWORD, SNOWBALL, HEALBERRY, BERRY_BLADE,
  WOODHEAD, IRON_BASTION, BOMB_CART,
  WAR_CRY, FROST_CROWN,
  DEAD_WEIGHT, FROSTBITE,
]
