# Build verification

The app's strict TypeScript check and production build pass locally after fixing
the API call/response contracts, optional snapshot access, Set operations,
duplicate reference keys, astronomy type imports, mounted-app metadata typing,
and missing code-memory operations.

Exact artifact recovery returns the stored original text, including whitespace
and overlapping-chunk boundaries. Artifact IDs disambiguate identical intents,
and recovery respects the stored owner. Cleaned/improved regeneration and
improvisation use the configured AI provider and propagate provider failures.
Generated source is unverified (confidence zero); exact recovery's 100 means
source fidelity, not semantic understanding. Memory remains local to the existing
orchestrator instance, not a new durable cross-session database.

Architecture memory uses the selected activation's available legacy fields
instead of calling a private method with an incomplete user signature. These
existing legacy address and codon formats are not asserted to satisfy the full
NSNF specification. Unpersonalized artifact addresses are local storage slots,
not inferred charts. Existing deterministic chart fallbacks are not validated
birth charts.

The novel-writing panel now offers the supplied executable AUTOLING rule trial
instead of calling a nonexistent transition generator or displaying invented
coherence results. Character centers come from reference values rather than
numeric object keys, and character defaults no longer access nonexistent color
definition fields.

Production server smoke checks verify `/`, `/contact-lab`, `/contact-lab/`, and
the separate original encoder HTML. The SPA rules route explicitly precedes the
encoder asset directory. Missing GitHub integration returns 503 and an actionable
connection message; missing model settings return 400. No live model request or
GitHub write was performed during this verification.

Checks:

```
npm ci --no-audit --no-fund
node tests/synthia-github.test.mjs
node tests/klein-semantic.test.mjs
node --import tsx tests/build-regressions.test.ts
python -m unittest discover -s tests -p 'test_klein_tools.py'
npm run check
npm run build
```

The 21 JavaScript/TypeScript checks and 5 Python checks pass locally. The build
still emits nonfatal warnings about the large client bundle, browser database
age, and a PostCSS plugin's `from` option. Live model and app GitHub credentials
must be configured through the existing app Settings/integrations. This build
verification does not complete the full NSNF runtime or all tool-factory adapters.
