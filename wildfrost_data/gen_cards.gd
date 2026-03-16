@tool
extends EditorScript

func _run():
	var json_file = FileAccess.open("res://wildfrost_data/wildfrost_cards.json", FileAccess.READ)
	if not json_file:
		print("ERROR: cannot open wildfrost_cards.json")
		return
	var json_data = JSON.parse_string(json_file.get_as_text())
	json_file.close()

	var cards = json_data
	var card_script = load("res://custom_resources/card.gd")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://wildfrost_data/cards"))

	for card_data in cards:
		var card = Resource.new()
		card.set_script(card_script)

		var id = card_data.get("_key", "").to_lower().replace(" ", "_").replace("'", "")
		card.id = id
		card.cost = 1
		card.rarity = 0
		card.type = 0
		card.target = 0
		card.exhausts = false

		var img_path = "res://wildfrost_data/images/" + card_data.get("image_filename", "")
		if ResourceLoader.exists(img_path):
			card.icon = load(img_path)

		var desc = card_data.get("desc", "")
		var atk = str(card_data.get("attack", "0"))
		var hp = str(card_data.get("health", "0"))
		var ctr = str(card_data.get("counter", "?"))
		card.tooltip_text = "[b]" + card_data.get("name", id) + "[/b]\n" + desc + "\n[color=#888888]ATK:" + atk + " HP:" + hp + " CTR:" + ctr + "[/color]"

		var save_path = "res://wildfrost_data/cards/" + id + ".tres"
		ResourceSaver.save(card, save_path)
		print("Saved: " + id)

	print("ALL DONE - " + str(cards.size()) + " cards generated")
