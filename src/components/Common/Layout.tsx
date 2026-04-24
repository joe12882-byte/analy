import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, ShieldCheck, Settings, Library, Loader2, Heart, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Onboarding from '../Onboarding';
import { useAuth } from '../AuthProvider';
import { UserProfile } from '../../types';
import GlobalTutorMic from '../GlobalTutorMic';
import AnaliAvatar from '../AnaliAvatar';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { safeStorage } from '../../lib/storage';

const ADMIN_EMAIL = 'joe12882@gmail.com';

export default function Layout() {
  const { profile, loading, user } = useAuth();
  const [internalProfile, setInternalProfile] = useState<UserProfile | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [justFinishedOnboarding, setJustFinishedOnboarding] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Master Switch: Protocolo de Confianza
  const [trustMode, setTrustMode] = useState<'formal' | 'social'>(() => 
    (safeStorage.getItem('analy_trust_mode') as 'formal' | 'social') || 'formal'
  );

  useEffect(() => {
    if(profile && !justFinishedOnboarding) {
      setInternalProfile(profile);
    }
  }, [profile, justFinishedOnboarding]);
  
  useEffect(() => {
    safeStorage.setItem('analy_trust_mode', trustMode);
    window.dispatchEvent(new Event('trustModeChanged'));
  }, [trustMode]);

  const handleOnboardingComplete = (completedProfile: UserProfile) => {
    // Optimistic fast update
    setJustFinishedOnboarding(true);
    setInternalProfile(completedProfile);
    setSystemMessage(`Bienvenida(o), ${completedProfile.displayName || completedProfile.email || 'Estudiante'}. Configurando Anali para ${completedProfile.occupation}...`);
    
    // Dejar una ventana para que la DB se sincronice antes de volver a escuchar al AuthProvider
    setTimeout(() => {
      setJustFinishedOnboarding(false);
      setSystemMessage(null);
    }, 4000);
  };

  const isAdmin = internalProfile?.role === 'master' || internalProfile?.email === ADMIN_EMAIL;

  const handleModeToggle = () => {
    setTrustMode(prev => prev === 'formal' ? 'social' : 'formal');
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4" />
            <p className="text-teal-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">
              Sincronizando Analí...
            </p>
        </div>
     );
  }

  const showOnboarding = !user || !internalProfile?.onboarded;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20 font-sans selection:bg-teal-400 selection:text-white">
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {systemMessage && (
        <div key="system-welcome-overlay" className="fixed inset-0 bg-[#0F0F0F] z-[110] flex flex-col items-center justify-center p-6 text-center space-y-12 overflow-hidden">
          <div key="system-bg-radial" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)]" />

          <div key="system-video-box" className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-teal-500 shadow-[0_0_50px_rgba(0,240,255,0.4)] bg-black animate-in fade-in zoom-in duration-500">
            <video
              key="system-welcome-video"
              ref={videoRef}
              src="/intro_anali.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div key="system-message-stack" className="relative z-10 flex flex-col items-center gap-8 max-w-sm">
            <div key="system-spinner-container" className="relative">
              <Loader2 key="system-spinner" className="animate-spin text-teal-400" size={48} />
              <div key="system-spinner-glow" className="absolute inset-0 blur-xl bg-teal-400/20 animate-pulse" />
            </div>
            
            <div key="system-text-group" className="space-y-3">
              <p key="system-main-text" className="text-white text-sm font-black italic uppercase tracking-tighter leading-tight drop-shadow-md">
                {systemMessage}
              </p>
              <p key="system-sub-text" className="text-teal-400/60 text-[10px] font-black uppercase tracking-[0.3em] font-black animate-pulse">
                {user?.email === ADMIN_EMAIL 
                  ? 'Sincronizando Cerebro de Analí...' 
                  : 'Analí está afinando tus sentidos técnicos...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-300/20 pointer-events-none filter blur-[120px] rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-300/15 pointer-events-none filter blur-[120px] rounded-full" />

      <header className="px-5 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 z-40 relative">
        <div className="flex items-center gap-3">
          <AnaliAvatar emotion="neutral" size="sm" className="rounded-xl shadow-sm" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-teal-600">Anali</h1>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
              {internalProfile?.occupation || 'Tu Tutora'}
            </span>
          </div>
        </div>

        {/* Master Switch Button */}
        <button 
          onClick={handleModeToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-all active:scale-95 shadow-sm ${
            trustMode === 'social' 
              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
              : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
          title="Cambiar a Modo Social (Permite jergas)"
        >
          {trustMode === 'social' ? <Heart size={16} className="fill-rose-200" /> : <Sparkles size={16} />}
          <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
            {trustMode === 'social' ? 'Social Mode' : 'Formal Mode'}
          </span>
        </button>
      </header>

      <main className="flex-1 overflow-auto z-10 w-full max-w-4xl mx-auto custom-scrollbar">
        <Outlet context={{ trustMode }} />
      </main>

      {/* Global Contextual Microphone */}
      <GlobalTutorMic />

      <nav className="fixed bottom-0 left-0 right-0 h-[88px] max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2 sm:px-6 z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.03)] rounded-t-3xl">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300", 
            isActive ? "text-teal-500 bg-teal-50 scale-110 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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
            "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300", 
            isActive ? "text-teal-500 bg-teal-50 scale-110 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          )}
        >
          {({ isActive }) => (
            <>
              <Camera size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-widest uppercase mt-1">Escáner</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/admin" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300", 
            isActive ? "text-teal-500 bg-teal-50 scale-110 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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
            "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300", 
            isActive ? "text-teal-500 bg-teal-50 scale-110 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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
