import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

// This API route fetches real-time data from AMFI (Association of Mutual Funds in India)
// and updates the local data.json with the latest NAVs.
// It can be triggered daily via a cron job.

export async function GET() {
  try {
    // 1. Fetch latest NAV data from AMFI daily text file
    const amfiUrl = 'https://www.amfiindia.com/spages/NAVAll.txt';
    const response = await fetch(amfiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch AMFI data: ${response.statusText}`);
    }
    
    const textData = await response.text();
    const lines = textData.split('\n');
    
    // Parse AMFI data into a map for quick lookup
    // Format: Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
    const latestNavs = new Map<string, { nav: number, date: string }>();
    
    for (const line of lines) {
      const parts = line.split(';');
      if (parts.length >= 6) {
        const code = parts[0].trim();
        const nav = parseFloat(parts[4].trim());
        const date = parts[5].trim();
        
        if (!isNaN(nav) && code) {
          latestNavs.set(code, { nav, date });
        }
      }
    }
    
    // 2. Read current data.json
    const dataFilePath = path.join(process.cwd(), 'lib', 'data.json');
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const db = JSON.parse(rawData);
    
    let updatedCount = 0;
    
    // 3. Update funds with real-time NAV and re-calculate metrics
    db.funds = db.funds.map((fund: any) => {
      const amfiData = latestNavs.get(fund.code);
      
      if (amfiData) {
        // Update NAV history with the latest data point
        const newNavEntry = { date: amfiData.date, nav: amfiData.nav };
        
        // Ensure we don't duplicate the same date
        const lastEntry = fund.nav_history[fund.nav_history.length - 1];
        if (lastEntry && lastEntry.date !== amfiData.date) {
          fund.nav_history.push(newNavEntry);
          updatedCount++;
          
          // Re-calculate CAGR based on the new NAV
          // Formula: CAGR = (Ending Value / Beginning Value) ^ (1 / Years) - 1
          const historyLength = fund.nav_history.length;
          
          if (historyLength > 250) { // ~1 year of trading days
            const startNav1Y = fund.nav_history[historyLength - 250].nav;
            fund.cagr_1yr = ((amfiData.nav / startNav1Y) ** (1 / 1) - 1) * 100;
          }
          
          if (historyLength > 750) { // ~3 years of trading days
            const startNav3Y = fund.nav_history[historyLength - 750].nav;
            fund.cagr_3yr = ((amfiData.nav / startNav3Y) ** (1 / 3) - 1) * 100;
          }
          
          if (historyLength > 1250) { // ~5 years of trading days
            const startNav5Y = fund.nav_history[historyLength - 1250].nav;
            fund.cagr_5yr = ((amfiData.nav / startNav5Y) ** (1 / 5) - 1) * 100;
          }
          
          // Re-calculate Score (using the new normalized formula to match python script)
          const cagr3y = fund.cagr_3yr || 0;
          const sharpe = fund.sharpe_ratio || 0;
          const vol = fund.volatility || 15;
          const alpha = fund.alpha_5yr || 0;
          
          const rawScore = 50 + (cagr3y / 2) + (sharpe * 15) - (vol / 2) + alpha;
          // Normalizing rawScore using historical min (17) and max (76) to 10-99 range
          const normalized = 10 + ((rawScore - 17) / (76 - 17)) * 89;
          
          fund.score = Math.round(Math.min(99, Math.max(10, normalized)));
          
          // Re-calculate Grade
          if (fund.score >= 90) fund.score_grade = 'S';
          else if (fund.score >= 75) fund.score_grade = 'A';
          else if (fund.score >= 60) fund.score_grade = 'B';
          else if (fund.score >= 40) fund.score_grade = 'C';
          else fund.score_grade = 'D';
        }
      }
      return fund;
    });
    
    db.last_synced = new Date().toISOString();
    
    // 4. Save back to data.json
    fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
    
    // 5. Generate and save compact-data.json (stripping nav_history)
    const compactDb = {
      ...db,
      funds: db.funds.map((f: any) => {
        const { nav_history, ...rest } = f;
        return rest;
      })
    };
    const compactDataFilePath = path.join(process.cwd(), 'lib', 'compact-data.json');
    fs.writeFileSync(compactDataFilePath, JSON.stringify(compactDb));
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${updatedCount} funds with real-time AMFI data.`,
      last_synced: db.last_synced
    });
    
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
