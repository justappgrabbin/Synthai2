# tools/merge_qualities.py
# Usage:
#   python merge_qualities.py /path/to/gene_gnomes.json /path/to/qualities.json /output/path.json
import json, sys, pathlib

def load(p):
  return json.loads(pathlib.Path(p).read_text())

def main():
  if len(sys.argv) < 4:
    print("Usage: python merge_qualities.py gene_gnomes.json qualities.json gene_gnomes_enriched.json")
    sys.exit(1)
  gg_path, qual_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
  gg = load(gg_path)
  qd = load(qual_path)
  by_gate = {int(q["gate"]): q for q in qd.get("qualities", [])}
  # Support two shapes for gene_gnomes.json: {"gnomes":[...]} or flat list [...]
  gnomes = gg["gnomes"] if isinstance(gg, dict) and "gnomes" in gg else gg
  enriched = []
  for g in gnomes:
    gate = int(g.get("gate") or g.get("id"))
    merged = dict(g)
    q = by_gate.get(gate)
    if q:
      merged["qualities"] = q
    enriched.append(merged)
  pathlib.Path(out_path).write_text(json.dumps({"gnomes": enriched}, indent=2))
  print(f"Enriched {len(enriched)} gnomes → {out_path}")

if __name__ == "__main__":
  main()
