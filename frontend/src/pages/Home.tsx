import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, Fund, MarketIndex } from '../api/client';

const QUICK_PICKS = ['Parag Parikh Flexi Cap', 'Mirae Asset Large Cap', 'SBI Small Cap', 'Axis Bluechip', 'HDFC Mid Cap', 'Quant Tax Plan', 'Nippon Small Cap', 'Kotak Emerging Equity'];

const MOCK_MARKET: Record<string, MarketIndex> = {
  'Sensex': { value: 73648.62, change: 312.45, change_pct: 0.43, symbol: '^BSESN' },
  'Nifty 50': { value: 22326.90, change: 97.30, change_pct: 0.44, symbol: '^NSEI' },
  'Nifty Bank': { value: 48120.50, change: -145.20, change_pct: -0.30, symbol: '^NSEBANK' },
};

const RISK_COLOR: Record<string, string> = {
  'Low': 'text-emerald-600 dark:text-emerald-400',
  'Moderate': 'text-gray-700 dark:text-slate-300',
  'High': 'text-yellow-600 dark:text-yellow-500',
  'Very High': 'text-red-600 dark:text-red-500',
};

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [funds, setFunds] = useState<Fund[]>([]);
  const [market, setMarket] = useState<Record<string, MarketIndex>>(MOCK_MARKET);
  const [sort, setSort] = useState<{ col: keyof Fund; dir: 'asc' | 'desc' }>({ col: 'cagr_5y', dir: 'desc' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.funds.list({ limit: 20, sort_by: 'cagr_5y', sort_order: 'desc' })
      .then(r => setFunds(r.funds))
      .catch(() => setFunds(FALLBACK_FUNDS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.market.indices()
      .then(data => {
        const cleaned: Record<string, MarketIndex> = {};
        Object.entries(data).forEach(([k, v]) => {
          if (typeof v === 'object' && 'value' in v) cleaned[k] = v as MarketIndex;
        });
        if (Object.keys(cleaned).length > 0) setMarket(cleaned);
      })
      .catch(() => { });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Find if the search matches a fund name exactly to get its ID, 
      // otherwise, we go to the screener with a search query.
      const matchedFund = funds.find(f => f.name.toLowerCase() === search.toLowerCase().trim());
      if (matchedFund) {
        navigate(`/fund/${matchedFund.id}`);
      } else {
        navigate(`/screener?q=${encodeURIComponent(search.trim())}`);
      }
    }
  };

  const displayed = [...funds]
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.fund_house?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = (a[sort.col] ?? 0) as number;
      const bv = (b[sort.col] ?? 0) as number;
      return sort.dir === 'desc' ? bv - av : av - bv;
    });

  const toggleSort = (col: keyof Fund) => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'desc' });
  };

  const SortIcon = ({ col }: { col: keyof Fund }) => {
    if (sort.col !== col) return <span className="opacity-30 ml-1 text-[10px]">↑↓</span>;
    return <span className="text-emerald-500 ml-1">{sort.dir === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] transition-colors duration-300">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0B0E14] py-20 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-end gap-1 h-12">
              <div className="w-3 h-6 bg-emerald-500 rounded animate-pulse" />
              <div className="w-3 h-8 bg-emerald-500 rounded animate-pulse delay-75" />
              <div className="w-3 h-11 bg-emerald-500 rounded animate-pulse delay-150" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">FundVision</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
            AI-powered mutual fund analysis and screening tool for investors in India.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a fund (e.g. SBI, HDFC)..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white shadow-sm transition-all"
            />
          </form>

          <p className="text-gray-500 dark:text-slate-500 mb-4 text-sm font-medium uppercase tracking-widest">Quick Access:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_PICKS.map(name => (
              <button
                key={name}
                onClick={() => setSearch(name)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:text-emerald-500"
              >
                {name}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/screener')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" /> Browse Screener
            </button>
            <button onClick={() => navigate('/ai-advisor')}
              className="border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-8 py-3.5 rounded-xl font-bold transition-all">
              ✨ AI Recommendation
            </button>
          </div>
        </div>
      </section>

      {/* ── Market Data ─────────────────────────────────────────── */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(market).map(([name, idx]) => (
              <div key={name} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                <p className="text-gray-500 dark:text-slate-500 text-sm mt-1">{name}</p>
                <p className={`text-sm font-bold mt-2 flex items-center gap-1 ${idx.change_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {idx.change_pct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.change_pct >= 0 ? '+' : ''}{idx.change_pct.toFixed(2)}%)
                </p>
              </div>
            ))}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5">
              <h3 className="text-2xl font-bold text-gray-400 dark:text-slate-600 uppercase tracking-tighter">Closed</h3>
              <p className="text-gray-500 dark:text-slate-500 text-sm mt-1">Market Status</p>
              <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-2 font-semibold">Live from 9:15 AM IST</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Top Funds Table ─────────────────────────────────────── */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Performing Funds</h2>
            <Link to="/screener" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1">
              Explore Full Screener <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                <span className="text-gray-500 dark:text-slate-400 font-medium">Analyzing market data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      {[
                        { label: 'Name', col: null },
                        { label: '3Y CAGR', col: 'cagr_3y' as keyof Fund },
                        { label: '5Y CAGR', col: 'cagr_5y' as keyof Fund },
                        { label: 'Exp. Ratio', col: 'expense_ratio' as keyof Fund },
                        { label: 'AUM (Cr)', col: 'aum_cr' as keyof Fund },
                        { label: 'Risk', col: null },
                      ].map(({ label, col }) => (
                        <th key={label}
                          onClick={() => col && toggleSort(col)}
                          className={`px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest ${col ? 'cursor-pointer hover:text-emerald-500' : ''}`}>
                          <div className="flex items-center">
                            {label} {col && <SortIcon col={col} />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {displayed.map(f => (
                      <tr
                        key={f.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/fund/${f.id}`)}
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-gray-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {f.name}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{f.fund_house} • {f.category}</div>
                        </td>
                        <td className="px-6 py-5 text-emerald-600 dark:text-emerald-400 font-bold">{f.cagr_3y?.toFixed(1)}%</td>
                        <td className="px-6 py-5 text-emerald-600 dark:text-emerald-400 font-bold">{f.cagr_5y?.toFixed(1)}%</td>
                        <td className="px-6 py-5 text-gray-600 dark:text-slate-400">{f.expense_ratio?.toFixed(2)}%</td>
                        <td className="px-6 py-5 text-gray-900 dark:text-slate-300 font-medium">₹{f.aum_cr?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${RISK_COLOR[f.risk_level] || 'text-slate-400'} bg-current bg-opacity-10 border border-current`}>
                            {f.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const FALLBACK_FUNDS: Fund[] = [
  { id: 1, scheme_code: '119551', name: 'Mirae Asset Large Cap Fund', fund_house: 'Mirae Asset', category: 'largecap', asset_type: 'equity', nav: 95.4, cagr_1y: 16.2, cagr_3y: 14.1, cagr_5y: 14.2, cagr_10y: 16.8, sharpe_ratio: 1.42, expense_ratio: 0.54, aum_cr: 37820, risk_level: 'Low', star_rating: 5, lock_in_years: 0 },
  { id: 2, scheme_code: '112090', name: 'Axis Bluechip Fund', fund_house: 'Axis', category: 'largecap', asset_type: 'equity', nav: 52.3, cagr_1y: 13.1, cagr_3y: 12.9, cagr_5y: 13.8, cagr_10y: 15.1, sharpe_ratio: 1.31, expense_ratio: 0.63, aum_cr: 42100, risk_level: 'Low', star_rating: 5, lock_in_years: 0 },
  { id: 3, scheme_code: '112118', name: 'Kotak Emerging Equity Fund', fund_house: 'Kotak', category: 'midcap', asset_type: 'equity', nav: 112.4, cagr_1y: 24.3, cagr_3y: 22.1, cagr_5y: 19.4, cagr_10y: 21.3, sharpe_ratio: 1.54, expense_ratio: 0.44, aum_cr: 39800, risk_level: 'High', star_rating: 5, lock_in_years: 0 },
  { id: 4, scheme_code: '125354', name: 'SBI Small Cap Fund', fund_house: 'SBI', category: 'smallcap', asset_type: 'equity', nav: 144.8, cagr_1y: 28.9, cagr_3y: 26.4, cagr_5y: 24.6, cagr_10y: 23.7, sharpe_ratio: 1.38, expense_ratio: 0.68, aum_cr: 25600, risk_level: 'Very High', star_rating: 5, lock_in_years: 0 },
  { id: 5, scheme_code: '120801', name: 'Parag Parikh Flexi Cap Fund', fund_house: 'PPFAS', category: 'flexicap', asset_type: 'equity', nav: 72.4, cagr_1y: 19.6, cagr_3y: 18.4, cagr_5y: 21.2, cagr_10y: 19.8, sharpe_ratio: 2.14, expense_ratio: 0.74, aum_cr: 52400, risk_level: 'High', star_rating: 5, lock_in_years: 0 },
  { id: 6, scheme_code: '140633', name: 'Quant Tax Plan (ELSS)', fund_house: 'Quant', category: 'elss', asset_type: 'equity', nav: 318.4, cagr_1y: 33.4, cagr_3y: 30.2, cagr_5y: 27.4, cagr_10y: 24.1, sharpe_ratio: 1.58, expense_ratio: 0.57, aum_cr: 7800, risk_level: 'High', star_rating: 5, lock_in_years: 3 },
  { id: 7, scheme_code: '120503', name: 'ICICI Pru Equity & Debt Fund', fund_house: 'ICICI Prudential', category: 'hybrid', asset_type: 'hybrid', nav: 302.4, cagr_1y: 19.1, cagr_3y: 18.4, cagr_5y: 15.3, cagr_10y: 16.8, sharpe_ratio: 1.22, expense_ratio: 1.07, aum_cr: 28900, risk_level: 'Moderate', star_rating: 5, lock_in_years: 0 },
  { id: 8, scheme_code: '100663', name: 'SBI Magnum Gilt Fund', fund_house: 'SBI', category: 'debt', asset_type: 'debt', nav: 62.1, cagr_1y: 7.8, cagr_3y: 7.1, cagr_5y: 7.4, cagr_10y: 8.2, sharpe_ratio: 0.81, expense_ratio: 0.44, aum_cr: 9800, risk_level: 'Low', star_rating: 4, lock_in_years: 0 },
];