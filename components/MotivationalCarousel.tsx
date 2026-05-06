import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  {
    title: "RESILIENCE",
    text: "The grind is hard, but you're harder. Keep pushing, brother.",
    bg: "from-[#1a1c2e] to-[#0f172a]"
  },
  {
    title: "STRENGTH",
    text: "True strength isn't just in silence; it's in the courage to speak up.",
    bg: "from-[#2e1a1a] to-[#1a0f0f]"
  },
  {
    title: "LEGACY",
    text: "You are building a foundation for those who follow. Stay steady.",
    bg: "from-[#1a2e23] to-[#0f1a14]"
  },
  {
    title: "BROTHERHOOD",
    text: "No man walks this path alone. We've got your back.",
    bg: "from-[#2e261a] to-[#1a150f]"
  }
];

const MotivationalCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-32 mb-6 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 p-6 flex flex-col justify-center"
        >
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative z-10"
          >
            <h4 className="text-[11px] font-bold tracking-widest text-[#4A44F2] mb-2 uppercase">
              {MESSAGES[index].title}
            </h4>
            <p className="text-[15px] font-semibold leading-snug text-gray-800 max-w-[95%]">
              {MESSAGES[index].text}
            </p>
          </motion.div>
          
          {/* Progress indicators */}
          <div className="absolute bottom-5 right-6 flex gap-1.5">
            {MESSAGES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-4 bg-[#4A44F2]' : 'w-1.5 bg-gray-200'}`} 
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MotivationalCarousel;
