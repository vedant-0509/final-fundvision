import { Search, Filter, RefreshCw, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api, Fund } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Equity', 'Debt', 'Hybrid', 'Smallcap', 'Midcap', 'Largecap'];
const RISK_LEVELS = ['All', 'Low', 'Moderate', 'High', 'Very High'];

const RISK_BG: Record<string, string> = { 
  'Low': 'bg-emerald-50 text-emerald-700 border-emerald-100', 
  'Moderate': 'bg-blue-50 text-blue-700 border-blue-100', 
  'High': 'bg-orange-50 text-orange-700 border-orange-100', 
  'Very High': 'bg-red-50 text-red-700 border-red-100' 
};

export default function Screener() {
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [riskLevel, setRiskLevel] = useState('All');
  const [sortBy, setSortBy] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'cagr_5y', dir: 'desc' });
  const [adding, setAdding] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState('50');

  const fetchFunds = async () => {
    setLoading(true);
    const params: Record<string, string> = {
      limit: limit, 
      sort_by: sortBy.col, 
      sort_order: sortBy.dir,
    };
    
    if (category !== 'All') params.category = category;
    if (riskLevel !== 'All') params.risk_level = riskLevel;
    if (search) params.q = search;

    try {
      const res = await api.funds.list(params);
      setFunds(res.funds || []); 
      setTotal(res.total || 0);
    } catch (err) { 
      console.error("Fetch error:", err);
      setFunds([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchFunds(); }, [category, riskLevel, sortBy, limit]);
  
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFunds();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const toggleSort = (col: string) => {
    setSortBy(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }));
  };

  const handleAdd = async (fund: Fund) => {
    if (!user) {
      showToast("Please login to manage portfolio", "error");
      return;
    }

    setAdding(fund.id);
    
    try {
      // Use "buy" to align with Transaction ENUM. 
      // Backend handles mapping this to "lumpsum" for the Holdings table.
      const payload = {
        fund_id: fund.id,
        amount: 5000, 
        investment_type: "buy", 
        notes: "Added from Screener"
      };

      await api.portfolio.add(payload);
      showToast(`${fund.name.substring(0, 25)}... added!`, "success");
    } catch (err: any) {
      console.error("Add failed:", err);
      // Extracts the string error message from the backend detail field
      const errorMsg = err.response?.data?.detail || "Could not add fund.";
      showToast(typeof errorMsg === 'string' ? errorMsg : "Database error occurred", "error");
    } finally {
      setAdding(null);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header variant="light" />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fund Screener</h1>
            <p className="text-gray-500 mt-1">Analyze and compare {total.toLocaleString()} mutual funds</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span>Show:</span>
            <select 
                value={limit} 
                onChange={(e) => setLimit(e.target.value)}
                className="bg-transparent font-semibold text-gray-900 focus:outline-none cursor-pointer"
            >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            <div className="lg:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
              />
            </div>

            <div className="lg:col-span-2 flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button 
                  key={c} 
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    category === c ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="lg:col-span-1 flex gap-2">
                <select 
                  value={riskLevel} 
                  onChange={e => setRiskLevel(e.target.value)}
                  className="flex-grow border border-gray-200 rounded-xl text-sm px-3 py-2.5 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option disabled>Filter Risk</option>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r} Risk</option>)}
                </select>
                
                <button 
                  onClick={fetchFunds} 
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl border animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.msg}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fund Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('cagr_3y')}>
                    3Y Return {sortBy.col === 'cagr_3y' && (sortBy.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('cagr_5y')}>
                    5Y Return {sortBy.col === 'cagr_5y' && (sortBy.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Risk Level</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">NAV (₹)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                   [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                   ))
                ) : funds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <Filter className="w-12 h-12 mb-2" />
                        <p className="font-bold">No funds match these criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  funds.map(f => (
                    <tr key={f.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{f.name}</div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-tighter">{f.category} • {f.fund_house}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-emerald-600">{f.cagr_3y ? `${f.cagr_3y.toFixed(2)}%` : '--'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-emerald-700">{f.cagr_5y ? `${f.cagr_5y.toFixed(2)}%` : '--'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border uppercase ${RISK_BG[f.risk_level] || 'bg-gray-100 text-gray-600'}`}>
                          {f.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-mono text-gray-600">
                        {f.nav?.toFixed(2)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => handleAdd(f)} 
                          disabled={adding === f.id}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm disabled:opacity-50 group-hover:scale-110"
                        >
                          {adding === f.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}