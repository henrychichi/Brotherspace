import React from 'react';
import { motion } from 'framer-motion';

export const WEEKLY_PLAN = {
  motion: "The Discipline of Silence",
  subQuestions: [
    "When was the last time you stayed silent instead of reacting?",
    "Does your silence command respect or show weakness?",
    "How can you practice silence in a heated argument?"
  ],
  schedule: [
    { day: 1, title: "Introduction", topic: "Defining Silence as Power", status: "Completed", date: "Mon" },
    { day: 2, title: "Analysis", topic: "Why We Overshare & React", status: "Active", date: "Tue" },
    { day: 3, title: "Root Causes", topic: "Ego, Insecurity, and Validation", status: "Upcoming", date: "Wed" },
    { day: 4, title: "Solutions", topic: "The 3-Second Rule & Stoic Pauses", status: "Upcoming", date: "Thu" },
    { day: 5, title: "Resolution", topic: "24-Hour Silence Challenge", status: "Upcoming", date: "Fri" }
  ],
  reminders: [
    { city: "Lusaka", time: "8 PM CAT" },
    { city: "New York", time: "2 PM EST" },
    { city: "London", time: "7 PM GMT" }
  ],
  actionChallenge: "24 Hours of No Complaining. Reset the clock if you slip up."
};

const WeeklySchedule: React.FC = () => {
  return (
    <div className="bg-brand-surface/50 backdrop-blur-md rounded-2xl p-5 border border-brand-border w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-brand-primary font-bold text-sm uppercase tracking-wider">Weekly Schedule</h3>
        <span className="text-[10px] text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-full border border-brand-accent/20">Week 42</span>
      </div>

      <div className="space-y-3 relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-brand-border z-0"></div>

        {WEEKLY_PLAN.schedule.map((item, index) => (
          <div key={item.day} className="relative z-10 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 ${
              item.status === 'Active' 
                ? 'bg-brand-accent text-white border-brand-accent shadow-[0_0_15px_rgba(58,122,254,0.5)]' 
                : item.status === 'Completed'
                  ? 'bg-brand-surface text-brand-secondary border-brand-secondary/50'
                  : 'bg-brand-bg text-brand-hint border-brand-border'
            }`}>
              {item.status === 'Completed' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <span>D{item.day}</span>
              )}
            </div>
            
            <div className={`flex-1 p-3 rounded-xl border ${
              item.status === 'Active' 
                ? 'bg-brand-surface border-brand-accent/30' 
                : 'bg-brand-bg/50 border-transparent'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  item.status === 'Active' ? 'text-brand-accent' : 'text-brand-hint'
                }`}>
                  {item.title}
                </span>
                <span className="text-[10px] text-brand-hint">{item.date}</span>
              </div>
              <p className={`text-xs font-medium ${
                item.status === 'Upcoming' ? 'text-brand-secondary' : 'text-brand-primary'
              }`}>
                {item.topic}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-brand-border">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-bold text-brand-secondary uppercase">Live Session Reminders</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {WEEKLY_PLAN.reminders.map((r, i) => (
            <span key={i} className="text-[10px] bg-brand-bg px-2 py-1 rounded border border-brand-border text-brand-hint">
              <strong className="text-brand-secondary">{r.city}:</strong> {r.time}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
