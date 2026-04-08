// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext';

// // Pages
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Screener from './pages/Screener';
// import Calculator from './pages/Calculator';
// import AIAdvisor from './pages/AIAdvisor';
// import FundDetails from './pages/FundDetails';

// // Components
// import Footer from './components/Footer';
// import Header from './components/Header';

// // ── Easter Egg Logic ──────────────────────────────────────────────────────────
// function EasterEgg() {
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.ctrlKey && e.shiftKey && e.key === 'F') launchRockets();
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, []);
//   return null;
// }

// function launchRockets() {
//   const emojis = ['🚀', '💰', '📈', '🌙', '⭐', '💎', '🎯'];
//   const container = document.createElement('div');
//   container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
//   document.body.appendChild(container);

//   for (let i = 0; i < 30; i++) {
//     const el = document.createElement('div');
//     el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
//     const delay = Math.random() * 3;
//     const dur = 2.5 + Math.random() * 3;
//     el.style.cssText = `position:fixed;left:${Math.random() * 100}vw;bottom:-80px;font-size:${24 + Math.random() * 28}px;animation:floatRocket ${dur}s ${delay}s linear forwards;`;
//     container.appendChild(el);
//   }

//   if (!document.getElementById('rocket-kf')) {
//     const style = document.createElement('style');
//     style.id = 'rocket-kf';
//     style.textContent = `@keyframes floatRocket{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-110vh);opacity:0}}`;
//     document.head.appendChild(style);
//   }

//   setTimeout(() => container.remove(), 8000);
// }

// // ── Protected Route Helper ────────────────────────────────────────────────────
// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
//   return user ? <>{children}</> : <Navigate to="/login" replace />;
// }

// export default function App() {
//   const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

//   useEffect(() => {
//     const root = window.document.documentElement;
//     const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
//     root.classList.toggle('dark', isDark);
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   return (
//     <AuthProvider>
//       <div className={theme === 'dark' ? 'dark' : ''}>
//         <Router>
//           <EasterEgg />
//           <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-900 dark:text-slate-200">
//             <Header />
//             <main className="flex-grow">
//               <Routes>
//                 <Route path="/" element={<Home />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/register" element={<Register />} />
//                 <Route path="/screener" element={<Screener />} />
//                 <Route path="/calculator" element={<Calculator />} />
//                 <Route path="/fund/:ticker" element={<FundDetails />} />

//                 <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//                 <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />

//                 <Route path="*" element={<Navigate to="/" replace />} />
//               </Routes>
//             </main>
//             <Footer currentTheme={theme} onThemeChange={setTheme} />
//           </div>
//         </Router>
//       </div>
//     </AuthProvider>
//   );
// }




























































import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import Calculator from './pages/Calculator';
import AIAdvisor from './pages/AIAdvisor';
import FundDetails from './pages/FundDetails';

// Components
import Footer from './components/Footer';
import Header from './components/Header';

// ── Easter Egg Logic ──────────────────────────────────────────────────────────
function EasterEgg() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') launchRockets();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return null;
}

function launchRockets() {
  const emojis = ['🚀', '💰', '📈', '🌙', '⭐', '💎', '🎯'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const delay = Math.random() * 3;
    const dur = 2.5 + Math.random() * 3;
    el.style.cssText = `position:fixed;left:${Math.random() * 100}vw;bottom:-80px;font-size:${24 + Math.random() * 28}px;animation:floatRocket ${dur}s ${delay}s linear forwards;`;
    container.appendChild(el);
  }

  if (!document.getElementById('rocket-kf')) {
    const style = document.createElement('style');
    style.id = 'rocket-kf';
    style.textContent = `@keyframes floatRocket{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-110vh);opacity:0}}`;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 8000);
}

// ── Protected Route Helper ────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {/* ADDED FUTURE FLAGS HERE TO CLEAR WARNINGS */}
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <EasterEgg />
          <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-900 dark:text-slate-200">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/screener" element={<Screener />} />
                <Route path="/calculator" element={<Calculator />} />

                {/* FIXED: Changed :ticker to :id to match FundDetails code */}
                <Route path="/fund/:id" element={<FundDetails />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer currentTheme={theme} onThemeChange={setTheme} />
          </div>
        </Router>
      </div>
    </AuthProvider>
  );
}