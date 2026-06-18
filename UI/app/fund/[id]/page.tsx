import fundData from '@/lib/data.json';
import { Metadata } from 'next';
import FundDetailClient from './FundDetailClient';

export async function generateStaticParams() {
  return fundData.funds.map((fund) => ({
    id: String(fund.code).trim(),
  }));
}

export default async function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cleanId = id.replace(/\/$/, '').trim();
  const fund = fundData.funds.find(f => String(f.code).trim() === cleanId);

  if (!fund) {
    return <FundDetailClient fund={null} benchHistory={[]} benchName="" />;
  }

  const benchHistory = ((fundData as any).benchmarks || {})[fund.benchmark] || [];
  const benchName = ((fundData as any).benchmark_names || {})[fund.benchmark] || String(fund.benchmark);

  return (
    <FundDetailClient 
      fund={fund} 
      benchHistory={benchHistory} 
      benchName={benchName} 
    />
  );
}
