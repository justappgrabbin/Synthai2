extends Node
# Autoload singleton. Loads JSON behavior definitions from /data/behaviors

var _actions: Array = []

func _ready() -> void:
    _load_actions()

func _load_actions() -> void:
    _actions.clear()
    var dir := DirAccess.open("res://../data/behaviors")
    if dir:
        dir.list_dir_begin()
        var file_name = dir.get_next()
        while file_name != "":
            if file_name.ends_with(".json"):
                var path = "res://../data/behaviors/%s" % file_name
                var json_text = FileAccess.get_file_as_string(path)
                var data = JSON.parse_string(json_text)
                if typeof(data) == TYPE_DICTIONARY:
                    _actions.append(data)
                elif typeof(data) == TYPE_ARRAY:
                    for it in data:
                        _actions.append(it)
            file_name = dir.get_next()
        dir.list_dir_end()

func get_available_actions() -> Array:
    return _actions
