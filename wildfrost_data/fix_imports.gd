@tool
extends EditorScript

func _run():
	var dir = DirAccess.open("res://wildfrost_data/images/")
	var updated := 0
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while file_name != "":
		if file_name.ends_with(".png.import"):
			var path = "C:/Users/Qoope/godot_projects/clawcard_base/wildfrost_data/images/" + file_name
			var f = FileAccess.open(path, FileAccess.READ)
			var content = f.get_as_text()
			f.close()
			if "process/texture_filter" not in content:
				content += "\nprocess/texture_filter=1\n"
				var fw = FileAccess.open(path, FileAccess.WRITE)
				fw.store_string(content)
				fw.close()
				updated += 1
				print("Updated: " + file_name)
		file_name = dir.get_next()
	dir.list_dir_end()
	print("DONE - updated " + str(updated) + " imports")
