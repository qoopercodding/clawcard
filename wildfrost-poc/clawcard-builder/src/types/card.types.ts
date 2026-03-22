export type CardType =
  | 'companion'
  | 'item_with_attack'
  | 'item_without_attack'
  | 'clunker'
  | 'shade'
  | 'charm'
  | 'boss'
  | 'transformer'
  | 'testets'
  | 'test2'
  | 'test3'
  | '__test_dry_run__'
  | '__git_push__'
  | '__e2e_test__'

export type TribeType =
  | 'snowdwellers'
  | 'shademancers'
  | 'clunkmasters'
  | 'transformers'
  | 'shelly'
  | 'none'

export type Keyword =
  | 'frenzy'
  | 'smackback'
  | 'consume'
  | 'teeth'
  | 'bom'
  | 'overburn'
  | 'ink'
  | 'transform'
  | 'overheat'

export interface CardBase {
  id: string
  name: string
  type: CardType
  tribe: TribeType
  imageUrl: string | null
  imageFallback: string
  description: string
  createdAt: number
}

export interface Ability {
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
  overburn?: number
}

export interface CharmEffect {
  addAttack?: number
  addHp?: number
  addCounter?: number
  addAbility?: Ability
  addKeyword?: Keyword
}

export interface CompanionCard extends CardBase {
  type: 'companion'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

export interface ItemCard extends CardBase {
  type: 'item_with_attack' | 'item_without_attack'
  effect: ItemEffect
  target: 'enemy' | 'ally' | 'all_enemies' | 'all_allies'
  consume: boolean
}

export interface ClunkerCard extends CardBase {
  type: 'clunker'
  scrap: number
  attack: number
  counter: number
  abilities: Ability[]
}

export interface ShadeCard extends CardBase {
  type: 'shade'
  hp: number
  attack: number
  counter: number
  decayOnTrigger: boolean
  summonedBy: string
}

export interface CharmCard extends CardBase {
  type: 'charm'
  effect: CharmEffect
  compatibleWith: CardType[]
}

export interface BossCard extends CardBase {
  type: 'boss'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

export interface TransformerCard extends CardBase {
  type: 'transformer'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
  transformThreshold: number
  transformedAttack: number
  transformed: boolean
}

export interface TestetsCard extends CardBase {
  type: 'testets'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

export interface Test2Card extends CardBase {
  type: 'test2'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

export interface Test3Card extends CardBase {
  type: 'test3'
  hp: number
  attack: number
  counter: number
  abilities: Ability[]
}

export type AnyCard =
  | CompanionCard
  | ItemCard
  | ClunkerCard
  | ShadeCard
  | CharmCard
  | BossCard
  | TransformerCard
  | TestetsCard
  | Test2Card
  | Test3Card
