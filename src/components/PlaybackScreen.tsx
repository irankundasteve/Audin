import { ChevronLeft, MoreVertical, Play, Pause, SkipBack, SkipForward, Loader2, Rabbit, Snail, Rocket, Repeat, Repeat1, Clock, FastForward, Rewind, Timer, TimerOff, Scissors, Settings, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, ChangeEvent, MouseEvent as ReactMouseEvent, useMemo } from "react";
import { Recording } from "../App";
import { getAudioPeaks, parseDuration } from "../lib/audioUtils";

type RepeatMode = 'off' | 'one' | 'all';
type PanelType = 'speed' | 'skip' | 'repeat' | 'timer' | 'menu';

interface PlaybackScreenProps {
  recording: Recording;
  onBack: () => void;
  onTrim: () => void;
  onEnhance: () => void;
  onOpenSettings: () => void;
  key?: string | number;
}

export default function PlaybackScreen({ recording, onBack, onTrim, onEnhance, onOpenSettings }: PlaybackScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [durationInSeconds, setDurationInSeconds] = useState(parseDuration(recording.duration));
  const [peaks, setPeaks] = useState<number[]>([]);

  // Advanced States
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [skipInterval, setSkipInterval] = useState(10);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<PanelType | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Sync speed with audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Generate real peaks
  useEffect(() => {
    if (recording.audioUrl) {
        getAudioPeaks(recording.audioUrl, 60).then(p => setPeaks(p));
    }
  }, [recording.audioUrl]);

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setDurationInSeconds(dur);
      }
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    if (repeatMode === 'one' || repeatMode === 'all') {
      if (audioRef.current && Number.isFinite(0)) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Audio play failed:", error);
          }
        });
      }
    } else {
      setIsPlaying(false);
    }
  };

  // Parse duration "MM:SS" to seconds
  useEffect(() => {
    const parts = recording.duration.split(':').map(Number);
    if (parts.length === 2) {
      const [mins, secs] = parts;
      const total = mins * 60 + secs;
      if (Number.isFinite(total)) {
        setDurationInSeconds(total);
      }
    }
    
    // Simulation of loading
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(loadTimer);
  }, [recording.duration]);

  // Sleep Timer Effect
  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0 && isPlaying) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    }
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimer, isPlaying]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isLoading || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (Number.isFinite(durationInSeconds) && currentTime >= durationInSeconds) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play().catch(error => {
        if (error.name !== 'AbortError') {
          console.error("Audio play failed:", error);
        }
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current && Number.isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleWaveformTap = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isLoading || !waveformRef.current || !audioRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = durationInSeconds * percentage;
    if (Number.isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const progressPercentage = (Number.isFinite(durationInSeconds) && durationInSeconds > 0) ? (currentTime / durationInSeconds) * 100 : 0;

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleSkipShortcut = (direction: 'fwd' | 'back') => {
    const delta = direction === 'fwd' ? skipInterval : -skipInterval;
    if (audioRef.current) {
      const next = audioRef.current.currentTime + delta;
      const clamped = Math.max(0, Math.min(durationInSeconds || 0, next));
      if (Number.isFinite(clamped)) {
        audioRef.current.currentTime = clamped;
        setCurrentTime(clamped);
      }
    }
  };

  const getSpeedIcon = () => {
    if (playbackSpeed < 1) return <Snail className="w-5 h-5 text-[#2196F3]" />;
    if (playbackSpeed === 1) return <span className="text-[12px] font-bold text-[#AAAAAA]">1x</span>;
    if (playbackSpeed < 3) return <Rabbit className="w-5 h-5 text-[#2196F3]" />;
    return <Rocket className="w-5 h-5 text-[#2196F3]" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const handleWaveformLongPress = () => {
    // Navigator vibrate for haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
    onTrim();
  };

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const onMouseDownWaveform = () => {
    const timer = setTimeout(handleWaveformLongPress, 500);
    setLongPressTimer(timer);
  };

  const onMouseUpWaveform = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={() => setActivePanel(null)}
      className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-white overflow-hidden"
    >
      {/* Top Bar */}
      <header className="h-[56px] px-2 flex items-center justify-between bg-[#09090b]">
        <div className="flex items-center space-x-1">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 px-2 min-w-0">
          <h1 className="text-[18px] font-medium truncate text-center">{recording.name}</h1>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEnhance(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#2196F3] active:bg-white/10"
            title="AI Enhance"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActivePanel(activePanel === 'menu' ? null : 'menu');
            }} 
            className={`w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 ${activePanel === 'menu' ? 'bg-white/10' : ''}`}
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Playback Content */}
      <main className="flex-1 flex flex-col p-6 items-center justify-between">
        <audio
          ref={audioRef}
          src={recording.audioUrl}
          onLoadedMetadata={handleMetadataLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onError={() => setIsLoading(false)}
        />
        {/* Waveform Visualization (40% height) */}
        <div 
          ref={waveformRef}
          onClick={handleWaveformTap}
          onMouseDown={onMouseDownWaveform}
          onMouseUp={onMouseUpWaveform}
          onTouchStart={onMouseDownWaveform}
          onTouchEnd={onMouseUpWaveform}
          className={`w-full h-[40vh] bg-[#1E1E1E]/50 rounded-[32px] relative overflow-hidden flex items-end justify-between px-4 pb-8 transition-opacity duration-500 cursor-pointer ${isLoading ? 'opacity-40' : 'opacity-100'}`}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          
          {/* Playhead Indicator */}
          <motion.div 
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            animate={{ left: `${progressPercentage}%` }}
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
          />

          {/* Time Labels */}
          <div className="absolute top-4 left-6 text-[10px] text-[#777777] font-bold tracking-widest uppercase">0:00</div>
          <div className="absolute top-4 right-6 text-[10px] text-[#777777] font-bold tracking-widest uppercase">{recording.duration}</div>

          {/* Visualization Peaks (Real) */}
          <div className="flex-1 h-full flex items-center justify-around space-x-0.5">
            {(peaks.length > 0 ? peaks : [...Array(60)]).map((p, i) => {
                const height = 10 + (typeof p === 'number' ? p : 0.3) * 70;
                const isPassed = (i / 60) * 100 < progressPercentage;
                return (
                    <div 
                        key={i} 
                        className={`w-1.5 rounded-full transition-colors duration-300 ${isPassed ? 'bg-[#2196F3]' : 'bg-[#333333]'}`}
                        style={{ height: `${height}%` }}
                    />
                );
            })}
          </div>
        </div>

        {/* Time Display */}
        <div className="flex flex-col items-center mt-8">
          <div className="relative">
            <motion.h2 
                key={Math.floor(currentTime)}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.1 }}
                className="text-[64px] font-mono font-medium tracking-tighter leading-none"
            >
                {formatTime(currentTime)}
            </motion.h2>
            <AnimatePresence>
                {isLoading && (
                    <motion.p 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="text-[#2196F3] text-[14px] font-bold tracking-widest uppercase mt-2 text-center"
                    >
                        Loading...
                    </motion.p>
                )}
            </AnimatePresence>
          </div>
          <p className="text-[24px] text-[#777777] font-light mt-1">/ {recording.duration}</p>
        </div>

        {/* Bottom Controls Area */}
        <div className="w-full relative space-y-4 mb-2">
          {/* Advanced Panels (Floating above controls) */}
          <div onClick={(e) => e.stopPropagation()} className="px-4">
            <AnimatePresence mode="wait">
              {activePanel === 'speed' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1E1E1E] rounded-2xl p-4 overflow-hidden shadow-2xl border border-white/5 mb-2"
                >
                  <p className="text-[10px] text-[#777777] font-bold tracking-widest uppercase mb-4">Playback Speed</p>
                  <div className="flex justify-between items-center space-x-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2, 3].map(s => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`flex-1 h-10 rounded-xl text-[12px] font-bold transition-all ${playbackSpeed === s ? 'bg-[#2196F3] text-white' : 'bg-white/5 text-[#AAAAAA] active:bg-white/10'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activePanel === 'skip' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1E1E1E] rounded-2xl p-4 overflow-hidden shadow-2xl border border-white/5 mb-2"
                >
                  <p className="text-[10px] text-[#777777] font-bold tracking-widest uppercase mb-4">Skip Intervals</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 30, 60, 300].map(interval => (
                      <button
                        key={interval}
                        onClick={() => setSkipInterval(interval)}
                        className={`h-10 rounded-xl text-[12px] font-bold transition-all ${skipInterval === interval ? 'bg-[#2196F3] text-white' : 'bg-white/5 text-[#AAAAAA]'}`}
                      >
                        {interval}s
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button onClick={() => handleSkipShortcut('back')} className="flex-1 h-12 bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10">
                      <Rewind className="w-5 h-5 mr-2" /> -{skipInterval}s
                    </button>
                    <button onClick={() => handleSkipShortcut('fwd')} className="flex-1 h-12 bg-white/5 rounded-xl flex items-center justify-center active:bg-white/10">
                      <FastForward className="w-5 h-5 mr-2" /> +{skipInterval}s
                    </button>
                  </div>
                </motion.div>
              )}

              {activePanel === 'repeat' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1E1E1E] rounded-2xl p-4 overflow-hidden shadow-2xl border border-white/5 mb-2"
                >
                  <p className="text-[10px] text-[#777777] font-bold tracking-widest uppercase mb-4">Repeat Mode</p>
                  <div className="flex space-x-2">
                    {(['off', 'one', 'all'] as RepeatMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setRepeatMode(mode)}
                        className={`flex-1 h-12 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center ${repeatMode === mode ? 'bg-[#2196F3] text-white' : 'bg-white/5 text-[#AAAAAA]'}`}
                      >
                        {mode === 'off' && <Repeat className="w-4 h-4 mr-2" />}
                        {mode === 'one' && <Repeat1 className="w-4 h-4 mr-2" />}
                        {mode === 'all' && <Repeat className="w-4 h-4 mr-2 text-white fill-white/20" />}
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activePanel === 'menu' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1E1E1E] rounded-2xl p-4 overflow-hidden shadow-2xl border border-white/5 mb-2"
                >
                  <div className="flex flex-col space-y-1">
                    <button 
                      onClick={() => { onTrim(); setActivePanel(null); }}
                      className="w-full h-12 px-4 flex items-center space-x-3 rounded-xl active:bg-white/5 text-white"
                    >
                      <Scissors className="w-5 h-5 text-[#2196F3]" />
                      <span className="font-medium">Trim Audio</span>
                    </button>
                    <button 
                      onClick={() => { onEnhance(); setActivePanel(null); }}
                      className="w-full h-12 px-4 flex items-center space-x-3 rounded-xl active:bg-[#2196F3]/10 text-white"
                    >
                      <Wand2 className="w-5 h-5 text-[#2196F3]" />
                      <span className="font-medium">Enhance Audio (AI)</span>
                    </button>
                    <button className="w-full h-12 px-4 flex items-center space-x-3 rounded-xl opacity-50 cursor-not-allowed">
                      <FastForward className="w-5 h-5" />
                      <span className="font-medium">Share</span>
                    </button>
                    <button 
                      onClick={() => { onOpenSettings(); setActivePanel(null); }}
                      className="w-full h-12 px-4 flex items-center space-x-3 rounded-xl active:bg-white/5 text-white"
                    >
                      <Settings className="w-5 h-5 text-[#AAAAAA]" />
                      <span className="font-medium">App Settings</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activePanel === 'timer' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1E1E1E] rounded-2xl p-4 overflow-hidden shadow-2xl border border-white/5 mb-2"
                >
                  <p className="text-[10px] text-[#777777] font-bold tracking-widest uppercase mb-4">
                    Sleep Timer {sleepTimer !== null && `(${formatTime(sleepTimer)} left)`}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[null, 300, 900, 1800, 3600].map(s => (
                      <button
                        key={s === null ? 'off' : s}
                        onClick={() => setSleepTimer(s)}
                        className={`h-10 rounded-xl text-[12px] font-bold transition-all ${sleepTimer === s ? 'bg-[#2196F3] text-white' : 'bg-white/5 text-[#AAAAAA]'}`}
                      >
                        {s === null ? 'OFF' : formatDuration(s)}
                      </button>
                    ))}
                    <button
                        onClick={() => setSleepTimer(Math.floor(durationInSeconds - currentTime))}
                        className={`h-10 rounded-xl text-[10px] font-bold transition-all bg-white/5 text-[#AAAAAA]`}
                    >
                        END
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Access Toggle Bar */}
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-around px-8 h-12">
            <button 
              onClick={() => togglePanel('speed')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activePanel === 'speed' ? 'bg-white/10 shadow-lg' : ''}`}
            >
              {getSpeedIcon()}
            </button>
            <button 
              onClick={() => togglePanel('skip')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activePanel === 'skip' ? 'bg-white/10 shadow-lg' : ''}`}
            >
              <div className="flex flex-col items-center">
                <SkipForward className={`w-5 h-5 ${activePanel === 'skip' ? 'text-[#2196F3]' : 'text-[#AAAAAA]'}`} />
                <span className={`text-[8px] font-bold ${activePanel === 'skip' ? 'text-[#2196F3]' : 'text-[#777777]'}`}>{skipInterval}s</span>
              </div>
            </button>
            <button 
              onClick={() => togglePanel('repeat')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activePanel === 'repeat' ? 'bg-white/10 shadow-lg' : ''}`}
            >
              {repeatMode === 'off' ? <Repeat className="w-5 h-5 text-[#AAAAAA]" /> : (repeatMode === 'one' ? <Repeat1 className="w-5 h-5 text-[#2196F3]" /> : <Repeat className="w-5 h-5 text-[#2196F3]" />)}
            </button>
            <button 
              onClick={onTrim}
              className="w-12 h-12 flex items-center justify-center rounded-xl transition-all active:bg-white/10"
              title="Trim Audio"
            >
              <Scissors className="w-5 h-5 text-[#AAAAAA] hover:text-[#2196F3]" />
            </button>
            <button 
              onClick={() => togglePanel('timer')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activePanel === 'timer' ? 'bg-white/10 shadow-lg' : ''} ${sleepTimer !== null && sleepTimer > 0 ? 'animate-pulse' : ''}`}
            >
              {sleepTimer === null ? <TimerOff className="w-5 h-5 text-[#AAAAAA]" /> : <Timer className="w-5 h-5 text-[#2196F3]" />}
            </button>
          </div>

          {/* Seek Bar Area */}
          <div onClick={(e) => e.stopPropagation()} className="w-full space-y-6">
            {/* Seek Bar */}
            <div className="px-6 relative group">
              <input
                type="range"
                min="0"
                max={durationInSeconds}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-[#1E1E1E] rounded-full appearance-none cursor-pointer accent-[#2196F3] outline-none"
                style={{
                  background: `linear-gradient(to right, #2196F3 0%, #2196F3 ${progressPercentage}%, #1E1E1E ${progressPercentage}%, #1E1E1E 100%)`
                }}
              />
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-center space-x-12 px-6">
              <button 
                onClick={() => handleSkipShortcut('back')}
                className="w-14 h-14 rounded-full flex items-center justify-center text-[#AAAAAA] hover:text-[#FFFFFF] transition-colors"
                title={`Skip back ${skipInterval}s`}
              >
                <div className="relative">
                  <SkipBack className="w-8 h-8 fill-current" />
                  <span className="absolute -bottom-1 -left-1 text-[8px] font-black">{skipInterval}</span>
                </div>
              </button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePlayPause}
                disabled={isLoading}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all bg-[#2196F3] shadow-lg shadow-[#2196F3]/20 ${isLoading ? 'opacity-50 grayscale' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-white" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-white ml-2" />
                )}
              </motion.button>

              <button 
                onClick={() => handleSkipShortcut('fwd')}
                className="w-14 h-14 rounded-full flex items-center justify-center text-[#AAAAAA] hover:text-[#FFFFFF] transition-colors"
                title={`Skip forward ${skipInterval}s`}
              >
                <div className="relative">
                  <SkipForward className="w-8 h-8 fill-current" />
                  <span className="absolute -bottom-1 -right-1 text-[8px] font-black">{skipInterval}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* System Nav Placeholder */}
      <div className="h-12 w-full bg-[#09090b]" />
    </motion.div>
  );
}
