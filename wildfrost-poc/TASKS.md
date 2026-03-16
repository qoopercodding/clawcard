# ClawCard POC — Backlog tasków

> Format: każdy task ma ID, opis, kryteria akceptacji i informację co nie dotykać.
> Agent bierze jeden task naraz. Nie zaczyna następnego bez weryfikacji Marcina.

---

## Aktywny sprint: SPRINT-0 — Fundamenty

Cel: pliki infrastrukturalne gotowe, mechanics.js istnieje, każdy agent wie co robi.

---

### S0-T01 — Stwórz `src/mechanics.js`

**Kto:** Claude  
**Status:** ⏳ Do zrobienia  
**Szacunek:** 30 min

**Opis:**
Stwórz nowy plik `src/mechanics.js` z obiektem `Mechanics`.
Plik musi zawierać `Mechanics.STATUS` z trzema zaimplementowanymi statusami: `snow`, `shield`, `poison`.

Snow i shield są przepisaniem logiki z `battle.js` (usuniemy stamtąd później — na razie TYLKO przenosimy, nie ruszamy battle.js).

**Kryteria akceptacji:**
- [ ] Plik istnieje jako `src/mechanics.js`
- [ ] Nagłówek blokowy zgodny z AGENTS.md
- [ ] `Mechanics.STATUS.snow` — `onHit` zwraca 0 gdy snow>0 i dekrementuje snow, `onTurn` dekrementuje snow zamiast counter
- [ ] `Mechanics.STATUS.shield` — `onHit` absorbuje dmg do wartości shield
- [ ] `Mechanics.STATUS.poison` — `onTurn` zadaje dmg równy card.poison, stack -1 (min 0)
- [ ] `Mechanics.processDamage(card, dmg)` — centralna funkcja która woła onHit wszystkich aktywnych statusów w kolejności: shield → snow → (reszta)
- [ ] `Mechanics.tickAll(cells)` — woła onTurn dla wszystkich kart w tablicy
- [ ] Każda metoda publiczna ma JSDoc z @example
- [ ] Plik dodany do index.html PRZED battle.js

**Nie dotykaj:** `battle.js`, `cards.js`, `ui.js`

---

### S0-T02 — Dodaj nagłówek blokowy do `card-editor.js`

**Kto:** Codex  
**Status:** ⏳ Do zrobienia  
**Szacunek:** 15 min

**Opis:**
Plik `src/card-editor.js` nie ma nagłówka blokowego.
Dodaj go na początku pliku zgodnie z formatem z AGENTS.md.
NIE zmieniaj żadnej logiki — tylko dokumentacja.

**Kryteria akceptacji:**
- [ ] Blok nagłówkowy na początku pliku (wzór w AGENTS.md)
- [ ] Sekcja ODPOWIADA ZA: zawiera przynajmniej 3 punkty
- [ ] Sekcja GLOBALNE EKSPORTY: wymienia CardEditor i jego publiczne metody
- [ ] Zero zmian w logice — diff powinien zawierać tylko dodane linie komentarzy

**Nie dotykaj:** żadna logika, żadne funkcje

---

### S0-T03 — Uzupełnij JSDoc w `anim.js`

**Kto:** Codex  
**Status:** ⏳ Do zrobienia  
**Szacunek:** 20 min

**Opis:**
Funkcje w `anim.js` nie mają JSDoc z @param/@returns/@example.
Uzupełnij je dla wszystkich publicznych metod obiektu Anim.

Publiczne metody do udokumentowania:
`attackCharge`, `hit`, `death`, `placeCard`, `floatText`, `screenShake`, `bellFlash`

**Kryteria akceptacji:**
- [ ] Każda z 7 metod ma blok JSDoc
- [ ] Każdy JSDoc ma @param dla każdego parametru (z typem i opisem)
- [ ] Każdy JSDoc ma @example z konkretnym wywołaniem
- [ ] `_getCard` ma komentarz `// private` nad definicją
- [ ] Zero zmian w logice

**Nie dotykaj:** żadna logika, żadne funkcje

---

### S0-T04 — Przenieś logikę snow z `battle.js` do `mechanics.js`

**Kto:** Claude (po S0-T01)  
**Status:** 🔒 Zablokowany przez S0-T01  
**Szacunek:** 20 min

**Opis:**
Po stworzeniu mechanics.js — podmień inline logikę snow w `dealDamage()` na wywołanie `Mechanics.processDamage()`.

Obecny kod w `dealDamage()`:
```js
if (card.snow > 0) actual = 0;  // zamrożona karta nie bierze dmg
```

Docelowy kod:
```js
actual = Mechanics.processDamage(card, actual);
```

**Kryteria akceptacji:**
- [ ] `dealDamage()` woła `Mechanics.processDamage()` zamiast inline if
- [ ] Zachowanie jest identyczne (testy: karta ze snow=2 wciąż nie dostaje dmg)
- [ ] Komentarz nad wywołaniem tłumaczy co robi processDamage

**Nie dotykaj:** sygnatury dealDamage, nic innego w battle.js

---

## Sprint 1 — Core gameplay loop (po SPRINT-0)

Cel: pełna iteracja gry działa i każdy element jest opisany.

---

### S1-T01 — Specjalny trigger dla Foxee

**Kto:** Codex  
**Status:** 🔒 Po SPRINT-0  

**Opis:**
Foxee ma trigger `frenzy` — atakuje dwa razy przy triggerze.

W `cards.js` Foxee otrzymuje pole `trigger: 'frenzy'`.
W `battle.js` `triggerCard()` sprawdza `card.trigger` przed domyślnym atakiem.

**Schemat TRIGGERS:**
```js
// battle.js — słownik specjalnych triggerów
const TRIGGERS = {
  frenzy(card, side, idx) {
    _defaultAttack(card, side, idx);
    setTimeout(() => _defaultAttack(card, side, idx), 350);
  },
};

function triggerCard(card, side, idx) {
  if (card.trigger && TRIGGERS[card.trigger]) {
    TRIGGERS[card.trigger](card, side, idx);
    return;
  }
  _defaultAttack(card, side, idx);
}
```

**Kryteria akceptacji:**
- [ ] Foxee w CARDS ma `trigger: 'frenzy'`
- [ ] Foxee atakuje dwa razy (widać dwa floatText nad celem)
- [ ] Inne karty bez `trigger` działają jak wcześniej
- [ ] `_defaultAttack` jest osobną funkcją (wyciągniętą z triggerCard)
- [ ] JSDoc na `_defaultAttack` i zaktualizowany na `triggerCard`

---

### S1-T02 — Specjalny trigger dla Snoof (snow aura)

**Kto:** Codex  
**Status:** 🔒 Po S1-T01  

**Opis:**
Snoof zamiast atakować nakłada snow na pierwszego wroga.

```js
// Trigger w TRIGGERS:
snow_aura(card, side, idx) {
  const oppSide = side === 'player' ? 'enemy' : 'player';
  const target = findTarget(side);
  if (!target) return;
  const tIdx = (oppSide === 'enemy' ? Battle.enemyCells : Battle.playerCells).indexOf(target);
  Anim.attackCharge(side, idx, oppSide, tIdx);
  setTimeout(() => {
    Mechanics.STATUS.snow.apply(target, 2);
    Anim.floatText(tIdx, oppSide, '❄x2', '#67e8f9');
    Audio.snow();
    UI.render();
  }, 140);
},
```

**Kryteria akceptacji:**
- [ ] Snoof w CARDS ma `trigger: 'snow_aura'`
- [ ] Snoof nakłada snow=2 zamiast zadawać dmg
- [ ] Animacja ataku jest — karta leci w stronę celu
- [ ] FloatText pokazuje `❄x2` zamiast liczby dmg

---

### S1-T03 — Śmierć lidera = przegrana

**Kto:** Claude  
**Status:** 🔒 Po SPRINT-0  

**Opis:**
Teraz przegrana = brak WSZYSTKICH kart gracza.
Poprawne zachowanie: śmierć `Battle.leader` = natychmiastowa przegrana.

W `dealDamage()` po sprawdzeniu `card.hp <= 0`:
```js
if (card.instanceId === 'leader') {
  Battle.active = false;
  addBattleLog('💀 Lider poległ...', 'lose');
  setTimeout(() => Game.showGameOver(), 800);
  return;
}
```

`Game.showGameOver()` to nowa metoda — pokazuje overlay z "Przegrana" i przyciskiem "Nowy run".

**Kryteria akceptacji:**
- [ ] Śmierć Namandi triggeruje przegraną (nie czeka na śmierć pozostałych)
- [ ] `Game.showGameOver()` istnieje i wyświetla overlay
- [ ] Overlay ma przycisk który restartuje run (nie robi location.reload())
- [ ] Inne karty gracza mogą umrzeć bez triggerowania przegranej

---

### S1-T04 — Persystencja run.deck w localStorage

**Kto:** Codex  
**Status:** 🔒 Po SPRINT-0  

**Opis:**
Teraz reload = utrata postępów w runie.
Zapisywać `Game.run.deck` i `Game.run.node` przy każdej zmianie.
Ładować przy `Game.init()`.

**Kryteria akceptacji:**
- [ ] `Game._saveRun()` — zapisuje `{deck, node}` do `localStorage['clawcard_run']`
- [ ] `Game._loadRun()` — ładuje i waliduje (sprawdza czy wszystkie ID istnieją w CARDS)
- [ ] Wywołanie `_saveRun()` w: `battleWon()`, `advanceMap()`, po wyborze nagrody
- [ ] Wywołanie `_loadRun()` w: `init()` (przed `buildDOM`)
- [ ] Jeśli zapis jest invalid — użyj domyślnych wartości (STARTER_DECK, node 0)

---

## Zasady tego pliku

1. Nie zmieniaj statusu taska bez weryfikacji z Marcinem
2. Jeśli znajdziesz bug podczas implementacji — dodaj go poniżej w sekcji "Bugs"
3. Jeśli task okazał się niemożliwy — napisz dlaczego i zaproponuj alternatywę

---

## Bugs znalezione podczas pracy

*(puste — dodaj tutaj jeśli coś znajdziesz)*

---

## Zrobione

*(puste — taski lądują tutaj po weryfikacji)*
