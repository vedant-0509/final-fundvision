import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, TrendingUp, Newspaper, RefreshCw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api, ChatMsg, Rec, Sentiment } from '../api/client';
import { useAuth } from '../context/AuthContext';

const RISK_OPTIONS = ['very_low', 'low', 'medium', 'high', 'very_high'];
const GOAL_OPTIONS = ['wealth', 'retirement', 'education', 'tax', 'house', 'emergency'];
const HORIZON_OPTIONS = ['short', 'medium', 'long', 'very_long'];
const HORIZON_LABELS: Record<string, string> = { short: 'Short (<3yr)', medium: 'Medium (3-7yr)', long: 'Long (7-15yr)', very_long: 'Very Long (15+yr)' };

const SENTIMENT_COLOR: Record<string, string> = { positive: 'text-emerald-600', negative: 'text-red-500', neutral: 'text-gray-500' };
const SENTIMENT_BG: Record<string, string> = { positive: 'bg-emerald-50 border-emerald-200', negative: 'bg-red-50 border-red-200', neutral: 'bg-gray-50 border-gray-200' };
const SENTIMENT_DOT: Record<string, string> = { positive: 'bg-emerald-500', negative: 'bg-red-500', neutral: 'bg-gray-400' };

export default function AIAdvisor() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'recommend' | 'chat' | 'news'>('recommend');

  // Recommend form
  const [profile, setProfile] = useState({ age: 30, annual_income: 600000, risk_appetite: 'medium', investment_horizon: 'long', investment_goal: 'wealth', investable_monthly: 15000 });
  const [recs, setRecs] = useState<{ recommendations: Rec[]; ai_explanation: string; investable_monthly: number } | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hi! I'm FundVision Pro's AI advisor 👋. Ask me anything about mutual funds, SIP strategies, or your portfolio. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // News
  const [news, setNews] = useState<{ sentiments: Sentiment[]; overall: { label: string; score: number } } | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getRecommendations = async () => {
    setRecLoading(true);
    try {
      const r = await api.ai.recommend(profile);
      setRecs(r as { recommendations: Rec[]; ai_explanation: string; investable_monthly: number });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setMessages(m => [...m, { role: 'assistant', content: `Note: ${msg}. Showing demo recommendations.` }]);
      setRecs(MOCK_RECS);
    } finally { setRecLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: 'user', content: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setChatLoading(true);
    try {
      const res = await api.ai.chat([...messages, userMsg]);
      setMessages(m => [...m, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "I'm having trouble connecting to the AI. Please check your API key in the backend .env file and try again." }]);
    } finally { setChatLoading(false); }
  };

  const loadNews = async () => {
    setNewsLoading(true);
    try { setNews(await api.ai.newsSentiment()); }
    catch { setNews(MOCK_NEWS); }
    finally { setNewsLoading(false); }
  };

  useEffect(() => { if (tab === 'news' && !news) loadNews(); }, [tab]);

  // Radar data from recommendations
  const radarData = recs ? [
    { metric: 'CAGR', value: Math.min(100, (recs.recommendations[0]?.fund.cagr_5y || 0) * 4) },
    { metric: 'Sharpe', value: Math.min(100, (recs.recommendations[0]?.fund.sharpe_ratio || 0) * 50) },
    { metric: 'Low Cost', value: Math.max(0, 100 - (recs.recommendations[0]?.fund.expense_ratio || 1) * 80) },
    { metric: 'Diversif.', value: Math.min(100, recs.recommendations.length * 20) },
    { metric: 'Risk Fit', value: profile.risk_appetite === 'medium' ? 80 : profile.risk_appetite === 'low' ? 95 : 70 },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="light" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" /> AI Investment Advisor
          </h1>
          <p className="text-gray-500 mt-1">Powered by Claude — personalised fund recommendations and market insights</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {([['recommend', '🎯 Get Recommendations'], ['chat', '💬 AI Chat'], ['news', '📰 Market Sentiment']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: RECOMMEND ─────────────────────────────────────────────────── */}
        {tab === 'recommend' && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Input form */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit">
              <h2 className="font-semibold text-gray-900 mb-5">Your Investment Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Age</label>
                  <input type="number" min={18} max={80} value={profile.age} onChange={e => setProfile(p => ({ ...p, age: +e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Annual Income (₹)</label>
                  <input type="number" value={profile.annual_income} onChange={e => setProfile(p => ({ ...p, annual_income: +e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Monthly SIP Budget (₹)</label>
                  <input type="number" value={profile.investable_monthly} onChange={e => setProfile(p => ({ ...p, investable_monthly: +e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Risk Appetite</label>
                  <select value={profile.risk_appetite} onChange={e => setProfile(p => ({ ...p, risk_appetite: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white capitalize">
                    {RISK_OPTIONS.map(r => <option key={r} value={r} className="capitalize">{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Investment Goal</label>
                  <select value={profile.investment_goal} onChange={e => setProfile(p => ({ ...p, investment_goal: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white capitalize">
                    {GOAL_OPTIONS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Investment Horizon</label>
                  <select value={profile.investment_horizon} onChange={e => setProfile(p => ({ ...p, investment_horizon: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                    {HORIZON_OPTIONS.map(h => <option key={h} value={h}>{HORIZON_LABELS[h]}</option>)}
                  </select>
                </div>
                <button onClick={getRecommendations} disabled={recLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {recLoading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Analysing…</> : <><Sparkles className="w-5 h-5" /> Get AI Recommendation</>}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-4">
              {!recs ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                  <Sparkles className="w-12 h-12 text-blue-200 mx-auto mb-4" />
                  <p className="text-gray-500">Fill in your profile and click "Get AI Recommendation" to receive a personalised mutual fund portfolio.</p>
                </div>
              ) : (
                <>
                  {/* AI Explanation */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 text-sm mb-2">AI Advisor's Analysis</p>
                        <p className="text-gray-700 text-sm leading-relaxed">{recs.ai_explanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Radar chart */}
                  {radarData.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <p className="font-semibold text-gray-900 text-sm mb-3">Portfolio Quality Radar</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Fund cards */}
                  <div className="space-y-3">
                    {recs.recommendations.map((r, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium capitalize">{r.category}</span>
                              <span className="text-xs text-gray-500">{r.allocation_pct}% allocation</span>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm truncate">{r.fund.name}</p>
                            <p className="text-xs text-gray-400">{r.fund.fund_house}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-emerald-600">₹{r.monthly_amount.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-gray-400">per month</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                          <div><p className="text-xs text-gray-400">5Y CAGR</p><p className="font-semibold text-emerald-600 text-sm">{r.fund.cagr_5y?.toFixed(1)}%</p></div>
                          <div><p className="text-xs text-gray-400">Sharpe</p><p className="font-semibold text-gray-900 text-sm">{r.fund.sharpe_ratio?.toFixed(2)}</p></div>
                          <div><p className="text-xs text-gray-400">Expense</p><p className={`font-semibold text-sm ${(r.fund.expense_ratio||0) > 1 ? 'text-red-500' : 'text-gray-900'}`}>{r.fund.expense_ratio?.toFixed(2)}%</p></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 text-center px-4">⚠️ Investments are subject to market risk. Past performance is not indicative of future results. Please read all scheme documents carefully.</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: CHAT ──────────────────────────────────────────────────────── */}
        {tab === 'chat' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    {m.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <UserIcon className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-5 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto">
              {['Best ELSS for tax saving?', 'Explain Sharpe Ratio', 'SIP vs Lumpsum?', 'How to rebalance portfolio?'].map(p => (
                <button key={p} onClick={() => { setInput(p); }}
                  className="flex-shrink-0 text-xs border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors">
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask me about mutual funds, SIP, taxes…"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={sendMessage} disabled={chatLoading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-2.5 rounded-xl transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

/* ── TAB: NEWS SENTIMENT ─────────────────────────────────────────────── */
{tab === 'news' && (
  <div className="space-y-6">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h2 className="font-bold text-gray-900 text-lg">Market Sentiment Analysis</h2>
        <p className="text-sm text-gray-500">Real-time AI analysis of Indian market headlines</p>
      </div>
      <button 
        onClick={loadNews} 
        disabled={newsLoading}
        className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm bg-white"
      >
        <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} /> 
        {newsLoading ? 'Analysing...' : 'Refresh'}
      </button>
    </div>

    {newsLoading ? (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Scanning financial news outlets...</p>
        <p className="text-xs text-gray-400 mt-1">Our AI is determining the impact on your portfolio</p>
      </div>
    ) : news ? (
      <>
        /* Overall Sentiment Highlight Gauge */
        <div className={`rounded-2xl border p-6 shadow-md transition-all ${
          news?.overall_sentiment ? SENTIMENT_BG[news.overall_sentiment] : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-xl shadow-inner ${
              news?.overall_sentiment === 'Bullish' ? 'bg-white text-emerald-600' : 
              news?.overall_sentiment === 'Bearish' ? 'bg-white text-red-600' : 'bg-white text-blue-600'
            }`}>
              <TrendingUp size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Market Mood</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  news?.overall_sentiment === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : 
                  news?.overall_sentiment === 'Bearish' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {news?.overall_sentiment || 'Neutral'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mt-1">
                {news?.overall_sentiment === 'Bullish' ? 'Optimistic Outlook' : 
                 news?.overall_sentiment === 'Bearish' ? 'Cautions Advised' : 'Steady Consolidation'}
              </h3>
              <p className="text-gray-700 text-sm mt-2 leading-relaxed max-w-2xl">
                {news?.overall_summary || 'The AI is currently processing the latest market headlines to give you a summary.'}
              </p>
            </div>
          </div>
        </div>

        {/* Individual Headlines Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {(news?.sentiments || []).map((s: any, i: number) => {
            // Normalize sentiment key for the color maps
            const mood = s.sentiment || 'Neutral';
            return (
              <div key={i} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${
                mood === 'Bullish' || mood === 'positive' ? 'border-l-emerald-500' : 
                mood === 'Bearish' || mood === 'negative' ? 'border-l-red-500' : 'border-l-blue-400'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SENTIMENT_DOT[mood] || 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug mb-1 line-clamp-2">
                      {s.headline}
                    </p>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 italic">
                      {s.impact || 'Analysis pending...'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLOR[mood]}`}>
                        {mood}
                      </span>
                      {s.score !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${s.score > 0.5 ? 'bg-emerald-500' : 'bg-blue-400'}`} 
                              style={{ width: `${(s.score || 0.5) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {(s.score || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-gray-400 py-4">
           <Bot size={14} />
           <p className="text-[10px] uppercase tracking-widest font-semibold">AI analysis based on Top 5 Indian Financial Headlines</p>
        </div>
      </>
    ) : null}
  </div>
)}

// ── Mock fallbacks ─────────────────────────────────────────────────────────────
const MOCK_RECS = {
  recommendations: [
    { category: 'largecap', allocation_pct: 35, monthly_amount: 5250, fund: { id: 1, name: 'Mirae Asset Large Cap Fund', fund_house: 'Mirae Asset', nav: 95.4, cagr_5y: 14.2, sharpe_ratio: 1.42, expense_ratio: 0.54, risk_level: 'Low', score: 8.2 } },
    { category: 'midcap', allocation_pct: 25, monthly_amount: 3750, fund: { id: 5, name: 'Kotak Emerging Equity Fund', fund_house: 'Kotak', nav: 112.4, cagr_5y: 19.4, sharpe_ratio: 1.54, expense_ratio: 0.44, risk_level: 'High', score: 9.1 } },
    { category: 'debt', allocation_pct: 15, monthly_amount: 2250, fund: { id: 8, name: 'SBI Magnum Gilt Fund', fund_house: 'SBI', nav: 62.1, cagr_5y: 7.4, sharpe_ratio: 0.81, expense_ratio: 0.44, risk_level: 'Low', score: 6.4 } },
    { category: 'hybrid', allocation_pct: 15, monthly_amount: 2250, fund: { id: 7, name: 'ICICI Pru Equity & Debt Fund', fund_house: 'ICICI Prudential', nav: 302.4, cagr_5y: 15.3, sharpe_ratio: 1.22, expense_ratio: 1.07, risk_level: 'Moderate', score: 7.6 } },
  ],
  ai_explanation: "Based on your moderate risk profile and long-term wealth creation goal, this portfolio balances growth with stability. The 35% large-cap allocation provides a solid blue-chip foundation with lower volatility. Mid-cap funds at 25% add growth potential — historically outperforming large-caps over 7+ year horizons. The 15% debt cushion reduces drawdown risk during market corrections, while the hybrid allocation acts as a natural rebalancer. For a 15-year horizon, this mix historically delivers 13–15% CAGR with manageable volatility. Key risk: mid-cap funds can fall 30–40% in bear markets — maintain SIP discipline and avoid panic selling.",
  investable_monthly: 15000,
};

const MOCK_NEWS = {
  sentiments: [
    { headline: 'RBI keeps repo rate unchanged at 6.5%, signals cautious stance on inflation', sentiment: 'neutral' as const, score: 0.05, impact: 'Neutral for equity markets; positive for debt funds as rate cycle may have peaked.' },
    { headline: 'Nifty 50 hits record high as FII inflows surge ₹12,000 Cr in single session', sentiment: 'positive' as const, score: 0.82, impact: 'Bullish signal for equity mutual funds. FII confidence in Indian markets is high.' },
    { headline: 'SEBI tightens expense ratio norms for direct mutual fund plans', sentiment: 'positive' as const, score: 0.65, impact: 'Positive for investors — lower costs mean higher net returns compounding over time.' },
    { headline: 'Global recession fears mount as US Fed signals prolonged high rates', sentiment: 'negative' as const, score: -0.68, impact: 'Negative for export-heavy sectors. May cause short-term FII outflows from EM markets.' },
    { headline: 'India GDP growth forecast revised upward to 7.2% by IMF for FY25', sentiment: 'positive' as const, score: 0.78, impact: 'Strongly bullish for domestic consumption and financial sector funds.' },
  ],
  overall: { label: 'positive', score: 0.32 },
};