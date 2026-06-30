# Gnome Qualities Kit

Drop your gnome personality metadata here, merge it into the 64-gene table, and preview it.

## Files
- `data/qualities_template.json` — schema to fill for each gate (virtues, shadows, motto, emoji, color, thresholds, unlocks).
- `data/qualities_examples.json` — 5 example gates to show how it looks.
- `tools/merge_qualities.py` — merges your `gene_gnomes.json` with `qualities.json` → `gene_gnomes_enriched.json`.
- `frontend/qualities_preview.html` — quick static viewer.

## Merge usage
```bash
python tools/merge_qualities.py /path/to/gene_gnomes.json data/qualities_examples.json gene_gnomes_enriched.json
# or use your own qualities file following the template schema
```

## Why this matters
- Keeps **effects** in your main 64 table, while **personality/UX flavor** (virtues, motto, emoji, thresholds) lives in a clean overlay.
- Lets you theme UI (color, emoji, voice) and gameplay (thresholds, unlocks) without changing engine code.
