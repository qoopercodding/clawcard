// =============================================================================
// DeckManager.ts — Draw Pile, Hand, Discard Pile state machine
// =============================================================================
//
// Cykl: draw pile → hand → play → discard pile → shuffle back
// Czysta logika, żaden UI. Seeded random dla reprodukowalnych gier.
// =============================================================================

export interface DeckZones<T> {
  drawPile: T[]
  hand: T[]
  discardPile: T[]
  exhaustPile: T[]  // karty usunięte z gry permanentnie
}

/** Seeded PRNG (xorshift32) dla reprodukowalnego shuffle */
function seededRng(seed: number): () => number {
  let s = seed | 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

/** Fisher-Yates shuffle z opcjonalnym seedem */
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const result = [...arr]
  const rng = seed !== undefined ? seededRng(seed) : Math.random
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Stwórz puste strefy z talią startową */
export function createDeckZones<T>(cards: T[], seed?: number): DeckZones<T> {
  return {
    drawPile: shuffle(cards, seed),
    hand: [],
    discardPile: [],
    exhaustPile: [],
  }
}

/** Dobierz N kart z draw pile do ręki */
export function drawCards<T>(zones: DeckZones<T>, count: number, seed?: number): DeckZones<T> {
  let { drawPile, hand, discardPile, exhaustPile } = {
    drawPile: [...zones.drawPile],
    hand: [...zones.hand],
    discardPile: [...zones.discardPile],
    exhaustPile: [...zones.exhaustPile],
  }

  for (let i = 0; i < count; i++) {
    // Jeśli draw pile pusty — shuffle discard do draw
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break // nic do dobrania
      drawPile = shuffle(discardPile, seed)
      discardPile = []
    }

    const card = drawPile.shift()!
    hand.push(card)
  }

  return { drawPile, hand, discardPile, exhaustPile }
}

/** Zagraj kartę z ręki — przenosi do discard */
export function playCardFromHand<T>(zones: DeckZones<T>, cardIndex: number): DeckZones<T> {
  if (cardIndex < 0 || cardIndex >= zones.hand.length) return zones
  const hand = [...zones.hand]
  const [played] = hand.splice(cardIndex, 1)
  return {
    ...zones,
    hand,
    discardPile: [played, ...zones.discardPile],
  }
}

/** Odrzuć kartę z ręki (bez grania) */
export function discardFromHand<T>(zones: DeckZones<T>, cardIndex: number): DeckZones<T> {
  if (cardIndex < 0 || cardIndex >= zones.hand.length) return zones
  const hand = [...zones.hand]
  const [discarded] = hand.splice(cardIndex, 1)
  return {
    ...zones,
    hand,
    discardPile: [discarded, ...zones.discardPile],
  }
}

/** Exhaust kartę — usunięta z gry permanentnie */
export function exhaustFromHand<T>(zones: DeckZones<T>, cardIndex: number): DeckZones<T> {
  if (cardIndex < 0 || cardIndex >= zones.hand.length) return zones
  const hand = [...zones.hand]
  const [exhausted] = hand.splice(cardIndex, 1)
  return {
    ...zones,
    hand,
    exhaustPile: [...zones.exhaustPile, exhausted],
  }
}

/** Odrzuć całą rękę */
export function discardHand<T>(zones: DeckZones<T>): DeckZones<T> {
  return {
    ...zones,
    hand: [],
    discardPile: [...zones.hand, ...zones.discardPile],
  }
}

/** Dodaj kartę do talii (np. reward) */
export function addCardToDeck<T>(zones: DeckZones<T>, card: T): DeckZones<T> {
  return {
    ...zones,
    drawPile: [...zones.drawPile, card],
  }
}

/** Usuń kartę z talii permanentnie (np. shop remove) */
export function removeCardFromDeck<T>(zones: DeckZones<T>, predicate: (card: T) => boolean): DeckZones<T> {
  const idx = zones.drawPile.findIndex(predicate)
  if (idx === -1) return zones
  const drawPile = [...zones.drawPile]
  drawPile.splice(idx, 1)
  return { ...zones, drawPile }
}

/** Statystyki talii */
export function getDeckStats<T>(zones: DeckZones<T>): {
  total: number
  inDraw: number
  inHand: number
  inDiscard: number
  exhausted: number
} {
  return {
    total: zones.drawPile.length + zones.hand.length + zones.discardPile.length,
    inDraw: zones.drawPile.length,
    inHand: zones.hand.length,
    inDiscard: zones.discardPile.length,
    exhausted: zones.exhaustPile.length,
  }
}
