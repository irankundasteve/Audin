import { ChevronLeft, RotateCcw, Activity, Mic, Settings2, Info, ChevronRight, Check, Sliders, Battery, HardDrive, Clock, Wind, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { RecordingSettings, DEFAULT_SETTINGS, PRESETS, QualityPreset, AudioFormat, MicrophoneSource } from "../types/settings";

interface RecordingSettingsScreenProps {
  settings: RecordingSettings;
  onUpdate: (settings: RecordingSettings) => void;
  onBack: () => void;
  key?: string | number;
}

export default function RecordingSettingsScreen({ settings, onUpdate, onBack }: RecordingSettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<'quality' | 'source' | 'behavior' | 'advanced'>('quality');
  const [showCustomConfig, setShowCustomConfig] = useState(settings.qualityPreset === 'custom');

  const updateSettings = (updates: Partial<RecordingSettings>) => {
    onUpdate({ ...settings, ...updates });
  };

  const handlePresetSelect = (preset: QualityPreset) => {
    if (preset === 'custom') {
      updateSettings({ qualityPreset: 'custom' });
      setShowCustomConfig(true);
    } else {
      updateSettings({
        qualityPreset: preset,
        ...PRESETS[preset],
      });
      setShowCustomConfig(false);
    }
  };

  const calculateStorageEstimate = () => {
    const bytesPerSecond = (settings.bitrate * 1000) / 8;
    const mbPerHour = (bytesPerSecond * 3600) / (1024 * 1024);
    return Math.round(mbPerHour);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-[#09090b] z-[60] flex flex-col font-sans text-white overflow-hidden"
    >
      {/* Top Bar */}
      <header className="h-[64px] px-2 flex items-center justify-between bg-[#09090b] border-b border-white/5">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-bold">Recording Settings</h1>
        <button 
          onClick={() => onUpdate(DEFAULT_SETTINGS)}
          className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 text-[#777777]"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      {/* Navigation Tabs (Specialist Look) */}
      <div className="flex border-b border-white/5 bg-[#0e0e11] overflow-x-auto no-scrollbar">
        {[
          { id: 'quality', label: 'Quality', icon: Activity },
          { id: 'source', label: 'Source', icon: Mic },
          { id: 'behavior', label: 'Behavior', icon: Zap },
          { id: 'advanced', label: 'Advanced', icon: Settings2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[100px] h-14 flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#2196F3] text-[#2196F3] bg-[#2196F3]/5' : 'border-transparent text-[#777777]'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[12px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#09090b] p-6 space-y-8 no-scrollbar pb-32">
        
        {/* TAB: QUALITY */}
        {activeTab === 'quality' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em]">Quality Presets</h3>
                <Info className="w-4 h-4 text-[#777777]" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(['low', 'medium', 'high', 'lossless', 'custom'] as QualityPreset[]).map(preset => (
                  <PresetCard 
                    key={preset}
                    id={preset}
                    selected={settings.qualityPreset === preset}
                    onClick={() => handlePresetSelect(preset)}
                  />
                ))}
              </div>
            </section>

            <AnimatePresence>
              {showCustomConfig && (
                <motion.section 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="p-4 bg-[#1E1E1E] rounded-2xl border border-white/5 space-y-6">
                    {/* Format Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-[#777777] font-bold uppercase mb-2 block">Audio Format</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['AAC', 'MP3', 'WAV', 'FLAC', 'OPUS', 'AMR'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => updateSettings({ format: f as AudioFormat })}
                                    className={`h-10 rounded-xl text-[12px] font-bold border transition-all ${settings.format === f ? 'bg-[#2196F3] border-[#2196F3] text-white' : 'bg-white/5 border-white/10 text-[#AAAAAA]'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bitrate Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-[#777777] font-bold uppercase">Bitrate</label>
                            <span className="text-[14px] font-mono text-[#2196F3]">{settings.bitrate} kbps</span>
                        </div>
                        <input 
                            type="range" 
                            min="8" 
                            max="320" 
                            step="8"
                            value={settings.bitrate}
                            onChange={(e) => updateSettings({ bitrate: parseInt(e.target.value) })}
                            className="w-full h-1 bg-white/5 rounded-full appearance-none accent-[#2196F3] outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-[#444444] font-bold">
                            <span>VOICE</span>
                            <span>MUSIC</span>
                            <span>HI-FI</span>
                        </div>
                    </div>

                    {/* Channels */}
                    <div className="space-y-2">
                         <label className="text-[10px] text-[#777777] font-bold uppercase">Channels</label>
                         <div className="flex space-x-2">
                            {['mono', 'stereo'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => updateSettings({ channels: c as any })}
                                    className={`flex-1 h-12 rounded-xl flex items-center justify-center space-x-2 border transition-all ${settings.channels === c ? 'bg-[#2196F3]/10 border-[#2196F3] text-white' : 'bg-white/5 border-white/10 text-[#777777]'}`}
                                >
                                    <span className="text-[12px] font-bold uppercase tracking-widest">{c}</span>
                                </button>
                            ))}
                         </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Storage Estimator */}
            <div className="p-5 bg-gradient-to-br from-[#2196F3]/10 to-transparent rounded-2xl border border-[#2196F3]/20 flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#2196F3]/20 rounded-xl flex items-center justify-center">
                    <HardDrive className="w-6 h-6 text-[#2196F3]" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] text-[#2196F3] font-bold uppercase tracking-widest">Storage Impact</p>
                    <p className="text-[14px] font-medium text-white/90">Est. {calculateStorageEstimate()} MB per hour of recording</p>
                </div>
            </div>
          </div>
        )}

        {/* TAB: SOURCE */}
        {activeTab === 'source' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="space-y-4">
                <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em] px-1">Microphone Input</h3>
                <div className="space-y-3">
                    {[
                        { id: 'built-in', icon: Mic, label: 'Built-in Microphone', desc: 'Default system mic' },
                        { id: 'external', icon: Settings2, label: 'External Microphone', desc: 'USB or Audio Jack', disabled: true },
                        { id: 'bluetooth', icon: Zap, label: 'Bluetooth Headset', desc: 'Wireless audio input', disabled: true },
                    ].map(src => (
                        <button
                            key={src.id}
                            onClick={() => !src.disabled && updateSettings({ source: src.id as MicrophoneSource })}
                            className={`w-full p-4 rounded-2xl border flex items-center space-x-4 transition-all ${settings.source === src.id ? 'bg-[#1E1E1E] border-[#2196F3]' : 'bg-white/5 border-white/10'} ${src.disabled ? 'opacity-30' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.source === src.id ? 'bg-[#2196F3]/20 text-[#2196F3]' : 'bg-white/5 text-[#777777]'}`}>
                                <src.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-bold text-[14px]">{src.label}</p>
                                <p className="text-[12px] text-[#777777]">{src.desc}</p>
                            </div>
                            {settings.source === src.id && <Check className="w-5 h-5 text-[#2196F3]" />}
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em] px-1">Audio Processing</h3>
                <div className="p-2 bg-[#1E1E1E] rounded-2xl border border-white/5 divide-y divide-white/5">
                    <ToggleField 
                        label="Noise Reduction" 
                        icon={Wind} 
                        value={settings.noiseReduction !== 'off'} 
                        onChange={(v) => updateSettings({ noiseReduction: v ? 'basic' : 'off' })} 
                    />
                    <ToggleField 
                        label="Automatic Gain (AGC)" 
                        icon={Activity} 
                        value={settings.autoGain} 
                        onChange={(v) => updateSettings({ autoGain: v })} 
                    />
                    <ToggleField 
                        label="Wind Filter" 
                        icon={Wind} 
                        value={settings.windFilter} 
                        onChange={(v) => updateSettings({ windFilter: v })} 
                    />
                    <ToggleField 
                        label="Peak Limiter" 
                        icon={Sliders} 
                        value={settings.limiter} 
                        onChange={(v) => updateSettings({ limiter: v })} 
                    />
                </div>
            </section>
          </div>
        )}

        {/* TAB: BEHAVIOR */}
        {activeTab === 'behavior' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="space-y-4">
                <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em] px-1">Auto Start/Stop</h3>
                <div className="p-4 bg-[#1E1E1E] rounded-2xl border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-[#2196F3]" />
                            <div>
                                <p className="font-bold">Voice Activation</p>
                                <p className="text-[11px] text-[#777777]">Start when audio is detected</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={settings.autoStartVoice} 
                                onChange={(e) => updateSettings({ autoStartVoice: e.target.checked })} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2196F3]"></div>
                        </label>
                    </div>

                    {settings.autoStartVoice && (
                        <div className="space-y-4 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-[#777777]">
                                <span>Sensitivity</span>
                                <span className="text-[#2196F3]">{settings.voiceSensitivity}</span>
                            </div>
                            <input 
                                type="range" min="1" max="10" 
                                value={settings.voiceSensitivity}
                                onChange={(e) => updateSettings({ voiceSensitivity: parseInt(e.target.value) })}
                                className="w-full h-1 bg-white/5 appearance-none focus:outline-none" 
                            />
                        </div>
                    )}

                    <div className="h-px bg-white/5" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-[#2196F3]" />
                            <div>
                                <p className="font-bold">Silence Stop</p>
                                <p className="text-[11px] text-[#777777]">Stop after {settings.silenceDuration}s silence</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={settings.autoStopSilence} 
                                onChange={(e) => updateSettings({ autoStopSilence: e.target.checked })} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2196F3]"></div>
                        </label>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em] px-1">Buffering</h3>
                <div className="p-4 bg-[#1E1E1E] rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <RotateCcw className="w-5 h-5 text-[#2196F3]" />
                            <div>
                                <p className="font-bold">Pre-roll Buffer</p>
                                <p className="text-[11px] text-[#777777]">Capture {settings.bufferDuration}s before tapping Record</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={settings.preRollBuffer} 
                                onChange={(e) => updateSettings({ preRollBuffer: e.target.checked })} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2196F3]"></div>
                        </label>
                    </div>
                </div>
            </section>
          </div>
        )}

        {/* TAB: ADVANCED */}
        {activeTab === 'advanced' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="space-y-4">
                <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em] px-1">Technical Specs</h3>
                <div className="p-2 bg-[#1E1E1E] rounded-2xl border border-white/5 divide-y divide-white/5">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-[14px]">Sample Rate</p>
                            <p className="text-[12px] text-[#777777]">{settings.sampleRate / 1000} kHz</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#444444]" />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-[14px]">Bit Depth</p>
                            <p className="text-[12px] text-[#777777]">16-bit PCM (Standard)</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#444444]" />
                    </div>
                    <ToggleField 
                        label="Variable Bitrate (VBR)" 
                        icon={Activity} 
                        value={settings.vbr} 
                        onChange={(v) => updateSettings({ vbr: v })} 
                    />
                </div>
            </section>

            <section className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10 space-y-4">
                <div className="flex items-center space-x-3 text-red-400">
                    <Battery className="w-5 h-5" />
                    <span className="text-[12px] font-bold uppercase tracking-widest">Battery & Performance</span>
                </div>
                <p className="text-[13px] text-[#AAAAAA] leading-relaxed">
                    Selected settings will consume approx. <span className="text-white font-bold">8% battery per hour</span> of recording. High quality encoding may cause device warming during long sessions.
                </p>
            </section>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-6 border-t border-white/5 bg-[#09090b] z-20">
        <button 
          className="w-full h-14 bg-[#2196F3] text-white rounded-2xl font-bold flex items-center justify-center space-x-3 active:scale-95 transition-transform"
        >
          <Activity className="w-5 h-5" />
          <span>RUN TEST RECORDING</span>
        </button>
      </div>
    </motion.div>
  );
}

function PresetCard({ id, selected, onClick }: { id: QualityPreset, selected: boolean, onClick: () => void, key?: any }) {
  const getSpecs = () => {
    switch(id) {
      case 'low': return 'AAC • 32kbps • 16kHz • Mono';
      case 'medium': return 'AAC • 64kbps • 22kHz • Mono';
      case 'high': return 'AAC • 128kbps • 44kHz • Stereo';
      case 'lossless': return 'WAV • Lossless • 44kHz • Stereo';
      case 'custom': return 'User defined parameters';
    }
  };

  const getLabel = () => id.charAt(0).toUpperCase() + id.slice(1);
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left transition-all ${selected ? 'bg-[#1E1E1E] border-[#2196F3] shadow-[0_0_20px_rgba(33,150,243,0.15)]' : 'bg-white/5 border-white/10 active:bg-white/10'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[15px] font-bold ${selected ? 'text-white' : 'text-[#AAAAAA]'}`}>{getLabel()}</span>
        {selected && (
            <div className="w-5 h-5 bg-[#2196F3] rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
            </div>
        )}
      </div>
      <p className="text-[12px] text-[#777777] font-mono">{getSpecs()}</p>
    </button>
  );
}

function ToggleField({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${value ? 'bg-[#2196F3]/10 text-[#2196F3]' : 'bg-white/5 text-[#444444]'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px]">{label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={value} 
                    onChange={(e) => onChange(e.target.checked)} 
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2196F3]"></div>
            </label>
        </div>
    );
}
