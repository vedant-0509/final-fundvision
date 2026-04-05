// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Screener from './pages/Screener';
// import Calculator from './pages/Calculator';
// import AIAdvisor from './pages/AIAdvisor';

// // ── Easter Egg: Ctrl+Shift+F triggers rocket shower ────────────────────────────
// function EasterEgg() {
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.ctrlKey && e.shiftKey && e.key === 'F') {
//         launchRockets();
//       }
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

//   // Banner
//   const msg = document.createElement('div');
//   msg.innerHTML = '🚀 To the moon! Press Ctrl+Shift+F again to dismiss';
//   msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:16px 32px;border-radius:16px;font-size:18px;font-weight:700;z-index:10000;border:2px solid #10b981;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;pointer-events:none;';
//   container.appendChild(msg);

//   for (let i = 0; i < 30; i++) {
//     const el = document.createElement('div');
//     el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
//     const delay = Math.random() * 3;
//     const dur = 2.5 + Math.random() * 3;
//     el.style.cssText = `position:fixed;left:${Math.random()*100}vw;bottom:-80px;font-size:${24+Math.random()*28}px;animation:floatRocket ${dur}s ${delay}s linear forwards;`;
//     container.appendChild(el);
//   }

//   // Inject keyframe
//   if (!document.getElementById('rocket-kf')) {
//     const style = document.createElement('style');
//     style.id = 'rocket-kf';
//     style.textContent = `@keyframes floatRocket{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-110vh) rotate(${Math.random()>0.5?'':'-'}${Math.floor(Math.random()*360)}deg);opacity:0}}`;
//     document.head.appendChild(style);
//   }

//   document.body.appendChild(container);

//   const dismiss = (e: KeyboardEvent) => {
//     if (e.ctrlKey && e.shiftKey && e.key === 'F') {
//       container.remove();
//       window.removeEventListener('keydown', dismiss);
//     }
//   };
//   window.addEventListener('keydown', dismiss);
//   setTimeout(() => container.remove(), 8000);
// }

// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
//   return user ? <>{children}</> : <Navigate to="/login" replace />;
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <EasterEgg />
//       <Router>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//           <Route path="/screener" element={<Screener />} />
//           <Route path="/calculator" element={<Calculator />} />
//           <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }


// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext';
// // ... other imports

// export default function App() {
//   const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

//   useEffect(() => {
//     const root = window.document.documentElement;
//     // Check for 'auto' or explicit 'dark'
//     const isDark = theme === 'dark' || 
//       (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

//     if (isDark) {
//       root.classList.add('dark');
//     } else {
//       root.classList.remove('dark');
//     }
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   return (
//     <AuthProvider>
//       <EasterEgg />
//       <Router>
//         {/* Pass setTheme to your pages via context or props if needed */}
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/calculator" element={<Calculator />} />
//           <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
//           {/* ... other routes */}
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }



// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Screener from './pages/Screener';
// import Calculator from './pages/Calculator';
// import AIAdvisor from './pages/AIAdvisor';

// // ── Easter Egg: Ctrl+Shift+F triggers rocket shower ────────────────────────────
// function EasterEgg() {
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.ctrlKey && e.shiftKey && e.key === 'F') {
//         launchRockets();
//       }
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

//   const msg = document.createElement('div');
//   msg.innerHTML = '🚀 To the moon! Press Ctrl+Shift+F again to dismiss';
//   msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:16px 32px;border-radius:16px;font-size:18px;font-weight:700;z-index:10000;border:2px solid #10b981;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;pointer-events:none;';
//   container.appendChild(msg);

//   for (let i = 0; i < 30; i++) {
//     const el = document.createElement('div');
//     el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
//     const delay = Math.random() * 3;
//     const dur = 2.5 + Math.random() * 3;
//     el.style.cssText = `position:fixed;left:${Math.random()*100}vw;bottom:-80px;font-size:${24+Math.random()*28}px;animation:floatRocket ${dur}s ${delay}s linear forwards;`;
//     container.appendChild(el);
//   }

//   if (!document.getElementById('rocket-kf')) {
//     const style = document.createElement('style');
//     style.id = 'rocket-kf';
//     style.textContent = `@keyframes floatRocket{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-110vh) rotate(${Math.random()>0.5?'':'-'}${Math.floor(Math.random()*360)}deg);opacity:0}}`;
//     document.head.appendChild(style);
//   }

//   document.body.appendChild(container);

//   const dismiss = (e: KeyboardEvent) => {
//     if (e.ctrlKey && e.shiftKey && e.key === 'F') {
//       container.remove();
//       window.removeEventListener('keydown', dismiss);
//     }
//   };
//   window.addEventListener('keydown', dismiss);
//   setTimeout(() => container.remove(), 8000);
// }

// // ── Protected Route Helper ────────────────────────────────────────────────────
// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0E14]">
//       <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
//     </div>
//   );
//   return user ? <>{children}</> : <Navigate to="/login" replace />;
// }

// // ── Main App Component ────────────────────────────────────────────────────────
// export default function App() {
//   // Theme state: light, dark, or auto
//   const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

//   useEffect(() => {
//     const root = window.document.documentElement;
    
//     // Logic to determine if "dark" class should be applied
//     const isDark = theme === 'dark' || 
//       (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

//     if (isDark) {
//       root.classList.add('dark');
//     } else {
//       root.classList.remove('dark');
//     }
    
//     localStorage.setItem('theme', theme);

//     // Listen for system theme changes if set to 'auto'
//     if (theme === 'auto') {
//       const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//       const listener = () => {
//         if (mediaQuery.matches) root.classList.add('dark');
//         else root.classList.remove('dark');
//       };
//       mediaQuery.addEventListener('change', listener);
//       return () => mediaQuery.removeEventListener('change', listener);
//     }
//   }, [theme]);

//   return (
//     <AuthProvider>
//       <EasterEgg />
//       <Router>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
          
//           <Route path="/dashboard" element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           } />
          
//           <Route path="/screener" element={<Screener />} />
//           <Route path="/calculator" element={<Calculator />} />
          
//           <Route path="/ai-advisor" element={
//             <ProtectedRoute>
//               <AIAdvisor />
//             </ProtectedRoute>
//           } />

//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }



// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Screener from './pages/Screener';
// import Calculator from './pages/Calculator';
// import AIAdvisor from './pages/AIAdvisor';

// // ── Easter Egg Logic ──────────────────────────────────────────────────────────
// function EasterEgg() {
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.ctrlKey && e.shiftKey && e.key === 'F') {
//         launchRockets();
//       }
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

//   const msg = document.createElement('div');
//   msg.innerHTML = '🚀 To the moon! Press Ctrl+Shift+F again to dismiss';
//   msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:16px 32px;border-radius:16px;font-size:18px;font-weight:700;z-index:10000;border:2px solid #10b981;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;pointer-events:none;';
//   container.appendChild(msg);

//   for (let i = 0; i < 30; i++) {
//     const el = document.createElement('div');
//     el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
//     const delay = Math.random() * 3;
//     const dur = 2.5 + Math.random() * 3;
//     el.style.cssText = `position:fixed;left:${Math.random()*100}vw;bottom:-80px;font-size:${24+Math.random()*28}px;animation:floatRocket ${dur}s ${delay}s linear forwards;`;
//     container.appendChild(el);
//   }

//   if (!document.getElementById('rocket-kf')) {
//     const style = document.createElement('style');
//     style.id = 'rocket-kf';
//     style.textContent = `@keyframes floatRocket{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-110vh) rotate(${Math.random()>0.5?'':'-'}${Math.floor(Math.random()*360)}deg);opacity:0}}`;
//     document.head.appendChild(style);
//   }

//   document.body.appendChild(container);

//   const dismiss = (e: KeyboardEvent) => {
//     if (e.ctrlKey && e.shiftKey && e.key === 'F') {
//       container.remove();
//       window.removeEventListener('keydown', dismiss);
//     }
//   };
//   window.addEventListener('keydown', dismiss);
//   setTimeout(() => container.remove(), 8000);
// }

// // ── Protected Route Helper ────────────────────────────────────────────────────
// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0E14]">
//       <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
//     </div>
//   );
//   return user ? <>{children}</> : <Navigate to="/login" replace />;
// }

// // ── Main App Component ────────────────────────────────────────────────────────
// export default function App() {
//   // 1. Theme State (Light, Dark, Auto)
//   const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

//   // 2. Theme Application Logic
//   useEffect(() => {
//     const root = window.document.documentElement;
    
//     const applyTheme = (currentTheme: string) => {
//       const isDark = currentTheme === 'dark' || 
//         (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

//       if (isDark) {
//         root.classList.add('dark');
//       } else {
//         root.classList.remove('dark');
//       }
//     };

//     applyTheme(theme);
//     localStorage.setItem('theme', theme);

//     // Listener for system changes if set to 'auto'
//     if (theme === 'auto') {
//       const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//       const handleChange = () => applyTheme('auto');
//       mediaQuery.addEventListener('change', handleChange);
//       return () => mediaQuery.removeEventListener('change', handleChange);
//     }
//   }, [theme]);

//   return (
//     <AuthProvider>
//       <EasterEgg />
//       <Router>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
          
//           {/* Dashboard with Protected Access */}
//           <Route path="/dashboard" element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           } />
          
//           <Route path="/screener" element={<Screener />} />
          
//           {/* Passing setTheme to components if they don't use a Context yet */}
//           <Route path="/calculator" element={<Calculator />} />
          
//           <Route path="/ai-advisor" element={
//             <ProtectedRoute>
//               <AIAdvisor />
//             </ProtectedRoute>
//           } />

//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }


import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import Calculator from './pages/Calculator';
import AIAdvisor from './pages/AIAdvisor';
import Footer from './components/Footer';

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
  // ... (existing rocket animation code)
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0B0E14]"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  // Centralized theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: string) => {
      const isDark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <AuthProvider>
      <EasterEgg />
      <Router>
        <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-[#0B0E14]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* Footer needs setTheme to update the global state */}
          {/* <Footer currentTheme={theme} onThemeChange={setTheme} /> */}
        </div>
      </Router>
    </AuthProvider>
  );
}