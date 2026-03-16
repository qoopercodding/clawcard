// =============================================================================
// cards.js — Definicje kart i talie
// =============================================================================
//
// ODPOWIADA ZA:
//   - Definicje wszystkich kart w grze (CARDS)
//   - Starter deck (STARTER_DECK)
//   - Pulę nagród (REWARD_POOL)
//   - Helpery do ścieżek obrazków
//
// NIE ODPOWIADA ZA:
//   - Logikę walki (→ battle.js)
//   - Renderowanie (→ ui.js)
//   - Karty tworzone przez gracza w edytorze (→ card-editor.js + localStorage)
//
// GLOBALNE EKSPORTY:
//   CARDS         — obiekt { id: definicja_karty }
//   STARTER_DECK  — tablica ID kart startowej talii
//   REWARD_POOL   — tablica ID kart dostępnych jako nagrody
//
// =============================================================================

// -----------------------------------------------------------------------------
// HELPERY ŚCIEŻEK OBRAZKÓW
// -----------------------------------------------------------------------------

// img(filename) — dla kart z zestawu Wildfrost (serwowanych z wildfrost_data/images/)
// Nie używaj dla kart customowych — używa IMG_BASE który może wychodzić poza root LS.
// window.IMG_BASE można ustawić żeby zmienić bazę bez edycji kodu.
function img(filename) {
  return (window.IMG_BASE || '../wildfrost_data/images/') + filename;
}

// cardImg(filename) — dla kart customowych z card editora
// Pliki muszą leżeć w wildfrost-poc/assets/cards/ (wewnątrz root Live Server).
// To jest poprawna ścieżka dla kart wgrywanych przez gracza.
function cardImg(filename) {
  return 'assets/cards/' + filename;
}

// =============================================================================
// CARDS — słownik wszystkich kart
// =============================================================================
//
// Klucz: unikalne snake_case ID karty (np. 'berry_sis', 'sword')
//
// Schemat obiektu karty — COMPANION:
// {
//   id:      string,   — musi być identyczny z kluczem w CARDS
//   name:    string,   — nazwa wyświetlana w UI
//   type:    'companion',
//   tribe:   string,   — 'shelly' | 'clunk' | 'snowdwell' | 'none'
//   img:     string|null, — URL obrazka (może być getter); null = użyj icon
//   icon:    string,   — emoji fallback gdy brak img
//   hp:      number,   — punkty życia startowe (= maxHp)
//   atk:     number,   — obrażenia per trigger
//   counter: number,   — tury do triggera (= maxCounter)
//   desc:    string,   — opis efektu (wyświetlany w ręce)
// }
//
// Schemat obiektu karty — ITEM:
// {
//   id, name, type: 'item', img, icon,
//   atk?:    number,  — obrażenia (jeśli karta atakuje)
//   snow?:   number,  — aplikuje Snow (zamrożenie) na cel
//   heal?:   number,  — leczy sojusznika o tę wartość
//   target:  'enemy' | 'ally',   — domyślny cel
//   splash?: boolean, — true = uderza cały rząd wroga
//   desc:    string,
// }
//
// UWAGA: Karty z card editora są dokładane do CARDS runtime przez:
//   Game._loadCustomCards() — przy starcie (z localStorage)
//   CardEditor.saveToLibrary() — po zapisie w edytorze
//
const CARDS = {

  // ── COMPANIONS ─────────────────────────────────────────────────────────────

  // Leader — stały member zespołu, zawsze na planszy w Battle.playerCells[2]
  // Obrazek z assets/cards/namandi.jpg (skopiowany do root LS)
  namandi: {
    id:'namandi', name:'Namandi Shellandi', type:'companion',
    tribe:'shelly',
    get img(){ return cardImg('namandi.jpg'); },
    hp:11, atk:1, counter:1,
    desc:'Namandi na stacji paliw bywaldi',
  },

  berry_sis: {
    id:'berry_sis', name:'Berry Sis', type:'companion',
    get img(){ return img('Berry_Sis.png'); },
    hp:8, atk:2, counter:3,
    desc:'When hit, add lost HP to a random ally.'
  },

  foxee: {
    id:'foxee', name:'Foxee', type:'companion',
    get img(){ return img('Foxee.png'); },
    hp:4, atk:1, counter:3,
    desc:'x3 Frenzy — attacks 3 times per trigger.'
  },

  wallop: {
    id:'wallop', name:'Wallop', type:'companion',
    get img(){ return img('Wallop.png'); },
    hp:9, atk:4, counter:4,
    desc:'Deal 8 bonus dmg to Snow\'d targets.'
  },

  snoof: {
    id:'snoof', name:'Snoof', type:'companion',
    get img(){ return img('Snoof.png'); },
    hp:3, atk:3, counter:3,
    desc:'Apply 1 Snow on trigger.'
  },

  sneezle: {
    id:'sneezle', name:'Sneezle', type:'companion',
    get img(){ return img('Sneezle.png'); },
    hp:6, atk:2, counter:3,
    desc:'Draw 1 card when hit.'
  },

  tusk: {
    id:'tusk', name:'Tusk', type:'companion',
    get img(){ return img('Tusk.png'); },
    hp:5, atk:2, counter:5,
    desc:'While active, add 3 Teeth to all allies.'
  },

  // ── ITEMS ──────────────────────────────────────────────────────────────────
  // Itemy nie mają HP/counter — są jednorazowe, wyrzucane po użyciu.
  // img:null + icon:emoji = brak grafiki, tylko emoji

  sword: {
    id:'sword', name:'Sword', type:'item', img:null, icon:'⚔️',
    atk:5, target:'enemy',
    desc:'5 damage to one enemy.'
  },

  snowball: {
    id:'snowball', name:'Snowball', type:'item', img:null, icon:'❄️',
    snow:2, target:'enemy',
    desc:'Apply 2 Snow to target.'
  },

  bonesaw: {
    id:'bonesaw', name:'Bonesaw', type:'item', img:null, icon:'🪚',
    atk:3, target:'enemy', splash:true,
    desc:'3 dmg to all in row.'
  },

  healberry: {
    id:'healberry', name:'Healberry', type:'item', img:null, icon:'🍓',
    heal:3, target:'ally',
    desc:'Restore 3 HP to an ally.'
  },

  berry_blade: {
    id:'berry_blade', name:'Berry Blade', type:'item',
    get img(){ return img('Berry_Blade.png'); },
    icon: null,
    atk:4, target:'enemy',
    desc:'4 dmg. Heal front ally equal to damage.'
  },
};

// =============================================================================
// STARTER_DECK
// =============================================================================
// Talia z którą gracz zaczyna run.
// Tablica ID kart — duplikaty są dozwolone (i normalne).
// Zmiana: dodaj/usuń ID żeby zmienić startową talię.
// UWAGA: wszystkie ID muszą istnieć w CARDS — sprawdza to CardEditor.runSanityTests()
const STARTER_DECK = ['sword','sword','sword','snowball','snowball','bonesaw','healberry','healberry'];

// =============================================================================
// REWARD_POOL
// =============================================================================
// Pula kart z której losowane są 3 opcje nagrody po wygranej walce.
// UI.showReward() losuje 3 bez powtórzeń (shuffle + slice(0,3)).
// UWAGA: wszystkie ID muszą istnieć w CARDS
const REWARD_POOL  = ['foxee','wallop','snoof','sneezle','tusk','berry_blade','snowball','healberry'];
