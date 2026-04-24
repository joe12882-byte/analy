import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Target, History, CheckCircle2, ChevronRight } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StudentHistoryProps {
  userId: string;
}

export default function StudentHistory({ userId }: StudentHistoryProps) {
  const [stats, setStats] = useState({
    roleplays: 0,
    shadows: 0,
    saved: 0,
    avgScore: 0
  });
  const [recentPlays, setRecentPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Stats: Roleplays
        const rpCol = collection(db, 'roleplay_sessions');
        const qRp = query(rpCol, where("user_id", "==", userId), orderBy("created_at", "desc"), limit(5));
        const rpSnap = await getDocs(qRp);
        
        // Stats: Shadows
        const shCol = collection(db, 'shadow_attempts');
        const qSh = query(shCol, where("user_id", "==", userId));
        const shSnap = await getDocs(qSh);

        // Stats: Saved Items
        const libCol = collection(db, 'users', userId, 'library');
        const libSnap = await getDocs(libCol);

        let totalScore = 0;
        const plays: any[] = [];
        
        rpSnap.forEach(doc => {
          const data = doc.data();
          plays.push({ id: doc.id, type: 'roleplay', ...data });
          if (data.grade?.overall) totalScore += data.grade.overall;
        });

        setStats({
          roleplays: rpSnap.size,
          shadows: shSnap.size,
          saved: libSnap.size,
          avgScore: rpSnap.size > 0 ? Math.round(totalScore / rpSnap.size) : 0
        });
        setRecentPlays(plays);
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/40 border border-slate-100 p-4 rounded-3xl backdrop-blur-sm shadow-sm flex flex-col items-center">
           <Award className="text-amber-500 mb-2" size={20} />
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Master Score</span>
           <span className="text-xl font-black text-slate-800">{stats.avgScore}%</span>
        </div>
        <div className="bg-white/40 border border-slate-100 p-4 rounded-3xl backdrop-blur-sm shadow-sm flex flex-col items-center">
           <Target className="text-teal-500 mb-2" size={20} />
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ejercicios</span>
           <span className="text-xl font-black text-slate-800">{stats.roleplays + stats.shadows}</span>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
          <History size={12} /> Memoria de Vuelos Recientes
        </h3>
        
        {recentPlays.length > 0 ? (
          recentPlays.map((play) => (
            <div key={play.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                   <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{play.scenario_role}</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Nota: {play.grade?.overall}% • {new Date(play.created_at?.toDate()).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          ))
        ) : (
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Sin vuelos guardados aún</p>
          </div>
        )}
      </div>
    </div>
  );
}
