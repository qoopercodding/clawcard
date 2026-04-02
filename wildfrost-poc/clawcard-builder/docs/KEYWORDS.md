# KEYWORDS.md — Baza Wiedzy Mechanik
## ClawCard | Epic 7 | Aktualizacja: 2026-04-02

---

## Retain
**Gra:** Slay the Spire
**Krótki opis:** Karta nie jest odrzucana na koniec tury — zostaje w ręce.
**Pełny opis:**
Normalnie wszystkie karty w ręce są odrzucane do discard pile na końcu tury gracza. Karty z keyword Retain są wyjątkiem — pozostają w ręce do następnej tury. Po zagraniu trafiają normalnie do discard pile (chyba że mają też Exhaust).
**Przykłady kart:** Miracle, Insight, Establishment, Windmill Strike
**Interakcje:** Runic Pyramid (relic) daje Retain wszystkim kartom. Karta z Retain + Ethereal nadal zostaje w ręce, ale Ethereal powoduje Exhaust na końcu tury.
**Wiki:** https://slay-the-spire.fandom.com/wiki/Retain
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Exhaust
**Gra:** Slay the Spire
**Krótki opis:** Karta jest usuwana z gry po zagraniu — nie trafia do discard pile.
**Pełny opis:**
Gdy karta z Exhaust zostaje zagrana (lub exhaust jest wywołany innym efektem), karta trafia do exhaust pile — specjalnej strefy usuniętych kart. Nie wraca do draw pile ani discard pile do końca walki. Jedynym sposobem odzyskania karty z exhaust pile jest karta Exhume.
**Przykłady kart:** Miracle, Apparition, Beta, Insight, Offering, True Grit
**Interakcje:** Dead Branch generuje losową kartę za każdy exhaust. Strange Spoon — 50% szans że exhaust nie zadziała. Feel No Pain — za każdy exhaust +Block.
**Wiki:** https://slay-the-spire.fandom.com/wiki/Exhaust
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Ethereal
**Gra:** Slay the Spire
**Krótki opis:** Jeśli karta jest w ręce na koniec tury — zostaje automatycznie exhaustowana.
**Pełny opis:**
Karty z keyword Ethereal muszą być zagrane lub odrzucone (discard) w turze, w której je mamy. Jeśli trzymamy je w ręce na koniec tury — zostają automatycznie exhaustowane (usunięte z gry). Jeśli karta ma też Retain, Retain pozwala ją trzymać ale Ethereal nadal ją exhaustuje na koniec tury.
**Przykłady kart:** Apparition, Carnage, Ghostly, Wraith Form v2
**Interakcje:** Retain NIE ratuje od Ethereal — karta z obu keywords i tak zostanie exhaustowana. Discard (np. przez Gambling Chip) zapobiega exhaustowi.
**Wiki:** https://slay-the-spire.fandom.com/wiki/Ethereal
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Intangible
**Gra:** Slay the Spire
**Krótki opis:** Wszystkie obrażenia i utrata HP są redukowane do 1 na czas działania.
**Pełny opis:**
Intangible to buff (dla gracza) lub debuff (od wroga). Gdy postać ma Intangible, każdy oddzielny hit zadaje dokładnie 1 obrażenie (lub 1 HP loss) zamiast normalnej wartości. Działa na wszystkie źródła obrażeń. Trwa określoną liczbę tur. Jeden z najpotężniejszych efektów obronnych w grze.
**Przykłady kart:** Apparition (jedyna karta gracza dająca Intangible), Wraith Form (power, daje co turę)
**Interakcje:** Działa na KAŻDY hit osobno. Multi-hit ataki (np. 5x3) zadają 1+1+1+1+1 = 5 zamiast 15.
**Wiki:** https://slay-the-spire.fandom.com/wiki/Intangible
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Strength
**Gra:** Slay the Spire
**Krótki opis:** Zwiększa obrażenia wszystkich ataków o wartość Strength.
**Pełny opis:**
Strength to buff który dodaje swoją wartość do obrażeń każdego ataku. Jeśli masz 3 Strength i grasz atak za 6, zadajesz 9. Działa na każdy hit multi-hitowych ataków osobno. Może być ujemny (debuff Weak nie zmniejsza Strength, ale Strength Down tak).
**Przykłady kart:** J.A.X. (daje Strength za HP), Inflame, Spot Weakness, Limit Break
**Interakcje:** Stacks indefinitely. Flex daje tymczasowy Strength (znika na koniec tury).
**Wiki:** https://slay-the-spire.fandom.com/wiki/Strength
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Draw
**Gra:** Slay the Spire
**Krótki opis:** Dobranie dodatkowych kart z draw pile do ręki.
**Pełny opis:**
Efekt Draw pozwala dobrać określoną liczbę kart z draw pile. Standardowo gracz dobiera 5 kart na turę. Karty z efektem "Draw X cards" dodają X kart do tego. Jeśli draw pile jest pusty, discard pile jest tasowany i staje się nowym draw pile.
**Przykłady kart:** Insight (Draw 2/3), Backflip, Pommel Strike, Battle Trance
**Interakcje:** No Draw debuff blokuje dobieranie kart (np. od bossa Time Eater trigger).
**Wiki:** https://slay-the-spire.fandom.com/wiki/Draw
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## X cost
**Gra:** Slay the Spire
**Krótki opis:** Karta zużywa całą pozostałą energię — efekt skaluje z wydaną energią.
**Pełny opis:**
Karty z kosztem X zużywają całą dostępną energię gracza. Wartość X to ilość wydanej energii, a efekt karty skaluje proporcjonalnie. Na przykład "Deal 9 damage X times" przy X=3 zadaje 9 obrażeń 3 razy. Koszt wyświetlany na karcie to "X".
**Przykłady kart:** Expunger, Whirlwind, Malaise, Skewer, Multi-Cast
**Interakcje:** Chemical X (relic) daje +2 do X. Double Energy podwaja energię przed zagraniem X-cost karty.
**Wiki:** https://slay-the-spire.fandom.com/wiki/X
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Heal
**Gra:** Slay the Spire
**Krótki opis:** Odzyskiwanie punktów HP do maksymalnego poziomu.
**Pełny opis:**
Heal przywraca utracone HP. Nie może przekroczyć Max HP. W walce heal jest rzadki — większość uzdrowień to eventy, odpoczynek na campfire, lub specjalne karty jak Bite i Reaper.
**Przykłady kart:** Bite (Heal 2/3), Feed, Reaper, Self Repair
**Interakcje:** Mark of the Bloom (relic od bossa) blokuje WSZYSTKIE heale.
**Wiki:** https://slay-the-spire.fandom.com/wiki/Heal
**Zweryfikowane:** TAK | Data: 2026-04-02

---

# ── MONSTER TRAIN ──

## Consume
**Gra:** Monster Train
**Krótki opis:** Karta jest usuwana po zagraniu — jednorazowe użycie.
**Pełny opis:**
Spelle z keyword Consume mogą być zagrane tylko raz na bitwę. Po zagraniu znikają i nie wracają. Odpowiednik Exhaust ze Slay the Spire.
**Przykłady kart:** Imp-in-a-Box, Rage Serum
**Wiki:** https://monster-train.fandom.com/wiki/Consume
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Armor
**Gra:** Monster Train
**Krótki opis:** Absorbuje obrażenia zanim trafią w HP jednostki.
**Pełny opis:**
Armor daje jednostce tarczę. Każdy punkt Armor absorbuje 1 punkt obrażeń. Trwały — nie znika na koniec tury.
**Przykłady kart:** Fortify
**Wiki:** https://monster-train.fandom.com/wiki/Armor
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Rage
**Gra:** Monster Train
**Krótki opis:** Zwiększa atak jednostki o wartość Rage.
**Pełny opis:**
Rage to buff zwiększający atak. Każdy punkt Rage = +1 Attack. Stacks. Odpowiednik Strength ze StS.
**Przykłady kart:** Dark Deal, Rage Serum
**Wiki:** https://monster-train.fandom.com/wiki/Rage
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Sweep
**Gra:** Monster Train
**Krótki opis:** Atak trafia wszystkie wrogie jednostki na piętrze.
**Wiki:** https://monster-train.fandom.com/wiki/Sweep
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Lifesteal
**Gra:** Monster Train
**Krótki opis:** Leczy Pyra za obrażenia zadane wrogom.
**Wiki:** https://monster-train.fandom.com/wiki/Lifesteal
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Multistrike
**Gra:** Monster Train
**Krótki opis:** Jednostka atakuje wielokrotnie w jednej fazie ataku.
**Wiki:** https://monster-train.fandom.com/wiki/Multistrike
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Gorge
**Gra:** Monster Train (Umbra)
**Krótki opis:** Efekt triggerowany przy zjadaniu Morseli.
**Wiki:** https://monster-train.fandom.com/wiki/Gorge
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Incant
**Gra:** Monster Train
**Krótki opis:** Efekt triggerowany przy graniu spelli.
**Wiki:** https://monster-train.fandom.com/wiki/Incant
**Zweryfikowane:** TAK | Data: 2026-04-02

---

# ── WILDFROST ──

## Ink
**Gra:** Wildfrost
**Krótki opis:** Spowalnia counter wroga.
**Wiki:** https://wildfrost.wiki.gg/wiki/Ink
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Snow
**Gra:** Wildfrost
**Krótki opis:** Dodaje do countera karty, opóźniając akcję.
**Wiki:** https://wildfrost.wiki.gg/wiki/Snow
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Shell
**Gra:** Wildfrost
**Krótki opis:** Tarcza absorbująca obrażenia.
**Wiki:** https://wildfrost.wiki.gg/wiki/Shell
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Teeth
**Gra:** Wildfrost
**Krótki opis:** Zadaje obrażenia atakującemu (thorns).
**Wiki:** https://wildfrost.wiki.gg/wiki/Teeth
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Spice
**Gra:** Wildfrost
**Krótki opis:** Tymczasowy boost do ataku.
**Wiki:** https://wildfrost.wiki.gg/wiki/Spice
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Frenzy
**Gra:** Wildfrost
**Krótki opis:** Wielokrotne ataki na trigger.
**Wiki:** https://wildfrost.wiki.gg/wiki/Frenzy
**Zweryfikowane:** TAK | Data: 2026-04-02

---

## Barrage
**Gra:** Wildfrost
**Krótki opis:** Atak trafia wszystkich wrogów.
**Wiki:** https://wildfrost.wiki.gg/wiki/Barrage
**Zweryfikowane:** TAK | Data: 2026-04-02

---
