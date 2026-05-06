import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioData: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioData);
    audioRef.current = audio;
    
    const onMetadataLoaded = () => {
      setDuration(audio.duration);
    };

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onMetadataLoaded);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMetadataLoaded);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioData]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-sm">
      <div className="flex items-center gap-3 bg-brand-bg/60 border border-brand-bg p-2.5 rounded-brand">
        <button 
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0 shadow-sm"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-1 bg-brand-surface rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-brand-accent transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[9px] font-bold text-brand-hint tracking-tighter">
              {formatTime(currentTime)}
            </span>
            <span className="text-[9px] font-bold text-brand-hint tracking-tighter">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2">
         <div className="w-1 h-1 rounded-full bg-brand-accent" />
         <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-[0.1em]">Voice Support</span>
      </div>
    </div>
  );
};

export default AudioPlayer;
