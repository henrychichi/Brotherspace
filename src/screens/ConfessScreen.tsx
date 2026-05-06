import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VoiceEffect, applyVoiceEffect } from '../utils/audioEffects.ts';
import { api } from '../../services/api.ts';
import { User } from '../../types.ts';

interface ConfessScreenProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

const EFFECTS: { id: VoiceEffect; label: string; icon: string }[] = [
  { id: 'none', label: 'Original', icon: 'ðŸ‘¤' },
  { id: 'anonymous', label: 'Anonymous', icon: 'ðŸ•µï¸' },
  { id: 'deep', label: 'Deep', icon: 'ðŸ»' },
  { id: 'robot', label: 'Robot', icon: 'ðŸ¤–' },
  { id: 'mysterious', label: 'Mysterious', icon: 'ðŸ‘»' },
];

const ConfessScreen: React.FC<ConfessScreenProps> = ({ user, onBack, onSuccess }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffect>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setOriginalBlob(blob);
        await processAudio(blob, selectedEffect);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (blob: Blob, effect: VoiceEffect) => {
    setIsProcessing(true);
    try {
      const newBlob = await applyVoiceEffect(blob, effect);
      setProcessedBlob(newBlob);
      const url = URL.createObjectURL(newBlob);
      setAudioUrl(url);
    } catch (err) {
      console.error("Error processing audio:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (originalBlob) {
      processAudio(originalBlob, selectedEffect);
    }
  }, [selectedEffect]);

  const deleteRecording = () => {
    setOriginalBlob(null);
    setProcessedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const handleSubmit = async () => {
    if (!processedBlob) return;
    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(processedBlob);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const content = title.trim() ? `Confession: ${title}` : "Anonymous Confession";
        await api.createPost(user.id, "Anonymous", user.role, 'Life', content, undefined, '#1A1A1F', base64String, undefined, undefined);
        onSuccess();
      };
    } catch (err: any) {
      alert("Failed to submit confession: " + err.message);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="flex flex-col h-screen w-full bg-brand-bg"
    >
      <header className="p-6 border-b border-brand-surface/20 flex justify-between items-center">
        <button onClick={onBack} className="text-brand-secondary">Cancel</button>
        <h1 className="text-lg font-bold text-red-500">Confess</h1>
        <div className="w-12" />
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">What are you hiding?</h2>
          <p className="text-brand-secondary text-sm">
            Record your confession. Choose a voice effect to remain completely anonymous.
          </p>
        </div>

        <input 
          type="text" 
          placeholder="Title (Optional)" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none mb-8 text-center"
        />

        {!originalBlob ? (
          <div className="flex flex-col items-center justify-center flex-1 w-full">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isRecording 
                  ? 'bg-red-500 animate-pulse scale-110 shadow-red-500/50' 
                  : 'bg-brand-surface border-2 border-red-500/50 hover:bg-red-500/10'
              }`}
            >
              {isRecording ? (
                <div className="w-10 h-10 bg-white rounded-sm" />
              ) : (
                <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
            <p className="mt-6 text-xl font-mono text-brand-primary">
              {formatTime(recordingTime)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full space-y-8">
            <div className="w-full bg-brand-surface p-6 rounded-brand flex flex-col items-center">
              {isProcessing ? (
                <div className="py-4 text-brand-secondary animate-pulse">Applying effect...</div>
              ) : (
                <>
                  <audio ref={audioRef} src={audioUrl || ''} controls className="w-full mb-4" />
                  <button onClick={deleteRecording} className="text-red-400 text-sm font-medium hover:underline">
                    Delete & Re-record
                  </button>
                </>
              )}
            </div>

            <div className="w-full">
              <h3 className="text-sm font-bold text-brand-secondary mb-4 uppercase tracking-wider">Voice Disguise</h3>
              <div className="grid grid-cols-2 gap-3">
                {EFFECTS.map(effect => (
                  <button
                    key={effect.id}
                    onClick={() => setSelectedEffect(effect.id)}
                    className={`p-4 rounded-brand flex flex-col items-center gap-2 border-2 transition-all ${
                      selectedEffect === effect.id 
                        ? 'border-brand-accent bg-brand-accent/10' 
                        : 'border-brand-surface bg-brand-surface hover:border-brand-secondary'
                    }`}
                  >
                    <span className="text-2xl">{effect.icon}</span>
                    <span className="text-sm font-medium">{effect.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isProcessing}
              className="w-full h-14 bg-red-500 text-white rounded-brand font-bold text-lg shadow-lg shadow-red-500/20 disabled:opacity-50 mt-auto"
            >
              {isSubmitting ? 'Confessing...' : 'Confess Anonymously'}
            </button>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default ConfessScreen;
