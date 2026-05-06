import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SessionTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'poll' | 'challenge' | 'reflect' | 'chat'>('poll');
  const [hasVoted, setHasVoted] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [reflection, setReflection] = useState('');
  const [reflectionSent, setReflectionSent] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Silence is definitely harder when you're tired.", isHighlight: false },
    { id: 2, text: "The 3-second rule changed my marriage.", isHighlight: true },
    { id: 3, text: "I struggle with ego the most.", isHighlight: false },
  ]);

  const handleVote = () => setHasVoted(true);
  const handleChallenge = () => setChallengeCompleted(true);
  const handleReflection = () => {
    if (reflection.trim()) {
      setReflectionSent(true);
      setReflection('');
    }
  };
  const handleChat = () => {
    if (chatMessage.trim()) {
      setChatMessages([...chatMessages, { id: Date.now(), text: chatMessage, isHighlight: false }]);
      setChatMessage('');
    }
  };

  return (
    <div className="bg-brand-surface/50 backdrop-blur-md rounded-2xl p-5 border border-brand-border w-full max-w-sm">
      <div className="flex gap-1 mb-4 border-b border-brand-border/50 pb-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('poll')}
          className={`flex-1 min-w-[60px] text-[9px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors ${activeTab === 'poll' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:bg-brand-bg'}`}
        >
          Poll
        </button>
        <button 
          onClick={() => setActiveTab('challenge')}
          className={`flex-1 min-w-[60px] text-[9px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors ${activeTab === 'challenge' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:bg-brand-bg'}`}
        >
          Challenge
        </button>
        <button 
          onClick={() => setActiveTab('reflect')}
          className={`flex-1 min-w-[60px] text-[9px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors ${activeTab === 'reflect' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:bg-brand-bg'}`}
        >
          Reflect
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-w-[60px] text-[9px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-brand-accent text-white' : 'text-brand-secondary hover:bg-brand-bg'}`}
        >
          Chat
        </button>
      </div>

      <div className="min-h-[180px]">
        {activeTab === 'poll' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 className="text-sm font-bold text-white mb-3">What is your biggest obstacle to silence?</h4>
            {!hasVoted ? (
              <div className="space-y-2">
                {['Need for validation', 'Fear of being misunderstood', 'Habit / Impulse', 'Ego / Pride'].map((opt) => (
                  <button 
                    key={opt}
                    onClick={handleVote}
                    className="w-full text-left p-3 rounded-xl bg-brand-bg border border-brand-border hover:border-brand-accent/50 hover:bg-brand-accent/10 transition-all text-xs text-brand-primary"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Need for validation', pct: 45 },
                  { label: 'Ego / Pride', pct: 30 },
                  { label: 'Habit / Impulse', pct: 15 },
                  { label: 'Fear of being misunderstood', pct: 10 },
                ].map((res) => (
                  <div key={res.label}>
                    <div className="flex justify-between text-[10px] text-brand-secondary mb-1">
                      <span>{res.label}</span>
                      <span>{res.pct}%</span>
                    </div>
                    <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${res.pct}%` }} 
                        className="h-full bg-brand-accent"
                      />
                    </div>
                  </div>
                ))}
                <p className="text-center text-[10px] text-green-400 mt-4">âœ“ +1 Point Awarded</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'challenge' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">ðŸ”¥</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Daily Check-In</h4>
            <p className="text-xs text-brand-secondary mb-6">Did you practice the "3-Second Pause" before speaking today?</p>
            
            {!challengeCompleted ? (
              <div className="flex gap-3 justify-center">
                <button onClick={handleChallenge} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-colors">
                  YES, I DID
                </button>
                <button className="px-6 py-2 bg-brand-bg border border-brand-border text-brand-secondary rounded-lg text-xs font-bold">
                  NOT YET
                </button>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-green-400 font-bold text-sm mb-1">Streak: 3 Days! ðŸ”¥</p>
                <p className="text-[10px] text-green-300/70">+15 Points Awarded</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reflect' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 className="text-sm font-bold text-white mb-2">Anonymous Reflection</h4>
            <p className="text-[10px] text-brand-secondary mb-3">Share a thought. No name attached.</p>
            
            {!reflectionSent ? (
              <>
                <textarea 
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full h-24 bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-accent resize-none mb-3"
                  placeholder="I realized that my silence is often just..."
                />
                <button 
                  onClick={handleReflection}
                  disabled={!reflection.trim()}
                  className="w-full py-2 bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold"
                >
                  Submit (+5 pts)
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-white font-bold text-sm">Reflection Sent</p>
                <p className="text-[10px] text-brand-secondary mt-1">Your insight might be featured in the weekly summary.</p>
                <button onClick={() => setReflectionSent(false)} className="mt-4 text-[10px] text-brand-accent underline">Send another</button>
              </div>
            )}
          </motion.div>
        )}
        {activeTab === 'chat' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[200px]">
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 no-scrollbar">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`p-2 rounded-lg text-xs ${msg.isHighlight ? 'bg-brand-accent/20 border border-brand-accent/30' : 'bg-brand-bg border border-brand-border'}`}>
                  {msg.isHighlight && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[8px] font-bold uppercase text-brand-accent tracking-wider">Top Insight</span>
                      <svg className="w-3 h-3 text-brand-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                  )}
                  <p className="text-brand-primary">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Share an insight..." 
                className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-accent"
              />
              <button onClick={handleChat} disabled={!chatMessage.trim()} className="bg-brand-accent text-white p-2 rounded-lg disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SessionTools;
