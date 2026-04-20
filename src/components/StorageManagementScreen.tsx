
import { ChevronLeft, ChevronRight, PieChart, Folder, Scissors, Download, Database, LayoutGrid, Tag, Heart, Settings2, ShieldCheck, AlertCircle, Trash2, HardDrive, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useMemo } from "react";
import { getMockStorageStats, formatSize, calculateProjection } from "../lib/storageUtils";
import { StorageStats } from "../types/storage";

interface StorageManagementScreenProps {
  onBack: () => void;
  onOpenFolders?: () => void;
  onOpenCleanup?: () => void;
  key?: string | number;
}

export default function StorageManagementScreen({ onBack, onOpenFolders, onOpenCleanup }: StorageManagementScreenProps) {
  const stats = useMemo(() => getMockStorageStats(), []);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const categories = [
    { id: 'recordings', label: 'Recordings', value: stats.categories.recordings, color: '#2196F3' },
    { id: 'cache', label: 'Cache', value: stats.categories.cache, color: '#777777' },
    { id: 'thumbnails', label: 'Thumbnails', value: stats.categories.thumbnails, color: '#444444' },
    { id: 'appData', label: 'App Data', value: stats.categories.appData, color: '#222222' },
  ];

  const totalUsedMb = categories.reduce((acc, cat) => acc + cat.value, 0);
  const freeMb = stats.freeOnDevice * 1024;
  const projectionDays = calculateProjection(150, freeMb); // Assume 150MB avg daily

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-[#09090b] z-[60] flex flex-col font-sans text-white overflow-hidden"
    >
      {/* Header */}
      <header className="h-[64px] px-2 flex items-center justify-between border-b border-white/5 bg-[#09090b]">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-bold">Storage Management</h1>
        <div className="w-12" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-8">
        {/* SECTION 1: DASHBOARD */}
        <section className="px-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em]">Storage Dashboard</h3>
            <div className="flex items-center space-x-1 text-[10px] text-[#2196F3] font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>SYSTEM SECURE</span>
            </div>
          </div>

          <div className="bg-[#1E1E1E]/30 rounded-[32px] border border-white/5 p-8 flex flex-col items-center">
            {/* Donut Chart */}
            <div className="relative w-[200px] h-[200px] mb-8">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Empty base circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1a1a1a" strokeWidth="12" />
                  {/* Free Space segment */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="12" 
                    strokeDasharray={`${(freeMb / (stats.total * 1024)) * 251.2} 251.2`} 
                    strokeDashoffset={0}
                  />
                  {/* App Data segment */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="#2196F3" 
                    strokeWidth={activeSegment === 'recordings' ? "16" : "12"} 
                    strokeDasharray={`${(totalUsedMb / (stats.total * 1024)) * 251.2} 251.2`} 
                    className="transition-all duration-500"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[12px] text-[#777777] font-bold">USED</p>
                  <p className="text-[32px] font-mono font-bold leading-none">11%</p>
                  <p className="text-[10px] text-[#2196F3] mt-1 font-bold">14.2 GB</p>
               </div>
            </div>

            {/* Breakdown Legend */}
            <div className="w-full grid grid-cols-2 gap-4">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveSegment(activeSegment === cat.id ? null : cat.id)}
                  className={`p-3 rounded-2xl border transition-all ${activeSegment === cat.id ? 'bg-white/5 border-white/20' : 'bg-transparent border-transparent'}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[11px] text-[#777777] font-bold uppercase">{cat.label}</span>
                  </div>
                  <p className="text-[14px] font-mono font-bold">{formatSize(cat.value)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-[#1E1E1E]/30 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-[#777777] font-bold uppercase mb-1">Free Space</p>
                <p className="text-[18px] font-mono font-bold text-white">{stats.freeOnDevice} GB</p>
             </div>
             <div className="bg-[#1E1E1E]/30 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-[#2196F3] font-bold uppercase mb-1">Current Trend</p>
                <p className="text-[18px] font-mono font-bold text-[#2196F3]">{projectionDays} Days Left</p>
             </div>
          </div>
        </section>

        {/* SECTION 2: FILE ORGANIZATION */}
        <section className="space-y-4">
           <h3 className="px-6 text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em]">File Organization</h3>
           <div className="bg-[#1E1E1E]/30 border-y border-white/5 divide-y divide-white/5">
              {[
                { label: "Folder Management", icon: Folder, value: "4 Folders", color: "text-blue-400", onClick: onOpenFolders },
                { label: "Tagging System", icon: Tag, value: "12 Tags", color: "text-purple-400" },
                { label: "Smart Playlists", icon: LayoutGrid, value: "3 Active", color: "text-emerald-400" },
                { label: "Favorites", icon: Heart, value: "28 items", color: "text-red-400" },
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.onClick}
                  className="w-full px-6 py-5 flex items-center justify-between active:bg-white/5"
                >
                   <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                         <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-[15px]">{item.label}</span>
                   </div>
                   <div className="flex items-center space-x-2">
                      <span className="text-[12px] text-[#777777]">{item.value}</span>
                      <ChevronRight className="w-4 h-4 text-[#444444]" />
                   </div>
                </button>
              ))}
           </div>
        </section>

        {/* SECTION 3: CLEANUP TOOLS */}
        <section className="space-y-4">
           <div className="px-6 flex items-center justify-between">
              <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em]">Cleanup Tools</h3>
              <span className="text-[10px] bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full font-bold">142 MB CACHE</span>
           </div>
           <div className="bg-[#1E1E1E]/30 border-y border-white/5 divide-y divide-white/5">
              {[
                { label: "Duplicate Finder", icon: Database, desc: "Found 4 similar recordings", onClick: onOpenCleanup },
                { label: "Large File Finder", icon: HardDrive, desc: "3 files over 200MB", onClick: onOpenCleanup },
                { label: "Auto-Cleanup Rules", icon: Settings2, desc: "2 rules active", onClick: onOpenCleanup },
                { label: "Clear Cache", icon: Trash2, desc: "Waveforms & thumbnails", warning: true, onClick: onOpenCleanup },
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.onClick}
                  className="w-full px-6 py-5 flex items-center justify-between active:bg-white/5"
                >
                   <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.warning ? 'text-orange-400' : 'text-[#AAAAAA]'}`}>
                         <item.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[15px]">{item.label}</p>
                        <p className="text-[11px] text-[#555555] font-medium uppercase tracking-wider">{item.desc}</p>
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-[#444444]" />
                </button>
              ))}
           </div>
        </section>

        {/* SECTION 4: ADVANCED */}
        <section className="space-y-4 pb-12">
           <h3 className="px-6 text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em]">System & Backup</h3>
           <div className="px-6 grid grid-cols-2 gap-3">
              <button className="h-[120px] bg-[#1E1E1E]/30 border border-white/5 rounded-[24px] p-5 flex flex-col justify-between active:bg-white/5 transition-colors">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                    <Download className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-[13px]">Batch Export</p>
                    <p className="text-[10px] text-[#555555] uppercase font-bold tracking-widest mt-0.5">Zip recordings</p>
                 </div>
              </button>
              <button className="h-[120px] bg-[#1E1E1E]/30 border border-white/5 rounded-[24px] p-5 flex flex-col justify-between active:bg-white/5 transition-colors">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                    <Share2 className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-[13px]">Cloud Sync</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Settings only</p>
                 </div>
              </button>
           </div>
        </section>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-gradient-to-t from-black to-transparent flex items-center justify-center space-x-2">
         <AlertCircle className="w-4 h-4 text-[#555555]" />
         <p className="text-[10px] text-[#555555] font-bold uppercase tracking-widest">
            Data is strictly stored locally on this device
         </p>
      </div>
    </motion.div>
  );
}
