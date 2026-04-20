
export type EffectType = 'noise-reduction' | 'eq' | 'compressor' | 'limiter' | 'reverb' | 'voice-enhance';

export interface BaseEffectConfig {
  id: string;
  type: EffectType;
  enabled: boolean;
  name: string;
}

export interface NoiseReductionConfig extends BaseEffectConfig {
  type: 'noise-reduction';
  mode: 'basic' | 'advanced' | 'adaptive';
  strength: number; // 0-100
}

export interface EQConfig extends BaseEffectConfig {
  type: 'eq';
  bands: {
    frequency: number;
    gain: number;
    q: number;
    type: BiquadFilterType;
  }[];
}

export interface CompressorConfig extends BaseEffectConfig {
  type: 'compressor';
  threshold: number; // -100 to 0
  ratio: number; // 1 to 20
  attack: number; // 0 to 1 (seconds)
  release: number; // 0 to 1 (seconds)
  knee: number; // 0 to 40
}

export interface VoiceEnhanceConfig extends BaseEffectConfig {
  type: 'voice-enhance';
  clarity: number; // 0-100
  presence: number; // 0-100
  proximity: number; // 0-100
}

export type EffectConfig = NoiseReductionConfig | EQConfig | CompressorConfig | VoiceEnhanceConfig;

export interface EffectChain {
  id: string;
  name: string;
  effects: EffectConfig[];
}

export interface AudioStats {
  peak: number;
  rms: number;
  lufs?: number;
  dynamicRange: number;
}
