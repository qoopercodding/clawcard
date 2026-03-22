# Sprint 1 — 2026-03-22 do 2026-04-04

## Sprint Goal
Zrefaktorować system walki z STS → Wildfrost: UIScale, usunięcie many, counter tickujący na wszystkich jednostkach — pierwsze grywalne starcie bez mana/kosztu.

## Capacity
- Łączne dni: 10 (2 tygodnie)
- Bufor (20%): 2 dni zarezerwowane na niespodzianki
- Dostępne: 8 dni efektywnych

---

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Dni | Zależności | Acceptance Criteria |
|----|------|-------------|----------|------------|---------------------|
| S1-01 | Stworzyć `global/ui_scale.gd` — autoload z metodami `pos()`, `size()`, `scale_node()` | godot-specialist | 1 | — | Autoload ładuje się, `UIScale.pos(128, 72)` zwraca `Vector2(960, 540)` przy 256→1920 |
| S1-02 | Naprawić battle.tscn, stats_ui.tscn, intent_ui.tscn — przeskalować do 1920x1080 przez UIScale | godot-specialist | 1.5 | S1-01 | Battle screen wyświetla się poprawnie na 1920x1080, żadnych hardcoded `x7.5` pozycji |
| S1-03 | Dodać `counter: int` i `current_counter: int` do `card.gd` (Resource) | godot-specialist | 0.5 | — | Resource ma pole counter, istniejące karty nie crashują |
| S1-04 | Zaktualizować `card_visuals.tscn` — wyświetlać counter w UI karty (zamiast kosztu many) | godot-specialist | 0.5 | S1-03 | Karty na polu pokazują counter value (statycznie) |
| S1-05 | Ustawić counter values na 8 kartach warriora | balance-designer | 0.5 | S1-03 | Każda karta ma counter 1-5 uzasadniony gameplay'owo |
| S1-06 | Usunąć manę: `mana` z CharacterStats, `ManaUI` ze sceny, sprawdzenie many z logiki | godot-specialist | 1 | S1-04 | Karty można zagrać bez many, `ManaUI` nie istnieje, żadnych reference errors |
| S1-07 | Stworzyć `BattleTimeline.gd` — co turę wszystkie jednostki zmniejszają counter o 1, przy 0 wykonują akcję i resetują | godot-specialist | 2 | S1-06 | Wróg z counter=2 atakuje co 2 tury, gracz z counter=1 co turę; walka nie crashuje |
| S1-08 | Usunąć `end_turn_button` — lub zamienić w "Pass Turn" (opcjonalne) | godot-specialist | 0.5 | S1-07 | Counter tickuje automatycznie po akcji gracza |

### Should Have

| ID | Task | Agent/Owner | Est. Dni | Zależności | Acceptance Criteria |
|----|------|-------------|----------|------------|---------------------|
| S1-09 | Persistent hand — karty nie znikają po zagraniu, wracają do slotu po akcji | godot-specialist | 1.5 | S1-07 | Zagranie karty aktywuje jej counter, karta zostaje w ręce |
| S1-10 | Verify save/load działa po refaktorze (Map → Battle → Rewards flow) | qa-tester | 0.5 | S1-07 | Pełny run: mapa → bitwa → rewards → mapa następna — bez utraty stanu |

### Nice to Have

| ID | Task | Agent/Owner | Est. Dni | Zależności | Acceptance Criteria |
|----|------|-------------|----------|------------|---------------------|
| S1-11 | POC: jedna karta z `upgraded: bool` i `get_damage()` zwracającym x2 | godot-specialist | 0.5 | S1-03 | Karta z flagą upgraded zadaje podwójne obrażenia |
| S1-12 | Zaktualizować PLAN.md i SESSION_STATE.md po sprincie | — | 0.5 | S1-10 | Dokumenty reflektują stan po sprincie |

---

## Carryover z poprzednich sprintów

| Task | Powód carryover | Nowe oszacowanie |
|------|-----------------|------------------|
| UIScale (rescale_ui.gd napisany, nie uruchomiony) | Skrypt EditorScript nigdy nie odpalony; decyzja: runtime autoload zamiast EditorScript | S1-01 + S1-02 = 2.5 dni |

---

## Risks

| Ryzyko | Prawdopodobieństwo | Impact | Mitigacja |
|--------|--------------------|--------|-----------|
| BattleTimeline refaktor rozbija istniejące enemy AI (intent system) | Wysokie | Wysoki | Najpierw zmapować wszystkie miejsca gdzie `enemy.gd` sprawdza tury; zostawić stary system i podmienić w jednym kroku |
| Hardcoded pozycje rozrzucone po wielu scenach poza battle (shop, campfire) | Średnie | Średni | S1-02 ograniczony do battle screen — reszta scen to kolejny sprint |
| Decyzja "counter vs pass turn" nie podjęta → S1-08 blokuje S1-07 | Niskie | Średni | Domyślnie: zostawiamy Pass Turn jako przycisk "skip" żeby nie blokować developmentu |
| MCP Godot niedostępne → ręczna edycja .tscn | Niskie | Wysoki | Używać MCP do wszystkich zmian .tscn; jeśli MCP padnie — stop i eskalacja |

---

## Open Questions (do decyzji przed S1-07)

1. **Czy gracz ma "turę"?** Counter decyduje wszystko (czysty Wildfrost) vs. "Twoja tura" dla nowych graczy?
2. **Ile slotów na karty w persistent hand?** (S1-09 wymaga tej decyzji)
3. **Pass Turn:** Tak/Nie?

---

## Definition of Done dla tego sprintu
- [ ] Wszystkie Must Have (S1-01 do S1-08) ukończone
- [ ] Gra uruchamia się na 1920x1080 bez artefaktów skalowania
- [ ] Jedna pełna walka: gracz zagrywa karty, counter tickuje, wróg atakuje automatycznie, battle się kończy
- [ ] Mana nie istnieje nigdzie w kodzie ani UI
- [ ] Brak S1/S2 bugów w dostarczonych funkcjach
- [ ] PLAN.md i BATTLE_REFACTOR.md zaktualizowane
