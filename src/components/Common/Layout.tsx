import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Camera, ShieldCheck, Settings, Library, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Onboarding from '../Onboarding';
import { UserProfile } from '../../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADMIN_EMAIL = 'joe12882@gmail.com';

export default function Layout() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('analy_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile(parsed);
    }
    setLoading(false);
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setSystemMessage(`Bienvenido, ${newProfile.name}. Configurando Analy para ${newProfile.occupation}...`);
    setTimeout(() => {
      setProfile(newProfile);
      setSystemMessage(null);
    }, 2500);
  };

  const isAdmin = profile?.role === 'master' || profile?.email === ADMIN_EMAIL;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col pb-20">
      {(!profile || !profile.onboarded) && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {systemMessage && (
        <div className="fixed inset-0 bg-slate-100 z-[110] flex flex-col items-center justify-center p-10 text-center space-y-6">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <p className="text-blue-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            {systemMessage}
          </p>
        </div>
      )}

      <header className="px-6 py-6 flex justify-between items-center bg-white shadow-sm border-b border-black/5 z-40 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
          </div>
          <h1 className="text-xl font-black tracking-widest text-blue-500">Analy</h1>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">
            {profile?.occupation || 'Tu Tutor'}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-pulse" />
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all", 
            isActive ? "text-blue-500 active-indicator" : "text-slate-400 hover:text-blue-400"
          )}
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-widest uppercase mt-1">Practicar</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/camera" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all", 
            isActive ? "text-blue-500 active-indicator" : "text-slate-400 hover:text-blue-400"
          )}
        >
          {({ isActive }) => (
            <>
              <Camera size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-widest uppercase mt-1">Escanear</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/admin" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all", 
            isActive ? "text-blue-500 active-indicator" : "text-slate-400 hover:text-blue-400"
          )}
        >
          {({ isActive }) => (
            <>
              {isAdmin ? <ShieldCheck size={22} strokeWidth={isActive ? 2.5 : 2} /> : <Library size={22} strokeWidth={isActive ? 2.5 : 2} />}
              <span className="text-[9px] font-bold tracking-widest uppercase mt-1">
                {isAdmin ? 'Módulos' : 'Biblioteca'}
              </span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all", 
            isActive ? "text-blue-500 active-indicator" : "text-slate-400 hover:text-blue-400"
          )}
        >
          {({ isActive }) => (
            <>
              <Settings size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-widest uppercase mt-1">Ajustes</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
