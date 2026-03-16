class_name TestCard
extends Resource

## Prosta klasa karty do testów
## Pola: name, attack, health

@export var card_name: String = "Test Card"
@export var attack: int = 1
@export var health: int = 3


func _init(p_name: String = "Test Card", p_attack: int = 1, p_health: int = 3) -> void:
	card_name = p_name
	attack = p_attack
	health = p_health


func to_string() -> String:
	return "%s | ATK: %d | HP: %d" % [card_name, attack, health]
