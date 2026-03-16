@tool
extends EditorScript

func _run():
	var pool = load("res://characters/warrior/warrior_draftable_cards.tres")
	if not pool:
		print("ERROR: cannot load warrior_draftable_cards.tres")
		return

	var dir = DirAccess.open("res://wildfrost_data/cards/")
	if not dir:
		print("ERROR: cannot open wildfrost_data/cards/")
		return

	var added := 0
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while file_name != "":
		if file_name.ends_with(".tres"):
			var card = load("res://wildfrost_data/cards/" + file_name)
			if card:
				pool.cards.append(card)
				added += 1
				print("Added: " + file_name)
		file_name = dir.get_next()
	dir.list_dir_end()

	ResourceSaver.save(pool, "res://characters/warrior/warrior_draftable_cards.tres")
	print("DONE - added " + str(added) + " cards to pool")
