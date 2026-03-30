# ClawCard — Sprint Tasks

## PRIORYTET 1: Frontend Builder Tool
- [x] Przeprojektuj StartPage na dark fantasy UI (ciemne tło, złote akcenty, gothic font)
- [x] Dodaj animowane tło na StartPage (particles lub CSS gradient animation)
- [x] Przeprojektuj nawigację między modułami — sidebar z ikonami zamiast przycisków
- [x] Card Editor: podgląd karty renderowany w stylu Wildfrost (ramka, ikony statystyk)
- [x] Card Editor: animacja hover na podglądzie karty
- [x] Dodaj global dark theme CSS variables (--color-bg, --color-gold, --color-dark)

## PRIORYTET 2: Card Library Scraper
- [x] Napraw scraper StS1 — API jest offline, użyj MediaWiki API z wiki.gg
- [x] Scraper Monster Train — pobierz 282 karty przez MediaWiki API fandom
- [x] Merge wszystkich kart do card_library.json
- [x] Dodaj przeglądarkę kart w Card Editor z filtrowaniem po grze/typie

## PRIORYTET 3: Frame Editor → Card Editor handoff
- [ ] Po zapisaniu ramki w Frame Editor, Card Editor dynamicznie ładuje nowe typy
- [ ] Custom pola z Frame Editor pojawiają się jako pola w Card Editor
- [ ] frameTypes.json jako single source of truth

## PRIORYTET 4: VPS Infrastructure
- [ ] ttyd jako systemd service (DONE)
- [ ] nginx proxy do Builder Tool (DONE)
- [ ] openclaw Telegram gateway (DONE)
- [ ] Scraper kart odpalony na VPS
