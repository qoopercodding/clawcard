// =============================================================================
// StatusEffects.ts — System efektów statusu
// =============================================================================
//
// Każdy efekt ma: id, name, emoji, opis, czy stackowalny, co robi na koniec tury.
// Używany przez gridBattleEngine i Card Editor.
// =============================================================================

export interface StatusEffectDef {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  stackable: boolean
  /** Czy zmniejsza się o 1 co turę */
  decays: boolean
  /** Efekt na początku tury posiadacza */
  onTurnStart?: (stacks: number) => {
    damage?: number
    heal?: number
    skipTurn?: boolean
  }
  /** Modyfikator zadawanych obrażeń (mnożnik) */
  outgoingDamageMod?: (stacks: number) => number
  /** Modyfikator otrzymywanych obrażeń (mnożnik) */
  incomingDamageMod?: (stacks: number) => number
}

export const STATUS_EFFECTS: Record<string, StatusEffectDef> = {
  poison: {
    id: 'poison',
    name: 'Poison',
    emoji: '☠️',
    color: '#4ade80',
    description: 'Zadaje X obrażeń na początku tury. Zmniejsza się o 1 co turę.',
    stackable: true,
    decays: true,
    onTurnStart: (stacks) => ({ damage: stacks }),
  },

  snow: {
    id: 'snow',
    name: 'Snow',
    emoji: '❄️',
    color: '#67e8f9',
    description: 'Blokuje następny atak. Każdy zablokowany atak zużywa 1 stak.',
    stackable: true,
    decays: false,
  },

  shield: {
    id: 'shield',
    name: 'Shield',
    emoji: '🛡️',
    color: '#60a5fa',
    description: 'Absorbuje X obrażeń. Nie odnawia się.',
    stackable: true,
    decays: false,
  },

  teeth: {
    id: 'teeth',
    name: 'Teeth',
    emoji: '🦷',
    color: '#facc15',
    description: 'Gdy zaatakowany, zadaje X obrażeń atakującemu.',
    stackable: true,
    decays: false,
  },

  strength: {
    id: 'strength',
    name: 'Strength',
    emoji: '💪',
    color: '#f87171',
    description: 'Zwiększa ATK o X permanentnie.',
    stackable: true,
    decays: false,
    outgoingDamageMod: (stacks) => stacks, // additive bonus
  },

  weak: {
    id: 'weak',
    name: 'Weak',
    emoji: '😵',
    color: '#a78bfa',
    description: 'Zadaje 25% mniej obrażeń. Trwa X tur.',
    stackable: true,
    decays: true,
    outgoingDamageMod: () => -0.25, // -25% multiplier
  },

  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    emoji: '🎯',
    color: '#fb923c',
    description: 'Otrzymuje 50% więcej obrażeń. Trwa X tur.',
    stackable: true,
    decays: true,
    incomingDamageMod: () => 0.5, // +50%
  },

  berserk: {
    id: 'berserk',
    name: 'Berserk',
    emoji: '🔥',
    color: '#ef4444',
    description: 'Atakuje losowy cel. +X do ATK.',
    stackable: true,
    decays: false,
    outgoingDamageMod: (stacks) => stacks,
  },

  regen: {
    id: 'regen',
    name: 'Regen',
    emoji: '💚',
    color: '#86efac',
    description: 'Leczy X HP na początku tury. Zmniejsza się o 1.',
    stackable: true,
    decays: true,
    onTurnStart: (stacks) => ({ heal: stacks }),
  },
}

/** Oblicz końcowe obrażenia z uwzględnieniem efektów statusu */
export function calcOutgoingDamage(baseDmg: number, effects: Record<string, number>): number {
  let dmg = baseDmg
  for (const [id, stacks] of Object.entries(effects)) {
    const def = STATUS_EFFECTS[id]
    if (!def?.outgoingDamageMod || stacks <= 0) continue
    const mod = def.outgoingDamageMod(stacks)
    if (mod > 0) {
      dmg += mod // additive (strength, berserk)
    } else {
      dmg = Math.floor(dmg * (1 + mod)) // multiplicative (weak)
    }
  }
  return Math.max(0, dmg)
}

/** Oblicz końcowe otrzymane obrażenia */
export function calcIncomingDamage(baseDmg: number, effects: Record<string, number>): number {
  let dmg = baseDmg
  for (const [id, stacks] of Object.entries(effects)) {
    const def = STATUS_EFFECTS[id]
    if (!def?.incomingDamageMod || stacks <= 0) continue
    const mod = def.incomingDamageMod(stacks)
    dmg = Math.floor(dmg * (1 + mod))
  }
  return Math.max(0, dmg)
}

/** Procesuj efekty na początku tury — zwraca { damage, heal, skipTurn } */
export function processTurnStartEffects(effects: Record<string, number>): {
  damage: number
  heal: number
  skipTurn: boolean
  updatedEffects: Record<string, number>
} {
  let damage = 0
  let heal = 0
  let skipTurn = false
  const updated = { ...effects }

  for (const [id, stacks] of Object.entries(effects)) {
    const def = STATUS_EFFECTS[id]
    if (!def || stacks <= 0) continue

    if (def.onTurnStart) {
      const result = def.onTurnStart(stacks)
      if (result.damage) damage += result.damage
      if (result.heal) heal += result.heal
      if (result.skipTurn) skipTurn = true
    }

    if (def.decays) {
      updated[id] = Math.max(0, stacks - 1)
    }
  }

  return { damage, heal, skipTurn, updatedEffects: updated }
}

/** Lista wszystkich efektów aktywnych na karcie (do tooltipów) */
export function getActiveEffects(effects: Record<string, number>): { def: StatusEffectDef; stacks: number }[] {
  return Object.entries(effects)
    .filter(([id, stacks]) => stacks > 0 && STATUS_EFFECTS[id])
    .map(([id, stacks]) => ({ def: STATUS_EFFECTS[id], stacks }))
}
