@tool
extends EditorScript

## Uruchom: otwórz ten plik w Script Editorze → File → Run (Ctrl+Shift+X)
##
## Skaluje wartości UI z pixelart (256x144) do 1920x1080.
## Mnożnik: 7.5
##
## Co skaluje:
##   custom_minimum_size = Vector2(x, y)   — jeśli x lub y < MAX_SMALL
##   offset_left/right/top/bottom = N      — jeśli |N| > 0 i < MAX_SMALL
##   theme_override_constants/separation   — jeśli > 0 i < MAX_SMALL
##
## Co POMIJA:
##   anchor_* (0.0/1.0 — nie piksele)
##   Wartości == 0.0
##   Wartości >= MAX_SMALL (już przeskalowane)

const SCALE := 7.5
const MAX_SMALL := 200.0

const TARGET_SCENES := [
	"res://scenes/ui/stats_ui.tscn",
	"res://scenes/ui/intent_ui.tscn",
	"res://scenes/ui/health_ui.tscn",
	"res://scenes/ui/gold_ui.tscn",
	"res://scenes/ui/status_view.tscn",
	"res://scenes/ui/status_tooltip.tscn",
	"res://scenes/ui/card_pile_opener.tscn",
	"res://scenes/ui/card_menu_ui.tscn",
	"res://scenes/ui/main_menu.tscn",
	"res://scenes/ui/character_selector.tscn",
]

const TARGET_DIRS := [
	"res://scenes/shop/",
	"res://scenes/campfire/",
	"res://scenes/treasure/",
	"res://scenes/event_rooms/",
]


func _run() -> void:
	print("=== UIScale Rescaler START ===")
	var total_files := 0
	var total_changes := 0

	for path in TARGET_SCENES:
		var n := _process_file(path)
		total_changes += n
		if n > 0:
			total_files += 1

	for dir_path in TARGET_DIRS:
		var dir := DirAccess.open(dir_path)
		if not dir:
			print("SKIP dir (nie znaleziono): " + dir_path)
			continue
		dir.list_dir_begin()
		var fname := dir.get_next()
		while fname != "":
			if fname.ends_with(".tscn"):
				var n := _process_file(dir_path + fname)
				total_changes += n
				if n > 0:
					total_files += 1
			fname = dir.get_next()

	print("=== KONIEC: %d zmian w %d plikach ===" % [total_changes, total_files])


func _process_file(path: String) -> int:
	var fa := FileAccess.open(path, FileAccess.READ)
	if not fa:
		print("  SKIP (brak pliku): " + path)
		return 0

	var text := fa.get_as_text()
	fa.close()

	var out := text
	var n := 0

	# custom_minimum_size = Vector2(x, y)
	var re_size := RegEx.new()
	re_size.compile("custom_minimum_size = Vector2\\((\\d+\\.?\\d*), (\\d+\\.?\\d*)\\)")
	for m in re_size.search_all(out):
		var x := m.get_string(1).to_float()
		var y := m.get_string(2).to_float()
		if x < MAX_SMALL or y < MAX_SMALL:
			var nx := x * SCALE if x < MAX_SMALL else x
			var ny := y * SCALE if y < MAX_SMALL else y
			var old_s := m.get_string()
			var new_s := "custom_minimum_size = Vector2(%s, %s)" % [_f(nx), _f(ny)]
			if old_s != new_s:
				out = out.replace(old_s, new_s)
				n += 1

	# offset_left/right/top/bottom = N
	var re_off := RegEx.new()
	re_off.compile("(offset_(?:left|right|top|bottom)) = (-?\\d+\\.?\\d*)")
	for m in re_off.search_all(out):
		var val := m.get_string(2).to_float()
		if val != 0.0 and absf(val) < MAX_SMALL:
			var nv := val * SCALE
			var old_s := m.get_string()
			var new_s := "%s = %s" % [m.get_string(1), _f(nv)]
			if old_s != new_s:
				out = out.replace(old_s, new_s)
				n += 1

	# theme_override_constants/separation = N
	var re_sep := RegEx.new()
	re_sep.compile("(theme_override_constants/separation) = (\\d+\\.?\\d*)")
	for m in re_sep.search_all(out):
		var val := m.get_string(2).to_float()
		if val > 0.0 and val < MAX_SMALL:
			var nv := val * SCALE
			var old_s := m.get_string()
			var new_s := "%s = %s" % [m.get_string(1), _f(nv)]
			if old_s != new_s:
				out = out.replace(old_s, new_s)
				n += 1

	if n > 0:
		var fw := FileAccess.open(path, FileAccess.WRITE)
		fw.store_string(out)
		fw.close()
		print("  [OK] %s  (%d zmian)" % [path, n])

	return n


func _f(v: float) -> String:
	# Godot .tscn format: całkowite bez .0 jeśli round, inaczej 1 miejsce
	if is_equal_approx(v, roundf(v)):
		return "%d.0" % int(roundf(v))
	return "%.1f" % v
