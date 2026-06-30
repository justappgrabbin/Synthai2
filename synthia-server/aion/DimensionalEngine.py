"""
AION Dimensional Question Engine
Asks questions in dimensional order, not generic who/what/where/when/why/how
Each dimension has its own physics of inquiry
"""

from typing import List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass

class Dimension(Enum):
    MOVEMENT = "movement"      # WHERE - measure, name, place
    EVOLUTION = "evolution"    # WHAT - dismember, identify, remember
    BEING = "being"           # WHEN - time, collaborate, genetics
    DESIGN = "design"         # WHY - structure, progress, manifest
    SPACE = "space"           # WHO - presence, communicate, think

@dataclass
class Question:
    dimension: Dimension
    primary_word: str          # WHERE, WHAT, WHEN, WHY, WHO
    sub_questions: List[str]  # The chain of inquiry
    context: Dict[str, Any]    # What triggered this question
    answer: Optional[str] = None
    confidence: float = 0.0

class DimensionalQuestionEngine:
    """
    The lawful questioning system.
    Not generic. Dimensionally ordered.
    """

    def __init__(self):
        self.dimensions = {
            Dimension.MOVEMENT: {
                'primary': 'WHERE',
                'keynote': 'I Define',
                'chain': ['Energy', 'Creation', 'Seeing', 'Landscape', 'Environment'],
                'questions': [
                    'Where does this go?',
                    'Is it measuring anything?',
                    'Is it naming anything?',
                    'What is its position?',
                    'What environment does it belong to?'
                ]
            },
            Dimension.EVOLUTION: {
                'primary': 'WHAT',
                'keynote': 'I Remember',
                'chain': ['Gravity', 'Memory', 'Taste', 'Love', 'Light'],
                'questions': [
                    'What is this?',
                    'What are its parts?',
                    'What was it before?',
                    'What will it become?',
                    'What does it create?'
                ]
            },
            Dimension.BEING: {
                'primary': 'WHEN',
                'keynote': 'I Am',
                'chain': ['Matter', 'Touch', 'Sex', 'Survival'],
                'questions': [
                    'When does this happen?',
                    'When did it start?',
                    'When will it end?',
                    'What is its timing?',
                    'What is its genetic clock?'
                ]
            },
            Dimension.DESIGN: {
                'primary': 'WHY',
                'keynote': 'I Design',
                'chain': ['Structure', 'Progress', 'Smelt', 'Life', 'Art'],
                'questions': [
                    'Why does this exist?',
                    'Why this structure?',
                    'Why this progress?',
                    'What is its purpose?',
                    'What art does it create?'
                ]
            },
            Dimension.SPACE: {
                'primary': 'WHO',
                'keynote': 'I Think',
                'chain': ['Form', 'Illusion', 'Hearing', 'Music', 'Freedom'],
                'questions': [
                    'Who is this for?',
                    'Who created this?',
                    'Who experiences this?',
                    'What is its presence?',
                    'What freedom does it allow?'
                ]
            }
        }
        self.question_history = []
        self.learning_patterns = {}

    def analyze_input(self, content: str, metadata: Dict[str, Any]) -> Dict[Dimension, float]:
        """
        Determine which dimension is primary for this input.
        Returns dimensional signature: {Dimension: weight}
        """
        signature = {dim: 0.0 for dim in Dimension}
        text = (content + " " + str(metadata)).lower()

        # Movement indicators
        if any(kw in text for kw in ['where', 'position', 'location', 'place', 'environment', 'measure']):
            signature[Dimension.MOVEMENT] += 0.3
        if any(kw in text for kw in ['energy', 'creation', 'seeing', 'landscape']):
            signature[Dimension.MOVEMENT] += 0.2

        # Evolution indicators
        if any(kw in text for kw in ['what', 'part', 'component', 'memory', 'remember', 'identify']):
            signature[Dimension.EVOLUTION] += 0.3
        if any(kw in text for kw in ['gravity', 'taste', 'love', 'light', 'change']):
            signature[Dimension.EVOLUTION] += 0.2

        # Being indicators
        if any(kw in text for kw in ['when', 'time', 'time', 'clock', 'genetic', 'biology']):
            signature[Dimension.BEING] += 0.3
        if any(kw in text for kw in ['matter', 'touch', 'sex', 'survival', 'body']):
            signature[Dimension.BEING] += 0.2

        # Design indicators
        if any(kw in text for kw in ['why', 'purpose', 'structure', 'progress', 'design']):
            signature[Dimension.DESIGN] += 0.3
        if any(kw in text for kw in ['smelt', 'life', 'art', 'manifest', 'create']):
            signature[Dimension.DESIGN] += 0.2

        # Space indicators
        if any(kw in text for kw in ['who', 'person', 'identity', 'presence', 'think']):
            signature[Dimension.SPACE] += 0.3
        if any(kw in text for kw in ['form', 'illusion', 'hearing', 'music', 'freedom']):
            signature[Dimension.SPACE] += 0.2

        # Normalize
        total = sum(signature.values())
        if total > 0:
            signature = {k: v/total for k, v in signature.items()}

        return signature

    def generate_questions(self, dimension: Dimension, context: Dict[str, Any]) -> Question:
        """
        Generate questions for a specific dimension.
        """
        dim_data = self.dimensions[dimension]

        # Customize questions based on context
        customized = []
        for q in dim_data['questions']:
            # Inject context-specific details
            if '{filename}' in q:
                q = q.replace('{filename}', context.get('filename', 'this'))
            if '{type}' in q:
                q = q.replace('{type}', context.get('type', 'file'))
            customized.append(q)

        return Question(
            dimension=dimension,
            primary_word=dim_data['primary'],
            sub_questions=customized,
            context=context
        )

    def ask_dimensional_sequence(self, content: str, metadata: Dict[str, Any]) -> List[Question]:
        """
        Ask questions in dimensional order.
        Primary dimension first, then others in order.
        """
        # Determine primary dimension
        signature = self.analyze_input(content, metadata)
        primary_dim = max(signature, key=signature.get)

        # Generate sequence: primary first, then others in dimensional order
        sequence = [primary_dim]
        for dim in Dimension:
            if dim != primary_dim:
                sequence.append(dim)

        questions = []
        for dim in sequence:
            if signature[dim] > 0.1:  # Only ask if dimension is relevant
                q = self.generate_questions(dim, metadata)
                questions.append(q)

        return questions

    def record_answer(self, question: Question, answer: str, confidence: float = 0.5):
        """
        Record answer and learn from it.
        """
        question.answer = answer
        question.confidence = confidence
        self.question_history.append(question)

        # Update learning patterns
        dim_key = question.dimension.value
        if dim_key not in self.learning_patterns:
            self.learning_patterns[dim_key] = []
        self.learning_patterns[dim_key].append({
            'question': question.sub_questions[0],
            'answer': answer,
            'confidence': confidence
        })

    def self_update(self):
        """
        Update question templates based on learning history.
        """
        for dim_key, patterns in self.learning_patterns.items():
            if len(patterns) > 10:
                # Analyze which questions yield high confidence
                high_conf = [p for p in patterns if p['confidence'] > 0.7]
                if high_conf:
                    # Refine questions to be more like high-confidence ones
                    self._refine_questions(dim_key, high_conf)

    def _refine_questions(self, dimension_key: str, high_conf_patterns: List[Dict]):
        """
        Refine question templates based on successful patterns.
        """
        # Extract common patterns from high-confidence answers
        common_words = self._extract_common_words([p['answer'] for p in high_conf_patterns])

        # Update question templates to include these patterns
        dim = Dimension(dimension_key)
        current_questions = self.dimensions[dim]['questions']

        # Add new questions based on learned patterns
        for word in common_words[:3]:
            new_q = f"What is the relationship between {word} and the {self.dimensions[dim]['primary'].lower()}?"
            if new_q not in current_questions:
                current_questions.append(new_q)

    def _extract_common_words(self, texts: List[str]) -> List[str]:
        """Extract most common meaningful words from texts."""
        from collections import Counter
        words = []
        for text in texts:
            words.extend(text.lower().split())
        # Filter out common stop words
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of', 'and', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'}
        filtered = [w for w in words if w not in stop_words and len(w) > 3]
        return [word for word, count in Counter(filtered).most_common(10)]


class DimensionalAnalyzer:
    """
    Analyzes inputs and maps them to dimensional structure.
    """

    def __init__(self):
        self.engine = DimensionalQuestionEngine()

    def analyze_file(self, content: str, filename: str, file_type: str) -> Dict[str, Any]:
        """
        Complete dimensional analysis of a file.
        """
        metadata = {
            'filename': filename,
            'type': file_type,
            'size': len(content),
            'timestamp': self._get_timestamp()
        }

        # Get dimensional signature
        signature = self.engine.analyze_input(content, metadata)

        # Generate questions
        questions = self.engine.ask_dimensional_sequence(content, metadata)

        return {
            'signature': signature,
            'questions': questions,
            'primary_dimension': max(signature, key=signature.get),
            'metadata': metadata
        }

    def _get_timestamp(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()


# Export
__all__ = ['DimensionalQuestionEngine', 'DimensionalAnalyzer', 'Dimension', 'Question']
