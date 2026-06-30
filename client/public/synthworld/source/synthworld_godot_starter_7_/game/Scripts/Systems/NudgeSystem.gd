extends Node
# Autoload singleton. In a later step, apply world nudges to agents.

var nudges: Array = []

func _ready() -> void:
    var path = "res://../data/nudges.json"
    if FileAccess.file_exists(path):
        var json_text = FileAccess.get_file_as_string(path)
        var data = JSON.parse_string(json_text)
        if typeof(data) == TYPE_ARRAY:
            nudges = data
