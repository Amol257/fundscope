"""
Mutual Fund Categorization Engine
==================================
Categorizes Indian mutual funds based on their name using SEBI-aligned category rules.
Reads from UI/lib/data.json, categorizes all funds, writes back.
"""
import json
import re
from collections import Counter

DATA_PATH = "../UI/lib/data.json"

# ──────────────────────────────────────────────
# Category rules: (priority order – first match wins)
# Each rule is (list_of_keywords, category_name)
# Keywords are matched case-insensitively against the fund name.
# ──────────────────────────────────────────────

CATEGORY_RULES = [
    # ── ETFs & Index (check first to avoid false positives) ──
    (["gold etf"], "Gold ETF"),
    (["silver etf"], "Silver ETF"),
    (["etf"], "ETF"),
    (["index fund"], "Index Fund"),
    (["index"], "Index Fund"),

    # ── Sectoral / Thematic ──
    (["banking & psu", "debt"], "Banking & PSU Debt"),
    (["banking and psu", "debt"], "Banking & PSU Debt"),
    (["banking & psu"], "Banking & PSU Debt"),
    (["banking and psu"], "Banking & PSU Debt"),
    (["banking", "financial"], "Banking & Financial Services"),
    (["pharma"], "Pharma & Healthcare"),
    (["healthcare"], "Pharma & Healthcare"),
    (["technology", "fund"], "Technology"),
    (["digital"], "Technology"),
    (["infra"], "Infrastructure"),
    (["consumption"], "Consumption"),
    (["manufacturing"], "Manufacturing"),
    (["energy"], "Energy"),
    (["commodit"], "Commodities"),
    (["real estate"], "Real Estate"),
    (["psu equity"], "PSU Equity"),
    (["defence"], "Defence"),
    (["defense"], "Defence"),
    (["transportation"], "Transportation & Logistics"),
    (["logistics"], "Transportation & Logistics"),
    (["auto"], "Automotive"),
    (["innovation"], "Innovation & Disruption"),
    (["business cycle"], "Business Cycle"),
    (["conglomerate"], "Conglomerate"),
    (["mnc"], "MNC"),
    (["tourism"], "Tourism & Hospitality"),
    (["rural"], "Rural"),
    (["housing"], "Housing"),

    # ── Equity – Market Cap ──
    (["small cap", "fund"], "Small Cap"),
    (["small-cap"], "Small Cap"),
    (["smallcap"], "Small Cap"),
    (["mid cap", "fund"], "Mid Cap"),
    (["mid-cap"], "Mid Cap"),
    (["midcap"], "Mid Cap"),
    (["large cap", "fund"], "Large Cap"),
    (["large-cap"], "Large Cap"),
    (["largecap"], "Large Cap"),
    (["large & mid"], "Large & Mid Cap"),
    (["large and mid"], "Large & Mid Cap"),
    (["flexi cap"], "Flexi Cap"),
    (["flexi-cap"], "Flexi Cap"),
    (["flexicap"], "Flexi Cap"),
    (["multi cap"], "Multi Cap"),
    (["multi-cap"], "Multi Cap"),
    (["multicap"], "Multi Cap"),
    (["micro cap"], "Micro Cap"),

    # ── Equity – Strategy ──
    (["elss"], "ELSS (Tax Saver)"),
    (["tax saver"], "ELSS (Tax Saver)"),
    (["tax saving"], "ELSS (Tax Saver)"),
    (["focused fund"], "Focused Fund"),
    (["focused equity"], "Focused Fund"),
    (["contra fund"], "Contra Fund"),
    (["contra"], "Contra Fund"),
    (["value fund"], "Value Fund"),
    (["value discovery"], "Value Fund"),
    (["dividend yield"], "Dividend Yield"),
    (["quant fund"], "Quant Fund"),
    (["quant"], "Quant Fund"),
    (["momentum"], "Momentum"),
    (["quality"], "Quality"),
    (["alpha"], "Alpha"),
    (["special opportunit"], "Special Opportunities"),
    (["thematic"], "Thematic"),
    (["equity savings"], "Equity Savings"),
    (["equity saving"], "Equity Savings"),

    # ── Hybrid ──
    (["balanced advantage"], "Balanced Advantage"),
    (["dynamic asset"], "Dynamic Asset Allocation"),
    (["multi asset"], "Multi Asset Allocation"),
    (["multi-asset"], "Multi Asset Allocation"),
    (["aggressive hybrid"], "Aggressive Hybrid"),
    (["conservative hybrid"], "Conservative Hybrid"),
    (["balanced hybrid"], "Balanced Hybrid"),
    (["hybrid equity"], "Hybrid Equity"),
    (["hybrid fund"], "Hybrid Fund"),
    (["arbitrage"], "Arbitrage"),

    # ── Debt – Specific types ──
    (["liquid fund"], "Liquid"),
    (["liquid"], "Liquid"),
    (["overnight fund"], "Overnight"),
    (["overnight"], "Overnight"),
    (["ultra short"], "Ultra Short Duration"),
    (["low duration"], "Low Duration"),
    (["short duration"], "Short Duration"),
    (["short term"], "Short Duration"),
    (["medium duration"], "Medium Duration"),
    (["medium term"], "Medium Duration"),
    (["medium to long"], "Medium to Long Duration"),
    (["long duration"], "Long Duration"),
    (["long term"], "Long Duration"),
    (["dynamic bond"], "Dynamic Bond"),
    (["gilt fund"], "Gilt"),
    (["gilt"], "Gilt"),
    (["corporate bond"], "Corporate Bond"),
    (["credit risk"], "Credit Risk"),
    (["money market"], "Money Market"),
    (["floater fund"], "Floater"),
    (["floating rate"], "Floater"),
    (["target maturity"], "Target Maturity"),
    (["constant maturity"], "Constant Maturity"),
    (["fixed maturity"], "Fixed Maturity Plan"),
    (["fmp"], "Fixed Maturity Plan"),
    (["interval fund"], "Interval Fund"),

    # ── Solutions / Retirement / Children ──
    (["retirement"], "Retirement"),
    (["pension"], "Retirement"),
    (["child"], "Children's Fund"),
    (["bal bhavishya"], "Children's Fund"),
    (["young star"], "Children's Fund"),

    # ── Fund of Funds ──
    (["fund of fund"], "Fund of Funds"),
    (["fof"], "Fund of Funds"),

    # ── International ──
    (["international"], "International"),
    (["global"], "International"),
    (["us equity"], "International"),
    (["us total stock"], "International"),
    (["nasdaq"], "International"),
    (["japan"], "International"),
    (["china"], "International"),
    (["emerging market"], "International"),
    (["greater china"], "International"),
    (["asean"], "International"),
    (["european"], "International"),

    # ── Capital Protection & Fixed Horizon (large buckets in 'Other') ──
    (["capital protection"], "Capital Protection"),
    (["fixed horizon"], "Fixed Horizon"),
    (["fixed term"], "Fixed Term Plan"),
    (["dual advantage"], "Dual Advantage"),
    (["multiple yield"], "Multiple Yield"),

    # ── Savings / Accrual / Recovery ──
    (["savings fund"], "Savings Fund"),
    (["accrual fund"], "Debt - Accrual"),
    (["accrual"], "Debt - Accrual"),
    (["recovery fund"], "Recovery Fund"),
    (["india recovery"], "Recovery Fund"),
    (["blended plan"], "Blended Plan"),
    (["blended fund"], "Blended Plan"),

    # ── Government Securities ──
    (["government securities"], "Gilt"),
    (["g-sec"], "Gilt"),
    (["gsec"], "Gilt"),

    # ── Floating Interest (slightly different from floater) ──
    (["floating interest"], "Floater"),

    # ── Interval / Close-ended / FTIFs ──
    (["ftif"], "Fixed Term Plan"),
    (["interval"], "Interval Fund"),

    # ── Segregated Portfolio ──
    (["segregated portfolio"], "Segregated Portfolio"),
    (["segregated"], "Segregated Portfolio"),

    # ── Money Manager / MIP / Insta Cash ──
    (["money manager"], "Money Market"),
    (["mmf"], "Money Market"),
    (["mip"], "Hybrid Fund"),
    (["insta cash"], "Liquid"),

    # ── Financial Services (catch remaining) ──
    (["financial services"], "Banking & Financial Services"),

    # ── ESG / Ethical ──
    (["esg"], "ESG"),
    (["ethical"], "ESG"),

    # ── Sector-specific remainders ──
    (["fmcg"], "FMCG"),
    (["exports & services"], "Exports & Services"),
    (["exports and services"], "Exports & Services"),
    (["services fund"], "Services"),
    (["consumer fund"], "Consumption"),
    (["india consumer"], "Consumption"),

    # ── Strategy remainders ──
    (["multi-factor"], "Multi Factor"),
    (["multi factor"], "Multi Factor"),
    (["minimum variance"], "Low Volatility"),
    (["low volatility"], "Low Volatility"),
    (["best-in-class"], "Equity - General"),
    (["build india"], "Infrastructure"),
    (["t.i.g.e.r"], "Infrastructure"),
    (["capital builder"], "Equity - General"),
    (["india gorwth"], "Equity - General"),
    (["equity opp"], "Equity - General"),
    (["charity fund"], "Thematic"),
    (["gold fund"], "Gold ETF"),

    # ── Insurance Linked (LIC ULIS) ──
    (["ulis"], "Insurance Linked"),

    # ── Floater typo catch ──
    (["floater"], "Floater"),

    # ── Government securities typo ──
    (["govenment securities"], "Gilt"),

    # ── Exchange Traded Fund (remaining patterns) ──
    (["exchange traded fund"], "ETF"),
    (["exchange traded"], "ETF"),

    # ── Remaining specific patterns ──
    (["manufacture in india"], "Manufacturing"),
    (["sector rotation"], "Thematic"),
    (["sector leaders"], "Large Cap"),
    (["recently listed ipo"], "Thematic"),
    (["ipo fund"], "Thematic"),
    (["health and wellness"], "Pharma & Healthcare"),
    (["wellness fund"], "Pharma & Healthcare"),
    (["bond-deposit"], "Debt - General"),
    (["bluechip"], "Large Cap"),
    (["blue chip"], "Large Cap"),
    (["equity hybrid"], "Aggressive Hybrid"),
    (["debt hybrid"], "Conservative Hybrid"),
    (["hybrid"], "Hybrid Fund"),
    (["brazil"], "International"),
    (["asia pacific"], "International"),
    (["europe dynamic"], "International"),
    (["us value equity"], "International"),
    (["offshore"], "International"),
    (["fts "], "Fixed Term Plan"),
    (["fiif"], "Interval Fund"),
    (["comma fund"], "Debt - General"),
    (["psu fund"], "PSU Equity"),
    (["investor education"], "Other"),
    (["unclaimed"], "Other"),
    (["pioneer fund"], "Equity - General"),
    (["balanced hyrbrid"], "Balanced Hybrid"),
    (["conservative hybrd"], "Conservative Hybrid"),
    (["equity linked saving"], "ELSS (Tax Saver)"),
    (["r.i.g.h.t"], "Equity - General"),
    (["dual advantge"], "Dual Advantage"),
    (["aritrage"], "Arbitrage"),
    (["equal weight"], "Index Fund"),
    (["nifty"], "Index Fund"),
    (["large cap"], "Large Cap"),
    (["focused"], "Focused Fund"),

    # ── Broader catch-alls for equity ──
    (["equity fund"], "Equity - General"),
    (["growth fund"], "Equity - General"),
    (["opportunities fund"], "Equity - General"),
    (["advantage fund"], "Equity - General"),
    (["opportunity fund"], "Equity - General"),

    # ── Broader debt catch-alls ──
    (["debt fund"], "Debt - General"),
    (["income fund"], "Debt - General"),
    (["bond fund"], "Debt - General"),
    (["income"], "Debt - General"),
]


# ──────────────────────────────────────────────────────
# Broad category consolidation map
# Maps the 91 fine-grained categories into ~12 chart-friendly groups
# ──────────────────────────────────────────────────────
BROAD_CATEGORY_MAP = {
    # ── Equity ──
    "Large Cap":                    "Equity",
    "Mid Cap":                      "Equity",
    "Small Cap":                    "Equity",
    "Micro Cap":                    "Equity",
    "Flexi Cap":                    "Equity",
    "Multi Cap":                    "Equity",
    "Large & Mid Cap":              "Equity",
    "Focused Fund":                 "Equity",
    "Value Fund":                   "Equity",
    "Contra Fund":                  "Equity",
    "Dividend Yield":               "Equity",
    "Equity - General":             "Equity",
    "Alpha":                        "Equity",
    "Low Volatility":               "Equity",
    "Multi Factor":                 "Equity",
    "Quant Fund":                   "Equity",
    "Momentum":                     "Equity",
    "Quality":                      "Equity",

    # ── Sectoral & Thematic ──
    "Banking & Financial Services": "Sectoral & Thematic",
    "Pharma & Healthcare":          "Sectoral & Thematic",
    "Technology":                   "Sectoral & Thematic",
    "Infrastructure":               "Sectoral & Thematic",
    "Consumption":                  "Sectoral & Thematic",
    "Manufacturing":                "Sectoral & Thematic",
    "Energy":                       "Sectoral & Thematic",
    "Commodities":                  "Sectoral & Thematic",
    "Real Estate":                  "Sectoral & Thematic",
    "PSU Equity":                   "Sectoral & Thematic",
    "Defence":                      "Sectoral & Thematic",
    "Transportation & Logistics":   "Sectoral & Thematic",
    "Automotive":                   "Sectoral & Thematic",
    "Innovation & Disruption":      "Sectoral & Thematic",
    "Business Cycle":               "Sectoral & Thematic",
    "Conglomerate":                 "Sectoral & Thematic",
    "MNC":                          "Sectoral & Thematic",
    "Tourism & Hospitality":        "Sectoral & Thematic",
    "Rural":                        "Sectoral & Thematic",
    "Housing":                      "Sectoral & Thematic",
    "FMCG":                         "Sectoral & Thematic",
    "Services":                     "Sectoral & Thematic",
    "Exports & Services":           "Sectoral & Thematic",
    "ESG":                          "Sectoral & Thematic",
    "Thematic":                     "Sectoral & Thematic",
    "Special Opportunities":        "Sectoral & Thematic",

    # ── Hybrid ──
    "Aggressive Hybrid":            "Hybrid",
    "Conservative Hybrid":          "Hybrid",
    "Balanced Advantage":           "Hybrid",
    "Balanced Hybrid":              "Hybrid",
    "Dynamic Asset Allocation":     "Hybrid",
    "Multi Asset Allocation":       "Hybrid",
    "Hybrid Fund":                  "Hybrid",
    "Hybrid Equity":                "Hybrid",
    "Arbitrage":                    "Hybrid",
    "Equity Savings":               "Hybrid",

    # ── Debt ──
    "Liquid":                       "Debt",
    "Overnight":                    "Debt",
    "Ultra Short Duration":         "Debt",
    "Low Duration":                 "Debt",
    "Short Duration":               "Debt",
    "Medium Duration":              "Debt",
    "Medium to Long Duration":      "Debt",
    "Long Duration":                "Debt",
    "Dynamic Bond":                 "Debt",
    "Corporate Bond":               "Debt",
    "Credit Risk":                  "Debt",
    "Banking & PSU Debt":           "Debt",
    "Gilt":                         "Debt",
    "Money Market":                 "Debt",
    "Floater":                      "Debt",
    "Debt - General":               "Debt",
    "Debt - Accrual":               "Debt",
    "Savings Fund":                 "Debt",

    # ── Index & ETF ──
    "Index Fund":                   "Index & ETF",
    "ETF":                          "Index & ETF",
    "Gold ETF":                     "Index & ETF",
    "Silver ETF":                   "Index & ETF",

    # ── Tax Saver ──
    "ELSS (Tax Saver)":             "Tax Saver (ELSS)",

    # ── Close-Ended / FMP ──
    "Fixed Maturity Plan":          "Close-Ended & FMP",
    "Fixed Horizon":                "Close-Ended & FMP",
    "Fixed Term Plan":              "Close-Ended & FMP",
    "Capital Protection":           "Close-Ended & FMP",
    "Dual Advantage":               "Close-Ended & FMP",
    "Multiple Yield":               "Close-Ended & FMP",
    "Interval Fund":                "Close-Ended & FMP",
    "Blended Plan":                 "Close-Ended & FMP",
    "Segregated Portfolio":         "Close-Ended & FMP",

    # ── International ──
    "International":                "International",

    # ── Solution-Oriented ──
    "Retirement":                   "Solution-Oriented",
    "Children's Fund":              "Solution-Oriented",
    "Insurance Linked":             "Solution-Oriented",
    "Recovery Fund":                "Solution-Oriented",

    # ── Fund of Funds ──
    "Fund of Funds":                "Fund of Funds",

    # ── Other ──
    "Other":                        "Other",
}


def categorize_fund(name: str) -> str:
    """Return a fine-grained category string based on fund name keywords."""
    name_lower = name.lower()

    for keywords, category in CATEGORY_RULES:
        if all(kw in name_lower for kw in keywords):
            return category

    return "Other"


def main():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    funds = data["funds"]
    print(f"Total funds: {len(funds)}")

    # Step 1: Fine-grained categorize
    for fund in funds:
        fine = categorize_fund(fund.get("name", ""))
        fund["sub_category"] = fine
        fund["category"] = BROAD_CATEGORY_MAP.get(fine, "Other")

    # Report broad categories
    cats = Counter(fund["category"] for fund in funds)
    print("\n Broad Category Distribution:")
    print("-" * 50)
    for cat, count in cats.most_common():
        pct = count / len(funds) * 100
        print(f"  {cat:25s} {count:6d}  ({pct:5.1f}%)")

    # Report sub-categories
    sub_cats = Counter(fund["sub_category"] for fund in funds)
    print(f"\n Unique sub-categories: {len(sub_cats)}")
    print(f" Unique broad categories: {len(cats)}")

    other_count = cats.get("Other", 0)
    print(f"\n Categorized: {len(funds) - other_count} / {len(funds)} ({(len(funds) - other_count) / len(funds) * 100:.1f}%)")

    # Write back
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f)

    print(f"\n data.json updated with broad categories + sub_categories!")


if __name__ == "__main__":
    main()

