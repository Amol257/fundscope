import os
import time
import requests
import pandas as pd
import yfinance as yf
from src.config import FUNDS, BENCHMARKS, DATA_RAW_DIR, DATA_PROCESSED_DIR, OUTPUTS_DIR, NOTEBOOKS_DIR, DASHBOARD_DIR

def setup_folders():
    """Create project directories if they don't exist."""
    print("Creating folder structure...")
    for folder in [DATA_RAW_DIR, DATA_PROCESSED_DIR, OUTPUTS_DIR, NOTEBOOKS_DIR, DASHBOARD_DIR]:
        os.makedirs(folder, exist_ok=True)
    print("Folders verified/created successfully.")

def fetch_nav_history(scheme_code, fund_name):
    """Fetches complete NAV history for a single mutual fund from api.mfapi.in."""
    url = f"https://api.mfapi.in/mf/{scheme_code}"
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=15)
            if response.status_code != 200:
                print(f"  [Attempt {attempt+1}/{max_retries}] Error {response.status_code} for {fund_name}")
                time.sleep(1)
                continue
                
            data = response.json()
            nav_data = data.get("data")
            if not nav_data:
                print(f"  [Attempt {attempt+1}/{max_retries}] No data found in payload for {fund_name}")
                time.sleep(1)
                continue
                
            df = pd.DataFrame(nav_data)
            df.columns = ["Date", "NAV"]
            
            # Format types and clean values
            df["Date"] = pd.to_datetime(df["Date"], format="%d-%m-%Y")
            df["NAV"] = pd.to_numeric(df["NAV"], errors="coerce")
            
            # Clean and sort
            df = df.dropna(subset=["NAV"])
            df = df.sort_values("Date").reset_index(drop=True)
            
            df["Fund_Name"] = fund_name
            df["Scheme_Code"] = scheme_code
            
            return df
        except Exception as e:
            print(f"  [Attempt {attempt+1}/{max_retries}] Exception for {fund_name}: {e}")
            time.sleep(1)
            
    print(f"  [ERROR] Failed to fetch NAV history for {fund_name} after {max_retries} attempts.")
    return None

def fetch_all_funds():
    """Fetch NAV history for all 28 funds and save combined data."""
    print("\nFetching NAV history for 28 funds...")
    all_data = []
    failed = []
    
    for code, (name, category, benchmark) in FUNDS.items():
        print(f"  Fetching: {name} (Code: {code})...")
        df = fetch_nav_history(code, name)
        if df is not None:
            df["Category"] = category
            df["Benchmark"] = benchmark
            all_data.append(df)
            print(f"    Downloaded {len(df)} NAV records from {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}")
        else:
            failed.append(name)
        time.sleep(0.5)  # Be polite to the API server
        
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        out_path = os.path.join(DATA_RAW_DIR, "nav_history.csv")
        combined_df.to_csv(out_path, index=False)
        print(f"\n[SUCCESS] Saved combined NAV history ({len(combined_df)} records) to: {out_path}")
        print(f"Funds fetched successfully: {combined_df['Fund_Name'].nunique()}/28")
        if failed:
            print(f"Failed funds: {failed}")
    else:
        print("[ERROR] No NAV history data was fetched!")

def fetch_benchmarks():
    """Download 10+ years of benchmark index historical Close prices from yfinance."""
    print("\nDownloading benchmark historical price data from yfinance...")
    benchmark_list = []
    
    for ticker, name in BENCHMARKS.items():
        print(f"  Downloading {name} ({ticker}) from 2015-01-01...")
        try:
            # Download data
            data = yf.download(ticker, start="2015-01-01", progress=False)
            
            # Flatten multi-index columns if present in newer yfinance versions
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = [col[0] for col in data.columns]
                
            if data.empty:
                print(f"    [WARNING] No data downloaded for {name} ({ticker})!")
                continue
                
            # Copy close price
            df = data[["Close"]].copy()
            df.columns = ["Price"]
            df.index.name = "Date"
            df = df.reset_index()
            
            # Clean and ensure correct types
            df["Date"] = pd.to_datetime(df["Date"])
            df["Price"] = pd.to_numeric(df["Price"], errors="coerce")
            df = df.dropna().sort_values("Date").reset_index(drop=True)
            
            df["Benchmark_Name"] = name
            df["Ticker"] = ticker
            
            benchmark_list.append(df)
            print(f"    Downloaded {len(df)} records from {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}")
        except Exception as e:
            print(f"    [ERROR] Failed to download benchmark {name} ({ticker}): {e}")
            
    if benchmark_list:
        combined_df = pd.concat(benchmark_list, ignore_index=True)
        out_path = os.path.join(DATA_RAW_DIR, "benchmark_history.csv")
        combined_df.to_csv(out_path, index=False)
        print(f"[SUCCESS] Saved combined benchmark data ({len(combined_df)} records) to: {out_path}")
    else:
        print("[ERROR] No benchmark data was downloaded!")

if __name__ == "__main__":
    setup_folders()
    fetch_all_funds()
    fetch_benchmarks()
