import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    ShieldCheck,
    Star,
    ArrowLeft,
    Info,
    Plus,
    Loader2,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { api, Fund } from '../api/client';

// Mock data for the chart visualization
const MOCK_HISTORY = [
    { date: 'Jan', nav: 92.4 },
    { date: 'Feb', nav: 94.1 },
    { date: 'Mar', nav: 93.8 },
    { date: 'Apr', nav: 96.5 },
    { date: 'May', nav: 98.2 },
    { date: 'Jun', nav: 101.5 },
    { date: 'Jul', nav: 103.88 },
];

export default function FundDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [fund, setFund] = useState<Fund | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchFund = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(false);
                const data = await api.funds.get(Number(id));
                if (data) {
                    setFund(data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchFund();

        // Fail-safe: Stop loading spinner after 5 seconds if API hangs
        const timer = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timer);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E14]">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium tracking-wide">Analyzing Fund Performance...</p>
            </div>
        );
    }

    if (error || !fund) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E14] text-center p-6">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                    <Info className="w-10 h-10 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Fund Data Unavailable</h2>
                <p className="text-slate-500 mb-8 max-w-sm">We couldn't retrieve details for Fund ID: {id}. Please check the URL or return to the screener.</p>
                <button
                    onClick={() => navigate('/screener')}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                >
                    Return to Screener
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0E14] text-slate-200 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Breadcrumb Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-8 group transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Explorers
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Fund Identity Card */}
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 p-8 backdrop-blur-md">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black text-white tracking-tight">{fund.name}</h1>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold tracking-widest uppercase border border-slate-700">
                                            {fund.category}
                                        </span>
                                        <p className="text-slate-500 font-semibold text-sm tracking-wide">
                                            {fund.fund_house}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5 rounded-2xl border border-slate-700/50 min-w-[200px] shadow-inner">
                                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-[0.2em]">Current NAV</p>
                                    <p className="text-3xl font-black text-white">
                                        ₹{fund.nav?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </p>
                                </div>
                            </div>

                            {/* High-Level Returns Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-800/60">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">3Y CAGR</p>
                                    <p className="text-xl font-bold text-emerald-500">+{fund.cagr_3y}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">5Y CAGR</p>
                                    <p className="text-xl font-bold text-emerald-500">+{fund.cagr_5y}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Exp. Ratio</p>
                                    <p className="text-xl font-bold text-slate-200">{fund.expense_ratio}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Risk Class</p>
                                    <p className="text-xl font-bold text-orange-500">{fund.risk_level}</p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Visualization */}
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 p-8">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-500" /> NAV Trajectory
                                </h3>
                                <div className="text-[10px] font-bold text-slate-500 tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                    HISTORICAL DATA (6M)
                                </div>
                            </div>

                            <div className="h-[380px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={MOCK_HISTORY}>
                                        <defs>
                                            <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="date" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(val) => `₹${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'NAV']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="nav"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fill="url(#navGradient)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel (Actions & Statistics) */}
                    <div className="space-y-6">

                        {/* Quick Invest / CTA */}
                        <div className="bg-emerald-600 rounded-3xl p-8 shadow-2xl shadow-emerald-900/30 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-emerald-100 mb-4 font-bold text-xs tracking-widest uppercase">
                                    <ShieldCheck className="w-4 h-4" /> SECURE TRANSACTION
                                </div>
                                <h4 className="text-white text-2xl font-black mb-4">Invest Today</h4>
                                <p className="text-emerald-50 text-sm mb-8 leading-relaxed opacity-80">
                                    Seamlessly add this fund to your portfolio to track automated returns and growth analytics.
                                </p>
                                <button className="w-full bg-white text-emerald-700 font-black py-4 rounded-2xl hover:bg-emerald-50 transition-all hover:shadow-xl active:scale-95 flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" /> ADD TO PORTFOLIO
                                </button>
                            </div>
                        </div>

                        {/* Comprehensive Fund Stats */}
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 p-8 shadow-xl">
                            <h3 className="font-bold text-white mb-8 flex items-center gap-2 tracking-tight">
                                <Info className="w-4 h-4 text-emerald-500" /> Key Statistics
                            </h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 text-sm font-medium">Assets Under Management</span>
                                    <span className="text-white font-black text-sm tracking-tight">
                                        ₹{fund.aum_cr?.toLocaleString()} Cr
                                    </span>
                                </div>

                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 text-sm font-medium">Sharpe Ratio</span>
                                    <span className="text-emerald-400 font-black text-sm">
                                        {typeof fund.sharpe_ratio === 'number' ? fund.sharpe_ratio.toFixed(2) : fund.sharpe_ratio}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 text-sm font-medium">Exit Load / Lock-in</span>
                                    <span className="text-white font-black text-sm uppercase tracking-tighter">
                                        {fund.lock_in_years > 0 ? `${fund.lock_in_years} Years` : 'None'}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center">
                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Market Rating</span>
                                    <div className="flex gap-0.5 text-orange-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (fund.star_rating || 0) ? 'fill-current' : 'opacity-10 text-slate-700'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}