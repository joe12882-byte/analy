import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Common/Layout';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { safeStorage } from './lib/storage';
import ActionDashboard from './components/ActionDashboard';
import ARCamera from './components/ARCamera';
import AdminCurador from './components/AdminCurador';
import UserLibrary from './components/UserLibrary';
import VoiceSelector from './components/VoiceSelector';
import UsageMonitor from './components/UsageMonitor';
import Onboarding from './components/Onboarding';
import { ShieldAlert, Cpu, Check, Loader2, Save, X } from 'lucide-react';
import { db } from './lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const ADMIN_EMAIL = 'joe12882@gmail.com';

function SettingsMock() {
  const { profile, logout, changePassword } = useAuth();
  const isMaster = profile?.email === ADMIN_EMAIL;
  const [shieldActive, setShieldActive] = useState<boolean | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Password change state
  const [showPassForm, setShowPassForm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (!isMaster) return;
    const unsub = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        setShieldActive(!!snap.data().economy_mode);
      } else {
        setShieldActive(false);
      }
    }, (err) => {
      // Ignorar desconexiones por inactividad (benignas)
      if (err.code !== 'cancelled' && !err.message.includes('idle stream')) {
        console.error("Config fetch failed", err);
      }
    });
    return () => unsub();
  }, [isMaster]);

  const toggleShield = async () => {
    setUpdating(true);
    try {
      await setDoc(doc(db, 'system', 'config'), { 
        economy_mode: !shieldActive,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setPassLoading(true);
    setPassError(null);
    try {
      await changePassword(newPass);
      setPassSuccess(true);
      setNewPass('');
      setTimeout(() => {
        setPassSuccess(false);
        setShowPassForm(false);
      }, 2000);
    } catch (err: any) {
      setPassError(err.message || 'Error al cambiar contraseña');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setUpdating(true);
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-4 pb-32">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black uppercase italic text-teal-500">Configuración</h2>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Tu Perfil y Sistema</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
            <span className="text-teal-600 font-black text-xl italic uppercase">
              {profile?.name?.substring(0,2) || '??'}
            </span>
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight italic">{profile?.name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile?.occupation}</p>
          </div>
        </div>

        <VoiceSelector />

        {/* Change Password Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguridad</h4>
            {!showPassForm && (
              <button 
                onClick={() => setShowPassForm(true)}
                className="text-[10px] font-black text-teal-500 uppercase tracking-widest hover:underline"
              >
                Cambiar Clave
              </button>
            )}
          </div>

          {showPassForm && (
            <form onSubmit={handlePasswordChange} className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  disabled={passLoading}
                />
              </div>
              {passError && <p className="text-[10px] text-rose-500 font-bold uppercase px-2">{passError}</p>}
              {passSuccess && <p className="text-[10px] text-emerald-500 font-bold uppercase px-2">¡Clave actualizada!</p>}
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex-1 bg-teal-500 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {passLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Guardar
                </button>
                {!passSuccess && (
                  <button
                    type="button"
                    onClick={() => { setShowPassForm(false); setPassError(null); }}
                    disabled={passLoading}
                    className="px-4 bg-slate-100 text-slate-400 rounded-xl py-3 text-[10px] font-black uppercase"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {isMaster && (
          <div className="space-y-6">
            <UsageMonitor />
            
            <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
             {/* Decoración Neo-Cyber */}
             <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 filter blur-3xl rounded-full" />
             
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${shieldActive ? 'bg-teal-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm italic tracking-tight uppercase">Protocolo Escudo</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ahorro de Cuota Inteligente</p>
                </div>
             </div>

             <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-6">
               Este protocolo activa el **Plan B (Voz Local)** para respuestas largas y limita la generación de audio en dispositivos móviles para ahorrar caracteres de ElevenLabs.
             </p>

             <button 
               onClick={toggleShield}
               disabled={updating || shieldActive === null}
               className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-lg ${
                 shieldActive 
                  ? 'bg-teal-500 text-white shadow-teal-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 shadow-black/20'
               }`}
             >
               {updating ? <Loader2 className="animate-spin" size={14} /> : (shieldActive ? <Check size={14} /> : <Cpu size={14} />)}
               {shieldActive ? 'Protocolo Activo' : 'Activar Protocolo Escudo'}
             </button>
             
             {shieldActive && (
               <div className="mt-4 flex items-center justify-center gap-2">
                 <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
                 <span className="text-[8px] text-teal-400 font-black uppercase tracking-tighter">Optimizando presupuesto en tiempo real</span>
               </div>
             )}
          </div>
        </div>
      )}

      <div className="bg-white p-5 space-y-3 border border-emerald-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Google Gemini AI</span>
            <span className="text-[8px] bg-emerald-50 px-2 py-0.5 rounded text-emerald-600 font-mono">CONNECTED</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            La conexión con el motor de Inteligencia Artificial está asegurada y manejada automáticamente.
          </p>
        </div>

        <div className="pt-4 grid grid-cols-1 gap-3">
          <button 
            onClick={() => { safeStorage.clear(); window.location.reload(); }}
            className="w-full py-4 border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm bg-white"
          >
            Borrar Caché Local
          </button>

          <button 
            onClick={handleLogout}
            className="w-full py-4 border border-rose-200 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 active:scale-95 transition-all shadow-sm bg-white flex items-center justify-center gap-2"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivateAppRoutes() {
  const { profile } = useAuth();
  const isMaster = profile?.role === 'master' || profile?.email === ADMIN_EMAIL;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ActionDashboard />} />
        <Route path="camera" element={<ARCamera />} />
        <Route 
          path="admin" 
          element={isMaster ? <AdminCurador /> : <UserLibrary />} 
        />
        <Route path="settings" element={<SettingsMock />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  if (loading) {
    return (
      <div key="global-app-loading" className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div key="global-bg-radial" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)]" />
        
        <div key="global-loading-content" className="relative z-10 flex flex-col items-center gap-12 max-w-sm w-full animate-in fade-in zoom-in duration-700">
          {/* El video como loader principal con buen tamaño */}
          <div key="global-loading-video-ring" className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-teal-500 shadow-[0_0_60px_rgba(0,240,255,0.4)] bg-black">
            <video
              key="global-loading-video"
              ref={videoRef}
              src="/intro_anali.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div key="global-loading-message-box" className="flex flex-col items-center gap-6">
            <Loader2 key="global-loading-spinner" className="w-10 h-10 text-teal-400 animate-spin" />
            <div key="global-loading-text-stack" className="space-y-2 text-center">
              <p key="global-loading-prime" className="text-teal-400 text-xs font-black uppercase tracking-[0.4em] animate-pulse">
                {user?.email === ADMIN_EMAIL ? 'Sincronizando con Analí...' : 'Conectando con Analí...'}
              </p>
              <p key="global-loading-sub" className="text-white/30 text-[9px] uppercase font-bold tracking-widest">
                {user?.email === ADMIN_EMAIL ? 'Alistando tus herramientas de inglés técnico' : 'Preparando tu entrenamiento de inglés técnico'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding if no user OR if user exists but profile says not onboarded
  if (!user || (profile && !profile.onboarded)) {
    return <Onboarding onComplete={() => refreshProfile()} />;
  }

  return (
    <BrowserRouter>
      <PrivateAppRoutes />
    </BrowserRouter>
  );
}
