#!/usr/bin/env python3
import json, sys, os, glob

def check_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            json.load(f)
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    files = glob.glob(os.path.join(root, "**", "*.json"), recursive=True)
    bad = 0
    for f in files:
        ok, err = check_json(f)
        if not ok:
            print("[FAIL]", f, err)
            bad += 1
        else:
            print("[OK]  ", f)
    if bad:
        print(f"Validation failed: {bad} file(s) invalid.")
        sys.exit(1)
    print("All JSON looks valid.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
