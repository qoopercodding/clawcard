# CLAWCARD BUILDER — Dokumentacja dla Codex/AI Agent

## Repo
https://github.com/qoopercodding/clawcard

## Struktura projektu
```
clawcard_base/
├── wildfrost-poc/                    ← Stary vanilla JS POC (port 5500)
│   ├── src/                          ← Stara gra (cards.js, battle.js, ui.js)
│   ├── Companion Frame.png           ← Oryginalna ramka companion
│   ├── boss.png                      ← Ramka boss
│   ├── Item_with_atatck.png          ← Ramka item z atakiem (literówka w nazwie!)
│   ├── Item_without_atatck.png       ← Ramka item bez ataku (literówka!)
│   └── clawcard-builder/             ← GŁÓWNY PROJEKT (port 5175)
│       ├── src/
│       │   ├── types/card.types.ts   ← Wszystkie typy kart (CardType union)
│       │   ├── utils/frameConfig.ts  ← Config ramek PNG per typ karty
│       │   ├── data/sampleCards.ts   ← Karty z wildfrost_data
│       │   ├── components/
│       │   │   ├── CardFrame/        ← Uniwersalny renderer karty z PNG
│       │   │   └── debug/            ← DevInspector, HoverTooltip
│       │   ├── modules/
│       │   │   ├── frame-editor/     ← Frame Editor (mapper obszarów)
│       │   │   ├── card-editor/      ← Card Editor (formularz kart)
│       │   │   ├── battle-demo/      ← Grywalne demo walki
│       │   │   └── card-builder/     ← Galeria kart
│       │   └── pages/StartPage.tsx   ← Hub nawigacyjny
│       ├── public/
│       │   ├── frames/               ← PNG ramek serwowane przez Vite
│       │   │   ├── Companion Frame.png
│       │   │   ├── Item_with_attack.png
│       │   │   ├── Item_without_attack.png
│       │   │   └── boss.png
│       │   └── cards/                ← PNG obrazków kart (25 plików)
│       ├── vite-plugin-frame-config.ts  ← Plugin: POST /api/save-frame-config
│       └── vite.config.ts            ← Vite + plugin
```

---

## Stack
- **React 18 + TypeScript + Vite** (port 5175)
- Stary vanilla POC na Live Server (port 5500) — nieużywany przez nowy builder

---

## Typy kart (card.types.ts)

```typescript
export type CardType =
  | 'companion'
  | 'item_with_attack'
  | 'item_without_attack'
  | 'clunker'
  | 'shade'
  | 'charm'
  | 'boss'
  | 'testets'   // typ testowy
  | 'test2'     // typ testowy
```

Każdy typ ma:
- `CardBase` — id, name, type, tribe, imageUrl, imageFallback, description
- Własny interface (CompanionCard, ItemCard, BossCard itd.)
- Wpis w `FRAME_CONFIGS` w `frameConfig.ts`
- Wpis w `CARD_TYPES[]` w `CardEditorScreen.tsx`

**Dodawanie nowego typu przez Frame Editor:**
1. Frame Editor → "✦ Nowy typ" → wpisz nazwę (snake_case)
2. Zaznacz pola (art, hp, atk, counter, name, desc)
3. Wgraj PNG ramki (drag&drop)
4. Zaznacz prostokąty
5. Kliknij "💾 Zapisz typ + git push"
→ Plugin automatycznie aktualizuje card.types.ts, frameConfig.ts, CardEditorScreen.tsx

---

## Renderowanie kart (CardFrame.tsx)

**Warstwy DOM (od dołu):**
1. `div` białe tło (`#ffffff`) — wymagane dla `mix-blend-mode: multiply`
2. `div` art area — grafika PNG lub emoji fallback
3. `img` PNG ramka z `mix-blend-mode: multiply`
4. Statystyki (HP, ATK, Counter, Nazwa, Opis) — pozycjonowane absolutnie wg `AreaConfig` (%)

**Duck typing w getCardStats** — działa dla każdego nowego typu bez zmian:
```typescript
// Sprawdza czy karta ma 'hp', 'attack', 'counter' — automatycznie
const c = card as Record<string, unknown>
return { hp: c['hp'], atk: c['attack'], counter: c['counter'] }
```

---

## Frame Config (frameConfig.ts)

Każdy typ karty ma `FrameConfig`:
```typescript
interface FrameConfig {
  frameFile: string | null   // np. '/frames/Companion Frame.png'
  art:      AreaConfig       // { left, top, width, height } w %
  name:     AreaConfig
  desc:     AreaConfig
  hp?:      AreaConfig       // opcjonalne
  atk?:     AreaConfig
  counter?: AreaConfig
  scrap?:   AreaConfig
}
```

Wartości dla companion (skalibrowane przez Frame Editor):
```
art:     { left: 14,   top: 10.5, width: 70.6, height: 44.4 }
hp:      { left: 3.9,  top: 20.4, width: 12.7, height: 5.3  }
atk:     { left: 81.3, top: 19.3, width: 9.6,  height: 5.1  }
counter: { left: 42.9, top: 88.1, width: 12.7, height: 7.3  }
name:    { left: 17.7, top: 53.4, width: 63.1, height: 6.7  }
desc:    { left: 19.8, top: 61.2, width: 58.4, height: 23.9 }
```

---

## Vite Plugin (vite-plugin-frame-config.ts)

Endpoint: `POST /api/save-frame-config`

Payload:
```typescript
{
  typeName:     string       // np. 'enemy'
  typeLabel:    string       // np. 'Enemy'
  frameFile:    string|null  // np. '/frames/enemy.png'
  pngFileName:  string|null  // np. 'enemy.png' (do zapisu w /public/frames/)
  pngBase64:    string|null  // data:image/png;base64,... (z drag&drop)
  fields:       Record<string, AreaConfig>
  enabledFields: string[]
  isNew:        boolean
}
```

Co robi:
1. Zapisuje PNG z base64 do `/public/frames/`
2. Aktualizuje `src/utils/frameConfig.ts`
3. Jeśli `isNew`: aktualizuje `src/types/card.types.ts` + `src/modules/card-editor/CardEditorScreen.tsx`
4. `git add . && git commit && git push`

---

## Card Editor (CardEditorScreen.tsx)

Kluczowe zmienne:
- `COMPANION_LIKE_TYPES` — typy które mają pola HP/ATK/Counter w formularzu
- `CARD_TYPES[]` — lista w dropdownie Typ
- `draftToCard()` — konwersja formularza → AnyCard

**Walidacja:**
- Obligatoryjne dla wszystkich: `name` + `desc`
- COMPANION_LIKE_TYPES: dodatkowo `hp > 0` + `counter > 0`
- `item_with_attack`: `atk > 0`

---

## Battle Demo (battleEngine.ts + BattleDemoScreen.tsx)

Czysta logika w `battleEngine.ts` (zero UI):
- `initBattle(enemyIdx)` — init stanu walki
- `playCard(state, cardId)` — zagrywa kartę
- `endTurn(state)` — tickuje countery, triggeruje ataki
- `drawCard(state)` — dobiera kartę z talii

Mechaniki: Snow ❄ (blokuje atak), Shield 🛡 (absorbuje dmg), Teeth 🦷 (dmg zwrotny), Poison ☠, Counter ring (conic-gradient)

5 wrogów: Snoof → Wallop (shield) → Foxee → Tusk (teeth) → Dregg (boss)

---

## Dane kart (sampleCards.ts)

Obrazki z: `/public/cards/*.png` (skopiowane z `wildfrost_data/images/`)
Dane z: `wildfrost_data/cards/*.tres`

Karty z obrazkami: Berry_Sis, Foxee, Wallop, Snoof, Sneezle, Tusk, Dregg, Woodhead, Berry_Blade

---

## Strona testowa

`/frame-test` → `FrameConfigTest.tsx`

Testuje:
1. Vite plugin endpoint (HTTP 204)
2. Każdy PNG ramki (HTTP 200 + image/png)
3. FRAME_CONFIGS ma wymagane pola (art, name, desc)
4. POST dry run na plugin

---

## Nawigacja (App.tsx → StartPage.tsx)

```
AppView: 'start' | 'battle' | 'gallery' | 'card-editor' | 'frame-editor' | 'frame-test' | 'game' | 'dev-game'
```

---

## Co działa ✅

1. **Frame Editor** — przeciągasz prostokąty na PNG, zapisujesz nowy typ → automatycznie aktualizuje 3 pliki TS + git push
2. **Card Editor** — formularz z live preview, biblioteka w localStorage, eksport .js
3. **Galeria** — 14 kart z PNG ramkami i obrazkami z Wildfrost
4. **Battle Demo** — grywalne demo, 5 wrogów, pełna mechanika
5. **Frame Config Test** — e2e test pipeline

---

## Co wymaga uwagi ⚠️

1. **Git push przez plugin** — działa tylko gdy git ma skonfigurowane credentials (ssh-agent lub credential manager). Jeśli fail → musisz ręcznie `git push`.

2. **Literówki w nazwach plików** — oryginalne pliki w `wildfrost-poc/` mają `atatck` (literówka). W `/public/frames/` są już poprawnie `attack`.

3. **Typy testowe** — `testets` i `test2` są w kodzie — to typy testowe, można je usunąć z `card.types.ts`, `frameConfig.ts` i `CardEditorScreen.tsx`.

4. **COMPANION_LIKE_TYPES** — gdy plugin dodaje nowy typ, dodaje go do tej listy. Jeśli nowy typ NIE ma HP/Counter (np. pure item), plugin tego nie wie — trzeba ręcznie usunąć z listy.

5. **Vite restart po zmianie pluginu** — każda zmiana `vite-plugin-frame-config.ts` wymaga restartu `npm run dev`.

---

## Dalsze kroki (backlog)

### Priorytet 1 — Card Editor
- [ ] Kalibracja pozycji dla item_with_attack i item_without_attack przez Frame Editor
- [ ] Galeria kart w Card Editor powinna pobierać z localStorage biblioteki + sampleCards
- [ ] Podgląd karty w Card Editor powinien ładować obrazek przez URL ze schowka

### Priorytet 2 — Frame Editor
- [ ] "Szybki dostęp" powinien się aktualizować gdy dodasz nowy typ (obecnie hardcoded 4 przyciski)
- [ ] Walidacja: sprawdź czy PNG jest w /public/frames/ przed zapisem przez quick-load

### Priorytet 3 — Battle Demo
- [ ] Wiele kart gracza na planszy (grid 3×2)
- [ ] Reward system po wygranej (wybierz kartę z puli)
- [ ] Enemy AI countery i patterny (jak w Wildfrost)
- [ ] Animacje ataku (karta "idzie" w stronę wroga)

### Priorytet 4 — Integracja z Godot
- [ ] Export kart z Builder → import do Godot przez .tres
- [ ] UIScale.gd autoload (content_scale_factor = 7.5) w Godot projekcie
- [ ] Rewertowanie manualnych x7.5 edycji z ~15 scen

### Priorytet 5 — Dane
- [ ] Import pozostałych kart z wildfrost_data (Alloy, Beepop, Biji, Binku, Bitebox, Booshu...)
- [ ] Parser .tres → sampleCards.ts (automatyczny import)

---

## Jak uruchomić

```bash
# Główny builder (port 5175)
cd C:/Users/Qoope/godot_projects/clawcard_base/wildfrost-poc/clawcard-builder
npm run dev

# Stary POC (port 5500)
# Otwórz wildfrost-poc/ w VS Code → Live Server
```

---

## Ważne: jak plugin dodaje nowy typ

Gdy Frame Editor zapisuje nowy typ, plugin modyfikuje te pliki:

**card.types.ts** — dodaje do union i interface:
```typescript
export type CardType = ... | 'nowy_typ'

export interface NowyTypCard extends CardBase {
  type: 'nowy_typ'
  hp: number; attack: number; counter: number; abilities: Ability[]
}

export type AnyCard = ... | NowyTypCard
```

**frameConfig.ts** — dodaje config:
```typescript
const NOWY_TYP_CONFIG: FrameConfig = {
  frameFile: '/frames/nowy_typ.png',
  art: { left: X, top: Y, width: W, height: H },
  // ...pozostałe pola
}

export const FRAME_CONFIGS = {
  // ...
  nowy_typ: NOWY_TYP_CONFIG,
}
```

**CardEditorScreen.tsx** — dodaje do dropdown i obsługi:
```typescript
const COMPANION_LIKE_TYPES = [..., 'nowy_typ']
const CARD_TYPES = [..., { value: 'nowy_typ', label: 'Nowy Typ' }]
// + case w draftToCard()
```
