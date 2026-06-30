
extends Node3D

const DUMMY_DAMAGE_INTERVAL := 3.0
@onready var props_root := $Props
var _timer := 0.0

func _ready() -> void:
    # Initial prop
    var tree = load("res://Scenes/Props/Tree.tscn").instantiate()
    props_root.add_child(tree)
    tree.global_transform.origin = Vector3(5, 0, 5)

func _process(delta: float) -> void:
    _timer += delta
    if _timer >= DUMMY_DAMAGE_INTERVAL:
        _timer = 0.0
        var damaged = _get_random_prop()
        if damaged and "damage" in damaged:
            damaged.damage(5)

func _get_random_prop():
    var c = props_root.get_child_count()
    if c == 0:
        return null
    return props_root.get_child(randi() % c)
