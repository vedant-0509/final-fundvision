import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Calculator as CalcIcon, 
  TrendingUp, 
  Moon, 
  Sun, 
  Zap, 
  ShieldCheck, 
  CheckCircle,
  IndianRupee,
  ArrowUpRight
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api, SipResult, LumpsumResult } from '../api/client';

type Mode = 'sip' | 'lumpsum';

const fmt = (n: number) => 
  `₹${n >= 10000000 ? (n/10000000).toFixed(2)+'Cr' : n >= 100000 ? (n/100000).toFixed(2)+'L' : n.toLocaleString('en-IN')}`;

// --- Top 3 Recommended Funds Data ---
const TOP_FUNDS = [
  { name: "Quant Small Cap Fund", return: "35.2%", risk: "Very High", icon: <Zap className="text-orange-500 w-4 h-4" /> },
  { name: "Parag Parikh Flexi Cap", return: "22.8%", risk: "Moderate", icon: <ShieldCheck className="text-blue-500 w-4 h-4" /> },
  { name: "ICICI Prudential Bluechip", return: "18.5%", risk: "Low", icon: <TrendingUp className="text-green-500 w-4 h-4" /> }
];

export default function Calculator() {
  // 1. State Management (As seen in your screenshot)
  const [mode, setMode] = useState<Mode>('sip');
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  const [result, setResult] = useState<SipResult | LumpsumResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  // 2. Theme Toggle Logic (Fixed from your screenshot)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // 3. Calculation Handler
  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = mode === 'sip' 
        ? await api.calculator.sip({ 
            monthly_amount: amount, 
            expected_return: rate, 
            tenure_years: years, 
            inflation_rate: 6, 
            step_up_pct: 0 
          })
        : await api.calculator.lumpsum({ 
            principal: amount, 
            expected_return: rate, 
            tenure_years: years, 
            inflation_rate: 6 
          });
      setResult(response);
    } catch (error) {
      console.error("Calculation Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <Header variant={isDark ? 'dark' : 'light'} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">FundVision Pro</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Smart Investment Forecaster</p>
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
          >
            {isDark ? <Sun className="text-yellow-400 w-6 h-6" /> : <Moon className="text-blue-600 w-6 h-6" />}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* --- Input Panel --- */}
          <div className="lg:col-span-1 p-8 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700">
            <div className="flex p-1.5 bg-gray-100 dark:bg-slate-900 rounded-2xl mb-8">
              <button 
                onClick={() => setMode('sip')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'sip' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                SIP
              </button>
              <button 
                onClick={() => setMode('lumpsum')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'lumpsum' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Lumpsum
              </button>
            </div>

            <div className="space-y-10">
              <InputGroup 
                label={mode === 'sip' ? "Monthly SIP" : "One-time Investment"} 
                value={amount} 
                min={500} 
                max={1000000} 
                step={500}
                onChange={setAmount}
                format={fmt}
              />
              <InputGroup 
                label="Expected Return (% p.a)" 
                value={rate} 
                min={1} 
                max={30} 
                step={0.5}
                onChange={setRate}
                format={(v: number) => `${v}%`}
              />
              <InputGroup 
                label="Tenure (Years)" 
                value={years} 
                min={1} 
                max={40} 
                step={1}
                onChange={setYears}
                format={(v: number) => `${v} Yrs`}
              />
            </div>

            <button 
              onClick={handleCalculate}
              disabled={loading}
              className="w-full mt-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : <><TrendingUp size={20} /> Calculate Wealth</>}
            </button>
          </div>

          {/* --- Results & Projections --- */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ResultCard label="Invested Amount" value={fmt(result.invested)} icon={<IndianRupee className="text-blue-500" />} />
                  <ResultCard label="Estimated Returns" value={fmt(result.gain)} icon={<ArrowUpRight className="text-emerald-500" />} />
                  
                  <div className="md:col-span-2 p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Total Expected Wealth</p>
                      <p className="text-5xl font-black">{fmt(result.future_value)}</p>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  </div>
                </div>

                {/* Top 3 Funds Section */}
                <div className="p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <CheckCircle className="text-blue-500" size={24} /> Best Funds for your Plan
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TOP_FUNDS.map((fund, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-700 group hover:border-blue-500 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">{fund.icon}</div>
                          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {fund.risk}
                          </span>
                        </div>
                        <p className="font-bold text-sm mb-1 text-gray-700 dark:text-gray-200 truncate">{fund.name}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{fund.return}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">ANNUALIZED RETURNS</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-blue-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                  <CalcIcon size={40} className="text-blue-200 dark:text-slate-700" />
                </div>
                <h2 className="text-xl font-bold mb-2">Ready to plan?</h2>
                <p className="text-gray-400 text-center max-w-xs">Adjust your investment details and hit calculate to see the magic happen.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- Internal Helper Components ---

function InputGroup({ label, value, min, max, step, onChange, format }: any) {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{label}</label>
        <span className="text-base font-black text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">{format(value)}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
      />
    </div>
  );
}

function ResultCard({ label, value, icon }: any) {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}