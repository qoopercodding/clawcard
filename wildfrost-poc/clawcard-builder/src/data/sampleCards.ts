import type { CompanionCard, ItemCard, AnyCard } from '../types/card.types'

const IMG = (name: string) => `/cards/${name}.png`

export const NAMANDI: CompanionCard = {
  id: 'namandi', name: 'Namandi Shellandi', type: 'companion', tribe: 'shelly',
  imageUrl: null, imageFallback: '🦀',
  description: 'Lider drużyny. Jego śmierć kończy run.',
  createdAt: 0, hp: 11, attack: 1, counter: 1, abilities: [],
}
export const BERRY_SIS: CompanionCard = {
  id: 'berry_sis', name: 'Berry Sis', type: 'companion', tribe: 'snowdwellers',
  imageUrl: IMG('Berry_Sis'), imageFallback: '🫐',
  description: 'When hit, add lost Health to a random ally.',
  createdAt: 0, hp: 8, attack: 2, counter: 3,
  abilities: [{ id: 'transfer_hp', label: 'HP Transfer', description: 'When hit, give lost HP to a random ally' }],
}
export const FOXEE: CompanionCard = {
  id: 'foxee', name: 'Foxee', type: 'companion', tribe: 'shademancers',
  imageUrl: IMG('Foxee'), imageFallback: '🦊',
  description: '×3 Frenzy — attacks 3 times per trigger.',
  createdAt: 0, hp: 4, attack: 1, counter: 3,
  abilities: [{ id: 'frenzy', label: 'Frenzy', description: 'Attacks 3 times per trigger', value: 3 }],
}
export const WALLOP: CompanionCard = {
  id: 'wallop', name: 'Wallop', type: 'companion', tribe: 'clunkmasters',
  imageUrl: IMG('Wallop'), imageFallback: '🐗',
  description: "Deal 8 additional damage to Snow'd targets.",
  createdAt: 0, hp: 9, attack: 4, counter: 4,
  abilities: [{ id: 'snow_bonus', label: 'Snow Crusher', description: "Deal 8 bonus dmg to Snow'd targets", value: 8 }],
}
export const SNOOF: CompanionCard = {
  id: 'snoof', name: 'Snoof', type: 'companion', tribe: 'snowdwellers',
  imageUrl: IMG('Snoof'), imageFallback: '🐧',
  description: 'Apply 1 Snow on trigger.',
  createdAt: 0, hp: 3, attack: 3, counter: 3,
  abilities: [{ id: 'snow_aura', label: 'Snow Aura', description: 'Apply Snow instead of dealing damage', value: 1 }],
}
export const SNEEZLE: CompanionCard = {
  id: 'sneezle', name: 'Sneezle', type: 'companion', tribe: 'snowdwellers',
  imageUrl: IMG('Sneezle'), imageFallback: '🤧',
  description: 'Draw 1 when hit.',
  createdAt: 0, hp: 6, attack: 2, counter: 3,
  abilities: [{ id: 'draw_on_hit', label: 'Sneeze Draw', description: 'Draw 1 card when this unit is hit' }],
}
export const TUSK: CompanionCard = {
  id: 'tusk', name: 'Tusk', type: 'companion', tribe: 'clunkmasters',
  imageUrl: IMG('Tusk'), imageFallback: '🦣',
  description: 'While active, add 3 Teeth to all allies.',
  createdAt: 0, hp: 5, attack: 2, counter: 5,
  abilities: [{ id: 'teeth_aura', label: 'Teeth Aura', description: 'Give +3 Teeth to all allies while active', value: 3 }],
}
export const DREGG: CompanionCard = {
  id: 'dregg', name: 'Dregg', type: 'companion', tribe: 'clunkmasters',
  imageUrl: IMG('Dregg'), imageFallback: '🐲',
  description: 'Boss.',
  createdAt: 0, hp: 20, attack: 5, counter: 3, abilities: [],
}
export const WOODHEAD: CompanionCard = {
  id: 'woodhead', name: 'Woodhead', type: 'companion', tribe: 'clunkmasters',
  imageUrl: IMG('Woodhead'), imageFallback: '🪵',
  description: 'Clunker. Tanks hits for your team.',
  createdAt: 0, hp: 8, attack: 0, counter: 4, abilities: [],
}

export const SWORD: ItemCard = {
  id: 'sword', name: 'Sword', type: 'item_with_attack', tribe: 'none',
  imageUrl: null, imageFallback: '⚔️',
  description: '5 damage to one enemy.',
  createdAt: 0, effect: { damage: 5 }, target: 'enemy', consume: false,
}
export const SNOWBALL: ItemCard = {
  id: 'snowball', name: 'Snowball', type: 'item_without_attack', tribe: 'none',
  imageUrl: null, imageFallback: '❄️',
  description: 'Apply 2 Snow to target.',
  createdAt: 0, effect: { snow: 2 }, target: 'enemy', consume: false,
}
export const BONESAW: ItemCard = {
  id: 'bonesaw', name: 'Bonesaw', type: 'item_with_attack', tribe: 'none',
  imageUrl: null, imageFallback: '🪚',
  description: '3 dmg to all enemies.',
  createdAt: 0, effect: { damage: 3 }, target: 'all_enemies', consume: false,
}
export const HEALBERRY: ItemCard = {
  id: 'healberry', name: 'Healberry', type: 'item_without_attack', tribe: 'none',
  imageUrl: null, imageFallback: '🍓',
  description: 'Restore 3 HP to an ally.',
  createdAt: 0, effect: { heal: 3 }, target: 'ally', consume: false,
}
export const BERRY_BLADE: ItemCard = {
  id: 'berry_blade', name: 'Berry Blade', type: 'item_with_attack', tribe: 'none',
  imageUrl: IMG('Berry_Blade'), imageFallback: '🍇',
  description: '4 dmg. Heal front ally equal to damage.',
  createdAt: 0, effect: { damage: 4, heal: 4 }, target: 'enemy', consume: false,
}

export const SAMPLE_CARDS: Record<string, AnyCard> = {
  namandi: NAMANDI, berry_sis: BERRY_SIS, foxee: FOXEE,
  wallop: WALLOP, snoof: SNOOF, sneezle: SNEEZLE, tusk: TUSK,
  dregg: DREGG, woodhead: WOODHEAD,
  sword: SWORD, snowball: SNOWBALL, bonesaw: BONESAW,
  healberry: HEALBERRY, berry_blade: BERRY_BLADE,
}

export const STARTER_DECK = ['sword','sword','sword','snowball','snowball','bonesaw','healberry','healberry']
export const REWARD_POOL  = ['foxee','wallop','snoof','sneezle','tusk','berry_blade','snowball','healberry']
