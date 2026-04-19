import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, User, Briefcase, CheckCircle, Mic, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from './AuthProvider';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  const [occupation, setOccupation] = useState('Usuario General');
  const [analyCount, setAnalyCount] = useState(0);
  const { signIn, user, profile } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  // If user is already authenticated & we have a profile from Firebase, they might just need to finish occupation/calibration.
  // Actually, if we just want to update occupation in FireStore, we can do it later.
  // For simplicity, let's just make step 1 the Google Login.

  const handleLoginNext = async () => {
    setIsSigningIn(true);
    try {
      if (!user) {
        await signIn();
      }
      setStep(2);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const startCalibration = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("El reconocimiento de voz no es compatible con este navegador.");
      handleFinish(); // Fallback
      return;
    }

    setIsListening(true);
    let localCount = 0;
    const wakeWords = ['analy', 'analí', 'anali', 'analee', 'annaly', 'ana lee', 'ana li', 'anna lee', 'analeigh'];
    const regex = new RegExp(wakeWords.join('|'), 'gi');

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let newFinals = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
           newFinals += event.results[i][0].transcript + ' ';
        }
      }
      
      if (newFinals.trim().length > 0) {
         const matches = newFinals.match(regex);
         if (matches) {
            localCount += matches.length;
            setAnalyCount(c => Math.min(c + matches.length, 3));
            
            if (localCount >= 3) {
              recognition.onend = null; // Prevent auto-restart
              recognitionRef.current = null; // Quita la referencia para evitar falsos arranques en onend
              
              try {
                recognition.stop();
              } catch(e) {}
              
              setTimeout(() => {
                handleFinish();
              }, 1200);
            }
         }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error("Speech error", event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Solo reiniciar si no hemos llegado a 3 conteos, aún tenemos ref, 
      // y si el estado reactivo marca isListening=true (indicando que no se ha interrumpido intencionalmente o fallado)
      if (localCount < 3 && recognitionRef.current) {
        setTimeout(() => {
          try { 
            recognitionRef.current?.start(); 
          } catch(e){
            console.error(e);
          }
        }, 100);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleFinish = async () => {
    if(profile && user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        const updates = {
          occupation,
          onboarded: true,
          analyCalibrated: true,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(userRef, updates);
        
        const updatedProfile = { 
          ...profile, 
          occupation, 
          onboarded: true, 
          analyCalibrated: true 
        };
        
        localStorage.setItem('analy_user_profile', JSON.stringify(updatedProfile));
        onComplete(updatedProfile);
      } catch (error) {
        console.error("Failed to update profile", error);
        // Fallback to local
        onComplete({ ...profile, occupation, onboarded: true, analyCalibrated: true });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] z-[100] flex items-center justify-center p-6">
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-1.5 px-10">
        {[1, 2, 3].map((s) => (
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
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-[#00F0FF]/10 rounded-2xl flex items-center justify-center border border-[#00F0FF]/30 mx-auto">
                <User className="text-[#00F0FF]" size={32} />
              </div>
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">Identificación</h2>
              <p className="text-gray-500 text-sm tracking-wide">Inicia sesión con Google para sincronizar tus datos.</p>
            </div>
            <div className="space-y-6">
              <button 
                onClick={handleLoginNext}
                disabled={isSigningIn}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSigningIn ? "Conectando..." : "Sign in with Google"} <ArrowRight size={18} />
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
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">¿A qué te dedicas?</h2>
              <p className="text-gray-500 text-sm tracking-wide">Adaptaremos el vocabulario técnico a tu labor.</p>
            </div>
            <div className="space-y-6">
              <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {OCCUPATIONS.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setOccupation(occ)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      occupation === occ 
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]' 
                        : 'bg-[#1A1A1A] border-white/5 text-gray-400 opacity-60'
                    }`}
                  >
                    <span className="font-bold uppercase tracking-widest text-[10px] mono-display">{occ}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(3)}
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
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Entrenando a Analy</h2>
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
                {!isListening && "Presiona para activar micro"}
                {isListening && analyCount === 0 && "Esperando: Di 'Analy'..."}
                {isListening && analyCount === 1 && "Repite: Di 'Analy'..."}
                {isListening && analyCount === 2 && "Última vez: Di 'Analy'..."}
                {analyCount >= 3 && "¡Calibración exitosa!"}
              </div>
              
              {!isListening && analyCount < 3 ? (
                <button 
                  onClick={startCalibration}
                  className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_30px_#00F0FF44]"
                >
                  <span>Iniciar Calibración</span>
                  <span className="text-[8px] opacity-50">(Dar permisos de micrófono)</span>
                </button>
              ) : (
                <div className="w-full bg-[#1A1A1A] text-[#00F0FF] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-2 border border-[#00F0FF] listening-pulse">
                  <span>
                    {analyCount >= 3 ? "Completando..." : "Escuchando en vivo..."}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
