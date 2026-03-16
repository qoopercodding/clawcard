# SESSION STATE

## Status: OCZEKIWANIE NA ZADANIE

**Ostatnia sesja:** 2026-02-21
**Ostatni commit:** 3691656

## Co zostało zrobione
- Inicjalizacja repo ClawCard
- Struktura folderów: src/cards, src/mechanics, src/enemies
- CLAUDE.md z instrukcjami dla agenta + Workflow Orchestration framework
- `src/cards/test_card.gd` — bazowa klasa karty (card_name, attack, health)
- `src/cards/snowdancer.gd` — karta Snowdancer (ATK:2, HP:4, efekt: Freeze)
- `src/tools/wildfrost_scraper.py` — scraper v4: parser Lua + image API + Google Sheets
- `docs/LESSONS.md` — plik wniosków agenta
- `orchestrator.sh` / `wake_up.sh` — automatyzacja i cron

## Następny krok
- Wgrać credentials Google Sheets na VPS (`/root/clawcard/secrets/clawcard-sheets.json`)
- Uruchomić scraper: `cd /root/clawcard && .venv/bin/python3 src/tools/wildfrost_scraper.py`

## Otwarte problemy
- Credentials Google Sheets tylko lokalnie (C:\Users\Qoope\Downloads\clawcard-4078b0eed30a.json)
- Notion API key niezskonfigurowany

## Notatki
- Repo: https://github.com/qoopercodding/clawcard
- Sheets ID: 1dYu6k0sgVtW929EczqR8yEWkM7mfcc36wlwbp71FgQ0
