import time
from src.data_fetcher import setup_folders, fetch_all_funds, fetch_benchmarks
from src.returns_calculator import run_returns_calculations
from src.scoring_model import run_scoring_model
from src.statistical_analyser import run_statistical_analysis
from src.sql_analyser import run_sql_analysis
from src.chart_generator import run_chart_generation
from src.excel_generator import run_excel_generation
from src.web_exporter import run_web_export

def main():
    print("=========================================================")
    print("     MUTUAL FUND PERFORMANCE ANALYSER PIPELINE START")
    print("=========================================================")
    start_time = time.time()
    
    # Step 1: Directory Setup
    setup_folders()
    
    # Step 2: Fetch raw NAV and benchmark histories
    fetch_all_funds()
    fetch_benchmarks()
    
    # Step 3: Returns & risk calculations (CAGR, Sharpe, Volatility, Alpha)
    run_returns_calculations()
    
    # Step 4: Scoring Model (MinMax normalization, composite score, grades)
    run_scoring_model()
    
    # Step 5: Statistical Analyser (T-test, 3yr consistency calculation)
    run_statistical_analysis()
    
    # Step 6: SQL Queries analysis (loads to SQLite, runs queries)
    run_sql_analysis()
    
    # Step 7: Chart Dashboard Generation (Matplotlib 2x3 PNG output)
    run_chart_generation()
    
    # Step 8: Excel Workbook Generation (openpyxl styled output)
    run_excel_generation()
    
    # Step 9: Web Dashboard Data Export
    run_web_export()
    
    elapsed = time.time() - start_time
    print("\n=========================================================")
    print(f"   [SUCCESS] PIPELINE COMPLETE IN {elapsed:.2f} SECONDS")
    print("=========================================================")

if __name__ == "__main__":
    main()
