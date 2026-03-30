# CLAWCARD — Lista zadań do sprawdzenia po sesji
> 2026-03-30

## STATUS OGÓLNY

### ✅ ZROBIONE w tej sesji

#### Moduł "Ostatni Język" — nowa gra
- [x] `src/modules/last-language/types/index.ts` — wszystkie typy (Keyword, Card, Word, BattleState, Enemy, Player)
- [x] `src/modules/last-language/data/index.ts` — 8 kart + 10 Słów
- [x] `src/modules/last-language/engine/index.ts` — pełny silnik bitwy (playCard, playTabu, endTurn, createInitialState)
- [x] `src/modules/last-language/LastLanguageScreen.tsx` — pełny UI bitwy (karty, słowa, wrogowie, log, kontrolki)
- [x] `src/pages/StartPage.tsx` — dodany kafel "Ostatni Język" jako pierwszy na liście
- [x] `src/App.tsx` — dodany import i case dla 'last-language'

#### GDD
- [x] `CLAWCARD_GDD.md` — pełny dokument projektowy z 10 iteracjami (pobrany jako output)

#### VPS / Infrastruktura
- [x] OpenClaw gateway — zaktualizowany do 2026.3.28
- [x] BUG-003 — gateway teraz enabled i startuje po restarcie

---

## ⚠️ DO SPRAWDZENIA PO PUSHU

### 1. Moduł "Ostatni Język" na Pages
Otwórz: https://qoopercodding.github.io/clawcard/
- [ ] Kafel "Ostatni Język" widoczny jako pierwszy na stronie głównej
- [ ] Kliknięcie otwiera ekran bitwy
- [ ] Karty i Słowa wyświetlają się poprawnie
- [ ] Przyciski "Zagraj", "Koniec tury", "Tabu" działają
- [ ] Log zdarzeń aktualizuje się po każdej akcji
- [ ] Ekran "Zwycięstwo" / "Śmierć" pojawia się gdy HP = 0

### 2. TypeScript — błędy kompilacji
W terminalu VS Code:
```powershell
cd C:\Users\Qoope\projects\clawcard\wildfrost-poc\clawcard-builder
npm run build
```
Sprawdź czy build przechodzi bez błędów.

### 3. GitHub Actions
Sprawdź: https://github.com/qoopercodding/clawcard/actions
- [ ] Workflow "Deploy ClawCard Builder" zakończony zielonym checkmarkiem

---

## 🔧 ZNANE PROBLEMY DO NAPRAWY

### VPS — SSH nie działa
- SSH timeout na porcie 22 mimo że serwer jest ON
- ttyd (port 8080) nie odpowiada
- Konsola VNC Hetzner pokazuje GUI Ubuntu zamiast terminala tekstowego
- Hasło root zresetowane do: `dMhmbCNbVJie` (jednorazowe, wygaśnie)
- **Fix:** Zalogować się przez konsolę VNC (Ctrl+Alt+F3 → TTY3) i uruchomić:
  ```bash
  systemctl restart ssh
  systemctl restart ttyd
  ufw allow 22
  ufw allow 8080
  ```
  Oraz dodać klucz SSH:
  ```bash
  echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIClSRqiZLLeYZjih1BTaWnaa2DBifHNialeCkcJwA/+1 wildfrost-vps" >> /root/.ssh/authorized_keys
  ```

### Frame Editor — zapis nie działa na GitHub Pages
- Fetch idzie na `/api/save-frame-config` → 404 na Pages
- Fix gotowy w planie: Express API server na VPS + absolutny URL w FrameEditorScreen.tsx
- Zablokowane przez problemy z VPS

---

## 📋 NASTĘPNE ITERACJE (z GDD)

### Iteracja 2 — Tura wroga + Hive Mind (UI)
- Animacja ataku wroga
- Intent wroga widoczny przed jego turą
- Hive Mind adaptuje wrogów wizualnie

### Iteracja 3 — Tabu full flow
- Detekcja 2 Słów pod rząd bez karty
- Efekt hybrydowy Mróz+Trucizna etc.
- Strażnik Języka po 3 znamionach

### Iteracja 4 — Mapa
- Węzły jako kółka, połączenia jako linie
- Mutacja węzłów po X turach
- Rozszerzanie mapy po wygranej walce

### Iteracja 5 — Deck Builder
- Nagrody po walce (wybór 1 z 3 kart/słów)
- Zbieracz Słów jako węzeł na mapie
- Podgląd pełnego decku

---

## 🚀 JAK ZROBIĆ PUSH

```powershell
cd C:\Users\Qoope\projects\clawcard
git add .
git commit -m "feat: Ostatni Jezyk - nowy modul bitwy dark fantasy"
git push
```

GitHub Actions automatycznie zbuduje i wdroży na:
https://qoopercodding.github.io/clawcard/
