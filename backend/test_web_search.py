import httpx

print("Testing VeriFact /search Endpoint...")

try:
    # 1. Test query that can be answered by the web search engine
    payload = {"query": "Who is the current president of the Philippines?"}
    r = httpx.post("http://localhost:8000/search", json=payload, timeout=60.0)
    print(f"Status Code: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print("\nSUCCESS!")
        print(f"Engine:  {data.get('engine')}")
        print(f"Queries: {data.get('queries')}")
        print("\nAnswer:")
        print(data.get("answer"))
        print("\nSources:")
        for source in data.get("sources", []):
            print(f" - {source.get('title')}: {source.get('url')}")
    else:
        print(f"FAIL! {r.text}")
except Exception as e:
    print(f"Error occurred: {e}")
