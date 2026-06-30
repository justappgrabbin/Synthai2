
# Trigger index for loading modules by keyword

triggers = {
    "spec1": "spec1_calculator.calculate_gate_line_color_tone_base",
    "sentence": "sentence_engine.generate_sentence",
    "cynthia": "cynthia.Cynthia",
    "memory": "memory_engine.MemoryEngine",
    "personality": "personality_engine.PersonalityEngine",
    "learning": "learning_reflector.LearningReflector"
}

def load_module_from_keyword(keyword):
    """Load module path from keyword trigger"""
    return triggers.get(keyword, "No such memory hook.")

def get_all_triggers():
    """Get all available trigger keywords"""
    return list(triggers.keys())
