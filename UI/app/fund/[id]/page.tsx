import fundData from '@/lib/data.json';
import compactData from '@/lib/compact-data.json';
import { Metadata } from 'next';
import FundDetailClient from './FundDetailClientWrapper';

export async function generateStaticParams() {
  return compactData.funds.map((fund) => ({
    id: String(fund.code).trim(),
  }));
}

function getBenchmarkTicker(fund: any): string {
  if (['^NSEI', '^NSMIDCP', '^CRSLDX'].includes(fund.benchmark)) {
    return fund.benchmark;
  }
  
  const category = String(fund.category || '').toLowerCase();
  const subCategory = String(fund.sub_category || '').toLowerCase();
  const name = String(fund.name || '').toLowerCase();
  
  if (category.includes('mid') || subCategory.includes('mid') || name.includes('mid')) {
    return '^NSMIDCP';
  }
  if (category.includes('small') || subCategory.includes('small') || name.includes('small') || 
      category.includes('elss') || category.includes('tax') || subCategory.includes('tax') || 
      category.includes('flexi') || subCategory.includes('flexi') || name.includes('flexi') ||
      category.includes('multi') || subCategory.includes('multi') || name.includes('multi')) {
    return '^CRSLDX';
  }
  
  // Default to Nifty 50 for Large Cap and Index Funds
  if (category.includes('large') || subCategory.includes('large') || name.includes('large') ||
      category.includes('index') || subCategory.includes('index') || name.includes('index') || 
      name.includes('nifty') || name.includes('sensex')) {
    return '^NSEI';
  }
  
  // For other categories like Debt (benchmark 7) or general, return Nifty 500 as standard index
  if (fund.benchmark === 7) {
    return '^CRSLDX';
  }
  
  return '^NSEI';
}

export default async function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cleanId = id.replace(/\/$/, '').trim();
  
  // 1. Try to find the fund in detailed data.json
  let fund: any = fundData.funds.find(f => String(f.code).trim() === cleanId);
  let isDetailed = true;

  // 2. If not found, fall back to compact-data.json
  if (!fund) {
    fund = compactData.funds.find(f => String(f.code).trim() === cleanId);
    isDetailed = false;
  }

  if (!fund) {
    return <FundDetailClient fund={null} benchHistory={[]} benchName="" />;
  }

  // 3. Resolve benchmark history and name
  const benchTicker = isDetailed ? fund.benchmark : getBenchmarkTicker(fund);
  const benchHistory = ((fundData as any).benchmarks || {})[benchTicker] || [];
  const benchName = ((fundData as any).benchmark_names || {})[benchTicker] || 'Nifty 50';

  return (
    <FundDetailClient 
      fund={fund} 
      benchHistory={benchHistory} 
      benchName={benchName} 
    />
  );
}
