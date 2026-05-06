import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WeeklyMotion: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time until next session (simulated for 8 PM local time)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(20, 0, 0, 0); // 8 PM
      
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 mb-6 shadow-xl border border-indigo-500/30 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/20">
            Weekly Motion
          </span>
          <div className="text-right">
            <p className="text-[10px] text-indigo-300 uppercase tracking-widest">Next Session</p>
            <p className="text-white font-mono text-sm font-bold">{timeLeft}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
          The Discipline of Silence
        </h2>
        
        <p className="text-indigo-100/80 text-sm mb-6 leading-relaxed">
          Silence isn't just the absence of noiseâ€”it's the presence of control. This week, we explore how withholding reaction builds power.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold text-sm mt-0.5">1</span>
            <p className="text-sm text-slate-300">When was the last time you stayed silent instead of reacting?</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold text-sm mt-0.5">2</span>
            <p className="text-sm text-slate-300">Does your silence command respect or show weakness?</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold text-sm mt-0.5">3</span>
            <p className="text-sm text-slate-300">How can you practice silence in a heated argument?</p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Weekly Challenge</h3>
          </div>
          <p className="text-sm text-white font-medium">24 Hours of No Complaining.</p>
          <p className="text-xs text-slate-400 mt-1">Reset the clock if you slip up.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyMotion;
