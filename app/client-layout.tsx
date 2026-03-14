'use client';

import { AuthProvider, useAuth } from '@lib/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Compass, Swords, Trophy, BookOpen, MessageSquare, Shield } from 'lucide-react';
import FirestoreStateSync from '@components/FirestoreStateSync';
import AthleteAutomation from '@components/AthleteAutomation';
import ChunkRecovery from '@components/ChunkRecovery';

function Navigation() {
  const pathname = usePathname();
  const { profile } = useAuth();

  if (pathname === '/login' || !profile) return null;

  const links = profile.role === 'trainee'
    ? [
        { href: '/', icon: <Compass className="w-5 h-5" />, label: 'Home' },
        { href: '/training', icon: <Swords className="w-5 h-5" />, label: 'Treino' },
        { href: '/skills', icon: <Trophy className="w-5 h-5" />, label: 'Ego' },
        { href: '/wiki', icon: <BookOpen className="w-5 h-5" />, label: 'Wiki' },
        { href: '/chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Anri' },
      ]
    : [
        { href: '/coach', icon: <Shield className="w-5 h-5" />, label: 'Visão do Mestre' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17] border-t border-[rgba(29,78,216,0.2)] md:relative md:border-t-0 md:border-b md:h-16 flex items-center justify-center p-2 pb-safe">
      <ul className="flex flex-row w-full max-w-lg md:max-w-4xl justify-around md:justify-center md:gap-8 items-center h-14 md:h-full">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href} className="w-full md:w-auto">
              <Link
                href={link.href}
                className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-[#1d4ed8] border border-[rgba(29,78,216,0.3)] bg-[rgba(29,78,216,0.05)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {link.icon}
                <span className="text-[10px] md:text-sm font-semibold tracking-wider uppercase">
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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const isSkills = pathname === '/skills';
  const isChat = pathname === '/chat';

  return (
    <div className="flex flex-col md:flex-col-reverse min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050505] to-[#050505]">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#1d4ed8] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-[#ff003c] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />


      <main
        className={`relative z-10 flex-1 min-h-0 w-full overflow-x-hidden ${
          isSkills
            ? 'max-w-none overflow-y-auto p-0 flex flex-col'
            : isChat
            ? 'mx-auto flex max-w-5xl flex-col overflow-hidden px-4 pt-4 pb-24 md:pb-6'
            : 'max-w-5xl mx-auto overflow-y-auto px-4 py-8 pb-24 md:pb-8'
        }`}
      >
        {children}
      </main>

      <Navigation />
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChunkRecovery />
      <AuthProvider>
        <FirestoreStateSync />
        <AthleteAutomation />
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </>
  );
}
