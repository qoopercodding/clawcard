import { useCallback, useEffect, useRef, useState } from 'react'
import { useCardStore } from '../../store/cardStore'
import './FrameEditorScreen.css'

// =============================================================================
// FrameEditorScreen.tsx — Frame Mapper z pełnym handoff do Card Editor
// =============================================================================
//
// FLOW:
//   1. Nowy typ → wpisz nazwę → zaznacz pola → wgraj PNG → zaznacz obszary
//   2. "💾 Zapisz typ + git push"
//      → POST /api/save-frame-config → aktualizuje 3 pliki TS + git push
//      → setPendingType() w store → Card Editor może odebrać
//   3. Przycisk "→ Otwórz Card Editor" pojawia się po zapisie
// =============================================================================

interface AreaResult { left: number; top: number; width: number; height: number }
interface MapperResult { art?: AreaResult; hp?: AreaResult; atk?: AreaResult; counter?: AreaResult; name?: AreaResult; desc?: AreaResult }
type StepKey = keyof MapperResult
interface StepDef { key: StepKey; label: string; icon: string; color: string; hint: string }

const ALL_STEPS: StepDef[] = [
  { key: 'art',     label: 'Art Area', icon: '🖼',  color: '#f0c060', hint: 'Obszar na grafikę/emoji karty' },
  { key: 'hp',      label: 'HP',       icon: '❤',   color: '#e05555', hint: 'Ikona i liczba HP' },
  { key: 'atk',     label: 'ATK',      icon: '⚔',   color: '#67e8f9', hint: 'Ikona i liczba ATK' },
  { key: 'counter', label: 'Counter',  icon: '⏱',   color: '#fbbf24', hint: 'Licznik (dół karty)' },
  { key: 'name',    label: 'Nazwa',    icon: '📛',  color: '#a78bfa', hint: 'Banderola z nazwą' },
  { key: 'desc',    label: 'Opis',     icon: '📝',  color: '#86efac', hint: 'Pole opisu efektu' },
]

const EXISTING_TYPES = [
  { value: 'companion',           frameFile: '/frames/Companion Frame.png',    fields: ['art','hp','atk','counter','name','desc'] as StepKey[] },
  { value: 'item_with_attack',    frameFile: '/frames/Item_with_attack.png',   fields: ['art','atk','name','desc'] as StepKey[] },
  { value: 'item_without_attack', frameFile: '/frames/Item_without_attack.png',fields: ['art','name','desc'] as StepKey[] },
  { value: 'boss',                frameFile: '/frames/boss.png',               fields: ['art','hp','atk','counter','name','desc'] as StepKey[] },
  { value: 'clunker',             frameFile: null,                              fields: ['art','hp','atk','counter','name','desc'] as StepKey[] },
  { value: 'shade',               frameFile: null,                              fields: ['art','hp','atk','counter','name','desc'] as StepKey[] },
  { value: 'charm',               frameFile: null,                              fields: ['art','name','desc'] as StepKey[] },
]

const STORAGE_KEY = (t: string) => `frameConfig_v3_${t}`

interface FrameEditorScreenProps {
  onNavigate?: (view: string) => void
}

export function FrameEditorScreen({ onNavigate }: FrameEditorScreenProps) {
  const { setPendingType } = useCardStore()

  const [mode, setMode]               = useState<'existing' | 'new'>('existing')
  const [existingType, setExistingType] = useState('companion')
  const [newTypeName, setNewTypeName]   = useState('')
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [frameFile, setFrameFile]     = useState<string | null>(null)
  const [imgSrc, setImgSrc]           = useState<string | null>(null)
  const [imgIsLocal, setImgIsLocal]   = useState(false)
  const [result, setResult]           = useState<MapperResult>({})
  const [activeStep, setActiveStep]   = useState<StepKey>('art')
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMsg, setSaveMsg]         = useState('')
  const [savedTypeName, setSavedTypeName] = useState<string | null>(null)
  const [enabledFields, setEnabledFields] = useState<Set<StepKey>>(new Set(ALL_STEPS.map(s => s.key)))
  const [dragStart, setDragStart]     = useState<{x:number;y:number}|null>(null)
  const [dragCurrent, setDragCurrent] = useState<{x:number;y:number}|null>(null)
  const [isDragging, setIsDragging]   = useState(false)

  const imgRef       = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSteps  = ALL_STEPS.filter(s => enabledFields.has(s.key))

  useEffect(() => {
    if (mode !== 'existing') return
    const typeData = EXISTING_TYPES.find(t => t.value === existingType)
    try {
      const stored = localStorage.getItem(STORAGE_KEY(existingType))
      setResult(stored ? JSON.parse(stored) : {})
    } catch { setResult({}) }
    setEnabledFields(new Set(typeData?.fields ?? ALL_STEPS.map(s => s.key)))
    if (typeData?.frameFile) {
      setImgSrc(typeData.frameFile); setFrameFile(typeData.frameFile.split('/').pop() ?? null); setImgIsLocal(false)
    } else { setImgSrc(null); setFrameFile(null); setImgIsLocal(false) }
  }, [existingType, mode])

  useEffect(() => {
    const key = mode === 'existing' ? existingType : newTypeName
    if (!key || Object.keys(result).length === 0) return
    try { localStorage.setItem(STORAGE_KEY(key), JSON.stringify(result)) } catch { /* ignore */ }
  }, [result, existingType, newTypeName, mode])

  function toggleField(key: StepKey) {
    setEnabledFields(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        setResult(r => { const nr={...r}; delete (nr as Record<string,unknown>)[key]; return nr })
      } else { next.add(key) }
      return next
    })
  }

  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => { setImgSrc(e.target?.result as string); setLoadError(null); setImgIsLocal(true) }
    reader.readAsDataURL(file)
    setFrameFile(file.name)
  }

  function loadFrameByPath(framePath: string) {
    setImgSrc(framePath); setFrameFile(framePath.split('/').pop() ?? null); setImgIsLocal(false); setLoadError(null)
  }

  function getCoords(e: React.MouseEvent): {x:number;y:number}|null {
    const img = imgRef.current; if (!img) return null
    const r = img.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, parseFloat(((e.clientX-r.left)/r.width*100).toFixed(2)))),
      y: Math.max(0, Math.min(100, parseFloat(((e.clientY-r.top)/r.height*100).toFixed(2)))),
    }
  }

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); const c = getCoords(e); if (!c) return
    setDragStart(c); setDragCurrent(c); setIsDragging(true)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return; const c = getCoords(e); if (c) setDragCurrent(c)
  }, [isDragging])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return
    const end = getCoords(e) ?? dragCurrent
    if (!end) { setIsDragging(false); return }
    const left   = parseFloat(Math.min(dragStart.x, end.x).toFixed(1))
    const top    = parseFloat(Math.min(dragStart.y, end.y).toFixed(1))
    const width  = parseFloat(Math.abs(end.x-dragStart.x).toFixed(1))
    const height = parseFloat(Math.abs(end.y-dragStart.y).toFixed(1))
    if (width > 0.5 && height > 0.5) {
      setResult(prev => ({ ...prev, [activeStep]: { left, top, width, height } }))
      const idx = activeSteps.findIndex(s => s.key === activeStep)
      const next = activeSteps.slice(idx+1).find(s => !(result as Record<string,unknown>)[s.key])
      if (next) setActiveStep(next.key)
    }
    setIsDragging(false); setDragStart(null); setDragCurrent(null)
  }, [isDragging, dragStart, dragCurrent, activeStep, activeSteps, result])

  const onMouseLeave = useCallback(() => {
    if (isDragging) { setIsDragging(false); setDragStart(null); setDragCurrent(null) }
  }, [isDragging])

  function renderOverlay() {
    const img = imgRef.current; if (!img) return null
    const W = img.offsetWidth||400, H = img.offsetHeight||600
    const px = (p:number,d:number) => p/100*d
    const shapes: React.ReactNode[] = []
    for (const step of activeSteps) {
      const area = (result as Record<string,AreaResult>)[step.key]
      if (!area) continue
      const isAct = step.key === activeStep
      const x=px(area.left,W), y=px(area.top,H), w=px(area.width,W), h=px(area.height,H)
      shapes.push(
        <g key={step.key}>
          <rect x={x} y={y} width={w} height={h} fill={step.color+(isAct?'30':'18')} stroke={step.color} strokeWidth={isAct?2.5:1.5} strokeDasharray={isAct?'none':'4 2'} rx={3} />
          <rect x={x} y={y-18} width={step.label.length*7+16} height={18} fill={step.color} rx={3} />
          <text x={x+6} y={y-5} fill="#000" fontSize={11} fontWeight="bold" fontFamily="monospace">{step.icon} {step.key.toUpperCase()}</text>
          <rect x={x+w-8} y={y+h-8} width={8} height={8} fill={step.color} rx={2} />
        </g>
      )
    }
    if (isDragging && dragStart && dragCurrent) {
      const s = ALL_STEPS.find(s => s.key === activeStep)!
      const l=Math.min(dragStart.x,dragCurrent.x), t=Math.min(dragStart.y,dragCurrent.y)
      const w=Math.abs(dragCurrent.x-dragStart.x), h=Math.abs(dragCurrent.y-dragStart.y)
      const x=px(l,W), y=px(t,H), pw=px(w,W), ph=px(h,H)
      shapes.push(
        <g key="drag">
          <rect x={x} y={y} width={pw} height={ph} fill={s.color+'33'} stroke={s.color} strokeWidth={2} strokeDasharray="6 3" rx={3} />
          <text x={x+pw/2} y={y+ph/2} fill={s.color} fontSize={11} fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">{w.toFixed(1)}% × {h.toFixed(1)}%</text>
        </g>
      )
    }
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible'}}>
        {shapes}
      </svg>
    )
  }

  async function handleSaveToCode() {
    const typeName  = mode === 'existing' ? existingType : newTypeName.trim()
    const typeLabel = mode === 'new' ? (newTypeLabel.trim() || newTypeName.trim()) : existingType

    if (!typeName) { setSaveStatus('error'); setSaveMsg('Wpisz nazwę typu'); return }
    if (!result.art) { setSaveStatus('error'); setSaveMsg('Pole "Art Area" jest wymagane'); return }
    if (Object.keys(result).length === 0) { setSaveStatus('error'); setSaveMsg('Zaznacz przynajmniej jeden obszar'); return }

    setSaveStatus('saving'); setSaveMsg('Zapisuję...')

    const payload = {
      typeName, typeLabel,
      frameFile:   frameFile ? `/frames/${frameFile}` : null,
      pngFileName: imgIsLocal && frameFile ? frameFile : null,
      pngBase64:   imgIsLocal && imgSrc?.startsWith('data:') ? imgSrc : null,
      fields:      { ...result },
      enabledFields: Array.from(enabledFields),
      isNew: mode === 'new',
    }

    try {
      const res = await fetch('/api/save-frame-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.ok) {
        setSaveStatus('saved')
        setSaveMsg(data.message ?? `✓ Typ '${typeName}' zapisany!`)
        setSavedTypeName(typeName)

        // ── TASK 2: Przekaż do Card Editor przez store ──────────────────
        setPendingType({
          typeName,
          frameFile: frameFile ? `/frames/${frameFile}` : null,
          fields: { ...result },
        })

        if (mode === 'new') {
          setNewTypeName(''); setNewTypeLabel(''); setResult({}); setImgSrc(null); setImgIsLocal(false)
        }
      } else {
        setSaveStatus('error')
        setSaveMsg(data.error ?? 'Błąd zapisu')
      }
    } catch {
      setSaveStatus('error')
      setSaveMsg('Brak połączenia z Vite — upewnij się że dev server działa na :5175')
    }

    setTimeout(() => { setSaveStatus('idle'); setSaveMsg('') }, 8000)
  }

  function handleReset() {
    setResult({})
    const key = mode === 'existing' ? existingType : newTypeName
    if (key) localStorage.removeItem(STORAGE_KEY(key))
    setActiveStep('art'); setSavedTypeName(null)
  }

  function deleteArea(key: StepKey) {
    setResult(prev => { const n={...prev}; delete (n as Record<string,unknown>)[key]; return n })
  }

  const completedCount = activeSteps.filter(s => (result as Record<string,unknown>)[s.key]).length
  const typeName = mode === 'existing' ? existingType : newTypeName

  return (
    <div className="frame-editor">
      <aside className="frame-editor__sidebar">

        <div className="fe-mode-tabs">
          <button className={`fe-mode-tab ${mode==='existing'?'fe-mode-tab--active':''}`} onClick={() => setMode('existing')}>✏ Edytuj typ</button>
          <button className={`fe-mode-tab ${mode==='new'?'fe-mode-tab--active':''}`} onClick={() => setMode('new')}>✦ Nowy typ</button>
        </div>

        {mode === 'existing' && (
          <div className="fe-section">
            <label className="fe-label">Typ ramki</label>
            <select className="fe-select" value={existingType} onChange={e => setExistingType(e.target.value)}>
              {EXISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
          </div>
        )}

        {mode === 'new' && (
          <div className="fe-section">
            <label className="fe-label">Nazwa techniczna (snake_case)
              <input className="fe-input" value={newTypeName} placeholder="np. enemy, boss_card"
                onChange={e => setNewTypeName(e.target.value.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''))} />
            </label>
            <label className="fe-label" style={{marginTop:6}}>Etykieta w UI (opcjonalna)
              <input className="fe-input" value={newTypeLabel} placeholder="np. Enemy, Boss Card"
                onChange={e => setNewTypeLabel(e.target.value)} />
            </label>
            {newTypeName && <div className="fe-type-preview">Typ: <code>{newTypeName}</code></div>}
          </div>
        )}

        <div className="fe-fields-section">
          <div className="fe-label" style={{marginBottom:6}}>Pola na tej ramce:</div>
          <div className="fe-fields-grid">
            {ALL_STEPS.map(step => (
              <label key={step.key} className={`fe-field-check ${enabledFields.has(step.key)?'fe-field-check--on':''}`}
                style={{'--fc':step.color} as React.CSSProperties}>
                <input type="checkbox" checked={enabledFields.has(step.key)} onChange={() => toggleField(step.key)} />
                {step.icon} {step.label}
              </label>
            ))}
          </div>
        </div>

        <div className={`fe-drop ${imgSrc?'fe-drop--has-img':''}`}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadFile(f) }}
          onClick={() => fileInputRef.current?.click()}>
          {imgSrc ? (imgIsLocal ? `✓ ${frameFile} (lokalny)` : `✓ ${frameFile}`) : '📁 Wgraj PNG ramki'}
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => { if(e.target.files?.[0]) loadFile(e.target.files[0]) }} />
        </div>

        <div className="fe-quick-frames">
          <div className="fe-label" style={{marginBottom:4}}>Wczytaj szybko:</div>
          {[
            {label:'Companion', path:'/frames/Companion Frame.png'},
            {label:'Item + ATK', path:'/frames/Item_with_attack.png'},
            {label:'Item brak ATK', path:'/frames/Item_without_attack.png'},
            {label:'Boss', path:'/frames/boss.png'},
          ].map(f => (
            <button key={f.path} className="fe-quick-btn" onClick={() => loadFrameByPath(f.path)}>{f.label}</button>
          ))}
        </div>

        {loadError && <div className="fe-error">{loadError}</div>}

        {imgSrc && activeSteps.length > 0 && (
          <div className="fe-progress">
            <div className="fe-progress__bar" style={{width:`${completedCount/activeSteps.length*100}%`}} />
            <span className="fe-progress__text">{completedCount} / {activeSteps.length} obszarów</span>
          </div>
        )}

        <div className="fe-steps">
          <div className="fe-steps__header">Obszary do zaznaczenia:</div>
          {activeSteps.length === 0 && <div className="fe-steps__empty">Zaznacz pola powyżej</div>}
          {activeSteps.map(step => {
            const area = (result as Record<string,AreaResult>)[step.key]
            const isActive = step.key === activeStep
            const isDone = !!area
            return (
              <button key={step.key}
                className={`fe-step-btn ${isActive?'fe-step-btn--active':''} ${isDone?'fe-step-btn--done':''}`}
                style={{'--step-color':step.color} as React.CSSProperties}
                onClick={() => setActiveStep(step.key)} disabled={!imgSrc}>
                <span className="fe-step-btn__icon">{step.icon}</span>
                <div className="fe-step-btn__body">
                  <span className="fe-step-btn__label">{step.label}</span>
                  {isDone
                    ? <span className="fe-step-btn__val">{area.left.toFixed(1)}% {area.top.toFixed(1)}% {area.width.toFixed(1)}×{area.height.toFixed(1)}</span>
                    : <span className="fe-step-btn__hint">{step.hint}</span>}
                </div>
                <div className="fe-step-btn__right">
                  {isDone
                    ? <button className="fe-delete-btn" onClick={ev=>{ev.stopPropagation();deleteArea(step.key)}}>✕</button>
                    : <span className="fe-step-btn__status">○</span>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="fe-actions">
          <button className="fe-btn" onClick={handleReset} disabled={!Object.keys(result).length}>🔄 Reset</button>
        </div>

        <button
          className={`fe-save-btn ${saveStatus==='saved'?'fe-save-btn--saved':''} ${saveStatus==='error'?'fe-save-btn--error':''} ${saveStatus==='saving'?'fe-save-btn--saving':''}`}
          onClick={handleSaveToCode}
          disabled={saveStatus==='saving' || !result.art || (mode==='new'&&!newTypeName)}>
          {saveStatus==='saving' ? '⏳ Zapisuję...'
          : saveStatus==='saved' ? '✓ Zapisano!'
          : saveStatus==='error' ? '⚠ Błąd'
          : '💾 Zapisz typ + git push'}
        </button>

        {/* ── TASK 2: Przycisk handoff do Card Editor ── */}
        {saveStatus === 'saved' && savedTypeName && onNavigate && (
          <button
            className="fe-goto-editor-btn"
            onClick={() => onNavigate('card-editor')}
          >
            ✏ Utwórz kartę typu "{savedTypeName}" →
          </button>
        )}

        {saveMsg && (
          <div className={`fe-save-hint ${saveStatus==='error'?'fe-save-hint--error':''}`}>
            {saveMsg}
          </div>
        )}

        {Object.keys(result).length > 0 && (
          <pre className="fe-json-preview">{JSON.stringify({type:typeName, frameFile:frameFile?`/frames/${frameFile}`:null, ...result}, null, 2)}</pre>
        )}
      </aside>

      <main className="frame-editor__canvas">
        {imgSrc ? (
          <div className="mapper-instruction">
            {(() => {
              const s = ALL_STEPS.find(s => s.key === activeStep)
              if (!s) return <span className="mapper-step-text">Wybierz pole z listy</span>
              const done = !!(result as Record<string,unknown>)[activeStep]
              return (<>
                <span className="mapper-step-badge" style={{background:s.color+'22',borderColor:s.color,color:s.color}}>{s.icon} {s.label}</span>
                <span className="mapper-step-text">{done?'✓ Zaznaczono — przeciągnij ponownie żeby poprawić':`Przeciągnij prostokąt → ${s.hint}`}</span>
              </>)
            })()}
          </div>
        ) : (
          <div className="mapper-instruction mapper-instruction--idle">← Wybierz pola i wgraj PNG ramki żeby zacząć</div>
        )}

        {imgSrc ? (
          <div className="fe-img-wrap" style={{cursor:'crosshair',userSelect:'none'}}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}>
            <img ref={imgRef} src={imgSrc} alt="Frame" className="fe-frame-img" draggable={false} />
            {renderOverlay()}
          </div>
        ) : (
          <div className="fe-empty">
            <div className="fe-empty__icon">🖼</div>
            <div className="fe-empty__title">{mode==='new'&&!newTypeName?'Najpierw wpisz nazwę nowego typu':'Wgraj PNG ramki żeby zacząć'}</div>
            <div className="fe-empty__hint">{mode==='new'?'Wgraj PNG przez drag&drop — zostanie automatycznie zapisany do /public/frames/':'Użyj przycisków "Wczytaj szybko" lub przeciągnij własny PNG.'}</div>
          </div>
        )}
      </main>
    </div>
  )
}
