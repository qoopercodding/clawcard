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
