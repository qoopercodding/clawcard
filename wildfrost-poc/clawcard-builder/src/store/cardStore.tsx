import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { SAMPLE_CARDS } from '../data/sampleCards'
import { FRAME_CONFIGS } from '../utils/frameConfig'
import type { AnyCard, CardType } from '../types/card.types'

// =============================================================================
// cardStore.tsx — Globalny store dla kart i typów ramek
// =============================================================================
//
// ODPOWIADA ZA:
//   - Trzymanie kart z sampleCards (wbudowane) + user_cards (localStorage)
//   - Trzymanie pending_card_type (handoff Frame Editor → Card Editor)
//   - Udostępnianie listy dostępnych typów ramek z frameConfig
//   - Synchronizację z localStorage
//
// UŻYCIE:
//   const { allCards, userCards, addCard, pendingType, consumePendingType } = useCardStore()
// =============================================================================

const USER_CARDS_KEY   = 'user_cards'
const PENDING_TYPE_KEY = 'pending_card_type'

export interface PendingCardType {
  typeName:  string
  frameFile: string | null
  fields:    Record<string, { left: number; top: number; width: number; height: number }>
}

interface CardStore {
  // Karty
  sampleCards:  Record<string, AnyCard>
  userCards:    Record<string, AnyCard>
  allCards:     AnyCard[]
  addCard:      (card: AnyCard) => void
  removeCard:   (id: string) => void

  // Handoff Frame Editor → Card Editor
  pendingType:        PendingCardType | null
  setPendingType:     (p: PendingCardType) => void
  consumePendingType: () => PendingCardType | null

  // Dostępne typy ramek (z frameConfig.ts)
  availableFrameTypes: CardType[]
}

const CardStoreContext = createContext<CardStore | null>(null)

export function CardStoreProvider({ children }: { children: ReactNode }) {
  const [userCards, setUserCards] = useState<Record<string, AnyCard>>(() => {
    try { return JSON.parse(localStorage.getItem(USER_CARDS_KEY) || '{}') }
    catch { return {} }
  })

  const [pendingType, setPendingTypeState] = useState<PendingCardType | null>(() => {
    try { return JSON.parse(localStorage.getItem(PENDING_TYPE_KEY) || 'null') }
    catch { return null }
  })

  // Sync userCards → localStorage
  useEffect(() => {
    localStorage.setItem(USER_CARDS_KEY, JSON.stringify(userCards))
  }, [userCards])

  function addCard(card: AnyCard) {
    setUserCards(prev => ({ ...prev, [card.id]: card }))
  }

  function removeCard(id: string) {
    setUserCards(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function setPendingType(p: PendingCardType) {
    localStorage.setItem(PENDING_TYPE_KEY, JSON.stringify(p))
    setPendingTypeState(p)
  }

  function consumePendingType(): PendingCardType | null {
    const current = pendingType
    localStorage.removeItem(PENDING_TYPE_KEY)
    setPendingTypeState(null)
    return current
  }

  const allCards = [
    ...Object.values(SAMPLE_CARDS),
    ...Object.values(userCards),
  ]

  // Dostępne typy ramek — z frameConfig.ts (aktualizuje się po hot-reload)
  const availableFrameTypes = Object.keys(FRAME_CONFIGS) as CardType[]

  return (
    <CardStoreContext.Provider value={{
      sampleCards: SAMPLE_CARDS,
      userCards,
      allCards,
      addCard,
      removeCard,
      pendingType,
      setPendingType,
      consumePendingType,
      availableFrameTypes,
    }}>
      {children}
    </CardStoreContext.Provider>
  )
}

export function useCardStore(): CardStore {
  const ctx = useContext(CardStoreContext)
  if (!ctx) throw new Error('useCardStore must be used inside CardStoreProvider')
  return ctx
}
