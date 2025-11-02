"""
Engines: Specialized processing organs of the ERN.
Geometric transformations and perception rendering.
"""

from .bioenergetic_geometry_engine import (
    FIELD_PERCEPTION,
    ELEMENT_ARCHITECTURE,
    generate_GAN_prompt,
    generate_LLM_tone_filter
)
from .element_codon_shape_geometry import CODON_TO_ELEMENT_MAP
from .fairyganmatter_engine import (
    FairyGANmatter,
    PerceptionModality,
    UserPerceptionProfile,
    infer_perception_profile
)

__all__ = [
    'FIELD_PERCEPTION',
    'ELEMENT_ARCHITECTURE',
    'generate_GAN_prompt',
    'generate_LLM_tone_filter',
    'CODON_TO_ELEMENT_MAP',
    'FairyGANmatter',
    'PerceptionModality',
    'UserPerceptionProfile',
    'infer_perception_profile',
]
