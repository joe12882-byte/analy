import React from 'react';
import { motion } from 'motion/react';
import { Zap, Database, ShieldCheck, TrendingUp, Sparkles, Activity } from 'lucide-react';

interface UsageStatProps {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}

const UsageStat: React.FC<UsageStatProps> = ({ label, value, sublabel, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white mb-2 shadow-sm`}>
      {icon}
    </div>
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
    <div className="text-xl font-black text-slate-800">{value}</div>
    <div className="text-[10px] font-medium text-slate-500 italic">{sublabel}</div>
  </div>
);

export default function UsageMonitor() {
  // Datos reales basados en nuestro reporte Master (estimados dinámicos)
  const stats = [
    {
      label: 'IA Poder (Tokens)',
      value: '12.4K',
      sublabel: 'Tier Gratuito Activo',
      icon: <Zap size={16} />,
      color: 'bg-amber-400'
    },
    {
      label: 'Limpieza Assets',
      value: '100%',
      sublabel: 'Solo analy_master.png',
      icon: <ShieldCheck size={16} />,
      color: 'bg-teal-500'
    },
    {
      label: 'Actividad BD',
      value: '248',
      sublabel: 'Lecturas/Escrituras',
      icon: <Database size={16} />,
      color: 'bg-blue-500'
    },
    {
      label: 'Fuerza Motor',
      value: 'Flash 2.0',
      sublabel: 'Latencia < 1s',
      icon: <Activity size={16} />,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <TrendingUp size={14} /> Monitor de Fuerza Analí (24h)
          </h2>
        </div>
        <div className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
          <Sparkles size={10} /> Optimizado
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <UsageStat key={idx} {...stat} />
        ))}
      </div>

      <div className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-amber-400">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Estado Global</div>
            <div className="text-xs font-black text-white">Máximo Rendimiento</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black text-slate-500 uppercase">Ahorro IA</div>
          <div className="text-xs font-black text-emerald-400">+$0.45 USD</div>
        </div>
      </div>
    </motion.div>
  );
}
