import type React from 'react'
import { useDevInspector } from '../debug/DevInspector'
import { FRAME_CONFIGS } from '../../utils/frameConfig'
import type { FrameConfig } from '../../utils/frameConfig'
import type { AnyCard } from '../../types/card.types'
import type { CustomFrameType } from '../../store/cardStore'
import './CardFrame.css'

const CUSTOM_FRAME_TYPES_KEY = 'custom_frame_types'
const BUILTIN_AREA_KEYS = new Set(['frame', 'art', 'name', 'desc', 'hp', 'atk', 'counter', 'scrap'])

type AreaDef = { left: number; top: number; width: number; height: number }

function getCustomFrameData(cardType: string): { config: FrameConfig; extraAreas: Record<string, AreaDef> } | null {
  try {
    const raw = localStorage.getItem(CUSTOM_FRAME_TYPES_KEY)
    if (!raw) return null
    const customs: Record<string, CustomFrameType> = JSON.parse(raw)
    const custom = customs[cardType]
    if (!custom) return null
    const { areas, frameFile, frameDataUrl } = custom as CustomFrameType & { frameDataUrl?: string }
    const extraAreas: Record<string, AreaDef> = {}
    for (const [key, val] of Object.entries(areas)) {
      if (!BUILTIN_AREA_KEYS.has(key)) extraAreas[key] = val
    }
    return {
      config: {
        frameFile: frameDataUrl || frameFile || null,
        art:     areas.art     ?? { left: 10, top: 10, width: 80, height: 40 },
        name:    areas.name    ?? { left: 10, top: 55, width: 80, height: 8 },
        desc:    areas.desc    ?? { left: 10, top: 65, width: 80, height: 25 },
        hp:      areas.hp,
        atk:     areas.atk,
        counter: areas.counter,
        scrap:   areas.scrap,
      },
      extraAreas,
    }
  } catch { return null }
}

interface CardFrameProps {
  card: AnyCard
  width?: number
  height?: number
  inspectable?: boolean
}

export function CardFrame({ card, width = 200, height = 294, inspectable = true }: CardFrameProps) {
  const { inspect } = useDevInspector()
  const customData = !FRAME_CONFIGS[card.type] ? getCustomFrameData(card.type) : null
  const cfg = FRAME_CONFIGS[card.type] ?? customData?.config ?? FRAME_CONFIGS.companion
  const extraAreas = customData?.extraAreas ?? {}
  const stats = getCardStats(card)
  const px = (pct: number, dim: number) => `${(pct / 100 * dim).toFixed(1)}px`

  return (
    <div
      className={`card-frame ${inspectable ? 'card-frame--inspectable' : ''}`}
      style={{ width, height, position: 'relative' }}
      onClick={() => inspectable && inspect(card, 'CardFrame')}
      title={inspectable ? 'Kliknij → Inspector' : undefined}
    >
      <div style={{ position: 'absolute', inset: 0, background: '#ffffff', borderRadius: 8 }} />

      <div style={{
        position: 'absolute',
        left: px(cfg.art.left, width), top: px(cfg.art.top, height),
        width: px(cfg.art.width, width), height: px(cfg.art.height, height),
        overflow: 'hidden', background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onError={e => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              const fb = el.nextSibling as HTMLElement
              if (fb) fb.style.display = 'flex'
            }}
          />
        ) : null}
        <div style={{
          display: card.imageUrl ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%',
          fontSize: Math.round(width * 0.25) + 'px',
          background: 'transparent',
        }}>
          {card.imageFallback}
        </div>
      </div>

      {cfg.frameFile && (
        <img src={cfg.frameFile} alt="" aria-hidden style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          mixBlendMode: 'multiply', pointerEvents: 'none',
        }} />
      )}

      {cfg.hp && stats.hp !== undefined && (
        <div className="cf-stat" style={area(cfg.hp, width, height)}>
          <span className="cf-stat__val">{stats.hp}</span>
        </div>
      )}
      {cfg.atk && stats.atk !== undefined && (
        <div className="cf-stat" style={area(cfg.atk, width, height)}>
          <span className="cf-stat__val">{stats.atk}</span>
        </div>
      )}
      {cfg.counter && stats.counter !== undefined && (
        <div className="cf-stat" style={area(cfg.counter, width, height)}>
          <span className="cf-stat__val">{stats.counter}</span>
        </div>
      )}
      {cfg.scrap && stats.scrap !== undefined && (
        <div className="cf-stat" style={area(cfg.scrap, width, height)}>
          <span className="cf-stat__val">{stats.scrap}</span>
        </div>
      )}
      {cfg.name && (
        <div className="cf-name" style={area(cfg.name, width, height)}>{card.name}</div>
      )}
      {cfg.desc && card.description && (
        <div className="cf-desc" style={{ ...area(cfg.desc, width, height), alignItems: 'flex-start' }}>
          {card.description}
        </div>
      )}

      {Object.entries(extraAreas).map(([key, areaDef]) => {
        const val = (card as unknown as Record<string, unknown>)[key] ?? (card as unknown as Record<string, unknown>)['customFields']?.[key as never]
        if (val === undefined && val === null) return null
        return (
          <div key={key} className="cf-stat" style={area(areaDef, width, height)}>
            <span className="cf-stat__val">{String(val ?? '')}</span>
          </div>
        )
      })}

      {inspectable && <div className="card-frame__hint" aria-hidden>🔍</div>}
    </div>
  )
}

function area(a: { left: number; top: number; width: number; height: number }, W: number, H: number): React.CSSProperties {
  const p = (pct: number, d: number) => `${(pct / 100 * d).toFixed(1)}px`
  return {
    position: 'absolute',
    left: p(a.left, W), top: p(a.top, H),
    width: p(a.width, W), height: p(a.height, H),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  }
}

interface CardStats { hp?: number; atk?: number; counter?: number; scrap?: number }

function getCardStats(card: AnyCard): CardStats {
  // cast przez unknown — bezpieczny duck typing dla wszystkich typów kart
  const c = card as unknown as Record<string, unknown>

  if (card.type === 'item_with_attack' || card.type === 'item_without_attack') {
    const effect = c['effect'] as Record<string, unknown> | undefined
    return { atk: effect?.['damage'] as number | undefined }
  }

  if (card.type === 'clunker') {
    return {
      scrap:   c['scrap']   as number | undefined,
      atk:     c['attack']  as number | undefined,
      counter: c['counter'] as number | undefined,
    }
  }

  return {
    hp:      c['hp']      as number | undefined,
    atk:     c['attack']  as number | undefined,
    counter: c['counter'] as number | undefined,
  }
}
