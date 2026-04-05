import { Search, User, ChevronDown, Menu, X, LogOut, LayoutDashboard, Calculator, Brain } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps { variant?: 'light' | 'dark'; }

export default function Header({ variant = 'light' }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const isDark = variant === 'dark';

  const base = isDark
    ? 'bg-slate-800 border-slate-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const linkCls = isDark
    ? 'text-gray-300 hover:text-white'
    : 'text-gray-700 hover:text-gray-900';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className={`${base} border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-end gap-0.5 h-6">
              <div className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm" />
              <div className="w-1.5 h-5 bg-emerald-500 rounded-sm" />
            </div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              FundVision <span className="text-emerald-500 text-sm font-semibold">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`${linkCls} font-medium transition-colors text-sm tracking-wide`}>HOME</Link>
            <Link to="/screener" className={`${linkCls} font-medium transition-colors text-sm tracking-wide`}>SCREENER</Link>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                className={`${linkCls} font-medium flex items-center gap-1 transition-colors text-sm tracking-wide`}
                onClick={() => setToolsOpen(o => !o)}
                onBlur={() => setTimeout(() => setToolsOpen(false), 150)}
              >
                TOOLS <ChevronDown className={`w-4 h-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>
              {toolsOpen && (
                <div className={`absolute top-full left-0 mt-2 w-52 rounded-xl shadow-xl border py-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  {[
                    { to: '/calculator', icon: <Calculator className="w-4 h-4" />, label: 'SIP / Lumpsum Calc' },
                    { to: '/ai-advisor', icon: <Brain className="w-4 h-4" />, label: 'AI Advisor' },
                    { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Portfolio Dashboard' },
                  ].map(item => (
                    <Link key={item.to} to={item.to}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${linkCls} hover:bg-gray-50 transition-colors ${isDark ? 'hover:bg-slate-700' : ''}`}
                      onClick={() => setToolsOpen(false)}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Search bar (home only) */}
          {location.pathname === '/' && (
            <div className="hidden lg:flex items-center flex-1 max-w-sm mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for a company"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className={`${linkCls} flex items-center gap-2 text-sm font-medium`}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={handleLogout} className={`${linkCls} flex items-center gap-2 text-sm font-medium`}>
                  <LogOut className="w-4 h-4" /> Logout
                </button>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                  {(user.full_name || user.username)[0].toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`${linkCls} flex items-center gap-2 font-medium text-sm`}>
                  <User className="w-4 h-4" /> LOGIN
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                  GET FREE ACCOUNT
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} px-4 py-4 space-y-3`}>
          {[['/', 'Home'], ['/screener', 'Screener'], ['/calculator', 'Calculator'], ['/ai-advisor', 'AI Advisor'], ['/dashboard', 'Dashboard']].map(([to, label]) => (
            <Link key={to} to={to} className={`block ${linkCls} font-medium py-1`} onClick={() => setMobileOpen(false)}>{label}</Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="block text-red-500 font-medium py-1">Logout</button>
          ) : (
            <Link to="/login" className="block text-blue-500 font-medium py-1" onClick={() => setMobileOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
