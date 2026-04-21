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
  'Construcción',
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

  const [voiceVariations, setVoiceVariations] = useState<string[]>([]);

  const startCalibration = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("El reconocimiento de voz no es compatible con este navegador.");
      handleFinish([]); // Fallback
      return;
    }

    setIsListening(true);
    let localCount = analyCount;
    let localVariations = [...voiceVariations];
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
         if (matches && localCount < 3) {
            // Take only what's needed to reach 3
            matches.forEach(m => {
              if (localCount < 3) {
                localCount++;
                localVariations.push(m);
              }
            });
            
            setAnalyCount(localCount);
            setVoiceVariations(localVariations);
            
            if (localCount >= 3) {
              recognition.onend = null; // Prevent auto-restart
              recognitionRef.current = null;
              
              try {
                recognition.stop();
              } catch(e) {}
              
              setTimeout(() => {
                handleFinish(localVariations);
              }, 1500);
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

  const handleFinish = async (variations: string[] = voiceVariations) => {
    if(user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        const updates = {
          occupation,
          onboarded: true,
          analyCalibrated: true,
          voiceVariations: variations,
          updatedAt: serverTimestamp()
        };
        
        // Ensure doc is created if it didn't exist
        await updateDoc(userRef, updates).catch(async () => {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(userRef, { ...updates, email: user.email, uid: user.uid, role: 'student' }, { merge: true });
        });
        
        const updatedProfile = { 
          ...(profile || {
             uid: user.uid,
             email: user.email,
             role: 'student',
             createdAt: new Date().toISOString()
          }), 
          occupation, 
          onboarded: true, 
          analyCalibrated: true,
          voiceVariations: variations
        } as UserProfile;
        
        localStorage.setItem('analy_user_profile', JSON.stringify(updatedProfile));
        onComplete(updatedProfile);
      } catch (error) {
        console.error("Failed to update profile", error);
        // Fallback robusto local si falla Firebase
        const fallbackProfile = { ...(profile || {}), occupation, onboarded: true, analyCalibrated: true, voiceVariations: variations } as UserProfile;
        onComplete(fallbackProfile);
      }
    } else {
      // Offline fallback
      onComplete({ occupation, onboarded: true, analyCalibrated: true, voiceVariations: variations, role: 'student', uid: 'demo', email: 'demo@demo.com' } as unknown as UserProfile);
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
            
            {/* Visual Progress Bar 1/3 */}
            <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/10 relative">
               <motion.div 
                 className="absolute left-0 top-0 bottom-0 bg-[#00F0FF]"
                 initial={{ width: 0 }}
                 animate={{ width: `${(analyCount / 3) * 100}%` }}
               />
               <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black mix-blend-difference text-white">
                 {analyCount} / 3
               </div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] text-[#00F0FF] uppercase font-black tracking-[0.2em] h-4">
                {!isListening && "Presiona para activar micro"}
                {isListening && analyCount === 0 && "PASO 1: Di 'Analy'..."}
                {isListening && analyCount === 1 && "PASO 2: Repítelo de nuevo..."}
                {isListening && analyCount === 2 && "PASO 3: Una vez más para confirmar..."}
                {analyCount >= 3 && "¡VOZ DE ANALÍ SINCRONIZADA!"}
              </div>
              
              {!isListening && analyCount < 3 ? (
                <button 
                  onClick={startCalibration}
                  className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_30px_#00F0FF44]"
                >
                  <span>Iniciar Calibración</span>
                  <span className="text-[8px] opacity-50">(Dar permisos de micrófono)</span>
                </button>
              ) : analyCount >= 3 ? (
                 <button 
                  onClick={() => handleFinish(voiceVariations)}
                  className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_30px_#00F0FF44] animate-pulse"
                >
                  <span>ENTRAR A ANALÍ</span>
                </button>
              ) : (
                <div className="w-full bg-[#1A1A1A] text-[#00F0FF] py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-2 border border-[#00F0FF] listening-pulse">
                  <span>
                    Escuchando en vivo...
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
