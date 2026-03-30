import { useCallback, useEffect, useRef, useState } from 'react'
import { useCardStore } from '../../store/cardStore'
import { commitFiles, getStoredPAT } from '../../utils/githubCommit'
import { GithubPATInput } from '../../components/GithubPATInput'
import './FrameEditorScreen.css'

// =============================================================================
// FrameEditorScreen.tsx — Frame Mapper z zapisem do GitHub
// =============================================================================

interface AreaResult { left: number; top: number; width: number; height: number }
type MapperResult = Record<string, AreaResult>

interface StepDef {
  key: string
  label: string
  icon: string
  color: string
  hint: string
  custom?: boolean  // true = dodane przez użytkownika, można usunąć z listy
}

// Kolory dla custom pól (rotują)
const CUSTOM_COLORS = ['#f87171','#fb923c','#a3e635','#34d399','#22d3ee','#818cf8','#e879f9','#f472b6']
let customColorIdx = 0
function nextColor() { return CUSTOM_COLORS[(customColorIdx++) % CUSTOM_COLORS.length] }

const BUILTIN_STEPS: StepDef[] = [
  { key: 'frame',   label: 'Card Frame',  icon: '🃏', color: '#ffffff', hint: 'Cały obszar karty (frame background)' },
  { key: 'art',     label: 'Art Area',    icon: '🖼',  color: '#f0c060', hint: 'Obszar na grafikę/emoji karty' },
  { key: 'hp',      label: 'HP',          icon: '❤',   color: '#e05555', hint: 'Ikona i liczba HP' },
  { key: 'atk',     label: 'ATK',         icon: '⚔',   color: '#67e8f9', hint: 'Ikona i liczba ATK' },
  { key: 'counter', label: 'Counter',     icon: '⏱',   color: '#fbbf24', hint: 'Licznik (dół karty)' },
  { key: 'name',    label: 'Nazwa',       icon: '📛',  color: '#a78bfa', hint: 'Banderola z nazwą' },
  { key: 'desc',    label: 'Opis',        icon: '📝',  color: '#86efac', hint: 'Pole opisu efektu' },
]

const EXISTING_TYPES = [
  { value: 'companion',           frameFile: '/frames/Companion Frame.png',    fields: ['frame','art','hp','atk','counter','name','desc'] },
  { value: 'item_with_attack',    frameFile: '/frames/Item_with_attack.png',   fields: ['frame','art','atk','name','desc'] },
  { value: 'item_without_attack', frameFile: '/frames/Item_without_attack.png',fields: ['frame','art','name','desc'] },
  { value: 'boss',                frameFile: '/frames/boss.png',               fields: ['frame','art','hp','atk','counter','name','desc'] },
  { value: 'clunker',             frameFile: null,                              fields: ['frame','art','hp','atk','counter','name','desc'] },
  { value: 'shade',               frameFile: null,                              fields: ['frame','art','hp','atk','counter','name','desc'] },
  { value: 'charm',               frameFile: null,                              fields: ['frame','art','name','desc'] },
]

const STORAGE_KEY = (t: string) => `frameConfig_v4_${t}`

// ─── GitHub commit ────────────────────────────────────────────────────────────

function generateFrameConfigEntry(typeName: string, frameFile: string | null, result: MapperResult): string {
  const constName = typeName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_USER_CONFIG'
  const frameFileLine = frameFile
    ? `  frameFile: \`\${BASE}${frameFile.replace('/frames/', 'frames/')}\`,`
    : `  frameFile: null,`
  const fieldLines = Object.entries(result).map(([k, v]) =>
    `  ${k.padEnd(7)}: { left: ${v.left}, top: ${v.top}, width: ${v.width}, height: ${v.height} },`
  ).join('\n')
  return `const ${constName}: FrameConfig = {\n${frameFileLine}\n${fieldLines}\n}`
}

async function saveFrameConfigToGit(typeName: string, typeLabel: string, frameFile: string | null, result: MapperResult, isNew: boolean): Promise<void> {
  const REPO_PATH = 'wildfrost-poc/clawcard-builder/src/utils/frameConfig.ts'
  const res = await fetch(
    `https://api.github.com/repos/qoopercodding/clawcard/contents/${REPO_PATH}?ref=main`,
    { headers: { Authorization: `Bearer ${getStoredPAT()}`, Accept: 'application/vnd.github+json' } }
  )
  if (!res.ok) throw new Error(`Nie mogę pobrać frameConfig.ts: ${res.status}`)
  const fileData = await res.json() as { content: string }
  const currentContent = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))))

  const constName = typeName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_USER_CONFIG'
  const entry = generateFrameConfigEntry(typeName, frameFile, result)
  const oldEntryRegex = new RegExp(`const ${constName}: FrameConfig = \\{[^}]+\\}\\n?`, 'g')
  const withoutOld = currentContent.replace(oldEntryRegex, '')
  const exportLine = 'export const FRAME_CONFIGS'
  const insertPos = withoutOld.indexOf(exportLine)
  let newContent = insertPos === -1
    ? withoutOld + '\n' + entry + '\n'
    : withoutOld.slice(0, insertPos) + entry + '\n\n' + withoutOld.slice(insertPos)

  if (!newContent.includes(`${typeName}:`)) {
    newContent = newContent.replace(/(\}\s*$)/m, `  ${typeName}: ${constName},\n}`)
  } else {
    newContent = newContent.replace(new RegExp(`  ${typeName}:[^,\n]+,`), `  ${typeName}: ${constName},`)
  }

  await commitFiles([{ path: REPO_PATH, content: newContent }],
    `feat(frame-editor): ${isNew ? 'nowy' : 'zaktualizowany'} typ ramki '${typeName}'`)
}

// ─── KOMPONENT ────────────────────────────────────────────────────────────────

interface FrameEditorScreenProps { onNavigate?: (view: string) => void }

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
  const [activeStep, setActiveStep]   = useState<string>('frame')
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMsg, setSaveMsg]         = useState('')
  const [savedTypeName, setSavedTypeName] = useState<string | null>(null)
  const [allSteps, setAllSteps]       = useState<StepDef[]>(BUILTIN_STEPS)
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set(BUILTIN_STEPS.map(s => s.key)))
  const [dragStart, setDragStart]     = useState<{x:number;y:number}|null>(null)
  const [dragCurrent, setDragCurrent] = useState<{x:number;y:number}|null>(null)
  const [isDragging, setIsDragging]   = useState(false)
  const [hasPAT, setHasPAT]           = useState(!!getStoredPAT())
  // Dodawanie custom pola
  const [customFieldName, setCustomFieldName] = useState('')

  const imgRef       = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSteps  = allSteps.filter(s => enabledKeys.has(s.key))

  // Gdy zmienia się typ existing — załaduj konfigurację
  useEffect(() => {
    if (mode !== 'existing') return
    const typeData = EXISTING_TYPES.find(t => t.value === existingType)
    try {
      const stored = localStorage.getItem(STORAGE_KEY(existingType))
      setResult(stored ? JSON.parse(stored) : {})
    } catch { setResult({}) }
    const fields = typeData?.fields ?? BUILTIN_STEPS.map(s => s.key)
    setEnabledKeys(new Set(fields))
    if (typeData?.frameFile) {
      setImgSrc(typeData.frameFile); setFrameFile(typeData.frameFile.split('/').pop() ?? null); setImgIsLocal(false)
    } else { setImgSrc(null); setFrameFile(null); setImgIsLocal(false) }
    setActiveStep('frame')
  }, [existingType, mode])

  // Auto-save do localStorage
  useEffect(() => {
    const key = mode === 'existing' ? existingType : newTypeName
    if (!key || Object.keys(result).length === 0) return
    try { localStorage.setItem(STORAGE_KEY(key), JSON.stringify(result)) } catch { /* ignore */ }
  }, [result, existingType, newTypeName, mode])

  // ─── CUSTOM POLA ────────────────────────────────────────────────────────────

  function addCustomField() {
    const raw = customFieldName.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
    if (!raw) return
    if (allSteps.some(s => s.key === raw)) return  // już istnieje
    const newStep: StepDef = {
      key: raw,
      label: customFieldName.trim(),
      icon: '📐',
      color: nextColor(),
      hint: `Custom pole: ${raw}`,
      custom: true,
    }
    setAllSteps(prev => [...prev, newStep])
    setEnabledKeys(prev => new Set([...prev, raw]))
    setActiveStep(raw)
    setCustomFieldName('')
  }

  function removeCustomField(key: string) {
    setAllSteps(prev => prev.filter(s => s.key !== key))
    setEnabledKeys(prev => { const n = new Set(prev); n.delete(key); return n })
    setResult(prev => { const n = {...prev}; delete n[key]; return n })
    if (activeStep === key) setActiveStep('frame')
  }

  // ─── TOGGLE POLA ────────────────────────────────────────────────────────────

  function toggleField(key: string) {
    setEnabledKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        setResult(r => { const nr={...r}; delete nr[key]; return nr })
        if (activeStep === key) setActiveStep(allSteps.find(s => s.key !== key)?.key ?? 'frame')
      } else {
        next.add(key)
        setActiveStep(key)
      }
      return next
    })
  }

  // ─── OBRAZ ──────────────────────────────────────────────────────────────────

  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => { setImgSrc(e.target?.result as string); setLoadError(null); setImgIsLocal(true) }
    reader.readAsDataURL(file)
    setFrameFile(file.name)
  }

  function loadFrameByPath(framePath: string) {
    setImgSrc(framePath); setFrameFile(framePath.split('/').pop() ?? null); setImgIsLocal(false); setLoadError(null)
  }

  // ─── DRAG ────────────────────────────────────────────────────────────────────

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
      // Auto-przejdź do następnego niezaznaczonego
      const idx = activeSteps.findIndex(s => s.key === activeStep)
      const next = activeSteps.slice(idx+1).find(s => !result[s.key])
      if (next) setActiveStep(next.key)
    }
    setIsDragging(false); setDragStart(null); setDragCurrent(null)
  }, [isDragging, dragStart, dragCurrent, activeStep, activeSteps, result])

  const onMouseLeave = useCallback(() => {
    if (isDragging) { setIsDragging(false); setDragStart(null); setDragCurrent(null) }
  }, [isDragging])

  // ─── OVERLAY SVG ─────────────────────────────────────────────────────────────

  function renderOverlay() {
    const img = imgRef.current; if (!img) return null
    const W = img.offsetWidth||400, H = img.offsetHeight||600
    const px = (p:number,d:number) => p/100*d
    const shapes: React.ReactNode[] = []

    for (const step of activeSteps) {
      const area = result[step.key]
      if (!area) continue
      const isAct = step.key === activeStep
      const x=px(area.left,W), y=px(area.top,H), w=px(area.width,W), h=px(area.height,H)
      shapes.push(
        <g key={step.key}>
          <rect x={x} y={y} width={w} height={h}
            fill={step.color+(isAct?'30':'18')} stroke={step.color}
            strokeWidth={isAct?2.5:1.5} strokeDasharray={isAct?'none':'4 2'} rx={3} />
          <rect x={x} y={y-18} width={(step.label.length*6)+20} height={18} fill={step.color} rx={3} />
          <text x={x+6} y={y-5} fill="#000" fontSize={10} fontWeight="bold" fontFamily="monospace">
            {step.icon} {step.key.toUpperCase()}
          </text>
          <rect x={x+w-8} y={y+h-8} width={8} height={8} fill={step.color} rx={2} />
        </g>
      )
    }

    if (isDragging && dragStart && dragCurrent) {
      const s = allSteps.find(s => s.key === activeStep) ?? allSteps[0]
      const l=Math.min(dragStart.x,dragCurrent.x), t=Math.min(dragStart.y,dragCurrent.y)
      const w=Math.abs(dragCurrent.x-dragStart.x), h=Math.abs(dragCurrent.y-dragStart.y)
      const x=px(l,W), y=px(t,H), pw=px(w,W), ph=px(h,H)
      shapes.push(
        <g key="drag">
          <rect x={x} y={y} width={pw} height={ph} fill={s.color+'33'} stroke={s.color} strokeWidth={2} strokeDasharray="6 3" rx={3} />
          <text x={x+pw/2} y={y+ph/2} fill={s.color} fontSize={11} fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
            {w.toFixed(1)}% × {h.toFixed(1)}%
          </text>
        </g>
      )
    }
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible'}}>
        {shapes}
      </svg>
    )
  }

  // ─── ZAPIS ────────────────────────────────────────────────────────────────────

  async function handleSaveToCode() {
    const typeName  = mode === 'existing' ? existingType : newTypeName.trim()
    const typeLabel = mode === 'new' ? (newTypeLabel.trim() || newTypeName.trim()) : existingType
    if (!typeName) { setSaveStatus('error'); setSaveMsg('Wpisz nazwę typu'); return }
    if (!result.art && !result.frame) { setSaveStatus('error'); setSaveMsg('Zaznacz przynajmniej Frame lub Art Area'); return }

    localStorage.setItem(STORAGE_KEY(typeName), JSON.stringify(result))
    setPendingType({ typeName, frameFile: frameFile ? `/frames/${frameFile}` : null, fields: { ...result } })

    if (hasPAT) {
      setSaveStatus('saving'); setSaveMsg('Commitowanie do GitHub...')
      try {
        await saveFrameConfigToGit(typeName, typeLabel, frameFile ? `/frames/${frameFile}` : null, result, mode === 'new')
        setSaveStatus('saved'); setSaveMsg(`✓ Typ '${typeName}' wcommitowany do repo!`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setSaveStatus('saved'); setSaveMsg(`✓ Lokalnie OK. Git: ${msg}`)
      }
    } else {
      setSaveStatus('saved'); setSaveMsg(`✓ Zapisano lokalnie (brak PAT)`)
    }

    setSavedTypeName(typeName)
    if (mode === 'new') { setNewTypeName(''); setNewTypeLabel(''); setResult({}); setImgSrc(null); setImgIsLocal(false) }
    setTimeout(() => { setSaveStatus('idle'); setSaveMsg('') }, 8000)
  }

  function handleReset() {
    setResult({})
    const key = mode === 'existing' ? existingType : newTypeName
    if (key) localStorage.removeItem(STORAGE_KEY(key))
    setActiveStep('frame'); setSavedTypeName(null)
  }

  function deleteArea(key: string) {
    setResult(prev => { const n={...prev}; delete n[key]; return n })
  }

  const completedCount = activeSteps.filter(s => result[s.key]).length
  const typeName = mode === 'existing' ? existingType : newTypeName
  const currentStepDef = allSteps.find(s => s.key === activeStep)

  return (
    <div className="frame-editor">
      <aside className="frame-editor__sidebar">

        {/* PAT */}
        <div style={{marginBottom: 10}}>
          <GithubPATInput onTokenChange={setHasPAT} />
        </div>

        {/* Tryb */}
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

        {/* Pola — builtin */}
        <div className="fe-fields-section">
          <div className="fe-label" style={{marginBottom:6}}>Pola na tej ramce:</div>
          <div className="fe-fields-grid">
            {BUILTIN_STEPS.map(step => (
              <label key={step.key}
                className={`fe-field-check ${enabledKeys.has(step.key)?'fe-field-check--on':''}`}
                style={{'--fc':step.color} as React.CSSProperties}>
                <input type="checkbox" checked={enabledKeys.has(step.key)} onChange={() => toggleField(step.key)} />
                {step.icon} {step.label}
              </label>
            ))}
          </div>
        </div>

        {/* Custom pola */}
        <div style={{background:'#1a1810', border:'1px solid #3a2510', borderRadius:6, padding:'8px 10px', marginBottom:8}}>
          <div style={{fontSize:10, color:'#c8902a', marginBottom:6, textTransform:'uppercase', fontWeight:'bold'}}>
            ➕ Dodaj własne pole
          </div>
          <div style={{display:'flex', gap:5}}>
            <input
              value={customFieldName}
              onChange={e => setCustomFieldName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomField()}
              placeholder="np. mana, shield, scrap..."
              style={{flex:1, background:'#2a1a0a', border:'1px solid #5a3a1a', color:'#e8d5b0', padding:'4px 6px', borderRadius:4, fontSize:11}}
            />
            <button onClick={addCustomField} disabled={!customFieldName.trim()} style={{
              padding:'4px 10px', fontSize:11, fontWeight:'bold',
              background: customFieldName.trim() ? '#3a5a10' : '#1a1208',
              border:`1px solid ${customFieldName.trim() ? '#6a9030' : '#3a2510'}`,
              color: customFieldName.trim() ? '#b0d870' : '#4a4030',
              cursor: customFieldName.trim() ? 'pointer' : 'not-allowed', borderRadius:4,
            }}>
              +
            </button>
          </div>
          {/* Lista custom pól */}
          {allSteps.filter(s => s.custom).length > 0 && (
            <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:4}}>
              {allSteps.filter(s => s.custom).map(s => (
                <div key={s.key} style={{
                  display:'flex', alignItems:'center', gap:4,
                  background: enabledKeys.has(s.key) ? s.color+'22' : '#1a1208',
                  border:`1px solid ${s.color}`,
                  borderRadius:4, padding:'2px 6px',
                }}>
                  <span
                    onClick={() => toggleField(s.key)}
                    style={{fontSize:10, color:s.color, cursor:'pointer'}}
                  >
                    {enabledKeys.has(s.key) ? '✓' : '○'} {s.key}
                  </span>
                  <button onClick={() => removeCustomField(s.key)} style={{
                    background:'none', border:'none', color:'#c03030',
                    cursor:'pointer', fontSize:10, padding:'0 2px', lineHeight:1,
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wgranie PNG */}
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

        {/* Lista kroków */}
        <div className="fe-steps">
          <div className="fe-steps__header">Obszary do zaznaczenia:</div>
          {activeSteps.length === 0 && <div className="fe-steps__empty">Zaznacz pola powyżej</div>}
          {activeSteps.map(step => {
            const area = result[step.key]
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
          disabled={saveStatus==='saving' || (mode==='new'&&!newTypeName)}>
          {saveStatus==='saving' ? '⏳ Commitowanie...'
          : saveStatus==='saved' ? '✓ Zapisano!'
          : saveStatus==='error' ? '⚠ Błąd'
          : hasPAT ? '💾 Zapisz + git commit' : '💾 Zapisz lokalnie'}
        </button>

        {saveStatus === 'saved' && savedTypeName && onNavigate && (
          <button className="fe-goto-editor-btn" onClick={() => onNavigate('card-editor')}>
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
            {currentStepDef ? (<>
              <span className="mapper-step-badge" style={{background:currentStepDef.color+'22',borderColor:currentStepDef.color,color:currentStepDef.color}}>
                {currentStepDef.icon} {currentStepDef.label}
              </span>
              <span className="mapper-step-text">
                {result[activeStep] ? '✓ Zaznaczono — przeciągnij ponownie żeby poprawić' : `Przeciągnij prostokąt → ${currentStepDef.hint}`}
              </span>
            </>) : <span className="mapper-step-text">Wybierz pole z listy</span>}
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
            <div className="fe-empty__hint">{mode==='new'?'Wgraj PNG przez drag&drop':'Użyj przycisków "Wczytaj szybko" lub przeciągnij własny PNG.'}</div>
          </div>
        )}
      </main>
    </div>
  )
}
