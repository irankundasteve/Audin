/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import SaveScreen from './components/SaveScreen';
import PlaybackScreen from './components/PlaybackScreen';
import TrimScreen from './components/TrimScreen';
import SettingsScreen from './components/SettingsScreen';
import RecordingSettingsScreen from './components/RecordingSettingsScreen';
import StorageManagementScreen from './components/StorageManagementScreen';
import FolderManagementScreen from './components/FolderManagementScreen';
import CleanupToolsScreen from './components/CleanupToolsScreen';
import AudioEnhanceScreen from './components/AudioEnhanceScreen';
import { RecordingSettings, DEFAULT_SETTINGS } from './types/settings';
import { Folder, Tag } from './types/storage';
import { PRESETS } from './types/settings';

export interface Recording {
  id: string;
  name: string;
  duration: string;
  date: string;
  size?: string;
  tags?: string[];
  audioUrl?: string;
  isActive?: boolean;
}

type Screen = 'home' | 'save' | 'playback' | 'trim' | 'settings' | 'recording-settings' | 'storage' | 'folders' | 'cleanup' | 'enhance';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [trimmingRecording, setTrimmingRecording] = useState<Recording | null>(null);
  const [enhancingRecording, setEnhancingRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [settings, setSettings] = useState<RecordingSettings>(() => {
    const saved = localStorage.getItem('aura_recording_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('aura_recording_settings', JSON.stringify(settings));
  }, [settings]);

  // Global connectivity monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      
      // Attempt load from meta
      const saved = localStorage.getItem('audin_recordings_meta');
      if (saved) {
        try {
          setRecordings(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved recordings");
        }
      } else {
        // Fallback
        setRecordings([
          { id: '1', name: 'Recording_20250122', duration: '2:45', date: 'Jan 22, 2024' },
          { id: '2', name: 'Strategy_Briefing', duration: '12:10', date: 'Jan 21, 2024' },
        ]);
      }
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Sync recordings to local meta
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('audin_recordings_meta', JSON.stringify(recordings));
    }
  }, [recordings, isLoading]);

  const handleStopRecording = (duration: number, audioUrl: string) => {
    setRecordedDuration(duration);
    setRecordedAudioUrl(audioUrl);
    setCurrentScreen('save');
  };

  const handleRecordSelect = (recording: Recording) => {
    setSelectedRecording(recording);
    setCurrentScreen('playback');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = (name: string, tags: string) => {
    const newRecording: Recording = {
      id: Date.now().toString(),
      name: name,
      duration: formatTime(recordedDuration),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      audioUrl: recordedAudioUrl || undefined,
    };
    
    setRecordings(prev => [newRecording, ...prev]);
    setRecordedAudioUrl(null);
    setCurrentScreen('home');
    // In a real app, tags would be saved too
  };

  const handleDiscard = () => {
    setCurrentScreen('home');
  };

  const handleUpdateRecordings = (updated: Recording[]) => {
    setRecordings(updated);
  };

  const handleDeleteRecordings = (ids: string[]) => {
    setRecordings(prev => prev.filter(r => !ids.includes(r.id)));
    // Revoke URLs to free memory
    const deleted = recordings.filter(r => ids.includes(r.id));
    deleted.forEach(r => {
      if (r.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(r.audioUrl);
      }
    });
  };

  const handleStartTrim = (recording: Recording) => {
    setTrimmingRecording(recording);
    setCurrentScreen('trim');
  };

  const handleSaveTrim = (id: string, audioUrl: string, duration: string, overwrite: boolean, newName?: string) => {
    if (overwrite) {
      setRecordings(prev => prev.map(r => r.id === id ? { ...r, audioUrl, duration } : r));
    } else {
      const original = recordings.find(r => r.id === id);
      const newRecording: Recording = {
        id: Date.now().toString(),
        name: newName || `${original?.name || 'Recording'} (trimmed)`,
        duration: duration,
        date: 'Today',
        size: (parseFloat(duration.split(':')[0]) * 60 + parseFloat(duration.split(':')[1]) * 0.032).toFixed(1) + ' MB',
        tags: original?.tags || [],
        audioUrl: audioUrl
      };
      setRecordings(prev => [newRecording, ...prev]);
    }
    setCurrentScreen('playback');
  };

  const handleSaveEnhancement = (id: string, audioUrl: string) => {
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, audioUrl, name: `${r.name} (Enhanced)` } : r));
    setCurrentScreen('playback');
  };

  const handleRenameRecording = (id: string, newName: string) => {
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
  };

  return (
    <div className="bg-[#09090b] min-h-screen relative overflow-hidden">
      {/* Global Connectivity Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="fixed top-0 inset-x-0 h-8 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center z-[200] uppercase tracking-widest"
          >
            Offline Mode • Local on-device storage only
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" />
        ) : (
          <motion.div
            key="screen-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <AnimatePresence mode="wait">
              {currentScreen === 'home' ? (
                <HomeScreen 
                  key="home" 
                  recordings={recordings}
                  isLoading={isLoading}
                  onStop={handleStopRecording} 
                  onSelect={handleRecordSelect}
                  onDelete={handleDeleteRecordings}
                  onRename={handleRenameRecording}
                  onOpenSettings={() => setCurrentScreen('settings')}
                />
              ) : currentScreen === 'save' ? (
                <SaveScreen 
                  key="save" 
                  durationSeconds={recordedDuration}
                  onSave={handleSave}
                  onDiscard={handleDiscard}
                  onBack={() => setCurrentScreen('home')}
                />
              ) : currentScreen === 'playback' ? (
                selectedRecording && (
                    <PlaybackScreen 
                        key="playback"
                        recording={selectedRecording}
                        onBack={() => setCurrentScreen('home')}
                        onTrim={() => handleStartTrim(selectedRecording)}
                        onEnhance={() => {
                          setEnhancingRecording(selectedRecording);
                          setCurrentScreen('enhance');
                        }}
                        onOpenSettings={() => setCurrentScreen('settings')}
                    />
                )
              ) : currentScreen === 'enhance' ? (
                enhancingRecording && (
                  <AudioEnhanceScreen
                    key={enhancingRecording.id}
                    recording={enhancingRecording}
                    onBack={() => setCurrentScreen('playback')}
                    onSave={handleSaveEnhancement}
                  />
                )
              ) : currentScreen === 'trim' ? (
                trimmingRecording && (
                    <TrimScreen
                        key="trim"
                        recording={trimmingRecording}
                        onCancel={() => setCurrentScreen('playback')}
                        onSave={handleSaveTrim}
                    />
                )
              ) : currentScreen === 'settings' ? (
                <SettingsScreen 
                  key="settings"
                  onBack={() => setCurrentScreen('home')}
                  onOpenRecordingSettings={() => setCurrentScreen('recording-settings')}
                  onOpenStorage={() => setCurrentScreen('storage')}
                />
              ) : currentScreen === 'storage' ? (
                <StorageManagementScreen 
                  key="storage"
                  onBack={() => setCurrentScreen('settings')}
                  onOpenFolders={() => setCurrentScreen('folders')}
                  onOpenCleanup={() => setCurrentScreen('cleanup')}
                />
              ) : currentScreen === 'folders' ? (
                <FolderManagementScreen 
                  key="folders"
                  onBack={() => setCurrentScreen('storage')}
                />
              ) : currentScreen === 'cleanup' ? (
                <CleanupToolsScreen 
                  key="cleanup"
                  onBack={() => setCurrentScreen('storage')}
                />
              ) : (
                <RecordingSettingsScreen 
                  key="recording-settings"
                  settings={settings}
                  onUpdate={setSettings}
                  onBack={() => setCurrentScreen('settings')}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
