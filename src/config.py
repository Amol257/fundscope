import os

# Risk Free Rate (approximate yield of India 10-year government bonds)
RISK_FREE_RATE = 0.07

# Folders Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
NOTEBOOKS_DIR = os.path.join(BASE_DIR, "notebooks")
DASHBOARD_DIR = os.path.join(BASE_DIR, "dashboard")

# Database Path
DB_PATH = os.path.join(DATA_RAW_DIR, "..", "mf_analysis.db")

# Handpicked 28 Mutual Funds across 5 Categories (Direct Growth plans only)
# Format: scheme_code -> (fund_name, category, benchmark_ticker)
FUNDS = {
    # LARGE CAP FUNDS (benchmark: Nifty 50)
    "118825": ("Mirae Asset Large Cap Fund - Direct Plan - Growth", "Large Cap", "^NSEI"),
    "120465": ("Axis Bluechip Fund - Direct Plan - Growth Option", "Large Cap", "^NSEI"),
    "119775": ("HDFC Top 100 Fund - Direct Plan - Growth Option", "Large Cap", "^NSEI"),
    "120586": ("ICICI Prudential Large Cap Fund (erstwhile Bluechip Fund) - Direct Plan - Growth", "Large Cap", "^NSEI"),
    "119598": ("SBI Large Cap Fund - Direct Plan - Growth", "Large Cap", "^NSEI"),
    "119819": ("Kotak Bluechip Fund - Direct Plan - Growth", "Large Cap", "^NSEI"),
    "118632": ("Nippon India Large Cap Fund - Direct Plan Growth Plan - Growth Option", "Large Cap", "^NSEI"),
    
    # MID CAP FUNDS (benchmark: Nifty Midcap 150)
    "147445": ("Mirae Asset Midcap Fund- Direct Growth Option", "Mid Cap", "^NSMIDCP"),
    "118668": ("Nippon India Growth Mid Cap Fund - Direct Plan Growth Plan - Growth Option", "Mid Cap", "^NSMIDCP"),
    "119551": ("HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth Option", "Mid Cap", "^NSMIDCP"),
    "119816": ("Kotak Emerging Equity Scheme - Direct Plan - Growth", "Mid Cap", "^NSMIDCP"),
    "119071": ("DSP Midcap Fund - Direct Plan - Growth", "Mid Cap", "^NSMIDCP"),
    "140228": ("Edelweiss Mid Cap Fund - Direct Plan - Growth Option", "Mid Cap", "^NSMIDCP"),
    "127042": ("Motilal Oswal Midcap Fund - Direct Plan - Growth Option", "Mid Cap", "^NSMIDCP"),
    
    # SMALL CAP FUNDS (benchmark: Nifty Smallcap 250 - mapped to Nifty 500 ^CRSLDX due to lack of historical data on yfinance)
    "118778": ("Nippon India Small Cap Fund - Direct Plan Growth Plan - Growth Option", "Small Cap", "^CRSLDX"),
    "125497": ("SBI Small Cap Fund - Direct Plan - Growth", "Small Cap", "^CRSLDX"),
    "125354": ("Axis Small Cap Fund - Direct Plan - Growth", "Small Cap", "^CRSLDX"),
    "130503": ("HDFC Small Cap Fund - Growth Option - Direct Plan", "Small Cap", "^CRSLDX"),
    "120164": ("Kotak-Small Cap Fund - Growth - Direct", "Small Cap", "^CRSLDX"),
    "120828": ("quant Small Cap Fund - Growth Option - Direct Plan", "Small Cap", "^CRSLDX"),
    
    # ELSS TAX SAVING FUNDS (benchmark: Nifty 500)
    "135781": ("Mirae Asset ELSS Tax Saver Fund - Direct Plan - Growth", "ELSS", "^CRSLDX"),
    "120503": ("Axis ELSS Tax Saver Fund - Direct Plan - Growth Option", "ELSS", "^CRSLDX"),
    "119723": ("SBI ELSS Tax Saver FUND - DIRECT PLAN -GROWTH", "ELSS", "^CRSLDX"),
    "119060": ("HDFC ELSS Tax saver - Growth Option - Direct Plan", "ELSS", "^CRSLDX"),
    "120592": ("ICICI Prudential ELSS Tax Saver Fund - Direct Plan - Growth", "ELSS", "^CRSLDX"),
    "120847": ("quant ELSS Tax Saver Fund - Growth Option - Direct Plan", "ELSS", "^CRSLDX"),
    
    # INDEX FUNDS (benchmark: Nifty 50)
    "120716": ("UTI Nifty 50 Index Fund - Growth Option- Direct", "Index", "^NSEI"),
    "119063": ("HDFC Nifty 50 Index Fund - Direct Plan", "Index", "^NSEI"),
    "120620": ("ICICI Prudential Nifty 50 Index Fund - Direct Plan Cumulative Option", "Index", "^NSEI"),
    "118741": ("Nippon India Index Fund - Nifty 50 Plan - Direct Plan Growth Plan - Growth Option", "Index", "^NSEI"),
    "119827": ("SBI NIFTY INDEX FUND - DIRECT PLAN - GROWTH", "Index", "^NSEI"),
    "118482": ("BANDHAN Nifty 50 Index Fund - Direct Plan - Growth", "Index", "^NSEI")
}

# Benchmarks Configuration
BENCHMARKS = {
    "^NSEI": "Nifty 50",
    "^NSMIDCP": "Nifty Midcap 150",
    "^CRSLDX": "Nifty 500"
}
