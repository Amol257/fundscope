import os
import json
import pandas as pd
from src.config import FUNDS, BENCHMARKS, DATA_RAW_DIR, DATA_PROCESSED_DIR, BASE_DIR

def run_web_export():
    print("\nExporting mutual fund data for web dashboard...")
    
    scores_path = os.path.join(DATA_PROCESSED_DIR, "fund_scores_final.csv")
    nav_path = os.path.join(DATA_RAW_DIR, "nav_history.csv")
    bench_path = os.path.join(DATA_RAW_DIR, "benchmark_history.csv")
    
    if not os.path.exists(scores_path) or not os.path.exists(nav_path) or not os.path.exists(bench_path):
        print("[ERROR] Required CSV files are missing. Cannot export web data.")
        return
        
    scores_df = pd.read_csv(scores_path)
    nav_df = pd.read_csv(nav_path)
    bench_df = pd.read_csv(bench_path)
    
    # Clean and parse dates
    nav_df["Date"] = pd.to_datetime(nav_df["Date"])
    bench_df["Date"] = pd.to_datetime(bench_df["Date"])
    
    # Create web folder if it doesn't exist
    web_dir = os.path.join(BASE_DIR, "web")
    os.makedirs(web_dir, exist_ok=True)
    
    # Reverse config mapping for Scheme Code
    name_to_code = {name: code for code, (name, cat, bench) in FUNDS.items()}
    
    # 1. Aggregate benchmark histories to monthly to keep data.js small
    print("  Aggregating benchmark histories...")
    benchmarks_data = {}
    for ticker in BENCHMARKS.keys():
        ticker_df = bench_df[bench_df["Ticker"] == ticker].copy()
        if not ticker_df.empty:
            ticker_df = ticker_df.sort_values("Date")
            # Resample to monthly end-values
            monthly_df = ticker_df.set_index("Date").resample("ME").last().reset_index()
            # Drop rows with missing values
            monthly_df = monthly_df.dropna(subset=["Price"])
            benchmarks_data[ticker] = [
                {"date": row["Date"].strftime("%Y-%m-%d"), "price": float(row["Price"])}
                for _, row in monthly_df.iterrows()
            ]
            
    # 2. Aggregate fund NAV histories and match with scores
    print("  Aggregating fund histories and scores...")
    funds_list = []
    
    for _, row in scores_df.iterrows():
        fund_name = row["Fund_Name"]
        scheme_code = name_to_code.get(fund_name)
        
        # If not found directly, try fuzzy match
        if not scheme_code:
            for code, (name, _, _) in FUNDS.items():
                if name in fund_name or fund_name in name:
                    scheme_code = code
                    break
        
        if not scheme_code:
            print(f"  [WARNING] Scheme code not found for: {fund_name}")
            continue
            
        # Get historical NAV data for this fund
        fund_nav_df = nav_df[nav_df["Scheme_Code"] == int(scheme_code)].copy()
        if fund_nav_df.empty:
            # Try matching by string type just in case
            fund_nav_df = nav_df[nav_df["Scheme_Code"].astype(str) == str(scheme_code)].copy()
            
        nav_history = []
        if not fund_nav_df.empty:
            fund_nav_df = fund_nav_df.sort_values("Date")
            # Filter non-positive NAVs
            fund_nav_df = fund_nav_df[fund_nav_df["NAV"] > 0]
            # Resample to monthly
            monthly_nav = fund_nav_df.set_index("Date").resample("ME").last().reset_index()
            monthly_nav = monthly_nav.dropna(subset=["NAV"])
            nav_history = [
                {"date": r["Date"].strftime("%Y-%m-%d"), "nav": float(r["NAV"])}
                for _, r in monthly_nav.iterrows()
            ]
            
        funds_list.append({
            "name": fund_name,
            "code": str(scheme_code),
            "category": row["Category"],
            "benchmark": row["Benchmark"],
            "cagr_1yr": float(row["CAGR_1yr"]) if not pd.isna(row["CAGR_1yr"]) else None,
            "cagr_3yr": float(row["CAGR_3yr"]) if not pd.isna(row["CAGR_3yr"]) else None,
            "cagr_5yr": float(row["CAGR_5yr"]) if not pd.isna(row["CAGR_5yr"]) else None,
            "sharpe_ratio": float(row["Sharpe_Ratio"]) if not pd.isna(row["Sharpe_Ratio"]) else None,
            "volatility": float(row["Volatility"]) if not pd.isna(row["Volatility"]) else None,
            "latest_nav": float(row["NAV_Latest"]) if not pd.isna(row["NAV_Latest"]) else None,
            "data_from": row["Data_From"],
            "data_to": row["Data_To"],
            "bench_5yr": float(row["Bench_5yr"]) if not pd.isna(row["Bench_5yr"]) else None,
            "alpha_5yr": float(row["Alpha_5yr"]) if not pd.isna(row["Alpha_5yr"]) else None,
            "score": float(row["Score"]) if not pd.isna(row["Score"]) else None,
            "score_grade": str(row["Score_Grade"]) if not pd.isna(row["Score_Grade"]) else "N/A",
            "rank_in_category": int(row["Rank_in_Category"]) if not pd.isna(row["Rank_in_Category"]) else None,
            "consistency_3yr": float(row["Consistency_3yr"]) if not pd.isna(row["Consistency_3yr"]) else None,
            "nav_history": nav_history
        })
        
    # Combine everything
    web_data = {
        "funds": funds_list,
        "benchmarks": benchmarks_data,
        "benchmark_names": BENCHMARKS,
        "last_updated": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Write to web/data.js as a JS variable for index.html compatibility
    out_js_path = os.path.join(web_dir, "data.js")
    with open(out_js_path, "w", encoding="utf-8") as f:
        f.write(f"const FUND_DATA = {json.dumps(web_data, indent=2)};")
    print(f"[SUCCESS] Exported web data successfully to: {out_js_path}")

    # Write raw JSON to UI/lib/data.json for Next.js import
    ui_lib_dir = os.path.join(BASE_DIR, "UI", "lib")
    os.makedirs(ui_lib_dir, exist_ok=True)
    out_json_path = os.path.join(ui_lib_dir, "data.json")
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(web_data, f, indent=2)
    print(f"[SUCCESS] Exported Next.js data successfully to: {out_json_path}")
    print(f"Total funds exported: {len(funds_list)}")

    # Auto-rebuild Next.js project and update web folder
    ui_dir = os.path.join(BASE_DIR, "UI")
    ui_out_dir = os.path.join(ui_dir, "out")
    
    print("\nTriggering Next.js build to update static web dashboard...")
    try:
        import subprocess
        import shutil
        
        # Run npm run build
        print("  Running npm run build...")
        result = subprocess.run("npm run build", shell=True, cwd=ui_dir, capture_output=True, text=True)
        if result.returncode == 0:
            print("  [SUCCESS] Next.js build completed successfully.")
            
            # Copy build output to web directory
            print("  Copying build files to web/ directory...")
            
            # Delete old contents of web_dir to ensure clean update
            for item in os.listdir(web_dir):
                item_path = os.path.join(web_dir, item)
                # Keep data.js just in case, but delete everything else
                if item == "data.js":
                    continue
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
            
            # Copy new contents
            for item in os.listdir(ui_out_dir):
                s_path = os.path.join(ui_out_dir, item)
                d_path = os.path.join(web_dir, item)
                if os.path.isdir(s_path):
                    shutil.copytree(s_path, d_path)
                else:
                    shutil.copy2(s_path, d_path)
                    
            print(f"[SUCCESS] Web dashboard at '{web_dir}' updated with the latest Next.js build.")
        else:
            print(f"  [ERROR] Next.js build failed. Return code: {result.returncode}")
            print(result.stderr)
    except Exception as e:
        print(f"  [ERROR] Failed to auto-rebuild Next.js app: {e}")

if __name__ == "__main__":
    run_web_export()

