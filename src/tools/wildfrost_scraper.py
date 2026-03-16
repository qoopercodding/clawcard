#!/usr/bin/env python3
"""
Wildfrost Wiki Scraper v4
- Pobiera dane kart z Module:Cards/data (Lua)
- Parser z depth-tracking dla zagnieżdżonych {}
- Pobiera URL obrazków przez MediaWiki API
- Zapisuje do Google Sheets (osobny tab per typ karty)

Wymagania:
  pip install gspread google-auth requests

Credentials Google Sheets:
  Umieść plik JSON na VPS i ustaw CREDENTIALS_PATH poniżej
"""

import re
import json
import time
import requests
import gspread
from google.oauth2.service_account import Credentials

# === KONFIGURACJA ===
CREDENTIALS_PATH = "/root/clawcard/secrets/clawcard-sheets.json"
SHEET_ID = "1dYu6k0sgVtW929EczqR8yEWkM7mfcc36wlwbp71FgQ0"
WIKI_API = "https://wildfrostwiki.com/api.php"
RATE_LIMIT_DELAY = 0.3  # sekundy między zapytaniami

# Kolejność kolumn w Sheets
COLUMNS = ["Name", "Types", "Health", "Attack", "Counter", "Scrap",
           "Other", "Desc", "Tribes", "Price", "Challenge", "ChallengeOrder", "ImageURL"]

# Mapowanie typów → nazwy tabów
TAB_MAP = {
    "Pet": "Pets",
    "NonPetCompanion": "Companions",
    "Item": "Items",
    "Clunker": "Clunkers",
    "EnemyClunker": "Clunkers",
    "Enemy": "Enemies",
    "Boss": "Bosses",
    "Miniboss": "Minibosses",
    "Shade": "Shades",
    "HotSpring": "Companions",
    "Charm": "Charms",
}


# ─── PARSER LUA ──────────────────────────────────────────────────────────────

def extract_lua_blocks(lua_text: str) -> list[tuple[str, str]]:
    """
    Wyciąga pary (card_key, block_content) z pliku Lua.
    Używa depth-tracking żeby obsłużyć zagnieżdżone {}.
    """
    results = []
    # Znajdź każde cards["..."] = {
    pattern = re.compile(r'cards\["([^"]+)"\]\s*=\s*\{')

    i = 0
    while i < len(lua_text):
        m = pattern.search(lua_text, i)
        if not m:
            break

        card_key = m.group(1)
        start = m.end() - 1  # pozycja otwierającego {

        # Śledź głębokość nawiasów
        depth = 0
        pos = start
        in_string = False
        string_char = None

        while pos < len(lua_text):
            ch = lua_text[pos]

            # Obsługa stringów (żeby { wewnątrz stringa nie liczył się)
            if in_string:
                if ch == string_char and lua_text[pos-1] != '\\':
                    in_string = False
            else:
                if ch in ('"', "'"):
                    in_string = True
                    string_char = ch
                elif ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        block = lua_text[start+1:pos]
                        results.append((card_key, block))
                        i = pos + 1
                        break

            pos += 1
        else:
            break

    return results


def parse_value(val: str):
    """Konwertuje wartość Lua na Python."""
    val = val.strip().rstrip(',')
    if val == 'true':
        return True
    if val == 'false':
        return False
    if val.startswith('"') and val.endswith('"'):
        return val[1:-1]
    try:
        return int(val)
    except ValueError:
        pass
    try:
        return float(val)
    except ValueError:
        pass
    return val


def parse_types(block: str) -> dict:
    """Parsuje Types={Pet=true, Companion=true} → {'Pet': True, 'Companion': True}"""
    types = {}
    for m in re.finditer(r'(\w+)\s*=\s*(true|false)', block):
        types[m.group(1)] = m.group(2) == 'true'
    return types


def parse_tribes(block: str) -> list:
    """Parsuje Tribes={"Snowdwellers", "Shademancers"} → ['Snowdwellers', 'Shademancers']"""
    tribes = re.findall(r'"([^"]+)"', block)
    return tribes


def parse_card_block(block: str) -> dict:
    """Parsuje zawartość bloku karty na dict."""
    card = {}

    # Types (zagnieżdżone {})
    types_m = re.search(r'Types\s*=\s*\{([^}]*)\}', block)
    if types_m:
        card['Types'] = parse_types(types_m.group(1))
        # Usuń Types z bloku żeby nie mieszało dalszego parsowania
        block = block[:types_m.start()] + block[types_m.end():]

    # Tribes (zagnieżdżone {})
    tribes_m = re.search(r'Tribes\s*=\s*\{([^}]*)\}', block)
    if tribes_m:
        card['Tribes'] = parse_tribes(tribes_m.group(1))
        block = block[:tribes_m.start()] + block[tribes_m.end():]

    # Pozostałe pola: Key = "value" lub Key = 123
    for m in re.finditer(r'(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?)', block):
        key, val = m.group(1), m.group(2)
        if key not in ('Types', 'Tribes'):
            card[key] = parse_value(val)

    return card


def determine_tab(types: dict) -> str:
    """Na podstawie Types zwraca nazwę taba w Sheets."""
    for type_key, tab_name in TAB_MAP.items():
        if types.get(type_key):
            return tab_name
    return "Other"


# ─── MEDIAWIKI IMAGE API ──────────────────────────────────────────────────────

def fetch_image_urls(card_names: list[str], batch_size: int = 20) -> dict[str, str]:
    """
    Pobiera prawdziwe URL obrazków przez MediaWiki API.
    Zwraca {card_name: image_url}
    """
    image_urls = {}
    total = len(card_names)

    for i in range(0, total, batch_size):
        batch = card_names[i:i+batch_size]
        titles = "|".join(f"File:{name}_Card.png" for name in batch)

        params = {
            "action": "query",
            "titles": titles,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json",
        }

        try:
            resp = requests.get(WIKI_API, params=params, timeout=10)
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})

            for page in pages.values():
                title = page.get("title", "")
                # Wyciągnij nazwę karty z "File:NazwaKarty_Card.png"
                name_match = re.match(r"File:(.+?)_Card\.png", title)
                if name_match:
                    card_name = name_match.group(1)
                    imageinfo = page.get("imageinfo", [])
                    if imageinfo:
                        image_urls[card_name] = imageinfo[0].get("url", "")

            print(f"  Obrazki: {min(i+batch_size, total)}/{total}")
            time.sleep(RATE_LIMIT_DELAY)

        except Exception as e:
            print(f"  Błąd pobierania obrazków (batch {i}): {e}")

    return image_urls


# ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────

def get_sheets_client():
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=scopes)
    return gspread.authorize(creds)


def get_or_create_tab(spreadsheet, tab_name: str):
    """Zwraca istniejący tab lub tworzy nowy."""
    try:
        return spreadsheet.worksheet(tab_name)
    except gspread.WorksheetNotFound:
        ws = spreadsheet.add_worksheet(title=tab_name, rows=500, cols=len(COLUMNS))
        return ws


def write_tab(spreadsheet, tab_name: str, cards: list[dict]):
    """Zapisuje listę kart do taba w Sheets."""
    ws = get_or_create_tab(spreadsheet, tab_name)
    ws.clear()

    # Nagłówek
    rows = [COLUMNS]

    for card in sorted(cards, key=lambda c: c.get("Name", "")):
        row = []
        for col in COLUMNS:
            val = card.get(col, "")
            if isinstance(val, dict):
                # Types → "Pet, Companion"
                val = ", ".join(k for k, v in val.items() if v)
            elif isinstance(val, list):
                # Tribes → "Snowdwellers, Shademancers"
                val = ", ".join(val)
            row.append(str(val) if val != "" else "")
        rows.append(row)

    ws.update(rows, value_input_option="RAW")
    print(f"  Tab '{tab_name}': {len(cards)} kart zapisanych")
    time.sleep(1)  # rate limit Sheets API


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Wildfrost Scraper v4 ===\n")

    # 1. Pobierz dane Lua z wiki
    print("1. Pobieranie Module:Cards/data...")
    params = {
        "action": "query",
        "titles": "Module:Cards/data",
        "prop": "revisions",
        "rvprop": "content",
        "format": "json",
    }
    resp = requests.get(WIKI_API, params=params, timeout=30)
    data = resp.json()
    pages = data["query"]["pages"]
    lua_text = list(pages.values())[0]["revisions"][0]["*"]
    print(f"   Pobrano {len(lua_text)} znaków Lua\n")

    # 2. Parsuj bloki kart
    print("2. Parsowanie kart...")
    blocks = extract_lua_blocks(lua_text)
    print(f"   Znaleziono {len(blocks)} bloków\n")

    cards_by_tab: dict[str, list] = {}
    all_names = []

    # Pomiń wzorce z komentarzy Lua (zawierają $ lub {)
    blocks = [(k, b) for k, b in blocks if "$" not in k and "{" not in k]
    print(f"   Po filtracji: {len(blocks)} prawdziwych kart\n")

    for card_key, block in blocks:
        card = parse_card_block(block)
        if "Name" not in card:
            card["Name"] = card_key

        types = card.get("Types", {})
        tab = determine_tab(types)

        if tab not in cards_by_tab:
            cards_by_tab[tab] = []
        cards_by_tab[tab].append(card)
        all_names.append(card_key)

    print(f"   Taby: { {k: len(v) for k, v in cards_by_tab.items()} }\n")

    # 3. Pobierz URL obrazków
    print("3. Pobieranie URL obrazków...")
    image_urls = fetch_image_urls(all_names)
    print(f"   Pobrano {len(image_urls)} URL obrazków\n")

    # Dołącz URL obrazków do kart
    for tab_cards in cards_by_tab.values():
        for card in tab_cards:
            name = card.get("Name", "")
            card["ImageURL"] = image_urls.get(name, image_urls.get(card.get("UniqueName", ""), ""))

    # 4. Zapisz do Google Sheets
    print("4. Łączenie z Google Sheets...")
    client = get_sheets_client()
    spreadsheet = client.open_by_key(SHEET_ID)
    print("   Połączono!\n")

    print("5. Zapis do tabów...")
    for tab_name, cards in cards_by_tab.items():
        write_tab(spreadsheet, tab_name, cards)

    print(f"\n✅ Gotowe! Zapisano {sum(len(v) for v in cards_by_tab.values())} kart do {len(cards_by_tab)} tabów.")
    print(f"   Sheets: https://docs.google.com/spreadsheets/d/{SHEET_ID}")


if __name__ == "__main__":
    main()
