import React, { useState } from 'react';
import { Play, Pause, MessageSquare, Flag } from 'lucide-react';

interface VoiceMessageCardProps {
  username: string;
  status: string;
  time: string;
  duration: string;
  chatCount: number;
  onPlay?: () => void;
  onReport?: () => void;
  onChat?: () => void;
}

const VoiceMessageCard: React.FC<VoiceMessageCardProps> = ({
  username,
  status,
  time,
  duration,
  chatCount,
  onPlay,
  onReport,
  onChat,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
    onPlay?.();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2 border border-gray-700 hover:bg-gray-700/50 transition-colors duration-200 w-full max-w-sm">
      {/* Top Row: Header */}
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-gray-200 truncate max-w-[120px]">
            {username}
          </span>
          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
            {status}
          </span>
        </div>
        <span className="text-[9px] text-gray-600 font-medium whitespace-nowrap">
          {time}
        </span>
      </div>

      {/* Middle Row: Voice Player */}
      <div className="flex items-center gap-2 mb-2 bg-gray-900/50 rounded-md p-1.5 border border-gray-700/50">
        <button
          onClick={handlePlayClick}
          className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-white fill-current" />
          ) : (
            <Play className="w-3 h-3 text-white fill-current ml-0.5" />
          )}
        </button>
        
        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden relative">
          <div 
            className={`h-full bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'w-1/2 animate-pulse' : 'w-0'}`} 
          />
        </div>
        
        <span className="text-[9px] text-gray-400 font-mono w-8 text-right">
          {duration}
        </span>
      </div>

      {/* Footer Row: Actions */}
      <div className="flex justify-between items-center border-t border-gray-700/50 pt-1.5 mt-1">
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
          Voice Support
        </span>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onChat}
            className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors group"
          >
            <MessageSquare className="w-3 h-3" />
            <span className="text-[10px] font-medium group-hover:text-blue-400 transition-colors">
              {chatCount}
            </span>
          </button>
          
          <button 
            onClick={onReport}
            className="flex items-center gap-1 text-gray-600 hover:text-red-400 transition-colors group"
            title="Report"
          >
            <Flag className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessageCard;
