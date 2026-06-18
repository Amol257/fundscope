import json
import re

DATA_PATH = "../UI/lib/data.json"

def get_base_name(name):
    # Split by common suffixes to find the base fund name
    # e.g. "Aditya Birla Sun Life Banking & PSU Debt Fund - Direct Plan - Growth" -> "Aditya Birla Sun Life Banking & PSU Debt Fund"
    base = re.split(r'\s*-\s*(?i:Direct|Regular|Growth|IDCW|Monthly|Option|Plan|Payout|Reinvestment|Dividend)', name)[0]
    return base.strip()

def score_fund_variant(fund):
    score = 0
    name_lower = fund.get('name', '').lower()
    
    # We highly prefer Direct Growth plans for analysis
    if 'direct' in name_lower:
        score += 10
    elif 'regular' in name_lower:
        score -= 5
        
    if 'growth' in name_lower:
        score += 5
    elif 'idcw' in name_lower or 'dividend' in name_lower:
        score -= 5
        
    # Prefer funds with more complete data (e.g., returns)
    if fund.get('returns_5yr') is not None:
        score += 2
    if fund.get('returns_3yr') is not None:
        score += 1
        
    return score

def main():
    print("Loading data...")
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    funds = data.get('funds', [])
    print(f"Total funds before deduplication: {len(funds)}")
    
    grouped = {}
    for f in funds:
        base = get_base_name(f['name'])
        if base not in grouped:
            grouped[base] = []
        grouped[base].append(f)
        
    deduped_funds = []
    for base, variants in grouped.items():
        if len(variants) == 1:
            deduped_funds.append(variants[0])
        else:
            # Sort variants by score descending
            variants.sort(key=score_fund_variant, reverse=True)
            # Pick the best one
            best = variants[0]
            # Optional: Rename it to just the base name, or keep the original name to show it's Direct Growth
            # Let's keep the original name to be transparent about what variant it is
            deduped_funds.append(best)
            
    print(f"Total unique base funds: {len(grouped)}")
    print(f"Total funds after deduplication: {len(deduped_funds)}")
    
    data['funds'] = deduped_funds
    
    print("Saving deduplicated data...")
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
        
    print("Done!")

if __name__ == '__main__':
    main()
