export type AudioFormat = 'AAC' | 'MP3' | 'WAV' | 'FLAC' | 'OPUS' | 'AMR';
export type QualityPreset = 'low' | 'medium' | 'high' | 'lossless' | 'custom';
export type MicrophoneSource = 'built-in' | 'external' | 'bluetooth' | 'line-in' | 'phone';
export type noiseReductionMode = 'off' | 'basic' | 'advanced';
export type stopCondition = 'silence' | 'time' | 'storage' | 'battery';

export interface RecordingSettings {
  qualityPreset: QualityPreset;
  format: AudioFormat;
  bitrate: number; // kbps
  sampleRate: number; // Hz
  channels: 'mono' | 'stereo';
  
  source: MicrophoneSource;
  noiseReduction: noiseReductionMode;
  autoGain: boolean;
  windFilter: boolean;
  popFilter: boolean;
  limiter: boolean;
  
  autoStartVoice: boolean;
  voiceSensitivity: number; // 1-10
  autoStopSilence: boolean;
  silenceDuration: number; // seconds
  preRollBuffer: boolean;
  bufferDuration: number; // seconds
  
  vbr: boolean; // Variable Bitrate
  encodingComplexity: number; // 1-10
}

export const DEFAULT_SETTINGS: RecordingSettings = {
  qualityPreset: 'medium',
  format: 'AAC',
  bitrate: 64,
  sampleRate: 22050,
  channels: 'mono',
  
  source: 'built-in',
  noiseReduction: 'off',
  autoGain: false,
  windFilter: false,
  popFilter: false,
  limiter: false,
  
  autoStartVoice: false,
  voiceSensitivity: 5,
  autoStopSilence: false,
  silenceDuration: 10,
  preRollBuffer: false,
  bufferDuration: 5,
  
  vbr: true,
  encodingComplexity: 5,
};

export const PRESETS: Record<QualityPreset, Partial<RecordingSettings>> = {
  low: {
    format: 'AAC',
    bitrate: 32,
    sampleRate: 16000,
    channels: 'mono',
  },
  medium: {
    format: 'AAC',
    bitrate: 64,
    sampleRate: 22050,
    channels: 'mono',
  },
  high: {
    format: 'AAC',
    bitrate: 128,
    sampleRate: 44100,
    channels: 'stereo',
  },
  lossless: {
    format: 'WAV',
    bitrate: 1411,
    sampleRate: 44100,
    channels: 'stereo',
  },
  custom: {}
};
