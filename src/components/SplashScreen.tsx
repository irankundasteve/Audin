import { motion } from "motion/react";
import { Mic } from "lucide-react";

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#3b82f6] to-[#2dd4bf] flex items-center justify-center mb-6 shadow-2xl">
          <Mic className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-[#fafafa] text-xl font-bold tracking-tight">Voice Recorder</h1>
      </motion.div>

      <div className="absolute bottom-10">
        <span className="text-[#3f3f46] text-[10px] font-bold tracking-[0.1em] uppercase">Version 1.0.4</span>
      </div>
    </motion.div>
  );
}
