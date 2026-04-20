import { Settings, Mic, Play, MoreVertical, Square, Pause, Trash2, Share2, Check, X, ChevronLeft, Edit2, Info, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef, MouseEvent } from "react";
import { Recording } from "../App";
import { AudioEngine } from "../services/audioEngine";
import { EQConfig, CompressorConfig } from "../types/effects";

interface HomeScreenProps {
  recordings: Recording[];
  isLoading: boolean;
  onStop: (finalDuration: number, audioUrl: string) => void;
  onSelect: (recording: Recording) => void;
  onDelete: (ids: string[]) => void;
  onRename: (id: string, newName: string) => void;
  onOpenSettings: () => void;
  key?: string | number;
}

export default function HomeScreen({ recordings, isLoading, onStop, onSelect, onDelete, onRename, onOpenSettings }: HomeScreenProps) {
  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);

  // Selection & Management States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string[] | null>(null);
  const [renameData, setRenameData] = useState<{ id: string, name: string } | null>(null);
  const [showProperties, setShowProperties] = useState<Recording | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Initialize and update AudioEngine
  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.close();
      }
    };
  }, []);

  // Timer Effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const showToast = (message: string, type: 'error' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMicTap = async () => {
    if (permissionStatus === 'denied') {
      showToast("Cannot record without microphone permission");
      return;
    }

    try {
      // 3. PERMISSION CHECK
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');

      // 4. SETUP AUDIO ENGINE FOR REAL-TIME EFFECTS
      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
      }
      const processedStream = await audioEngineRef.current.setupRecording(stream);

      // Apply some default "Voice Enhance" and "Compressor" settings for recording
      audioEngineRef.current.applyEffectChain([
        { 
          id: 'comp', type: 'compressor', enabled: true, name: 'Auto Leveler',
          threshold: -18, ratio: 2.5, attack: 0.003, release: 0.25, knee: 40 
        } as CompressorConfig,
        {
          id: 'eq', type: 'eq', enabled: true, name: 'Vocal Clarity',
          bands: [
            { type: 'highpass', frequency: 80, gain: 0, q: 0.7 },
            { type: 'peaking', frequency: 2800, gain: 2, q: 1.0 }
          ]
        } as EQConfig
      ]);
      
      // 5. INITIALIZE RECORDER WITH PROCESSED STREAM
      // Use webm/opus as it's the most reliable for MediaRecorder in browsers
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(processedStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Use current duration from ref to avoid closure issues
        const finalDuration = durationRef.current;

        // Clean up stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        onStop(finalDuration, audioUrl);
      };

      // 6. VISUAL TRANSITION & START
      setDuration(0);
      durationRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
      
      // Start recording with 1s timeslice to ensure dataavailable fires regularly
      mediaRecorder.start(1000);

    } catch (err) {
      console.error("Mic access error:", err);
      setPermissionStatus('denied');
      showToast("Cannot record without microphone permission");
    }
  };

  const handleStopTap = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePauseToggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
    } else {
      mediaRecorderRef.current.pause();
    }
    
    setIsPaused(!isPaused);
  };

  // Selection Logic
  const enterSelectionMode = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds([id]);
    // Haptic feedback simulation
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      if (next.length === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteItems = () => {
    if (showDeleteConfirm) {
      onDelete(showDeleteConfirm);
      setShowDeleteConfirm(null);
      if (isSelectionMode) exitSelectionMode();
      showToast(`${showDeleteConfirm.length} recordings deleted`, 'info');
    }
  };

  const handleRenameSave = () => {
    if (!renameData || !renameData.name.trim()) return;
    onRename(renameData.id, renameData.name);
    setRenameData(null);
    showToast("Renamed successfully", 'info');
  };

  // Long Press Handlers
  const startLongPress = (id: string) => {
    if (isSelectionMode) return;
    longPressTimerRef.current = setTimeout(() => {
      enterSelectionMode(id);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#2196F3]/30 overflow-hidden">
      {/* 1. Status Bar (Simulated space) */}
      <div className="h-6 w-full flex items-center justify-end px-4">
        <div className="flex items-center space-x-1 opacity-60">
          <div className="w-3 h-3 border border-current rounded-sm"></div>
          <div className="w-4 h-2 bg-current rounded-sm"></div>
        </div>
      </div>

      {/* 2. Top Bar (56dp height) */}
      <header className="h-[56px] px-4 flex items-center justify-between bg-[#09090b] relative z-20">
        <AnimatePresence mode="wait">
          {isSelectionMode ? (
            <motion.div 
              key="selection-bar"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute inset-0 bg-[#09090b] px-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <button onClick={exitSelectionMode} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-[18px] font-medium">{selectedIds.length} selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowDeleteConfirm(selectedIds)}
                  className="w-12 h-12 flex items-center justify-center rounded-full active:bg-red-500/10 text-red-500"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 text-[#AAAAAA]">
                  <Share2 className="w-6 h-6" />
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 text-[#AAAAAA]">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="normal-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                {isRecording && (
                  <motion.div 
                    animate={isPaused ? { opacity: 0.6 } : { opacity: [1, 0, 1] }}
                    transition={isPaused ? {} : { duration: 1.5, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${isPaused ? 'bg-[#FF9800]' : 'bg-[#F44336]'}`}
                  />
                )}
                <h1 className="text-[20px] font-medium leading-none">Voice Recorder</h1>
                {isRecording && isPaused && (
                  <span className="text-[12px] font-medium text-[#FF9800] animate-pulse">Paused</span>
                )}
              </div>
              <button 
                disabled={isRecording}
                onClick={onOpenSettings}
                className={`w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 transition-all ${isRecording ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
              >
                <Settings className="w-6 h-6 text-[#AAAAAA]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. Center Control Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="flex flex-col items-center">
          {/* Live Timer during recording */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                <span 
                  className={`text-[32px] font-mono font-medium tracking-tight transition-colors duration-300 ${
                    isPaused ? 'text-[#FF9800]' : 'text-white'
                  }`}
                >
                  {formatTime(duration)}
                </span>
                
                {/* Real-time Effects Status Bar */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 flex items-center justify-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-[#2196F3]"
                >
                   <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>DSP Active</span>
                   </div>
                   <div className="w-1 h-3 bg-white/10 rounded-full" />
                   <div className="flex items-center space-x-1 text-[#777777]">
                      <Mic className="w-3 h-3" />
                      <span>Noise Killer</span>
                   </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex flex-col items-center">
            {/* Pulse animation element */}
            {isRecording && !isPaused && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#F44336] rounded-full"
              />
            )}
            
            <motion.button
              onClick={isRecording ? handleStopTap : handleMicTap}
              whileTap={{ scale: 0.85 }}
              animate={isRecording && !isPaused ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={isRecording && !isPaused ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.1 }}
              className={`w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-lg shadow-black/40 border-4 border-white/5 transition-colors duration-300 relative z-10 ${
                isRecording ? (isPaused ? 'bg-[#FF9800]' : 'bg-[#F44336]') : 'bg-[#2196F3]'
              }`}
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Square className="w-[48px] h-[48px] text-white fill-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Mic className="w-[48px] h-[48px] text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Dedicated Pause/Resume Button (Part 4 integration) */}
            {isRecording && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handlePauseToggle}
                className="absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 transition-colors"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <motion.div key="resume" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }}>
                    <Play className="w-6 h-6 text-[#FF9800] fill-[#FF9800]" />
                  </motion.div>
                ) : (
                  <Pause className="w-6 h-6 text-[#AAAAAA]" />
                )}
              </motion.button>
            )}
          </div>
          
          <motion.p 
            animate={{ color: isRecording ? (isPaused ? '#FF9800' : '#F44336') : '#AAAAAA' }}
            className="mt-6 text-[14px] font-medium transition-colors duration-300"
          >
            {isRecording ? (isPaused ? 'Paused • Tap to resume' : 'Recording...') : 'Tap to start recording'}
          </motion.p>
        </div>
      </main>

      {/* 4. Recordings List Area */}
      <section className="flex-[1.2] flex flex-col min-h-0 bg-[#09090b]">
        <div className="px-4 py-2">
          <h2 className="text-[18px] font-medium text-[#FFFFFF]">Your Recordings</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 no-scrollbar">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-[#1E1E1E] rounded-[12px] animate-pulse" />
            ))
          ) : (
            <>
              {/* 8. Active Recording Item */}
              <AnimatePresence overflow-hidden>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 72, marginBottom: 8 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`h-[72px] border rounded-[12px] flex items-center px-4 space-x-4 shadow-sm transition-all duration-300 ${
                      isPaused ? 'border-[#FF9800]/30 bg-[#FF9800]/5' : 'border-[#F44336]/30 bg-[#1E1E1E]'
                    }`}
                  >
                    {/* List Item Icon (Pause/Play) */}
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 ${
                      isPaused ? 'bg-[#FF9800]/10' : 'bg-[#F44336]/10'
                    }`}>
                      {isPaused ? (
                        <Pause className="w-5 h-5 text-[#FF9800] fill-[#FF9800]" />
                      ) : (
                        <motion.div
                          animate={{ scale: [1, 0.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 bg-[#F44336] rounded-full"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[16px] font-medium leading-tight truncate transition-colors duration-300 ${
                        isPaused ? 'text-[#FF9800]' : 'text-[#F44336]'
                      }`}>
                        {isPaused ? 'Recording' : 'Recording...'}
                      </h3>
                      <p className="text-[14px] text-[#AAAAAA] truncate">
                        {formatTime(duration)} • Just now{isPaused ? ' (Paused)' : ''}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {recordings.length > 0 ? (
                recordings.map((rec) => {
                  const isSelected = selectedIds.includes(rec.id);
                  return (
                    <motion.div
                      key={rec.id}
                      onPointerDown={() => startLongPress(rec.id)}
                      onPointerUp={cancelLongPress}
                      onPointerLeave={cancelLongPress}
                      whileTap={{ scale: isSelectionMode ? 1 : 0.98 }}
                      onClick={() => isSelectionMode ? toggleSelection(rec.id) : onSelect(rec)}
                      className={`h-[72px] rounded-[12px] flex items-center px-4 space-x-4 active:bg-white/10 transition-all cursor-pointer border shadow-sm group relative overflow-visible ${
                        isSelected ? 'bg-[#2196F3]/10 border-[#2196F3]/30' : 'bg-[#1E1E1E] border-white/5'
                      }`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-full">
                        {isSelectionMode ? (
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#2196F3] border-[#2196F3]' : 'border-[#AAAAAA]'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                          </div>
                        ) : (
                          <Play className="w-6 h-6 text-[#2196F3] fill-[#2196F3]/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-[16px] font-medium leading-tight truncate ${isSelected ? 'text-[#2196F3]' : ''}`}>{rec.name}</h3>
                        <p className="text-[14px] text-[#AAAAAA] truncate">{rec.duration} • {rec.date}</p>
                      </div>
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenuId(activeMenuId === rec.id ? null : rec.id);
                          }}
                          className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/5"
                        >
                          <MoreVertical className="w-6 h-6 text-[#AAAAAA]" />
                        </button>

                        {/* Individual Context Menu */}
                        <AnimatePresence>
                          {activeMenuId === rec.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-12 w-48 bg-[#2A2A2A] rounded-xl shadow-2xl border border-white/10 py-2 z-[30]"
                            >
                              <button 
                                onClick={() => { onSelect(rec); setActiveMenuId(null); }}
                                className="w-full h-12 px-4 flex items-center space-x-3 active:bg-white/5"
                              >
                                <Play className="w-4 h-4 text-[#2196F3]" /> <span>Play</span>
                              </button>
                              <button 
                                onClick={() => { setRenameData({ id: rec.id, name: rec.name }); setActiveMenuId(null); }}
                                className="w-full h-12 px-4 flex items-center space-x-3 active:bg-white/5"
                              >
                                <Edit2 className="w-4 h-4 text-[#AAAAAA]" /> <span>Rename</span>
                              </button>
                              <button 
                                onClick={() => { setShowProperties(rec); setActiveMenuId(null); }}
                                className="w-full h-12 px-4 flex items-center space-x-3 active:bg-white/5"
                              >
                                <Info className="w-4 h-4 text-[#AAAAAA]" /> <span>Properties</span>
                              </button>
                              <div className="h-[1px] bg-white/5 my-1" />
                              <button 
                                onClick={() => { setShowDeleteConfirm([rec.id]); setActiveMenuId(null); }}
                                className="w-full h-12 px-4 flex items-center space-x-3 active:bg-red-500/10 text-red-500"
                              >
                                <Trash2 className="w-4 h-4" /> <span>Delete</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              ) : !isRecording && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
                    <Mic className="w-8 h-8 text-[#777777] opacity-50" />
                  </div>
                  <h3 className="text-[18px] font-medium text-[#AAAAAA] mb-1">No recordings yet</h3>
                  <p className="text-[14px] text-[#777777]">Your recordings will appear here</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 5. Toast Message Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#333333] text-white text-sm rounded-full shadow-2xl z-50 pointer-events-none text-center min-w-[200px]"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <div className="h-12 w-full bg-[#09090b] border-t border-white/5" />

      {/* 8. Rename Dialog */}
      <AnimatePresence>
        {renameData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRenameData(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1E1E1E] w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl border border-white/10"
            >
              <h2 className="text-[20px] font-bold mb-6">Rename recording</h2>
              <div className="relative mb-8">
                <input
                  autoFocus
                  type="text"
                  value={renameData.name}
                  onChange={(e) => setRenameData({ ...renameData, name: e.target.value })}
                  className="w-full bg-[#2A2A2A] border border-white/10 rounded-2xl p-4 focus:border-[#2196F3] outline-none transition-colors"
                />
                <button onClick={() => setRenameData({ ...renameData, name: "" })} className="absolute right-4 top-1/2 -translate-y-1/2">
                   <X className="w-5 h-5 text-[#777777]" />
                </button>
              </div>
              <div className="flex flex-col space-y-3">
                <button onClick={handleRenameSave} className="w-full h-12 bg-[#2196F3] rounded-xl font-bold">SAVE</button>
                <button onClick={() => setRenameData(null)} className="w-full h-12 bg-white/5 rounded-xl font-bold">CANCEL</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1E1E1E] w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl border border-white/10"
            >
              <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-[20px] font-bold mb-2">Delete {showDeleteConfirm.length} recordings?</h2>
              <p className="text-[#AAAAAA] text-[14px] leading-relaxed mb-8">This action cannot be undone. Files will be permanently removed.</p>
              <div className="flex flex-col space-y-3">
                <button onClick={handleDeleteItems} className="w-full h-12 bg-red-500 rounded-xl font-bold">DELETE</button>
                <button onClick={() => setShowDeleteConfirm(null)} className="w-full h-12 bg-white/5 rounded-xl font-bold">CANCEL</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Properties Bottom Sheet */}
      <AnimatePresence>
        {showProperties && (
          <div className="fixed inset-0 z-50 flex items-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProperties(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#1E1E1E] w-full rounded-t-[32px] p-8 pb-12 relative z-10 shadow-2xl border-t border-white/10 max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-[#333] rounded-full mx-auto mb-8" />
              <h2 className="text-[20px] font-bold mb-6">Recording Properties</h2>
              
              <div className="space-y-6">
                {[
                  { label: "Name", value: showProperties.name },
                  { label: "Duration", value: showProperties.duration },
                  { label: "Date", value: showProperties.date },
                  { label: "Format", value: "AAC (44.1kHz)" },
                  { label: "Size", value: "4.2 MB" },
                  { label: "Path", value: `/VoiceRecordings/${showProperties.name}.m4a` }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] text-[#777777] font-bold tracking-widest uppercase">{item.label}</p>
                    <p className="text-[15px] font-medium text-white break-all">{item.value}</p>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowProperties(null)}
                className="w-full h-14 bg-white/5 rounded-2xl font-bold mt-10 active:bg-white/10 transition-colors"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
