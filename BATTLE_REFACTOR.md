# clawcard — Battle System Refactor
### Cel: z Slay the Spire → Wildfrost

---

## Czym różni się Wildfrost od STS w walce?

| | Slay the Spire | Wildfrost | My clawcard (cel) |
|---|---|---|---|
| Tury | Player → Enemy → Player | Wszyscy działają razem | Wszyscy działają razem |
| Koszt karty | Mana (3/tury) | Counter (odlicza co turę) | Counter |
| Inicjatywa | Gracz wybiera kolejność | Counter decyduje kto idzie | Counter |
| Karty w ręce | Dobierasz X kart/turę | Masz stałą "rękę" na polu | TBD |
| Cel zagrania karty | Natychmiastowy efekt | Ustawia counter jednostki | Counter-based |

---

## Co to jest Counter?

Każda karta/jednostka ma licznik (np. `3`).

```
Turę 1:  [Axe Attack | counter: 3] → 2 → 1 → DZIAŁA → reset do 3
Turę 1:  [Goblin     | counter: 2] → 1 → DZIAŁA → reset do 2
```

Kto ma niższy counter — działa szybciej. Gracz kontroluje kolejność przez dobór kart.

---

## Plan refaktoru — krok po kroku

### Faza 0 — Przygotowanie (nie ruszamy kodu walki)
- [ ] **0.1** Stworzyć `UIScale.gd` — globalny moduł skalowania UI
- [ ] **0.2** Naprawić Battle screen (przeskalować sceny do 1920x1080)
- [ ] **0.3** Zapis stanu gry działa poprawnie (save/load run)
- ✅ **CHECK:** Gra uruchamia się, można przejść mapę → bitwę → rewards

---

### Faza 1 — Counter na kartach (dane, nie logika)
- [ ] **1.1** Dodać pole `counter: int` do `card.gd` (Resource)
- [ ] **1.2** Dodać pole `current_counter: int` do runtime state karty
- [ ] **1.3** Zaktualizować `card_visuals.tscn` — wyświetlać counter zamiast/obok kosztu
- [ ] **1.4** Zaktualizować wszystkie istniejące karty warriora — ustawić sensowne wartości counter
- ✅ **CHECK:** Karty widać z counterem w UI (na razie statyczny, nie tickuje)

---

### Faza 2 — Usunięcie many
- [ ] **2.1** Usunąć `mana` z `CharacterStats`
- [ ] **2.2** Usunąć `ManaUI` ze sceny (`battle_ui.tscn`)
- [ ] **2.3** Usunąć sprawdzanie many z logiki zagrywania kart (`card_ui.gd`, `battle.gd`)
- [ ] **2.4** Karty można zagrać zawsze (nowe ograniczenie przyjdzie w Fazie 4)
- ✅ **CHECK:** Można zagrywać karty bez many, UI nie pokazuje many

---

### Faza 3 — Counter tickuje
- [ ] **3.1** Stworzyć `BattleTimeline` — nowy system który zarządza kolejnością akcji
- [ ] **3.2** Każda tura: wszystkie jednostki (gracz + wrogowie) zmniejszają counter o 1
- [ ] **3.3** Jednostka z counter = 0 → wykonuje akcję → reset countera
- [ ] **3.4** Jeśli kilka jednostek ma counter = 0 w tej samej turze → kolejność: gracz first, potem wrogowie od lewej
- [ ] **3.5** Usunąć stary `end_turn_button` flow (lub zostawić jako "pass turn")
- ✅ **CHECK:** Wrogowie i gracz działają na podstawie countera, nie tur

---

### Faza 4 — Karty na "polu" (persistent hand)
- [ ] **4.1** Zmienić model ręki: zamiast "dobierasz/odrzucasz" — masz stałe sloty
- [ ] **4.2** Zagranie karty = aktywowanie jej countera (karta wraca do slotu po akcji)
- [ ] **4.3** Nowe ograniczenie: max N kart aktywnych jednocześnie (np. 4)
- [ ] **4.4** Zaktualizować `Hand` i `CardUI` pod nowy model
- ✅ **CHECK:** Gracz ma stałą rękę, karty nie znikają po zagraniu

---

### Faza 5 — Companion cards
- [ ] **5.1** Nowy typ karty: `Companion` — unit który stoi na polu i ma własny counter
- [ ] **5.2** Companion działa automatycznie co X tur (jak enemy)
- [ ] **5.3** Companion ma HP — może zginąć
- [ ] **5.4** UI: osobny slot dla Companions na planszy
- ✅ **CHECK:** Można zagrać Companion, działa co turę, ginie od obrażeń

---

### Faza 6 — Testy i balance
- [ ] **6.1** Przejść pełny run od mapy do bossa
- [ ] **6.2** Sprawdzić czy counter values kart są sensowne (za szybko / za wolno?)
- [ ] **6.3** Sprawdzić czy wrogowie są challenge bez bycia niemożliwymi
- [ ] **6.4** Naprawić edge case'y (co jeśli gracz i enemy mają counter = 0 jednocześnie?)
- ✅ **CHECK:** Gra jest grywalna i fun przez ~15 minut

---

## Co usuwamy

| Co | Gdzie | Dlaczego |
|---|---|---|
| `mana` w CharacterStats | `character_stats.gd` | Zastąpione counterem |
| `ManaUI` | `battle_ui.tscn`, `mana_ui.tscn` | Niepotrzebne |
| `end_turn_button` | `battle_ui.tscn` | Tury są teraz automatyczne* |
| Draw/discard pile (może) | `character_stats.gd`, `hand.gd` | W Wildfrost nie ma talii w klasycznym sensie |

*"Pass turn" może zostać jako optional action

---

## Co zostawiamy / adaptujemy

| Co | Zmiana |
|---|---|
| `Card` Resource | Dodajemy `counter`, `card_type` |
| `Enemy` system | Dodajemy counter do enemy, usuwamy "intent per turn" |
| `Battle` scene (2D) | Zostaje, dostosujemy pozycje |
| Status effects (burn, freeze) | Zostają, dostosujemy do counter-based flow |
| Map, Shop, Rewards | Bez zmian |

---

## Typy kart (docelowo)

```
Attack     — zadaje dmg, counter 1-4, jednorazowe zagranie
Companion  — unit na polu, własny counter, HP, autoattack
Defence    — blok/shield, counter 1-3
Charm      — efekt pasywny (jak relic, ale w talii)
One-use    — "Burn" po zagraniu (znika z talii)
```

---

## Upgrade system (POC)

Każda karta może mieć `upgraded: bool`.

```gdscript
# W card.gd
var base_damage: int = 10
var upgraded: bool = false

func get_damage() -> int:
    return base_damage * 2 if upgraded else base_damage
```

Upgrade UI: przy campfire gracz może wybrać kartę do upgrade'u.

---

## Nice-to-have (po stabilnym MVP)

- **Warning przed śmiercią** — jeśli gracz ma zagrać ruch a po nim enemy go zabije w tej samej turze, wyświetl ostrzeżenie: "Zostaniesz trafiony za X, masz Y HP — czy na pewno?" z opcją cofnięcia. Dla nowych graczy. Nie blokuje ruchu, tylko pyta.

---

## Pytania otwarte (do decyzji zespołowej)

1. **Czy gracz ma "turę"?** W Wildfrost nie ma — counter decyduje wszystko. To bardziej emergentne ale trudniejsze do zrozumienia dla nowych graczy.
2. **Ile slotów na karty?** Wildfrost: 4-5. Więcej = więcej opcji, trudniejszy balance.
3. **Czy Companions giną na stałe?** W Wildfrost tak — to tworzy attachment. Czy chcemy?
4. **Co zastępuje draw/discard?** Może cooldown na kartach zamiast talii?

---

*Dokument żywy — aktualizowany po każdej fazie.*
