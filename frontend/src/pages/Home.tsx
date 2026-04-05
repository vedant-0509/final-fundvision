import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api, Fund, MarketIndex } from '../api/client';

const QUICK_PICKS = ['Parag Parikh Flexi Cap', 'Mirae Asset Large Cap', 'SBI Small Cap', 'Axis Bluechip', 'HDFC Mid Cap', 'Quant Tax Plan', 'Nippon Small Cap', 'Kotak Emerging Equity'];

const MOCK_MARKET: Record<string, MarketIndex> = {
  'Sensex':    { value: 73648.62, change: 312.45,  change_pct: 0.43, symbol: '^BSESN' },
  'Nifty 50':  { value: 22326.90, change: 97.30,   change_pct: 0.44, symbol: '^NSEI'  },
  'Nifty Bank':{ value: 48120.50, change: -145.20, change_pct: -0.30,symbol: '^NSEBANK'},
};

const RISK_COLOR: Record<string, string> = {
  'Low': 'text-emerald-600', 'Moderate': 'text-gray-700',
  'High': 'text-yellow-600', 'Very High': 'text-red-600',
};

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [funds, setFunds] = useState<Fund[]>([]);
  const [market, setMarket] = useState<Record<string, MarketIndex>>(MOCK_MARKET);
  const [sort, setSort] = useState<{ col: keyof Fund; dir: 'asc' | 'desc' }>({ col: 'cagr_5y', dir: 'desc' });
  const [loading, setLoading] = useState(false);

  // Fetch funds
  useEffect(() => {
    setLoading(true);
    api.funds.list({ limit: 20, sort_by: 'cagr_5y', sort_order: 'desc' })
      .then(r => setFunds(r.funds))
      .catch(() => setFunds(FALLBACK_FUNDS))
      .finally(() => setLoading(false));
  }, []);

  // Fetch market indices
  useEffect(() => {
    api.market.indices()
      .then(data => {
        const cleaned: Record<string, MarketIndex> = {};
        Object.entries(data).forEach(([k, v]) => { if (typeof v === 'object' && 'value' in v) cleaned[k] = v as MarketIndex; });
        if (Object.keys(cleaned).length > 0) setMarket(cleaned);
      })
      .catch(() => {});
  }, []);

  // Sorted & filtered funds
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
    if (sort.col !== col) return <span className="opacity-30">↑↓</span>;
    return <span className="text-blue-600">{sort.dir === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="light" />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-end gap-1 h-12">
              <div className="w-3 h-6 bg-emerald-500 rounded" />
              <div className="w-3 h-8 bg-emerald-500 rounded" />
              <div className="w-3 h-11 bg-emerald-500 rounded" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900">FundVision</h1>
          </div>
          <p className="text-xl text-gray-600 mb-12">
            AI-powered mutual fund analysis and screening tool for investors in India
          </p>

          <div className="relative max-w-2xl mx-auto mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a fund or fund house…"
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <p className="text-gray-500 mb-4 text-sm">Or analyse:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_PICKS.map(name => (
              <button key={name} onClick={() => setSearch(name)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all">
                {name}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/screener')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Browse All Funds
            </button>
            <button onClick={() => navigate('/ai-advisor')}
              className="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 px-8 py-3 rounded-xl font-semibold transition-colors">
              ✨ Get AI Recommendation
            </button>
          </div>
        </div>
      </section>

      {/* ── Market Indices ──────────────────────────────────────── */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(market).map(([name, idx]) => (
              <div key={name} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-bold text-gray-900">{idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                <p className="text-gray-500 text-sm mt-1">{name}</p>
                <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${idx.change_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {idx.change_pct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.change_pct >= 0 ? '+' : ''}{idx.change_pct.toFixed(2)}%)
                </p>
              </div>
            ))}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-2xl font-bold text-gray-700">Closed</h3>
              <p className="text-gray-500 text-sm mt-1">Market Status</p>
              <p className="text-emerald-600 text-sm mt-1">9:15 AM – 3:30 PM IST</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fund Table ──────────────────────────────────────────── */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Mutual Funds</h2>
            <button onClick={() => navigate('/screener')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mr-3" />
                <span className="text-gray-500">Loading funds…</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[
                        { label: 'NAME',             col: null },
                        { label: 'TYPE',             col: null },
                        { label: '3Y CAGR',          col: 'cagr_3y' as keyof Fund },
                        { label: '5Y CAGR',          col: 'cagr_5y' as keyof Fund },
                        { label: 'Sharpe Ratio',     col: 'sharpe_ratio' as keyof Fund },
                        { label: 'Expense Ratio',    col: 'expense_ratio' as keyof Fund },
                        { label: 'AUM (Cr)',         col: 'aum_cr' as keyof Fund },
                        { label: 'RISK LEVEL',       col: null },
                      ].map(({ label, col }) => (
                        <th key={label}
                          onClick={() => col && toggleSort(col)}
                          className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}>
                          {label} {col && <SortIcon col={col} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayed.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/screener')}>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{f.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 capitalize">{f.asset_type === 'equity' ? 'Mutual Fund' : f.asset_type === 'debt' ? 'Debt Fund' : 'Hybrid Fund'}</td>
                        <td className="px-5 py-4 text-sm font-medium text-emerald-600">{f.cagr_3y?.toFixed(1)}%</td>
                        <td className="px-5 py-4 text-sm font-medium text-emerald-600">{f.cagr_5y?.toFixed(1)}%</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{f.sharpe_ratio?.toFixed(2)}</td>
                        <td className={`px-5 py-4 text-sm font-medium ${(f.expense_ratio || 0) > 1 ? 'text-red-500' : 'text-gray-700'}`}>
                          {f.expense_ratio?.toFixed(2)}%
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">₹{f.aum_cr?.toLocaleString('en-IN')}</td>
                        <td className={`px-5 py-4 text-sm font-medium ${RISK_COLOR[f.risk_level] || 'text-gray-700'}`}>{f.risk_level}</td>
                      </tr>
                    ))}
                    {displayed.length === 0 && !loading && (
                      <tr><td colSpan={8} className="text-center py-12 text-gray-400">No funds found matching "{search}"</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── Fallback data if API is down ──────────────────────────────────────────────
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
