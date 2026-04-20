import { ChevronLeft, Play, Pause, Save, X, Scissors, ZoomIn, ZoomOut, Maximize2, Trash2, Repeat } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Recording } from "../App";
import { getAudioPeaks, parseDuration } from "../lib/audioUtils";

interface TrimScreenProps {
  recording: Recording;
  onCancel: () => void;
  onSave: (id: string, audioUrl: string, duration: string, overwrite: boolean, newName?: string) => void;
  key?: string | number;
}

export default function TrimScreen({ recording, onCancel, onSave }: TrimScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial fallback duration from recording object
  const initialDuration = useMemo(() => parseDuration(recording.duration), [recording.duration]);
  
  const [duration, setDuration] = useState(initialDuration);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(initialDuration || 5); // Default to 5s if unknown
  const [playhead, setPlayhead] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0); // 0 to 1
  const [isLooping, setIsLooping] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newName, setNewName] = useState(`${recording.name} (trimmed)`);
  const [peaks, setPeaks] = useState<number[]>([]);
  
  // Advanced Processing States
  const [useFadeIn, setUseFadeIn] = useState(false);
  const [useFadeOut, setUseFadeOut] = useState(false);
  const [useNormalize, setUseNormalize] = useState(false);

  // Undo/Redo History
  const [history, setHistory] = useState<{start: number, end: number}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Constants
  const MIN_SELECTION = 0.5;
  const SNAP_STEP = 0.1;

  // Push to history
  const pushHistory = (s: number, e: number) => {
    setHistory(prev => {
        const next = prev.slice(0, historyIndex + 1);
        next.push({ start: s, end: e });
        if (next.length > 50) next.shift();
        return next;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setStartTime(prev.start);
      setEndTime(prev.end);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setStartTime(next.start);
      setEndTime(next.end);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Handle metadata loaded on the actual audio element
  const handleOnLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setDuration(dur);
        if (endTime === initialDuration || endTime === 0) {
            setEndTime(dur);
        }
        pushHistory(startTime, dur);
      }
      setIsLoading(false);
    }
  };

  // Generate real peaks
  useEffect(() => {
    if (recording.audioUrl) {
        getAudioPeaks(recording.audioUrl, 100).then(p => setPeaks(p));
    }
  }, [recording.audioUrl]);

  // Safety timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("Audio loading timed out, forcing UI unlock");
        setIsLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Audio Playback Logic
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.currentTime < startTime || audioRef.current.currentTime >= endTime) {
        if (Number.isFinite(startTime)) {
          audioRef.current.currentTime = startTime;
        }
      }
      audioRef.current.play().catch(error => {
        if (error.name !== 'AbortError') {
          console.error("Audio play failed:", error);
        }
      });
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlayhead(audio.currentTime);
      if (audio.currentTime >= endTime) {
        if (isLooping) {
          audio.currentTime = startTime;
        } else {
          audio.pause();
          setIsPlaying(false);
          if (Number.isFinite(startTime)) {
            audio.currentTime = startTime;
          }
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime, isLooping]);

  const formatTime = (seconds: number, includeMs = true) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (!includeMs) return `${mins}:${secs.toString().padStart(2, '0')}`;
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Helper to round to nearest snap point
  const snap = (val: number) => Math.round(val / SNAP_STEP) * SNAP_STEP;

  const handleHandleDrag = (type: 'start' | 'end', deltaX: number) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const visibleWidth = rect.width;
    const totalWidth = visibleWidth * zoom;
    
    // Calculate how much time the deltaX represents
    const deltaTime = (deltaX / totalWidth) * duration;
    
    if (type === 'start') {
      const newStart = snap(Math.max(0, Math.min(endTime - MIN_SELECTION, startTime + deltaTime)));
      if (newStart !== startTime) {
        setStartTime(newStart);
        if (navigator.vibrate && Math.floor(newStart) !== Math.floor(startTime)) {
            navigator.vibrate(5);
        }
      }
    } else {
      const newEnd = snap(Math.max(startTime + MIN_SELECTION, Math.min(duration, endTime + deltaTime)));
      if (newEnd !== endTime) {
        setEndTime(newEnd);
        if (navigator.vibrate && Math.floor(newEnd) !== Math.floor(endTime)) {
            navigator.vibrate(5);
        }
      }
    }
  };

  const handleHandleDragEnd = () => {
    pushHistory(startTime, endTime);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollWidth - target.clientWidth;
    if (maxScroll > 0) {
      setScrollLeft(target.scrollLeft / maxScroll);
    }
  };

  const nudge = (type: 'start' | 'end', direction: 1 | -1) => {
    const step = 0.05 * direction;
    let ns = startTime;
    let ne = endTime;
    if (type === 'start') {
      ns = snap(Math.max(0, Math.min(endTime - MIN_SELECTION, startTime + step)));
      setStartTime(ns);
    } else {
      ne = snap(Math.max(startTime + MIN_SELECTION, Math.min(duration, endTime + step)));
      setEndTime(ne);
    }
    pushHistory(ns, ne);
  };

  // WAV Encoder (Simple)
  const encodeWAV = (audioBuffer: AudioBuffer) => {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample, offset = 0, pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for(i = 0; i < numOfChan; i++)
      channels.push(audioBuffer.getChannelData(i));

    while(pos < audioBuffer.length) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0; // scale to 16-bit signed int
        view.setInt16(offset, sample, true);          // write 16-bit sample
        offset += 2;
      }
      pos++;
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data: any) {
      view.setUint16(offset, data, true);
      offset += 2;
    }
    function setUint32(data: any) {
      view.setUint32(offset, data, true);
      offset += 4;
    }
  };

  const performTrim = async (overwrite: boolean) => {
    if (!recording.audioUrl) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch(recording.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      const startSample = Math.floor(startTime * decodedBuffer.sampleRate);
      const endSample = Math.floor(endTime * decodedBuffer.sampleRate);
      const frameCount = endSample - startSample;
      
      const trimmedBuffer = audioCtx.createBuffer(
        decodedBuffer.numberOfChannels,
        frameCount,
        decodedBuffer.sampleRate
      );
      
      for (let i = 0; i < decodedBuffer.numberOfChannels; i++) {
        const channelData = decodedBuffer.getChannelData(i).slice(startSample, endSample);
        
        // Apply Fades if requested
        if (useFadeIn) {
            const fadeSamples = Math.floor(0.1 * decodedBuffer.sampleRate); // 100ms fade
            for (let s = 0; s < Math.min(fadeSamples, channelData.length); s++) {
                channelData[s] *= (s / fadeSamples);
            }
        }
        if (useFadeOut) {
            const fadeSamples = Math.floor(0.1 * decodedBuffer.sampleRate);
            const startFade = channelData.length - fadeSamples;
            for (let s = Math.max(0, startFade); s < channelData.length; s++) {
                channelData[s] *= (1 - (s - startFade) / fadeSamples);
            }
        }
        
        trimmedBuffer.copyToChannel(channelData, i);
      }

      // Normalization
      if (useNormalize) {
          let maxVal = 0;
          for (let i = 0; i < trimmedBuffer.numberOfChannels; i++) {
              const data = trimmedBuffer.getChannelData(i);
              for (let s = 0; s < data.length; s++) {
                  if (Math.abs(data[s]) > maxVal) maxVal = Math.abs(data[s]);
              }
          }
          if (maxVal > 0) {
              const multiplier = 0.95 / maxVal;
              for (let i = 0; i < trimmedBuffer.numberOfChannels; i++) {
                  const data = trimmedBuffer.getChannelData(i);
                  for (let s = 0; s < data.length; s++) {
                      data[s] *= multiplier;
                  }
              }
          }
      }
      
      const wavBlob = encodeWAV(trimmedBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);
      const durationStr = `${Math.floor(frameCount / decodedBuffer.sampleRate / 60)}:${Math.floor((frameCount / decodedBuffer.sampleRate) % 60).toString().padStart(2, '0')}`;
      
      onSave(recording.id, audioUrl, durationStr, overwrite, overwrite ? undefined : newName);
    } catch (error) {
      console.error("Trim failed:", error);
    } finally {
      setIsProcessing(false);
      setShowSaveDialog(false);
    }
  };

  const selectionPercentage = ((endTime - startTime) / duration) * 100;
  const startPercentage = (startTime / duration) * 100;
  const playheadPercentage = (playhead / duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-white overflow-hidden"
    >
      <audio 
        ref={audioRef} 
        src={recording.audioUrl} 
        onLoadedMetadata={handleOnLoadedMetadata}
        preload="auto"
        hidden 
      />
      
      {/* Top Bar */}
      <header className="h-[56px] px-4 flex items-center justify-between border-b border-white/5 bg-[#09090b] z-10">
        <div className="flex items-center space-x-2">
            <button onClick={onCancel} className="h-10 px-4 flex items-center space-x-2 rounded-xl active:bg-white/5 text-[#AAAAAA]">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium text-[14px]">Cancel</span>
            </button>
            <div className="flex items-center space-x-1 ml-2">
                <button 
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-white/5 disabled:opacity-20"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-white/5 disabled:opacity-20"
                >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
            </div>
        </div>
        <div className="flex flex-col items-center">
            <h1 className="text-[16px] font-bold">Trim Audio</h1>
            <span className="text-[10px] text-[#2196F3] font-mono tracking-widest uppercase">Specialist Editor</span>
        </div>
        <button 
          onClick={() => setShowSaveDialog(true)}
          className="h-10 px-6 bg-[#2196F3] text-white rounded-xl font-bold text-[14px] active:scale-95 transition-transform"
        >
          Save
        </button>
      </header>

      {/* Main Trim Interface */}
      <main className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden bg-[#09090b]">
        
        {/* Selection Info Bar */}
        <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
                <p className="text-[10px] text-[#777777] font-bold uppercase tracking-widest">Selection</p>
                <div className="flex items-center space-x-2">
                    <span className="text-[14px] font-mono text-[#AAAAAA]">{formatTime(startTime, false)}</span>
                    <span className="text-[#333333]">→</span>
                    <span className="text-[14px] font-mono text-[#AAAAAA]">{formatTime(endTime, false)}</span>
                </div>
            </div>
            <div className="text-right space-y-1">
                <p className="text-[10px] text-[#2196F3] font-bold uppercase tracking-widest">New Duration</p>
                <p className="text-[18px] font-mono text-[#2196F3]">{formatTime(endTime - startTime).split('.')[0]}</p>
            </div>
        </div>

        {/* Mini-map Overview */}
        <div className="h-4 bg-white/5 rounded-full relative overflow-hidden group cursor-pointer border border-white/5">
            <div className="absolute inset-0 flex items-center justify-around px-2 opacity-20 group-hover:opacity-40 transition-opacity">
                {[...Array(40)].map((_, i) => (
                    <div key={i} className="w-0.5 bg-white h-2 rounded-full" />
                ))}
            </div>
            {/* Viewport Indicator */}
            <div 
                className="absolute top-0 bottom-0 bg-white/10 border-x border-white/20"
                style={{ 
                    left: `${scrollLeft * (100 - (100 / zoom))}%`, 
                    width: `${100 / zoom}%` 
                }}
            />
            {/* Selection Highlight in Mini-map */}
            <div 
                className="absolute top-1.5 bottom-1.5 bg-[#2196F3]/40 rounded-full"
                style={{ left: `${startPercentage}%`, width: `${selectionPercentage}%` }}
            />
        </div>

        {/* Waveform Area (Zoomable & Scrollable) */}
        <div className="flex-1 flex flex-col min-h-0">
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="relative h-full bg-[#1E1E1E]/20 rounded-[32px] border border-white/5 overflow-x-auto overflow-y-hidden no-scrollbar"
            >
                <div 
                    className="relative h-full flex items-center"
                    style={{ width: `${zoom * 100}%` }}
                >
                    {/* Visual peaks */}
                    <div className="absolute inset-0 flex items-center justify-around px-8 opacity-20 pointer-events-none">
                        {(peaks.length > 0 ? peaks : [...Array(Math.floor(80 * zoom))]).map((p, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-white rounded-full transition-all duration-500" 
                                style={{ height: `${20 + (typeof p === 'number' ? p : 0.3) * 60}%` }}
                            />
                        ))}
                    </div>

                    {/* Masking for excluded regions */}
                    <div 
                        className="absolute inset-0 bg-black/40 pointer-events-none z-0"
                        style={{
                            clipPath: `polygon(
                                0% 0%, 
                                ${startPercentage}% 0%, 
                                ${startPercentage}% 100%, 
                                0% 100%,
                                100% 100%,
                                100% 0%,
                                ${startPercentage + selectionPercentage}% 0%,
                                ${startPercentage + selectionPercentage}% 100%,
                                100% 100%
                            )`
                        }}
                    />

                    {/* Selected Highlight Overlay */}
                    <div 
                        className="absolute top-0 bottom-0 bg-[#2196F3]/10 border-x border-[#2196F3]/30 z-0"
                        style={{ left: `${startPercentage}%`, width: `${selectionPercentage}%` }}
                    />

                    {/* Grid Lines (Hardware look) */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 flex">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="flex-1 h-full border-r border-white" />
                        ))}
                    </div>

                    {/* Playhead */}
                    <motion.div 
                        className="absolute top-0 bottom-0 w-[2px] bg-white z-30 shadow-[0_0_10px_white]"
                        style={{ left: `${playheadPercentage}%` }}
                    />

                    {/* Draggable START Handle */}
                    <motion.div
                        onPan={(e, info) => handleHandleDrag('start', info.delta.x)}
                        onPanEnd={handleHandleDragEnd}
                        style={{ left: `${startPercentage}%` }}
                        className="absolute top-0 bottom-0 w-12 -ml-6 flex flex-col items-center justify-center z-40 group cursor-ew-resize touch-none"
                    >
                        <div className="w-1 h-full bg-[#2196F3]" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2196F3] border-2 border-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-1 h-3 bg-white/40 rounded-full" />
                        </div>
                        <div className="absolute top-4 bg-[#1E1E1E] px-2 py-1 rounded text-[10px] font-mono border border-white/10 hidden group-hover:block whitespace-nowrap shadow-xl">
                            {formatTime(startTime)}
                        </div>
                        {/* Nudge Buttons */}
                        <div className="absolute -bottom-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => nudge('start', -1)} className="w-8 h-8 rounded-lg bg-[#2196F3] border border-white/20 flex items-center justify-center text-[14px] active:bg-white/20 shadow-lg">-</button>
                            <button onClick={() => nudge('start', 1)} className="w-8 h-8 rounded-lg bg-[#2196F3] border border-white/20 flex items-center justify-center text-[14px] active:bg-white/20 shadow-lg">+</button>
                        </div>
                    </motion.div>

                    {/* Draggable END Handle */}
                    <motion.div
                        onPan={(e, info) => handleHandleDrag('end', info.delta.x)}
                        onPanEnd={handleHandleDragEnd}
                        style={{ left: `${startPercentage + selectionPercentage}%` }}
                        className="absolute top-0 bottom-0 w-12 -ml-6 flex flex-col items-center justify-center z-40 group cursor-ew-resize touch-none"
                    >
                        <div className="w-1 h-full bg-[#2196F3]" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2196F3] border-2 border-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-1 h-3 bg-white/40 rounded-full" />
                        </div>
                        <div className="absolute top-4 bg-[#1E1E1E] px-2 py-1 rounded text-[10px] font-mono border border-white/10 hidden group-hover:block whitespace-nowrap shadow-xl">
                            {formatTime(endTime)}
                        </div>
                        {/* Nudge Buttons */}
                        <div className="absolute -bottom-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => nudge('end', -1)} className="w-8 h-8 rounded-lg bg-[#2196F3] border border-white/20 flex items-center justify-center text-[14px] active:bg-white/20 shadow-lg">-</button>
                            <button onClick={() => nudge('end', 1)} className="w-8 h-8 rounded-lg bg-[#2196F3] border border-white/20 flex items-center justify-center text-[14px] active:bg-white/20 shadow-lg">+</button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-around">
                {/* Loop Toggle */}
                <button 
                    onClick={() => setIsLooping(!isLooping)}
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${isLooping ? 'bg-[#2196F3] text-white shadow-[0_0_15px_rgba(33,150,243,0.4)]' : 'bg-white/5 text-[#AAAAAA]'}`}
                >
                    <Repeat className="w-5 h-5 mb-0.5" />
                    <span className="text-[8px] font-bold">LOOP</span>
                </button>

                {/* Main Action Group */}
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                        disabled={zoom === 1}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:bg-white/10 disabled:opacity-20 transition-opacity"
                    >
                        <ZoomOut className="w-5 h-5 text-[#AAAAAA]" />
                    </button>
                    
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePlayPause}
                        disabled={isLoading}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] active:shadow-none transition-shadow disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-10 h-10 text-black fill-black" />
                        ) : (
                            <Play className="w-10 h-10 text-black fill-black ml-1.5" />
                        )}
                    </motion.button>

                    <button 
                        onClick={() => setZoom(Math.min(5, zoom + 0.5))}
                        disabled={zoom === 5}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:bg-white/10 disabled:opacity-20 transition-opacity"
                    >
                        <ZoomIn className="w-5 h-5 text-[#AAAAAA]" />
                    </button>
                </div>

                {/* Volume Slider Mock-up for UI completeness */}
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center text-[#AAAAAA]">
                    <div className="h-6 w-1 rounded-full bg-[#AAAAAA]/30 relative overflow-hidden mb-1">
                        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-[#2196F3]" />
                    </div>
                    <span className="text-[8px] font-bold uppercase">VOL</span>
                </div>
            </div>
            
            {/* Zoom Indicator */}
            <div className="flex justify-center">
                <span className="text-[10px] font-mono text-[#777777] tracking-widest uppercase bg-white/5 px-3 py-1 rounded-full">Zoom: {zoom.toFixed(1)}x</span>
            </div>
        </div>

      </main>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setShowSaveDialog(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] rounded-t-[40px] p-8 pb-12 z-[70] shadow-2xl border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <h2 className="text-[24px] font-bold mb-6">Trimming Options</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-[#777777] uppercase tracking-widest px-1">Save as New Recording</label>
                    <div className="flex space-x-3">
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter name..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#2196F3] outline-none"
                        />
                        <button 
                            disabled={isProcessing}
                            onClick={() => performTrim(false)}
                            className="px-8 bg-[#2196F3] rounded-2xl font-bold disabled:opacity-50"
                        >
                            {isProcessing ? "..." : "Save"}
                        </button>
                    </div>
                </div>

                {/* Advanced Options */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setUseFadeIn(!useFadeIn)}
                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-colors ${useFadeIn ? 'bg-[#2196F3]/10 border-[#2196F3] text-[#2196F3]' : 'bg-white/5 border-white/10 text-[#777777]'}`}
                    >
                        Fade In
                    </button>
                    <button 
                        onClick={() => setUseFadeOut(!useFadeOut)}
                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-colors ${useFadeOut ? 'bg-[#2196F3]/10 border-[#2196F3] text-[#2196F3]' : 'bg-white/5 border-white/10 text-[#777777]'}`}
                    >
                        Fade Out
                    </button>
                    <button 
                        onClick={() => setUseNormalize(!useNormalize)}
                        className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-colors ${useNormalize ? 'bg-[#2196F3]/10 border-[#2196F3] text-[#2196F3]' : 'bg-white/5 border-white/10 text-[#777777]'}`}
                    >
                        Normalize
                    </button>
                </div>

                <div className="h-px bg-white/5 my-2" />

                <button 
                    disabled={isProcessing}
                    onClick={() => performTrim(true)}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 active:bg-white/10 transition-colors"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold">Overwrite Original</p>
                            <p className="text-[12px] text-[#777777]">Permanent change to existing file</p>
                        </div>
                    </div>
                    <Scissors className="w-5 h-5 text-[#AAAAAA]" />
                </button>
              </div>

              {isProcessing && (
                <div className="absolute inset-0 bg-[#1E1E1E]/80 backdrop-blur-sm rounded-t-[40px] flex flex-col items-center justify-center space-y-6">
                    <div className="w-12 h-12 border-4 border-[#2196F3]/30 border-t-[#2196F3] rounded-full animate-spin" />
                    <p className="text-[18px] font-bold">Processing Audio...</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
