// =============================================================================
// card-editor.js - Narzedzie do edycji kart i mapowania ramek w przegladarce.
// =============================================================================
//
// ODPOWIADA ZA:
//   - renderowanie panelu edytora kart i podgladu draftu
//   - zapis oraz odczyt kart roboczych z localStorage
//   - interaktywne mapowanie punktow ramki i eksport konfiguracji
//
// NIE ODPOWIADA ZA:
//   - logike walki i runtime Battle, bo to nalezy do battle.js
//   - definicje bazowych kart w CARDS, bo zrodlem prawdy pozostaje cards.js
//   - renderery kart UI poza wywolywaniem istniejacych metod UI.makeHandCard i UI.makeBoardCard
//
// GLOBALNE EKSPORTY:
//   CardEditor                 - glowny obiekt narzedzia dostepny jako window.CardEditor
//   CardEditor.init()          - uruchamia panel edytora i domyslna zakladke
//   CardEditor.switchTab()     - przelacza miedzy edytorem i mapperem
//   CardEditor.liveUpdate()    - odswieza draft i podglad na podstawie formularza
//   CardEditor.renderPreview() - renderuje podglad karty w rece i na planszy
//   CardEditor.exportCard()    - eksportuje definicje karty do pliku .js
//   CardEditor.saveToLibrary() - zapisuje draft do biblioteki localStorage
//   CardEditor.saveToSession() - alias zgodnosciowy dla saveToLibrary()
//   CardEditor.renderSavedList() - renderuje liste zapisanych kart
//   CardEditor.loadDraft()     - laduje zapisany draft do formularza
//   CardEditor.deleteSaved()   - usuwa zapisany draft z biblioteki i CARDS
//   CardEditor.runSanityTests() - uruchamia testy sanity dla danych i assetow
//   CardEditor.mapperRedoStep() - cofa wskazany krok mapowania ramki
//   CardEditor.mapperReset()   - resetuje postep mapowania ramki
//   CardEditor.mapperExport()  - eksportuje biezacy config mapowania do pliku
//
// UZYWA:
//   CARDS (cards.js), STARTER_DECK (cards.js), REWARD_POOL (cards.js), UI (ui.js), localStorage, FileReader
//
// LADOWANY W index.html jako: <script src="src/card-editor.js"></script>
// =============================================================================
// card-editor.js
// Art Director Tool — Frame Mapper + Card Editor

const CardEditor = {

  // ─── STATE ───────────────────────────────────────────────────
  activeTab: 'editor',
  editingId: null,

  draft: {
    id: '', name: '', type: 'companion',
    hp: 5, atk: 2, counter: 3,
    desc: '', icon: '❓',
    imgSrc: null,
    tribe: 'shelly',
    snow: 0, heal: 0, target: 'enemy',
    splash: false,
  },

  frameConfig: {
    companion: {
      art:     { top: 5,  left: 5,  width: 90, height: 50 },
      hp:      { top: 8,  left: 3  },
      atk:     { top: 8,  left: 78 },
      counter: { top: 88, left: 35 },
      name:    { top: 55, left: 5,  width: 90 },
      desc:    { top: 65, left: 5,  width: 90 },
    },
    item: {
      art:     { top: 5,  left: 5,  width: 90, height: 50 },
      hp:      null,
      atk:     { top: 8,  left: 78 },
      counter: null,
      name:    { top: 55, left: 5,  width: 90 },
      desc:    { top: 65, left: 5,  width: 90 },
    },
  },

  mapper: {
    frameType: 'companion',
    imgSrc: null,
    step: 0,
    steps: ['art_area', 'hp', 'atk', 'counter', 'name', 'desc'],
    stepLabels: {
      art_area: '🖼 Obszar artu — kliknij lewy-górny róg, potem prawy-dolny',
      hp:       '❤ HP — kliknij środek ikony serduszka',
      atk:      '⚔ ATK — kliknij środek ikony ataku',
      counter:  '⏱ Counter — kliknij środek licznika',
      name:     '📛 Nazwa — kliknij środek pola nazwy',
      desc:     '📝 Opis — kliknij środek pola opisu',
    },
    stepColors: {
      art_area: '#f0c060',
      hp:       '#e05555',
      atk:      '#67e8f9',
      counter:  '#fbbf24',
      name:     '#a78bfa',
      desc:     '#86efac',
    },
    clickBuffer: [],
    result: {},
  },

  // ─── INIT ────────────────────────────────────────────────────
  init() {
    this.renderEditorTab();
    this.switchTab('editor');
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.ced-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tab)
    );
    document.getElementById('ced-panel-editor').style.display = tab === 'editor' ? 'flex' : 'none';
    document.getElementById('ced-panel-mapper').style.display = tab === 'mapper' ? 'flex' : 'none';
    if (tab === 'editor') this.renderPreview();
    if (tab === 'mapper') {
      this._loadFrameConfigFromStorage();
      this.renderMapperFull();
    }
  },

  // ─── EDITOR TAB ──────────────────────────────────────────────
  renderEditorTab() {
    const panel = document.getElementById('ced-panel-editor');
    if (!panel) return;

    panel.innerHTML = `
      <div class="ced-form">
        <div class="ced-section-title">📇 Identyfikacja</div>
        <label class="ced-label">ID (snake_case)
          <input class="ced-input" id="ced-id" type="text" placeholder="np. ice_wolf" value="${this.draft.id}">
        </label>
        <label class="ced-label">Nazwa wyświetlana
          <input class="ced-input" id="ced-name" type="text" placeholder="Ice Wolf" value="${this.draft.name}">
        </label>
        <div class="ced-row">
          <label class="ced-label" style="flex:1">Typ karty
            <select class="ced-input" id="ced-type">
              <option value="companion" ${this.draft.type==='companion'?'selected':''}>Companion</option>
              <option value="item"      ${this.draft.type==='item'?'selected':''}>Item</option>
              <option value="power"     ${this.draft.type==='power'?'selected':''}>Power</option>
              <option value="consumable"${this.draft.type==='consumable'?'selected':''}>Consumable</option>
              <option value="aura"      ${this.draft.type==='aura'?'selected':''}>Effect/Aura</option>
            </select>
          </label>
          <label class="ced-label" style="flex:1">Tribe
            <select class="ced-input" id="ced-tribe">
              <option value="shelly"   ${this.draft.tribe==='shelly'?'selected':''}>Shelly</option>
              <option value="clunk"    ${this.draft.tribe==='clunk'?'selected':''}>Clunk</option>
              <option value="snowdwell"${this.draft.tribe==='snowdwell'?'selected':''}>Snowdweller</option>
              <option value="none"     ${this.draft.tribe==='none'?'selected':''}>Brak</option>
            </select>
          </label>
        </div>

        <div class="ced-section-title">📊 Statystyki</div>
        <div class="ced-row">
          <label class="ced-label" style="flex:1">❤ HP
            <input class="ced-input" id="ced-hp" type="number" min="0" value="${this.draft.hp}">
          </label>
          <label class="ced-label" style="flex:1">⚔ ATK
            <input class="ced-input" id="ced-atk" type="number" min="0" value="${this.draft.atk}">
          </label>
          <label class="ced-label" style="flex:1">⏱ Counter
            <input class="ced-input" id="ced-counter" type="number" min="1" value="${this.draft.counter}">
          </label>
        </div>
        <div class="ced-row">
          <label class="ced-label" style="flex:1">❄ Snow
            <input class="ced-input" id="ced-snow" type="number" min="0" value="${this.draft.snow}">
          </label>
          <label class="ced-label" style="flex:1">💚 Heal
            <input class="ced-input" id="ced-heal" type="number" min="0" value="${this.draft.heal}">
          </label>
          <label class="ced-label" style="flex:1">Target
            <select class="ced-input" id="ced-target">
              <option value="enemy" ${this.draft.target==='enemy'?'selected':''}>Enemy</option>
              <option value="ally"  ${this.draft.target==='ally'?'selected':''}>Ally</option>
            </select>
          </label>
        </div>
        <label class="ced-label">
          <input type="checkbox" id="ced-splash" ${this.draft.splash?'checked':''}>
          Splash (uderza cały rząd)
        </label>

        <div class="ced-section-title">📝 Opis i ikona</div>
        <label class="ced-label">Opis efektu
          <textarea class="ced-input ced-textarea" id="ced-desc" rows="3" placeholder="Opis działania karty...">${this.draft.desc}</textarea>
        </label>
        <label class="ced-label">Emoji ikona (fallback)
          <input class="ced-input" id="ced-icon" type="text" maxlength="2" value="${this.draft.icon}">
        </label>

        <div class="ced-section-title">🖼 Grafika</div>
        <div class="ced-img-drop" id="ced-img-drop">
          <span id="ced-img-label">${this.draft.imgSrc ? '✓ Obraz załadowany' : 'Upuść obraz lub kliknij'}</span>
          <input type="file" id="ced-img-input" accept="image/*" style="display:none">
        </div>
        <label class="ced-label" style="margin-top:6px">lub URL do obrazka
          <input class="ced-input" id="ced-img-url" type="text" placeholder="https://... lub assets/cards/...">
        </label>

        <div class="ced-actions">
          <button class="ced-btn ced-btn-preview"  onclick="CardEditor.liveUpdate()">🔄 Odśwież podgląd</button>
          <button class="ced-btn ced-btn-export"   onclick="CardEditor.exportCard()">⬇ Pobierz .js</button>
          <button class="ced-btn ced-btn-save"     onclick="CardEditor.saveToLibrary()">💾 Zapisz do biblioteki</button>
          <button class="ced-btn ced-btn-sanity"   onclick="CardEditor.runSanityTests()" style="background:#1e3a1e;border-color:#4ade80;color:#4ade80">🧪 Sanity</button>
        </div>

        <div class="ced-section-title" style="margin-top:12px">📚 Biblioteka kart (localStorage)</div>
        <div id="ced-saved-list" class="ced-saved-list"></div>
        <pre id="ced-output" class="ced-output" style="display:none"></pre>
      </div>

      <div class="ced-preview-wrap">
        <div class="ced-preview-title">Podgląd karty</div>
        <div id="ced-preview-hand" class="ced-preview-box">
          <div class="ced-preview-label">W ręce</div>
          <div id="ced-preview-hand-card"></div>
        </div>
        <div id="ced-preview-board" class="ced-preview-box">
          <div class="ced-preview-label">Na planszy</div>
          <div id="ced-preview-board-card"></div>
        </div>
      </div>
    `;

    this._bindFormEvents();
    this.renderSavedList();
  },

  _bindFormEvents() {
    const inputs = document.querySelectorAll('#ced-panel-editor .ced-input, #ced-panel-editor textarea');
    inputs.forEach(el => el.addEventListener('input', () => this.liveUpdate()));
    const checks = document.querySelectorAll('#ced-panel-editor input[type=checkbox]');
    checks.forEach(el => el.addEventListener('change', () => this.liveUpdate()));

    const drop = document.getElementById('ced-img-drop');
    const fileInput = document.getElementById('ced-img-input');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this._loadImageFile(file);
    });
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) this._loadImageFile(e.target.files[0]);
    });
  },

  _loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      this.draft.imgSrc = e.target.result; // base64 — działa w POC
      document.getElementById('ced-img-label').textContent = '✓ ' + file.name;
      document.getElementById('ced-img-drop').classList.add('has-img');
      this.renderPreview();
    };
    reader.readAsDataURL(file);
  },

  _readForm() {
    const v = id => document.getElementById(id)?.value ?? '';
    const n = id => parseInt(document.getElementById(id)?.value) || 0;
    const urlVal = v('ced-img-url').trim();

    this.draft.id      = v('ced-id').replace(/\s+/g,'_').toLowerCase();
    this.draft.name    = v('ced-name');
    this.draft.type    = v('ced-type');
    this.draft.tribe   = v('ced-tribe');
    this.draft.hp      = n('ced-hp');
    this.draft.atk     = n('ced-atk');
    this.draft.counter = n('ced-counter');
    this.draft.snow    = n('ced-snow');
    this.draft.heal    = n('ced-heal');
    this.draft.target  = v('ced-target');
    this.draft.splash  = document.getElementById('ced-splash')?.checked ?? false;
    this.draft.desc    = v('ced-desc');
    this.draft.icon    = v('ced-icon') || '❓';
    if (urlVal) this.draft.imgSrc = urlVal;
  },

  liveUpdate() {
    this._readForm();
    this.renderPreview();
  },

  renderPreview() {
    const handWrap  = document.getElementById('ced-preview-hand-card');
    const boardWrap = document.getElementById('ced-preview-board-card');
    if (!handWrap || !boardWrap) return;

    const d = this.draft;
    const tempId = '__preview__';
    const tempDef = {
      id: tempId, name: d.name || '???', type: d.type,
      img: d.imgSrc || null, icon: d.icon || '❓',
      hp: d.hp, atk: d.atk, counter: d.counter,
      snow: d.snow, heal: d.heal,
      target: d.target, splash: d.splash,
      desc: d.desc || '(brak opisu)',
    };
    const prevCard = CARDS[tempId];
    CARDS[tempId] = tempDef;

    handWrap.innerHTML  = '';
    boardWrap.innerHTML = '';

    const handCard = UI.makeHandCard(tempId);
    if (handCard) {
      handCard.style.transform = 'scale(0.75)';
      handCard.style.transformOrigin = 'top center';
      handCard.draggable = false;
      handWrap.appendChild(handCard);
    }

    const boardInstance = { ...tempDef, maxHp: d.hp, maxCounter: d.counter, shield: 0, snow: 0 };
    const boardCard = UI.makeBoardCard(boardInstance, 'player');
    if (boardCard) {
      boardCard.style.transform = 'scale(0.85)';
      boardCard.style.transformOrigin = 'top center';
      boardWrap.appendChild(boardCard);
    }

    if (prevCard) CARDS[tempId] = prevCard; else delete CARDS[tempId];
  },

  exportCard() {
    this._readForm();
    const d = this.draft;
    if (!d.id) { alert('Uzupełnij ID karty.'); return; }

    const imgLine = d.imgSrc
      ? (d.imgSrc.startsWith('data:')
          ? `    img: null, // <- wklej sciezke do pliku graficznego\n    icon: '${d.icon}',`
          : `    get img(){ return img('${d.imgSrc.split('/').pop()}'); },`)
      : `    img: null, icon: '${d.icon}',`;

    const statsLine = d.type === 'companion'
      ? `    hp:${d.hp}, atk:${d.atk}, counter:${d.counter},`
      : [
          d.atk  ? `atk:${d.atk}`       : '',
          d.snow ? `snow:${d.snow}`      : '',
          d.heal ? `heal:${d.heal}`      : '',
          `target:'${d.target}'`,
          d.splash ? 'splash:true'       : '',
        ].filter(Boolean).map((s,i) => i===0 ? `    ${s}` : s).join(', ') + ',';

    const lines = [
      `  ${d.id}: {`,
      `    id:'${d.id}', name:'${d.name}', type:'${d.type}',`,
      `    tribe:'${d.tribe}',`,
      `    ${imgLine}`,
      statsLine,
      `    desc:'${d.desc}',`,
      `  },`,
    ].join('\n');

    const blob = new Blob([`// Wklej do CARDS{} w src/cards.js\n${lines}\n`], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card_${d.id || 'nowa'}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const pre = document.getElementById('ced-output');
    if (pre) { pre.textContent = lines; pre.style.display = 'block'; }
  },

  // ─── BIBLIOTEKA (localStorage — trwałe między sesjami) ───────
  saveToLibrary() {
    this._readForm();
    const d = this.draft;
    if (!d.id) { alert('Uzupełnij ID karty.'); return; }

    // Zapisz do localStorage
    const library = JSON.parse(localStorage.getItem('ced_library') || '{}');
    library[d.id] = { ...d };
    localStorage.setItem('ced_library', JSON.stringify(library));

    // Załaduj do CARDS w bieżącej sesji
    CARDS[d.id] = {
      id: d.id, name: d.name, type: d.type,
      img: d.imgSrc || null, icon: d.icon,
      hp: d.hp, atk: d.atk, counter: d.counter,
      snow: d.snow, heal: d.heal,
      target: d.target, splash: d.splash, desc: d.desc,
      tribe: d.tribe,
    };

    this.renderSavedList();
    const btn = document.querySelector('.ced-btn-save');
    if (btn) { btn.textContent = '✓ Zapisano!'; setTimeout(() => btn.textContent = '💾 Zapisz do biblioteki', 1500); }
  },

  // Alias dla kompatybilności wstecznej
  saveToSession() { this.saveToLibrary(); },

  renderSavedList() {
    const list = document.getElementById('ced-saved-list');
    if (!list) return;
    const library = JSON.parse(localStorage.getItem('ced_library') || '{}');
    const entries = Object.values(library);
    if (!entries.length) {
      list.innerHTML = '<span style="color:#666;font-size:0.85rem">Brak kart w bibliotece</span>';
      return;
    }
    list.innerHTML = entries.map(c => `
      <div class="ced-saved-row">
        ${c.imgSrc ? `<img src="${c.imgSrc}" style="width:28px;height:28px;object-fit:cover;border-radius:3px;margin-right:6px;" onerror="this.style.display='none'">` : `<span style="font-size:1.2rem;margin-right:6px">${c.icon||'❓'}</span>`}
        <span class="ced-saved-name">${c.name || c.id}</span>
        <span class="ced-saved-type type-${c.type}">${c.type}</span>
        <button class="ced-btn-mini" onclick="CardEditor.loadDraft('${c.id}')">Edytuj</button>
        <button class="ced-btn-mini ced-btn-danger" onclick="CardEditor.deleteSaved('${c.id}')">✕</button>
      </div>
    `).join('');
  },

  loadDraft(id) {
    const library = JSON.parse(localStorage.getItem('ced_library') || '{}');
    if (!library[id]) return;
    this.draft = { ...library[id] };
    this.renderEditorTab();
    this.renderPreview();
    this.renderSavedList();
  },

  deleteSaved(id) {
    const library = JSON.parse(localStorage.getItem('ced_library') || '{}');
    delete library[id];
    localStorage.setItem('ced_library', JSON.stringify(library));
    delete CARDS[id];
    this.renderSavedList();
  },

  // ─── SANITY TESTS ────────────────────────────────────────────
  runSanityTests() {
    const results = [];
    const ok  = (msg) => results.push({ pass: true,  msg });
    const fail = (msg) => results.push({ pass: false, msg });

    // 1. Wszystkie karty w CARDS mają wymagane pola
    Object.entries(CARDS).forEach(([id, c]) => {
      if (!c.id)   fail(`CARDS.${id}: brak id`);
      if (!c.name) fail(`CARDS.${id}: brak name`);
      if (!c.type) fail(`CARDS.${id}: brak type`);
      else ok(`CARDS.${id}: pola OK`);
    });

    // 2. STARTER_DECK — wszystkie ID istnieją w CARDS
    STARTER_DECK.forEach(id => {
      if (CARDS[id]) ok(`STARTER_DECK: '${id}' istnieje`);
      else fail(`STARTER_DECK: '${id}' NIE istnieje w CARDS!`);
    });

    // 3. REWARD_POOL — j.w.
    REWARD_POOL.forEach(id => {
      if (CARDS[id]) ok(`REWARD_POOL: '${id}' istnieje`);
      else fail(`REWARD_POOL: '${id}' NIE istnieje w CARDS!`);
    });

    // 4. Namandi — obrazek dostępny sieciowo
    const namandiImg = CARDS['namandi']?.img;
    if (namandiImg) {
      fetch(namandiImg).then(r => {
        if (r.ok) ok(`namandi img: HTTP ${r.status} OK`);
        else fail(`namandi img: HTTP ${r.status} — ${namandiImg}`);
        this._showSanityResults(results);
      }).catch(() => {
        fail(`namandi img: fetch error — ${namandiImg}`);
        this._showSanityResults(results);
      });
      return; // async — wyniki po fetch
    } else {
      fail('namandi: brak img');
    }

    // 5. Companion Frame dostępny
    fetch('Companion Frame.png').then(r => {
      if (r.ok) ok(`Companion Frame.png: HTTP ${r.status} OK`);
      else fail(`Companion Frame.png: HTTP ${r.status}`);
      this._showSanityResults(results);
    }).catch(() => {
      fail('Companion Frame.png: fetch error');
      this._showSanityResults(results);
    });
  },

  _showSanityResults(results) {
    const passes = results.filter(r=>r.pass).length;
    const fails  = results.filter(r=>!r.pass).length;
    const pre = document.getElementById('ced-output');
    if (!pre) return;
    const lines = results.map(r => `${r.pass?'✅':'❌'} ${r.msg}`).join('\n');
    pre.textContent = `Sanity Tests: ${passes} OK, ${fails} FAIL\n${'─'.repeat(40)}\n${lines}`;
    pre.style.display = 'block';
    pre.style.color = fails > 0 ? '#f87171' : '#4ade80';
    console.log(`[Sanity] ${passes} OK, ${fails} FAIL`);
    results.forEach(r => r.pass ? console.log('✅', r.msg) : console.error('❌', r.msg));
  },

  // ─── FRAME MAPPER ────────────────────────────────────────────
  _saveFrameConfigToStorage() {
    try {
      localStorage.setItem('frameConfig_' + this.mapper.frameType, JSON.stringify(this.mapper.result));
    } catch(e) {}
  },

  _loadFrameConfigFromStorage() {
    try {
      const stored = localStorage.getItem('frameConfig_' + this.mapper.frameType);
      if (stored) {
        this.mapper.result = JSON.parse(stored);
        this.mapper.step = this.mapper.steps.filter(k => {
          const rk = k === 'art_area' ? 'art' : k;
          return this.mapper.result[rk] !== undefined;
        }).length;
      }
    } catch(e) {}
  },

  renderMapperFull() {
    const panel = document.getElementById('ced-panel-mapper');
    if (!panel) return;
    const m = this.mapper;

    panel.innerHTML = `
      <div class="map-sidebar">
        <div class="map-controls">
          <label class="ced-label">Typ ramki
            <select class="ced-input" id="map-frame-type">
              <option value="companion" ${m.frameType==='companion'?'selected':''}>Companion</option>
              <option value="item"      ${m.frameType==='item'?'selected':''}>Item</option>
              <option value="boss"      ${m.frameType==='boss'?'selected':''}>Boss</option>
            </select>
          </label>
          <div class="ced-img-drop map-img-drop" id="map-img-drop">
            <span>${m.imgSrc ? '✓ Grafika załadowana' : '📁 Wgraj grafikę ramki'}</span>
            <input type="file" id="map-img-input" accept="image/*" style="display:none">
          </div>
        </div>

        <div class="map-steps-header">Kroki mapowania:</div>
        <div id="map-steps-list" class="map-steps-list"></div>

        <div class="map-actions">
          <button class="ced-btn" onclick="CardEditor.mapperReset()">🔄 Reset</button>
          <button class="ced-btn ced-btn-export" onclick="CardEditor.mapperExport()">⬇ Pobierz config</button>
        </div>
        <pre id="map-output" class="ced-output" style="display:none;margin-top:8px"></pre>
      </div>

      <div class="map-canvas-wrap">
        <div id="map-instruction" class="map-instruction"></div>
        <div id="map-img-wrap" class="map-img-wrap" style="position:relative;display:inline-block;">
          ${m.imgSrc ? `<img id="map-frame-img" src="${m.imgSrc}" style="max-width:100%;max-height:70vh;display:block;pointer-events:none;">` : '<div id="map-frame-img" style="width:300px;height:450px;background:#1a1a2e;border:2px dashed #444;border-radius:8px;"></div>'}
          <svg id="map-svg-overlay" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;">
          </svg>
        </div>
        ${!m.imgSrc ? '<div class="map-empty-hint">← Wgraj grafikę ramki żeby zacząć</div>' : ''}
      </div>
    `;

    this._bindMapperEvents();
    this._updateMapperStepsList();
    if (m.imgSrc) {
      this._updateMapperInstruction();
      const img = document.getElementById('map-frame-img');
      if (img.complete) this._drawSVGOverlay();
      else img.onload = () => this._drawSVGOverlay();
    }
  },

  _bindMapperEvents() {
    const drop = document.getElementById('map-img-drop');
    const fileInput = document.getElementById('map-img-input');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this._loadMapperImage(file);
    });
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) this._loadMapperImage(e.target.files[0]);
    });

    const sel = document.getElementById('map-frame-type');
    if (sel) sel.addEventListener('change', () => {
      this.mapper.frameType = sel.value;
      this.mapper.step = 0;
      this.mapper.result = {};
      this.mapper.clickBuffer = [];
      this._loadFrameConfigFromStorage();
      this._updateMapperStepsList();
      this._updateMapperInstruction();
      this._drawSVGOverlay();
    });

    const wrap = document.getElementById('map-img-wrap');
    if (wrap) {
      wrap.addEventListener('click', e => {
        if (this.mapper.step >= this.mapper.steps.length) return;
        const img = document.getElementById('map-frame-img');
        const imgRect = img.getBoundingClientRect();
        const x = ((e.clientX - imgRect.left) / imgRect.width  * 100);
        const y = ((e.clientY - imgRect.top)  / imgRect.height * 100);
        if (x < 0 || y < 0 || x > 100 || y > 100) return;
        this._handleMapperClick(x, y);
      });
    }
  },

  _loadMapperImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      this.mapper.imgSrc = e.target.result;
      this.mapper.step = 0;
      this.mapper.result = {};
      this.mapper.clickBuffer = [];
      this.renderMapperFull();
    };
    reader.readAsDataURL(file);
  },

  _handleMapperClick(x, y) {
    const m = this.mapper;
    const step = m.steps[m.step];

    if (step === 'art_area') {
      m.clickBuffer.push({ x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) });
      if (m.clickBuffer.length === 1) {
        this._drawSVGOverlay();
        this._updateMapperInstruction();
        return;
      }
      if (m.clickBuffer.length >= 2) {
        const [a, b] = m.clickBuffer;
        m.result.art = {
          left:   parseFloat(Math.min(a.x, b.x).toFixed(1)),
          top:    parseFloat(Math.min(a.y, b.y).toFixed(1)),
          width:  parseFloat(Math.abs(b.x - a.x).toFixed(1)),
          height: parseFloat(Math.abs(b.y - a.y).toFixed(1)),
        };
        m.clickBuffer = [];
        m.step++;
      }
    } else {
      m.result[step] = { left: parseFloat(x.toFixed(1)), top: parseFloat(y.toFixed(1)) };
      m.step++;
    }

    this._saveFrameConfigToStorage();
    this._drawSVGOverlay();
    this._updateMapperStepsList();
    this._updateMapperInstruction();
  },

  _updateMapperInstruction() {
    const el = document.getElementById('map-instruction');
    if (!el) return;
    const m = this.mapper;
    if (m.step >= m.steps.length) {
      el.innerHTML = '<span style="color:#86efac">✅ Wszystkie punkty zaznaczone. Config zapisany.</span>';
      return;
    }
    const stepKey = m.steps[m.step];
    const color   = m.stepColors[stepKey] || '#fff';
    let text = m.stepLabels[stepKey] || '';
    if (stepKey === 'art_area' && m.clickBuffer.length === 1) text = '🖼 Teraz kliknij prawy-dolny róg obszaru artu';
    el.innerHTML = `
      <span class="map-step-badge" style="background:${color}22;border-color:${color};color:${color}">
        Krok ${m.step + 1}/${m.steps.length}
      </span>
      <span style="color:#e0e0e0;margin-left:8px">${text}</span>
    `;
  },

  _updateMapperStepsList() {
    const el = document.getElementById('map-steps-list');
    if (!el) return;
    const m = this.mapper;
    el.innerHTML = m.steps.map((key, i) => {
      const resultKey = key === 'art_area' ? 'art' : key;
      const done   = m.result[resultKey] !== undefined;
      const active = i === m.step && m.step < m.steps.length;
      const color  = m.stepColors[key] || '#fff';
      const label  = m.stepLabels[key] || key;
      let val = '';
      if (done) {
        const r = m.result[resultKey];
        val = resultKey === 'art'
          ? `${r.left}% ${r.top}% ${r.width}%×${r.height}%`
          : `${r.left}% ${r.top}%`;
      }
      return `
        <div class="map-step-row ${active?'map-step-active':''} ${done?'map-step-done':''}">
          <span class="map-step-dot" style="background:${done||active?color:'#333'};border-color:${color}"></span>
          <span class="map-step-label">${label.split('—')[0].trim()}</span>
          ${done ? `<span class="map-step-val">${val}</span>` : ''}
          ${done ? `<button class="ced-btn-mini" onclick="CardEditor.mapperRedoStep('${key}')">↩</button>` : ''}
        </div>
      `;
    }).join('');
  },

  mapperRedoStep(key) {
    const m = this.mapper;
    const idx = m.steps.indexOf(key);
    if (idx < 0) return;
    for (let i = idx; i < m.steps.length; i++) {
      const rk = m.steps[i] === 'art_area' ? 'art' : m.steps[i];
      delete m.result[rk];
    }
    m.step = idx;
    m.clickBuffer = [];
    this._saveFrameConfigToStorage();
    this._drawSVGOverlay();
    this._updateMapperStepsList();
    this._updateMapperInstruction();
  },

  _drawSVGOverlay() {
    const svg = document.getElementById('map-svg-overlay');
    const img = document.getElementById('map-frame-img');
    if (!svg || !img) return;

    const W = img.offsetWidth  || img.naturalWidth  || 400;
    const H = img.offsetHeight || img.naturalHeight || 600;
    const m = this.mapper;
    const colors = m.stepColors;
    const pct2px = (pct, dim) => pct / 100 * dim;
    let svgContent = '';

    Object.entries(m.result).forEach(([key, val]) => {
      const c = colors[key] || colors['art_area'] || '#fff';
      if (key === 'art') {
        const x = pct2px(val.left, W), y = pct2px(val.top, H);
        const w = pct2px(val.width, W), h = pct2px(val.height, H);
        svgContent += `
          <rect x="${x}" y="${y}" width="${w}" height="${h}"
            fill="${c}22" stroke="${c}" stroke-width="2" rx="3"/>
          <text x="${x+4}" y="${y+16}" fill="${c}" font-size="12" font-weight="bold" font-family="monospace">ART</text>
        `;
      } else {
        const px = pct2px(val.left, W), py = pct2px(val.top, H);
        svgContent += `
          <circle cx="${px}" cy="${py}" r="10" fill="${c}44" stroke="${c}" stroke-width="2"/>
          <text x="${px+13}" y="${py+4}" fill="${c}" font-size="11" font-weight="bold" font-family="monospace">${key.toUpperCase()}</text>
        `;
      }
    });

    if (m.clickBuffer.length === 1) {
      const buf = m.clickBuffer[0];
      const px = pct2px(buf.x, W), py = pct2px(buf.y, H);
      const c = colors['art_area'];
      svgContent += `
        <circle cx="${px}" cy="${py}" r="6" fill="${c}" stroke="${c}" stroke-width="2"/>
        <text x="${px+10}" y="${py+4}" fill="${c}" font-size="11" font-family="monospace">TL</text>
      `;
    }

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = svgContent;
  },

  mapperReset() {
    this.mapper.step = 0;
    this.mapper.result = {};
    this.mapper.clickBuffer = [];
    this._saveFrameConfigToStorage();
    this._drawSVGOverlay();
    this._updateMapperStepsList();
    this._updateMapperInstruction();
  },

  mapperExport() {
    const m = this.mapper;
    if (!Object.keys(m.result).length) {
      alert('Brak danych do eksportu.');
      return;
    }
    const config = { [m.frameType]: { ...m.result } };
    const code = '// frameConfig dla ' + m.frameType + '\n' + JSON.stringify(config, null, 2);

    const blob = new Blob([code], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'frame_config_' + m.frameType + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const pre = document.getElementById('map-output');
    if (pre) { pre.textContent = code; pre.style.display = 'block'; }
  },
};
