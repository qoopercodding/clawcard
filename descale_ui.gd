@tool
extends EditorScript

## Odwrócenie ręcznego skalowania 7.5x → powrót do pixelart 256x144.
## Po tym skrypcie: content_scale_factor = 7.5 w UIScale.gd robi resztę globalnie.
##
## Uruchomienie: Script Editor → File → Run

const SCALE := 7.5
const INV := 1.0 / SCALE  # ~0.1333

func _run() -> void:
	print("=== DESCALE UI START ===")

	var tscn_files := _find_tscn("res://scenes")
	print("Znalezione .tscn: ", tscn_files.size())
	for path in tscn_files:
		_process_tscn(path)

	_process_gd_map_constants()

	print("=== DESCALE UI DONE ===")


# ─── Rekurencyjne szukanie .tscn ─────────────────────────────────────────────

func _find_tscn(dir_path: String) -> Array:
	var result := []
	var dir := DirAccess.open(dir_path)
	if not dir:
		return result
	dir.list_dir_begin()
	var f := dir.get_next()
	while f != "":
		if dir.current_is_dir() and not f.begins_with("."):
			result.append_array(_find_tscn(dir_path + "/" + f))
		elif f.ends_with(".tscn"):
			result.append(dir_path + "/" + f)
		f = dir.get_next()
	dir.list_dir_end()
	return result


# ─── Pliki .tscn ─────────────────────────────────────────────────────────────

func _process_tscn(res_path: String) -> void:
	var abs_path := ProjectSettings.globalize_path(res_path)
	var file := FileAccess.open(abs_path, FileAccess.READ)
	if not file:
		return
	var content := file.get_as_text()
	file.close()
	var original := content

	for prop in ["custom_minimum_size", "size", "position"]:
		content = _descale_v2(content, prop)

	for prop in ["offset_left", "offset_right", "offset_top", "offset_bottom"]:
		content = _descale_f(content, prop)

	for prop in ["radius", "width"]:
		content = _descale_f(content, prop)

	content = _descale_font(content)

	# Jawny scale na spritach pixelartowych
	content = content.replace("scale = Vector2(7.5, 7.5)", "scale = Vector2(1, 1)")

	# PackedVector2Array — outline pokoju na mapie
	content = _descale_packed_v2_array(content)

	if content != original:
		var wf := FileAccess.open(abs_path, FileAccess.WRITE)
		if wf:
			wf.store_string(content)
			wf.close()
			print("  DESCALED: ", res_path)


func _descale_v2(content: String, prop: String) -> String:
	var re := RegEx.new()
	re.compile(prop + r" = Vector2\((-?\d+\.?\d*), (-?\d+\.?\d*)\)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var x := float(m.get_string(1))
		var y := float(m.get_string(2))
		if absf(x) < 6.0 and absf(y) < 6.0:
			continue
		if absf(x) > 2000.0 or absf(y) > 2000.0:
			continue
		var nx := snappedf(x * INV, 0.5)
		var ny := snappedf(y * INV, 0.5)
		result = result.replace(
			m.get_string(0),
			prop + " = Vector2(" + str(nx) + ", " + str(ny) + ")"
		)
	return result


func _descale_f(content: String, prop: String) -> String:
	var re := RegEx.new()
	re.compile(prop + r" = (-?\d+\.?\d*)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var val := float(m.get_string(1))
		if absf(val) < 4.0 or absf(val) > 4000.0:
			continue
		var nv := snappedf(val * INV, 0.5)
		result = result.replace(m.get_string(0), prop + " = " + str(nv))
	return result


func _descale_font(content: String) -> String:
	var re := RegEx.new()
	re.compile(r"font_size = (\d+)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var s := int(m.get_string(1))
		if s <= 30:
			continue
		var ns := maxi(1, roundi(s * INV))
		result = result.replace(m.get_string(0), "font_size = " + str(ns))
	return result


func _descale_packed_v2_array(content: String) -> String:
	var re := RegEx.new()
	re.compile(r"PackedVector2Array\(([^)]+)\)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var raw := m.get_string(1)
		var parts := raw.split(", ")
		var max_abs := 0.0
		var nums: Array[float] = []
		for p in parts:
			var v := float(p.strip_edges())
			nums.append(v)
			if absf(v) > max_abs:
				max_abs = absf(v)
		if max_abs < 20.0:
			continue
		var new_parts: Array[String] = []
		for v in nums:
			new_parts.append(str(snappedf(v * INV, 0.5)))
		result = result.replace(
			m.get_string(0),
			"PackedVector2Array(" + ", ".join(new_parts) + ")"
		)
	return result


# ─── Pliki .gd z hardkodowanymi stałymi pikselowymi ─────────────────────────

func _process_gd_map_constants() -> void:
	_descale_gd_int_consts(
		"res://scenes/map/map_generator.gd",
		["X_DIST", "Y_DIST", "PLACEMENT_RANDOMNESS"]
	)
	_descale_gd_int_consts(
		"res://scenes/map/map.gd",
		["SCROLL_SPEED"]
	)


func _descale_gd_int_consts(res_path: String, const_names: Array) -> void:
	var abs_path := ProjectSettings.globalize_path(res_path)
	var file := FileAccess.open(abs_path, FileAccess.READ)
	if not file:
		return
	var content := file.get_as_text()
	file.close()
	var original := content

	for cname in const_names:
		var re := RegEx.new()
		re.compile(r"(const " + cname + r" := )(\d+)")
		var ms := re.search_all(content)
		for i in range(ms.size() - 1, -1, -1):
			var m := ms[i]
			var val := int(m.get_string(2))
			if val < 8:
				continue
			var nv := maxi(1, roundi(val * INV))
			content = content.replace(
				m.get_string(0),
				m.get_string(1) + str(nv)
			)

	if content != original:
		var wf := FileAccess.open(abs_path, FileAccess.WRITE)
		if wf:
			wf.store_string(content)
			wf.close()
			print("  DESCALED .gd: ", res_path)
