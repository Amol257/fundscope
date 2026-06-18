'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';

export interface BubbleData {
  name: string;
  volatility: number;
  return: number;
  count: number;
  color: string;
}

interface MiniBubbleMapProps {
  data: BubbleData[];
}

export function MiniBubbleMap({ data }: MiniBubbleMapProps) {
  if (!data || data.length === 0) return null;

  // Calculate medians for quadrants
  const vols = data.map(d => d.volatility).sort((a, b) => a - b);
  const rets = data.map(d => d.return).sort((a, b) => a - b);
  const medianVol = vols[Math.floor(vols.length / 2)] || 15;
  const medianRet = rets[Math.floor(rets.length / 2)] || 12;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#111] p-3 border border-white/15 text-xs rounded-lg shadow-2xl backdrop-blur-xl">
          <p className="font-bold text-white mb-2">{data.name}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-white/50">Return (5Y):</span>
            <span className="text-emerald-400 font-mono text-right">{data.return.toFixed(1)}%</span>
            <span className="text-white/50">Volatility:</span>
            <span className="text-amber-400 font-mono text-right">{data.volatility.toFixed(1)}%</span>
            <span className="text-white/50">Funds:</span>
            <span className="text-blue-400 font-mono text-right">{data.count}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full relative">
      {/* Quadrant Labels */}
      <span className="absolute top-2 left-2 text-[8px] uppercase tracking-widest text-emerald-400/50">Best Risk-Adj</span>
      <span className="absolute top-2 right-2 text-[8px] uppercase tracking-widest text-amber-400/50">High Octane</span>
      <span className="absolute bottom-6 left-2 text-[8px] uppercase tracking-widest text-blue-400/50">Preservers</span>
      <span className="absolute bottom-6 right-2 text-[8px] uppercase tracking-widest text-red-400/50">High Risk, Low Ret</span>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
          <defs>
            <filter id="glow-bubble" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <XAxis 
            type="number" 
            dataKey="volatility" 
            name="Volatility" 
            unit="%"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <YAxis 
            type="number" 
            dataKey="return" 
            name="Return" 
            unit="%"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <ZAxis type="number" dataKey="count" range={[60, 400]} name="Funds" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
          
          <ReferenceLine x={medianVol} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <ReferenceLine y={medianRet} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          
          <Scatter name="Categories" data={data} animationDuration={1000}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} stroke={entry.color} strokeWidth={1} filter="url(#glow-bubble)" />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
