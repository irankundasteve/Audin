
import { ChevronLeft, Trash2, Database, HardDrive, Settings2, Clock, Check, AlertTriangle, ShieldCheck, ChevronRight, Play, Info, Layers, Filter, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { CleanupRule } from "../types/storage";

interface CleanupToolsScreenProps {
  onBack: () => void;
  key?: string | number;
}

export default function CleanupToolsScreen({ onBack }: CleanupToolsScreenProps) {
  const [activeTool, setActiveTool] = useState<'hub' | 'duplicates' | 'large' | 'rules'>('hub');

  const rules: CleanupRule[] = [
    { id: '1', name: 'Delete Old Recordings', condition: { type: 'age', operator: '>', value: 365 }, action: 'delete', enabled: true },
    { id: '2', name: 'Compress Large Files', condition: { type: 'size', operator: '>', value: 500 }, action: 'compress', enabled: false },
  ];

  const duplicates = [
    { id: 'g1', name: 'Weekly Meeting', count: 2, size: '42 MB', date: '2024-03-12' },
    { id: 'g2', name: 'Guitar Jam 04', count: 3, size: '128 MB', date: '2024-02-28' },
  ];

  const largeFiles = [
    { id: 'l1', name: 'Conference Recording', size: '1.2 GB', duration: '2:45:12', date: '2024-01-15' },
    { id: 'l2', name: 'Class Lecture 08', size: '412 MB', duration: '0:58:20', date: '2024-03-01' },
    { id: 'l3', name: 'Music Production Test', size: '320 MB', duration: '0:45:00', date: '2024-03-05' },
  ];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-[#09090b] z-[70] flex flex-col font-sans text-white overflow-hidden"
    >
      {/* Header */}
      <header className="h-[64px] px-2 flex items-center justify-between border-b border-white/5 bg-[#09090b]">
        <button 
          onClick={() => activeTool === 'hub' ? onBack() : setActiveTool('hub')} 
          className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-bold">
           {activeTool === 'hub' ? 'Cleanup Tools' : 
            activeTool === 'duplicates' ? 'Duplicate Finder' :
            activeTool === 'large' ? 'Large File Finder' : 'Auto-Cleanup Rules'}
        </h1>
        <div className="w-12" />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTool === 'hub' && (
          <div className="p-6 space-y-8">
             <div className="p-6 bg-gradient-to-br from-red-500/10 to-transparent rounded-[32px] border border-red-500/20">
                <div className="flex items-center space-x-3 text-red-400 mb-4">
                   <AlertTriangle className="w-5 h-5" />
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Storage Optimization Recommendation</span>
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-white/90">
                   You have <span className="text-white font-bold">1.4 GB</span> of data that can be safely optimized or removed to free up space.
                </p>
                <div className="mt-6 flex space-x-2">
                   <button className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold text-[12px] shadow-lg shadow-red-500/20">ONE-TAP CLEANUP</button>
                   <button className="h-12 px-6 bg-white/5 text-[#AAAAAA] rounded-xl font-bold text-[12px]">LEARN MORE</button>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'duplicates', label: 'Duplicate Finder', icon: Layers, desc: 'Find exact and similar recordings', count: '4 found', color: 'text-blue-400' },
                  { id: 'large', label: 'Large File Finder', icon: HardDrive, desc: 'Identify files consuming massive space', count: '3 files', color: 'text-purple-400' },
                  { id: 'rules', label: 'Auto-Cleanup Rules', icon: Settings2, desc: 'Automatic scheduling & maintenance', count: '2 active', color: 'text-orange-400' },
                ].map(tool => (
                  <button 
                    key={tool.id} 
                    onClick={() => setActiveTool(tool.id as any)}
                    className="p-6 bg-[#1A1A1A] border border-white/5 rounded-[28px] flex items-center justify-between active:bg-white/5 transition-all group"
                  >
                     <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${tool.color}`}>
                           <tool.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                           <p className="font-bold text-[16px]">{tool.label}</p>
                           <p className="text-[12px] text-[#777777]">{tool.desc}</p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end space-y-1">
                        <ChevronRight className="w-4 h-4 text-[#444444] group-active:translate-x-1 transition-transform" />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${tool.color}`}>{tool.count}</span>
                     </div>
                  </button>
                ))}
             </div>

             <div className="pt-8 border-t border-white/5 flex flex-col items-center">
                <ShieldCheck className="w-8 h-8 text-[#2196F3] mb-3 opacity-50" />
                <p className="text-[11px] text-[#555555] font-bold uppercase tracking-widest text-center px-12">
                   Cleanup operations are irreversible once completed. Backups are recommended for large deletions.
                </p>
             </div>
          </div>
        )}

        {/* TOOL: DUPLICATES */}
        {activeTool === 'duplicates' && (
           <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-widest">Duplicate Groups</h3>
                 <button className="text-[10px] text-[#2196F3] font-bold uppercase tracking-widest">Select All</button>
              </div>
              <div className="space-y-4">
                 {duplicates.map(group => (
                   <div key={group.id} className="bg-[#1E1E1E] rounded-[24px] border border-white/5 overflow-hidden">
                      <div className="p-4 bg-white/5 flex items-center justify-between">
                         <div>
                            <p className="font-bold">{group.name}</p>
                            <p className="text-[11px] text-[#777777]">{group.count} similar tracks discovered</p>
                         </div>
                         <button className="h-8 px-4 bg-[#2196F3] text-white rounded-lg text-[10px] font-bold">KEEP ONE</button>
                      </div>
                      <div className="p-4 space-y-3">
                         {[...Array(group.count)].map((_, i) => (
                           <div key={i} className="flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                              <div className="flex items-center space-x-3">
                                 <Play className="w-4 h-4 text-[#AAAAAA]" />
                                 <div className="text-[13px]">
                                    <span className="font-medium">Version {i+1}</span>
                                    <span className="text-[#555555] mx-2">•</span>
                                    <span className="text-[#777777]">{group.size}</span>
                                 </div>
                              </div>
                              <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center">
                                 {i === 0 && <Check className="w-3 h-3 text-[#2196F3]" />}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* TOOL: LARGE FILES */}
        {activeTool === 'large' && (
           <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-5 bg-[#2196F3]/10 rounded-[28px] border border-[#2196F3]/20 flex items-center space-x-4">
                 <div className="w-12 h-12 bg-[#2196F3]/20 rounded-2xl flex items-center justify-center">
                    <Filter className="w-6 h-6 text-[#2196F3]" />
                 </div>
                 <div>
                    <p className="text-[10px] text-[#2196F3] font-bold uppercase tracking-widest">Cumulative Potential</p>
                    <p className="text-[20px] font-mono font-bold">1.9 GB Space</p>
                 </div>
              </div>

              <div className="space-y-2">
                 {largeFiles.map(file => (
                   <div key={file.id} className="p-4 bg-[#1E1E1E] rounded-2xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#777777]">
                            <HardDrive className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="font-bold text-[14px] truncate max-w-[150px]">{file.name}</p>
                            <p className="text-[11px] text-[#555555]">{file.duration} • {file.date}</p>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <p className="font-mono font-bold text-white mb-1">{file.size}</p>
                         <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2196F3]" style={{ width: file.size.includes('GB') ? '100%' : '40%' }} />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* TOOL: RULES */}
        {activeTool === 'rules' && (
           <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] text-[#777777] font-bold uppercase tracking-widest">Active Rules</h3>
                    <button className="text-[10px] text-[#2196F3] font-bold uppercase tracking-widest flex items-center space-x-1">
                       <Plus className="w-3 h-3" />
                       <span>CREATE RULE</span>
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                    {rules.map(rule => (
                      <div key={rule.id} className="p-5 bg-[#1E1E1E] rounded-[28px] border border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                               <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${rule.enabled ? 'text-orange-400' : 'text-[#444444]'}`}>
                                  <Clock className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-[15px]">{rule.name}</p>
                                  <p className="text-[11px] text-[#777777] font-medium uppercase tracking-wider">
                                     IF {rule.condition.type} {rule.condition.operator} {rule.condition.value} THEN {rule.action}
                                  </p>
                               </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={rule.enabled} 
                                    onChange={() => {}} 
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-400"></div>
                            </label>
                         </div>
                         <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-[#555555] font-bold uppercase tracking-widest">Last Run: 2 days ago</span>
                            <button className="text-[10px] text-[#2196F3] font-bold flex items-center space-x-1">
                               <Info className="w-3 h-3" />
                               <span>SIMULATE</span>
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <section className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10 space-y-3">
                 <div className="flex items-center space-x-2 text-red-400">
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Safety Protocol</span>
                 </div>
                 <p className="text-[12px] text-[#777777] leading-relaxed">
                   By default, favorites and tagged recordings are excluded from automatic cleanup rules. You can override this in <span className="text-white">Security Settings</span>.
                 </p>
              </section>
           </div>
        )}
      </div>

      {activeTool !== 'hub' && (
        <div className="p-6 bg-[#09090b] border-t border-white/5 flex space-x-3">
           <button 
             onClick={() => setActiveTool('hub')}
             className="flex-1 h-14 bg-white/5 text-white rounded-2xl font-bold active:bg-white/10"
           >
              BACK TO HUB
           </button>
           <button 
             className="flex-[1.5] h-14 bg-[#2196F3] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
           >
              EXECUTE OPTIMIZATION
           </button>
        </div>
      )}
    </motion.div>
  );
}
