# ClawCard POC — Instrukcja dla agentów AI

> Czytasz ten plik jako Codex (GPT-4o) lub Claude (Sonnet).
> Przeczytaj go w całości przed pierwszym taskiem. Nie pomijaj żadnej sekcji.

---

## Czym jest projekt

ClawCard to roguelike deck-builder inspirowany grą Wildfrost.
Stack: **vanilla HTML/CSS/JS** — zero frameworków, zero build tooli, zero npm w runtime.
Serwer deweloperski: Live Server port 5500 → `http://127.0.0.1:5500/index.html`

Dwa agenty pracują nad tym projektem równolegle:
- **Claude (Sonnet)** — architektura, planowanie, trudne logiki, przegląd kodu
- **Codex (GPT-4o)** — implementacja tasków, refactor, CSS, proste funkcje

---

## Struktura plików

```
wildfrost-poc/
├── AGENTS.md          ← ten plik — czytaj przed każdą sesją
├── SCHEMA.md          ← schematy WSZYSTKICH obiektów w grze
├── TASKS.md           ← backlog tasków z opisem i kryteriami akceptacji
├── REFERENCE.md       ← ściągawka — co robi każda funkcja
├── index.html         ← punkt wejścia, ładuje skrypty w kolejności
├── Companion Frame.png ← PNG ramki karty companion
├── assets/
│   └── cards/         ← obrazki kart customowych (namandi.jpg itp.)
├── styles/
│   ├── main.css        ← główne style, animacje, layout planszy
│   ├── card-editor.css ← style edytora kart
│   └── card-view.css   ← style ekranu podglądu talii
└── src/
    ├── cards.js        ← TYLKO dane: definicje kart, STARTER_DECK, REWARD_POOL
    ├── mechanics.js    ← mechaniki statusów (snow, shield, poison...)  [DO STWORZENIA]
    ├── anim.js         ← animacje DOM (Anim.*)
    ├── audio.js        ← dźwięki Web Audio API (Audio.*)
    ├── battle.js       ← logika walki, stan Battle
    ├── ui.js           ← renderowanie kart i planszy (UI.*)
    ├── game.js         ← nawigacja, ekrany, run loop (Game.*)
    └── card-editor.js  ← edytor kart (CardEditor.*)
```

Kolejność `<script>` w `index.html` jest ważna:
```
cards.js → audio.js → anim.js → mechanics.js → battle.js → ui.js → game.js → card-editor.js
```

---

## Obowiązkowy format każdego pliku JS

Każdy plik MUSI zaczynać się od tego bloku (wypełnij pola):

```js
// =============================================================================
// NAZWA_PLIKU.js — [jednozdaniowy opis co robi ten plik]
// =============================================================================
//
// ODPOWIADA ZA:
//   - [punkt 1]
//   - [punkt 2]
//
// NIE ODPOWIADA ZA:
//   - [co zostało świadomie poza tym modułem i dlaczego]
//
// GLOBALNE EKSPORTY:
//   NazwaObiektu       — opis (dostępny jako window.NazwaObiektu)
//   nazwaFunkcji()     — opis
//
// UŻYWA:
//   CARDS (cards.js), UI (ui.js) ...
//
// ŁADOWANY W index.html jako: <script src="src/NAZWA_PLIKU.js"></script>
// =============================================================================
```

---

## Obowiązkowy format każdej funkcji publicznej

```js
/**
 * Krótki opis co robi — jednym zdaniem.
 *
 * Dłuższy opis jeśli potrzebny. Zachowanie brzegowe, efekty uboczne.
 *
 * @param {string} paramNazwa - opis, dopuszczalne wartości
 * @param {number} paramDrugi - opis
 * @returns {Object|null} - opis co zwraca, kiedy null
 *
 * @example
 * // Przykład użycia:
 * const karta = makeCard('namandi');
 * console.log(karta.currentHp); // 11
 */
function nazwaFunkcji(paramNazwa, paramDrugi) {
  // implementacja
}
```

Funkcje prywatne (używane tylko wewnątrz pliku) — prefix `_`:
```js
function _pomocnicza() { ... }
```

---

## Obowiązkowy format obiektu stanu

Każdy obiekt przechowujący stan MUSI mieć schemat w komentarzu nad definicją:

```js
// -----------------------------------------------------------------------------
// NazwaObiektu — [opis co reprezentuje]
// -----------------------------------------------------------------------------
// pole1: typ      — opis co oznacza, zakres wartości
// pole2: typ      — opis
// pole3: typ[]    — opis tablicy
// -----------------------------------------------------------------------------
const NazwaObiektu = { ... };
```

---

## Konwencje nazewnictwa

| Co | Format | Przykład |
|---|---|---|
| Plik | kebab-case.js | `card-editor.js`, `battle-mechanics.js` |
| Moduł/Obiekt globalny | PascalCase | `Battle`, `CardEditor`, `Mechanics` |
| Funkcja publiczna | camelCase | `battleSetup()`, `makeCard()` |
| Funkcja prywatna | _camelCase | `_makeFramedCard()`, `_loadCustomCards()` |
| Stała globalna | UPPER_SNAKE | `CARDS`, `STARTER_DECK`, `FRAME_CONFIG` |
| ID karty w CARDS | snake_case | `berry_sis`, `venom_fang`, `heal_berry` |
| ID elementu DOM | kebab-case | `player-grid`, `enemy-grid`, `redraw-btn` |
| Klasa CSS | kebab-case | `board-wf-card`, `wf-stat-hp`, `anim-hit` |

---

## Zasady których nie łamiesz

1. **Nie modyfikujesz `CardDefinition`** podczas gry. `CARDS` to dane tylko do odczytu.
2. **Nie dodajesz globalnych zmiennych** których nie ma w schemacie w SCHEMA.md.
3. **Nie zmieniasz sygnatur** istniejących funkcji publicznych bez konsultacji z Claude.
4. **Nie używasz frameworków** — żadnego React, Vue, jQuery, Lodash.
5. **Nie używasz `innerHTML` do budowania kart** — tylko `createElement` + `appendChild`.
6. **Zawsze sprawdzasz null** zanim odczytasz `.hp`, `.atk` itp. z komórki siatki.
7. **Każdy nowy plik** dodajesz do `index.html` w odpowiednim miejscu kolejności.

---

## Jak rozumieć obiekty w grze

Pełne schematy są w `SCHEMA.md`. Skrót:

```
CardDefinition (cards.js / CARDS)
  → statyczny blueprint karty, nigdy nie mutowany
  → { id, name, type, hp, atk, counter, icon, img, desc, ... }

CardInstance (battle.js / tworzona przez makeCard())
  → żywa kopia podczas walki, zmienia się
  → { ...CardDefinition, currentHp, currentCounter, snow, shield, instanceId }

BattleState (battle.js / Battle)
  → pełny stan walki
  → { playerCells[6], enemyCells[6], hand[], deck[], discard[], active }

RunState (game.js / Game.run)
  → stan całego runu (mapa, talia)
  → { deck[], node, nodes[] }
```

Relacja tworzenia:
```
CARDS['id']  →  makeCard('id')  →  CardInstance  →  renderCard()  →  DOM element
```

---

## Jak commitować

Format: `typ(EPIC-NN): opis`

```
feat(EPIC-01): dodano mechanics.js z Mechanics.STATUS skeleton
fix(EPIC-03): snow nie blokowało dmg po shield
refactor(EPIC-02): _makeFramedCard obsługuje type item
docs(EPIC-01): uzupełniono JSDoc w battle.js
```

---

## Aktualny focus

Sprawdź `TASKS.md` — sekcja **"Aktywny sprint"**.
Rób taski w kolejności. Zanim zaczniesz task — przeczytaj jego kryteria akceptacji.
Jeśli task jest niejasny — napisz pytanie w komentarzu `// QUESTION:` w kodzie,
nie zgaduj i nie implementuj coś co może być źle.
