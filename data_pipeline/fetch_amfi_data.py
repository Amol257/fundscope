import json
import re
import urllib.request
import os

url = 'https://www.amfiindia.com/spages/NAVAll.txt'
response = urllib.request.urlopen(url)
text = response.read().decode('utf-8')

unique_base = {}
for line in text.split('\n'):
    parts = line.split(';')
    if len(parts) >= 6:
        try:
            nav = float(parts[4].strip())
            name = parts[3].strip()
            code = parts[0].strip()
            base = re.split(r'\s*-\s*(?i:Direct|Regular|Growth|IDCW|Monthly|Option|Plan|Payout|Reinvestment|Dividend)', name)[0].strip()
            
            if base not in unique_base:
                unique_base[base] = {
                    'code': code,
                    'name': name,
                    'nav': nav
                }
            else:
                curr = unique_base[base]['name'].lower()
                new_n = name.lower()
                
                score_curr = 0
                if 'direct' in curr: score_curr += 10
                if 'growth' in curr: score_curr += 5
                
                score_new = 0
                if 'direct' in new_n: score_new += 10
                if 'growth' in new_n: score_new += 5
                
                if score_new > score_curr:
                    unique_base[base] = {'code': code, 'name': name, 'nav': nav}
                    
        except ValueError:
            continue

funds = list(unique_base.values())
print(f"Generated {len(funds)} unique funds from API")

data_path = '../UI/lib/data.json'
os.makedirs(os.path.dirname(data_path), exist_ok=True)
with open(data_path, 'w', encoding='utf-8') as f:
    json.dump({"funds": funds}, f, indent=2)

print("Saved to data.json")
