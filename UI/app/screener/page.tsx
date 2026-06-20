'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, AlertTriangle, Plus, Minus, ArrowRight } from 'lucide-react';
import fundData from '@/lib/compact-data.json';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { GradeTag } from '@/components/GradeTag';
import { ParallaxLayer } from '@/components/ui/motion/ParallaxLayer';
import { EASE_ENTRANCE } from '@/lib/motion';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const FILTERS = ['All Funds', 'Equity', 'Debt', 'Hybrid', 'Index & ETF', 'Sectoral & Thematic', 'Tax Saver (ELSS)', 'Close-Ended & FMP', 'Solution-Oriented', 'International', 'Fund of Funds'];
const GRADES = ['All Grades', 'S', 'A', 'B', 'C', 'D'];

export default function ScreenerPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Funds');
  const [activeGrade, setActiveGrade] = useState('All Grades');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [compareList, setCompareList] = useState<any[]>([]);

  const funds = useMemo(() => fundData.funds || [], []);

  useEffect(() => {
    const loadCompare = () => {
      try {
        const saved = localStorage.getItem('fundscope_compare');
        if (saved) setCompareList(JSON.parse(saved));
      } catch (e) {}
    };
    loadCompare();
    window.addEventListener('compareUpdated', loadCompare);
    return () => window.removeEventListener('compareUpdated', loadCompare);
  }, []);

  const toggleCompare = (fund: any) => {
    let newList = [...compareList];
    if (newList.find(f => f.code === fund.code)) {
      newList = newList.filter(f => f.code !== fund.code);
    } else {
      if (newList.length >= 3) {
        toast.error('You can only compare up to 3 funds at a time.');
        return;
      }
      newList.push(fund);
    }
    setCompareList(newList);
    localStorage.setItem('fundscope_compare', JSON.stringify(newList));
    window.dispatchEvent(new Event('compareUpdated'));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, activeGrade, itemsPerPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedFunds = useMemo(() => {
    let result = [...funds];

    // Search Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(lowerTerm) || 
        f.category.toLowerCase().includes(lowerTerm) ||
        ((f as any).sub_category || '').toLowerCase().includes(lowerTerm)
      );
    }

    // Category Filter
    if (activeFilter !== 'All Funds') {
      result = result.filter(f => f.category === activeFilter);
    }

    // Grade Filter
    if (activeGrade !== 'All Grades') {
      result = result.filter(f => {
        const gradeLetter = f.score_grade !== 'N/A' ? f.score_grade.split(' - ')[0] : 'N/A';
        return gradeLetter === activeGrade;
      });
    }

    // Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // Handle nulls
        if (valA === null) valA = -Infinity;
        if (valB === null) valB = -Infinity;

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by score desc
      result.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return result;
  }, [funds, searchTerm, activeFilter, activeGrade, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedFunds.length / itemsPerPage));
  const paginatedFunds = filteredAndSortedFunds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown size={12} className="ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ml-1 text-[#F27D26]" />
      : <ArrowDown size={12} className="ml-1 text-[#F27D26]" />;
  };

  const downloadCSV = () => {
    const headers = ['Fund Name', 'Category', '5Y CAGR (%)', 'Volatility (%)', 'Sharpe Ratio', 'Score', 'Grade'];
    const csvData = filteredAndSortedFunds.map(f => [
      `"${f.name}"`,
      `"${f.category}"`,
      f.cagr_5yr !== null ? f.cagr_5yr.toFixed(2) : 'N/A',
      f.volatility !== null ? f.volatility.toFixed(2) : 'N/A',
      f.sharpe_ratio !== null ? f.sharpe_ratio.toFixed(3) : 'N/A',
      f.score || 'N/A',
      `"${f.score_grade}"`
    ].join(','));
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fund_screener_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-grow pt-[100px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-stack-lg min-h-screen flex flex-col relative">
      {/* Floating Compare Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-white/50">Comparing</span>
              <div className="flex items-center gap-1.5">
                {compareList.map((f, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/80 overflow-hidden text-ellipsis whitespace-nowrap px-1" title={f.name}>
                    {f.name.substring(0, 3)}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <Link href="/compare" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
              Compare <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Database Search</span>
          <ParallaxLayer speed={0.15}>
            <h1 className="text-5xl md:text-6xl font-serif italic text-on-surface mb-2 tracking-tighter">Fund Screener</h1>
          </ParallaxLayer>
          <p className="text-base text-on-surface-variant max-w-2xl font-light">
            Filter, sort, and analyze our entire universe of tracked mutual funds.
          </p>
        </div>
      </div>

      {/* Main Layout Shell */}
      <div className="flex flex-col lg:flex-row flex-grow border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]/80 backdrop-blur-xl min-h-[700px] shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full lg:w-[240px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-5 bg-black/40 flex flex-col gap-6">
          {/* Category Filter */}
          <div>
            <h3 className="text-[10px] font-mono font-medium text-white/50 uppercase tracking-widest mb-3">Category</h3>
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
              {FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-left text-xs px-3 py-2 rounded-md border transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
                    activeFilter === filter
                      ? 'bg-primary/20 border-primary text-primary font-medium'
                      : 'bg-transparent border-transparent text-white/70 hover:bg-white/5'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Score Filter */}
          <div>
            <h3 className="text-[10px] font-mono font-medium text-white/50 uppercase tracking-widest mb-3">Score Grade</h3>
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
              {GRADES.map(grade => (
                <button
                  key={grade}
                  onClick={() => setActiveGrade(grade)}
                  className={`text-left text-xs px-3 py-2 rounded-md border transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
                    activeGrade === grade
                      ? 'bg-primary/20 border-primary text-primary font-medium'
                      : 'bg-transparent border-transparent text-white/70 hover:bg-white/5'
                  }`}
                >
                  {grade === 'All Grades' ? 'All' : `${grade} Grade`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-4 flex-shrink-0 justify-between">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-white/30"
                placeholder="Search by name or category..." 
              />
            </div>
            
            {/* Download Button */}
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 hover:border-primary/50 text-white px-4 py-2 rounded-md text-xs font-medium active:scale-[0.98] transition-all"
            >
              <Download size={14} className="text-primary" />
              Export CSV
            </button>
          </div>

          {/* Count Bar */}
          <div className="px-4 py-2 text-[11px] text-white/50 border-b border-white/10 flex-shrink-0 bg-black/20 flex items-center justify-between">
            <span>Showing <b className="text-white font-mono">{filteredAndSortedFunds.length}</b> funds</span>
            <div className="flex items-center gap-2">
              <span>Results per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-transparent border border-white/20 rounded px-1 py-0.5 text-white outline-none"
              >
                <option value={25} className="bg-[#121212]">25</option>
                <option value={50} className="bg-[#121212]">50</option>
                <option value={100} className="bg-[#121212]">100</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-transparent">
            {paginatedFunds.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-[#111111]/95 backdrop-blur z-10 border-b border-white/10">
                  <tr>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium cursor-pointer group" onClick={() => handleSort('name')}>
                      <div className="flex items-center">Fund Name {renderSortIcon('name')}</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium cursor-pointer group" onClick={() => handleSort('category')}>
                      <div className="flex items-center">Category {renderSortIcon('category')}</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium cursor-pointer group text-right" onClick={() => handleSort('cagr_5yr')}>
                      <div className="flex items-center justify-end">5Y CAGR {renderSortIcon('cagr_5yr')}</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium cursor-pointer group text-right" onClick={() => handleSort('volatility')}>
                      <div className="flex items-center justify-end">Volatility {renderSortIcon('volatility')}</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium cursor-pointer group text-right" onClick={() => handleSort('sharpe_ratio')}>
                      <div className="flex items-center justify-end">Sharpe {renderSortIcon('sharpe_ratio')}</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium cursor-pointer group text-right" onClick={() => handleSort('score')}>
                      <div className="flex items-center justify-end">Score {renderSortIcon('score')}</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium">
                      <div className="flex items-center justify-center">Grade</div>
                    </th>
                    <th className="p-4 text-xs uppercase tracking-widest text-white/50 font-medium text-right">
                      Compare
                    </th>
                  </tr>
                </thead>
                <motion.tbody 
                  className="divide-y divide-white/5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.035 } }
                  }}
                >
                  {paginatedFunds.map((fund, i) => (
                    <motion.tr 
                      key={fund.code || i} 
                      className="hover:bg-white/5 transition-colors group"
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_ENTRANCE } }
                      }}
                    >
                      <td className="p-4">
                        <Link href={`/fund/${fund.code}`} className="block" onMouseEnter={() => router.prefetch(`/fund/${fund.code}`)}>
                          <div className="text-sm font-serif italic text-white group-hover:text-primary transition-colors max-w-[250px] truncate">
                            {fund.name.split(' - ')[0]}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">{fund.code}</div>
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-white/60">{(fund as any).sub_category || fund.category}</td>
                      <td className="p-4 text-right text-sm font-mono text-white/90">
                        {fund.cagr_5yr !== null ? `${fund.cagr_5yr.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="p-4 text-right text-sm font-mono text-white/90">
                        {fund.volatility !== null ? `${fund.volatility.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="p-4 text-right text-sm font-mono text-white/90">
                        {fund.sharpe_ratio !== null ? fund.sharpe_ratio.toFixed(3) : 'N/A'}
                      </td>
                      <td className="p-4 text-right text-sm font-bold text-[#F27D26]">
                        {fund.score !== null ? fund.score : 'N/A'}
                      </td>
                      <td className="p-4 flex justify-center">
                        <GradeTag grade={fund.score_grade} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleCompare(fund)}
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-all active:scale-[0.9] ${
                            compareList.find(f => f.code === fund.code)
                              ? 'bg-primary/20 text-primary hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-white/5 text-white/40 hover:bg-primary/20 hover:text-primary'
                          }`}
                        >
                          {compareList.find(f => f.code === fund.code) ? <Minus size={14} /> : <Plus size={14} />}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center py-24">
                <AlertTriangle className="text-white/20 mb-4" size={48} />
                <h3 className="text-xl font-serif italic text-white/80 mb-2">No Funds Found</h3>
                <p className="text-sm text-white/40">Try adjusting your filters or search text.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-white/50">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-transparent border border-white/10 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs active:scale-[0.97] transition-all text-white"
                >
                  &lsaquo; Prev
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-transparent border border-white/10 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs active:scale-[0.97] transition-all text-white"
                >
                  Next &rsaquo;
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
