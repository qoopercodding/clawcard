extends Node

## Globalne skalowanie UI.
## Bazowy viewport: 1920x1080, stretch_mode: canvas_items.
## Elementy UI były projektowane w 256x144 → mnożnik 7.5x (1920/256).
## content_scale_factor skaluje wszystkie Control nodes na poziomie canvas transform.
## Nie rusza anchors, kontenerów, size_flags, theme, fontów.

const BASE_PIXELART_WIDTH := 256.0
const VIEWPORT_WIDTH := 1920.0

## 7.5 — stały dla 1920px base. Zmień tylko jeśli zmieniasz viewport.
const UI_SCALE: float = VIEWPORT_WIDTH / BASE_PIXELART_WIDTH

## Rozmiar karty w pixelach (base, przed skalowaniem)
const CARD_SIZE := Vector2(100, 120)

## Font size dla tooltipów i opisów kart (przed skalowaniem)
const CARD_FONT_SIZE := 14
const SMALL_FONT_SIZE := 11
const HEADER_FONT_SIZE := 18


func _ready() -> void:
	get_window().content_scale_factor = UI_SCALE
	print("[UIScale] content_scale_factor = ", UI_SCALE)
