import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    'klein_tools', Path(__file__).resolve().parents[1] / 'synthia-server/aion/KleinTools.py')
tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tools)


class KleinEvidenceTests(unittest.TestCase):
    def test_every_tool_mode_returns_evidence_or_explicitly_fails(self):
        for name in ('DISEMINER', 'AUTOLING', 'AUTOCODER', 'MORPH',
                     'DISCRIMINATOR', 'ROUTER', 'GENERATOR', 'STORYTELLER'):
            tool = getattr(tools, name)()
            for dimension in tools.Dimension:
                with self.subTest(tool=name, dimension=dimension):
                    tool.arise(dimension)
                    try:
                        result = tool.operate('I need help with my app.')
                    except NotImplementedError as error:
                        self.assertIn('no result was produced', str(error))
                    else:
                        self.assertEqual(result['status'], 'observed')
                        self.assertEqual(result['semantic_status'], 'unresolved')
                        self.assertIsInstance(result['evidence'], dict)

    def test_decomposition_depends_on_input(self):
        tool = tools.DISEMINER()
        tool.arise(tools.Dimension.EVOLUTION)
        self.assertEqual(tool.operate('one two')['evidence']['parts'], ['one', 'two'])
        self.assertEqual(tool.operate({'a': 1})['evidence']['parts'], [{'key': 'a', 'value': 1}])

    def test_language_observations_preserve_source_spans(self):
        tool = tools.AUTOLING()
        tool.arise(tools.Dimension.EVOLUTION)
        text = "I can't go!"
        result = tool.operate(text)['evidence']
        for token in result['tokens']:
            self.assertEqual(text[token['start']:token['end']], token['text'])
        self.assertEqual(result['word_count'], 3)
        self.assertIsNone(result['language'])
        self.assertIsNone(result['semantic_interpretation'])

    def test_fingerprint_is_stable_and_content_dependent(self):
        tool = tools.DISEMINER()
        tool.arise(tools.Dimension.SPACE)
        self.assertEqual(tool.operate({'a': 1, 'b': 2}), tool.operate({'b': 2, 'a': 1}))
        self.assertNotEqual(tool.operate('first'), tool.operate('second'))

    def test_grammar_and_validity_never_claim_success(self):
        for name, dimension in [('AUTOLING', tools.Dimension.DESIGN),
                                ('DISCRIMINATOR', tools.Dimension.DESIGN),
                                ('AUTOCODER', tools.Dimension.MOVEMENT)]:
            tool = getattr(tools, name)()
            tool.arise(dimension)
            with self.assertRaises(NotImplementedError):
                tool.operate('unverified input')


if __name__ == '__main__':
    unittest.main()
