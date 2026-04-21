import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Activity, Battery, BatteryWarning, CalendarDays } from 'lucide-react';
import { getTTSQuota, TTS_FREE_LIMIT, TTS_BUDGET_LIMIT } from '../lib/ttsTracker';

export default function TTSQuotaMeter() {
  const [quota, setQuota] = useState<{used: number; monthId: string} | null>(null);

  useEffect(() => {
    getTTSQuota().then(setQuota);
  }, []);

  if (!quota) return null;

  const getStatus = () => {
    if (quota.used < TTS_FREE_LIMIT) {
      return { 
        label: 'Modo Regalo 🎁', 
        color: 'bg-emerald-500', 
        textColor: 'text-emerald-500',
        bgSubtle: 'bg-emerald-50',
        progress: (quota.used / TTS_FREE_LIMIT) * 100,
        subtext: 'Fase A (Free Premium)'
      };
    } else if (quota.used < TTS_BUDGET_LIMIT) {
      return { 
        label: 'Modo Presupuesto $ 💸', 
        color: 'bg-amber-500', 
        textColor: 'text-amber-500',
        bgSubtle: 'bg-amber-50',
        progress: ((quota.used - TTS_FREE_LIMIT) / (TTS_BUDGET_LIMIT - TTS_FREE_LIMIT)) * 100,
        subtext: 'Fase B ($5 USD Limit)'
      };
    } else {
      return { 
        label: 'Modo Ahorro 🛡️', 
        color: 'bg-rose-500', 
        textColor: 'text-rose-500',
        bgSubtle: 'bg-rose-50',
        progress: 100,
        subtext: 'Fase C (Bio-Emulation Fallback)'
      };
    }
  };

  const status = getStatus();

  // Calcular próximo mes
  const [year, month] = quota.monthId.split('-');
  let nextMonth = parseInt(month, 10) + 1;
  let nextYear = parseInt(year, 10);
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const nextReset = new Date(nextYear, nextMonth - 1, 1).toLocaleDateString('es-ES', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className={`rounded-3xl p-6 shadow-sm border border-slate-100 ${status.bgSubtle} transition-colors`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white ${status.color}`}>
            <Activity size={24} />
          </div>
          <div>
            <h3 className={`font-black tracking-tight ${status.textColor}`}>{status.label}</h3>
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">{status.subtext}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-800">
            {quota.used.toLocaleString()}
          </p>
          <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">
            Caracteres Usados
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400">
          <span>0</span>
          <span>{status.label.includes('Regalo') ? TTS_FREE_LIMIT.toLocaleString() : (status.label.includes('Presupuesto') ? TTS_BUDGET_LIMIT.toLocaleString() : 'MAX')}</span>
        </div>
        <div className="h-3 w-full bg-slate-200/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${status.color} transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, status.progress)}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/50 p-3 rounded-2xl">
         <CalendarDays size={16} className={status.textColor} />
         <span>Próximo reinicio de cuota automático: <strong className="text-slate-700">{nextReset}</strong></span>
      </div>
    </div>
  );
}
