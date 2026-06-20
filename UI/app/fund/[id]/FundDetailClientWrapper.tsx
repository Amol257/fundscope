'use client';

import dynamic from 'next/dynamic';

const FundDetailClient = dynamic(() => import('./FundDetailClient'), { ssr: false });

export default FundDetailClient;
