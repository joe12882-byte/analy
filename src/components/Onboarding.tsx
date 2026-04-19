import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, User, Briefcase, Mail, CheckCircle, ShieldCheck, Mic, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const OCCUPATIONS = [
  'Barbero',
  'Mecánico',
  'Mesero',
  'Usuario General',
  'Contrucción',
  'Otro'
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    occupation: 'Usuario General',
    email: '',
  });
  const [analyCount, setAnalyCount] = useState(0);

  const nextStep = () => setStep(s => s + 1);

  const handleAnalyCalibrate = () => {
    if (analyCount < 2) {
      setAnalyCount(c => c + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const isMaster = profile.email === 'joe12882@gmail.com';
    const finalProfile: UserProfile = { 
      ...profile, 
      id: crypto.randomUUID(),
      registration_date: new Date().toISOString(),
      role: isMaster ? 'master' : 'user',
      onboarded: true,
      analyCalibrated: true
    };
    
    // Global tracking in local environment
    const existingUsers = JSON.parse(localStorage.getItem('analy_global_users') || '[]');
    if (!existingUsers.find((u: any) => u.email === finalProfile.email)) {
      localStorage.setItem('analy_global_users', JSON.stringify([...existingUsers, finalProfile]));
    }

    localStorage.setItem('analy_user_profile', JSON.stringify(finalProfile));
    onComplete(finalProfile);
  };

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] z-[100] flex items-center justify-center p-6">
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-1.5 px-10">
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s} 
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              step >= s ? 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]' : 'bg-white/10'
            }`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-2xl flex items-center justify-center border border-[#00F0FF]/30">
                <User className="text-[#00F0FF]" size={24} />
              </div>
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">¿Cómo te llamas?</h2>
              <p className="text-gray-500 text-sm tracking-wide">Para personalizar tu despliegue táctico.</p>
            </div>
            <div className="space-y-6">
              <input 
                type="text"
                autoFocus
                placeholder="Tu nombre aquí..."
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-[#1A1A1A] border-b-2 border-white/10 focus:border-[#00F0FF] py-4 text-xl outline-none transition-all placeholder:text-white/5 font-bold"
              />
              <button 
                disabled={!profile.name}
                onClick={nextStep}
                className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-30 transition-all active:scale-95"
              >
                Continuar <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-2xl flex items-center justify-center border border-[#00F0FF]/30">
                <Briefcase className="text-[#00F0FF]" size={24} />
              </div>
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">¿A qué te dedicas?</h2>
              <p className="text-gray-500 text-sm tracking-wide">Adaptaremos el vocabulario técnico a tu labor.</p>
            </div>
            <div className="space-y-6">
              <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {OCCUPATIONS.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setProfile({ ...profile, occupation: occ })}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      profile.occupation === occ 
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]' 
                        : 'bg-[#1A1A1A] border-white/5 text-gray-400 opacity-60'
                    }`}
                  >
                    <span className="font-bold uppercase tracking-widest text-[10px] mono-display">{occ}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={nextStep}
                className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                Confirmar <CheckCircle size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm space-y-8"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-2xl flex items-center justify-center border border-[#00F0FF]/30">
                <Mail className="text-[#00F0FF]" size={24} />
              </div>
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">Identificación</h2>
              <p className="text-gray-500 text-sm tracking-wide">Sincroniza tus extracciones de Intel en la nube.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <input 
                  type="email"
                  autoFocus
                  placeholder="hola@ejemplo.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[#1A1A1A] border-b-2 border-white/10 focus:border-[#00F0FF] py-4 text-xl outline-none transition-all placeholder:text-white/5 font-bold"
                />
                {profile.email === 'joe12882@gmail.com' && (
                   <div className="flex items-center gap-2 text-[10px] text-[#00F0FF] font-black uppercase mono-display animate-pulse">
                     <ShieldCheck size={12} /> Acceso Root Detectado
                   </div>
                )}
              </div>
              <button 
                disabled={!profile.email.includes('@')}
                onClick={nextStep}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-30 transition-all active:scale-95"
              >
                Sumarse a Analy <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-sm space-y-8 text-center"
          >
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-20 h-20 bg-[#00F0FF]/10 rounded-full flex items-center justify-center border-4 border-[#00F0FF]/30 relative listening-pulse">
                <Mic className="text-[#00F0FF]" size={32} />
                <Sparkles size={16} className="absolute -top-1 -right-1 text-[#00F0FF] animate-bounce" />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Entrenando a Analy</h2>
              <p className="text-gray-500 text-sm tracking-wide">Para calibrar su sistema de escucha táctica, di su nombre claramente 3 veces.</p>
            </div>
            
            <div className="flex justify-center gap-4">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                    analyCount > i 
                      ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0F0F0F] scale-110' 
                      : 'bg-transparent border-white/10 text-white/20'
                  }`}
                >
                   {analyCount > i ? <CheckCircle size={20} /> : <span className="font-black">AR</span>}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em] h-4">
                {analyCount === 0 && "Esperando: 'Analy'..."}
                {analyCount === 1 && "Repite: 'Analy'..."}
                {analyCount === 2 && "Última vez: 'Analy'..."}
              </div>
              <button 
                onClick={handleAnalyCalibrate}
                className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_30px_#00F0FF44]"
              >
                <span>Pulsar para hablar</span>
                <span className="text-[8px] opacity-50">(Simulación de Calibración)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
