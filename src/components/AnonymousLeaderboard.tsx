import React from 'react';

const LEADERBOARD_DATA = [
  { rank: 1, handle: "AlphaBro_99", points: 145, badges: ["ðŸ—£ï¸", "ðŸ”¥"] }, // Spoke x5, Challenge x3, Chat x10
  { rank: 2, handle: "StoicMind", points: 120, badges: ["ðŸ“"] },
  { rank: 3, handle: "IronWill", points: 95, badges: ["ðŸ—³ï¸"] },
  { rank: 4, handle: "SilentFocus", points: 80, badges: [] },
  { rank: 5, handle: "NightOwl", points: 65, badges: [] },
];

const AnonymousLeaderboard: React.FC = () => {
  return (
    <div className="bg-brand-surface/50 backdrop-blur-md rounded-2xl p-5 border border-brand-border w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-brand-primary font-bold text-sm uppercase tracking-wider">Weekly Top Contributors</h3>
        <span className="text-[10px] text-brand-hint">Reset: Friday</span>
      </div>

      <div className="space-y-2">
        {LEADERBOARD_DATA.map((user) => (
          <div key={user.handle} className="flex items-center justify-between p-2 rounded-lg bg-brand-bg/40 border border-brand-border/50">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                user.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                user.rank === 2 ? 'bg-slate-400/20 text-slate-400 border border-slate-400/30' :
                user.rank === 3 ? 'bg-orange-700/20 text-orange-700 border border-orange-700/30' :
                'bg-brand-surface text-brand-secondary'
              }`}>
                {user.rank}
              </div>
              <span className="text-xs font-medium text-brand-primary">{user.handle}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {user.badges.map((b, i) => <span key={i} className="text-[10px]">{b}</span>)}
              </div>
              <span className="text-xs font-bold text-brand-accent">{user.points} pts</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-brand-border flex justify-between items-center">
        <div className="flex flex-col">
           <span className="text-[10px] text-brand-secondary">Your Rank: <span className="text-white font-bold">#42</span></span>
           <span className="text-[9px] text-brand-hint">Next rank: +15 pts</span>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-brand-secondary">Points: <span className="text-brand-accent font-bold">45</span></span>
           <div className="flex gap-1 mt-0.5 justify-end opacity-50">
             <span className="text-[8px]" title="Speaking">ðŸ—£ï¸ 10</span>
             <span className="text-[8px]" title="Challenge">ðŸ”¥ 15</span>
             <span className="text-[8px]" title="Chat">ðŸ’¬ 5</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymousLeaderboard;
