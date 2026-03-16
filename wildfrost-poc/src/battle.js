// =============================================================================
// battle.js — Logika walki
// =============================================================================
//
// ODPOWIADA ZA:
//   - Stan walki (siatki kart, ręka, deck, discard)
//   - Setup walki (rozmieszczenie wrogów, rozdanie kart)
//   - Granie kart (playCard, applyItem)
//   - Zadawanie obrażeń (dealDamage), śmierć, kompaktowanie siatki
//   - Liczniki i triggery ataków
//   - Sprawdzanie warunków wygranej/przegranej
//   - Log walki
//   - Redraw (przetasowanie ręki)
//
// NIE ODPOWIADA ZA:
//   - Renderowanie (→ ui.js — wywołuje UI.render() po każdej zmianie)
//   - Nawigację po mapie (→ game.js — wywołuje Game.battleWon())
//   - Definicje kart (→ cards.js)
//
// GLOBALNE EKSPORTY:
//   Battle          — obiekt stanu walki
//   battleSetup()   — inicjalizuje walkę
//   battleDraw()    — dobiera karty
//   redraw()        — przetasowuje rękę
//   playCard()      — zagrywa kartę z ręki
//   checkCounters() — sprawdza/decrementuje liczniki, triggeruje ataki
//   dealDamage()    — zadaje obrażenia, obsługuje śmierć
//   addBattleLog()  — dodaje wpis do logu
//   getBattleLog()  — zwraca log
//   clearBattleLog()
//
// UŻYWA: CARDS (cards.js), UI (ui.js), Game (game.js), Anim (anim.js)
//
// =============================================================================

// =============================================================================
// Battle — obiekt stanu walki
// =============================================================================
//
// playerCells[0..5] — siatka gracza (6 miejsc), każde null lub instancja karty
// enemyCells[0..5]  — siatka wroga (6 miejsc), każde null lub instancja karty
//
// INSTANCJA KARTY (tworzona przez makeCard() lub mkE()):
// {
//   ...pola z CARDS[id],     — skopiowane ze statycznej definicji
//   hp:         number,      — aktualne HP (zmienia się w walce)
//   maxHp:      number,      — maksymalne HP (do paska HP)
//   counter:    number,      — aktualna wartość licznika (odlicza do 0)
//   maxCounter: number,      — maksymalna wartość (reset po triggerze)
//   snow:       number,      — stack zamrożenia (0 = nie zamrożony)
//   shield:     number,      — punkty tarczy (absorbuje dmg)
//   instanceId: string,      — unikalne ID instancji (Math.random)
// }
//
// hand    — tablica ID kart w ręce (stringi, klucze CARDS)
// deck    — tablica ID kart w talii (stringi)
// discard — tablica ID kart na stosie odrzutów (stringi)
//
// redrawBell    — ile razy można jeszcze użyć redrawa
// redrawBellMax — maksymalna liczba redrawów (4)
// redrawCharged — true gdy bell=0, następny redraw jest darmowy
// active        — false gdy walka zakończona (blokuje dalsze akcje)
const Battle = {
  playerCells: Array(6).fill(null),
  enemyCells:  Array(6).fill(null),
  leader: null,   // referencja do instancji lidera (namandi) w playerCells[2]
  hand: [], deck: [], discard: [],
  active: false,
  redrawBell: 4, redrawBellMax: 4, redrawCharged: false,
  _hadTriggers: false,  // wewnętrzne — czy w tej turze był jakiś trigger
};

// -----------------------------------------------------------------------------
// makeCard(defId)
// -----------------------------------------------------------------------------
// Tworzy instancję karty gracza z definicji statycznej.
// Kopiuje wszystkie pola z CARDS[defId], dodaje pola runtime (hp, counter, snow itd.)
//
// Parametry:
//   defId — klucz w CARDS (np. 'berry_sis')
//
// Zwraca: obiekt instancji karty lub null jeśli ID nie istnieje
function makeCard(defId) {
  const def = CARDS[defId];
  if (!def) return null;
  return { ...def, hp:def.hp??null, maxHp:def.hp??null,
    counter:def.counter??0, maxCounter:def.counter??0,
    snow:0, shield:0, instanceId:Math.random().toString(36).slice(2) };
}

// -----------------------------------------------------------------------------
// mkE(name, filename, atk, hp, counter)
// -----------------------------------------------------------------------------
// Tworzy instancję karty wroga (skrót dla enemies, nie wchodzą do CARDS).
// Obrazek pobierany z IMG_BASE (wildfrost_data/images/).
//
// Parametry:
//   name     — wyświetlana nazwa
//   filename — nazwa pliku PNG w wildfrost_data/images/
//   atk, hp, counter — statystyki startowe
//
// Zwraca: obiekt instancji karty wroga
function mkE(name, filename, atk, hp, counter) {
  const base = window.IMG_BASE || '../wildfrost_data/images/';
  return { name, img: base+filename, icon:'👹',
    atk, hp, maxHp:hp, counter, maxCounter:counter,
    snow:0, shield:0, instanceId:Math.random().toString(36).slice(2) };
}

// -----------------------------------------------------------------------------
// battleSetup(isBoss)
// -----------------------------------------------------------------------------
// Inicjalizuje pełny stan walki przed bitwą.
// Resetuje siatki, rozmieszcza lidera, wroga i tasuje deck.
//
// Parametry:
//   isBoss — boolean: true = walka z bossem (trudniejszy setup)
//
// Efekty:
//   - Battle.playerCells[2] = instancja namandi (leader)
//   - Battle.enemyCells = set wrogów zależny od isBoss i Game.run.node
//   - Battle.deck = przetasowana kopia Game.run.deck
//   - Battle.hand = 5 kart dobrane z decku
//
// ŻEBY ZMIENIĆ LIDERA: edytuj CARDS['namandi'] w cards.js
//   lub zmień 'namandi' poniżej na inny ID i playerCells[2] na inny index.
// ŻEBY ZMIENIĆ WROGÓW: edytuj bloki if/else poniżej.
function battleSetup(isBoss) {
  Battle.playerCells   = Array(6).fill(null);
  Battle.enemyCells    = Array(6).fill(null);
  Battle.active        = true;
  Battle.redrawBell    = Battle.redrawBellMax;
  Battle.redrawCharged = false;
  Battle._hadTriggers  = false;

  // Leader — zawsze na środku (index 2)
  const namandiDef = CARDS['namandi'];
  Battle.leader = {
    ...namandiDef,
    img: namandiDef.img,
    hp: namandiDef.hp, maxHp: namandiDef.hp,
    counter: namandiDef.counter, maxCounter: namandiDef.counter,
    snow: 0, shield: 0, instanceId: 'leader',
  };
  Battle.playerCells[2] = Battle.leader;

  // Wrogowie — zależni od etapu i typu walki
  if (isBoss) {
    Battle.enemyCells[0] = mkE('Dregg',  'Dregg.png',  4, 20, 4);
    Battle.enemyCells[3] = mkE('Wallop', 'Wallop.png', 3, 12, 3);
  } else if (Game.run.node === 0) {
    Battle.enemyCells[0] = mkE('Snoof',   'Snoof.png',   1, 5, 3);
    Battle.enemyCells[1] = mkE('Wallop',  'Wallop.png',  2, 8, 4);
    Battle.enemyCells[3] = mkE('Sneezle', 'Sneezle.png', 1, 4, 2);
  } else {
    Battle.enemyCells[0] = mkE('Tusk',    'Tusk.png',    2, 8, 4);
    Battle.enemyCells[1] = mkE('Foxee',   'Foxee.png',   1, 5, 2);
    Battle.enemyCells[3] = mkE('Sneezle', 'Sneezle.png', 2, 6, 3);
    Battle.enemyCells[4] = mkE('Snoof',   'Snoof.png',   1, 5, 3);
  }

  // Deck i ręka
  Battle.deck = shuffle([...Game.run.deck]);
  Battle.hand = []; Battle.discard = [];
  battleDraw(5);
}

// =============================================================================
// ZARZĄDZANIE TALIĄ
// =============================================================================

// battleDraw(n) — dobiera n kart z deck do hand.
// Gdy deck pusty: przetasowuje discard → deck.
function battleDraw(n) {
  for (let i = 0; i < n; i++) {
    if (!Battle.deck.length) {
      Battle.deck = shuffle([...Battle.discard]);
      Battle.discard = [];
    }
    if (Battle.deck.length) Battle.hand.push(Battle.deck.shift());
  }
}

// redraw() — przetasowuje rękę do discard i dobiera 5 nowych.
// Kosztuje 1 ładunek z redrawBell (max 4).
// Gdy bell=0, ładuje redrawCharged=true — następny redraw darmowy.
function redraw() {
  if (!Battle.active) return;
  if (Battle.redrawCharged) {
    Battle.discard.push(...Battle.hand);
    Battle.hand = [];
    battleDraw(5);
    Battle.redrawCharged = false;
    UI.render();
    return;
  }
  if (Battle.redrawBell <= 0) return;
  Battle.redrawBell--;
  Battle.discard.push(...Battle.hand);
  Battle.hand = [];
  battleDraw(5);
  if (Battle.redrawBell === 0) Battle.redrawCharged = true;
  UI.render();
}

// =============================================================================
// GRANIE KART
// =============================================================================

// playCard(cardId, cellIdx, side)
// -----------------------------------------------------------------------------
// Główna funkcja zagrywania karty z ręki.
// Usuwa kartę z Battle.hand, dodaje do Battle.discard, wykonuje efekt.
//
// Parametry:
//   cardId  — ID karty (klucz w CARDS), musi być w Battle.hand
//   cellIdx — index komórki (0-5) w siatce docelowej
//   side    — 'player' lub 'enemy' — siatka docelowa
//
// Companion → tworzony jako instancja i wstawiany do playerCells[cellIdx]
// Item/consumable → applyItem() wykonuje efekt
//
// Po zagraniu: checkCounters() + UI.render()
function playCard(cardId, cellIdx, side) {
  const def = CARDS[cardId];
  if (!def) return;

  // Usuń pierwsze wystąpienie cardId z hand (obsługa duplikatów)
  Battle.hand = Battle.hand.filter(id => {
    if (id === cardId) { cardId = null; return false; }
    return true;
  });
  Battle.discard.push(def.id || cardId);

  if (def.type === 'companion') {
    const card = makeCard(def.id);
    Battle.playerCells[cellIdx] = card;
    addBattleLog(`${def.name} zagrana na pole ${cellIdx}.`, 'play');
  } else if (def.type === 'item' || def.type === 'consumable') {
    applyItem(def, cellIdx, side);
  }

  checkCounters();
  UI.render();
}

// applyItem(def, cellIdx, side)
// -----------------------------------------------------------------------------
// Wykonuje efekt itemu na konkretnej komórce.
//
// Parametry:
//   def     — statyczna definicja karty z CARDS (nie instancja)
//   cellIdx — index docelowej komórki
//   side    — siatka: 'enemy' lub 'player'
//
// Efekty zależne od pól def:
//   def.target === 'enemy':
//     def.splash = true  → atakuje WSZYSTKIE żywe komórki wroga
//     def.atk           → dealDamage(target, def.atk)
//     def.snow          → applySnow(target, def.snow)
//   def.target === 'ally':
//     def.heal          → leczy sojusznika w playerCells[cellIdx]
function applyItem(def, cellIdx, side) {
  if (def.target === 'enemy') {
    if (def.splash) {
      Battle.enemyCells.forEach((c, i) => {
        if (c) dealDamage(c, def.atk || 0, 'enemy', i);
      });
      addBattleLog(`${def.name} uderza cały rząd!`, 'atk');
    } else {
      const target = Battle.enemyCells[cellIdx];
      if (target) {
        if (def.atk)  dealDamage(target, def.atk, 'enemy', cellIdx);
        if (def.snow) applySnow(target, def.snow);
        addBattleLog(`${def.name} → ${target.name}`, 'atk');
      }
    }
  } else if (def.target === 'ally') {
    const target = Battle.playerCells[cellIdx];
    if (target) {
      if (def.heal) {
        const healed = Math.min(def.heal, target.maxHp - target.hp);
        target.hp += healed;
        addBattleLog(`${def.name} leczy ${target.name} +${healed} HP`, 'heal');
      }
    }
  }
}

// =============================================================================
// WALKA — OBRAŻENIA I EFEKTY
// =============================================================================

// dealDamage(card, dmg, side, idx)
// -----------------------------------------------------------------------------
// Zadaje obrażenia instancji karty. Obsługuje tarczę i Snow.
//
// Parametry:
//   card — instancja karty (z Battle.playerCells lub enemyCells)
//   dmg  — liczba obrażeń (przed tarczą)
//   side — 'player' lub 'enemy' — siatka karty
//   idx  — index w siatce (do animacji i usunięcia)
//
// Kolejność: shield → snow (blokuje dmg) → hp -= actual
// Śmierć (hp <= 0): animacja, timeout 400ms → usunięcie z siatki → compactFront
function dealDamage(card, dmg, side, idx) {
  if (!card) return;
  let actual = dmg;
  if (card.shield > 0) {
    const absorbed = Math.min(card.shield, actual);
    card.shield -= absorbed;
    actual -= absorbed;
  }
  if (card.snow > 0) actual = 0;  // zamrożona karta nie bierze dmg
  card.hp -= actual;
  Anim.hit(side, idx);
  if (card.hp <= 0) {
    card.hp = 0;
    Anim.death(side, idx);
    setTimeout(() => {
      if (side === 'enemy') Battle.enemyCells[idx] = null;
      else Battle.playerCells[idx] = null;
      compactFront('enemy');
      compactFront('player');
      checkWinLose();
      UI.render();
    }, 400);
  }
}

// applySnow(card, amount)
// Dodaje `amount` stacków Snow do karty. Snow blokuje dmg i zużywa counter.
function applySnow(card, amount) {
  card.snow = (card.snow || 0) + amount;
  addBattleLog(`${card.name} dostaje ${amount} Snow (łącznie: ${card.snow})`, 'snow');
}

// compactFront(side)
// Przesuwa żywe karty na początku siatki (idx 0, 1, 2...).
// Wywoływana po śmierci karty żeby wypełnić luki.
function compactFront(side) {
  const cells = side === 'player' ? Battle.playerCells : Battle.enemyCells;
  const cards = cells.filter(Boolean);
  cells.fill(null);
  cards.forEach((c, i) => cells[i] = c);
}

// findTarget(attackerSide)
// Zwraca pierwszą żywą kartę po stronie PRZECIWNEJ do attackerSide.
// Używane przez triggerCard do wyboru celu ataku.
function findTarget(attackerSide) {
  const targets = attackerSide === 'player' ? Battle.enemyCells : Battle.playerCells;
  return targets.find(Boolean) || null;
}

// =============================================================================
// LICZNIKI I TRIGGERY
// =============================================================================

// checkCounters()
// -----------------------------------------------------------------------------
// Wywoływana po każdym zagraniu karty.
// Iteruje po WSZYSTKICH kartach (player + enemy), dekrementuje counter.
// Jeśli counter <= 0: reset do maxCounter + triggerCard().
// Wyjątek: zamrożona karta (snow > 0) — dekrementuje snow zamiast counter, reset counter.
//
// UWAGA: efekty triggerCard są async (setTimeout 200ms + 150ms opóźnienie po trigger)
function checkCounters() {
  let anyTrigger = false;

  [...Battle.playerCells, ...Battle.enemyCells].forEach((card, absIdx) => {
    if (!card) return;
    const side = absIdx < 6 ? 'player' : 'enemy';
    const idx  = absIdx < 6 ? absIdx : absIdx - 6;

    if (card.snow > 0) {
      card.snow--;          // zamrożona: zużyj 1 snow stack
      card.counter = card.maxCounter;  // resetuj counter bez triggerowania
      return;
    }

    card.counter--;
    if (card.counter <= 0) {
      card.counter = card.maxCounter;
      triggerCard(card, side, idx);
      anyTrigger = true;
    }
  });

  if (anyTrigger) {
    Battle._hadTriggers = true;
    setTimeout(() => { checkWinLose(); UI.render(); }, 150);
  }
}

// triggerCard(card, side, idx)
// -----------------------------------------------------------------------------
// Wykonuje efekt triggera karty (standardowo: atak na pierwszy cel).
// Atak jest async: animacja 0ms → dealDamage po 200ms.
//
// Parametry:
//   card — instancja karty która triggeruje
//   side — 'player' lub 'enemy' (strona atakującego)
//   idx  — index w siatce (do animacji)
//
// TODO: rozszerzyć o specjalne efekty (Foxee frenzy, Snoof snow, itp.)
function triggerCard(card, side, idx) {
  if (side === 'player') {
    const target = findTarget('player');
    if (target) {
      const tIdx = Battle.enemyCells.indexOf(target);
      Anim.attackCharge(side, idx);
      addBattleLog(`${card.name} atakuje ${target.name} za ${card.atk} dmg`, 'atk');
      setTimeout(() => dealDamage(target, card.atk || 0, 'enemy', tIdx), 200);
    }
  } else {
    const target = findTarget('enemy');
    if (target) {
      const tIdx = Battle.playerCells.indexOf(target);
      Anim.attackCharge(side, idx);
      addBattleLog(`${card.name} atakuje ${target.name} za ${card.atk} dmg`, 'enemy-atk');
      setTimeout(() => dealDamage(target, card.atk || 0, 'player', tIdx), 200);
    }
  }
}

// =============================================================================
// WARUNKI WYGRANEJ / PRZEGRANEJ
// =============================================================================

// checkWinLose()
// Sprawdza czy walka się skończyła po śmierci karty.
// Wygrana: brak żywych wrogów → Battle.active=false → Game.battleWon() po 800ms
// Przegrana: brak żywych graczy → reload po 800ms
function checkWinLose() {
  const playerAlive = Battle.playerCells.some(Boolean);
  const enemyAlive  = Battle.enemyCells.some(Boolean);

  if (!enemyAlive && Battle.active) {
    Battle.active = false;
    addBattleLog('🏆 Zwycięstwo!', 'win');
    setTimeout(() => Game.battleWon(), 800);
    return;
  }
  if (!playerAlive && Battle.active) {
    Battle.active = false;
    addBattleLog('💀 Przegrana...', 'lose');
    setTimeout(() => { alert('Przegrana! Odświeżam...'); location.reload(); }, 800);
  }
}

// =============================================================================
// LOG WALKI
// =============================================================================
// Prosty bufor wiadomości tekstowych wyświetlany przez UI.renderLog().
// Typ wpisu wpływa na kolor CSS (.log-atk, .log-heal, .log-win, itp.)
let _battleLog = [];
function addBattleLog(msg, type='info') { _battleLog.push({ msg, type }); }
function getBattleLog() { return _battleLog; }
function clearBattleLog() { _battleLog = []; }
