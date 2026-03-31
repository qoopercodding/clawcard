// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { useDevInspector } from '../../components/debug/DevInspector'
import { useCardStore } from '../../store/cardStore'
import { commitFiles, getStoredPAT } from '../../utils/githubCommit'
import { GithubPATInput } from '../../components/GithubPATInput'
import type { AnyCard, CardType, CompanionCard, ItemCard, BossCard, TestetsCard, Test2Card, Test3Card, TribeType } from '../../types/card.types'
import cardLibraryData from '../../data/cardLibrary.json'
import './CardEditorScreen.css'

const VERSION = 'Card Editor v1.5 · 2026-03-31'

interface LibraryCard {
  id: string; name: string; source: string; category: string
  type: string; rarity: string; cost: number | null
  attack?: number | null; health?: number | null; counter?: number | null
  description: string; image?: string | null
  traits?: string[]; tags?: string[]
}

const CARD_LIBRARY = cardLibraryData as LibraryCard[]
const SOURCES = [...new Set(CARD_LIBRARY.map(c => c.source))].sort()
const SOURCE_LABELS: Record<string, string> = {
  slay_the_spire: 'Slay the Spire',
  monster_train: 'Monster Train',
  wildfrost: 'Wildfrost',
}

const COMPANION_LIKE_TYPES: CardType[] = ['companion', 'boss', 'testets', 'test2', 'test3', 'transformer']

interface CardDraft {
  id: string; name: string; type: CardType; tribe: TribeType
  hp: number; atk: number; counter: number
  snow: number; heal: number; target: 'enemy' | 'ally'
  splash: boolean; desc: string; icon: string; imgSrc: string | null
  customFields: Record<string, string>
}

const DEFAULT_DRAFT: CardDraft = {
  id: '', name: '', type: 'companion', tribe: 'none',
  hp: 5, atk: 2, counter: 3, snow: 0, heal: 0,
  target: 'enemy', splash: false, desc: '', icon: '❓', imgSrc: null,
  customFields: {},
}

const LIBRARY_KEY = 'ced_library'
const CARD_LIBRARY_REPO_PATH = 'wildfrost-poc/clawcard-builder/src/data/cardLibrary.json'

function nameToId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function validateDraft(draft: CardDraft): string[] {
  const errors: string[] = []
  if (!draft.name.trim()) errors.push('Nazwa jest wymagana')
  if (!draft.desc.trim()) errors.push('Opis jest wymagany')
  if (COMPANION_LIKE_TYPES.includes(draft.type)) {
    if (draft.hp <= 0)      errors.push('HP musi być > 0')
    if (draft.counter <= 0) errors.push('Counter musi być > 0')
  }
  if (draft.type === 'item_with_attack') {
    if (draft.atk <= 0) errors.push('ATK musi być > 0 dla item z atakiem')
  }
  return errors
}

function draftToCard(draft: CardDraft): AnyCard {
  const resolvedId = draft.id || nameToId(draft.name) || '__preview__'
  const base = {
    id: resolvedId, name: draft.name || '???', tribe: draft.tribe,
    imageUrl: draft.imgSrc || null,
    imageFallback: draft.icon || '❓',
    description: draft.desc, createdAt: Date.now(),
    ...draft.customFields,
  }
  if (draft.type === 'companion') return { ...base, type: 'companion', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as CompanionCard
  if (draft.type === 'boss') return { ...base, type: 'boss', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as BossCard
  if (draft.type === 'testets') return { ...base, type: 'testets', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as TestetsCard
  if (draft.type === 'test2') return { ...base, type: 'test2', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as Test2Card
  if (draft.type === 'test3') return { ...base, type: 'test3', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as Test3Card
  if (COMPANION_LIKE_TYPES.includes(draft.type)) return { ...base, type: draft.type, hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as unknown as AnyCard
  return {
    ...base, type: draft.type as 'item_with_attack' | 'item_without_attack',
    effect: { damage: draft.atk>0?draft.atk:undefined, snow: draft.snow>0?draft.snow:undefined, heal: draft.heal>0?draft.heal:undefined },
    target: draft.target === 'ally' ? 'ally' : 'enemy', consume: false,
  } as ItemCard
}

async function commitCardLibrary(library: Record<string, CardDraft>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(library).map(([k, v]) => [k, { ...v, imgSrc: v.imgSrc?.startsWith('data:') ? null : v.imgSrc }]))
  await commitFiles([{ path: CARD_LIBRARY_REPO_PATH, content: JSON.stringify(clean, null, 2) }],
    `feat(card-editor): zaktualizowana biblioteka kart (${Object.keys(library).length} kart)`)
}

const BADGE_STYLE: React.CSSProperties = {
  position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
  background: '#1a1208dd', border: '1px solid #3a2510',
  borderRadius: 4, padding: '3px 8px',
  fontSize: 10, color: '#6a5040', fontFamily: 'monospace',
  pointerEvents: 'none', userSelect: 'none',
}

export function CardEditorScreen() {
  const { addCard, consumePendingType, customFrameTypes } = useCardStore()
  const [draft, setDraft]           = useState<CardDraft>({ ...DEFAULT_DRAFT })
  const [library, setLibrary]       = useState<Record<string, CardDraft>>({})
  const [savedMsg, setSavedMsg]     = useState<'idle' | 'local' | 'git' | 'error'>('idle')
  const [savedNote, setSavedNote]   = useState('')
  const [addedToGallery, setAddedToGallery] = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [errors, setErrors]         = useState<string[]>([])
  const [hasPAT, setHasPAT]         = useState(!!getStoredPAT())

  useEffect(() => {
    const pending = consumePendingType()
    if (pending) setDraft(prev => ({ ...prev, type: pending.typeName as CardType }))
  }, [])

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '{}')
      const migrated = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, { customFields: {}, ...(v as CardDraft) }]))
      setLibrary(migrated)
    } catch { /* ignore */ }
  }, [])

  const update = (patch: Partial<CardDraft>) => { setDraft(prev => ({ ...prev, ...patch })); setErrors([]) }

  async function saveToLibrary() {
    const errs = validateDraft(draft); if (errs.length) { setErrors(errs); return }
    const id = draft.id || nameToId(draft.name)
    const newLib = { ...library, [id]: { ...draft, id } }
    setLibrary(newLib); localStorage.setItem(LIBRARY_KEY, JSON.stringify(newLib)); setErrors([])
    if (hasPAT) {
      setSavedMsg('git'); setSavedNote('Commitowanie...')
      try { await commitCardLibrary(newLib); setSavedNote(`✓ Karta '${draft.name}' wcommitowana!`) }
      catch (err: unknown) { setSavedNote(`✓ Lokalnie OK. Git: ${err instanceof Error ? err.message : String(err)}`) }
    } else { setSavedMsg('local'); setSavedNote('✓ Zapisano lokalnie (brak PAT)') }
    setTimeout(() => { setSavedMsg('idle'); setSavedNote('') }, 4000)
  }

  function addToGallery() {
    const errs = validateDraft(draft); if (errs.length) { setErrors(errs); return }
    const card = draftToCard(draft)
    if (card.id === '__preview__') { setErrors(['Wypełnij nazwę karty przed dodaniem do galerii']); return }
    addCard(card); setAddedToGallery(true); setErrors([])
    setTimeout(() => setAddedToGallery(false), 2000)
  }

  function loadDraft(id: string) {
    const saved = library[id]
    if (saved) { setDraft({ customFields: {}, ...saved }); setEditingId(id); setErrors([]) }
  }

  async function deleteSaved(id: string) {
    const newLib = { ...library }; delete newLib[id]
    setLibrary(newLib); localStorage.setItem(LIBRARY_KEY, JSON.stringify(newLib))
    if (editingId === id) { setDraft({ ...DEFAULT_DRAFT }); setEditingId(null) }
    if (hasPAT) { try { await commitCardLibrary(newLib) } catch { /* nie blokuj */ } }
  }

  function exportCard() {
    const errs = validateDraft(draft); if (errs.length) { setErrors(errs); return }
    const id = draft.id || nameToId(draft.name)
    const imgLine = draft.imgSrc
      ? (draft.imgSrc.startsWith('data:') ? `    img: null, icon: '${draft.icon}',` : `    get img(){ return img('${draft.imgSrc.split('/').pop()}'); },`)
      : `    img: null, icon: '${draft.icon}',`
    const statsLine = COMPANION_LIKE_TYPES.includes(draft.type)
      ? `    hp:${draft.hp}, atk:${draft.atk}, counter:${draft.counter},`
      : [draft.atk>0?`atk:${draft.atk}`:'', draft.snow>0?`snow:${draft.snow}`:'', draft.heal>0?`heal:${draft.heal}`:'', `target:'${draft.target}'`, draft.splash?'splash:true':''].filter(Boolean).join(', ') + ','
    const customLines = Object.entries(draft.customFields).map(([k, v]) => `    ${k}: '${v}',`).join('\n')
    const code = [`  ${id}: {`, `    id:'${id}', name:'${draft.name}', type:'${draft.type}',`, `    tribe:'${draft.tribe}',`, `    ${imgLine}`, statsLine, `    desc:'${draft.desc}',`, customLines, `  },`].join('\n')
    const blob = new Blob([`// Wklej do CARDS{} w src/cards.js\n${code}\n`], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `card_${id}.js`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const card = draftToCard(draft)
  const { inspect } = useDevInspector()
  const canSave = draft.name.trim().length > 0 && draft.desc.trim().length > 0
  const saveLabel = savedMsg === 'git' && savedNote === 'Commitowanie...' ? '⏳ Commitowanie...'
    : savedMsg !== 'idle' ? savedNote
    : hasPAT ? '💾 Zapisz + git commit' : '💾 Zapisz lokalnie'

  return (
    <div className="card-editor">
      <div className="card-editor__form">
        <div style={{marginBottom: 10}}>
          <GithubPATInput onTokenChange={setHasPAT} />
        </div>

        <FormPanel draft={draft} onChange={update} editingId={editingId} customFrameTypes={customFrameTypes} />

        {errors.length > 0 && (
          <div className="ced-errors">
            {errors.map((e, i) => <div key={i} className="ced-error-item">⚠ {e}</div>)}
          </div>
        )}

        <div className="ced-actions">
          <button
            className={`ced-btn ced-btn--save ${savedMsg !== 'idle' ? 'ced-btn--done' : ''} ${!canSave ? 'ced-btn--muted' : ''}`}
            onClick={saveToLibrary}
            disabled={savedMsg === 'git' && savedNote === 'Commitowanie...'}
            title={!canSave ? 'Wypełnij nazwę i opis' : ''}>
            {saveLabel}
          </button>
          <button className="ced-btn ced-btn--export" onClick={exportCard}>⬇ .js</button>
          <button className="ced-btn ced-btn--reset" onClick={() => { setDraft({...DEFAULT_DRAFT}); setEditingId(null); setErrors([]) }}>✕</button>
        </div>

        <button
          className={`ced-gallery-btn ${addedToGallery ? 'ced-gallery-btn--done' : ''} ${!canSave ? 'ced-gallery-btn--muted' : ''}`}
          onClick={addToGallery} disabled={!canSave}>
          {addedToGallery ? '✓ Dodano do galerii!' : '🃏 Dodaj do galerii'}
        </button>

        <div className="ced-required-hint">
          * Wymagane: <strong>Nazwa</strong> i <strong>Opis</strong>
          {COMPANION_LIKE_TYPES.includes(draft.type) && ' · HP · Counter'}
          {draft.type === 'item_with_attack' && ' · ATK > 0'}
        </div>

        {Object.values(library).length > 0 && (
          <div className="ced-library">
            <div className="ced-library__title">📚 Biblioteka ({Object.values(library).length})</div>
            {Object.values(library).map(c => (
              <div key={c.id} className={`ced-library__row ${editingId===c.id?'ced-library__row--active':''}`}>
                <span className="ced-library__icon">{c.icon||'❓'}</span>
                <span className="ced-library__name">{c.name||c.id}</span>
                <span className={`ced-library__type ced-type--${c.type}`}>{c.type}</span>
                <button className="ced-mini-btn" onClick={() => loadDraft(c.id)}>Edytuj</button>
                <button className="ced-mini-btn ced-mini-btn--danger" onClick={() => deleteSaved(c.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-editor__preview">
        <div className="ced-preview">
          <div className="ced-preview__label">Podgląd na żywo</div>
          <div className="ced-preview__card" onClick={() => inspect(card, 'CardEditorPreview')}>
            <CardFrame card={card} width={200} height={294} inspectable={false} />
          </div>
          <div className="ced-preview__hint">Kliknij kartę → Inspector</div>
        </div>
      </div>

      <CardBrowser onSelectCard={(c) => {
        update({
          name: c.name,
          desc: c.description,
          hp: c.health ?? 5,
          atk: c.attack ?? 0,
          counter: c.counter ?? 3,
          icon: '📋',
          imgSrc: c.image ? (c.image.startsWith('http') ? c.image : `${import.meta.env.BASE_URL}${c.image.startsWith('/') ? c.image.slice(1) : c.image}`) : '',
        })
      }} />

      {/* ── VERSION BADGE ── */}
      <div style={BADGE_STYLE}>{VERSION}</div>
    </div>
  )
}

// ─── FORM PANEL ──────────────────────────────────────────────────────────────

interface FormPanelProps {
  draft: CardDraft
  onChange: (p: Partial<CardDraft>) => void
  editingId: string | null
  customFrameTypes: Record<string, import('../../store/cardStore').CustomFrameType>
}

const BUILTIN_CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'companion',           label: 'Companion' },
  { value: 'boss',                label: 'Boss' },
  { value: 'transformer',         label: 'Transformer' },
  { value: 'item_with_attack',    label: 'Item — z atakiem' },
  { value: 'item_without_attack', label: 'Item — bez ataku' },
  { value: 'clunker',             label: 'Clunker' },
  { value: 'shade',               label: 'Shade' },
  { value: 'charm',               label: 'Charm' },
]

function FormPanel({ draft, onChange, editingId, customFrameTypes }: FormPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldVal, setNewFieldVal] = useState('')

  const loadFile = (file: File) => {
    const r = new FileReader(); r.onload = e => onChange({imgSrc: e.target?.result as string}); r.readAsDataURL(file)
  }

  const customTypeEntries = Object.values(customFrameTypes)
    .filter(ft => !BUILTIN_CARD_TYPES.some(b => b.value === ft.typeName))
    .map(ft => ({ value: ft.typeName as CardType, label: `${ft.typeName} (custom)` }))

  const allCardTypes = [...BUILTIN_CARD_TYPES, ...customTypeEntries]
  const currentCustomType = customFrameTypes[draft.type]

  const isCompanionLike  = COMPANION_LIKE_TYPES.includes(draft.type)
  const isItemWithAttack = draft.type === 'item_with_attack'
  const isItemWithout    = draft.type === 'item_without_attack'
  const isItem           = isItemWithAttack || isItemWithout

  function addCustomField() {
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
    if (!key) return
    onChange({ customFields: { ...draft.customFields, [key]: newFieldVal } })
    setNewFieldKey(''); setNewFieldVal('')
  }

  function updateCustomField(key: string, val: string) {
    onChange({ customFields: { ...draft.customFields, [key]: val } })
  }

  function removeCustomField(key: string) {
    const next = { ...draft.customFields }; delete next[key]
    onChange({ customFields: next })
  }

  return (
    <div className="ced-form">
      {editingId && <div className="ced-editing-badge">✏ Edytujesz: {editingId}</div>}

      <div className="ced-section-title">📇 Identyfikacja</div>
      <label className="ced-label">Nazwa <span className="ced-required-star">*</span>
        <input className="ced-input" value={draft.name} placeholder="np. Ice Wolf" onChange={e => onChange({name: e.target.value})} />
      </label>
      <label className="ced-label">ID <span className="ced-optional">(opcjonalne)</span>
        <input className="ced-input" value={draft.id} placeholder={nameToId(draft.name)||'ice_wolf'} onChange={e => onChange({id: e.target.value.replace(/\s+/g,'_').toLowerCase()})} />
      </label>
      <div className="ced-row">
        <label className="ced-label" style={{flex:2}}>Typ
          <select className="ced-input" value={draft.type} onChange={e => onChange({type: e.target.value as CardType})}>
            {allCardTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="ced-label" style={{flex:1}}>Tribe
          <select className="ced-input" value={draft.tribe} onChange={e => onChange({tribe: e.target.value as TribeType})}>
            {(['snowdwellers','shademancers','clunkmasters','transformers','none'] as TribeType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      {isCompanionLike && (<>
        <div className="ced-section-title">📊 Statystyki</div>
        <div className="ced-row">
          <label className="ced-label" style={{flex:1}}>❤ HP <span className="ced-required-star">*</span>
            <input className="ced-input" type="number" min={1} max={99} value={draft.hp} onChange={e => onChange({hp:+e.target.value})} />
          </label>
          <label className="ced-label" style={{flex:1}}>⚔ ATK
            <input className="ced-input" type="number" min={0} max={20} value={draft.atk} onChange={e => onChange({atk:+e.target.value})} />
          </label>
          <label className="ced-label" style={{flex:1}}>⏱ Counter <span className="ced-required-star">*</span>
            <input className="ced-input" type="number" min={1} max={9} value={draft.counter} onChange={e => onChange({counter:+e.target.value})} />
          </label>
        </div>
      </>)}

      {isItemWithAttack && (<>
        <div className="ced-section-title">📊 Efekty</div>
        <div className="ced-row">
          <label className="ced-label" style={{flex:1}}>⚔ ATK <span className="ced-required-star">*</span>
            <input className="ced-input" type="number" min={1} value={draft.atk} onChange={e => onChange({atk:+e.target.value})} />
          </label>
          <label className="ced-label" style={{flex:1}}>❄ Snow
            <input className="ced-input" type="number" min={0} value={draft.snow} onChange={e => onChange({snow:+e.target.value})} />
          </label>
          <label className="ced-label" style={{flex:1}}>💚 Heal
            <input className="ced-input" type="number" min={0} value={draft.heal} onChange={e => onChange({heal:+e.target.value})} />
          </label>
        </div>
        <div className="ced-row">
          <label className="ced-label" style={{flex:1}}>Cel
            <select className="ced-input" value={draft.target} onChange={e => onChange({target: e.target.value as 'enemy'|'ally'})}>
              <option value="enemy">Wróg</option><option value="ally">Sojusznik</option>
            </select>
          </label>
          <label className="ced-label ced-label--check">
            <input type="checkbox" checked={draft.splash} onChange={e => onChange({splash:e.target.checked})} /> Splash
          </label>
        </div>
      </>)}

      {isItemWithout && (<>
        <div className="ced-section-title">📊 Efekty</div>
        <div className="ced-row">
          <label className="ced-label" style={{flex:1}}>❄ Snow
            <input className="ced-input" type="number" min={0} value={draft.snow} onChange={e => onChange({snow:+e.target.value})} />
          </label>
          <label className="ced-label" style={{flex:1}}>💚 Heal
            <input className="ced-input" type="number" min={0} value={draft.heal} onChange={e => onChange({heal:+e.target.value})} />
          </label>
          <label className="ced-label" style={{flex:1}}>Cel
            <select className="ced-input" value={draft.target} onChange={e => onChange({target: e.target.value as 'enemy'|'ally'})}>
              <option value="enemy">Wróg</option><option value="ally">Sojusznik</option>
            </select>
          </label>
        </div>
      </>)}

      {!isCompanionLike && !isItem && !currentCustomType && (
        <div className="ced-section-hint">Typ <strong>{draft.type}</strong> — statystyki TODO</div>
      )}

      {currentCustomType && currentCustomType.customFields.length > 0 && (<>
        <div className="ced-section-title">📐 Pola z Frame Editor</div>
        <div className="ced-row" style={{flexWrap: 'wrap'}}>
          {currentCustomType.customFields.map(field => (
            <label key={field} className="ced-label" style={{flex: 1, minWidth: 100}}>
              {field}
              <input className="ced-input" value={draft.customFields[field] || ''} placeholder={field}
                onChange={e => onChange({ customFields: { ...draft.customFields, [field]: e.target.value } })} />
            </label>
          ))}
        </div>
      </>)}

      <div className="ced-section-title">📝 Opis <span className="ced-required-star">*</span></div>
      <textarea className="ced-input ced-textarea" rows={3} value={draft.desc} placeholder="Opis działania karty..." onChange={e => onChange({desc:e.target.value})} />

      <label className="ced-label" style={{marginTop:8}}>Emoji (fallback)
        <input className="ced-input" maxLength={2} value={draft.icon} onChange={e => onChange({icon:e.target.value})} />
      </label>

      <div className="ced-section-title">🖼 Grafika <span className="ced-optional">(opcjonalna)</span></div>
      <div className={`ced-img-drop ${draft.imgSrc?'ced-img-drop--has-img':''}`}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadFile(f)}}
        onClick={() => fileRef.current?.click()}>
        {draft.imgSrc ? '✓ Obraz załadowany' : 'Upuść PNG/JPG lub kliknij'}
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => {if(e.target.files?.[0]) loadFile(e.target.files[0])}} />
      </div>
      <label className="ced-label" style={{marginTop:6}}>lub URL
        <input className="ced-input" value={draft.imgSrc?.startsWith('data:')?'':(draft.imgSrc??'')} placeholder="/cards/NazwaPliku.png" onChange={e => onChange({imgSrc:e.target.value||null})} />
      </label>

      {/* ── CUSTOM POLA ── */}
      <div className="ced-section-title" style={{marginTop:12}}>➕ Własne pola</div>

      {Object.entries(draft.customFields).map(([k, v]) => (
        <div key={k} className="ced-row" style={{alignItems:'center', gap:6}}>
          <span style={{fontSize:11, color:'#c8902a', width:80, flexShrink:0, fontFamily:'monospace'}}>{k}</span>
          <input className="ced-input" value={v} onChange={e => updateCustomField(k, e.target.value)} style={{flex:1}} />
          <button onClick={() => removeCustomField(k)} style={{background:'none', border:'none', color:'#c03030', cursor:'pointer', fontSize:14, padding:'0 4px', flexShrink:0}}>✕</button>
        </div>
      ))}

      <div className="ced-row" style={{gap:6, marginTop:4}}>
        <input className="ced-input" value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustomField()} placeholder="klucz (np. mana)" style={{flex:1}} />
        <input className="ced-input" value={newFieldVal} onChange={e => setNewFieldVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustomField()} placeholder="wartość" style={{flex:1}} />
        <button onClick={addCustomField} disabled={!newFieldKey.trim()} style={{
          padding:'4px 10px', fontSize:13, fontWeight:'bold', borderRadius:4, flexShrink:0,
          background: newFieldKey.trim() ? '#3a5a10' : '#1e1208',
          border:`1px solid ${newFieldKey.trim() ? '#6a9030' : '#3a2510'}`,
          color: newFieldKey.trim() ? '#b0d870' : '#4a4030',
          cursor: newFieldKey.trim() ? 'pointer' : 'not-allowed',
        }}>+</button>
      </div>
      <div style={{fontSize:10, color:'#6a5040', marginTop:3}}>
        Klucz: snake_case · Wartość: tekst lub liczba · Enter lub + żeby dodać
      </div>
    </div>
  )
}

// ─── CARD BROWSER ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 30

function CardBrowser({ onSelectCard }: { onSelectCard: (c: LibraryCard) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(0)

  const types = useMemo(() => {
    const filtered = sourceFilter === 'all' ? CARD_LIBRARY : CARD_LIBRARY.filter(c => c.source === sourceFilter)
    return [...new Set(filtered.map(c => c.type))].sort()
  }, [sourceFilter])

  const filtered = useMemo(() => {
    let result = CARD_LIBRARY
    if (sourceFilter !== 'all') result = result.filter(c => c.source === sourceFilter)
    if (typeFilter !== 'all') result = result.filter(c => c.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, sourceFilter, typeFilter])

  const pageCards = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, sourceFilter, typeFilter])

  if (!open) {
    return (
      <div className="card-browser--collapsed">
        <button className="card-browser__toggle" onClick={() => setOpen(true)}>
          📚 Przeglądarka kart ({CARD_LIBRARY.length})
        </button>
      </div>
    )
  }

  return (
    <div className="card-browser">
      <div className="card-browser__header">
        <span className="card-browser__title">📚 Przeglądarka kart</span>
        <span className="card-browser__count">{filtered.length} kart</span>
        <button className="card-browser__close" onClick={() => setOpen(false)}>✕</button>
      </div>

      <div className="card-browser__filters">
        <input
          className="ced-input card-browser__search"
          placeholder="Szukaj karty..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="card-browser__filter-row">
          <select className="ced-input" value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setTypeFilter('all') }}>
            <option value="all">Wszystkie gry</option>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>)}
          </select>
          <select className="ced-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">Wszystkie typy</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card-browser__list">
        {pageCards.map(c => (
          <button key={c.id} className="card-browser__item" onClick={() => onSelectCard(c)}>
            <div className="card-browser__item-header">
              <span className="card-browser__item-name">{c.name}</span>
              <span className={`card-browser__source card-browser__source--${c.source}`}>
                {SOURCE_LABELS[c.source]?.substring(0, 3) || c.source.substring(0, 3)}
              </span>
            </div>
            <div className="card-browser__item-meta">
              <span className="card-browser__item-type">{c.type}</span>
              {c.cost !== null && <span className="card-browser__item-cost">{c.cost}⚡</span>}
              {c.attack != null && <span className="card-browser__item-stat">⚔{c.attack}</span>}
              {c.health != null && <span className="card-browser__item-stat">❤{c.health}</span>}
            </div>
            {c.description && (
              <div className="card-browser__item-desc">{c.description.substring(0, 80)}{c.description.length > 80 ? '...' : ''}</div>
            )}
          </button>
        ))}
        {pageCards.length === 0 && (
          <div className="card-browser__empty">Brak wyników</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="card-browser__pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  )
}
