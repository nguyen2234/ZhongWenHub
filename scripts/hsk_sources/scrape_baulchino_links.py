import urllib.request
import re
import json
import os

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

urls = [
    'https://www.baulchino.com/libros-hsk',
    'https://www.baulchino.com/hsk-audios-download'
]

results = {}

for url in urls:
    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as res:
            html = res.read().decode('utf-8', errors='ignore')
            print(f"Status: {res.status}, length: {len(html)}")
            
            # Find all <a> tags with text and href
            matches = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
            print(f"Total <a> tags: {len(matches)}")
            
            clean_links = []
            for href, text in matches:
                clean_text = re.sub(r'<[^>]+>', '', text).strip()
                clean_links.append({"href": href, "text": clean_text})
            
            results[url] = clean_links
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        results[url] = {"error": str(e)}

out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "baulchino_raw_links.json")
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"Saved to {out_file}")
