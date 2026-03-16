// anim.js
// Animacja ataku: oblicza offset między komórkami statycznie z layoutu CSS
// CELL = 130×160, GAP = 10, gap między gridami ≈ 32px + 2×(3×130 + 2×10) = 32+860 = odległość

const Anim = {

  // Główna animacja ataku: atakujący leci do celu, cel dostaje wobble
  // attackerIdx/attackerSide, targetIdx/targetSide — indeksy w tablicach cells
  attackCharge(attackerIdx, attackerSide, targetIdx, targetSide) {
    const attackerEl = this._getCard(attackerIdx, attackerSide);
    const targetEl   = this._getCard(targetIdx,   targetSide);

    if (!attackerEl) return;

    let dx, dy;

    if (targetEl) {
      // Pobierz żywe recty z DOM
      const aRect = attackerEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      dx = (tRect.left + tRect.width/2)  - (aRect.left + aRect.width/2);
      dy = (tRect.top  + tRect.height/2) - (aRect.top  + aRect.height/2);
    } else {
      // Fallback: brak el targetu (np. lider nie ma osobnej komórki) — skocz w stronę wroga
      dx = attackerSide === 'player' ? 80 : -80;
      dy = 0;
    }

    // Lecimy 85% drogi
    const fx = dx * 0.85;
    const fy = dy * 0.85;

    // Wyciągnij kartę z flow żeby mogła wyjść poza komórkę
    attackerEl.style.position  = 'relative';
    attackerEl.style.zIndex    = '999';
    attackerEl.style.transition= 'transform 0.13s cubic-bezier(0.4,0,0.2,1)';
    attackerEl.style.transform = `translate(${fx}px,${fy}px) scale(1.05)`;

    setTimeout(() => {
      // Trafienie — cel drży
      if (targetEl) {
        targetEl.classList.remove('anim-hit');
        void targetEl.offsetWidth;
        targetEl.classList.add('anim-hit');
        targetEl.addEventListener('animationend', () => targetEl.classList.remove('anim-hit'), {once:true});
      }
      // Powrót
      attackerEl.style.transition = 'transform 0.20s cubic-bezier(0.4,0,0.6,1)';
      attackerEl.style.transform  = 'translate(0,0) scale(1)';
      setTimeout(() => {
        attackerEl.style.cssText = '';
      }, 220);
    }, 140);
  },

  hit(cellIdx, side) {
    const card = this._getCard(cellIdx, side);
    if (!card) return;
    card.classList.remove('anim-hit');
    void card.offsetWidth;
    card.classList.add('anim-hit');
    card.addEventListener('animationend', () => card.classList.remove('anim-hit'), {once:true});
  },

  death(cellIdx, side) {
    const card = this._getCard(cellIdx, side);
    if (!card) return;
    card.classList.add('anim-death');
  },

  placeCard(cellIdx, side) {
    setTimeout(() => {
      const card = this._getCard(cellIdx, side);
      if (!card) return;
      card.classList.add('anim-place');
      card.addEventListener('animationend', () => card.classList.remove('anim-place'), {once:true});
    }, 30);
  },

  floatText(cellIdx, side, text, color = '#f87171') {
    const grid = document.getElementById(side === 'player' ? 'player-grid' : 'enemy-grid');
    if (!grid) return;
    const cells = grid.querySelectorAll('.cell');
    const cell  = cells[cellIdx];
    if (!cell) return;
    const el = document.createElement('div');
    el.className   = 'float-text';
    el.textContent = text;
    el.style.color = color;
    cell.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), {once:true});
  },

  screenShake() {
    const arena = document.querySelector('.battle-arena');
    if (!arena) return;
    arena.classList.remove('anim-shake');
    void arena.offsetWidth;
    arena.classList.add('anim-shake');
    arena.addEventListener('animationend', () => arena.classList.remove('anim-shake'), {once:true});
  },

  bellFlash() {
    const btn = document.getElementById('redraw-btn');
    if (!btn) return;
    btn.classList.add('anim-flash');
    btn.addEventListener('animationend', () => btn.classList.remove('anim-flash'), {once:true});
  },

  // Pobiera element .board-wf-card z n-tej komórki danego gridu
  _getCard(cellIdx, side) {
    const gridId = side === 'player' ? 'player-grid' : 'enemy-grid';
    const grid   = document.getElementById(gridId);
    if (!grid) return null;
    const cells  = grid.querySelectorAll('.cell');
    const cell   = cells[cellIdx];
    if (!cell) return null;
    return cell.querySelector('.board-wf-card');
  },
};
