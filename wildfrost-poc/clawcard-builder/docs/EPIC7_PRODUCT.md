# Card Mechanic Enrichment Pipeline — Product Document
## ClawCard | Epic 7 | 2 kwietnia 2026

---

## CEL

Mamy 668 kart z 3 gier (Slay the Spire, Monster Train, Wildfrost) ze scraped opisami. Opisy są brudne — mają placeholdery (`<P>`, `<D>`), skróty, błędy z HTML-a. Mechaniki (keywords) jak `Retain`, `Exhaust`, `Ethereal` są wspomniane w opisach ale nigdzie nie są wyjaśnione.

Chcemy:
1. Wyczyścić opisy kart
2. Wylistować wszystkie keywords per karta
3. Zbudować globalną bazę wiedzy o mechanikach
4. Pokazać to użytkownikowi w nowej zakładce na stronie

Zaczynamy od 8 kart pilotowych, potem skalujemy na całą bibliotekę.

---

## KARTY PILOTOWE (8 kart)

| Karta | Gra | Brudny opis |
|-------|-----|-------------|
| Miracle | Slay the Spire | `Retain. Gain <P> <P>. Exhaust.` |
| Apparition | Slay the Spire | `Ethereal. Gain 1 Intangible. Exhaust.` |
| Beta | Slay the Spire | `Shuffle a Omega into your draw pile. Exhaust.` |
| Bite | Slay the Spire | `Deal 7 damage. Gain 2 HP.` |
| Expunger | Slay the Spire | `Deal 9(15) damage X times.` |
| Insight | Slay the Spire | `Retain. Draw 2 cards.` |
| J.A.X. | Slay the Spire | `Lose 3 HP. Gain 2(3) Strength.` |
| (beta/special karta — do doczytania z wiki) | | |

---

## CO PRODUKUJE PIPELINE

### Na poziomie każdej karty

```json
{
  "id": "sts_miracle",
  "name": "Miracle",
  "game": "slay_the_spire",
  "desc_raw": "Retain. Gain <P> <P>. Exhaust.",
  "desc_clean": "Retain. Gain 2 Energy. Exhaust.",
  "desc_problems": ["<P> placeholder zastąpiony przez Energy"],
  "keywords": ["Retain", "Exhaust"],
  "keyword_refs": {
    "Retain": "KEYWORDS.md#retain",
    "Exhaust": "KEYWORDS.md#exhaust"
  },
  "mechanic_summary": "Karta trzyma się w ręce między turami. Po zagraniu daje 2 energię i znika z gry.",
  "verified_against_wiki": true,
  "wiki_url": "https://slay-the-spire.fandom.com/wiki/Miracle",
  "qa_notes": "",
  "enriched_at": "2026-04-02"
}
```

### Globalna baza wiedzy mechanik (KEYWORDS.md)

Plik który agenci budują i rozszerzają. Każda mechanika ma:
- Nazwę
- Krótki opis (1 zdanie)
- Pełny opis mechaniki
- Przykłady kart które ją mają
- Grę w której wystąpiła
- Link do wiki
- Status weryfikacji

### Widok w aplikacji (`?epic=7`)

Nowa zakładka "Mechaniki Kart" na stronie. Zawiera:
- Listę kart pilotowych z czystymi opisami
- Każdy keyword klikalny — otwiera sidepanel z definicją mechaniki
- Status wzbogacenia każdej karty (zielony = zweryfikowane, żółty = draft, czerwony = błędy)
- Pasek postępu: X/668 kart wzbogaconych

---

## FLOW Z PERSPEKTYWY UŻYTKOWNIKA

1. Agent uruchamia pipeline na 8 kartach pilotowych
2. Po zakończeniu commit do repo
3. Wchodzę na https://qoopercodding.github.io/clawcard/?epic=7
4. Widzę zakładkę "Mechaniki Kart" z 8 kartami
5. Klikam "Miracle" — widzę czysty opis + definicje Retain i Exhaust
6. Klikam "Retain" — otwiera się panel z pełną mechaniką z linkiem do wiki
7. Decyduję czy pipeline może lecieć dalej na pozostałe 660 kart

---

## CZTERY EPIKI

**Epic 7A — Keyword Extractor**
Wyciągnij listę keywords z opisu każdej karty. Wyczyść placeholdery. Zapisz.

**Epic 7B — Keyword Knowledge Base**
Zbuduj KEYWORDS.md. Dla każdego keyword: definicja, przykłady. Źródło: wiki.

**Epic 7C — Wiki Verifier**
Sprawdź każdą kartę pilotową z jej stroną na wiki. Czy opis jest poprawny? Czy keywords się zgadzają?

**Epic 7D — Frontend View**
Nowa zakładka w aplikacji. Karty z opisami i mechanikami. Klikalny keyword browser.

---

## KRYTERIA SUKCESU

- 8 kart pilotowych ma czysty opis (zero placeholderów `<P>`, `<D>`, etc.)
- Każda karta ma listę keywords zweryfikowaną z wiki
- KEYWORDS.md istnieje z min. 15 mechanikami z opisami i linkami
- Zakładka `?epic=7` renderuje się bez błędów
- Każdy keyword jest klikalny i pokazuje definicję
- Build przechodzi (`npm run build` zero błędów)
