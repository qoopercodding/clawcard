// =============================================================================
// game.js — Nawigacja, ekrany, run loop
// =============================================================================
//
// ODPOWIADA ZA:
//   - Budowanie DOM aplikacji (buildDOM)
//   - Nawigację między ekranami (mapa, walka, card view, edytor)
//   - Stan aktualnego runu (węzeł, talia, mapa)
//   - Wejście do węzłów mapy (bitwa, nagroda)
//   - Ładowanie kart customowych z localStorage do CARDS
//
// NIE ODPOWIADA ZA:
//   - Logikę walki (→ battle.js)
//   - Renderowanie kart (→ ui.js)
//   - Definicje kart (→ cards.js)
//   - Edytor kart (→ card-editor.js)
//
// GLOBALNE EKSPORTY:
//   Game — główny obiekt gry
//
// PUNKT WEJŚCIA: Game.init() wywołany na dole tego pliku
//
// =============================================================================

const Game = {

  // ---------------------------------------------------------------------------
  // run — stan aktualnego runu
  // ---------------------------------------------------------------------------
  // run.deck  — tablica ID kart w aktualnej talii gracza (modyfikowana przez nagrody)
  // run.node  — index aktualnie aktywnego węzła (0 = start)
  // run.nodes — definicja mapy: kolejne węzły z type, label, icon
  //
  // Typy węzłów:
  //   'battle' — walka ze standardowymi wrogami
  //   'boss'   — walka z bossem (trudniejsza)
  //   'prize'  — nagroda (UI.showReward())
  //
  // ŻEBY ZMIENIĆ MAPĘ: edytuj run.nodes
  run: {
    deck: [...STARTER_DECK],
    node: 0,
    nodes: [
      { type:'battle', label:'Battle', icon:'⚔️' },
      { type:'prize',  label:'Prize',  icon:'⭐' },
      { type:'battle', label:'Battle', icon:'⚔️' },
      { type:'boss',   label:'BOSS',   icon:'💀' },
    ],
  },

  // ---------------------------------------------------------------------------
  // init()
  // ---------------------------------------------------------------------------
  // Punkt startowy — wywoływany automatycznie na końcu tego pliku.
  // Ładuje karty customowe → buduje DOM → pokazuje mapę.
  init() {
    this._loadCustomCards();
    this.buildDOM();
    this.showMap();
  },

  // ---------------------------------------------------------------------------
  // _loadCustomCards()
  // ---------------------------------------------------------------------------
  // Wczytuje karty zapisane przez Card Editor z localStorage['ced_library']
  // i dokłada je do globalnego CARDS.
  // Wywoływana przy init() — musi być przed buildDOM() żeby karty były dostępne.
  //
  // Format localStorage: JSON obiekt { id: { ...draft } }
  // Jeśli klucz już istnieje w CARDS — zostanie nadpisany (customowa karta wygrywa).
  _loadCustomCards() {
    try {
      const stored = JSON.parse(localStorage.getItem('ced_library') || '{}');
      Object.entries(stored).forEach(([id, def]) => {
        CARDS[id] = def;
      });
      const count = Object.keys(stored).length;
      if (count) console.log(`[Cards] Załadowano ${count} kart z biblioteki`);
    } catch(e) {
      console.warn('[Cards] Błąd ładowania biblioteki:', e);
    }
  },

  // ---------------------------------------------------------------------------
  // buildDOM()
  // ---------------------------------------------------------------------------
  // Wstrzykuje cały HTML aplikacji do #app.
  // Wywoływana raz przy init().
  //
  // Ekrany (div.screen):
  //   #screen-map      — mapa runu
  //   #screen-cardview — podgląd talii przed bitwą
  //   #screen-battle   — arena walki
  //   #screen-editor   — card editor (iframe-like w SPA)
  //
  // Modalne (poza .screen):
  //   #pile-modal      — podgląd deck/discard (UI.showPileModal)
  //   #reward-overlay  — wybór nagrody (UI.showReward)
  buildDOM() {
    document.getElementById('app').innerHTML = `
      <div id="screen-map" class="screen">
        <h1 class="map-title">❄️ WILDFROST</h1>
        <div id="map-path" class="map-path"></div>
        <p class="map-hint">Kliknij świecący węzeł</p>
        <button class="map-editor-btn" onclick="Game.showEditor()">🎨 Card Editor</button>
      </div>

      <!-- Card View — podgląd talii i companions przed bitwą -->
      <div id="screen-cardview" class="screen" style="display:none;">
        <div class="cv-header">
          <h2 class="cv-title">📋 Twoja talia</h2>
          <div class="cv-subtitle" id="cv-subtitle"></div>
        </div>
        <div id="cv-cards" class="cv-cards"></div>
        <div class="cv-footer">
          <button class="cv-btn cv-btn-fight" onclick="Game._confirmBattle()">⚔️ Do walki!</button>
          <button class="cv-btn cv-btn-back"  onclick="Game.showMap()">← Wróć</button>
        </div>
      </div>

      <div id="screen-battle" class="screen" style="display:none;">
        <div class="battle-top">
          <span id="battle-title" class="btitle">BATTLE</span>
          <span class="battle-hint">Przeciągnij kartę z ręki na pole</span>
        </div>
        <div class="battle-arena">
          <div class="grid-wrap">
            <div class="grid-label">Twoje pole</div>
            <div id="player-grid" class="board-grid"></div>
          </div>
          <div class="vs-col">VS</div>
          <div class="grid-wrap">
            <div class="grid-label">Pole wroga</div>
            <div id="enemy-grid" class="board-grid"></div>
          </div>
        </div>
        <div id="hand" class="hand-area"></div>
        <div id="battle-log" class="battle-log"></div>
        <button id="redraw-btn" class="redraw-bell" onclick="redraw()"></button>
        <div id="deck-info" class="deck-info"></div>
      </div>

      <!-- Card Editor — pełnoekranowe narzędzie -->
      <div id="screen-editor" class="screen" style="display:none;">
        <div class="ced-header">
          <button class="ced-back-btn" onclick="Game.showMap()">← Mapa</button>
          <h2>🎨 Card Editor</h2>
        </div>
        <div class="ced-tabs">
          <button class="ced-tab active" data-tab="editor" onclick="CardEditor.switchTab('editor')">✏️ Edytor kart</button>
          <button class="ced-tab" data-tab="mapper" onclick="CardEditor.switchTab('mapper')">🗺 Frame Mapper</button>
        </div>
        <div id="ced-panel-editor" style="display:flex;"></div>
        <div id="ced-panel-mapper" style="display:none;"></div>
      </div>

      <!-- Modal podglądu stosu kart -->
      <div id="pile-modal" class="pile-modal" style="display:none;" onclick="if(event.target===this)UI.closePileModal()">
        <div id="pile-modal-content" class="pile-modal-inner"></div>
      </div>

      <!-- Reward overlay — wybór nagrody po walce -->
      <div id="reward-overlay" class="reward-overlay" style="display:none;">
        <h2 class="reward-title">⭐ Wybierz kartę nagrody</h2>
        <div id="reward-cards" class="reward-cards"></div>
      </div>
    `;
  },

  // ---------------------------------------------------------------------------
  // showScreen(id)
  // ---------------------------------------------------------------------------
  // Ukrywa wszystkie .screen, pokazuje tylko #id.
  // Wszystkie przełączenia ekranów MUSZĄ iść przez tę funkcję.
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
  },

  // ---------------------------------------------------------------------------
  // showMap()
  // ---------------------------------------------------------------------------
  // Renderuje mapę runu do #map-path i pokazuje #screen-map.
  // Węzły: done (przeszłe) / available (aktualny, klikalny) / locked (przyszłe).
  // Kliknięcie dostępnego węzła → enterNode(i).
  showMap() {
    this.showScreen('screen-map');
    const path = document.getElementById('map-path');
    path.innerHTML = '';
    this.run.nodes.forEach((n, i) => {
      if (i > 0) {
        const c = document.createElement('div');
        c.className = 'map-connector' + (i < this.run.node ? ' done' : '');
        path.appendChild(c);
      }
      const el = document.createElement('div');
      const done = i < this.run.node, avail = i === this.run.node;
      el.className = 'map-node' + (done ? ' done' : avail ? ' available' : '');
      el.innerHTML = `<div class="node-icon">${n.icon}</div><div class="node-label">${n.label}</div>`;
      if (avail) el.addEventListener('click', () => this.enterNode(i));
      path.appendChild(el);
    });
  },

  // ---------------------------------------------------------------------------
  // showEditor()
  // ---------------------------------------------------------------------------
  // Przechodzi do ekranu edytora kart i inicjalizuje CardEditor.
  showEditor() {
    this.showScreen('screen-editor');
    CardEditor.init();
  },

  // ---------------------------------------------------------------------------
  // showCardView(isBoss)
  // ---------------------------------------------------------------------------
  // Pokazuje ekran podglądu talii (#screen-cardview) przed bitwą.
  // Wyświetla:
  //   - sekcję Companions: wszystkie karty z CARDS gdzie type==='companion'
  //   - sekcję Talia: karty z run.deck z badge ×N dla duplikatów
  //
  // Parametry:
  //   isBoss — przekazywane do _confirmBattle przez _pendingBattleIsBoss
  //
  // Przepływ: enterNode → showCardView → [gracz klika "Do walki!"] → _confirmBattle → _startBattleNow
  _pendingBattleIsBoss: false,

  showCardView(isBoss) {
    this._pendingBattleIsBoss = isBoss;
    this.showScreen('screen-cardview');

    const subtitle = document.getElementById('cv-subtitle');
    subtitle.textContent = `${this.run.deck.length} kart • ${isBoss ? '💀 BOSS' : `⚔️ Walka ${this.run.node + 1}`}`;

    const container = document.getElementById('cv-cards');
    container.innerHTML = '';

    // Sekcja companions
    const allCompanions = Object.values(CARDS).filter(c => c.type === 'companion');
    if (allCompanions.length) {
      const section = document.createElement('div');
      section.className = 'cv-section';
      section.innerHTML = '<div class="cv-section-title">🧝 Companions</div>';
      const row = document.createElement('div');
      row.className = 'cv-row';
      allCompanions.forEach(def => {
        const card = UI.makeHandCard(def.id);
        if (card) {
          card.draggable = false;
          card.style.cursor = 'default';
          row.appendChild(card);
        }
      });
      section.appendChild(row);
      container.appendChild(section);
    }

    // Sekcja talii (itemy z run.deck, zgrupowane z ×N badge)
    const counts = {};
    this.run.deck.forEach(id => { counts[id] = (counts[id]||0)+1; });
    const deckSection = document.createElement('div');
    deckSection.className = 'cv-section';
    deckSection.innerHTML = '<div class="cv-section-title">🃏 Talia</div>';
    const deckRow = document.createElement('div');
    deckRow.className = 'cv-row';
    Object.entries(counts).forEach(([id, n]) => {
      const card = UI.makeHandCard(id);
      if (!card) return;
      card.draggable = false;
      card.style.cursor = 'default';
      if (n > 1) {
        const badge = document.createElement('div');
        badge.className = 'cv-count-badge';
        badge.textContent = `×${n}`;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;display:inline-block;';
        wrap.appendChild(card);
        wrap.appendChild(badge);
        deckRow.appendChild(wrap);
      } else {
        deckRow.appendChild(card);
      }
    });
    deckSection.appendChild(deckRow);
    container.appendChild(deckSection);
  },

  // ---------------------------------------------------------------------------
  // _confirmBattle()
  // ---------------------------------------------------------------------------
  // Wywoływana przez przycisk "Do walki!" na ekranie card view.
  // Deleguje do _startBattleNow z zapamiętanym typem walki.
  _confirmBattle() {
    this._startBattleNow(this._pendingBattleIsBoss);
  },

  // ---------------------------------------------------------------------------
  // enterNode(i)
  // ---------------------------------------------------------------------------
  // Obsługuje wejście do węzła mapy o indexie i.
  // battle/boss → showCardView (podgląd talii przed bitwą)
  // prize       → UI.showReward (bezpośrednio)
  enterNode(i) {
    const n = this.run.nodes[i];
    if (n.type === 'battle' || n.type === 'boss') this.showCardView(n.type === 'boss');
    else if (n.type === 'prize') UI.showReward();
  },

  // ---------------------------------------------------------------------------
  // _startBattleNow(isBoss)
  // ---------------------------------------------------------------------------
  // Inicjalizuje i uruchamia walkę.
  // Resetuje log, wywołuje battleSetup(isBoss), pokazuje #screen-battle, renderuje UI.
  _startBattleNow(isBoss) {
    clearBattleLog();
    battleSetup(isBoss);
    document.getElementById('battle-title').textContent =
      isBoss ? '💀 BOSS' : `⚔️ Walka ${this.run.node + 1}`;
    this.showScreen('screen-battle');
    UI.render();
  },

  // ---------------------------------------------------------------------------
  // advanceMap()
  // ---------------------------------------------------------------------------
  // Przesuwa run.node o 1 i przechodzi do następnego węzła.
  // Jeśli koniec mapy → alert o wygranej.
  // Wywoływana przez: UI.showReward() po wyborze nagrody
  advanceMap() {
    this.run.node++;
    if (this.run.node >= this.run.nodes.length) { alert('🏆 Run ukończony!'); return; }
    const next = this.run.nodes[this.run.node];
    if (next.type === 'prize') UI.showReward();
    else this.showMap();
  },

  // ---------------------------------------------------------------------------
  // battleWon()
  // ---------------------------------------------------------------------------
  // Wywoływana przez battle.js checkWinLose() po pokonaniu wszystkich wrogów.
  // Przesuwa węzeł i przechodzi do nagrody lub mapy.
  battleWon() {
    this.run.node++;
    if (this.run.node >= this.run.nodes.length) { alert('🏆 Run ukończony!'); return; }
    const next = this.run.nodes[this.run.node];
    if (next.type === 'prize') UI.showReward();
    else this.showMap();
  },

  // startBattle — alias dla kompatybilności, używaj _startBattleNow
  startBattle(isBoss) {
    this._startBattleNow(isBoss);
  },
};

// =============================================================================
// PUNKT WEJŚCIA
// =============================================================================
// Uruchom grę po załadowaniu skryptu.
Game.init();
