// =============================================================================
// ui.js — Warstwa renderowania UI
// =============================================================================
//
// ODPOWIADA ZA:
//   - Budowanie kart jako elementy DOM (plansza, ręka gracza)
//   - Renderowanie siatki planszy (player-grid, enemy-grid)
//   - Renderowanie ręki gracza (hand)
//   - Modale (stos kart, stos odrzutów)
//   - Nagrody po wygranej walce
//   - Log walki
//
// NIE ODPOWIADA ZA:
//   - Logikę walki (→ battle.js)
//   - Dane kart (→ cards.js)
//   - Nawigację między ekranami (→ game.js)
//
// GLOBALNE STAŁE EKSPORTOWANE Z TEGO PLIKU:
//   FRAME_CONFIG  — pozycje elementów na ramkach kart (companion, item, ...)
//   CARD_W        — szerokość karty na planszy w px (110)
//   CARD_H        — wysokość karty na planszy w px (~162)
//   UI            — główny obiekt
//
// UŻYWANE PRZEZ: game.js, battle.js, card-editor.js
//
// =============================================================================

// -----------------------------------------------------------------------------
// FRAME_CONFIG
// -----------------------------------------------------------------------------
// Definiuje pozycje elementów wizualnych na ramce PNG.
// Wszystkie wartości w % względem szerokości/wysokości karty (CARD_W / CARD_H).
//
// Struktura wpisu:
//   companion: {
//     frame: 'Companion Frame.png',   ← nazwa pliku PNG ramki (root Live Server)
//     art:     { left, top, width, height },  ← prostokąt obszaru artu
//     hp:      { left, top },                 ← środek ikony HP
//     atk:     { left, top },                 ← środek ikony ATK
//     counter: { left, top },                 ← środek licznika
//     name:    { left, top },                 ← środek pola nazwy
//     desc:    { left, top },                 ← środek pola opisu (nieużywane w _makeFramedCard)
//   }
//
// ŻEBY SKALIBROWAĆ POZYCJE STATÓW:
//   Zmień wartości left/top na odpowiednim kluczu.
//   Wartości to procenty — left:50 = środek karty poziomo, top:50 = środek pionowo.
//
// ŻEBY DODAĆ NOWY TYP RAMKI (np. 'item', 'boss'):
//   1. Dodaj klucz do FRAME_CONFIG z tym samym schematem
//   2. Upewnij się że plik PNG ramki leży w root Live Server (obok index.html)
//   3. makeBoardCard() automatycznie wybierze właśwy config na podstawie card.type
//
// AKTUALNE WARTOŚCI (skalibrowane ręcznie, mogą wymagać korekty):
const FRAME_CONFIG = {
  companion: {
    frame: 'Companion Frame.png',
    art:     { left: 10,   top: 15,   width: 75,  height: 40  },
    hp:      { left: 10.3, top: 23.5 },
    atk:     { left: 89.4, top: 22.5 },
    counter: { left: 49.8, top: 93.1 },
    name:    { left: 48.7, top: 58.1 },
    desc:    { left: 48.7, top: 68.3 },
  },
  // TODO: dodać 'item', 'boss' gdy będą PNG ramek
};

// Konwertuje nazwę pliku ramki na URL (ramki leżą obok index.html w root LS)
function frameSrc(filename) {
  return filename;
}

// -----------------------------------------------------------------------------
// ROZMIAR KARTY NA PLANSZY
// -----------------------------------------------------------------------------
// Karty na planszy mają stały rozmiar w px — niezależny od kontenera.
// Proporcja 0.68 (szerokość / wysokość) jest z Wildfrost.
// Zmiana CARD_W automatycznie skaluje CARD_H i wszystkie pozycje w _makeFramedCard.
const CARD_W = 110;  // px — szerokość karty na planszy
const CARD_H = Math.round(CARD_W / 0.68);  // px — ~162px

// =============================================================================
// UI — główny obiekt renderowania
// =============================================================================
const UI = {

  // Przechowuje ID karty aktualnie przeciąganej przez gracza (drag & drop)
  dragCardId: null,

  // ---------------------------------------------------------------------------
  // render()
  // ---------------------------------------------------------------------------
  // Główna funkcja odświeżania całego UI walki.
  // Wywołuj po każdej zmianie stanu Battle (zagranie karty, tura, dmg, itp.)
  // Odświeża: siatki, rękę, dzwonek redraw, info o taliach, log.
  render() {
    this.renderGrid('player-grid', Battle.playerCells, 'player');
    this.renderGrid('enemy-grid',  Battle.enemyCells,  'enemy');
    this.renderHand();
    this.renderRedrawBell();
    this.renderDeckInfo();
    this.renderLog();
  },

  // ---------------------------------------------------------------------------
  // renderGrid(id, cells, side)
  // ---------------------------------------------------------------------------
  // Buduje siatkę planszy — 6 komórek, każda może zawierać kartę.
  //
  // Parametry:
  //   id    — ID elementu DOM (#player-grid lub #enemy-grid)
  //   cells — tablica 6 elementów z Battle.playerCells lub Battle.enemyCells
  //           każdy element to obiekt karty (instancja) lub null
  //   side  — 'player' lub 'enemy' — wpływa na CSS i logikę drag-drop
  //
  // Drag & drop: karty z ręki można upuścić na puste komórki gracza (companion)
  // lub na zajęte komórki wroga/sojusznika (item).
  renderGrid(id, cells, side) {
    const grid = document.getElementById(id);
    if (!grid) return;
    grid.innerHTML = '';
    cells.forEach((card, idx) => {
      const cell = document.createElement('div');
      cell.className = 'cell ' + (side==='player' ? 'cell-player' : 'cell-enemy');
      cell.dataset.idx = idx;
      cell.dataset.side = side;
      if (card) cell.appendChild(this.makeBoardCard(card, side));

      // Logika drag-over: podświetl komórkę gdy karta może tam trafić
      cell.addEventListener('dragover', e => {
        if (!this.dragCardId) return;
        const def = CARDS[this.dragCardId];
        if (!def) return;
        const ok =
          (def.type==='companion' && side==='player' && !card) ||
          (def.type==='item' && def.target==='enemy' && side==='enemy') ||
          (def.type==='item' && def.target==='ally'  && side==='player' && card);
        if (ok) { e.preventDefault(); cell.classList.add('drop-ok'); }
      });
      cell.addEventListener('dragleave', ()=>cell.classList.remove('drop-ok'));
      cell.addEventListener('drop', e => {
        e.preventDefault(); cell.classList.remove('drop-ok');
        if (this.dragCardId) playCard(this.dragCardId, idx, side);
        this.dragCardId = null;
      });
      grid.appendChild(cell);
    });
  },

  // ---------------------------------------------------------------------------
  // makeBoardCard(card, side)
  // ---------------------------------------------------------------------------
  // Tworzy element DOM karty na planszy.
  // Router: wybiera renderer na podstawie card.type:
  //   - typ ma wpis w FRAME_CONFIG → _makeFramedCard (z PNG ramką)
  //   - brak wpisu → _makeLegacyBoardCard (stary styl bez ramki PNG)
  //
  // Parametry:
  //   card — obiekt instancji karty z Battle.playerCells/enemyCells
  //          (ma: hp, maxHp, atk, counter, maxCounter, snow, shield, img, icon, name, type)
  //   side — 'player' lub 'enemy'
  //
  // Zwraca: HTMLElement
  makeBoardCard(card, side) {
    const cfg = FRAME_CONFIG[card.type || 'companion'];
    if (cfg) return this._makeFramedCard(card, side, cfg);
    return this._makeLegacyBoardCard(card, side);
  },

  // ---------------------------------------------------------------------------
  // _makeFramedCard(card, side, cfg)
  // ---------------------------------------------------------------------------
  // Buduje kartę z PNG ramką (nowy renderer, używany dla companion).
  //
  // Struktura warstw (od dołu do góry w DOM):
  //   1. bgEl       — białe tło 110×162px (wymagane dla mix-blend-mode:multiply)
  //   2. artEl      — div z obrazkiem lub emoji, przycinany do obszaru z cfg.art
  //   3. frameImg   — PNG ramki, mix-blend-mode:multiply (białe piksele "znikają")
  //   4. staty      — absolutnie pozycjonowane divy z HP, ATK, counter, name
  //
  // Dlaczego mix-blend-mode:multiply na frameImg:
  //   PNG ramki ma BIAŁE wypełnienie w oknie artu (nie przezroczyste).
  //   multiply: biały piksel * kolor tła = kolor tła (znika).
  //   Ciemne piksele drewnianej ramy zostają.
  //   bgEl (białe tło) zapewnia neutralny kolor bazowy pod ramką.
  //
  // Parametry:
  //   card — instancja karty (jak w makeBoardCard)
  //   side — 'player' lub 'enemy'
  //   cfg  — wpis z FRAME_CONFIG (np. FRAME_CONFIG.companion)
  //
  // Zmiana pozycji statu: edytuj cfg.hp.left / cfg.hp.top (wartości w %)
  // Zmiana rozmiaru artu: edytuj cfg.art.left/top/width/height
  _makeFramedCard(card, side, cfg) {
    const W = CARD_W;  // 110px
    const H = CARD_H;  // ~162px

    // Korzeń karty — position:relative, jawne px, overflow:visible
    const el = document.createElement('div');
    el.className = 'wf-card board-wf-card wf-framed-card ' + (side==='player' ? 'wf-card-player' : 'wf-card-enemy');
    el.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:visible;flex-shrink:0;`;

    const frozen = card.snow > 0;

    // Pomocniki: % → px string dla left/top
    const px = (pct) => `${(pct/100 * W).toFixed(1)}px`;
    const py = (pct) => `${(pct/100 * H).toFixed(1)}px`;

    // ── Warstwa 1: białe tło (wymagane dla multiply) ──────────────────────────
    const bgEl = document.createElement('div');
    bgEl.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#fff;`;
    el.appendChild(bgEl);

    // ── Warstwa 2: art ────────────────────────────────────────────────────────
    // Prostokąt przycięty do obszaru z cfg.art (w % × px karty)
    const artW = (cfg.art.width  / 100 * W);
    const artH = (cfg.art.height / 100 * H);
    const artL = (cfg.art.left   / 100 * W);
    const artT = (cfg.art.top    / 100 * H);

    const artEl = document.createElement('div');
    artEl.style.cssText = `position:absolute;left:${artL.toFixed(1)}px;top:${artT.toFixed(1)}px;width:${artW.toFixed(1)}px;height:${artH.toFixed(1)}px;overflow:hidden;`;

    // Fallback emoji (widoczny gdy brak img lub img się nie załaduje)
    const emojiEl = document.createElement('div');
    emojiEl.textContent = card.icon || '❓';
    emojiEl.style.cssText = `display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:1.6rem;background:#e8e0d0;`;

    if (card.img) {
      const artImg = document.createElement('img');
      artImg.src = card.img;     // URL lub base64 (z card editor)
      artImg.alt = card.name || '';
      artImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      artImg.onerror = () => { artImg.style.display = 'none'; emojiEl.style.display = 'flex'; };
      emojiEl.style.display = 'none';
      artEl.appendChild(artImg);
    }
    artEl.appendChild(emojiEl);
    el.appendChild(artEl);

    // ── Warstwa 3: PNG ramki ──────────────────────────────────────────────────
    // mix-blend-mode:multiply — białe tło PNG "znika", drewniana rama zostaje
    const frameImg = document.createElement('img');
    frameImg.src = frameSrc(cfg.frame);
    frameImg.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;mix-blend-mode:multiply;`;
    el.appendChild(frameImg);

    // ── Warstwa 4: staty ──────────────────────────────────────────────────────
    // Pozycje z cfg.hp.left/top, cfg.atk.left/top, cfg.counter.left/top, cfg.name.left/top
    // transform:translate(-50%,-50%) centruje względem podanego punktu
    const statStyle = (lPct, tPct, extra='') =>
      `position:absolute;left:${px(lPct)};top:${py(tPct)};transform:translate(-50%,-50%);font-weight:900;color:#000;text-shadow:0 0 2px rgba(255,255,255,0.6);line-height:1;${extra}`;

    // HP — lewy górny (serduszko + liczba)
    const hpEl = document.createElement('div');
    hpEl.style.cssText = statStyle(cfg.hp.left, cfg.hp.top, 'display:flex;align-items:center;gap:1px;font-size:0.72rem;');
    hpEl.innerHTML = `<span style="font-size:0.6rem;">❤</span><span>${card.hp ?? 0}</span>`;
    el.appendChild(hpEl);

    // ATK — prawy górny (liczba + miecz)
    const atkEl = document.createElement('div');
    atkEl.style.cssText = statStyle(cfg.atk.left, cfg.atk.top, 'display:flex;align-items:center;gap:1px;font-size:0.72rem;');
    atkEl.innerHTML = `<span>${card.atk ?? 0}</span><span style="font-size:0.6rem;">⚔</span>`;
    el.appendChild(atkEl);

    // Counter — dół środek
    const cntEl = document.createElement('div');
    cntEl.style.cssText = statStyle(cfg.counter.left, cfg.counter.top, 'font-size:0.82rem;');
    cntEl.textContent = card.counter ?? 0;
    el.appendChild(cntEl);

    // Nazwa — środek dolna część ramki
    const nameEl = document.createElement('div');
    nameEl.style.cssText = statStyle(cfg.name.left, cfg.name.top, 'font-size:0.5rem;white-space:nowrap;color:#3a2000;');
    nameEl.textContent = card.name || '';
    el.appendChild(nameEl);

    // ── Efekty statusów ───────────────────────────────────────────────────────

    // Zamrożenie (Snow) — niebieska etykieta na dole
    if (frozen) {
      const snowEl = document.createElement('div');
      snowEl.style.cssText = `position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:0.6rem;color:#0ea5e9;font-weight:bold;`;
      snowEl.textContent = `❄ ${card.snow}`;
      el.appendChild(snowEl);
    }

    // Tarcza — prawy górny róg
    if (card.shield > 0) {
      const shieldEl = document.createElement('div');
      shieldEl.style.cssText = 'position:absolute;top:4px;right:4px;font-size:0.6rem;color:#1e40af;font-weight:bold;';
      shieldEl.textContent = `🛡${card.shield}`;
      el.appendChild(shieldEl);
    }

    return el;
  },

  // ---------------------------------------------------------------------------
  // _makeLegacyBoardCard(card, side)
  // ---------------------------------------------------------------------------
  // Stary renderer bez PNG ramki — używany dla typów bez wpisu w FRAME_CONFIG
  // (item, power, consumable itp.) oraz jako fallback.
  //
  // Kolor HP dynamicznie zmienia się: zielony→żółty→czerwony w zależności od %.
  // Kolor countera: żółty→pomarańczowy→czerwony, niebieski gdy zamrożony.
  _makeLegacyBoardCard(card, side) {
    const el = document.createElement('div');
    el.className = 'wf-card board-wf-card ' + (side==='player' ? 'wf-card-player' : 'wf-card-enemy');

    const hpPct   = card.maxHp ? Math.max(0, card.hp/card.maxHp) : 1;
    const hpColor = hpPct>0.6 ? '#e05555' : hpPct>0.3 ? '#f59e0b' : '#ef4444';
    const frozen  = card.snow > 0;
    const cntPct  = card.maxCounter>0 ? card.counter/card.maxCounter : 1;
    const cntColor= frozen ? '#67e8f9' : (cntPct>0.5 ? '#fbbf24' : cntPct>0.25 ? '#fb923c' : '#ef4444');

    const artHtml  = card.img ? `<img class="wf-art-img" src="${card.img}" alt="${card.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : '';
    const emojiHtml= `<div class="wf-art-emoji" style="${card.img?'display:none':''}">${card.icon||'❓'}</div>`;

    el.innerHTML = `
      <div class="wf-frame">
        <div class="wf-stat-hp" style="color:${hpColor}">
          <div class="wf-gem wf-gem-hp">❤</div>
          <div class="wf-stat-num">${card.hp}</div>
        </div>
        <div class="wf-stat-atk">
          <div class="wf-stat-num">${card.atk??0}</div>
          <div class="wf-gem wf-gem-atk">⚔</div>
        </div>
        <div class="wf-art">${artHtml}${emojiHtml}</div>
        <div class="wf-banner"><span class="wf-name">${card.name}</span></div>
        <div class="wf-counter-wrap">
          ${frozen ? `<div class="wf-snow-pill">❄<span>${card.snow}</span></div>` : ''}
          <div class="wf-counter-badge ${frozen?'cnt-frozen':''}" style="color:${cntColor};border-color:${cntColor};background:${frozen?'#061820':'#100800'}">${card.counter}</div>
        </div>
        ${card.shield>0 ? `<div class="wf-shield">🛡${card.shield}</div>` : ''}
      </div>`;
    return el;
  },

  // ---------------------------------------------------------------------------
  // makeHandCard(cardId)
  // ---------------------------------------------------------------------------
  // Tworzy element DOM karty w ręce gracza (stary styl bez ramki PNG).
  // Karta w ręce pokazuje pełne statystyki i opis, jest draggable.
  //
  // Parametry:
  //   cardId — klucz w obiekcie CARDS (np. 'sword', 'namandi')
  //
  // Zwraca: HTMLElement lub null jeśli karta nie istnieje w CARDS
  //
  // Drag events: ustawia UI.dragCardId, renderGrid obsługuje drop
  makeHandCard(cardId) {
    const def = CARDS[cardId];
    if (!def) return null;
    const el = document.createElement('div');
    el.className = 'wf-card hand-wf-card hcard-'+def.type;
    el.draggable = true;

    const artHtml  = def.img ? `<img class="wf-art-img" src="${def.img}" alt="${def.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : '';
    const emojiHtml= `<div class="wf-art-emoji" style="${def.img?'display:none':''}">${def.icon||'❓'}</div>`;
    const isC      = def.type==='companion';

    // Dla itemów — jeden stat (atk / snow / heal) zależnie od tego co ma karta
    let itemStat = '';
    if (!isC) {
      if (def.atk)  itemStat = `<div class="wf-stat-atk"><div class="wf-stat-num" style="color:#f87171">${def.atk}</div><div class="wf-gem wf-gem-atk">⚔</div></div>`;
      if (def.snow) itemStat = `<div class="wf-stat-atk"><div class="wf-stat-num" style="color:#67e8f9">${def.snow}</div><div class="wf-gem" style="background:#0a1820;border:2px solid #67e8f9;color:#67e8f9">❄</div></div>`;
      if (def.heal) itemStat = `<div class="wf-stat-atk"><div class="wf-stat-num" style="color:#86efac">${def.heal}</div><div class="wf-gem wf-gem-hp">❤</div></div>`;
    }

    el.innerHTML = `
      <div class="wf-frame">
        ${isC ? `
          <div class="wf-stat-hp" style="color:#e05555">
            <div class="wf-gem wf-gem-hp">❤</div>
            <div class="wf-stat-num">${def.hp}</div>
          </div>
          <div class="wf-stat-atk">
            <div class="wf-stat-num">${def.atk??0}</div>
            <div class="wf-gem wf-gem-atk">⚔</div>
          </div>
        ` : itemStat}
        <div class="wf-art wf-art-hand">${artHtml}${emojiHtml}</div>
        <div class="wf-banner"><span class="wf-name">${def.name}</span></div>
        <div class="wf-desc-box"><span class="wf-desc">${def.desc}</span></div>
        ${isC ? `<div class="wf-counter-wrap"><div class="wf-counter-badge" style="color:#fbbf24;border-color:#fbbf24;background:#100800">${def.counter}</div></div>` : ''}
      </div>`;

    el.addEventListener('dragstart', ()=>{ this.dragCardId=cardId; el.classList.add('dragging'); });
    el.addEventListener('dragend',   ()=>{
      this.dragCardId=null; el.classList.remove('dragging');
      document.querySelectorAll('.drop-ok').forEach(c=>c.classList.remove('drop-ok'));
    });
    return el;
  },

  // ---------------------------------------------------------------------------
  // renderHand()
  // ---------------------------------------------------------------------------
  // Czyści i odbudowuje #hand na podstawie Battle.hand (tablica ID kart).
  renderHand() {
    const hand = document.getElementById('hand');
    if (!hand) return;
    hand.innerHTML = '';
    Battle.hand.forEach(cardId => {
      const card = this.makeHandCard(cardId);
      if (card) hand.appendChild(card);
    });
  },

  // ---------------------------------------------------------------------------
  // renderRedrawBell()
  // ---------------------------------------------------------------------------
  // Aktualizuje przycisk redraw (#redraw-btn).
  // Stany: charged (FREE) lub licznik pozostałych użyć.
  // Dane z: Battle.redrawCharged, Battle.redrawBell
  renderRedrawBell() {
    const btn = document.getElementById('redraw-btn');
    if (!btn) return;
    const charged = Battle.redrawCharged;
    btn.className = 'redraw-bell'+(charged?' charged':'');
    btn.innerHTML = `<div class="bell-icon">🔔</div><div class="bell-counter">${charged?'FREE':Battle.redrawBell}</div><div class="bell-label">${charged?'Free!':'Redraw'}</div>`;
  },

  // ---------------------------------------------------------------------------
  // renderDeckInfo()
  // ---------------------------------------------------------------------------
  // Aktualizuje #deck-info — dwa pilulki: deck i discard z licznikami.
  // Kliknięcie otwiera modal showPileModal().
  renderDeckInfo() {
    const di = document.getElementById('deck-info');
    if (!di) return;
    di.innerHTML = `
      <div class="deck-pill" onclick="UI.showPileModal('deck')">
        <span class="pile-icon">🂠</span><span class="pile-count">${Battle.deck.length}</span><span class="pile-label">Deck</span>
      </div>
      <div class="deck-pill" onclick="UI.showPileModal('discard')">
        <span class="pile-icon">🗑</span><span class="pile-count">${Battle.discard.length}</span><span class="pile-label">Discard</span>
      </div>`;
  },

  // ---------------------------------------------------------------------------
  // showPileModal(pile) / closePileModal()
  // ---------------------------------------------------------------------------
  // Otwiera modal ze skompresowaną listą kart w decku lub discard.
  // pile — 'deck' lub 'discard'
  showPileModal(pile) {
    const cards = pile==='deck' ? Battle.deck : Battle.discard;
    const title = pile==='deck' ? '🂠 Deck' : '🗑 Discard';
    const counts = {};
    cards.forEach(id=>{ counts[id]=(counts[id]||0)+1; });
    const rows = Object.entries(counts).map(([id,n])=>{
      const def = CARDS[id]; if (!def) return '';
      const art = def.img
        ? `<img src="${def.img}" style="width:28px;height:28px;object-fit:contain" onerror="this.outerHTML='<span style=font-size:1.3rem>${def.icon||'?'}</span>'">`
        : `<span style="font-size:1.3rem">${def.icon||'❓'}</span>`;
      return `<div class="pile-row"><div class="pile-row-art">${art}</div><span class="pile-row-name">${def.name}</span><span class="pile-row-type type-${def.type}">${def.type}</span><span class="pile-row-count">×${n}</span></div>`;
    }).join('');
    document.getElementById('pile-modal-content').innerHTML = `
      <div class="pile-modal-header"><span>${title} (${cards.length})</span><button class="pile-close" onclick="UI.closePileModal()">✕</button></div>
      <div class="pile-rows">${rows||'<div style="color:#666;padding:12px">Empty</div>'}</div>`;
    document.getElementById('pile-modal').style.display='flex';
  },

  closePileModal() { document.getElementById('pile-modal').style.display='none'; },

  // ---------------------------------------------------------------------------
  // renderLog()
  // ---------------------------------------------------------------------------
  // Wypełnia #battle-log ostatnimi 20 wpisami z getBattleLog() (battle.js).
  // Typy logów (klasy CSS): 'play', 'atk', 'enemy-atk', 'heal', 'snow', 'win', 'lose', 'info'
  renderLog() {
    const log = document.getElementById('battle-log');
    if (!log) return;
    log.innerHTML = getBattleLog().slice(-20).map(({msg,type})=>`<div class="log-entry log-${type}">${msg}</div>`).join('');
    log.scrollTop = log.scrollHeight;
  },

  // ---------------------------------------------------------------------------
  // showReward()
  // ---------------------------------------------------------------------------
  // Pokazuje overlay z 3 losowymi kartami do wyboru z REWARD_POOL.
  // Po wyborze: dodaje ID karty do Game.run.deck i wywołuje Game.advanceMap().
  showReward() {
    const pool = shuffle([...REWARD_POOL]).slice(0,3);
    const container = document.getElementById('reward-cards');
    if (!container) return;
    container.innerHTML = '';
    pool.forEach(cardId=>{
      const card = this.makeHandCard(cardId);
      if (!card) return;
      card.classList.add('reward-pick');
      card.addEventListener('click', ()=>{
        Game.run.deck.push(cardId);
        document.getElementById('reward-overlay').style.display='none';
        Game.advanceMap();
      });
      container.appendChild(card);
    });
    document.getElementById('reward-overlay').style.display='flex';
  },
};

// -----------------------------------------------------------------------------
// shuffle(arr)
// -----------------------------------------------------------------------------
// Tasuje tablicę (Fisher-Yates). Zwraca nową tablicę (nie modyfikuje oryginału).
// Używana przez: showReward(), battleSetup() (w battle.js)
function shuffle(arr) {
  const a=[...arr];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
