import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Common/Layout';
import { AuthProvider, useAuth } from './components/AuthProvider';
import ActionDashboard from './components/ActionDashboard';
import ARCamera from './components/ARCamera';
import AdminCurador from './components/AdminCurador';
import UserLibrary from './components/UserLibrary';
import VoiceSelector from './components/VoiceSelector';

const ADMIN_EMAIL = 'joe12882@gmail.com';

function SettingsMock() {
  return (
    <div className="p-6 space-y-4 pb-32">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black uppercase italic text-teal-500">Configuración</h2>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Tu Perfil y Sistema</p>
      </div>

      <div className="space-y-6">
        <VoiceSelector />

        <div className="bg-white p-5 space-y-3 border border-emerald-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Google Gemini AI</span>
            <span className="text-[8px] bg-emerald-50 px-2 py-0.5 rounded text-emerald-600 font-mono">CONNECTED</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            La conexión con el motor de Inteligencia Artificial está asegurada y manejada automáticamente.
          </p>
        </div>

        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="w-full py-4 mt-8 border border-rose-200 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 active:scale-95 transition-all shadow-sm bg-white"
        >
          Borrar Caché Local
        </button>
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
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivateAppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
