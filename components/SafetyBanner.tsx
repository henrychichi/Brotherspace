import React from 'react';
import { SAFETY_MESSAGE } from '../constants.ts';
import { motion } from 'framer-motion';

const SafetyBanner: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#4A44F2]/5 border-l-4 border-[#4A44F2] p-5 mb-8 rounded-r-2xl mx-1"
    >
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-[#4A44F2] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 className="text-[13px] font-bold text-[#4A44F2] mb-1">Support Guide</h4>
          <p className="text-gray-600 text-sm leading-relaxed italic">
            "{SAFETY_MESSAGE}"
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SafetyBanner;
