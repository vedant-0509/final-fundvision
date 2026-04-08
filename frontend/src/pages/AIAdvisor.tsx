import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api, ChatMsg, Rec } from '../api/client';
import { useAuth } from '../context/AuthContext';

// ── CONSTANTS & MAPPINGS ───────────────────────────────────────────────────
const RISK_OPTIONS = ['very_low', 'low', 'medium', 'high', 'very_high'];
const GOAL_OPTIONS = ['wealth', 'retirement', 'education', 'tax', 'house', 'emergency'];
const HORIZON_OPTIONS = ['short', 'medium', 'long', 'very_long'];
const HORIZON_LABELS: Record<string, string> = { short: 'Short (<3yr)', medium: 'Medium (3-7yr)', long: 'Long (7-15yr)', very_long: 'Very Long (15+yr)' };


const SENTIMENT_COLOR: Record<string, string> = {
  Bullish: 'text-emerald-600', positive: 'text-emerald-600',
  Bearish: 'text-red-500', negative: 'text-red-500',
  Neutral: 'text-blue-500', neutral: 'text-gray-500'
};

const SENTIMENT_BG: Record<string, string> = {
  Bullish: 'bg-emerald-50 border-emerald-200', positive: 'bg-emerald-50 border-emerald-200',
  Bearish: 'bg-red-50 border-red-200', negative: 'bg-red-50 border-red-200',
  Neutral: 'bg-blue-50 border-blue-200', neutral: 'bg-gray-50 border-gray-200'
};

const SENTIMENT_DOT: Record<string, string> = {
  Bullish: 'bg-emerald-500', positive: 'bg-emerald-500',
  Bearish: 'bg-red-500', negative: 'bg-red-500',
  Neutral: 'bg-blue-400', neutral: 'bg-gray-400'
};

export default function AIAdvisor() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'recommend' | 'chat' | 'news'>('recommend');

  // Recommend form
  const [profile, setProfile] = useState({ age: 30, annual_income: 600000, risk_appetite: 'medium', investment_horizon: 'long', investment_goal: 'wealth', investable_monthly: 15000 });
  const [recs, setRecs] = useState<{ recommendations: Rec[]; ai_explanation: string; investable_monthly: number } | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hi! I'm FundVision Pro's AI advisor 👋. Ask me anything about mutual funds or SIP strategies." }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // News
  const [news, setNews] = useState<any>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (tab !== 'recommend') return;

    const timer = setTimeout(() => {
      // Only trigger if data is valid
      if (profile.age > 0 && profile.investable_monthly > 0) {
        getRecommendations();
      }
    }, 600); // Wait 600ms so it doesn't fetch on every single keystroke

    return () => clearTimeout(timer);
  }, [profile, tab]); // Triggers when profile changes

  // const getRecommendations = async () => {
  //   setRecLoading(true);
  //   try {
  //     const r = await api.ai.recommend(profile);
  //     setRecs(r as any);
  //   } catch (e: any) {
  //     setRecs(MOCK_RECS as any);
  //   } finally { setRecLoading(false); }
  // }



  const getRecommendations = async () => {
    setRecLoading(true);
    try {
      // Crucial: passing the 'profile' state to your client
      const r = await api.ai.recommend(profile);
      setRecs(r as any);
    } catch (e: any) {
      setRecs(MOCK_RECS as any);
    } finally {
      setRecLoading(false);
    }
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
      setMessages(m => [...m, { role: 'assistant', content: "AI is briefly unavailable. Check your connection." }]);
    } finally { setChatLoading(false); }
  };

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const data = await api.ai.newsSentiment();
      setNews(data);
    } catch {
      setNews(MOCK_NEWS);
    } finally { setNewsLoading(false); }
  };

  useEffect(() => { if (tab === 'news' && !news) loadNews(); }, [tab]);

  const radarData = recs ? [
    { metric: 'CAGR', value: Math.min(100, (recs.recommendations[0]?.fund.cagr_5y || 0) * 4) },
    { metric: 'Sharpe', value: 75 },
    { metric: 'Low Cost', value: 85 },
    { metric: 'Diversif.', value: Math.min(100, recs.recommendations.length * 20) },
    { metric: 'Risk Fit', value: 90 },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" /> AI Investment Advisor
          </h1>
        </div>

        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {([['recommend', '🎯 Recommend'], ['chat', '💬 AI Chat'], ['news', '📰 Sentiment']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'recommend' && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit">
              <h2 className="font-semibold text-gray-900 mb-5">Investment Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Age</label>
                  <input type="number" value={profile.age || ''} onChange={e => setProfile(p => ({ ...p, age: +e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-black bg-white" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Monthly SIP (₹)</label>
                  <input type="number" value={profile.investable_monthly} onChange={e => setProfile(p => ({ ...p, investable_monthly: +e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-black bg-white" />
                </div>
                <div>
                  {/* investable_monthly: +e.target.value */}
                  <label className="text-sm text-gray-600 mb-1 block">Risk Appetite</label>
                  <select value={profile.risk_appetite} onChange={e => setProfile(p => ({ ...p, risk_appetite: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm text-black bg-white capitalize">
                    {RISK_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <button onClick={getRecommendations} disabled={recLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  {recLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  {recLoading ? "Analysing..." : "Get AI Recommendation"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {!recs ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                  <Bot className="w-12 h-12 text-blue-100 mx-auto mb-4" />
                  <p className="text-gray-500 italic">Submit your profile to see tailored fund allocations.</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <p className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2"><Bot size={16} /> AI Strategy</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{recs.ai_explanation}</p>
                  </div>
                  <div className="space-y-3">
                    {recs.recommendations.map((r, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex justify-between items-center">
                        <div>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase font-bold">{r.category}</span>
                          <h4 className="font-bold text-gray-900 mt-1">{r.fund.name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">₹{r.monthly_amount.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Monthly</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[550px]">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {m.role === 'assistant' ? <Bot size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className={`max-w-md px-4 py-2 rounded-2xl text-sm ${m.role === 'assistant' ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t flex gap-2">
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask anything..." className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 ring-blue-500w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-300 focus:border-blue-300" />
              <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-xl"><Send size={20} /></button>
            </div>
          </div>
        )}

        {tab === 'news' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Market Sentiment</h2>
                <p className="text-sm text-gray-500">Real-time AI analysis of Indian market headlines</p>
              </div>
              <button onClick={loadNews} disabled={newsLoading} className="flex items-center gap-2 text-sm border rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors bg-white">
                <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
                {newsLoading ? 'Analysing...' : 'Refresh'}
              </button>
            </div>

            {newsLoading ? (
              <div className="bg-white rounded-xl border p-16 text-center shadow-sm">
                <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Scanning financial news outlets...</p>
              </div>
            ) : news && (
              <>
                <div className={`rounded-2xl border p-6 shadow-md transition-all ${SENTIMENT_BG[news.overall_sentiment || news.overall?.label || 'Neutral']}`}>
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-xl bg-white shadow-inner text-blue-600">
                      <TrendingUp size={28} />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Market Mood: </span>
                      <span className="font-bold">{news.overall_sentiment || news.overall?.label || 'Neutral'}</span>
                      <p className="text-gray-700 text-sm mt-2 leading-relaxed">{news.overall_summary || 'The AI is summarizing the news...'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {(news.sentiments || []).map((s: any, i: number) => (
                    <div key={i} className={`bg-white rounded-xl border p-4 shadow-sm border-l-4 ${SENTIMENT_COLOR[s.sentiment] || 'border-l-blue-400'}`}>
                      <p className="text-sm font-bold text-gray-900 leading-snug mb-1">{s.headline}</p>
                      <p className="text-xs text-gray-500 italic">{s.impact || 'Analysis pending...'}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${SENTIMENT_COLOR[s.sentiment]}`}>{s.sentiment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_RECS = {
  recommendations: [
    { category: 'largecap', monthly_amount: 5250, fund: { name: 'Mirae Asset Large Cap Fund', cagr_5y: 14.2 } },
    { category: 'midcap', monthly_amount: 3750, fund: { name: 'Kotak Emerging Equity Fund', cagr_5y: 19.4 } },
  ],
  ai_explanation: "This portfolio balances growth with stability based on your moderate risk profile.",
};

const MOCK_NEWS = {
  sentiments: [
    { headline: 'RBI keeps repo rate unchanged at 6.5%', sentiment: 'neutral', impact: 'Stable outlook for debt funds.' },
    { headline: 'Nifty 50 hits record high as FII inflows surge', sentiment: 'positive', impact: 'Bullish signal for equity markets.' },
  ],
  overall_sentiment: 'Bullish',
  overall_summary: "Indian markets show strong resilience with record high inflows."
};