@tool
extends EditorScript

## Rescale UI: pixelart 256x144 -> modern 1920x1080 canvas_items
## SCALE = 7.5x (256*7.5=1920, 144*7.5=1080)
## Uruchom: otwórz ten plik w Script Editorze -> File -> Run

const SCALE := 7.5

func _run() -> void:
	print("=== RESCALE UI START ===")
	var tscn_files := _find_tscn("res://scenes")
	print("Pliki .tscn: ", tscn_files.size())
	for path in tscn_files:
		_process(path)
	print("=== DONE ===")

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

func _process(res_path: String) -> void:
	var abs_path := ProjectSettings.globalize_path(res_path)
	var file := FileAccess.open(abs_path, FileAccess.READ)
	if not file:
		return
	var content := file.get_as_text()
	file.close()
	var original := content
	content = _scale_v2(content, "custom_minimum_size")
	content = _scale_v2(content, "size")
	content = _scale_v2(content, "position")
	content = _scale_f(content, "offset_left")
	content = _scale_f(content, "offset_right")
	content = _scale_f(content, "offset_top")
	content = _scale_f(content, "offset_bottom")
	content = _scale_font(content)
	if content != original:
		var wf := FileAccess.open(abs_path, FileAccess.WRITE)
		if wf:
			wf.store_string(content)
			wf.close()
			print("SCALED: ", res_path)

func _scale_v2(content: String, prop: String) -> String:
	var re := RegEx.new()
	re.compile(prop + r" = Vector2\((-?\d+\.?\d*), (-?\d+\.?\d*)\)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var x := float(m.get_string(1))
		var y := float(m.get_string(2))
		# Pomiń jeśli już duże — próg 200px (wcześniej ręcznie skalowane do ~1280x720)
		if absf(x) > 200 or absf(y) > 200:
			continue
		var nx := snappedf(x * SCALE, 0.5)
		var ny := snappedf(y * SCALE, 0.5)
		result = result.replace(m.get_string(0), prop + " = Vector2(" + str(nx) + ", " + str(ny) + ")")
	return result

func _scale_f(content: String, prop: String) -> String:
	var re := RegEx.new()
	re.compile(prop + r" = (-?\d+\.?\d*)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var val := float(m.get_string(1))
		# Pomiń duże wartości (>300 = już skalowane) i zera
		if absf(val) > 300 or val == 0.0:
			continue
		var nv := snappedf(val * SCALE, 0.5)
		result = result.replace(m.get_string(0), prop + " = " + str(nv))
	return result

func _scale_font(content: String) -> String:
	var re := RegEx.new()
	re.compile(r"font_size = (\d+)")
	var result := content
	var ms := re.search_all(content)
	for i in range(ms.size() - 1, -1, -1):
		var m := ms[i]
		var s := int(m.get_string(1))
		if s > 30:
			continue
		result = result.replace(m.get_string(0), "font_size = " + str(int(s * SCALE)))
	return result
