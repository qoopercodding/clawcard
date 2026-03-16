# ClawCard POC — Słownik obiektów (SCHEMA)

> Jedyne źródło prawdy o tym jakie obiekty istnieją w grze.
> Każdy agent (Claude, Codex, człowiek) używa tych nazw i tych pól.
> Nie wymyślaj nowych pól bez dodania ich tutaj.

---

## 1. CardDefinition

**Gdzie żyje:** `src/cards.js` — słownik `CARDS`
**Kto tworzy:** programista (ręcznie) lub Card Editor (zapis do localStorage)
**Kiedy mutowany:** nigdy podczas gry. Tylko przy dodaniu nowej karty do kodu.

```
CARDS = {
  'id_karty': CardDefinition,
  ...
}
```

### Schemat — typ `companion`

```js
{
  id:      string,      // klucz w CARDS, snake_case. MUSI być identyczny z kluczem obiektu.
                        // Przykład: 'namandi', 'berry_sis', 'moja_karta'

  name:    string,      // wyświetlana nazwa karty
                        // Przykład: 'Namandi Shellandi', 'Berry Sis'

  type:    'companion', // typ karty — decyduje o rendererze i logice zagrywania

  tribe:   string,      // przynależność plemienna (kosmetyczna, nie wpływa na logikę)
                        // Wartości: 'shelly' | 'clunk' | 'snowdwell' | 'none'

  img:     string|null, // URL obrazka karty. Użyj gettera dla dynamicznych ścieżek:
                        //   get img() { return cardImg('plik.jpg') }   ← karty customowe
                        //   get img() { return img('Plik.png') }       ← karty Wildfrost
                        // null = używa pola icon jako fallback emoji

  icon:    string,      // emoji fallback gdy img=null lub obraz nie załaduje się
                        // Przykład: '🦀', '🐾', '⭐'

  hp:      number,      // startowe HP. Kopiowane do CardInstance jako currentHp i maxHp.
                        // Zakres: 1–99

  atk:     number,      // obrażenia zadawane przy triggerze. 0 = karta nie atakuje.
                        // Zakres: 0–20

  counter: number,      // ile tur do triggera. Kopiowane do currentCounter i maxCounter.
                        // Zakres: 1–9

  desc:    string,      // opis efektu specjalnego wyświetlany w podglądzie ręki
                        // Może być pusty string ''

  trigger: string|undefined, // opcjonalny klucz specjalnego triggera (nie domyślny atak)
                        // Wartości: 'frenzy' | 'snow_aura' | undefined
                        // Obsługiwane przez TRIGGERS w battle.js (TODO: EPIC-03)
}
```

### Schemat — typ `item`

```js
{
  id:      string,      // jak wyżej
  name:    string,      // jak wyżej
  type:    'item',      // typ: item = karta jednorazowego użytku z ręki

  img:     string|null, // jak wyżej
  icon:    string,      // jak wyżej
  desc:    string,      // jak wyżej

  // Efekty — przynajmniej jedno z poniższych musi być podane:
  atk:     number|undefined,  // obrażenia zadawane celowi. undefined = 0
  snow:    number|undefined,  // liczba stacków Snow nakładana na cel. undefined = 0
  heal:    number|undefined,  // HP leczone sojusznikowi. undefined = 0
  shield:  number|undefined,  // tarcza dodawana sojusznikowi. undefined = 0 (TODO: F-002)

  // Zachowanie:
  target:  'enemy'|'ally',    // domyślna strona celu
  splash:  boolean|undefined, // true = efekt uderza WSZYSTKICH wrogów jednocześnie
                              // undefined = false (trafia tylko jeden cel)
}
```

### Przykłady pełnych definicji

```js
// Companion:
namandi: {
  id: 'namandi', name: 'Namandi Shellandi', type: 'companion',
  tribe: 'shelly',
  get img() { return cardImg('namandi.jpg'); },
  icon: '🦀',
  hp: 11, atk: 1, counter: 1,
  desc: 'Lider drużyny',
},

// Item z dmg + snow:
snowball: {
  id: 'snowball', name: 'Snowball', type: 'item',
  icon: '❄', atk: 1, snow: 1,
  target: 'enemy',
  desc: 'Deal 1 dmg. Apply 1 Snow.',
},

// Item splash (uderza wszystkich):
bonesaw: {
  id: 'bonesaw', name: 'Bonesaw', type: 'item',
  icon: '🪚', atk: 2, splash: true,
  target: 'enemy',
  desc: 'Hit all enemies for 2.',
},

// Item heal:
healberry: {
  id: 'healberry', name: 'Heal Berry', type: 'item',
  icon: '🍓', heal: 3,
  target: 'ally',
  desc: 'Restore 3 HP to an ally.',
},
```

---

## 2. CardInstance

**Gdzie żyje:** `Battle.playerCells[0..5]` i `Battle.enemyCells[0..5]`
**Kto tworzy:** `makeCard(defId)` — dla kart gracza | `mkE(...)` — dla wrogów
**Kiedy mutowany:** ciągle podczas walki (hp spada, counter odlicza, snow znika)
**Kiedy niszczony:** po śmierci karty (komórka → null) lub resecie walki

```js
{
  // --- Skopiowane z CardDefinition (nie mutuj tych pól) ---
  id:          string,   // klucz z CARDS
  name:        string,   // wyświetlana nazwa
  type:        string,   // 'companion' | 'item'
  icon:        string,   // emoji fallback
  img:         string|null, // URL obrazka
  atk:         number,   // bazowe obrażenia (nie zmienia się)
  desc:        string,

  // --- Pola runtime (zmieniają się podczas walki) ---
  currentHp:      number,  // AKTUALNE HP. Śmierć gdy <= 0.
  maxHp:          number,  // MAKSYMALNE HP. Do wyświetlania paska (currentHp/maxHp).
                           // Nigdy nie rośnie ponad tę wartość (heal jest cappowany).

  currentCounter: number,  // Bieżący licznik. Dekrementowany przez checkCounters().
                           // Gdy osiągnie 0: trigger + reset do maxCounter.

  maxCounter:     number,  // Wartość resetu po triggerze. Niezmienne podczas walki.

  snow:           number,  // Staki zamrożenia. 0 = aktywna karta.
                           // Gdy snow > 0: dmg anulowane, counter resetowany zamiast triggerować.
                           // Zużywane 1 na turę przez Mechanics.STATUS.snow.onTurn().

  shield:         number,  // Punkty tarczy. 0 = brak tarczy.
                           // Absorbuje dmg zanim spadnie currentHp.
                           // Logika w Mechanics.STATUS.shield.onHit().

  // --- Metadane ---
  instanceId:     string,  // Unikalne ID tej konkretnej instancji (Math.random().toString(36)).
                           // Używane do identyfikacji gdy ta sama karta jest w kilku komórkach.
                           // Lider ma zawsze instanceId === 'leader'.
}
```

### Jak stworzyć CardInstance

```js
// Karta gracza z definicji w CARDS:
const karta = makeCard('snowball');
// karta.currentHp === undefined (item nie ma HP — to normalne)
// karta.instanceId === 'abc123xyz' (losowy)

// Karta wroga (nie pochodzi z CARDS):
const wróg = mkE('Snoof', 'Snoof.png', 1, 5, 3);
// mkE(name, imageFilename, atk, hp, counter)
// wróg.currentHp === 5, wróg.maxHp === 5
```

---

## 3. BattleState

**Gdzie żyje:** `battle.js` — obiekt `Battle`
**Kto tworzy:** `battleSetup(isBoss)` — resetuje i wypełnia na starcie walki
**Kiedy mutowany:** po każdej akcji gracza (zagranie karty, redraw, trigger, dmg)

```js
Battle = {
  // --- Siatki planszy ---
  playerCells: Array(6),  // [CardInstance|null, ...] — 6 miejsc gracza
                          // Indeksy: [0,1,2] = górny rząd, [3,4,5] = dolny rząd
                          // (wizualnie: 3 kolumny × 2 rzędy)

  enemyCells:  Array(6),  // [CardInstance|null, ...] — 6 miejsc wroga
                          // Ta sama struktura co playerCells

  leader:      CardInstance|null, // Referencja do instancji lidera (namandi).
                          // ZAWSZE to samo co playerCells[2].
                          // leader.instanceId === 'leader' (stałe ID do identyfikacji).
                          // Śmierć lidera = przegrana (TODO: F-008)

  // --- Talia ---
  hand:    string[],  // ID kart aktualnie w ręce gracza (klucze z CARDS)
                      // Przykład: ['sword', 'snowball', 'healberry']

  deck:    string[],  // ID kart w przetasowanej talii (do dobierania)

  discard: string[],  // ID kart na stosie odrzutów (zagrane + redraw)

  // --- Kontrola ---
  active:        boolean, // false = walka zakończona, blokuje wszelkie akcje
  redrawBell:    number,  // ile redrawów zostało. Start: 4. Min: 0.
  redrawBellMax: number,  // maksymalna liczba redrawów (stałe: 4)
  redrawCharged: boolean, // true gdy bell=0 → następny redraw jest darmowy

  // --- Wewnętrzne ---
  _hadTriggers: boolean,  // czy w tej turze był jakiś trigger (do optymalizacji UI.render)
}
```

---

## 4. RunState

**Gdzie żyje:** `game.js` — `Game.run`
**Kto tworzy:** inicjalizacja przy starcie (hardcoded)
**Kiedy mutowany:** po każdej wygranej walce (node rośnie), po wyborze nagrody (deck rośnie)

```js
Game.run = {
  deck:  string[],  // aktualna talia gracza — ID kart. Modyfikowana przez nagrody.
                    // Startowa talia = [...STARTER_DECK]
                    // Duplikaty są normalne (np. trzy 'sword')

  node:  number,    // index aktualnie aktywnego węzła mapy. Startuje od 0.
                    // Po wygranej walce: node++

  nodes: NodeDef[], // definicja mapy — tablica węzłów w kolejności
}

// NodeDef:
{
  type:  'battle'|'boss'|'prize'|'shop'|'event', // typ węzła
  label: string,  // tekst pod ikoną na mapie
  icon:  string,  // emoji ikony
}
```

---

## 5. Mechanics.STATUS (mechanics.js — DO STWORZENIA)

**Gdzie żyje:** `src/mechanics.js` — obiekt `Mechanics`
**Cel:** centralne miejsce dla WSZYSTKICH efektów statusów

```js
Mechanics.STATUS = {
  'nazwaStatusu': {
    icon:  string,  // emoji ikony statusu wyświetlanej na karcie
    color: string,  // kolor hex dla floatText i wizualizacji

    /**
     * Wywoływane gdy karta z tym statusem dostaje dmg.
     * Zwraca zmodyfikowaną wartość dmg (może być 0 = dmg anulowane).
     * @param {CardInstance} card
     * @param {number} dmg - wejściowe obrażenia
     * @returns {number} - obrażenia po efekcie statusu
     */
    onHit(card, dmg) { return dmg; },

    /**
     * Wywoływane na początku tury (checkCounters).
     * Może zwrócić efekt do zastosowania lub null.
     * @param {CardInstance} card
     * @returns {{ dmg?: number }|null}
     */
    onTurn(card) { return null; },

    /**
     * Nakłada status na kartę.
     * @param {CardInstance} card
     * @param {number} amount
     */
    apply(card, amount) { card.snow = (card.snow||0) + amount; },
  },
}
```

### Statusy do zaimplementowania

| Status | Pole w CardInstance | Zachowanie |
|--------|---------------------|------------|
| `snow` | `card.snow` | onHit: anuluje dmg gdy snow>0, zużywa 1 stack. onTurn: dekrementuje snow zamiast counter. |
| `shield` | `card.shield` | onHit: absorbuje dmg do wartości shield. onTurn: nic. |
| `poison` | `card.poison` | onHit: nie blokuje. onTurn: zadaje dmg równy stackom, stack -1. |

---

## 6. FRAME_CONFIG (ui.js)

**Gdzie żyje:** `src/ui.js` — stała `FRAME_CONFIG`
**Cel:** pozycjonowanie elementów statystyk na PNG ramce karty

```js
FRAME_CONFIG = {
  'companion': {
    frame: string,  // nazwa pliku PNG ramki w root projektu
                    // Przykład: 'Companion Frame.png'

    art: {
      left:   number,  // % od lewej krawędzi karty (0–100)
      top:    number,  // % od góry karty
      width:  number,  // % szerokości karty
      height: number,  // % wysokości karty
    },

    hp:      { left: number, top: number },  // % pozycja centrum ikony HP
    atk:     { left: number, top: number },  // % pozycja centrum ikony ATK
    counter: { left: number, top: number },  // % pozycja centrum licznika
    name:    { left: number, top: number },  // % pozycja centrum nazwy karty
  },
  'item': { ... },  // TODO: EPIC-02
}
```

---

## 7. Helpery ścieżek obrazków (cards.js)

```js
img(filename)      // → window.IMG_BASE + filename
                   // Używaj dla kart z zestawu Wildfrost (np. 'Berry_Sis.png')
                   // Przykład: get img() { return img('Foxee.png'); }

cardImg(filename)  // → 'assets/cards/' + filename
                   // Używaj dla kart customowych gracza
                   // Przykład: get img() { return cardImg('namandi.jpg'); }
```

---

## 8. Stałe globalne (cards.js)

```js
CARDS         // { [id: string]: CardDefinition } — wszystkie definicje kart
STARTER_DECK  // string[] — ID kart startowej talii gracza (duplikaty OK)
REWARD_POOL   // string[] — pula do losowania nagród po walce
```

---

## 9. Zależności między plikami

```
cards.js       — nic nie importuje, eksportuje CARDS, STARTER_DECK, REWARD_POOL
mechanics.js   — importuje (czyta) CardInstance schema, eksportuje Mechanics
audio.js       — nic nie importuje, eksportuje Audio
anim.js        — używa DOM, eksportuje Anim
battle.js      — używa CARDS, Mechanics, Anim, Audio, UI, Game
ui.js          — używa CARDS, FRAME_CONFIG, Anim
game.js        — używa Battle, UI, CARDS, Audio
card-editor.js — używa CARDS, localStorage
```

Kierunek zależności (strzałka = "używa"):
```
cards.js ←── battle.js ←── game.js
              ↑
mechanics.js ─┘
anim.js ─────┘
audio.js ────┘
ui.js ───────┘
```
