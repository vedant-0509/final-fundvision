// ── FundVision Pro — API Client ────────────────────────────────────────────────
const BASE = '/api/v1';
// const BASE = 'http://localhost:5000/api/v1';

function getToken() { return localStorage.getItem('fv_token'); }
function setTokens(access: string, refresh: string) {
  localStorage.setItem('fv_token', access);
  localStorage.setItem('fv_refresh', refresh);
}
function clearTokens() {
  localStorage.removeItem('fv_token');
  localStorage.removeItem('fv_refresh');
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (d: { email: string; username: string; password: string; full_name?: string }) =>
      req<{ access_token: string; refresh_token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    login: (d: { email: string; password: string }) =>
      req<{ access_token: string; refresh_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
    me: () => req<{ id: number; email: string; username: string; full_name: string | null }>('/auth/me'),
    logout: () => req('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: localStorage.getItem('fv_refresh') }) }),
  },

  funds: {
    list: (params: Record<string, string | number> = {}) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return req<{ total: number; funds: Fund[] }>(`/funds?${qs}`);
    },
    get: (id: number) => req<Fund>(`/funds/${id}`),
    compare: (ids: number[]) => req<{ funds: Fund[] }>('/funds/compare', { method: 'POST', body: JSON.stringify(ids) }),
  },

  portfolio: {
    get: () => req<PortfolioResponse>('/portfolio'),
    add: (d: { fund_id: number; amount: number; investment_type?: string }) =>
      req('/portfolio/add', { method: 'POST', body: JSON.stringify(d) }),
    remove: (fund_id: number) => req(`/portfolio/${fund_id}`, { method: 'DELETE' }),
    transactions: () => req<{ transactions: Transaction[] }>('/portfolio/transactions'),
    forecast: (fund_id: number, years = 5) => req<ForecastResponse>(`/portfolio/forecast/${fund_id}?years=${years}`),
  },

  calculator: {
    sip: (d: object) => req<SipResult>('/calculator/sip', { method: 'POST', body: JSON.stringify(d) }),
    lumpsum: (d: object) => req<LumpsumResult>('/calculator/lumpsum', { method: 'POST', body: JSON.stringify(d) }),
  },

  ai: {
    recommend: (d: object) => req<RecommendResponse>('/ai/recommend', { method: 'POST', body: JSON.stringify(d) }),
    chat: (messages: ChatMsg[], portfolio_context?: object) =>
      req<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ messages, portfolio_context }) }),
    newsSentiment: () => req<{ sentiments: Sentiment[]; overall: { label: string; score: number } }>('/ai/news-sentiment'),
  },

  market: {
    indices: () => req<Record<string, MarketIndex>>('/market/indices'),
  },
};

export { setTokens, clearTokens, getToken };

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Fund {
  id: number; scheme_code: string; name: string; fund_house: string;
  category: string; asset_type: string; nav: number;
  cagr_1y: number; cagr_3y: number; cagr_5y: number; cagr_10y: number | null;
  sharpe_ratio: number; expense_ratio: number; aum_cr: number;
  risk_level: string; star_rating: number | null; lock_in_years: number;
}
export interface Holding { holding_id: number; fund_id: number; name: string; fund_house: string; category: string; asset_type: string; risk_level: string; nav: number; invested: number; current_value: number; gain: number; gain_pct: number; cagr_5y: number; sharpe_ratio: number; expense_ratio: number; star_rating: number | null; investment_type: string; }
export interface HealthScore { overall: number; grade: string; diversification: number; return_quality: number; risk_balance: number; cost_efficiency: number; weighted_cagr: number; weighted_sharpe: number; weighted_expense: number; category_breakdown: Record<string, number>; asset_breakdown: Record<string, number>; rebalancing_advice: AdviceItem[]; strengths: string[]; weaknesses: string[]; }
export interface AdviceItem { priority: string; type: string; title: string; detail: string; action: string; }
export interface PortfolioResponse { holdings: Holding[]; summary: { total_invested: number; total_value: number; total_gain: number; total_gain_pct: number; fund_count: number; }; health: HealthScore; }
export interface Transaction { id: number; fund_name: string; type: string; amount: number; units: number; nav: number; date: string; }
export interface ForecastResponse { fund: { id: number; name: string; nav: number }; projections: { label: string; value: number; projected: boolean }[]; }
export interface SipResult { future_value: number; invested: number; gain: number; gain_pct: number; real_value: number; xirr_approx: number; chart_data: YearPoint[]; milestones: { label: string; year: number }[]; }
export interface LumpsumResult { future_value: number; invested: number; gain: number; gain_pct: number; real_value: number; chart_data: YearPoint[]; }
export interface YearPoint { year: number; label: string; invested: number; corpus: number; real_corpus: number; gain: number; }
export interface RecommendResponse { profile: object; investable_monthly: number; allocation: Record<string, number>; recommendations: Rec[]; ai_explanation: string; }
export interface Rec { category: string; allocation_pct: number; monthly_amount: number; fund: { id: number; name: string; fund_house: string; nav: number; cagr_5y: number; sharpe_ratio: number; expense_ratio: number; risk_level: string; score: number; }; }
export interface ChatMsg { role: 'user' | 'assistant'; content: string; }
export interface Sentiment { headline: string; sentiment: 'positive' | 'negative' | 'neutral'; score: number; impact: string; }
export interface MarketIndex { value: number; change: number; change_pct: number; symbol: string; }
