import { ChevronLeft, X, Save, Trash2, Tag, FileText, Clock, HardDrive, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

interface SaveScreenProps {
  durationSeconds: number;
  onSave: (name: string, tags: string) => void;
  onDiscard: () => void;
  onBack: () => void;
  key?: string;
}

export default function SaveScreen({ durationSeconds, onSave, onDiscard, onBack }: SaveScreenProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Generate default name: Recording_YYYYMMDD_HHMMSS
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    setName(`Recording_${timestamp}`);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    // Simulate background saving process
    setTimeout(() => {
      onSave(name, tags);
    }, 1200);
  };

  const fileSize = (durationSeconds * 0.032).toFixed(1); // Rough estimate for AAC compression

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-white overflow-y-auto"
    >
      {/* Top Bar */}
      <header className="h-[56px] px-2 flex items-center justify-between bg-[#09090b]">
        <button onClick={() => setShowDiscardConfirm(true)} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-medium">Save Recording</h1>
        <button onClick={() => setShowDiscardConfirm(true)} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-red-500/10">
          <X className="w-6 h-6 text-[#AAAAAA]" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8">
        {/* Waveform Preview Area */}
        <div className="w-full h-[120px] bg-[#1E1E1E] rounded-3xl relative overflow-hidden flex items-center justify-center group border border-white/5 shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center space-x-1 px-8 opacity-40">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-[#2196F3] rounded-full" 
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
          <button className="relative z-10 w-12 h-12 rounded-full bg-[#2196F3] flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Play className="w-5 h-5 fill-white ml-1" />
          </button>
        </div>

        {/* Info Card */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock, label: 'Duration', value: formatTime(durationSeconds) },
            { icon: HardDrive, label: 'Size', value: `${fileSize} MB` },
            { icon: FileText, label: 'Format', value: 'AAC' },
            { icon: Tag, label: 'Date', value: 'Today' },
          ].map((item, i) => (
            <div key={i} className="bg-[#1E1E1E] p-4 rounded-2xl border border-white/5">
              <div className="flex items-center space-x-2 mb-1">
                <item.icon className="w-3 h-3 text-[#777777]" />
                <span className="text-[10px] text-[#777777] uppercase tracking-wider font-bold">{item.label}</span>
              </div>
              <p className="text-[14px] font-medium">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Input Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-[#777777] uppercase tracking-widest px-1">Recording Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[/\:*?"<>|]/g, ""))}
                placeholder="Name your file"
                className="w-full bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 pr-12 focus:border-[#2196F3] outline-none transition-colors text-[16px]"
              />
              {name && (
                <button 
                  onClick={() => setName("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex justify-end pr-1">
              <span className={`text-[10px] ${name.length > 90 ? 'text-red-500' : 'text-[#777777]'}`}>{name.length}/100</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-[#777777] uppercase tracking-widest px-1">Tags (Optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., meeting, ideas, memo"
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 focus:border-[#2196F3] outline-none transition-colors text-[16px]"
            />
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <footer className="p-6 pb-12 space-y-3 bg-[#09090b]">
        <button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          className="w-full h-14 bg-[#2196F3] rounded-2xl flex items-center justify-center space-x-2 font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>SAVING...</span>
            </div>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>SAVE RECORDING</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowDiscardConfirm(true)}
          className="w-full h-14 bg-transparent text-[#777777] font-bold active:bg-white/5 rounded-2xl flex items-center justify-center space-x-2"
        >
          <Trash2 className="w-5 h-5" />
          <span>DISCARD</span>
        </button>
      </footer>

      {/* Confirm Discard Modal */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscardConfirm(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed left-6 right-6 top-1/2 -translate-y-1/2 bg-[#1E1E1E] rounded-[32px] p-8 z-[70] shadow-2xl border border-white/10"
            >
              <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-[20px] font-bold mb-2">Discard recording?</h2>
              <p className="text-[#AAAAAA] text-[14px] leading-relaxed mb-8">
                This recording will be deleted permanently. This cannot be undone.
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={onDiscard}
                  className="w-full h-12 bg-red-500 rounded-xl font-bold active:scale-[0.98] transition-transform"
                >
                  DISCARD
                </button>
                <button 
                  onClick={() => setShowDiscardConfirm(false)}
                  className="w-full h-12 bg-white/5 rounded-xl font-bold active:bg-white/10 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
