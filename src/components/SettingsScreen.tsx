import { ChevronLeft, ChevronRight, Mic, HardDrive, Bell, Shield, Info, Palette, Globe, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

interface SettingsScreenProps {
  onBack: () => void;
  onOpenRecordingSettings: () => void;
  onOpenStorage: () => void;
  key?: string | number;
}

export default function SettingsScreen({ onBack, onOpenRecordingSettings, onOpenStorage }: SettingsScreenProps) {
  const sections = [
    {
      title: "Audio & Recording",
      items: [
        { label: "Recording Settings", icon: Mic, onClick: onOpenRecordingSettings, value: "Medium Quality" },
        { label: "Storage & Backup", icon: HardDrive, desc: "Managing 15.2 GB available", onClick: onOpenStorage },
      ]
    },
    {
      title: "App Preferences",
      items: [
        { label: "Notifications", icon: Bell, disabled: true },
        { label: "Appearance", icon: Palette, desc: "System Default", disabled: true },
        { label: "Language", icon: Globe, desc: "English (US)", disabled: true },
      ]
    },
    {
      title: "Security & Support",
      items: [
        { label: "Privacy & Permissions", icon: Shield, disabled: true },
        { label: "Help & Feedback", icon: HelpCircle, disabled: true },
        { label: "About Audio Recorder", icon: Info, disabled: true },
      ]
    }
  ];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-white overflow-hidden"
    >
      {/* Header */}
      <header className="h-[64px] px-2 flex items-center bg-[#09090b] border-b border-white/5">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-bold ml-2">Settings</h1>
      </header>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="px-6 text-[10px] text-[#777777] font-bold uppercase tracking-[0.2em] mb-4">{section.title}</h3>
            <div className="bg-[#1E1E1E]/30 border-y border-white/5 divide-y divide-white/5">
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`w-full px-6 py-4 flex items-center justify-between active:bg-white/5 transition-colors ${item.disabled ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#AAAAAA]">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[15px]">{item.label}</p>
                      {item.desc && <p className="text-[11px] text-[#777777]">{item.desc}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.value && <span className="text-[12px] text-[#2196F3] font-medium">{item.value}</span>}
                    <ChevronRight className="w-4 h-4 text-[#444444]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-6 py-8 text-center space-y-2">
            <p className="text-[12px] text-[#444444] font-bold uppercase tracking-widest">Aura Voice Recorder</p>
            <p className="text-[10px] text-[#222222]">Version 1.2.0 • SPECIALIST EDITION</p>
        </div>
      </div>
    </motion.div>
  );
}
