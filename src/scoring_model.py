import os
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from src.config import DATA_PROCESSED_DIR

def build_score(df):
    """
    Normalise metrics using MinMaxScaler and calculate weighted composite score.
    Returns DataFrame sorted by score descending.
    """
    # Create copy and drop rows with missing metrics
    cols_to_check = ["CAGR_5yr", "CAGR_3yr", "CAGR_1yr", "Sharpe_Ratio", "Alpha_5yr"]
    df = df.copy().dropna(subset=cols_to_check)
    
    if df.empty:
        return df
        
    scaler = MinMaxScaler()
    
    # Scale each metric to 0-1 range
    df_scaled = pd.DataFrame(
        scaler.fit_transform(df[cols_to_check]),
        columns=cols_to_check,
        index=df.index
    )
    
    # Weighted composite score calculation
    df["Score"] = (
        df_scaled["CAGR_5yr"] * 0.30 +
        df_scaled["CAGR_3yr"] * 0.20 +
        df_scaled["CAGR_1yr"] * 0.10 +
        df_scaled["Sharpe_Ratio"] * 0.25 +
        df_scaled["Alpha_5yr"] * 0.15
    ) * 100
    
    df["Score"] = df["Score"].round(1)
    
    # Categorise into grades
    df["Score_Grade"] = pd.cut(
        df["Score"],
        bins=[-0.1, 40, 55, 70, 85, 100.1],
        labels=["D - Avoid", "C - Below Average", "B - Average", "A - Good", "S - Excellent"]
    )
    
    return df.sort_values("Score", ascending=False)

def run_scoring_model():
    """Build composite scores and ranks for each category."""
    print("\nBuilding composite scoring model...")
    
    returns_path = os.path.join(DATA_PROCESSED_DIR, "fund_returns.csv")
    if not os.path.exists(returns_path):
        print(f"[ERROR] Returns data file missing! Run returns_calculator first.")
        return
        
    returns_df = pd.read_csv(returns_path)
    
    scored_dfs = []
    
    # Score funds within each category separately
    print("  Calculating normalized scores and grades within categories...")
    for category in returns_df["Category"].unique():
        # Note: Index funds are scored within their own category
        # Small CAGR differences get amplified by MinMaxScaler
        # This is expected behaviour — interpret Index scores relative to each other only
        if category == "Index":
            print(f"  [NOTE] Index fund scores reflect relative tracking efficiency, not absolute performance")
            
        cat_df = returns_df[returns_df["Category"] == category]
        scored_cat = build_score(cat_df)
        
        if not scored_cat.empty:
            # Add rank in category
            scored_cat["Rank_in_Category"] = scored_cat["Score"].rank(
                ascending=False, method="dense"
            ).astype(int)
            scored_dfs.append(scored_cat)
            
    if scored_dfs:
        scored_df = pd.concat(scored_dfs, ignore_index=True)
        out_path = os.path.join(DATA_PROCESSED_DIR, "fund_scores.csv")
        scored_df.to_csv(out_path, index=False)
        print(f"[SUCCESS] Scoring complete! Saved to: {out_path}")
        print("Top 5 scoring funds across all categories:")
        print(scored_df.sort_values("Score", ascending=False)[["Fund_Name", "Category", "Score", "Score_Grade", "Rank_in_Category"]].head(5))
    else:
        print("[ERROR] No scored funds were built!")

if __name__ == "__main__":
    run_scoring_model()
