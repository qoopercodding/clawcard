// =============================================================================
// Energy.ts — System energii do grania kart
// =============================================================================
//
// Każda tura gracz dostaje maxEnergy energii. Karty kosztują energię.
// System wspiera modyfikatory (reliki, efekty) które zmieniają max/gain.
// =============================================================================

export interface EnergyState {
  current: number
  max: number
  /** Bonus do energii na początku następnej tury */
  nextTurnBonus: number
}

export function createEnergyState(max = 3): EnergyState {
  return { current: max, max, nextTurnBonus: 0 }
}

/** Zużyj energię — zwraca null jeśli brak */
export function spendEnergy(state: EnergyState, cost: number): EnergyState | null {
  if (state.current < cost) return null
  return { ...state, current: state.current - cost }
}

/** Odśwież energię na początku tury */
export function refreshEnergy(state: EnergyState): EnergyState {
  const gain = state.max + state.nextTurnBonus
  return {
    ...state,
    current: Math.max(0, gain),
    nextTurnBonus: 0,
  }
}

/** Zwiększ max energii (np. relic) */
export function increaseMaxEnergy(state: EnergyState, amount: number): EnergyState {
  return { ...state, max: state.max + amount, current: state.current + amount }
}

/** Dodaj bonus na następną turę */
export function addNextTurnBonus(state: EnergyState, bonus: number): EnergyState {
  return { ...state, nextTurnBonus: state.nextTurnBonus + bonus }
}

/** Koszt karty (rozszerzalny — na razie stały = 1) */
export function getCardCost(_cardId: string): number {
  return 1
}
