# ClawCard — Lista Zadań

## W kolejce
- [x] sprawdz wszystkie integracje systemu: Telegram bot, OpenClaw gateway, Claude Code Pro, GitHub repo, cron jobs, claude-task.sh, claude-resume.sh, task-queue.txt - dla kazdej napisz status OK lub BLAD i zapisz wynik do docs/INTEGRATION_LOG.md, potem wyslij podsumowanie na Telegram
- [ ] dodaj .claudeignore dla plikow Godot ignorujac: .godot/ addons/ *.import *.uid *.png *.wav *.ogg *.ttf
- [ ] stworz klase bazowa Card w src/cards/card_base.gd z polami name, attack, health, effect, cost
- [ ] stworz klase Enemy w src/enemies/enemy_base.gd z polami name, health, attack, abilities
- [ ] stworz scraper w Python src/tools/wiki_scraper.py ktory pobiera dane kart i mechanik z wiki.wildfroslgame.com oraz innych roguelike wiki (Slay the Spire wiki, Monster Train wiki) i zapisuje wyniki jako JSON w docs/wiki_data/ - scraper ma obslugiwac rate limiting i zapisywac postep zeby mozna bylo wznowic

## Ukończone

## Backlog
- [ ] połączenie z Notion (OAuth Client Secret skonfigurowany) — dokumenty zapisywalne i widoczne w Notion
- [ ] napraw BUG-001: raport poranny crashuje - sprawdz SESSION_STATE.md format i napraw skrypt
- [ ] napraw BUG-003: skonfiguruj autostart OpenClaw gateway przez systemd lub cron @reboot
- [ ] stworz watchdog.sh ktory co 5 min sprawdza czy openclaw gateway dziala (port 18789) i restartuje jesli pada, wy

cat > /root/clawcard/docs/BUGS.md << 'EOF'
# ClawCard — Bug Log

| ID | Priorytet | Status | Opis | Kiedy wykryto |
|---|---|---|---|---|
| BUG-001 | 🔴 HIGH | OPEN | Raport poranny (cron 4:00) crashuje — Exit code 1, SESSION_STATE.md nie matchuje | 2026-02-22 |
| BUG-002 | 🔴 HIGH | OPEN | auto-tasks.sh nie przechodzi do kolejnego zadania po limicie tokenów Claude Code | 2026-02-22 |
| BUG-003 | 🔴 HIGH | OPEN | OpenClaw gateway nie startuje automatycznie po restarcie VPS (systemd disabled) | 2026-02-22 |
| BUG-004 | 🟡 MED | OPEN | Telegram bot czasami nie odpowiada — brak monitoringu live czy gateway działa | 2026-02-22 |
| BUG-005 | 🟡 MED | OPEN | Scraper v4 gotowy na VPS ale brak credentials JSON — nie uruchomiony | 2026-02-22 |
| BUG-006 | 🟢 LOW | OPEN | Google Sheets — obrazki kart nie wyświetlają się (MediaWiki hashowane URL-e) | 2026-02-22 |
| BUG-007 | 🟢 LOW | OPEN | Notion integracja porzucona — agent pyta o token zamiast czytać z pliku | 2026-02-22 |
- [ ] napraw BUG-001: raport poranny crashuje - sprawdz SESSION_STATE.md format i napraw skrypt
- [ ] napraw BUG-003: skonfiguruj autostart OpenClaw gateway przez systemd lub cron @reboot
- [ ] stworz watchdog.sh ktory co 5 min sprawdza czy openclaw gateway dziala (port 18789) i restartuje jesli pada, wysyla alert na Telegram
- [ ] stworz drugi kanal monitoringu - bot pinguje VPS co 15 min i raportuje status do osobnego chatu Telegram
