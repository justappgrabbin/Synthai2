"""
HD-Canonical Gate-Codon Mapping
Source: Ra Uru Hu - Codon Mapping: The Transcription Series (Edinburgh, February 2003)

This mapping binds the 64 I Ching hexagrams (HD gates) to genetic codons via amino acid families.
Each amino acid represents a thematic chemical resonance across multiple gates.

Usage:
    from hd_gate_codon_canonical import HD_GATE_CODON_MAP, AMINO_ACID_FAMILIES
"""

# Full 64-gate to codon mapping (extracted from Ra's teaching)
# Note: Multiple gates can map to the same amino acid family
# Codon notation uses standard genetic code (e.g., "AAA" = Lysine)

AMINO_ACID_FAMILIES = {
    "Alanine": {
        "gates": [57, 48, 18, 46],
        "theme": "Fear, survival alertness, acoustic intuition, lymphatic system",
        "chemistry": "Primal survival - challenge patterns, transform, acoustic sensitivity, serendipity"
    },
    "Arginine": {
        "gates": [10, 38, 35, 17, 21, 51, 25],
        "theme": "Behavior, competition, health (heart/liver/gall), survival tenacity, innocence",
        "chemistry": "Complex bridgeway - competitive drive, control environment, fight for purpose, mental certainty, innocent spirit"
    },
    "Asparagine": {
        "gates": [43, 34],
        "theme": "Insight and power (simple codon, fewer gates)",
        "chemistry": "Mental breakthrough and manifestation energy"
    },
    "Aspartic Acid": {
        "gates": [28, 32],
        "theme": "Risk-taking and continuity",
        "chemistry": "Struggle for meaning and maintaining patterns"
    },
    "Cysteine": {
        "gates": [45, 16],
        "theme": "Gathering and skills",
        "chemistry": "Assembling resources and developing mastery"
    },
    "Glutamine": {
        "gates": [13, 30],
        "theme": "Listening and emotional intensity",
        "chemistry": "Receptivity to others and depth of feeling"
    },
    "Glutamic Acid": {
        "gates": [44, 50],
        "theme": "Coming to meet and values",
        "chemistry": "Pattern recognition and establishing principles"
    },
    "Glycine": {
        "gates": [6, 47, 64, 40],
        "theme": "Friction, realization, confusion, aloneness",
        "chemistry": "Struggle with mental clarity and need for solitude"
    },
    "Histidine": {
        "gates": [49, 55],
        "theme": "Revolution and spirit/abundance",
        "chemistry": "Emotional transformation and melancholic depth"
    },
    "Isoleucine": {
        "gates": [61, 60, 19],
        "theme": "Inner truth, limitation, approach/wanting",
        "chemistry": "Mystery, constraint, and neediness"
    },
    "Leucine": {
        "gates": [42, 3, 27, 24, 20, 23],
        "theme": "Growth, ordering, caring, rationalization, the now, assimilation",
        "chemistry": "Largest amino acid family - diverse survival strategies"
    },
    "Lysine": {
        "gates": [1, 14],
        "theme": "Creative self-expression and power skills",
        "chemistry": "Initiating force and manifesting capability"
    },
    "Methionine": {
        "gates": [41],
        "theme": "Contraction/decrease (START codon - unique)",
        "chemistry": "Fantasy/imagination - initiates new emotional cycles"
    },
    "Phenylalanine": {
        "gates": [8, 2],
        "theme": "Contribution and direction of self",
        "chemistry": "Individual contribution and self-orientation"
    },
    "Proline": {
        "gates": [37, 63, 22, 36, 12],
        "theme": "Friendship, doubt, grace, crisis, caution/articulation",
        "chemistry": "Emotional bargaining and navigating uncertainty, language of love"
    },
    "Serine": {
        "gates": [58, 54, 53, 39, 52, 15],
        "theme": "Vitality, ambition, development, provocation, stillness, extremes",
        "chemistry": "Complex expression energy - largest gene key family"
    },
    "Terminators": {
        "gates": [33, 56, 31],  # Note: Gate 17 also listed as terminator in some sources
        "theme": "Privacy, stimulation, leading (STOP codons)",
        "chemistry": "Endings, transitions, mutation triggers"
    },
    "Threonine": {
        "gates": [9, 5, 26, 11],
        "theme": "Focus, fixed rhythms, taming power, ideas",
        "chemistry": "Concentration and pattern maintenance"
    },
    "Tryptophan": {
        "gates": [35],
        "theme": "Progress/change (rare amino acid)",
        "chemistry": "Advancement and transformation - mutative"
    },
    "Tyrosine": {
        "gates": [31, 62],
        "theme": "Leading and detail",
        "chemistry": "Influence through precision"
    },
    "Valine": {
        "gates": [59, 29, 4, 7],
        "theme": "Sexuality, perseverance, formulization, role of self",
        "chemistry": "Intimacy and strategic positioning"
    }
}

# Build reverse lookup: gate → amino acid
GATE_TO_AMINO_ACID = {}
for amino_acid, data in AMINO_ACID_FAMILIES.items():
    for gate in data["gates"]:
        GATE_TO_AMINO_ACID[gate] = amino_acid

# Standard genetic code: codon triplet → amino acid
# (This is biological, not all codons are actively used in HD system)
GENETIC_CODE = {
    # Alanine (Ala/A) - GCT, GCC, GCA, GCG
    "GCT": "Alanine", "GCC": "Alanine", "GCA": "Alanine", "GCG": "Alanine",
    
    # Arginine (Arg/R) - CGT, CGC, CGA, CGG, AGA, AGG
    "CGT": "Arginine", "CGC": "Arginine", "CGA": "Arginine", "CGG": "Arginine",
    "AGA": "Arginine", "AGG": "Arginine",
    
    # Asparagine (Asn/N) - AAT, AAC
    "AAT": "Asparagine", "AAC": "Asparagine",
    
    # Aspartic Acid (Asp/D) - GAT, GAC
    "GAT": "Aspartic Acid", "GAC": "Aspartic Acid",
    
    # Cysteine (Cys/C) - TGT, TGC
    "TGT": "Cysteine", "TGC": "Cysteine",
    
    # Glutamine (Gln/Q) - CAA, CAG
    "CAA": "Glutamine", "CAG": "Glutamine",
    
    # Glutamic Acid (Glu/E) - GAA, GAG
    "GAA": "Glutamic Acid", "GAG": "Glutamic Acid",
    
    # Glycine (Gly/G) - GGT, GGC, GGA, GGG
    "GGT": "Glycine", "GGC": "Glycine", "GGA": "Glycine", "GGG": "Glycine",
    
    # Histidine (His/H) - CAT, CAC
    "CAT": "Histidine", "CAC": "Histidine",
    
    # Isoleucine (Ile/I) - ATT, ATC, ATA
    "ATT": "Isoleucine", "ATC": "Isoleucine", "ATA": "Isoleucine",
    
    # Leucine (Leu/L) - TTA, TTG, CTT, CTC, CTA, CTG
    "TTA": "Leucine", "TTG": "Leucine", "CTT": "Leucine", 
    "CTC": "Leucine", "CTA": "Leucine", "CTG": "Leucine",
    
    # Lysine (Lys/K) - AAA, AAG
    "AAA": "Lysine", "AAG": "Lysine",
    
    # Methionine (Met/M) - ATG (START codon)
    "ATG": "Methionine",
    
    # Phenylalanine (Phe/F) - TTT, TTC
    "TTT": "Phenylalanine", "TTC": "Phenylalanine",
    
    # Proline (Pro/P) - CCT, CCC, CCA, CCG
    "CCT": "Proline", "CCC": "Proline", "CCA": "Proline", "CCG": "Proline",
    
    # Serine (Ser/S) - TCT, TCC, TCA, TCG, AGT, AGC
    "TCT": "Serine", "TCC": "Serine", "TCA": "Serine", "TCG": "Serine",
    "AGT": "Serine", "AGC": "Serine",
    
    # Threonine (Thr/T) - ACT, ACC, ACA, ACG
    "ACT": "Threonine", "ACC": "Threonine", "ACA": "Threonine", "ACG": "Threonine",
    
    # Tryptophan (Trp/W) - TGG
    "TGG": "Tryptophan",
    
    # Tyrosine (Tyr/Y) - TAT, TAC
    "TAT": "Tyrosine", "TAC": "Tyrosine",
    
    # Valine (Val/V) - GTT, GTC, GTA, GTG
    "GTT": "Valine", "GTC": "Valine", "GTA": "Valine", "GTG": "Valine",
    
    # STOP codons (Terminators)
    "TAA": "STOP", "TAG": "STOP", "TGA": "STOP"
}

# Assign specific codons to gates based on amino acid family
# This uses a deterministic distribution within each family
HD_GATE_CODON_MAP = {}

# Manual assignments based on HD wheel positions and Ra's teaching hints
# Gates are assigned codons from their amino acid family's genetic code options

# Alanine family (4 gates, 4 codons)
HD_GATE_CODON_MAP[57] = "GCT"  # Acoustic intuition
HD_GATE_CODON_MAP[48] = "GCC"  # Depth/Well
HD_GATE_CODON_MAP[18] = "GCA"  # Challenge/Correction
HD_GATE_CODON_MAP[46] = "GCG"  # Serendipity/Love of Body

# Arginine family (7 gates, 6 codons - Gate 25 shares with another gate)
HD_GATE_CODON_MAP[10] = "CGT"  # Behavior/Love of Self
HD_GATE_CODON_MAP[38] = "CGC"  # Fighter/Opposition
HD_GATE_CODON_MAP[35] = "CGA"  # Progress (also Tryptophan in some systems)
HD_GATE_CODON_MAP[17] = "CGG"  # Opinion (also Terminator in some systems)
HD_GATE_CODON_MAP[21] = "AGA"  # Control/Hunter
HD_GATE_CODON_MAP[51] = "AGG"  # Shock/Initiation
HD_GATE_CODON_MAP[25] = "AGA"  # Innocence/Universal Love (shares with 21 - both tribal ego)

# Asparagine family (2 gates, 2 codons)
HD_GATE_CODON_MAP[43] = "AAT"  # Insight/Breakthrough
HD_GATE_CODON_MAP[34] = "AAC"  # Power/Great Power

# Aspartic Acid family (2 gates, 2 codons)
HD_GATE_CODON_MAP[28] = "GAT"  # The Game Player/Risk
HD_GATE_CODON_MAP[32] = "GAC"  # Continuity/Duration

# Cysteine family (2 gates, 2 codons)
HD_GATE_CODON_MAP[45] = "TGT"  # The Gatherer
HD_GATE_CODON_MAP[16] = "TGC"  # Skills/Enthusiasm

# Glutamine family (2 gates, 2 codons)
HD_GATE_CODON_MAP[13] = "CAA"  # The Listener
HD_GATE_CODON_MAP[30] = "CAG"  # Feelings/Clinging Fire

# Glutamic Acid family (2 gates, 2 codons)
HD_GATE_CODON_MAP[44] = "GAA"  # Coming to Meet/Alertness
HD_GATE_CODON_MAP[50] = "GAG"  # Values/The Cauldron

# Glycine family (4 gates, 4 codons)
HD_GATE_CODON_MAP[6] = "GGT"   # Friction/Conflict
HD_GATE_CODON_MAP[47] = "GGC"  # Oppression/Realization
HD_GATE_CODON_MAP[64] = "GGA"  # Before Completion/Confusion
HD_GATE_CODON_MAP[40] = "GGG"  # Deliverance/Aloneness

# Histidine family (2 gates, 2 codons)
HD_GATE_CODON_MAP[49] = "CAT"  # Revolution/Principles
HD_GATE_CODON_MAP[55] = "CAC"  # Spirit/Abundance

# Isoleucine family (3 gates, 3 codons)
HD_GATE_CODON_MAP[61] = "ATT"  # Inner Truth/Mystery
HD_GATE_CODON_MAP[60] = "ATC"  # Limitation/Acceptance
HD_GATE_CODON_MAP[19] = "ATA"  # Approach/Wanting

# Leucine family (6 gates, 6 codons)
HD_GATE_CODON_MAP[42] = "TTA"  # Growth/Increase
HD_GATE_CODON_MAP[3] = "TTG"   # Ordering/Difficulty
HD_GATE_CODON_MAP[27] = "CTT"  # Caring/Nourishment
HD_GATE_CODON_MAP[24] = "CTC"  # Rationalization/Return
HD_GATE_CODON_MAP[20] = "CTA"  # The Now/Contemplation
HD_GATE_CODON_MAP[23] = "CTG"  # Assimilation/Splitting Apart

# Lysine family (2 gates, 2 codons)
HD_GATE_CODON_MAP[1] = "AAA"   # Creative Self-Expression
HD_GATE_CODON_MAP[14] = "AAG"  # Power Skills/Possession

# Methionine (1 gate, 1 codon - START)
HD_GATE_CODON_MAP[41] = "ATG"  # Contraction/Fantasy (START codon)

# Phenylalanine family (2 gates, 2 codons)
HD_GATE_CODON_MAP[8] = "TTT"   # Contribution/Holding Together
HD_GATE_CODON_MAP[2] = "TTC"   # Direction of Self/Receptive

# Proline family (5 gates, 4 codons - Gate 12 shares with another gate)
HD_GATE_CODON_MAP[37] = "CCT"  # Friendship/Family
HD_GATE_CODON_MAP[63] = "CCC"  # Doubt/After Completion
HD_GATE_CODON_MAP[22] = "CCA"  # Grace/Openness
HD_GATE_CODON_MAP[36] = "CCG"  # Crisis/Darkening Light
HD_GATE_CODON_MAP[12] = "CCA"  # Caution/Articulation (shares with 22 - both emotional to throat)

# Serine family (6 gates, 6 codons)
HD_GATE_CODON_MAP[58] = "TCT"  # Vitality/Joyousness
HD_GATE_CODON_MAP[54] = "TCC"  # Ambition/Marrying Maiden
HD_GATE_CODON_MAP[53] = "TCA"  # Development/Starting
HD_GATE_CODON_MAP[39] = "TCG"  # Provocation/Obstruction
HD_GATE_CODON_MAP[52] = "AGT"  # Stillness/Keeping Still
HD_GATE_CODON_MAP[15] = "AGC"  # Extremes/Modesty

# Terminators (3 gates, 3 STOP codons)
HD_GATE_CODON_MAP[33] = "TAA"  # Privacy/Retreat (STOP)
HD_GATE_CODON_MAP[56] = "TAG"  # Stimulation/Wanderer (STOP)
HD_GATE_CODON_MAP[31] = "TAT"  # Leading/Influence (Tyrosine - not STOP in this mapping)

# Threonine family (4 gates, 4 codons)
HD_GATE_CODON_MAP[9] = "ACT"   # Focus/Taming Power Small
HD_GATE_CODON_MAP[5] = "ACC"   # Fixed Rhythms/Waiting
HD_GATE_CODON_MAP[26] = "ACA"  # The Egoist/Taming Power Great
HD_GATE_CODON_MAP[11] = "ACG"  # Ideas/Peace

# Tryptophan (1 gate, 1 codon - rare) - overrides Arginine for Gate 35
HD_GATE_CODON_MAP[35] = "TGG"  # Progress

# Tyrosine family (2 gates, 2 codons)
# HD_GATE_CODON_MAP[31] = "TAT"  # Leading (already assigned above)
HD_GATE_CODON_MAP[62] = "TAC"  # Detail/Preponderance Small

# Valine family (4 gates, 4 codons)
HD_GATE_CODON_MAP[59] = "GTT"  # Sexuality/Dispersion
HD_GATE_CODON_MAP[29] = "GTC"  # Perseverance/Abysmal
HD_GATE_CODON_MAP[4] = "GTA"   # Formulization/Youthful Folly
HD_GATE_CODON_MAP[7] = "GTG"   # Role of Self/Army

# Verify all 64 gates are mapped
assert len(HD_GATE_CODON_MAP) == 64, f"Mapping incomplete: {len(HD_GATE_CODON_MAP)} gates mapped"

# Build reverse lookup: codon → gates
CODON_TO_GATES = {}
for gate, codon in HD_GATE_CODON_MAP.items():
    if codon not in CODON_TO_GATES:
        CODON_TO_GATES[codon] = []
    CODON_TO_GATES[codon].append(gate)

if __name__ == "__main__":
    # Validation and display
    print("HD Gate-Codon Canonical Mapping (64 gates)")
    print("=" * 60)
    
    for amino_acid, data in sorted(AMINO_ACID_FAMILIES.items()):
        print(f"\n{amino_acid}:")
        print(f"  Theme: {data['theme']}")
        print(f"  Gates: {sorted(data['gates'])}")
        gate_codons = [(g, HD_GATE_CODON_MAP[g]) for g in sorted(data['gates'])]
        print(f"  Codons: {dict(gate_codons)}")
    
    print(f"\n\nTotal gates mapped: {len(HD_GATE_CODON_MAP)}")
    print(f"Unique codons used: {len(set(HD_GATE_CODON_MAP.values()))}")
