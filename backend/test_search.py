import httpx, json

tests = [
    ("Steve Rogers", "steve rogers is captain america"),
    ("Fargo flamethrower", "A Fargo, North Dakota, man was arrested for clearing snow with a flamethrower."),
    ("ABS-CBN URL", "https://www.abs-cbn.com/news/nation/2026/4/2/icc-appeals-chamber-to-issue-decision-on-duterte-jurisdiction-on-april-22-2024"),
]

for name, text in tests:
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    r = httpx.post("https://verifact-ph-production.up.railway.app/analyze", json={"text": text}, timeout=60)
    d = r.json()
    print(f"  Verdict:    {d['verdict']}")
    print(f"  Score:      {d['verdict_score']}")
    print(f"  Color:      {d['verdict_color']}")
    fc = d["evidence"]["factcheck"]
    print(f"  Fact-checks: {len(fc['claims'])} claims (has_results={fc['has_results']})")
    for c in fc["claims"]:
        print(f"    -> [{c['rating']}] (relevance={c.get('relevance','?')}) {c['text'][:80]}")
    corr = d["evidence"]["corroboration"]
    print(f"  Corroboration: {corr['credible_count']}/{corr['total_count']} credible sources (score={corr['score']})")
