import os
import pandas as pd
import numpy as np
from scipy import stats
from src.config import DATA_RAW_DIR, DATA_PROCESSED_DIR, OUTPUTS_DIR

def rolling_consistency(nav_series, window_months=36):
    """
    Calculate the percentage of rolling 3-year windows with positive return.
    Resamples daily NAV data to monthly frequency first.
    100% means the fund never lost money over any 3-year period.
    """
    if nav_series.empty or len(nav_series) < 100:
        return None
    try:
        # Resample daily data to monthly frequency (taking last NAV of each month)
        monthly_nav = nav_series.resample("ME").last().ffill()
        if len(monthly_nav) <= window_months:
            # Fallback if there is not enough historical data
            return None
            
        # Calculate 36-month percentage change (3 years)
        rolling = monthly_nav.pct_change(periods=window_months).dropna()
        if len(rolling) == 0:
            return None
            
        positive = (rolling > 0).sum()
        total = len(rolling)
        return round((positive / total) * 100, 1)
    except Exception as e:
        # print(f"Error calculating consistency: {e}")
        return None

def run_statistical_analysis():
    """Execute statistical tests (Correlation, T-test, Rolling Consistency) on data."""
    print("\nRunning statistical analysis...")
    
    scored_path = os.path.join(DATA_PROCESSED_DIR, "fund_scores.csv")
    nav_path = os.path.join(DATA_RAW_DIR, "nav_history.csv")
    
    if not os.path.exists(scored_path) or not os.path.exists(nav_path):
        print("[ERROR] Required CSV files missing! Run scoring model and data fetcher first.")
        return
        
    scored_df = pd.read_csv(scored_path)
    nav_df = pd.read_csv(nav_path)
    
    # Ensure datetime parsing
    nav_df["Date"] = pd.to_datetime(nav_df["Date"])
    
    # 1. Correlation: AUM vs 5-year CAGR
    if "AUM" in scored_df.columns:
        valid_aum = scored_df.dropna(subset=["AUM", "CAGR_5yr"])
        if len(valid_aum) > 1:
            r, p = stats.pearsonr(valid_aum["AUM"], valid_aum["CAGR_5yr"])
            print(f"  AUM vs Returns correlation: r={r:.3f}, p={p:.4f}")
        else:
            print("  Not enough data to calculate AUM vs Returns correlation.")
    else:
        print("  AUM column not found. Skipping correlation analysis.")
        
    # 2. T-Test: Active vs Index funds (Large Cap vs Index 5yr CAGR)
    active_returns = scored_df[scored_df["Category"] == "Large Cap"]["CAGR_5yr"].dropna()
    index_returns = scored_df[scored_df["Category"] == "Index"]["CAGR_5yr"].dropna()
    
    if len(active_returns) > 1 and len(index_returns) > 1:
        t_stat, p_val = stats.ttest_ind(active_returns, index_returns)
        print(f"  Active vs Index t-test (5yr CAGR): t={t_stat:.3f}, p={p_val:.4f}")
        if p_val < 0.05:
            winner = "Active" if active_returns.mean() > index_returns.mean() else "Index"
            print(f"    RESULT: Statistically significant difference! {winner} funds outperform.")
        else:
            print("    RESULT: No statistically significant difference in performance.")
    else:
        print("  Not enough data to run t-test between active Large Cap and Index categories.")
        
    # 3. Rolling Return Consistency Score
    print("  Calculating 3-year rolling return consistency scores...")
    consistency_scores = {}
    
    for fund_name in nav_df["Fund_Name"].unique():
        fund_data = nav_df[nav_df["Fund_Name"] == fund_name].copy()
        fund_data = fund_data.sort_values("Date")
        fund_series = fund_data.set_index("Date")["NAV"]
        
        score = rolling_consistency(fund_series, 36)
        consistency_scores[fund_name] = score
        
    # Map consistency scores to scored_df
    scored_df["Consistency_3yr"] = scored_df["Fund_Name"].map(consistency_scores)
    
    # Save final scores
    out_path = os.path.join(DATA_PROCESSED_DIR, "fund_scores_final.csv")
    scored_df.to_csv(out_path, index=False)
    print(f"[SUCCESS] Statistical analysis complete! Saved to: {out_path}")
    print("Top 5 funds by 3-year consistency score:")
    print(scored_df.sort_values("Consistency_3yr", ascending=False)[["Fund_Name", "Category", "Consistency_3yr", "Score_Grade"]].head(5))

    # Generate Investment Shortlist (outputs/investment_shortlist.csv)
    recommendation_map = {
        "S - Excellent": ("Strong Buy", "Consider for 40-50% of your equity allocation"),
        "A - Good": ("Buy", "Good option, especially for SIP"),
        "B - Average": ("Hold", "If you already hold it, stay. Do not add more."),
        "C - Below Average": ("Review", "Consider switching to a higher graded fund"),
        "D - Avoid": ("Do Not Invest", "Consistently underperforms, fees eating your returns")
    }
    
    shortlist_df = scored_df[["Fund_Name", "Category", "Score", "Score_Grade", "Consistency_3yr"]].copy()
    
    recs = []
    actions = []
    for _, row in shortlist_df.iterrows():
        grade = str(row["Score_Grade"])
        rec, action = recommendation_map.get(grade, ("Unknown", "No recommendation"))
        recs.append(rec)
        actions.append(action)
        
    shortlist_df["Recommendation"] = recs
    shortlist_df["What_To_Do"] = actions
    shortlist_df = shortlist_df.sort_values("Score", ascending=False)
    
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    shortlist_path = os.path.join(OUTPUTS_DIR, "investment_shortlist.csv")
    shortlist_df.to_csv(shortlist_path, index=False)
    print(f"  [SUCCESS] Saved investment shortlist to: {shortlist_path}")

if __name__ == "__main__":
    run_statistical_analysis()
