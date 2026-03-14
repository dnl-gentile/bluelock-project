import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Compass, Swords, Trophy, Shield, BookOpen, Bot, UserCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AuthProvider, useAuth } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import TrainingRoom from './pages/TrainingRoom';
import ActiveDrill from './pages/ActiveDrill';
import SkillsRoom from './pages/SkillsRoom';
import Wiki from './pages/Wiki';
import CoachDashboard from './pages/CoachDashboard';
import Login from './pages/Login';
import AICoachChat from './pages/AICoachChat';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Navigation() {
  const location = useLocation();
  const { profile } = useAuth();

  // Don't show navigation on Login page
  if (location.pathname === '/login' || !profile) return null;

  const links = profile.role === 'trainee' 
    ? [
        { to: '/', icon: <Compass className="w-5 h-5" />, label: 'Mapa' },
        { to: '/training', icon: <Swords className="w-5 h-5" />, label: 'Treino' },
        { to: '/skills', icon: <Trophy className="w-5 h-5" />, label: 'Ego' },
        { to: '/wiki', icon: <BookOpen className="w-5 h-5" />, label: 'Wiki' },
        { to: '/chat', icon: <Bot className="w-5 h-5" />, label: 'BLM' },
      ]
    : [
        { to: '/coach', icon: <Shield className="w-5 h-5" />, label: 'Visão do Mestre' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17] border-t border-[rgba(29,78,216,0.2)] md:relative md:border-t-0 md:border-b md:h-16 flex items-center justify-center p-2 pb-safe">
      <ul className="flex flex-row w-full max-w-lg md:max-w-4xl justify-around md:justify-center md:gap-8 items-center h-14 md:h-full">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <li key={link.to} className="w-full md:w-auto">
              <Link
                to={link.to}
                className={cn(
                  'flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300',
                  isActive 
                    ? 'text-[#1d4ed8] box-shadow-neon border border-[rgba(29,78,216,0.3)] bg-[rgba(29,78,216,0.05)]' 
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {link.icon}
                <span className="text-[10px] md:text-sm font-semibold tracking-wider font-display uppercase">
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Layout() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const isSkills = location.pathname === '/skills';
  
  return (
    <div className="flex flex-col md:flex-col-reverse min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050505] to-[#050505]">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#1d4ed8] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse-neon pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-[#ff003c] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />
      
      {/* Top Profile / Logout Menu Dropdown indicator */}
      {profile && location.pathname !== '/login' && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
           <button 
             onClick={logout} 
             className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-full hover:bg-white/10 transition-colors group"
           >
             <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
             <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-red-400 font-mono tracking-widest hidden md:inline">Sair</span>
           </button>
        </div>
      )}

      {/* Scrollable Content */}
      <main className={`flex-1 w-full relative z-10 overflow-y-auto overflow-x-hidden ${isSkills ? 'max-w-none p-0 flex flex-col' : 'max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8'}`}>
        <Routes>
          <Route path="/login" element={user && profile ? <Navigate to={profile.role === 'coach' ? '/coach' : '/'} replace /> : <Login />} />
          
          <Route element={<ProtectedRoute allowedRoles={['trainee']} />}>
            <Route path="/" element={<Home />} />
            <Route path="/training" element={<TrainingRoom />} />
            <Route path="/drill/:id" element={<ActiveDrill />} />
            <Route path="/skills" element={<SkillsRoom />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/chat" element={<AICoachChat />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
            <Route path="/coach" element={<CoachDashboard />} />
          </Route>
        </Routes>
      </main>
      
      {/* Bottom Nav on Mobile, Top Nav on Desktop */}
      <Navigation />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
