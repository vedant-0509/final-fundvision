# import React, { useState, useEffect } from 'react';
# import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
# import { Calculator as CalcIcon, TrendingUp, Plus, CheckCircle, Moon, Sun } from 'lucide-react';
# import Header from '../components/Header';
# import Footer from '../components/Footer';
# import { api } from '../api/client';

# // ── Interfaces ───────────────────────────────────────────────────────────────
# interface ChartPoint {
#   year: number;
#   corpus: number;
#   invested: number;
# }

# interface SuggestedFund {
#   id: number;
#   name: string;
#   category: string;
#   cagr_5y: number;
# }

# interface CalcResult {
#   future_value: number;
#   gain: number;
#   chart_data: ChartPoint[];
#   suggestions: SuggestedFund[];
# }

# export default function Calculator() {
#   // ── State ──────────────────────────────────────────────────────────────────
#   const [type, setType] = useState<'sip' | 'lumpsum'>('sip');
#   const [amount, setAmount] = useState<number>(5000);
#   const [rate, setRate] = useState<number>(12);
#   const [years, setYears] = useState<number>(10);
#   const [result, setResult] = useState<CalcResult | null>(null);
#   const [loading, setLoading] = useState<boolean>(false);
#   const [addedId, setAddedId] = useState<number | null>(null);

#   // Initialize theme from localStorage safely
#   const [isDark, setIsDark] = useState<boolean>(() => {
#     if (typeof window !== 'undefined') {
#       return localStorage.getItem('theme') === 'dark';
#     }
#     return false;
#   });

#   // ── Effects ────────────────────────────────────────────────────────────────

#   // Theme Sync
#   useEffect(() => {
#     if (isDark) {
#       document.documentElement.classList.add('dark');
#       localStorage.setItem('theme', 'dark');
#     } else {
#       document.documentElement.classList.remove('dark');
#       localStorage.setItem('theme', 'light');
#     }
#   }, [isDark]);

#   // Debounced Calculation
#   useEffect(() => {
#     const calculate = async () => {
#       setLoading(true);
#       try {
#         const payload = type === 'sip' 
#           ? { monthly_amount: amount, expected_return: rate, tenure_years: years }
#           : { principal: amount, expected_return: rate, tenure_years: years };
        
#         const res = await api.post(`/calculator/${type}`, payload);
#         setResult(res.data);
#       } catch (err) {
#         console.error("Calculation failed", err);
#       } finally {
#         setLoading(false);
#       }
#     };

#     const timer = setTimeout(calculate, 300);
#     return () => clearTimeout(timer);
#   }, [type, amount, rate, years]);

#   // ── Handlers ───────────────────────────────────────────────────────────────
#   const handleAddFund = async (fundId: number) => {
#     try {
#       await api.post(`/portfolio/add/${fundId}`, { 
#         amount: type === 'sip' ? amount : 0, 
#         investment_type: type 
#       });
#       setAddedId(fundId);
#       setTimeout(() => setAddedId(null), 2000);
#     } catch (err) {
#       alert("Please login to add funds to your portfolio.");
#     }
#   };

#   return (
#     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
#       <Header variant="light" />
      
#       <main className="max-w-7xl mx-auto px-4 py-12">
#         {/* Header Section */}
#         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
#           <div className="flex items-center gap-3">
#             <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
#               <CalcIcon className="w-8 h-8 text-white" />
#             </div>
#             <div>
#               <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Wealth Planner</h1>
#               <p className="text-gray-500 dark:text-gray-400">See your money grow over time</p>
#             </div>
#           </div>
          
#           <button 
#             onClick={() => setIsDark(!isDark)}
#             className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
#           >
#             {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
#             <span className="text-sm font-bold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
#           </button>
#         </div>

#         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
#           {/* Sidebar Inputs */}
#           <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl h-fit">
#             <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-8">
#               {(['sip', 'lumpsum'] as const).map((t) => (
#                 <button 
#                   key={t}
#                   onClick={() => setType(t)}
#                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${
#                     type === t ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500'
#                   }`}
#                 >{t}</button>
#               ))}
#             </div>

#             <div className="space-y-8">
#               <div className="group">
#                 <div className="flex justify-between mb-2">
#                   <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
#                     {type === 'sip' ? 'Monthly Investment' : 'One-time Investment'}
#                   </label>
#                   <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{amount.toLocaleString()}</span>
#                 </div>
#                 <input type="range" min="500" max="100000" step="500" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
#               </div>

#               <div className="group">
#                 <div className="flex justify-between mb-2">
#                   <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Expected Return</label>
#                   <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{rate}% p.a.</span>
#                 </div>
#                 <input type="range" min="1" max="30" step="0.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
#               </div>

#               <div className="group">
#                 <div className="flex justify-between mb-2">
#                   <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Duration</label>
#                   <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{years} Years</span>
#                 </div>
#                 <input type="range" min="1" max="40" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
#               </div>
#             </div>
#           </div>

#           {/* Visualization Section */}
#           <div className="lg:col-span-2 space-y-8">
#             <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
#               <div className="grid grid-cols-2 gap-4 mb-10">
#                 <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
#                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Final Wealth</p>
#                   <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹{result?.future_value.toLocaleString() || 0}</p>
#                 </div>
#                 <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
#                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Gains</p>
#                   <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{result?.gain.toLocaleString() || 0}</p>
#                 </div>
#               </div>

#               <div className="h-[320px] w-full">
#                 <ResponsiveContainer width="100%" height="100%">
#                   <AreaChart data={result?.chart_data || []}>
#                     <defs>
#                       <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
#                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
#                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
#                       </linearGradient>
#                     </defs>
#                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f1f5f9'} />
#                     <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
#                     <YAxis hide />
#                     <Tooltip 
#                       contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
#                       itemStyle={{ fontWeight: 'bold' }}
#                       formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total Value']}
#                     />
#                     <Area type="monotone" dataKey="corpus" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#wealthGradient)" />
#                     <Area type="monotone" dataKey="invested" stroke="#94a3b8" strokeWidth={2} fill={isDark ? '#374151' : '#f8fafc'} />
#                   </AreaChart>
#                 </ResponsiveContainer>
#               </div>
#             </div>

#             {/* Fund Suggestions */}
#             <div>
#               <div className="flex items-center justify-between mb-4">
#                 <div className="flex items-center gap-2">
#                   <TrendingUp className="w-5 h-5 text-indigo-600" />
#                   <h3 className="font-bold text-gray-900 dark:text-white">Top Recommended Funds</h3>
#                 </div>
#                 <span className="text-xs text-gray-400 font-medium">Targeting {rate}% CAGR</span>
#               </div>
              
#               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
#                 {result?.suggestions?.map((fund) => (
#                   <div key={fund.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group">
#                     <div className="flex justify-between items-start mb-3">
#                       <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md font-black uppercase">
#                         {fund.category}
#                       </span>
#                       <div className="text-right">
#                         <p className="text-[10px] text-gray-400 font-bold uppercase">5Y Return</p>
#                         <p className="text-sm font-black text-emerald-600">{fund.cagr_5y}%</p>
#                       </div>
#                     </div>
                    
#                     <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-4 line-clamp-2 h-10">
#                       {fund.name}
#                     </h4>

#                     <button 
#                       onClick={() => handleAddFund(fund.id)}
#                       disabled={addedId === fund.id}
#                       className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
#                         addedId === fund.id 
#                           ? 'bg-emerald-500 text-white' 
#                           : 'bg-gray-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white shadow-sm'
#                       }`}
#                     >
#                       {addedId === fund.id ? (
#                         <><CheckCircle className="w-4 h-4" /> Added</>
#                       ) : (
#                         <><Plus className="w-4 h-4" /> Add to Portfolio</>
#                       )}
#                     </button>
#                   </div>
#                 ))}
#               </div>
#             </div>
#           </div>
#         </div>
#       </main>
#       <Footer />
#     </div>
#   );
# }



# """
# FundVision Pro — Calculator Router
# ====================================
# High-precision SIP and Lumpsum calculators with inflation adjustment
# and time-series projection data for charting.
# """

# import math
# from fastapi import APIRouter, Depends
# from pydantic import BaseModel, Field
# from sqlalchemy.ext.asyncio import AsyncSession

# from ..database import get_db
# from ..utils.forecasting import project_sip_corpus, project_lumpsum_corpus

# router = APIRouter()


# # ── Schemas ────────────────────────────────────────────────────────────────────
# class SIPRequest(BaseModel):
#     monthly_amount: float = Field(..., gt=0, description="Monthly SIP amount in ₹")
#     expected_return: float = Field(..., gt=0, le=100, description="Expected annual return %")
#     tenure_years: int = Field(..., ge=1, le=40, description="Investment tenure in years")
#     inflation_rate: float = Field(6.0, ge=0, le=20, description="Inflation rate %")
#     step_up_pct: float = Field(0.0, ge=0, le=50, description="Annual SIP step-up %")


# class LumpsumRequest(BaseModel):
#     principal: float = Field(..., gt=0, description="One-time investment in ₹")
#     expected_return: float = Field(..., gt=0, le=100)
#     tenure_years: int = Field(..., ge=1, le=40)
#     inflation_rate: float = Field(6.0, ge=0, le=20)


# class CompareRequest(BaseModel):
#     sip: SIPRequest
#     lumpsum: LumpsumRequest


# # ── SIP Calculator ─────────────────────────────────────────────────────────────
# @router.post("/sip")
# async def calculate_sip(body: SIPRequest):
#     """
#     SIP Future Value with optional annual step-up and inflation adjustment.
#     Formula: FV = Σ (P × (1+r)^n) for step-up SIPs.
#     """
#     r = body.expected_return / 100 / 12      # monthly return
#     infl = body.inflation_rate / 100 / 12    # monthly inflation
#     n_total = body.tenure_years * 12

#     # Standard SIP (no step-up)
#     if body.step_up_pct == 0:
#         if r == 0:
#             fv = body.monthly_amount * n_total
#         else:
#             fv = body.monthly_amount * (((1 + r) ** n_total - 1) / r) * (1 + r)
#         invested = body.monthly_amount * n_total
#     else:
#         # Step-up SIP: recalculate each year
#         fv, invested = 0.0, 0.0
#         monthly = body.monthly_amount
#         for year in range(1, body.tenure_years + 1):
#             months_remaining = (body.tenure_years - year + 1) * 12
#             if r == 0:
#                 fv += monthly * 12
#             else:
#                 year_fv = monthly * (((1 + r) ** 12 - 1) / r) * (1 + r)
#                 fv += year_fv * ((1 + r) ** (months_remaining - 12))
#             invested += monthly * 12
#             monthly *= (1 + body.step_up_pct / 100)

#     real_fv = fv / ((1 + body.inflation_rate / 100) ** body.tenure_years)
#     gain = fv - invested

#     # XIRR approximation
#     xirr_approx = ((fv / invested) ** (1 / body.tenure_years) - 1) * 100 if invested > 0 else 0

#     # Year-by-year projection for chart
#     chart_data = project_sip_corpus(
#         body.monthly_amount, body.expected_return, body.tenure_years, body.inflation_rate
#     )

#     # Milestones
#     milestones = []
#     for point in chart_data:
#         if point["corpus"] >= 1_000_000 and not any(m["label"] == "₹10 Lakh" for m in milestones):
#             milestones.append({"label": "₹10 Lakh", "year": point["year"]})
#         if point["corpus"] >= 10_000_000 and not any(m["label"] == "₹1 Crore" for m in milestones):
#             milestones.append({"label": "₹1 Crore", "year": point["year"]})
#         if point["corpus"] >= 100_000_000 and not any(m["label"] == "₹10 Crore" for m in milestones):
#             milestones.append({"label": "₹10 Crore", "year": point["year"]})

#     return {
#         "future_value": round(fv),
#         "invested": round(invested),
#         "gain": round(gain),
#         "gain_pct": round(gain / invested * 100, 2) if invested > 0 else 0,
#         "real_value": round(real_fv),
#         "real_gain_pct": round((real_fv - invested) / invested * 100, 2) if invested > 0 else 0,
#         "xirr_approx": round(xirr_approx, 2),
#         "chart_data": chart_data,
#         "milestones": milestones,
#         "summary": {
#             "monthly": round(body.monthly_amount),
#             "rate": body.expected_return,
#             "years": body.tenure_years,
#             "step_up": body.step_up_pct,
#         },
#     }


# # ── Lumpsum Calculator ─────────────────────────────────────────────────────────
# @router.post("/lumpsum")
# async def calculate_lumpsum(body: LumpsumRequest):
#     """Lumpsum compound growth with inflation-adjusted real returns."""
#     fv = body.principal * ((1 + body.expected_return / 100) ** body.tenure_years)
#     real_fv = fv / ((1 + body.inflation_rate / 100) ** body.tenure_years)
#     gain = fv - body.principal
#     cagr = body.expected_return

#     chart_data = project_lumpsum_corpus(
#         body.principal, body.expected_return, body.tenure_years, body.inflation_rate
#     )

#     return {
#         "future_value": round(fv),
#         "invested": round(body.principal),
#         "gain": round(gain),
#         "gain_pct": round(gain / body.principal * 100, 2),
#         "real_value": round(real_fv),
#         "real_gain_pct": round((real_fv - body.principal) / body.principal * 100, 2),
#         "cagr": cagr,
#         "chart_data": chart_data,
#         "summary": {
#             "principal": round(body.principal),
#             "rate": body.expected_return,
#             "years": body.tenure_years,
#         },
#     }


# # ── SIP vs Lumpsum Comparison ──────────────────────────────────────────────────
# @router.post("/compare")
# async def compare_sip_vs_lumpsum(body: CompareRequest):
#     """Compare SIP and lumpsum strategies side by side."""
#     sip_result = await calculate_sip(body.sip)
#     ls_result = await calculate_lumpsum(body.lumpsum)
#     winner = "sip" if sip_result["gain_pct"] > ls_result["gain_pct"] else "lumpsum"
#     return {
#         "sip": sip_result,
#         "lumpsum": ls_result,
#         "winner": winner,
#         "insight": (
#             "SIP wins on rupee cost averaging and affordability — ideal for salaried investors. "
#             "Lumpsum wins if markets are at a low — requires timing discipline."
#         ),
#     }
# is this calculator.py


"""
FundVision Pro — Calculator Router
====================================
High-precision SIP and Lumpsum calculators with inflation adjustment
and Top Fund recommendations.
"""

import math
from typing import List, Dict
from fastapi import APIRouter
from pydantic import BaseModel, Field

# Mock utility imports (Ensure these exist in your utils/forecasting.py)
# from ..utils.forecasting import project_sip_corpus, project_lumpsum_corpus

router = APIRouter()

# ── Top Funds Data ────────────────────────────────────────────────────────────
def get_top_funds() -> List[Dict]:
    return [
        {"name": "Quant Small Cap Fund", "return_3yr": "35.2%", "risk": "Very High", "category": "Small Cap"},
        {"name": "Parag Parikh Flexi Cap", "return_3yr": "22.8%", "risk": "Moderate", "category": "Flexi Cap"},
        {"name": "ICICI Prudential Bluechip", "return_3yr": "18.5%", "risk": "Low", "category": "Bluechip"}
    ]

# ── Schemas ────────────────────────────────────────────────────────────────────
class SIPRequest(BaseModel):
    monthly_amount: float = Field(..., gt=0)
    expected_return: float = Field(..., gt=0, le=100)
    tenure_years: int = Field(..., ge=1, le=40)
    inflation_rate: float = Field(6.0, ge=0, le=20)
    step_up_pct: float = Field(0.0, ge=0, le=50)

class LumpsumRequest(BaseModel):
    principal: float = Field(..., gt=0)
    expected_return: float = Field(..., gt=0, le=100)
    tenure_years: int = Field(..., ge=1, le=40)
    inflation_rate: float = Field(6.0, ge=0, le=20)

# ── SIP Calculator ─────────────────────────────────────────────────────────────
@router.post("/sip")
async def calculate_sip(body: SIPRequest):
    r = body.expected_return / 100 / 12
    n_total = body.tenure_years * 12

    # Calculation logic
    if body.step_up_pct == 0:
        fv = body.monthly_amount * (((1 + r) ** n_total - 1) / r) * (1 + r)
        invested = body.monthly_amount * n_total
    else:
        fv, invested = 0.0, 0.0
        monthly = body.monthly_amount
        for year in range(1, body.tenure_years + 1):
            months_remaining = (body.tenure_years - year + 1) * 12
            year_fv = monthly * (((1 + r) ** 12 - 1) / r) * (1 + r)
            fv += year_fv * ((1 + r) ** (months_remaining - 12))
            invested += monthly * 12
            monthly *= (1 + body.step_up_pct / 100)

    real_fv = fv / ((1 + body.inflation_rate / 100) ** body.tenure_years)

    return {
        "future_value": round(fv),
        "invested": round(invested),
        "gain": round(fv - invested),
        "real_value_adjusted": round(real_fv),
        "top_recommended_funds": get_top_funds()  # Added Top Funds here
    }

# ── Lumpsum Calculator ─────────────────────────────────────────────────────────
@router.post("/lumpsum")
async def calculate_lumpsum(body: LumpsumRequest):
    fv = body.principal * ((1 + body.expected_return / 100) ** body.tenure_years)
    invested = body.principal
    
    return {
        "future_value": round(fv),
        "invested": round(invested),
        "gain": round(fv - invested),
        "top_recommended_funds": get_top_funds() # Added Top Funds here
    }