import { useState, useCallback, useEffect } from 'react'
import { createInitialRunState } from './GameState'
import { addRunToHistory } from './runHistory'
import type { RunState, RunCard, Potion, Relic, MapNodeType } from './GameState'

const STORAGE_KEY = 'clawcard_run'

function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RunState
    if (parsed.status !== 'active') return null
    return parsed
  } catch {
    return null
  }
}

function saveRun(run: RunState | null) {
  if (!run) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run))
  }
}

export function useRunState() {
  const [run, setRun] = useState<RunState | null>(() => loadRun())

  // Auto-save on every run change
  useEffect(() => { saveRun(run) }, [run])

  const startRun = useCallback((seed?: number) => {
    setRun(createInitialRunState(seed))
  }, [])

  const endRun = useCallback((status: 'won' | 'lost' | 'abandoned') => {
    setRun(prev => {
      if (!prev) return null
      addRunToHistory({
        id: prev.id,
        seed: prev.seed,
        result: status,
        score: prev.score,
        floor: prev.floor,
        gold: prev.gold,
        deckSize: prev.deck.cards.length,
        duration: Date.now() - prev.started,
        date: Date.now(),
      })
      localStorage.removeItem(STORAGE_KEY)
      return { ...prev, status }
    })
  }, [])

  const abandonRun = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRun(null)
  }, [])

  const advanceFloor = useCallback(() => {
    setRun(prev => {
      if (!prev) return prev
      const newFloor = prev.floor + 1
      return {
        ...prev,
        floor: newFloor,
        map: { ...prev.map, floor: newFloor },
      }
    })
  }, [])

  const addGold = useCallback((amount: number) => {
    setRun(prev => {
      if (!prev) return prev
      return {
        ...prev,
        gold: prev.gold + amount,
        player: { ...prev.player, gold: prev.player.gold + amount },
      }
    })
  }, [])

  const heal = useCallback((amount: number) => {
    setRun(prev => {
      if (!prev) return prev
      const newHp = Math.min(prev.player.maxHp, prev.player.hp + amount)
      return {
        ...prev,
        player: { ...prev.player, hp: newHp },
      }
    })
  }, [])

  const takeDamage = useCallback((amount: number) => {
    setRun(prev => {
      if (!prev) return prev
      const newHp = Math.max(0, prev.player.hp - amount)
      return {
        ...prev,
        player: { ...prev.player, hp: newHp },
        status: newHp <= 0 ? 'lost' : prev.status,
      }
    })
  }, [])

  const addMaxHp = useCallback((amount: number) => {
    setRun(prev => {
      if (!prev) return prev
      return {
        ...prev,
        player: {
          ...prev.player,
          maxHp: prev.player.maxHp + amount,
          hp: prev.player.hp + amount,
        },
      }
    })
  }, [])

  const addCardToDeck = useCallback((card: RunCard) => {
    setRun(prev => {
      if (!prev) return prev
      return {
        ...prev,
        deck: {
          ...prev.deck,
          cards: [...prev.deck.cards, card],
          drawPile: [...prev.deck.drawPile, card.id],
        },
      }
    })
  }, [])

  const upgradeCard = useCallback((cardId: string) => {
    setRun(prev => {
      if (!prev) return prev
      const newCards = prev.deck.cards.map(c =>
        c.id === cardId
          ? { ...c, upgraded: true, attack: c.attack + 2, hp: c.hp > 0 ? c.hp + 2 : 0, name: c.name }
          : c
      )
      return { ...prev, deck: { ...prev.deck, cards: newCards } }
    })
  }, [])

  const removeCardFromDeck = useCallback((cardId: string) => {
    setRun(prev => {
      if (!prev) return prev
      const idx = prev.deck.cards.findIndex(c => c.id === cardId)
      if (idx === -1) return prev
      const newCards = [...prev.deck.cards]
      newCards.splice(idx, 1)
      return {
        ...prev,
        deck: {
          ...prev.deck,
          cards: newCards,
          drawPile: prev.deck.drawPile.filter(id => id !== cardId),
        },
      }
    })
  }, [])

  const addPotion = useCallback((potion: Potion) => {
    setRun(prev => {
      if (!prev || prev.potions.length >= 3) return prev
      return { ...prev, potions: [...prev.potions, potion] }
    })
  }, [])

  const usePotion = useCallback((potionId: string) => {
    setRun(prev => {
      if (!prev) return prev
      const potion = prev.potions.find(p => p.id === potionId)
      if (!potion) return prev
      let player = { ...prev.player }
      if (potion.effect === 'heal') {
        player = { ...player, hp: Math.min(player.maxHp, player.hp + potion.value) }
      }
      return {
        ...prev,
        player,
        potions: prev.potions.filter(p => p.id !== potionId),
      }
    })
  }, [])

  const addRelic = useCallback((relic: Relic) => {
    setRun(prev => {
      if (!prev) return prev
      return { ...prev, relics: [...prev.relics, relic] }
    })
  }, [])

  const addScore = useCallback((points: number) => {
    setRun(prev => {
      if (!prev) return prev
      return { ...prev, score: prev.score + points }
    })
  }, [])

  const nodeTypeToView = useCallback((type: MapNodeType): string => {
    const map: Record<MapNodeType, string> = {
      combat: 'grid-battle',
      elite: 'grid-battle',
      boss: 'grid-battle',
      shop: 'shop',
      campfire: 'campfire',
      event: 'event',
      treasure: 'treasure',
    }
    return map[type]
  }, [])

  const isRunActive = run !== null && run.status === 'active'
  const isRunOver = run !== null && (run.status === 'won' || run.status === 'lost')
  const hasSavedRun = run !== null && run.status === 'active'

  return {
    run,
    isRunActive,
    isRunOver,
    hasSavedRun,
    startRun,
    endRun,
    abandonRun,
    advanceFloor,
    addGold,
    heal,
    takeDamage,
    addMaxHp,
    addCardToDeck,
    upgradeCard,
    removeCardFromDeck,
    addPotion,
    usePotion,
    addRelic,
    addScore,
    nodeTypeToView,
  }
}
