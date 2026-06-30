extends Node3D

const AGENT_SCENE := preload("res://Scenes/Agents/Agent.tscn")

func _ready() -> void:
    # Spawn one agent in the center
    var agent := AGENT_SCENE.instantiate()
    add_child(agent)
    agent.global_transform.origin = Vector3(0, 0, 0)
