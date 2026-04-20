
import { ChevronLeft, Wand2, Play, Pause, RotateCcw, Save, Trash2, Sliders, Zap, Mic2, Music2, Wind, Sparkles, Check, Activity, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { Recording } from "../App";
import { EffectConfig, EffectType, NoiseReductionConfig, VoiceEnhanceConfig, CompressorConfig } from "../types/effects";
import SpectrumAnalyzer from "./SpectrumAnalyzer";

interface AudioEnhanceScreenProps {
  recording: Recording;
  onBack: () => void;
  onSave: (id: string, enhancedUrl: string) => void;
  key?: string | number;
}

export default function AudioEnhanceScreen({ recording, onBack, onSave }: AudioEnhanceScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(true);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [saveProgress, setSaveProgress] = useState<number | null>(null);
  
  const [effects, setEffects] = useState<EffectConfig[]>([
    { id: '1', type: 'noise-reduction', enabled: true, name: 'AI Noise Removal', mode: 'advanced', strength: 25 },
    { id: '2', type: 'voice-enhance', enabled: true, name: 'Natural Focus', clarity: 30, presence: 20, proximity: 10 },
    { id: '3', type: 'compressor', enabled: false, name: 'Dynamic Leveler', threshold: -16, ratio: 2.2, attack: 0.1, release: 0.2, knee: 40 }
  ]);

  const [spectrumData, setSpectrumData] = useState(new Uint8Array(64));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        const newData = new Uint8Array(64).map(() => Math.random() * 255);
        setSpectrumData(newData);
        setCurrentTime(prev => (prev + 0.1) % 100); // Simulated time
      }, 50);
    } else {
      setSpectrumData(new Uint8Array(64));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const presets = [
    { 
      id: 'natural', 
      name: 'Pro Natural', 
      icon: Activity, 
      color: 'text-orange-400',
      config: [
        { type: 'noise-reduction', enabled: true, strength: 15 },
        { type: 'voice-enhance', enabled: true, clarity: 20, presence: 10 },
        { type: 'compressor', enabled: false }
      ]
    },
    { 
      id: 'podcast', 
      name: 'Podcast', 
      icon: Mic2, 
      color: 'text-blue-400',
      config: [
        { type: 'noise-reduction', enabled: true, strength: 40 },
        { type: 'voice-enhance', enabled: true, clarity: 50, presence: 30 },
        { type: 'compressor', enabled: true, threshold: -20, ratio: 4 }
      ]
    },
    { 
      id: 'music', 
      name: 'Music Hi-Fi', 
      icon: Music2, 
      color: 'text-purple-400',
      config: [
        { type: 'noise-reduction', enabled: false },
        { type: 'voice-enhance', enabled: true, clarity: 40, presence: 50 },
        { type: 'compressor', enabled: true, threshold: -14, ratio: 2 }
      ]
    },
    { 
      id: 'outdoor', 
      name: 'Wind Killer', 
      icon: Wind, 
      color: 'text-emerald-400',
      config: [
        { type: 'noise-reduction', enabled: true, strength: 80 },
        { type: 'voice-enhance', enabled: true, clarity: 60, presence: 20 },
        { type: 'compressor', enabled: true, threshold: -24, ratio: 6 }
      ]
    },
  ];

  const [selectedPreset, setSelectedPreset] = useState('natural');

  const handleApplyPreset = (preset: any) => {
    setSelectedPreset(preset.id);
    setIsProcessing(true);
    
    // Artificial delay to simulate AI processing
    setTimeout(() => {
      const newEffects = effects.map(eff => {
        const presetPart = preset.config.find((c: any) => c.type === eff.type);
        if (presetPart) {
          return { ...eff, ...presetPart };
        }
        return eff;
      }) as EffectConfig[];
      
      setEffects(newEffects);
      setIsProcessing(false);
    }, 600);
  };

  const handleSaveProcessing = () => {
    setSaveProgress(0);
    const interval = setInterval(() => {
      setSaveProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onSave(recording.id, recording.audioUrl);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleTogglePlay = () => setIsPlaying(!isPlaying);

  const updateEffect = (id: string, updates: Partial<EffectConfig>) => {
    setEffects(prev => prev.map(e => e.id === id ? { ...e, ...updates } as EffectConfig : e));
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-[#09090b] z-[80] flex flex-col font-sans text-white"
    >
      {/* Header */}
      <header className="h-[64px] px-2 flex items-center justify-between border-b border-white/5 bg-[#09090b]">
        <div className="flex items-center">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="ml-1">
            <h1 className="text-[16px] font-bold">Enhance Audio</h1>
            <p className="text-[10px] text-[#777777] font-bold uppercase tracking-widest">{recording.name}</p>
          </div>
        </div>
        <button 
          onClick={handleSaveProcessing}
          disabled={saveProgress !== null}
          className="px-4 h-10 bg-[#2196F3] text-white rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {saveProgress !== null ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saveProgress !== null ? `${saveProgress}%` : 'SAVE'}</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* A/B Waveform Display */}
        <div className="p-6 space-y-4">
          <div className="relative group cursor-pointer" onClick={() => setIsEnhanced(!isEnhanced)}>
            <div className="absolute top-4 left-4 z-10 px-2 py-1 bg-black/50 rounded-md backdrop-blur-sm border border-white/10">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isEnhanced ? 'text-[#2196F3]' : 'text-[#777777]'}`}>
                {isEnhanced ? 'ENHANCED VIEW' : 'ORIGINAL VIEW'}
              </span>
            </div>
            
            <div className="h-48 bg-[#111111] rounded-[32px] border border-white/5 flex items-center justify-center relative overflow-hidden">
               {/* Mock waveforms */}
               <div className="absolute inset-x-8 inset-y-12 flex items-end space-x-1">
                  {[...Array(60)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={isPlaying ? { height: [20 + Math.random() * 40, 40 + Math.random() * 40, 20 + Math.random() * 40] } : { height: 30 }}
                      className={`flex-1 rounded-full ${isEnhanced ? 'bg-[#2196F3]' : 'bg-[#444444]'} transition-colors duration-500`}
                    />
                  ))}
               </div>

               {/* Current Time Indicator Over Waveform */}
               <div 
                 className="absolute inset-y-0 left-0 w-0.5 bg-white/50 z-20 pointer-events-none" 
                 style={{ left: `${currentTime}%` }} 
               />
               
               {/* Magic ✨ overlay when enhanced */}
               <AnimatePresence>
                 {isEnhanced && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-blue-500/5 pointer-events-none"
                   />
                 )}
               </AnimatePresence>

               {/* Processing Overlay */}
               <AnimatePresence>
                 {isProcessing && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center"
                   >
                      <Loader2 className="w-10 h-10 text-[#2196F3] animate-spin mb-4" />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-[#2196F3] animate-pulse">Analyzing Signal...</span>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Real-time Spectrum Analyzer Hook */}
               <div className="absolute bottom-4 inset-x-8 h-8 opacity-30">
                  <SpectrumAnalyzer data={spectrumData} color={isEnhanced ? "#2196F3" : "#777777"} count={64} />
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
             <div className="flex items-center space-x-6">
                <button 
                  onClick={handleTogglePlay}
                  className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-xl"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
                </button>
                <button className="text-[#AAAAAA] active:text-white">
                  <RotateCcw className="w-5 h-5" />
                </button>
             </div>
             <div className="flex items-center space-x-2">
                <span className="text-[12px] font-mono font-medium text-[#777777]">01:42 / {recording.duration}</span>
                <button 
                  onClick={() => setIsEnhanced(!isEnhanced)}
                  className={`px-4 h-9 rounded-full font-bold text-[11px] uppercase tracking-widest border transition-all ${isEnhanced ? 'bg-[#2196F3] border-[#2196F3] text-white' : 'bg-transparent border-white/20 text-[#777777]'}`}
                >
                  {isEnhanced ? 'Enhanced On' : 'Original Data'}
                </button>
             </div>
          </div>

          {/* AI Quality Monitor */}
          <div className="px-4 py-3 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
             <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#2196F3]/20 flex items-center justify-center">
                   <Activity className="w-4 h-4 text-[#2196F3]" />
                </div>
                <div>
                   <p className="text-[10px] text-[#777777] font-bold uppercase tracking-widest">Signal Quality</p>
                   <p className="text-[12px] font-bold">Excellent (+{isEnhanced ? '24' : '0'}dB SNR)</p>
                </div>
             </div>
             <div className="flex space-x-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-1.5 h-6 rounded-full ${i <= 4 ? (isEnhanced ? 'bg-[#2196F3]' : 'bg-[#777777]') : 'bg-white/10'}`} />
                ))}
             </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 flex border-b border-white/5 space-x-8">
           <button 
             onClick={() => setActiveTab('presets')}
             className={`pb-4 text-[13px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'presets' ? 'text-[#2196F3]' : 'text-[#777777]'}`}
           >
              AI Presets
              {activeTab === 'presets' && <motion.div layoutId="tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2196F3]" />}
           </button>
           <button 
             onClick={() => setActiveTab('custom')}
             className={`pb-4 text-[13px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'custom' ? 'text-[#2196F3]' : 'text-[#777777]'}`}
           >
              Custom Chain
              {activeTab === 'custom' && <motion.div layoutId="tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2196F3]" />}
           </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
           {activeTab === 'presets' ? (
             <div className="grid grid-cols-2 gap-4">
                {presets.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleApplyPreset(p)}
                    className={`h-32 bg-[#1E1E1E]/50 border border-white/5 rounded-[28px] p-5 flex flex-col justify-between active:bg-white/10 transition-colors text-left relative overflow-hidden group ${selectedPreset === p.id ? 'border-[#2196F3]/50 ring-1 ring-[#2196F3]/20 shadow-lg shadow-[#2196F3]/5' : ''}`}
                  >
                     <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${p.color}`}>
                        <p.icon className="w-5 h-5" />
                     </div>
                     <span className="font-bold text-[14px] leading-tight">{p.name}</span>
                     <div className="absolute top-4 right-4 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                        {selectedPreset === p.id && <div className="w-2.5 h-2.5 bg-[#2196F3] rounded-full" />}
                     </div>
                  </button>
                ))}
             </div>
           ) : (
             <div className="space-y-4">
                {effects.map(effect => (
                  <div key={effect.id} className="p-6 bg-[#1A1A1A] rounded-[28px] border border-white/5 space-y-6 transition-all">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                           <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${effect.enabled ? 'text-blue-400' : 'text-[#444444]'}`}>
                              <Sliders className="w-5 h-5" />
                           </div>
                           <span className="font-bold">{effect.name}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={effect.enabled} 
                                onChange={(e) => updateEffect(effect.id, { enabled: e.target.checked })} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2196F3]"></div>
                        </label>
                     </div>

                     {effect.enabled && (
                       <div className="space-y-6">
                         {effect.type === 'noise-reduction' && (
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-[11px] text-[#777777] font-bold uppercase tracking-widest">
                                 <span>Suppression Strength</span>
                                 <span className="text-[#2196F3]">{effect.strength}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={effect.strength}
                                onChange={(e) => updateEffect(effect.id, { strength: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#2196F3]"
                              />
                           </div>
                         )}
                         {effect.type === 'voice-enhance' && (
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-3">
                                  <span className="text-[10px] text-[#777777] font-bold uppercase">Clarity</span>
                                  <input type="range" min="0" max="100" value={effect.clarity} onChange={e => updateEffect(effect.id, { clarity: parseInt(e.target.value) })} className="w-full accent-blue-400" />
                               </div>
                               <div className="space-y-3">
                                  <span className="text-[10px] text-[#777777] font-bold uppercase">Presence</span>
                                  <input type="range" min="0" max="100" value={effect.presence} onChange={e => updateEffect(effect.id, { presence: parseInt(e.target.value) })} className="w-full accent-purple-400" />
                               </div>
                            </div>
                         )}
                       </div>
                     )}
                  </div>
                ))}
                
                <button className="w-full h-14 bg-white/5 border border-dashed border-white/10 rounded-[20px] flex items-center justify-center text-[#777777] hover:border-white/20 hover:text-white transition-all space-x-2">
                   <Zap className="w-4 h-4" />
                   <span className="text-[12px] font-bold uppercase tracking-widest">Add Custom Module</span>
                </button>
             </div>
           )}
        </div>
      </div>

      {/* Logic/AI Status Footer */}
      <div className="p-6 bg-[#09090b] border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-[#777777] font-bold uppercase tracking-widest">On-Device AI Optimized</span>
          </div>
          <p className="text-[10px] text-[#555555] font-bold uppercase tracking-widest">Secure Local Engine</p>
      </div>
    </motion.div>
  );
}
