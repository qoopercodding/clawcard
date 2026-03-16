class_name Snowdancer
extends Resource

## Snowdancer - karta jednostki
## Efekt: na końcu tury nakłada Freeze (1) na losowego wroga

@export var card_name: String = "Snowdancer"
@export var attack: int = 2
@export var health: int = 4
@export var effect: String = "Na końcu tury: nałóż Freeze (1) na losowego wroga"


func _init() -> void:
	card_name = "Snowdancer"
	attack = 2
	health = 4
	effect = "Na końcu tury: nałóż Freeze (1) na losowego wroga"


## Wywołaj efekt karty - do podpięcia pod sygnał end_of_turn
func apply_effect(enemies: Array) -> void:
	if enemies.is_empty():
		return
	var target = enemies[randi() % enemies.size()]
	if target.has_method("apply_freeze"):
		target.apply_freeze(1)


func to_string() -> String:
	return "%s | ATK: %d | HP: %d | Efekt: %s" % [card_name, attack, health, effect]
