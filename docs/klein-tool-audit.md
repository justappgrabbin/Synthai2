# Klein tool execution audit

The eight exported tools remain available under their existing names. All forty
dimensional entry points were checked. Legacy canned outputs have been removed.

DISEMINER supports JSON input measurement, text/list/object decomposition,
structural observations, and a stable SHA-256 content fingerprint. AUTOLING
supports text token spans and word counts. These are observations, not validated
semantic understanding, person identification, language detection, or NSNF mapping.

All other operations raise `NotImplementedError` with an explicit explanation.
They must not be reported as successful builds, grammar validation, generated
artifacts, transformed identities, routing, or judgments. This change disables
unsupported behavior; it does not complete those algorithms or connect them to
Synthia's conversation pipeline. Callers must surface these errors as unavailable.

Run `python -m unittest discover -s tests -p 'test_klein_tools.py'` to check all
forty tool modes and verify input-dependent evidence and explicit failures.
