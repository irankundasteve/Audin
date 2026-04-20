
import { ChevronLeft, Plus, MoreVertical, LayoutGrid, List, Search, Palette, Heart, History, Trash2, Download, Trash, Check, X, FolderIcon as LucideFolder, Mic, Users, Music, FileText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { Folder } from "../types/storage";

interface FolderManagementScreenProps {
  onBack: () => void;
  key?: string | number;
}

export default function FolderManagementScreen({ onBack }: FolderManagementScreenProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [newFolderData, setNewFolderData] = useState<{name: string, color: string, icon: string} | null>(null);

  const initialFolders: Folder[] = [
    { id: 'all', name: 'All Recordings', color: '#2196F3', icon: 'LucideFolder', recordingCount: 247, isSystem: true },
    { id: 'fav', name: 'Favorites', color: '#F44336', icon: 'Heart', recordingCount: 28, isSystem: true },
    { id: 'del', name: 'Recently Deleted', color: '#777777', icon: 'History', recordingCount: 4, isSystem: true },
    { id: 'f1', name: 'Meetings 2024', color: '#4CAF50', icon: 'Users', recordingCount: 42 },
    { id: 'f2', name: 'Piano Practice', color: '#FF9800', icon: 'Music', recordingCount: 15 },
    { id: 'f3', name: 'Journal Drafts', color: '#9C27B0', icon: 'FileText', recordingCount: 8 },
  ];

  const colors = ["#2196F3", "#F44336", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4", "#E91E63", "#795548", "#607D8B", "#FFC107"];
  const icons = [
    { name: 'Mic', comp: Mic },
    { name: 'Users', comp: Users },
    { name: 'Music', comp: Music },
    { name: 'FileText', comp: FileText },
    { name: 'Heart', comp: Heart },
    { name: 'Folder', comp: LucideFolder },
  ];

  const handleCreateTap = () => {
    setNewFolderData({ name: "", color: colors[0], icon: 'Mic' });
  };

  const getIcon = (name: string) => {
    const found = icons.find(i => i.name === name);
    const Comp = found ? found.comp : LucideFolder;
    return <Comp className="w-5 h-5" />;
  };

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
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-bold">Folders</h1>
        <button 
          onClick={handleCreateTap}
          className="w-12 h-12 flex items-center justify-center rounded-full text-[#2196F3] active:bg-white/10"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Sub-header (Search & View Toggles) */}
      <div className="px-6 py-4 flex items-center space-x-3">
         <div className="flex-1 h-12 bg-[#1E1E1E] rounded-2xl flex items-center px-4 border border-white/5">
            <Search className="w-4 h-4 text-[#777777] mr-3" />
            <input 
              type="text" 
              placeholder="Search folders..." 
              className="bg-transparent border-none outline-none flex-1 text-[14px]"
            />
         </div>
         <div className="flex bg-[#1E1E1E] rounded-2xl p-1 border border-white/5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-[#2196F3] text-white' : 'text-[#777777]'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${viewMode === 'list' ? 'bg-[#2196F3] text-white' : 'text-[#777777]'}`}
            >
              <List className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
             {initialFolders.map(folder => (
               <motion.div 
                 key={folder.id}
                 whileTap={{ scale: 0.98 }}
                 className="relative h-[160px] bg-[#1E1E1E]/30 border border-white/5 rounded-[32px] p-6 flex flex-col justify-between active:bg-white/5 transition-colors overflow-hidden group cursor-pointer"
               >
                  {/* Decorative background circle */}
                  <div 
                    className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-[0.03] transition-transform group-active:scale-125"
                    style={{ backgroundColor: folder.color }}
                  />
                  
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                  >
                    {getIcon(folder.icon)}
                  </div>

                  <div className="text-left">
                     <p className="font-bold text-[16px] leading-tight truncate">{folder.name}</p>
                     <p className="text-[12px] text-[#777777] font-bold mt-1">{folder.recordingCount} items</p>
                  </div>

                  {!folder.isSystem && (
                    <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 active:bg-white/10 transition-opacity">
                       <MoreVertical className="w-4 h-4 text-[#AAAAAA]" />
                    </button>
                  )}
               </motion.div>
             ))}
          </div>
        ) : (
          <div className="space-y-2">
            {initialFolders.map(folder => (
               <button 
                 key={folder.id}
                 className="w-full flex items-center justify-between p-4 bg-[#1E1E1E]/30 rounded-2xl border border-white/5 active:bg-white/5"
               >
                  <div className="flex items-center space-x-4">
                     <div 
                       className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                     >
                       {getIcon(folder.icon)}
                     </div>
                     <span className="font-bold">{folder.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                     <span className="text-[12px] text-[#777777] font-bold">{folder.recordingCount}</span>
                     <ChevronRight className="w-4 h-4 text-[#444444]" />
                  </div>
               </button>
            ))}
          </div>
        )}
      </div>

      {/* New Folder Sheet */}
      <AnimatePresence>
        {newFolderData && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setNewFolderData(null)}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80]"
            />
            <motion.div
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] rounded-t-[40px] p-8 pb-12 z-[90] shadow-2xl border-t border-white/10"
            >
               <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
               <h2 className="text-[20px] font-bold mb-6">Create New Folder</h2>
               
               <div className="space-y-8">
                  <div className="space-y-2">
                     <label className="text-[10px] text-[#777777] font-bold uppercase tracking-widest px-1">Folder Name</label>
                     <input 
                       autoFocus
                       type="text" 
                       value={newFolderData.name}
                       onChange={(e) => setNewFolderData({...newFolderData, name: e.target.value})}
                       placeholder="e.g. Work Meetings"
                       className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 focus:border-[#2196F3] outline-none transition-colors"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] text-[#777777] font-bold uppercase tracking-widest px-1">Color Tag</label>
                     <div className="flex flex-wrap gap-3">
                        {colors.map(c => (
                          <button 
                            key={c}
                            onClick={() => setNewFolderData({...newFolderData, color: c})}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${newFolderData.color === c ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'opacity-60'}`}
                            style={{ backgroundColor: c }}
                          >
                            {newFolderData.color === c && <Check className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] text-[#777777] font-bold uppercase tracking-widest px-1">Select Icon</label>
                     <div className="flex flex-wrap gap-3">
                        {icons.map(i => (
                          <button 
                            key={i.name}
                            onClick={() => setNewFolderData({...newFolderData, icon: i.name})}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${newFolderData.icon === i.name ? 'bg-[#2196F3] text-white' : 'bg-white/5 text-[#777777]'}`}
                          >
                             <i.comp className="w-5 h-5" />
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                     <button 
                       onClick={() => setNewFolderData(null)}
                       className="flex-1 h-14 bg-white/5 text-white rounded-2xl font-bold active:bg-white/10"
                     >
                       CANCEL
                     </button>
                     <button 
                       className="flex-1 h-14 bg-[#2196F3] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                     >
                       CREATE
                     </button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
