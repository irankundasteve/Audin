
import { EffectConfig, EQConfig, CompressorConfig } from "../types/effects";

export class AudioEngine {
  private context: AudioContext;
  private source: MediaStreamAudioSourceNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private analyzer: AnalyserNode;
  
  private effectNodes: AudioNode[] = [];
  private limiter: DynamicsCompressorNode;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 256;
    
    // Safety Limiter
    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.1;
  }

  public async setupRecording(stream: MediaStream): Promise<MediaStream> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    this.source = this.context.createMediaStreamSource(stream);
    this.destination = this.context.createMediaStreamDestination();
    
    // Connect source through analyzer and limiter
    this.source.connect(this.analyzer);
    this.analyzer.connect(this.limiter);
    this.limiter.connect(this.destination);
    
    return this.destination.stream;
  }

  public applyEffectChain(configs: EffectConfig[]) {
    // Basic implementation: disconnect all existing nodes and rebuild
    if (!this.source || !this.destination) return;

    this.source.disconnect();
    this.analyzer.disconnect();
    this.limiter.disconnect();
    this.effectNodes.forEach(node => node.disconnect());
    this.effectNodes = [];

    let lastNode: AudioNode = this.source;

    configs.forEach(config => {
      if (!config.enabled) return;

      if (config.type === 'compressor') {
        const comp = this.createCompressor(config);
        lastNode.connect(comp);
        lastNode = comp;
        this.effectNodes.push(comp);
      } else if (config.type === 'eq') {
        const filters = this.createEQ(config);
        filters.forEach(filter => {
          lastNode.connect(filter);
          lastNode = filter;
          this.effectNodes.push(filter);
        });
      }
    });

    lastNode.connect(this.analyzer);
    this.analyzer.connect(this.limiter);
    this.limiter.connect(this.destination);
  }

  private createCompressor(config: CompressorConfig): DynamicsCompressorNode {
    const comp = this.context.createDynamicsCompressor();
    comp.threshold.value = config.threshold;
    comp.ratio.value = config.ratio;
    comp.attack.value = config.attack;
    comp.release.value = config.release;
    comp.knee.value = config.knee;
    return comp;
  }

  private createEQ(config: EQConfig): BiquadFilterNode[] {
    return config.bands.map(band => {
      const filter = this.context.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.q;
      return filter;
    });
  }

  public getAnalyzerData(): Uint8Array {
    const data = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(data);
    return data;
  }

  public close() {
    this.context.close();
  }
}
