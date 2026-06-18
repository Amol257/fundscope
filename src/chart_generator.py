import os
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from src.config import DATA_RAW_DIR, DATA_PROCESSED_DIR, OUTPUTS_DIR

def run_chart_generation():
    """Generate and save the 2x3 analysis chart grid."""
    print("\nGenerating performance analysis charts...")
    
    scored_path = os.path.join(DATA_PROCESSED_DIR, "fund_scores_final.csv")
    nav_path = os.path.join(DATA_RAW_DIR, "nav_history.csv")
    
    if not os.path.exists(scored_path) or not os.path.exists(nav_path):
        print("[ERROR] Required CSV files missing! Run statistical_analyser and data_fetcher first.")
        return
        
    scored_df = pd.read_csv(scored_path)
    nav_df = pd.read_csv(nav_path)
    
    # Ensure Date types
    nav_df["Date"] = pd.to_datetime(nav_df["Date"])
    
    # Set premium plotting theme
    sns.set_theme(style="whitegrid")
    plt.rcParams["font.family"] = "sans-serif"
    plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Helvetica"]
    
    # 2x3 grid configuration
    fig, axes = plt.subplots(2, 3, figsize=(22, 14))
    fig.suptitle("Indian Mutual Fund Performance Analysis Dashboard", fontsize=20, fontweight="bold", y=0.98, color="#1A1A1A")
    
    # Curated color palettes
    grade_colors = {
        "S - Excellent": "#1E6E1E",     # Forest Green
        "A - Good": "#004D99",          # Royal Blue
        "B - Average": "#FF8800",       # Warm Orange
        "C - Below Average": "#CC0000", # Crimson Red
        "D - Avoid": "#6C0000"          # Dark Wine Red
    }
    
    cat_palette = {
        "Large Cap": "#004D99",
        "Mid Cap": "#CC0000",
        "Small Cap": "#1E6E1E",
        "ELSS": "#FF8800",
        "Index": "#7700AA"
    }
    
    # --- CHART 1: Fund Score Rankings (Horizontal Bar) ---
    ax1 = axes[0, 0]
    top20 = scored_df.nlargest(20, "Score").copy()
    bar_colors = [grade_colors.get(str(g), "#888888") for g in top20["Score_Grade"]]
    
    # Shorten names for clean display
    top20["Short_Name"] = top20["Fund_Name"].apply(lambda x: x[:25] + "..." if len(x) > 25 else x)
    
    sns.barplot(
        x="Score", y="Short_Name", data=top20, 
        palette=bar_colors, ax=ax1, hue="Short_Name", legend=False
    )
    ax1.set_xlabel("Composite Score (0-100)", fontsize=11, fontweight="semibold")
    ax1.set_ylabel("", fontsize=11)
    ax1.set_title("Top 20 Funds by Score & Grade", fontsize=13, fontweight="bold", pad=12)
    ax1.set_xlim(0, 100)
    
    # --- CHART 2: Active Large Cap vs Index Returns (Box Plot) ---
    ax2 = axes[0, 1]
    box_data = scored_df[scored_df["Category"].isin(["Large Cap", "Index"])].copy()
    
    sns.boxplot(
        x="Category", y="CAGR_5yr", data=box_data, 
        palette={"Large Cap": "#004D99", "Index": "#7700AA"}, 
        ax=ax2, hue="Category", legend=False, width=0.5
    )
    sns.stripplot(x="Category", y="CAGR_5yr", data=box_data, color="#333333", alpha=0.6, size=6, ax=ax2)
    ax2.set_title("Active Large Cap vs Index (5yr CAGR)", fontsize=13, fontweight="bold", pad=12)
    ax2.set_xlabel("", fontsize=11)
    ax2.set_ylabel("5-Year CAGR (%)", fontsize=11, fontweight="semibold")
    
    # --- CHART 3: Risk vs Return Scatter (Quadrant Plot) ---
    ax3 = axes[0, 2]
    sns.scatterplot(
        x="Volatility", y="CAGR_5yr", hue="Category", palette=cat_palette,
        size="Score", sizes=(40, 250), data=scored_df, alpha=0.85, ax=ax3
    )
    
    # Draw quadrant lines
    median_return = scored_df["CAGR_5yr"].median()
    median_vol = scored_df["Volatility"].median()
    
    ax3.axhline(y=median_return, color="#FF0000", linestyle="--", linewidth=1.2, label=f"Median Return ({median_return:.1f}%)")
    ax3.axvline(x=median_vol, color="#0000FF", linestyle="--", linewidth=1.2, label=f"Median Vol ({median_vol:.1f}%)")
    
    ax3.set_title("Risk vs Return Profile by Category", fontsize=13, fontweight="bold", pad=12)
    ax3.set_xlabel("Annualized Volatility (%)", fontsize=11, fontweight="semibold")
    ax3.set_ylabel("5-Year CAGR (%)", fontsize=11, fontweight="semibold")
    ax3.legend(fontsize=9, loc="upper right")
    
    # --- CHART 4: Alpha Distribution (Histogram) ---
    ax4 = axes[1, 0]
    valid_alpha = scored_df["Alpha_5yr"].dropna()
    sns.histplot(
        valid_alpha, bins=12, kde=True, color="#004D99", edgecolor="white", ax=ax4
    )
    ax4.axvline(x=0, color="#FF0000", linestyle="-", linewidth=2, label="Benchmark Return (Alpha=0)")
    
    # Percentage of funds beating benchmark
    pct_beating = (valid_alpha > 0).mean() * 100
    
    ax4.set_title(f"5-Year Alpha Distribution\n({pct_beating:.1f}% of funds beat benchmark)", fontsize=13, fontweight="bold", pad=12)
    ax4.set_xlabel("5-Year Alpha (%)", fontsize=11, fontweight="semibold")
    ax4.set_ylabel("Number of Funds", fontsize=11, fontweight="semibold")
    ax4.legend(fontsize=9)
    
    # --- CHART 5: Rolling Returns Line Chart (Top 3 Funds) ---
    ax5 = axes[1, 1]
    top3_funds = scored_df.nlargest(3, "Score")["Fund_Name"].tolist()
    
    for fund in top3_funds:
        fund_nav = nav_df[nav_df["Fund_Name"] == fund].copy()
        fund_nav = fund_nav.sort_values("Date")
        fund_series = fund_nav.set_index("Date")["NAV"]
        
        # Resample to monthly end and calculate 3-year rolling return (36 months)
        monthly_series = fund_series.resample("ME").last().ffill()
        rolling = monthly_series.pct_change(periods=36).dropna() * 100
        
        ax5.plot(rolling.index, rolling.values, label=fund[:20] + "...", linewidth=2.0)
        
    ax5.axhline(y=0, color="#FF0000", linestyle="--", linewidth=1.2)
    ax5.set_title("3-Year Rolling Returns (Top 3 Funds)", fontsize=13, fontweight="bold", pad=12)
    ax5.set_xlabel("Date", fontsize=11, fontweight="semibold")
    ax5.set_ylabel("3-Year Return (%)", fontsize=11, fontweight="semibold")
    ax5.legend(fontsize=9, loc="lower left")
    
    # --- CHART 6: Average Returns by Category (Grouped Bar Chart) ---
    ax6 = axes[1, 2]
    cat_avg = scored_df.groupby("Category")[["CAGR_1yr", "CAGR_3yr", "CAGR_5yr"]].mean().reset_index()
    
    # Melt for seaborn grouped bar
    melted_df = cat_avg.melt(id_vars="Category", var_name="Period", value_name="CAGR")
    melted_df["Period"] = melted_df["Period"].map({"CAGR_1yr": "1 Year", "CAGR_3yr": "3 Year", "CAGR_5yr": "5 Year"})
    
    sns.barplot(
        x="Category", y="CAGR", hue="Period", data=melted_df,
        palette=["#004D99", "#1E6E1E", "#CC0000"], ax=ax6
    )
    ax6.set_title("Average CAGR Returns by Category", fontsize=13, fontweight="bold", pad=12)
    ax6.set_xlabel("", fontsize=11)
    ax6.set_ylabel("Average Return (%)", fontsize=11, fontweight="semibold")
    ax6.legend(fontsize=9)
    ax6.tick_params(axis="x", rotation=15)
    
    plt.tight_layout()
    out_png_path = os.path.join(OUTPUTS_DIR, "mf_analysis.png")
    plt.savefig(out_png_path, dpi=200, bbox_inches="tight")
    plt.close()
    
    print(f"[SUCCESS] Generated and saved analysis dashboard chart to: {out_png_path}")

if __name__ == "__main__":
    run_chart_generation()
