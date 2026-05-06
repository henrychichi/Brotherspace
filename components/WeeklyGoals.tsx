import React, { useState, useEffect } from 'react';
import { Goal, User } from '../types.ts';
import { api } from '../services/api.ts';
import { getGoalNudge } from '../services/gemini.ts';
import { motion, AnimatePresence } from 'framer-motion';

interface WeeklyGoalsProps {
  user: User;
}

const WeeklyGoals: React.FC<WeeklyGoalsProps> = ({ user }) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [nudge, setNudge] = useState<string | null>(null);
  const [loadingNudge, setLoadingNudge] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [user.id]);

  const fetchGoal = async () => {
    const activeGoal = await api.getWeeklyGoal(user.id);
    setGoal(activeGoal);
  };

  const handleSetGoal = async () => {
    if (!newGoalText.trim()) return;
    const g = await api.setWeeklyGoal(user.id, newGoalText);
    setGoal(g);
    setIsSettingGoal(false);
    setNewGoalText('');
  };

  const handleUpdateProgress = async (increment: number) => {
    if (!goal) return;
    const newProgress = Math.min(100, goal.progress + increment);
    const updated = await api.updateGoalProgress(goal.id, newProgress);
    setGoal(updated);
    setNudge(null); // Clear nudge to prompt for a new one if progress changed significantly
  };

  const handleGetNudge = async () => {
    if (!goal || loadingNudge) return;
    setLoadingNudge(true);
    try {
      const text = await getGoalNudge(goal.text, goal.progress);
      setNudge(text);
    } finally {
      setLoadingNudge(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-[#4A44F2] rounded-full" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Weekly Objective</h3>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!goal ? (
          <motion.div 
            key="no-goal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-dashed border-gray-200 p-5 rounded-3xl flex flex-col items-center text-center group hover:border-[#4A44F2]/30 transition-colors shadow-sm"
          >
            {isSettingGoal ? (
              <div className="w-full">
                <input 
                  autoFocus
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetGoal()}
                  className="w-full bg-gray-50 p-3 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#4A44F2] mb-3 border border-gray-100 text-sm"
                  placeholder="e.g., Read 2 chapters, Daily workout..."
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsSettingGoal(false)} className="flex-1 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                  <button onClick={handleSetGoal} className="flex-1 py-2 bg-[#4A44F2] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#4A44F2]/90 transition-colors">Set Goal</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsSettingGoal(true)} className="flex flex-col items-center gap-2 w-full py-2">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#4A44F2] group-hover:bg-[#4A44F2]/5 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Set Weekly Goal</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">What will you conquer this week?</p>
                </div>
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="active-goal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white p-5 rounded-3xl shadow-sm relative overflow-hidden border border-gray-100 ${goal.completed ? 'border-green-500/20 bg-green-50/30' : ''}`}
          >
            {/* Completion Background Effect */}
            {goal.completed && <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />}
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex-1 pr-4">
                <p className={`text-[15px] font-semibold leading-tight ${goal.completed ? 'text-green-600' : 'text-gray-800'}`}>
                  {goal.text}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${goal.completed ? 'text-green-500' : 'text-[#4A44F2]'}`}>
                    {goal.completed ? 'Completed' : 'In Progress'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">{goal.progress}%</span>
                </div>
              </div>
              
              {!goal.completed && (
                <button 
                  onClick={handleGetNudge}
                  disabled={loadingNudge}
                  className="flex flex-col items-center gap-1 group"
                  title="Get AI Nudge"
                >
                  <div className={`w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${loadingNudge ? 'animate-pulse' : 'hover:border-[#4A44F2] hover:text-[#4A44F2] hover:bg-[#4A44F2]/5'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-5 relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                className={`h-full transition-all duration-700 ease-out ${goal.completed ? 'bg-green-500' : 'bg-[#4A44F2]'}`}
              />
            </div>

            <AnimatePresence>
              {nudge && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-4 bg-gray-50 rounded-2xl border-l-4 border-[#4A44F2] italic text-[13px] leading-relaxed text-gray-600 relative z-10"
                >
                  "{nudge}"
                </motion.div>
              )}
            </AnimatePresence>

            {!goal.completed && (
              <div className="flex gap-2 relative z-10">
                {[25, 50, 100].map(inc => (
                  <button 
                    key={inc}
                    onClick={() => handleUpdateProgress(inc === 100 ? 100 - goal.progress : inc)}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95 ${inc === 100 ? 'bg-[#4A44F2] text-white shadow-sm hover:bg-[#4A44F2]/90' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:text-gray-800'}`}
                  >
                    {inc === 100 ? 'Finish' : `+${inc}%`}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyGoals;
