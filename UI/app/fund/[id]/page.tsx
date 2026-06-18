import fundData from '@/lib/data.json';
import compactData from '@/lib/compact-data.json';
import { Metadata } from 'next';
import FundDetailClient from './FundDetailClient';

export async function generateStaticParams() {
  return compactData.funds.map((fund) => ({
    id: String(fund.code).trim(),
  }));
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

  // 3. Resolve benchmark history and name if detailed
  const benchHistory = isDetailed ? (((fundData as any).benchmarks || {})[fund.benchmark] || []) : [];
  const benchName = isDetailed ? (((fundData as any).benchmark_names || {})[fund.benchmark] || String(fund.benchmark)) : String(fund.benchmark);

  return (
    <FundDetailClient 
      fund={fund} 
      benchHistory={benchHistory} 
      benchName={benchName} 
    />
  );
}
