import { useDevInspector } from '../debug/DevInspector'
import { FRAME_CONFIGS } from '../../utils/frameConfig'
import type { AnyCard } from '../../types/card.types'
import './CardFrame.css'

interface CardFrameProps {
  card: AnyCard
  width?: number
  height?: number
  inspectable?: boolean
}

export function CardFrame({ card, width = 200, height = 294, inspectable = true }: CardFrameProps) {
  const { inspect } = useDevInspector()
  const cfg = FRAME_CONFIGS[card.type] ?? FRAME_CONFIGS.companion
  const stats = getCardStats(card)
  const px = (pct: number, dim: number) => `${(pct / 100 * dim).toFixed(1)}px`

  return (
    <div
      className={`card-frame ${inspectable ? 'card-frame--inspectable' : ''}`}
      style={{ width, height, position: 'relative' }}
      onClick={() => inspectable && inspect(card, 'CardFrame')}
      title={inspectable ? 'Kliknij → Inspector' : undefined}
    >
      {/* 1. Białe tło */}
      <div style={{ position: 'absolute', inset: 0, background: '#ffffff', borderRadius: 8 }} />

      {/* 2. Art */}
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

      {/* 3. PNG ramka */}
      {cfg.frameFile && (
        <img src={cfg.frameFile} alt="" aria-hidden style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          mixBlendMode: 'multiply', pointerEvents: 'none',
        }} />
      )}

      {/* 4. Statystyki */}
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
  switch (card.type) {
    case 'companion':           return { hp: card.hp,    atk: card.attack, counter: card.counter }
    case 'boss':                return { hp: card.hp,    atk: card.attack, counter: card.counter }
    case 'test2':               return { hp: (card as any).hp, atk: (card as any).attack, counter: (card as any).counter }
    case 'item_with_attack':    return { atk: card.effect.damage }
    case 'item_without_attack': return {}
    case 'clunker':             return { scrap: card.scrap, atk: card.attack, counter: card.counter }
    case 'shade':               return { hp: card.hp,    atk: card.attack, counter: card.counter }
    default:                    return {}
  }
}
