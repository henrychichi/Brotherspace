import React from 'react';
import { motion } from 'framer-motion';

interface DailyPromptProps {
  prompt: string;
  onClick: (prompt: string) => void;
}

const DailyPrompt: React.FC<DailyPromptProps> = ({ prompt, onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(prompt)}
      className="bg-white p-5 rounded-3xl mb-8 cursor-pointer relative overflow-hidden group border border-gray-100 hover:border-[#4A44F2]/30 transition-all shadow-sm"
    >
      {/* Decorative accent element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A44F2]/5 rounded-full -mr-12 -mt-12 blur-2xl transition-all group-hover:bg-[#4A44F2]/10" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 bg-[#4A44F2] rounded-full" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#4A44F2]">Daily Prompt</span>
        </div>
        <h3 className="text-[16px] font-semibold text-gray-800 leading-snug">
          "{prompt}"
        </h3>
        <div className="mt-4 flex items-center text-gray-400 text-[12px] font-medium group-hover:text-[#4A44F2] transition-colors">
          Share your thoughts
          <svg className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyPrompt;
