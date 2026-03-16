# ClawCard POC — Dokumentacja Referencyjna
> Ostatnia aktualizacja: 2026-03-11
> Cel: precyzyjna komunikacja o zmianach w kodzie bez screenshotów

---

## Jak używać tego dokumentu

Zamiast mówić "popraw jak wygląda karta na planszy" — powiedz:
**"W `FRAME_CONFIG.companion.hp.top` zmień wartość z 23.5 na 18"**

Zamiast "obrazek się nie wyświetla" — powiedz:
**"W `_makeFramedCard`, artImg.src dostaje `null` zamiast base64 gdy wgrywam PNG z dysku"**

---

## Mapa plików

```
wildfrost-poc/
  index.html              ← ładuje wszystkie skrypty, Live Server root
  Companion Frame.png     ← PNG ramki companion (musi być w root LS)
  assets/cards/           ← obrazki customowych kart (namandi.jpg itp.)
  src/
    cards.js              ← definicje kart, STARTER_DECK, REWARD_POOL
    ui.js                 ← renderowanie DOM, FRAME_CONFIG, CARD_W/H
    game.js               ← nawigacja, ekrany, run loop
    battle.js             ← logika walki, liczniki, triggery
    card-editor.js        ← edytor kart, frame mapper, localStorage
    anim.js               ← animacje (hit, death, attackCharge)
    audio.js              ← dźwięki
  styles/
    main.css              ← główne style
    card-editor.css       ← style edytora kart
    card-view.css         ← style ekranu podglądu talii
```

---

## cards.js — Dane kart

### Funkcje pomocnicze
| Funkcja | Parametr | Zwraca | Kiedy używać |
|---|---|---|---|
| `img(filename)` | np. `'Berry_Sis.png'` | URL z IMG_BASE (wildfrost_data) | Karty z zestawu Wildfrost |
| `cardImg(filename)` | np. `'namandi.jpg'` | `'assets/cards/namandi.jpg'` | Karty customowe (muszą być w assets/cards/) |

### Schemat karty — COMPANION
```
id:      string    — klucz w CARDS, snake_case
name:    string    — wyświetlana nazwa
type:    'companion'
tribe:   'shelly' | 'clunk' | 'snowdwell' | 'none'
img:     string | null     — URL lub getter; null = użyj icon
icon:    string            — emoji fallback gdy img null
hp:      number            — startowe HP = maxHp
atk:     number            — dmg per trigger
counter: number            — tury do triggera = maxCounter
desc:    string            — opis wyświetlany w ręce
```

### Schemat karty — ITEM
```
id, name, type: 'item', img, icon,
atk?:    number    — obrażenia
snow?:   number    — staki zamrożenia na celu
heal?:   number    — punkty leczenia sojusznika
target:  'enemy' | 'ally'
splash?: boolean   — true = uderza wszystkich wrogów
desc:    string
```

### STARTER_DECK
Tablica ID: `['sword','sword','sword','snowball','snowball','bonesaw','healberry','healberry']`
Zmień żeby gracz startował z inną talią.

### REWARD_POOL
Tablica ID kart dostępnych jako nagrody po walce.
`UI.showReward()` losuje 3 bez powtórzeń.

---

## ui.js — Renderowanie

### Stałe globalne
| Stała | Wartość | Co kontroluje |
|---|---|---|
| `CARD_W` | `110` (px) | Szerokość karty na planszy |
| `CARD_H` | `~162` (px) | Wysokość karty na planszy (CARD_W / 0.68) |

### FRAME_CONFIG
Pozycje elementów na PNG ramce, w **% szerokości/wysokości karty**.

```js
FRAME_CONFIG.companion = {
  frame:   'Companion Frame.png',  // plik PNG, musi być w root Live Server
  art:     { left: 10,   top: 15,   width: 75,  height: 40  },
  hp:      { left: 10.3, top: 23.5 },
  atk:     { left: 89.4, top: 22.5 },
  counter: { left: 49.8, top: 93.1 },
  name:    { left: 48.7, top: 58.1 },
  desc:    { left: 48.7, top: 68.3 },
}
```

**Żeby przesunąć stat:** zmień `left` (poziomo, 0=lewa, 100=prawa) lub `top` (pionowo, 0=góra, 100=dół).
**Żeby zmienić obszar artu:** zmień `art.left/top/width/height`.

### Metody UI

| Metoda | Parametry | Efekt |
|---|---|---|
| `UI.render()` | — | Odświeża całe UI walki (wywołuj po każdej zmianie Battle) |
| `UI.makeBoardCard(card, side)` | instancja karty, 'player'/'enemy' | Zwraca HTMLElement karty na planszy |
| `UI.makeHandCard(cardId)` | klucz w CARDS | Zwraca HTMLElement karty w ręce (lub null) |
| `UI.renderGrid(id, cells, side)` | DOM id, array 6 kart/null, side | Przebudowuje siatkę |
| `UI.renderHand()` | — | Przebudowuje #hand z Battle.hand |
| `UI.showReward()` | — | Pokazuje overlay z 3 losowymi nagrodami |
| `UI.showPileModal(pile)` | 'deck' lub 'discard' | Modal z listą kart |

### Renderer kart na planszy

```
makeBoardCard()
  └─ type ma wpis w FRAME_CONFIG? → _makeFramedCard()   ← companion
  └─ brak wpisu                  → _makeLegacyBoardCard() ← item i inne
```

**_makeFramedCard — warstwy DOM (od dołu):**
1. `bgEl` — białe tło, umożliwia mix-blend-mode:multiply na ramce
2. `artEl` — div z `<img>` lub emoji, przycinany do `cfg.art`
3. `frameImg` — PNG ramki, `mix-blend-mode:multiply`
4. `hpEl`, `atkEl`, `cntEl`, `nameEl` — absolutnie pozycjonowane z FRAME_CONFIG

---

## battle.js — Logika walki

### Stan Battle
```js
Battle.playerCells[0..5]  // siatka gracza — null lub instancja karty
Battle.enemyCells[0..5]   // siatka wroga — null lub instancja karty
Battle.leader             // referencja do instancji namandi (playerCells[2])
Battle.hand               // [] ID kart w ręce gracza
Battle.deck               // [] ID kart w talii
Battle.discard            // [] ID kart na stosie odrzutów
Battle.active             // bool — false gdy walka zakończona
Battle.redrawBell         // int — ile redrawów zostało (max 4)
Battle.redrawCharged      // bool — darmowy redraw dostępny
```

### Instancja karty (runtime, różni się od definicji w CARDS)
```
hp:         number   — aktualne HP
maxHp:      number   — maksymalne HP
counter:    number   — odlicza do 0, potem trigger
maxCounter: number   — wartość resetu
snow:       number   — stack zamrożenia
shield:     number   — tarcza (absorbuje dmg)
instanceId: string   — unikalne ID tej instancji
```

### Funkcje

| Funkcja | Parametry | Co robi |
|---|---|---|
| `battleSetup(isBoss)` | bool | Reset stanu, ustawia wrogów, tasuje deck |
| `battleDraw(n)` | int | Dobiera n kart z deck do hand |
| `redraw()` | — | Przetasowuje rękę (kosztuje bell) |
| `playCard(cardId, cellIdx, side)` | string, 0-5, 'player'/'enemy' | Zagrywa kartę z ręki |
| `applyItem(def, cellIdx, side)` | definicja karty, int, string | Efekt itemu |
| `dealDamage(card, dmg, side, idx)` | instancja, int, string, int | Zadaje dmg, obsługuje śmierć |
| `applySnow(card, amount)` | instancja, int | Dodaje Snow stack |
| `checkCounters()` | — | Dekrementuje liczniki, triggeruje ataki |
| `checkWinLose()` | — | Sprawdza koniec walki |
| `addBattleLog(msg, type)` | string, string | Dodaje wpis do logu |

### Przepływ tury
```
playCard()
  → usuń z hand, dodaj do discard
  → companion: makeCard() → playerCells[idx]
  → item: applyItem() → dealDamage/applySnow/heal
  → checkCounters()    ← dekrementuje wszystkie liczniki
      → triggerCard()  ← async, setTimeout 200ms
          → dealDamage()
              → śmierć: compactFront(), checkWinLose()
  → UI.render()
```

---

## game.js — Nawigacja

### Stan runu
```js
Game.run.deck    // [] ID kart w aktualnej talii (modyfikuje się przez nagrody)
Game.run.node    // int — index aktualnego węzła (0 = start)
Game.run.nodes   // [] definicje węzłów mapy
```

### Metody

| Metoda | Parametry | Co robi |
|---|---|---|
| `Game.init()` | — | Start gry: loadCustomCards → buildDOM → showMap |
| `Game.showMap()` | — | Renderuje mapę, pokazuje screen-map |
| `Game.showCardView(isBoss)` | bool | Podgląd talii przed bitwą |
| `Game._confirmBattle()` | — | Wywołuje _startBattleNow z zapamiętanym typem |
| `Game._startBattleNow(isBoss)` | bool | Inicjalizuje i pokazuje walkę |
| `Game.battleWon()` | — | Przesuwa węzeł po wygranej |
| `Game.advanceMap()` | — | Przesuwa węzeł (po nagrodzie) |
| `Game.showEditor()` | — | Przełącza na edytor kart |
| `Game.showScreen(id)` | string DOM id | Ukrywa wszystkie, pokazuje jeden ekran |
| `Game._loadCustomCards()` | — | Ładuje z localStorage['ced_library'] do CARDS |

### Przepływ ekranów
```
showMap()
  → węzeł battle/boss: showCardView(isBoss)
      → "Do walki!": _confirmBattle() → _startBattleNow()
          → battle wygrana: battleWon() → showMap() lub showReward()
  → węzeł prize: UI.showReward()
      → wybór nagrody: advanceMap() → showMap()
  → przycisk "Card Editor": showEditor()
      → "← Mapa": showMap()
```

---

## card-editor.js — Edytor kart

### Stan CardEditor
```js
CardEditor.draft           // roboczy szkic aktualnie edytowanej karty
CardEditor.draft.id        // string — klucz karty
CardEditor.draft.name      // string
CardEditor.draft.type      // 'companion' | 'item' | 'power' | 'consumable' | 'aura'
CardEditor.draft.hp/atk/counter/snow/heal
CardEditor.draft.imgSrc    // string base64 lub URL lub null
CardEditor.draft.icon      // string emoji fallback
CardEditor.draft.tribe
CardEditor.draft.target    // 'enemy' | 'ally'
CardEditor.draft.splash    // bool

CardEditor.mapper          // stan narzędzia frame mapper
CardEditor.mapper.frameType   // typ ramki aktualnie mapowanej
CardEditor.mapper.imgSrc      // base64 załadowanego PNG ramki
CardEditor.mapper.step        // index aktualnego kroku
CardEditor.mapper.result      // {art, hp, atk, counter, name, desc} — zebrane punkty
```

### Metody

| Metoda | Co robi |
|---|---|
| `CardEditor.init()` | Inicjalizuje edytor, renderuje zakładkę editor |
| `CardEditor.liveUpdate()` | _readForm() + renderPreview() — odświeża podgląd |
| `CardEditor.renderPreview()` | Buduje podglądy "w ręce" i "na planszy" |
| `CardEditor.saveToLibrary()` | Zapisuje draft do localStorage['ced_library'] + CARDS |
| `CardEditor.exportCard()` | Pobiera .js snippet do wklejenia do cards.js |
| `CardEditor.loadDraft(id)` | Ładuje kartę z biblioteki do formularza |
| `CardEditor.deleteSaved(id)` | Usuwa kartę z localStorage i CARDS |
| `CardEditor.runSanityTests()` | Sprawdza integralność: CARDS, STARTER_DECK, REWARD_POOL, obrazki |

### localStorage
```
'ced_library'            → { id: { ...draft } }  — biblioteka kart
'frameConfig_companion'  → { art, hp, atk, counter, name, desc }  — config z mappera
'frameConfig_item'       → j.w.
```

---

## Typowe prośby — jak je precyzyjnie formułować

| Chcesz | Powiedz |
|---|---|
| Przesunąć ikonę HP wyżej | "W `FRAME_CONFIG.companion.hp.top` zmień X na Y" |
| Zmienić rozmiar artu | "W `FRAME_CONFIG.companion.art` zmień width/height" |
| Dodać kartę do gry | "Dodaj do `CARDS` w cards.js nową kartę o typie companion z hp/atk/counter" |
| Zmienić startową talię | "W `STARTER_DECK` zamień/dodaj ID karty X" |
| Naprawić pozycję nazwy na karcie planszy | "W `_makeFramedCard`, `nameEl` — zmień `cfg.name.left/top`" |
| Zmienić rozmiar karty | "Zmień `CARD_W` z 110 na X (CARD_H skaluje się automatycznie)" |
| Dodać nowego wroga do walki | "W `battleSetup()` w battle.js, w bloku `else`, dodaj `Battle.enemyCells[idx] = mkE('Nazwa', 'plik.png', atk, hp, counter)`" |
| Zmienić lidera | "W `battleSetup()`, zamień 'namandi' na inny ID i dostosuj playerCells[idx]" |
| Zmienić wrogów bossa | "W `battleSetup()`, blok `if (isBoss)`, zmień mkE() wrogów" |
