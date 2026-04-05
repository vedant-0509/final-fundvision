import { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Trash2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { OverallGauge, HealthGauge } from '../components/HealthGauge';
import { api, PortfolioResponse, AdviceItem } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
const fmt = (n: number) => `₹${n >= 10000000 ? (n/10000000).toFixed(2)+'Cr' : n >= 100000 ? (n/100000).toFixed(1)+'L' : n.toLocaleString('en-IN')}`;

const PRIORITY_STYLE: Record<string, string> = {
  high:   'border-l-4 border-red-400 bg-red-50',
  medium: 'border-l-4 border-amber-400 bg-amber-50',
  low:    'border-l-4 border-blue-400 bg-blue-50',
  info:   'border-l-4 border-emerald-400 bg-emerald-50',
};
const PRIORITY_ICON: Record<string, JSX.Element> = {
  high:   <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
  medium: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  low:    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  info:   <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { setData(await api.portfolio.get()); }
    catch { setData(MOCK_PORTFOLIO); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const removeHolding = async (fund_id: number) => {
    setRemoving(fund_id);
    try { await api.portfolio.remove(fund_id); await load(); }
    catch { }
    finally { setRemoving(null); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="light" />
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading your portfolio…</p>
        </div>
      </div>
    </div>
  );

  const { holdings, summary, health } = data || MOCK_PORTFOLIO;
  const pieData = Object.entries(health.category_breakdown).map(([name, pct]) => ({ name, value: Math.round(pct) }));
  const assetData = Object.entries(health.asset_breakdown).map(([name, pct]) => ({ name, value: Math.round(pct) }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.full_name || user?.username} 👋</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Invested', value: fmt(summary.total_invested), color: 'text-gray-900' },
            { label: 'Current Value', value: fmt(summary.total_value), color: 'text-blue-600' },
            { label: 'Total Gain', value: fmt(summary.total_gain), color: summary.total_gain >= 0 ? 'text-emerald-600' : 'text-red-600' },
            { label: 'Returns', value: `${summary.total_gain_pct >= 0 ? '+' : ''}${summary.total_gain_pct.toFixed(2)}%`, color: summary.total_gain_pct >= 0 ? 'text-emerald-600' : 'text-red-600' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* ── Health Score ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-6 text-sm uppercase tracking-wide text-gray-400">Portfolio Health</h2>
            <div className="flex justify-center mb-6">
              <OverallGauge score={health.overall} grade={health.grade} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <HealthGauge label="Diversification" score={health.diversification} size={80} />
              <HealthGauge label="Return Quality" score={health.return_quality} size={80} />
              <HealthGauge label="Risk Balance" score={health.risk_balance} size={80} />
              <HealthGauge label="Cost Efficiency" score={health.cost_efficiency} size={80} />
            </div>
          </div>

          {/* ── Category Breakdown Pie ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-400">Category Allocation</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-700 capitalize">{d.name}</span>
                  </span>
                  <span className="font-medium text-gray-900">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Key Metrics ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-400">Portfolio Metrics</h2>
            <div className="space-y-4">
              {[
                { label: 'Weighted 5Y CAGR', value: `${health.weighted_cagr}%`, color: 'text-emerald-600' },
                { label: 'Avg Sharpe Ratio', value: health.weighted_sharpe.toFixed(2), color: health.weighted_sharpe > 1.2 ? 'text-emerald-600' : 'text-amber-600' },
                { label: 'Avg Expense Ratio', value: `${health.weighted_expense.toFixed(2)}%`, color: health.weighted_expense < 0.7 ? 'text-emerald-600' : health.weighted_expense > 1.2 ? 'text-red-500' : 'text-amber-600' },
                { label: 'No. of Funds', value: `${holdings.length}`, color: 'text-blue-600' },
              ].map(m => (
                <div key={m.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{m.label}</span>
                  <span className={`font-bold ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Strengths / Weaknesses */}
            {health.strengths.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-emerald-600 mb-2">✅ Strengths</p>
                {health.strengths.map(s => <p key={s} className="text-xs text-gray-600 mb-1">• {s}</p>)}
              </div>
            )}
            {health.weaknesses.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-red-500 mb-2">⚠️ Weaknesses</p>
                {health.weaknesses.map(w => <p key={w} className="text-xs text-gray-600 mb-1">• {w}</p>)}
              </div>
            )}
          </div>
        </div>

        {/* ── Rebalancing Advice ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Rebalancing Advice</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {health.rebalancing_advice.map((a: AdviceItem, i: number) => (
              <div key={i} className={`p-4 rounded-lg ${PRIORITY_STYLE[a.priority] || 'border-l-4 border-gray-300 bg-gray-50'}`}>
                <div className="flex items-start gap-2 mb-1">
                  {PRIORITY_ICON[a.priority]}
                  <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                </div>
                <p className="text-xs text-gray-600 mb-2 ml-6">{a.detail}</p>
                <p className="text-xs font-medium text-gray-800 ml-6">→ {a.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Holdings Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your Holdings ({holdings.length} funds)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Fund Name', 'Category', 'Invested', 'Current Value', 'Gain/Loss', 'CAGR 5Y', 'Sharpe', 'Expense', 'Risk', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holdings.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
                    No holdings yet. <a href="/screener" className="text-blue-600 underline">Browse the screener</a> to add funds.
                  </td></tr>
                ) : holdings.map(h => (
                  <tr key={h.holding_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900 max-w-48 truncate">{h.name}</p>
                      <p className="text-xs text-gray-400">{h.fund_house}</p>
                    </td>
                    <td className="px-4 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{h.category}</span></td>
                    <td className="px-4 py-4 text-sm text-gray-700">{fmt(h.invested)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{fmt(h.current_value)}</td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 text-sm font-medium ${h.gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {h.gain >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {fmt(Math.abs(h.gain))} ({h.gain_pct >= 0 ? '+' : ''}{h.gain_pct.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-emerald-600 font-medium">{h.cagr_5y?.toFixed(1)}%</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{h.sharpe_ratio?.toFixed(2)}</td>
                    <td className={`px-4 py-4 text-sm font-medium ${(h.expense_ratio||0) > 1 ? 'text-red-500' : 'text-gray-700'}`}>{h.expense_ratio?.toFixed(2)}%</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${h.risk_level === 'Low' ? 'bg-emerald-50 text-emerald-700' : h.risk_level === 'Very High' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{h.risk_level}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => removeHolding(h.fund_id)} disabled={removing === h.fund_id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                        {removing === h.fund_id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Mock data shown when API is unavailable ────────────────────────────────────
const MOCK_PORTFOLIO: PortfolioResponse = {
  holdings: [
    { holding_id: 1, fund_id: 5, name: 'Parag Parikh Flexi Cap Fund', fund_house: 'PPFAS', category: 'flexicap', asset_type: 'equity', risk_level: 'High', nav: 72.4, invested: 50000, current_value: 62400, gain: 12400, gain_pct: 24.8, cagr_5y: 21.2, sharpe_ratio: 2.14, expense_ratio: 0.74, star_rating: 5, investment_type: 'sip', sip_amount: 5000 },
    { holding_id: 2, fund_id: 3, name: 'Kotak Emerging Equity Fund', fund_house: 'Kotak', category: 'midcap', asset_type: 'equity', risk_level: 'High', nav: 112.4, invested: 30000, current_value: 38600, gain: 8600, gain_pct: 28.7, cagr_5y: 19.4, sharpe_ratio: 1.54, expense_ratio: 0.44, star_rating: 5, investment_type: 'sip', sip_amount: 3000 },
    { holding_id: 3, fund_id: 8, name: 'SBI Magnum Gilt Fund', fund_house: 'SBI', category: 'debt', asset_type: 'debt', risk_level: 'Low', nav: 62.1, invested: 20000, current_value: 21480, gain: 1480, gain_pct: 7.4, cagr_5y: 7.4, sharpe_ratio: 0.81, expense_ratio: 0.44, star_rating: 4, investment_type: 'lumpsum', sip_amount: 0 },
  ],
  summary: { total_invested: 100000, total_value: 122480, total_gain: 22480, total_gain_pct: 22.48, fund_count: 3 },
  health: {
    overall: 74, grade: 'B+', diversification: 68, return_quality: 82, risk_balance: 71, cost_efficiency: 88,
    weighted_cagr: 16.8, weighted_sharpe: 1.71, weighted_expense: 0.61,
    category_breakdown: { flexicap: 50, midcap: 30, debt: 20 },
    asset_breakdown: { equity: 80, debt: 20 },
    rebalancing_advice: [
      { priority: 'medium', type: 'diversification', title: 'Consider Large-Cap Exposure', detail: 'Portfolio lacks large-cap stability. Adding a blue-chip fund can reduce volatility.', action: 'Allocate 15–20% to a large-cap or index fund.' },
      { priority: 'info', type: 'strength', title: 'Excellent Cost Efficiency', detail: 'Weighted expense ratio of 0.61% is very competitive, saving you money over time.', action: 'Maintain this discipline.' },
    ],
    strengths: ['Return Quality (82/100)', 'Cost Efficiency (88/100)'],
    weaknesses: ['Diversification (68/100) — needs attention'],
  },
};
