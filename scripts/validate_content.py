from pathlib import Path
import json
import sys

SITE = Path(__file__).resolve().parents[1]
CONTENT = SITE / "content"
TAXONOMY = json.loads((CONTENT / "taxonomy.json").read_text(encoding="utf-8"))
CODES = {i["code"] for i in TAXONOMY["instruments"]}
REQUIRED = [
    "summary",
    "layers",
    "instruments",
    "targets",
    "transmission",
    "metrics",
    "marketImpact",
    "enforcement",
    "exit",
    "sideEffects",
    "winners",
    "losers",
    "sources",
]
EXPECTED = {
    "analysis-price.json": 44,
    "analysis-gold.json": 31,
    "analysis-wage.json": 26,
    "analysis-macro.json": 7,
}
VALID_LAYERS = {l["id"] for l in TAXONOMY["layers"]}

ok = True
all_ids = set()
for name, count in EXPECTED.items():
    p = CONTENT / name
    if not p.exists():
        print(f"MISSING {name}")
        ok = False
        continue
    data = json.loads(p.read_text(encoding="utf-8"))
    if len(data) != count:
        print(f"COUNT {name}: {len(data)} != {count}")
        ok = False
    for eid, item in data.items():
        all_ids.add(int(eid))
        for field in REQUIRED:
            if not item.get(field):
                print(f"EMPTY {name} id={eid} field={field}")
                ok = False
        for layer in item.get("layers", []):
            if layer not in VALID_LAYERS:
                print(f"BAD LAYER {name} id={eid} {layer}")
                ok = False
        for ins in item.get("instruments", []):
            if ins.get("code") not in CODES:
                print(f"BAD CODE {name} id={eid} {ins.get('code')}")
                ok = False
        if len(item.get("transmission", [])) < 3:
            print(f"SHORT CHAIN {name} id={eid}")
            ok = False
        if len(item.get("sideEffects", [])) < 2:
            print(f"FEW SIDE EFFECTS {name} id={eid}")
            ok = False
        if len(item.get("metrics", [])) < 1:
            print(f"NO METRICS {name} id={eid}")
            ok = False

expected_ids = set(range(1, 109))
missing_ids = sorted(expected_ids - all_ids)
if missing_ids:
    print("MISSING IDS", missing_ids)
    ok = False

print(f"ids={len(all_ids)} ok={ok}")
sys.exit(0 if ok else 1)
