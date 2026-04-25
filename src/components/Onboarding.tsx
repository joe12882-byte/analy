import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, User, Briefcase, CheckCircle, Mail, Lock, Eye, EyeOff, ChevronLeft, Loader2, Mic } from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from './AuthProvider';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeStorage } from '../lib/storage';
import AnaliAvatar from './AnaliAvatar';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const OCCUPATIONS = ['Barbero', 'Mecánico', 'Mesero', 'Limpieza', 'Usuario General', 'Otro'];

const InputField = ({ label, icon: Icon, type, value, onChange, placeholder, required = false }: any) => (
  <div className="space-y-1.5 ring-offset-slate-900">
    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF]/60 ml-2">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00F0FF] transition-colors">
        <Icon size={18} />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/20 transition-all placeholder:text-white/10"
      />
    </div>
  </div>
);

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1); // 1: Login/Identification, 2: Registration, 3: Calibration
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [occupation, setOccupation] = useState('Usuario General');
  
  const [isNewStudent, setIsNewStudent] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Video State for Transition
  const [videoFinished, setVideoFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { signInWithEmail, signUpWithEmail, user, profile } = useAuth();

  // Redirección automática si ya está todo listo
  useEffect(() => {
    if (user && profile) {
      if (profile.onboarded && profile.analyCalibrated) {
        onComplete(profile);
      } else if (!profile.onboarded) {
        setStep(2);
      } else if (!profile.analyCalibrated) {
        setStep(3);
      }
    }
  }, [user, profile]);

  const handleIdentification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setError('');
    setIsProcessing(true);
    const isMaster = email.toLowerCase().trim() === 'joe12882@gmail.com';
    
    try {
      if (isNewStudent) {
        if (!firstName) {
          setIsProcessing(false);
          return setError('Dime tu nombre para empezar.');
        }
        await signUpWithEmail(email, firstName, occupation);
        // Step 3 is set automatically if successful or can be forced
        setStep(3); 
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Auth Decision Flow:", err.code, err.message);
      
      // Fallback para alumnos nuevos: invalid-credential suele significar "usuario no encontrado" en alumnos
      const isUserNotFound = err.code === 'auth/user-not-found' || 
                            err.code === 'auth/invalid-credential' || 
                            err.message?.includes('user-not-found') ||
                            err.message === 'FRESH_USER';

      if (isUserNotFound && !isMaster && !isNewStudent) {
        setIsNewStudent(true);
        setError('Email no reconocido. Completa tus datos para registrarte.');
        setIsProcessing(false);
        return;
      }

      if (err.code?.includes('password') || err.code?.includes('credential') || err.message?.toLowerCase().includes('password')) {
        setError(isMaster ? 'Contraseña Master incorrecta. Verifica y reintenta.' : 'Credenciales no válidas.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de red. Revisa tu internet.');
      } else {
        setError(`Error: ${err.code || 'Conexión inestable'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (!firstName) return setError('Dime tu nombre para empezar.');
    setIsProcessing(true);
    try {
      await signUpWithEmail(email, firstName, occupation);
      setStep(3);
    } catch (err) {
      setError('Error al crear perfil.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishCalibration = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        analyCalibrated: true, 
        updatedAt: serverTimestamp() 
      });
      onComplete({ ...profile!, analyCalibrated: true } as any);
    } catch (err) {
      setError('Error al guardar calibración.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] z-[100] flex flex-col items-center justify-start sm:justify-center p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Loader de Video mientras se procesa la transición final o registro */}
      {isProcessing && (
        <div key="onboarding-processing-overlay" className="absolute inset-0 z-[110] bg-[#0F0F0F] flex flex-col items-center justify-center p-6 text-center space-y-12">
          <div key="onboarding-shroud-bg" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)]" />
          
          <div key="onboarding-processing-video-container" className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-teal-500 shadow-[0_0_50px_rgba(0,240,255,0.4)] bg-black animate-in fade-in zoom-in duration-500">
            <video
              key="onboarding-processing-video"
              src="/intro_anali.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div key="onboarding-processing-status" className="relative z-10 flex flex-col items-center gap-6 max-w-sm">
            <Loader2 key="onboarding-processing-spinner" className="animate-spin text-teal-400" size={48} />
            <p key="onboarding-processing-text" className="text-teal-400 font-black uppercase tracking-[0.3em] text-xs leading-relaxed animate-pulse">
              {email.toLowerCase().trim() === 'joe12882@gmail.com' 
                ? 'Sincronizando con Analí...' 
                : 'Analí está preparando tu aula técnica...'}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-sm space-y-6 relative my-auto py-10">
            <div className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto">
                <AnimatePresence mode="wait">
                  {!videoFinished && (
                    <motion.div 
                      key="onboarding-video-wrapper"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 rounded-full overflow-hidden border-2 border-teal-500 shadow-lg"
                    >
                      <video
                        ref={videoRef}
                        src="/intro_anali.mp4"
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onEnded={() => setVideoFinished(true)}
                        onError={() => setVideoFinished(true)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnaliAvatar 
                  key="onboarding-happy-avatar"
                  emotion="happy" 
                  size="md" 
                  className={`mx-auto transition-all duration-1000 ${videoFinished ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">ANALI</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">Aprende inglés a tu ritmo</p>
            </div>

            {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-xl text-[10px] font-bold text-center uppercase tracking-wider">{error}</div>}

            <form onSubmit={handleIdentification} className="space-y-4">
              <div className="relative">
                <InputField label="Email" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="tu@correo.com" required />
              </div>
              
              <AnimatePresence>
                {isNewStudent && (
                  <motion.div
                    key="new-student-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 pt-2 overflow-hidden"
                  >
                    <InputField label="¿Cómo te llamas?" icon={User} value={firstName} onChange={setFirstName} placeholder="Tu nombre" required />
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF]/60 ml-2">Tu Oficio</label>
                      <select 
                        value={occupation} 
                        onChange={(e) => setOccupation(e.target.value)} 
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 px-4 text-white font-medium focus:outline-none focus:border-[#00F0FF] appearance-none cursor-pointer text-sm"
                      >
                        {OCCUPATIONS.map(occ => <option key={occ} value={occ} className="bg-[#1A1A1A]">{occ}</option>)}
                      </select>
                      <p className="text-[8px] text-teal-400/50 uppercase font-bold tracking-widest pl-2">Analí adaptará tu aula a esta área</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {email.toLowerCase().trim() === 'joe12882@gmail.com' && (
                  <motion.div 
                    key="master-password-field"
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="overflow-hidden"
                  >
                    <div className="relative pt-4">
                      <InputField label="Clave Master" icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="******" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-white/20 hover:text-[#00F0FF]">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button disabled={isProcessing} className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,240,255,0.1)] active:scale-95 transition-all disabled:opacity-50">
                {isProcessing ? 'Sincronizando...' : (isNewStudent ? 'Registrar y Entrar' : 'Entrar ahora')} <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm space-y-6 relative my-auto py-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase italic text-white">¡Hola! Soy Analy</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Vamos a configurar tu perfil táctico</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <InputField label="¿Cómo te llamas?" icon={User} value={firstName} onChange={setFirstName} placeholder="Escribe tu nombre" required />
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF]/60 ml-2">Tu Oficio</label>
                <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 px-4 text-white font-medium focus:outline-none focus:border-[#00F0FF] appearance-none cursor-pointer">
                  {OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                </select>
              </div>

              <button disabled={isProcessing} className="w-full bg-[#00F0FF] text-[#0F0F0F] py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isProcessing ? 'Creando...' : 'Comenzar Aprendizaje'} <ArrowRight size={16} />
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] text-white/20 uppercase font-black tracking-widest hover:text-white flex items-center justify-center gap-1">
                <ChevronLeft size={12} /> Volver
              </button>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step-3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-8 text-center relative my-auto py-10">
            <div className="space-y-4">
              <AnaliAvatar emotion={isProcessing ? 'learning' : 'thinking'} size="lg" className="mx-auto" />
              <h2 className="text-2xl font-black uppercase italic text-white leading-tight">Entrenamiento de Voz</h2>
              <p className="text-white/40 text-xs font-medium">Analí necesita aprender tu acento y entonación. Lee despacio la siguiente frase para calibrar su IA con tu voz:</p>
            </div>
            
            <div className="bg-[#1A1A1A] border border-teal-500/30 p-6 rounded-3xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10"><Mic size={48} /></div>
               <p className="text-teal-400 font-bold italic text-lg leading-relaxed relative z-10">
                 "Hola Analí, estoy listo para aprender inglés contigo."
               </p>
            </div>
            
            {error && <div className="text-rose-400 text-xs font-bold">{error}</div>}

            <button 
              onClick={() => {
                if(isProcessing) return;
                setIsProcessing(true);
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (!SpeechRecognition) {
                   handleFinishCalibration(); // Skip if unsupported
                   return;
                }
                const recognition = new SpeechRecognition();
                recognition.lang = 'es-US';
                recognition.onresult = () => {
                   recognition.stop();
                   handleFinishCalibration();
                };
                recognition.onerror = () => {
                   setError("No te escuché bien. Inténtalo de nuevo.");
                   setIsProcessing(false);
                }
                recognition.start();
              }} 
              disabled={isProcessing}
              className={`w-full ${isProcessing ? 'bg-teal-500/20 text-teal-400' : 'bg-[#00F0FF] text-[#0F0F0F] shadow-[0_10px_20px_rgba(0,240,255,0.1)]'} py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95`}
            >
              {isProcessing ? (
                <><span className="w-2 h-2 bg-teal-400 rounded-full animate-ping mr-2"></span> Escuchándote...</>
              ) : (
                <>Presiona aquí y lee la frase <Mic size={16} /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
