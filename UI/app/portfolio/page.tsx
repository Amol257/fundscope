'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit3, X, Briefcase, TrendingUp, Wallet, PieChart as PieIcon, Search, Calendar, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TiltCard } from '@/components/ui/TiltCard';
import { toast } from 'react-hot-toast';
import compactData from '@/lib/compact-data.json';
import Link from 'next/link';

interface Transaction {
  id: string;
  code: string;
  name: string;
  category: string;
  buyDate: string;
  amount: number;
  units: number;
  buyNav: number;
  currentNav: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [buyDate, setBuyDate] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [units, setUnits] = useState('');
  const [buyNav, setBuyNav] = useState('');
  const [fetchingNav, setFetchingNav] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fundscope_portfolio');
      if (saved) {
        setPortfolio(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load portfolio:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update current NAVs in the background
  const updateCurrentValues = async (holdingsList: Transaction[]) => {
    if (holdingsList.length === 0) return;
    setIsUpdating(true);
    let hasUpdates = false;

    const updated = await Promise.all(
      holdingsList.map(async (item) => {
        try {
          const res = await fetch(`https://api.mfapi.in/mf/${item.code}`);
          if (!res.ok) return item;
          const data = await res.json();
          if (data && data.data && data.data[0]) {
            const latestNav = parseFloat(data.data[0].nav);
            if (latestNav !== item.currentNav) {
              hasUpdates = true;
              return { ...item, currentNav: latestNav };
            }
          }
        } catch (e) {
          console.error(`Failed to fetch current NAV for ${item.code}:`, e);
        }
        return item;
      })
    );

    if (hasUpdates) {
      setPortfolio(updated);
      localStorage.setItem('fundscope_portfolio', JSON.stringify(updated));
      toast.success('Portfolio NAVs updated in real time.');
    }
    setIsUpdating(false);
  };

  // Sync NAVs once after loading initial data
  useEffect(() => {
    if (!loading && portfolio.length > 0) {
      updateCurrentValues(portfolio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Search funds
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return compactData.funds
      .filter((f) => f.name.toLowerCase().includes(query) || f.code.includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  // Handle purchase date change to fetch historical NAV
  const handleDateChange = async (dateStr: string) => {
    setBuyDate(dateStr);
    if (!selectedFund || !dateStr) return;

    setFetchingNav(true);
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${selectedFund.code}`);
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data)) {
        const targetDate = new Date(dateStr);
        let closestPt = null;
        let minDiff = Infinity;

        for (const pt of data.data) {
          const parts = pt.date.split('-');
          const ptDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          const diff = Math.abs(ptDate.getTime() - targetDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestPt = pt;
          }
        }

        if (closestPt) {
          setBuyNav(closestPt.nav);
          // If amount is specified, recalculate units
          if (investedAmount) {
            setUnits((parseFloat(investedAmount) / parseFloat(closestPt.nav)).toFixed(4));
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not fetch historical NAV for this date.');
    } finally {
      setFetchingNav(false);
    }
  };

  // Calculate units based on amount and NAV
  const handleAmountChange = (val: string) => {
    setInvestedAmount(val);
    const navVal = parseFloat(buyNav);
    const amtVal = parseFloat(val);
    if (navVal > 0 && amtVal > 0) {
      setUnits((amtVal / navVal).toFixed(4));
    }
  };

  const handleNavChange = (val: string) => {
    setBuyNav(val);
    const navVal = parseFloat(val);
    const amtVal = parseFloat(investedAmount);
    if (navVal > 0 && amtVal > 0) {
      setUnits((amtVal / navVal).toFixed(4));
    }
  };

  // Portfolio calculations
  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;

    portfolio.forEach((item) => {
      totalInvested += item.amount;
      totalCurrent += item.units * item.currentNav;
    });

    const gainLoss = totalCurrent - totalInvested;
    const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      gainLoss,
      gainLossPct,
    };
  }, [portfolio]);

  // Allocation data
  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    portfolio.forEach((item) => {
      const val = item.units * item.currentNav;
      map[item.category] = (map[item.category] || 0) + val;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [portfolio]);

  // Save Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund || !investedAmount || !buyNav || !units || !buyDate) {
      toast.error('Please fill in all transaction fields.');
      return;
    }

    const transaction: Transaction = {
      id: editingId || crypto.randomUUID(),
      code: selectedFund.code,
      name: selectedFund.name,
      category: selectedFund.category,
      buyDate,
      amount: parseFloat(investedAmount),
      units: parseFloat(units),
      buyNav: parseFloat(buyNav),
      currentNav: selectedFund.nav || parseFloat(buyNav),
    };

    let updatedList;
    if (editingId) {
      updatedList = portfolio.map((t) => (t.id === editingId ? transaction : t));
      toast.success('Investment updated.');
    } else {
      updatedList = [...portfolio, transaction];
      toast.success('Investment added.');
    }

    setPortfolio(updatedList);
    localStorage.setItem('fundscope_portfolio', JSON.stringify(updatedList));

    // Reset and close
    setShowAddModal(false);
    setEditingId(null);
    setSelectedFund(null);
    setSearchQuery('');
    setBuyDate('');
    setInvestedAmount('');
    setUnits('');
    setBuyNav('');

    // Fetch latest NAV for the added fund
    updateCurrentValues(updatedList);
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    const updated = portfolio.filter((t) => t.id !== id);
    setPortfolio(updated);
    localStorage.setItem('fundscope_portfolio', JSON.stringify(updated));
    toast.success('Holding removed.');
  };

  // Populate form for edit
  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setSelectedFund({
      code: t.code,
      name: t.name,
      category: t.category,
      nav: t.currentNav,
    });
    setSearchQuery(t.name);
    setBuyDate(t.buyDate);
    setInvestedAmount(String(t.amount));
    setBuyNav(String(t.buyNav));
    setUnits(String(t.units));
    setShowAddModal(true);
  };

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pt-28 min-h-screen">
      
      {/* Header */}
      <section className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase">My Wealth</span>
          <h1 className="text-4xl md:text-6xl font-serif italic text-on-surface mb-2 tracking-tighter">
            Portfolio Tracker
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            Monitor holdings, analyze allocation, and check gains in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => updateCurrentValues(portfolio)} 
            disabled={isUpdating || portfolio.length === 0}
            className="px-4 py-2.5 border border-white/20 hover:bg-white/5 disabled:opacity-40 text-white rounded text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
            Sync NAVs
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setSelectedFund(null);
              setSearchQuery('');
              setBuyDate('');
              setInvestedAmount('');
              setUnits('');
              setBuyNav('');
              setShowAddModal(true);
            }} 
            className="px-6 py-2.5 bg-primary text-black rounded hover:bg-primary-container font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} /> Add Transaction
          </button>
        </div>
      </section>

      {portfolio.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel p-8 rounded-xl border border-white/10">
          <Briefcase className="text-white/20 mb-4" size={48} />
          <h2 className="text-2xl font-serif italic text-white/90 mb-2">No Investments Tracked</h2>
          <p className="text-sm text-white/50 max-w-sm mb-8 leading-relaxed font-light">
            Keep track of your mutual funds across all AMCs. Get starting by adding your first transaction.
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer"
          >
            + Add First Fund
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TiltCard maxTilt={5} glareEnabled={false}>
              <div className="glass-panel p-6 flex flex-col justify-between h-32 rounded-xl font-number">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1 font-sans font-bold">
                  <Wallet size={12} className="text-white/50" /> Portfolio Value
                </span>
                <span className="text-3xl text-primary font-bold">
                  ₹{summary.totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </TiltCard>

            <TiltCard maxTilt={5} glareEnabled={false}>
              <div className="glass-panel p-6 flex flex-col justify-between h-32 rounded-xl font-number">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1 font-sans font-bold">
                  Invested Amount
                </span>
                <span className="text-3xl text-white/95 font-bold">
                  ₹{summary.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </TiltCard>

            <TiltCard maxTilt={5} glareEnabled={false}>
              <div className="glass-panel p-6 flex flex-col justify-between h-32 rounded-xl font-number">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1 font-sans font-bold">
                  <TrendingUp size={12} className="text-white/50" /> Absolute Returns
                </span>
                <div className="flex flex-col">
                  <span className={`text-2xl font-bold ${summary.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {summary.gainLoss >= 0 ? '+' : ''}₹{summary.gainLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] mt-1 ${summary.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ({summary.gainLossPct >= 0 ? '+' : ''}{summary.gainLossPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </TiltCard>

            <TiltCard maxTilt={5} glareEnabled={false}>
              <div className="glass-panel p-6 flex flex-col justify-between h-32 rounded-xl font-number">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1 font-sans font-bold">
                  Total Holdings
                </span>
                <span className="text-3xl text-white/60 font-bold">
                  {portfolio.length} Funds
                </span>
              </div>
            </TiltCard>
          </section>

          {/* Allocation & Info Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Allocation Chart */}
            <div className="lg:col-span-5 h-[360px]">
              <TiltCard className="block h-full" maxTilt={3} glareEnabled={true}>
                <div className="glass-panel p-6 flex flex-col h-full rounded-xl shadow-xl justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1 mb-4">
                    <PieIcon size={12} className="text-white/50" /> Asset Allocation
                  </span>
                  <div className="flex-grow w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                          contentStyle={{ backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TiltCard>
            </div>

            {/* Holdings Table */}
            <div className="lg:col-span-7 flex flex-col justify-stretch">
              <div className="glass-panel p-6 rounded-xl border border-white/5 shadow-xl flex-grow overflow-x-auto">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-6">Current Holdings</span>
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.15em] text-white/40 font-normal">
                      <th className="pb-3">Scheme</th>
                      <th className="pb-3 text-right">Invested</th>
                      <th className="pb-3 text-right">Current Value</th>
                      <th className="pb-3 text-right">Gains (Abs)</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-number">
                    {portfolio.map((item) => {
                      const curVal = item.units * item.currentNav;
                      const absGain = curVal - item.amount;
                      const absGainPct = (absGain / item.amount) * 100;
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 pr-4">
                            <Link href={`/fund/${item.code}`} className="font-serif italic text-sm text-white/95 hover:text-primary transition-colors block">
                              {item.name.split(' - ')[0]}
                            </Link>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 mt-1 block font-sans">
                              {item.category} • Avg NAV: ₹{item.buyNav.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 text-right text-white/70">
                            ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-4 text-right font-bold text-primary">
                            ₹{curVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            <span className="text-[9px] text-white/40 font-normal block">NAV: ₹{item.currentNav.toFixed(2)}</span>
                          </td>
                          <td className={`py-4 text-right ${absGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {absGain >= 0 ? '+' : ''}₹{absGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            <span className="text-[9px] block">({absGainPct >= 0 ? '+' : ''}{absGainPct.toFixed(1)}%)</span>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => handleEditClick(item)} 
                                className="p-1.5 hover:text-primary hover:bg-white/5 rounded text-white/50 transition-colors cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(item.id)} 
                                className="p-1.5 hover:text-danger-red hover:bg-white/5 rounded text-white/50 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative glass-panel bg-[#090b14] border border-white/10 w-full max-w-lg p-8 rounded-2xl shadow-2xl z-10">
            <button className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>
            <h3 className="text-2xl font-serif italic text-white mb-6">
              {editingId ? 'Edit Investment' : 'Add Investment Transaction'}
            </h3>

            <form onSubmit={handleSaveTransaction} className="space-y-5">
              
              {/* Fund Search */}
              <div className="relative">
                <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-2 font-bold">Search Mutual Fund</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by AMC, name, or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!!editingId}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded px-4 py-3 text-xs outline-none transition-all pr-10"
                  />
                  <Search size={16} className="absolute right-3 top-3.5 text-white/40" />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c0f1d] border border-white/10 rounded shadow-2xl overflow-hidden z-20">
                    {searchResults.map((f) => (
                      <button
                        key={f.code}
                        type="button"
                        onClick={() => {
                          setSelectedFund(f);
                          setSearchQuery(f.name);
                          setBuyNav(String(f.nav || ''));
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 text-xs text-white/80 block transition-colors"
                      >
                        <span className="font-bold text-primary block">{f.name.split(' - ')[0]}</span>
                        <span className="text-[9px] text-white/40 block">{f.category} • Scheme: {f.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedFund && (
                <div className="bg-white/5 border border-white/5 p-4 rounded text-xs text-white/70 space-y-1">
                  <span className="font-bold text-white block">Selected: {selectedFund.name}</span>
                  <span>Category: {selectedFund.category} • Code: {selectedFund.code}</span>
                </div>
              )}

              {/* Purchase Date */}
              <div>
                <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-2 font-bold flex items-center gap-1">
                  <Calendar size={12} /> Purchase Date
                </label>
                <input
                  type="date"
                  value={buyDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded px-4 py-3 text-xs outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Invested Amount */}
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-2 font-bold">Invested Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50000"
                    value={investedAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded px-4 py-3 text-xs outline-none transition-all"
                    required
                  />
                </div>

                {/* Buy NAV */}
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-2 font-bold flex items-center justify-between">
                    <span>Buy NAV (₹)</span>
                    {fetchingNav && <span className="text-[9px] text-[#F27D26] animate-pulse uppercase">Fetching...</span>}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 154.23"
                    value={buyNav}
                    onChange={(e) => handleNavChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded px-4 py-3 text-xs outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Calculated Units */}
              {units && (
                <div className="bg-white/5 border border-white/5 p-3 rounded flex justify-between items-center text-xs">
                  <span className="text-white/40">Calculated Units:</span>
                  <span className="font-number text-primary font-bold">{units}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-black hover:bg-primary-container font-bold rounded text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer mt-4"
              >
                {editingId ? 'Update Transaction' : 'Save Investment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
