import os
import pandas as pd
import numpy as np
from src.config import DATA_RAW_DIR, DATA_PROCESSED_DIR, RISK_FREE_RATE

def calculate_cagr(nav_series, years):
    """
    Calculate CAGR for a fund/index given its series with Date as index.
    years: number of years to look back (1, 3, or 5)
    """
    if nav_series.empty or len(nav_series) < 2:
        return None
        
    end_date = nav_series.index.max()
    start_date = end_date - pd.DateOffset(years=years)
    
    try:
        # Find closest available date to start_date
        subset = nav_series.loc[nav_series.index >= start_date]
        if subset.empty:
            return None
            
        nav_start = subset.iloc[0]
        nav_end = nav_series.iloc[-1]
        
        # Check if dates are too close to represent the requested period properly
        actual_years = (end_date - subset.index[0]).days / 365.25
        # Allow some flexibility (e.g. if we want 5y, must have at least 4.8y of data)
        if actual_years < (years * 0.95):
            return None
            
        if nav_start <= 0:
            return None
            
        cagr = (nav_end / nav_start) ** (1 / years) - 1
        return round(cagr * 100, 2)
    except Exception as e:
        # print(f"Error calculating CAGR: {e}")
        return None

def calculate_sharpe(nav_series, risk_free_rate=RISK_FREE_RATE):
    """
    Calculate annualised Sharpe Ratio from daily NAV series.
    risk_free_rate: risk-free rate of return (annualised)
    """
    if nav_series.empty or len(nav_series) < 5:
        return None
    try:
        daily_returns = nav_series.pct_change().dropna()
        if len(daily_returns) == 0:
            return None
        annual_return = daily_returns.mean() * 252
        annual_std = daily_returns.std() * np.sqrt(252)
        if annual_std == 0:
            return None
        sharpe = (annual_return - risk_free_rate) / annual_std
        return round(sharpe, 3)
    except Exception:
        return None

def calculate_volatility(nav_series):
    """Annualised Volatility as percentage from daily NAV series."""
    if nav_series.empty or len(nav_series) < 5:
        return None
    try:
        daily_returns = nav_series.pct_change().dropna()
        if len(daily_returns) == 0:
            return None
        return round(daily_returns.std() * np.sqrt(252) * 100, 2)
    except Exception:
        return None

def run_returns_calculations():
    """Load raw data, calculate all metrics, and save to processed directory."""
    print("\nRunning returns and risk metrics calculations...")
    
    nav_history_path = os.path.join(DATA_RAW_DIR, "nav_history.csv")
    bench_history_path = os.path.join(DATA_RAW_DIR, "benchmark_history.csv")
    
    if not os.path.exists(nav_history_path) or not os.path.exists(bench_history_path):
        print(f"[ERROR] Raw data files missing! Run data_fetcher first.")
        return
        
    nav_df = pd.read_csv(nav_history_path)
    bench_df = pd.read_csv(bench_history_path)
    
    # Ensure datetime parsing
    nav_df["Date"] = pd.to_datetime(nav_df["Date"])
    bench_df["Date"] = pd.to_datetime(bench_df["Date"])
    
    results = []
    
    # Calculate CAGR for all mutual funds
    print("  Calculating returns and risk metrics for funds...")
    for fund_name in nav_df["Fund_Name"].unique():
        fund_data = nav_df[nav_df["Fund_Name"] == fund_name].copy()
        category = fund_data["Category"].iloc[0]
        benchmark = fund_data["Benchmark"].iloc[0]
        
        # Sort and set index for CAGR calculations
        fund_data = fund_data.sort_values("Date")
        # Filter out invalid non-positive NAV values to prevent NaN returns/sharpe/volatility
        fund_series = fund_data[fund_data["NAV"] > 0].set_index("Date")["NAV"]
        
        cagr_1yr = calculate_cagr(fund_series, 1)
        cagr_3yr = calculate_cagr(fund_series, 3)
        cagr_5yr = calculate_cagr(fund_series, 5)
        
        sharpe = calculate_sharpe(fund_series)
        volatility = calculate_volatility(fund_series)
        
        # Flag suspicious volatility values
        if volatility is not None and volatility < 5:
            print(f"  [WARNING] Suspiciously low volatility ({volatility}%) for {fund_name} — skipping")
            volatility = None
            sharpe = None
        
        latest_nav = round(fund_series.iloc[-1], 4)
        min_date = fund_series.index.min().strftime("%Y-%m-%d")
        max_date = fund_series.index.max().strftime("%Y-%m-%d")
        
        results.append({
            "Fund_Name": fund_name,
            "Category": category,
            "Benchmark": benchmark,
            "CAGR_1yr": cagr_1yr,
            "CAGR_3yr": cagr_3yr,
            "CAGR_5yr": cagr_5yr,
            "Sharpe_Ratio": sharpe,
            "Volatility": volatility,
            "NAV_Latest": latest_nav,
            "Data_From": min_date,
            "Data_To": max_date
        })
        
    returns_df = pd.DataFrame(results)
    
    # Calculate Benchmark CAGRs for matching periods
    print("  Calculating returns for benchmarks...")
    bench_cache = {}
    
    def get_benchmark_cagr(ticker, years):
        cache_key = (ticker, years)
        if cache_key in bench_cache:
            return bench_cache[cache_key]
            
        bench_data = bench_df[bench_df["Ticker"] == ticker].copy()
        if bench_data.empty:
            return None
            
        bench_data = bench_data.sort_values("Date")
        bench_series = bench_data.set_index("Date")["Price"]
        
        cagr = calculate_cagr(bench_series, years)
        bench_cache[cache_key] = cagr
        return cagr
        
    # Map benchmark returns
    returns_df["Bench_1yr"] = returns_df["Benchmark"].apply(lambda t: get_benchmark_cagr(t, 1))
    returns_df["Bench_3yr"] = returns_df["Benchmark"].apply(lambda t: get_benchmark_cagr(t, 3))
    returns_df["Bench_5yr"] = returns_df["Benchmark"].apply(lambda t: get_benchmark_cagr(t, 5))
    
    # Calculate Alpha
    returns_df["Alpha_1yr"] = returns_df["CAGR_1yr"] - returns_df["Bench_1yr"]
    returns_df["Alpha_3yr"] = returns_df["CAGR_3yr"] - returns_df["Bench_3yr"]
    returns_df["Alpha_5yr"] = returns_df["CAGR_5yr"] - returns_df["Bench_5yr"]
    
    # Save output
    out_path = os.path.join(DATA_PROCESSED_DIR, "fund_returns.csv")
    returns_df.to_csv(out_path, index=False)
    print(f"[SUCCESS] Calculated returns and saved to: {out_path}")
    print(returns_df[["Fund_Name", "CAGR_5yr", "Sharpe_Ratio", "Volatility"]].head(5))

if __name__ == "__main__":
    run_returns_calculations()
