"""
I CHING CODON REFERENCE
========================
Complete mapping of 64 codons with traditional hexagram names and meanings.
"""

CODONS = {
    1: {"name": "The Creative", "trigram": "upper"},
    2: {"name": "The Receptive", "trigram": "lower"},
    3: {"name": "Difficulty at the Beginning", "trigram": "lower"},
    4: {"name": "Youthful Folly", "trigram": "upper"},
    5: {"name": "Waiting", "trigram": "upper"},
    6: {"name": "Conflict", "trigram": "upper"},
    7: {"name": "The Army", "trigram": "lower"},
    8: {"name": "Unity of the People", "trigram": "lower"},
    9: {"name": "The Taming Power of the Small", "trigram": "upper"},
    10: {"name": "Treading", "trigram": "upper"},
    11: {"name": "Peace", "trigram": "lower"},
    12: {"name": "Standstill", "trigram": "upper"},
    13: {"name": "Fellowship with Others", "trigram": "upper"},
    14: {"name": "Great Possession", "trigram": "upper"},
    15: {"name": "Unity in Conduct", "trigram": "lower"},
    16: {"name": "Enthusiasm", "trigram": "lower"},
    17: {"name": "Following", "trigram": "lower"},
    18: {"name": "Work on the Decayed", "trigram": "upper"},
    19: {"name": "Approach", "trigram": "lower"},
    20: {"name": "Contemplation", "trigram": "upper"},
    21: {"name": "Biting Through", "trigram": "upper"},
    22: {"name": "Grace", "trigram": "upper"},
    23: {"name": "Wielding Power Descends", "trigram": "upper"},
    24: {"name": "Return", "trigram": "lower"},
    25: {"name": "Innocence", "trigram": "upper"},
    26: {"name": "The Taming Power of the Great", "trigram": "upper"},
    27: {"name": "Nourishment", "trigram": "upper"},
    28: {"name": "Preponderance of the Great", "trigram": "both"},
    29: {"name": "The Abysmal", "trigram": "both"},
    30: {"name": "The Clinging", "trigram": "both"},
    31: {"name": "Influence", "trigram": "lower"},
    32: {"name": "Duration", "trigram": "both"},
    33: {"name": "Retreat", "trigram": "upper"},
    34: {"name": "The Power of the Great", "trigram": "upper"},
    35: {"name": "Progress", "trigram": "lower"},
    36: {"name": "Darkening of the Light", "trigram": "lower"},
    37: {"name": "The Family", "trigram": "upper"},
    38: {"name": "Opposition", "trigram": "upper"},
    39: {"name": "Obstruction", "trigram": "upper"},
    40: {"name": "Deliverance", "trigram": "lower"},
    41: {"name": "Decrease", "trigram": "upper"},
    42: {"name": "Increase", "trigram": "lower"},
    43: {"name": "Breakthrough", "trigram": "upper"},
    44: {"name": "Coming to Meet", "trigram": "upper"},
    45: {"name": "Gathering Together", "trigram": "lower"},
    46: {"name": "Pushing Upward", "trigram": "lower"},
    47: {"name": "Oppression", "trigram": "upper"},
    48: {"name": "The Well", "trigram": "upper"},
    49: {"name": "Revolution", "trigram": "upper"},
    50: {"name": "The Cauldron", "trigram": "upper"},
    51: {"name": "The Arousing", "trigram": "both"},
    52: {"name": "Keeping Still", "trigram": "both"},
    53: {"name": "Development", "trigram": "upper"},
    54: {"name": "The Marrying Maiden", "trigram": "upper"},
    55: {"name": "Abundance", "trigram": "upper"},
    56: {"name": "The Wanderer", "trigram": "upper"},
    57: {"name": "The Gentle", "trigram": "both"},
    58: {"name": "The Joyous", "trigram": "both"},
    59: {"name": "Dispersion", "trigram": "upper"},
    60: {"name": "Limitation", "trigram": "lower"},
    61: {"name": "Inner Truth", "trigram": "both"},
    62: {"name": "Preponderance of the Small", "trigram": "both"},
    63: {"name": "After Completion", "trigram": "both"},
    64: {"name": "Before Completion", "trigram": "both"}
}


def get_codon_info(codon: int) -> dict:
    """Get information about a specific codon."""
    return CODONS.get(codon, {"name": "Unknown", "trigram": "unknown"})


def get_codon_name(codon: int) -> str:
    """Get the traditional I Ching name for a codon."""
    return get_codon_info(codon)["name"]


def get_codon_trigram(codon: int) -> str:
    """Get the trigram position for a codon."""
    return get_codon_info(codon)["trigram"]
