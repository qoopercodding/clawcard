# /balance-check

Jako balance-designer przeanalizuj podane karty lub cały zestaw kart.

## Co sprawdzam
1. Power budget każdej karty (powinien być zbliżony)
2. Pick rate potencjalny (czy ktoś w ogóle by wziął tę kartę?)
3. Synergies — czy karta ma co najmniej 1 partnera w puli?
4. Counter wartości — czy ta jednostka jest za szybka/wolna?
5. Boss balance — czy gracz ma szansę przy 20 HP bossa?

## Format wejścia
Podaj: nazwę karty, typ, HP, ATK, Counter, efekty
Albo napisz: "sprawdź wszystkie karty" — wtedy czytam sampleCards.ts

## Format wyjścia
Tabela kart z oceną:
- ✅ OK — balans w normie
- ⚠️ WARN — wymaga uwagi (powód)
- 🔴 OP — za mocna (propozycja nerfów)
- 🔵 UP — za słaba (propozycja buffów)

Plus: 3 konkretne rekomendacje co zmienić.

Czytaj: .claude/agents/balance-designer.md
