import { ExternalLink, Sun, Moon, Monitor, Heart } from 'lucide-react';

// 1. Define the interface for the props coming from App.tsx
interface FooterProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export default function Footer({ currentTheme, onThemeChange }: FooterProps) {

  // Helper to handle the button clicks
  const handleThemeClick = (t: 'light' | 'dark' | 'auto') => {
    onThemeChange(t);
  };

  return (
    <footer className="bg-white dark:bg-[#0B0E14] border-t border-gray-200 dark:border-slate-800 mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-end gap-0.5 h-6">
                <div className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                <div className="w-1.5 h-4 bg-emerald-500 rounded-sm" />
                <div className="w-1.5 h-5 bg-emerald-500 rounded-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FundVision <span className="text-emerald-500 text-sm"></span>
              </span>
            </div>
            <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
              AI-powered mutual fund portfolio analyzer for Indian investors.
            </p>
            <div className="space-y-1">
              <p className="text-gray-400 text-xs">© 2026 FundVision Pro</p>
              <p className="text-gray-600 dark:text-slate-400 text-sm flex items-center gap-1">
                Made with <Heart size={14} className="text-red-500 fill-red-500" /> in India
              </p>
            </div>
            <div className="pt-2">
              <a href="#" className="text-gray-500 dark:text-slate-500 text-xs hover:text-gray-800 dark:hover:text-slate-300 transition-colors">
                Terms & Privacy
              </a>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-900/30 inline-block">
                🔑 Easter Egg: Press <kbd className="font-mono bg-gray-200 dark:bg-slate-800 px-1 rounded text-gray-800 dark:text-slate-200">Ctrl+Shift+F</kbd>
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-wider">Product</h3>
            <ul className="space-y-4">
              {['Screener', 'AI Advisor', 'Calculator', 'Portfolio Dashboard'].map(label => (
                <li key={label}>
                  <a href="#" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm flex items-center gap-2 transition-colors group">
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-wider">Team</h3>
            <p className="text-gray-500 dark:text-slate-500 text-xs mb-3 uppercase font-medium">Developed by</p>
            <ul className="space-y-2.5 text-gray-700 dark:text-slate-300 text-sm">
              {['Shivansh Mishra', 'Vedant Mandhare', 'Krunal Modak', 'Nasim Shah'].map(n => (
                <li key={n} className="hover:text-emerald-500 transition-colors cursor-default">{n}</li>
              ))}
            </ul>
          </div>

          {/* Theme Selector */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-wider">Theme</h3>
            <div className="flex flex-col gap-2 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
              {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['auto', 'Auto', Monitor]] as const).map(([t, label, Icon]) => (
                <button
                  key={t}
                  onClick={() => handleThemeClick(t)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 border ${currentTheme === t
                    ? 'border-blue-500 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${currentTheme === t ? 'text-blue-500' : 'text-gray-400'}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}