// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { CardFrame } from '../../components/CardFrame/CardFrame'
import { useDevInspector } from '../../components/debug/DevInspector'
import { useCardStore } from '../../store/cardStore'
import type { AnyCard, CardType, CompanionCard, ItemCard, BossCard, TestetsCard, Test2Card, Test3Card, TribeType } from '../../types/card.types'
import './CardEditorScreen.css'

const COMPANION_LIKE_TYPES: CardType[] = ['companion', 'boss', 'testets', 'test2', 'test3', 'transformer']

interface CardDraft {
  id: string; name: string; type: CardType; tribe: TribeType
  hp: number; atk: number; counter: number
  snow: number; heal: number; target: 'enemy' | 'ally'
  splash: boolean; desc: string; icon: string; imgSrc: string | null
}

const DEFAULT_DRAFT: CardDraft = {
  id: '', name: '', type: 'companion', tribe: 'none',
  hp: 5, atk: 2, counter: 3, snow: 0, heal: 0,
  target: 'enemy', splash: false, desc: '', icon: '❓', imgSrc: null,
}

const LIBRARY_KEY = 'ced_library'

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
    imageUrl: draft.imgSrc, imageFallback: draft.icon || '❓',
    description: draft.desc, createdAt: Date.now(),
  }
  if (draft.type === 'companion') {
    return { ...base, type: 'companion', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as CompanionCard
  }
  if (draft.type === 'boss') {
    return { ...base, type: 'boss', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as BossCard
  }
  if (draft.type === 'testets') {
    return { ...base, type: 'testets', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as TestetsCard
  }
  if (draft.type === 'test2') {
    return { ...base, type: 'test2', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as Test2Card
  }
  if (draft.type === 'test3') {
    return { ...base, type: 'test3', hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as Test3Card
  }
  if (COMPANION_LIKE_TYPES.includes(draft.type)) {
    return { ...base, type: draft.type, hp: draft.hp, attack: draft.atk, counter: draft.counter, abilities: [] } as unknown as AnyCard
  }
  return {
    ...base,
    type: draft.type as 'item_with_attack' | 'item_without_attack',
    effect: {
      damage: draft.atk  > 0 ? draft.atk  : undefined,
      snow:   draft.snow > 0 ? draft.snow  : undefined,
      heal:   draft.heal > 0 ? draft.heal  : undefined,
    },
    target: draft.target === 'ally' ? 'ally' : 'enemy',
    consume: false,
  } as ItemCard
}

export function CardEditorScreen() {
  const { addCard, consumePendingType } = useCardStore()
  const [draft, setDraft]         = useState<CardDraft>({ ...DEFAULT_DRAFT })
  const [library, setLibrary]     = useState<Record<string, CardDraft>>({})
  const [savedMsg, setSavedMsg]   = useState(false)
  const [addedToGallery, setAddedToGallery] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors]       = useState<string[]>([])

  useEffect(() => {
    const pending = consumePendingType()
    if (pending) {
      setDraft(prev => ({ ...prev, type: pending.typeName as CardType }))
    }
  }, [])

  useEffect(() => {
    try { setLibrary(JSON.parse(localStorage.getItem(LIBRARY_KEY) || '{}')) }
    catch { /* ignore */ }
  }, [])

  const update = (patch: Partial<CardDraft>) => { setDraft(prev => ({ ...prev, ...patch })); setErrors([]) }

  function saveToLibrary() {
    const errs = validateDraft(draft)
    if (errs.length) { setErrors(errs); return }
    const id = draft.id || nameToId(draft.name)
    const newLib = { ...library, [id]: { ...draft, id } }
    setLibrary(newLib); localStorage.setItem(LIBRARY_KEY, JSON.stringify(newLib))
    setSavedMsg(true); setErrors([])
    setTimeout(() => setSavedMsg(false), 1500)
  }

  function addToGallery() {
    const errs = validateDraft(draft)
    if (errs.length) { setErrors(errs); return }
    const card = draftToCard(draft)
    if (card.id === '__preview__') {
      setErrors(['Wypełnij nazwę karty przed dodaniem do galerii']); return
    }
    addCard(card)
    setAddedToGallery(true)
    setErrors([])
    setTimeout(() => setAddedToGallery(false), 2000)
  }

  function loadDraft(id: string) {
    const saved = library[id]
    if (saved) { setDraft({ ...saved }); setEditingId(id); setErrors([]) }
  }

  function deleteSaved(id: string) {
    const newLib = { ...library }; delete newLib[id]
    setLibrary(newLib); localStorage.setItem(LIBRARY_KEY, JSON.stringify(newLib))
    if (editingId === id) { setDraft({ ...DEFAULT_DRAFT }); setEditingId(null) }
  }

  function exportCard() {
    const errs = validateDraft(draft)
    if (errs.length) { setErrors(errs); return }
    const id = draft.id || nameToId(draft.name)
    const imgLine = draft.imgSrc
      ? (draft.imgSrc.startsWith('data:') ? `    img: null, icon: '${draft.icon}',` : `    get img(){ return img('${draft.imgSrc.split('/').pop()}'); },`)
      : `    img: null, icon: '${draft.icon}',`
    const statsLine = COMPANION_LIKE_TYPES.includes(draft.type)
      ? `    hp:${draft.hp}, atk:${draft.atk}, counter:${draft.counter},`
      : [draft.atk>0?`atk:${draft.atk}`:'', draft.snow>0?`snow:${draft.snow}`:'', draft.heal>0?`heal:${draft.heal}`:'', `target:'${draft.target}'`, draft.splash?'splash:true':''].filter(Boolean).join(', ') + ','
    const code = [`  ${id}: {`, `    id:'${id}', name:'${draft.name}', type:'${draft.type}',`, `    tribe:'${draft.tribe}',`, `    ${imgLine}`, statsLine, `    desc:'${draft.desc}',`, `  },`].join('\n')
    const blob = new Blob([`// Wklej do CARDS{} w src/cards.js\n${code}\n`], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `card_${id}.js`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const card = draftToCard(draft)
  const { inspect } = useDevInspector()
  const canSave = draft.name.trim().length > 0 && draft.desc.trim().length > 0

  return (
    <div className="card-editor">
      <div className="card-editor__form">
        <FormPanel draft={draft} onChange={update} editingId={editingId} />
        {errors.length > 0 && (
          <div className="ced-errors">
            {errors.map((e, i) => <div key={i} className="ced-error-item">⚠ {e}</div>)}
          </div>
        )}
        <div className="ced-actions">
          <button className={`ced-btn ced-btn--save ${savedMsg?'ced-btn--done':''} ${!canSave?'ced-btn--muted':''}`}
            onClick={saveToLibrary} title={!canSave?'Wypełnij nazwę i opis':''}>
            {savedMsg ? '✓ Zapisano!' : '💾 Zapisz'}
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
    </div>
  )
}

interface FormPanelProps { draft: CardDraft; onChange: (p: Partial<CardDraft>) => void; editingId: string | null }

const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'companion',           label: 'Companion' },
  { value: 'boss',                label: 'Boss 👾' },
  { value: 'transformer',         label: 'Transformer ⚡' },
  { value: 'item_with_attack',    label: 'Item — z atakiem ⚔' },
  { value: 'item_without_attack', label: 'Item — bez ataku' },
  { value: 'clunker',             label: 'Clunker' },
  { value: 'shade',               label: 'Shade' },
  { value: 'charm',               label: 'Charm' },
  { value: 'testets',             label: 'testets' },
  { value: 'test2',               label: 'test2' },
  { value: 'test3',               label: 'test3' },
]

function FormPanel({ draft, onChange, editingId }: FormPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const loadFile = (file: File) => {
    const r = new FileReader(); r.onload = e => onChange({imgSrc: e.target?.result as string}); r.readAsDataURL(file)
  }

  const isCompanionLike  = COMPANION_LIKE_TYPES.includes(draft.type)
  const isItemWithAttack = draft.type === 'item_with_attack'
  const isItemWithout    = draft.type === 'item_without_attack'
  const isItem           = isItemWithAttack || isItemWithout

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
            {CARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="ced-label" style={{flex:1}}>Tribe
          <select className="ced-input" value={draft.tribe} onChange={e => onChange({tribe: e.target.value as TribeType})}>
            {(['snowdwellers','shademancers','clunkmasters','transformers','none'] as TribeType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      {isCompanionLike && (
        <>
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
        </>
      )}
      {isItemWithAttack && (
        <>
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
                <option value="enemy">Wróg</option>
                <option value="ally">Sojusznik</option>
              </select>
            </label>
            <label className="ced-label ced-label--check">
              <input type="checkbox" checked={draft.splash} onChange={e => onChange({splash:e.target.checked})} />
              Splash
            </label>
          </div>
        </>
      )}
      {isItemWithout && (
        <>
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
                <option value="enemy">Wróg</option>
                <option value="ally">Sojusznik</option>
              </select>
            </label>
          </div>
        </>
      )}
      {!isCompanionLike && !isItem && (
        <div className="ced-section-hint">Typ <strong>{draft.type}</strong> — statystyki TODO</div>
      )}
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
    </div>
  )
}
