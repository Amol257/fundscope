import os
import sqlite3
import pandas as pd
from src.config import DATA_RAW_DIR, DATA_PROCESSED_DIR, DB_PATH, OUTPUTS_DIR

# Define the 6 queries
QUERIES = [
    {
        "title": "Query 1: Top 3 funds in each category by Score",
        "sql": """
        SELECT Fund_Name, Category, Score, Score_Grade,
               CAGR_5yr, Sharpe_Ratio, Alpha_5yr, Rank_in_Category
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY Category ORDER BY Score DESC) AS rn
            FROM fund_performance
        )
        WHERE rn <= 3
        ORDER BY Category, Score DESC;
        """
    },
    {
        "title": "Query 2: Funds that beat their benchmark over 5 years",
        "sql": """
        SELECT Fund_Name, Category,
               ROUND(CAGR_5yr, 2) AS Fund_5yr,
               ROUND(Bench_5yr, 2) AS Benchmark_5yr,
               ROUND(Alpha_5yr, 2) AS Alpha
        FROM fund_performance
        WHERE Alpha_5yr > 0
        ORDER BY Alpha_5yr DESC;
        """
    },
    {
        "title": "Query 3: Category level summary",
        "sql": """
        SELECT Category,
               COUNT(*) AS Total_Funds,
               ROUND(AVG(CAGR_5yr), 2) AS Avg_5yr_Return,
               ROUND(AVG(Sharpe_Ratio), 3) AS Avg_Sharpe,
               ROUND(AVG(Alpha_5yr), 2) AS Avg_Alpha,
               SUM(CASE WHEN Alpha_5yr > 0 THEN 1 ELSE 0 END) AS Funds_Beating_Benchmark
        FROM fund_performance
        GROUP BY Category
        ORDER BY Avg_5yr_Return DESC;
        """
    },
    {
        "title": "Query 4: Funds with excellent grade (S or A) and positive alpha (>2% & Sharpe > 1)",
        "sql": """
        SELECT Fund_Name, Category, Score, Score_Grade,
               CAGR_5yr, Alpha_5yr, Sharpe_Ratio
        FROM fund_performance
        WHERE Score_Grade IN ('S - Excellent', 'A - Good')
          AND Alpha_5yr > 2
          AND Sharpe_Ratio > 1
        ORDER BY Score DESC;
        """
    },
    {
        "title": "Query 5: Index funds vs active funds in same category (Large Cap vs Index)",
        "sql": """
        SELECT
            CASE WHEN Category = 'Index' THEN 'Index Fund'
                 ELSE 'Active Fund' END AS Fund_Type,
            ROUND(AVG(CAGR_5yr), 2) AS Avg_5yr_Return,
            ROUND(AVG(Sharpe_Ratio), 3) AS Avg_Sharpe,
            COUNT(*) AS Fund_Count
        FROM fund_performance
        WHERE Category IN ('Large Cap', 'Index')
        GROUP BY Fund_Type;
        """
    },
    {
        "title": "Query 6: Volatility vs return quadrant classification",
        "sql": """
        SELECT Fund_Name, Category,
               CAGR_5yr, Volatility,
               CASE
                   WHEN CAGR_5yr > 12 AND Volatility < 20 THEN 'Star: High Return Low Risk'
                   WHEN CAGR_5yr > 12 AND Volatility >= 20 THEN 'Aggressive: High Return High Risk'
                   WHEN CAGR_5yr <= 12 AND Volatility < 20 THEN 'Defensive: Low Return Low Risk'
                   ELSE 'Avoid: Low Return High Risk'
               END AS Quadrant
        FROM fund_performance
        ORDER BY Quadrant, CAGR_5yr DESC;
        """
    }
]

def run_sql_analysis():
    """Load tables into SQLite and execute business intelligence queries."""
    print("\nRunning SQL analysis queries...")
    
    scored_path = os.path.join(DATA_PROCESSED_DIR, "fund_scores.csv")
    nav_path = os.path.join(DATA_RAW_DIR, "nav_history.csv")
    bench_path = os.path.join(DATA_RAW_DIR, "benchmark_history.csv")
    
    if not os.path.exists(scored_path) or not os.path.exists(nav_path) or not os.path.exists(bench_path):
        print("[ERROR] Required CSV files missing! Run fetcher and calculator first.")
        return
        
    scored_df = pd.read_csv(scored_path)
    nav_df = pd.read_csv(nav_path)
    bench_df = pd.read_csv(bench_path)
    
    # Connect to database and load data
    print(f"  Loading tables into SQLite database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    
    # Save DataFrames as SQLite tables
    scored_df.to_sql("fund_performance", conn, if_exists="replace", index=False)
    nav_df.to_sql("nav_history", conn, if_exists="replace", index=False)
    bench_df.to_sql("benchmarks", conn, if_exists="replace", index=False)
    
    out_txt_path = os.path.join(OUTPUTS_DIR, "sql_query_results.txt")
    print(f"  Executing queries and saving outputs to: {out_txt_path}")
    
    with open(out_txt_path, "w", encoding="utf-8") as f_out:
        f_out.write("=============================================================\n")
        f_out.write("           MUTUAL FUND SQL PERFORMANCE ANALYSIS QUERY REPORT\n")
        f_out.write("=============================================================\n\n")
        
        for q in QUERIES:
            title = q["title"]
            sql = q["sql"]
            
            print(f"    Running {title}...")
            
            # Execute query using pandas
            df_res = pd.read_sql_query(sql, conn)
            
            # Write to output file
            f_out.write(f"--- {title} ---\n")
            f_out.write(sql.strip() + "\n\n")
            f_out.write(df_res.to_string(index=False) + "\n\n")
            f_out.write("-" * 65 + "\n\n")
            
            # Print preview in console
            print(df_res.head(3).to_string(index=False))
            print()
            
    conn.close()
    print("[SUCCESS] SQL analysis complete and queries saved.")

if __name__ == "__main__":
    run_sql_analysis()
