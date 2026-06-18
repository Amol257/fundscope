export interface NavPoint {
  date: string;
  nav: number;
}

export interface BenchPoint {
  date: string;
  price: number;
}

/**
 * Computes Maximum Drawdown (MDD) as a positive percentage (e.g., 45.2 for 45.2% drop)
 */
export function maxDrawdown(navHistory: NavPoint[]): number {
  if (!navHistory || navHistory.length === 0) return 0;
  
  let peak = -Infinity;
  let maxDD = 0;
  
  for (const pt of navHistory) {
    if (pt.nav > peak) peak = pt.nav;
    const dd = (peak - pt.nav) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  
  return maxDD * 100;
}

/**
 * Computes Calmar Ratio: CAGR / Max Drawdown
 */
export function calmarRatio(cagr: number, mdd: number): number {
  if (!mdd || mdd === 0) return 0;
  return cagr / mdd;
}

/**
 * Computes Sortino Ratio: (Return - RiskFree) / DownsideDeviation
 */
export function sortinoRatio(navHistory: NavPoint[], cagr: number, riskFreeRate: number = 7.0): number {
  if (!navHistory || navHistory.length < 2) return 0;
  
  // Compute monthly returns
  const monthlyReturns: number[] = [];
  for (let i = 1; i < navHistory.length; i++) {
    const prevNav = navHistory[i - 1].nav;
    const currNav = navHistory[i].nav;
    monthlyReturns.push((currNav - prevNav) / prevNav);
  }
  
  // Find downside deviation (only negative returns)
  const downsideReturns = monthlyReturns.filter(r => r < 0);
  if (downsideReturns.length === 0) return 0; // No downside!
  
  const downsideVariance = downsideReturns.reduce((acc, r) => acc + (r * r), 0) / monthlyReturns.length;
  // Annualize downside deviation (sqrt of 12 for monthly data)
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(12);
  
  if (downsideDeviation === 0) return 0;
  
  // Both cagr and riskFreeRate should be in percentage (e.g., 15 for 15%)
  return (cagr - riskFreeRate) / (downsideDeviation * 100);
}

/**
 * Computes Upside and Downside Capture Ratios
 */
export function captureRatios(fundHistory: NavPoint[], benchHistory: BenchPoint[]) {
  if (!fundHistory || !benchHistory || fundHistory.length < 2 || benchHistory.length < 2) {
    return { upside: 0, downside: 0 };
  }
  
  // Create a map of benchmark dates to prices for quick lookup
  const benchMap = new Map<string, number>();
  for (const pt of benchHistory) {
    benchMap.set(pt.date.substring(0, 7), pt.price); // match YYYY-MM
  }
  
  let fundUpTotal = 1;
  let benchUpTotal = 1;
  let fundDownTotal = 1;
  let benchDownTotal = 1;
  
  for (let i = 1; i < fundHistory.length; i++) {
    const fPrev = fundHistory[i - 1];
    const fCurr = fundHistory[i];
    
    const fDateMonth = fCurr.date.substring(0, 7);
    const fPrevDateMonth = fPrev.date.substring(0, 7);
    
    const bPrevPrice = benchMap.get(fPrevDateMonth);
    const bCurrPrice = benchMap.get(fDateMonth);
    
    if (bPrevPrice !== undefined && bCurrPrice !== undefined) {
      const bRet = (bCurrPrice - bPrevPrice) / bPrevPrice;
      const fRet = (fCurr.nav - fPrev.nav) / fPrev.nav;
      
      if (bRet > 0) {
        benchUpTotal *= (1 + bRet);
        fundUpTotal *= (1 + fRet);
      } else if (bRet < 0) {
        benchDownTotal *= (1 + bRet);
        fundDownTotal *= (1 + fRet);
      }
    }
  }
  
  // Annualize the cumulative returns (simplified approximation)
  // Or just ratio of cumulative geometric returns
  // For standard capture ratio: (Fund Geometric Return in Up months) / (Bench Geometric Return in Up months)
  const upside = (Math.pow(fundUpTotal, 1) - 1) / (Math.pow(benchUpTotal, 1) - 1);
  const downside = (Math.pow(fundDownTotal, 1) - 1) / (Math.pow(benchDownTotal, 1) - 1);
  
  return {
    upside: isNaN(upside) || !isFinite(upside) ? 0 : upside * 100,
    downside: isNaN(downside) || !isFinite(downside) ? 0 : downside * 100
  };
}

/**
 * Simple XIRR approximation for a standard monthly SIP
 */
export function sipXirr(navHistory: NavPoint[], sipAmount: number = 10000): number {
  if (!navHistory || navHistory.length < 12) return 0;
  
  let totalUnits = 0;
  let totalInvested = 0;
  
  // Buy units every month at the prevailing NAV
  for (const pt of navHistory) {
    totalUnits += sipAmount / pt.nav;
    totalInvested += sipAmount;
  }
  
  // Current value
  const finalNav = navHistory[navHistory.length - 1].nav;
  const currentValue = totalUnits * finalNav;
  
  // Very rough approximation of XIRR for monthly SIP using the total return and time
  const years = navHistory.length / 12;
  
  // A standard approximation for SIP CAGR is finding the rate 'r' where Future Value of Annuity equals currentValue.
  // We use a simple Newton-Raphson approximation or iterative search for the monthly rate.
  
  let rate = 0.01; // Guess 1% per month
  let diff = 1;
  const maxIters = 100;
  let iter = 0;
  
  const fv = (r: number) => sipAmount * ((Math.pow(1 + r, navHistory.length) - 1) / r) * (1 + r);
  const derivative = (r: number) => (fv(r + 0.0001) - fv(r)) / 0.0001;
  
  while (Math.abs(diff) > 0.01 && iter < maxIters) {
    const currentFv = fv(rate);
    diff = currentFv - currentValue;
    if (Math.abs(diff) < 0.01) break;
    
    rate = rate - (diff / derivative(rate));
    iter++;
  }
  
  // Annualize the monthly rate
  const annualRate = (Math.pow(1 + rate, 12) - 1) * 100;
  
  return isNaN(annualRate) || !isFinite(annualRate) ? 0 : annualRate;
}

/**
 * Computes N-year rolling returns from NAV history
 */
export function rollingReturns(navHistory: NavPoint[], years: number): { date: string, rolling: number }[] {
  if (!navHistory || navHistory.length === 0) return [];
  
  const result: { date: string, rolling: number }[] = [];
  
  for (const pt of navHistory) {
    const currentDt = new Date(pt.date);
    const targetDt = new Date(currentDt);
    targetDt.setFullYear(targetDt.getFullYear() - years);
    
    // Find the closest point that is on or before targetDt
    // (Assuming navHistory is sorted ascending by date)
    let startPt: NavPoint | null = null;
    
    // Simple linear scan (could be optimized with binary search but dataset is small)
    for (let i = 0; i < navHistory.length; i++) {
      const d = new Date(navHistory[i].date);
      if (d >= targetDt) {
        // Use the exact match or the point just after
        startPt = navHistory[i];
        break;
      }
    }
    
    if (startPt && startPt.date !== pt.date) {
      // Avoid division by zero and identical points
      const diffTime = currentDt.getTime() - new Date(startPt.date).getTime();
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      
      // Only include if it's close to the requested years (e.g. at least 0.9 * years)
      if (diffYears >= years * 0.9) {
        const cagr = (Math.pow(pt.nav / startPt.nav, 1 / diffYears) - 1) * 100;
        result.push({ date: pt.date, rolling: +cagr.toFixed(2) });
      }
    }
  }
  
  return result;
}
