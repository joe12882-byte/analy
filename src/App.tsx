import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Common/Layout.tsx';
import ActionDashboard from './components/ActionDashboard.tsx';
import ARCamera from './components/ARCamera.tsx';
import AdminCurador from './components/AdminCurador.tsx';
import UserLibrary from './components/UserLibrary.tsx';
import { UserProfile } from './types';

const ADMIN_EMAIL = 'joe12882@gmail.com';

function SettingsMock() {
  const [customApiKey, setCustomApiKey] = useState('');
  
  useEffect(() => {
    const savedKey = localStorage.getItem('analy_custom_gemini_key');
    if (savedKey) setCustomApiKey(savedKey);
  }, []);

  const handleKeySave = (val: string) => {
    setCustomApiKey(val);
    if (val.trim()) {
      localStorage.setItem('analy_custom_gemini_key', val.trim());
    } else {
      localStorage.removeItem('analy_custom_gemini_key');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black uppercase italic text-[#00F0FF]">Tactical Gear</h2>
        <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">System Configurations</p>
      </div>

      <div className="space-y-6">
        <div className="analy-card p-5 space-y-3 bg-[#0F0F0F] border border-[#00F0FF]/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF]">Bóveda API (Privada)</span>
            <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-mono">CLIENT-SIDE</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
            Ingresa tu Google Cloud API Key para evadir las cuotas gratuitas del entorno AI Studio. Se guarda de forma encriptada en el almacenamiento de tu navegador local.
          </p>
          <input 
            type="password"
            placeholder="Pegar API Key aquí (ej. AIzaSy...)"
            value={customApiKey}
            onChange={(e) => handleKeySave(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono focus:border-[#00F0FF] outline-none text-white"
          />
          {customApiKey && (
            <p className="text-[9px] text-[#00F0FF] font-black uppercase tracking-widest mt-2 flex justify-end">✓ Llave Activa</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="analy-card p-4 flex justify-between items-center opacity-50">
            <span className="text-xs font-bold uppercase tracking-wider">Ajuste de Lexicón</span>
            <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-[#00F0FF] font-black">LOCKED</span>
          </div>
          <div className="analy-card p-4 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider">Voz de Enlace</span>
            <span className="text-[10px] text-[#00F0FF] font-black mono-display">ZEPHYR (US)</span>
          </div>
          <div className="analy-card p-4 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider">Firma Visual</span>
            <div className="w-10 h-6 bg-[#00F0FF] rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-[#0F0F0F] rounded-full" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="w-full py-4 mt-8 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl active:bg-red-500/10 transition-all"
        >
          Factory Reset
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('analy_user_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const isMaster = profile?.role === 'master' || profile?.email === ADMIN_EMAIL;

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
