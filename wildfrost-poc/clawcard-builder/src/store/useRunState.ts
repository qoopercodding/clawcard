import { useState, useCallback } from 'react'
import { createInitialRunState } from './GameState'
import type { RunState, MapNodeType } from './GameState'

export function useRunState() {
  const [run, setRun] = useState<RunState | null>(null)

  const startRun = useCallback((seed?: number) => {
    setRun(createInitialRunState(seed))
  }, [])

  const endRun = useCallback((status: 'won' | 'lost' | 'abandoned') => {
    setRun(prev => prev ? { ...prev, status } : null)
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

  const addRelic = useCallback((_relicId: string) => {
    setRun(prev => prev)
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

  return {
    run,
    isRunActive,
    isRunOver,
    startRun,
    endRun,
    advanceFloor,
    addGold,
    heal,
    takeDamage,
    addMaxHp,
    addRelic,
    addScore,
    nodeTypeToView,
  }
}
