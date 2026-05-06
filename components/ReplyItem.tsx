import React, { useState } from 'react';
import { Reply } from '../types.ts';
import AudioPlayer from './AudioPlayer.tsx';
import { motion } from 'framer-motion';

interface ReplyItemProps {
  reply: Reply;
  onHelpful: (id: string) => void;
  onTalkPrivately: (reply: Reply) => void;
  onReport: (id: string) => void;
  index?: number;
  currentUserId?: string;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ 
  reply, 
  onHelpful, 
  onTalkPrivately, 
  onReport,
  index = 0,
  currentUserId 
}) => {
  const [hasHelpful, setHasHelpful] = useState(false);

  const handleHelpful = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasHelpful) {
      onHelpful(reply.id);
      setHasHelpful(true);
    }
  };

  const handleTalk = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTalkPrivately(reply);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReport(reply.id);
  };

  const isOwnReply = currentUserId === reply.user_id;
  const userColor = reply.color || '#3A7AFE';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm mb-4"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-brand-primary text-[14px] font-semibold">
              {reply.anon_name}
            </span>
            {reply.is_supporter && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A44F2]" title="Supporter"></span>
            )}
          </div>
          <span className="text-[11px] text-brand-hint font-medium uppercase tracking-wider">
            {reply.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
           <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: userColor }}
          />
          <span className="text-[11px] text-brand-secondary font-medium">
            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {reply.content && (
        <p className="text-brand-primary text-[14px] leading-relaxed mb-4 font-normal">
          {reply.content}
        </p>
      )}

      {reply.audio_data && (
        <div className="mb-4">
          <AudioPlayer audioData={reply.audio_data} />
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-border">
        <div className="flex gap-3">
          <button 
            onClick={handleHelpful}
            className={`flex items-center gap-1.5 text-[12px] font-semibold px-2 py-1 rounded-md transition-all ${
              hasHelpful 
                ? 'text-green-500 bg-green-50' 
                : 'text-brand-secondary hover:text-brand-primary hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill={hasHelpful ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10h4.708C19.743 10 20.5 10.84 20.5 11.875c0 .387-.116.757-.333 1.064l-3.142 4.488c-.343.49-.915.773-1.525.773H10.5V10l3.5-3.5a1.5 1.5 0 112.121 2.121L14 10zM10.5 10H7a2 2 0 00-2 2v6a2 2 0 002 2h3.5V10z" />
            </svg>
            {reply.helpful_count + (hasHelpful ? 1 : 0)}
          </button>

          {!isOwnReply && (
            <button 
              onClick={handleTalk}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#4A44F2] hover:bg-[#4A44F2]/10 px-2 py-1 rounded-md transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
          )}
        </div>

        {!isOwnReply && (
          <button 
            onClick={handleReport}
            className="text-[11px] font-medium text-brand-hint hover:text-red-500 transition-colors"
          >
            Report
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ReplyItem;
