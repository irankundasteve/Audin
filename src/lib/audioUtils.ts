/**
 * Generates an array of peak values from an audio URL.
 * @param url The URL of the audio file.
 * @param samples The number of peaks to generate.
 * @returns A promise that resolves to an array of numbers (0-1).
 */
export async function getAudioPeaks(url: string, samples: number = 60): Promise<number[]> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const channelData = decodedBuffer.getChannelData(0); // Use first channel
    const blockSize = Math.floor(channelData.length / samples);
    const peaks = [];
    
    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    
    // Normalize to 0-1 range
    const maxPeak = Math.max(...peaks);
    if (maxPeak > 0) {
      return peaks.map(p => p / maxPeak);
    }
    return peaks;
  } catch (error) {
    console.error("Failed to generate peaks:", error);
    // Fallback to random/sin if failed to avoid empty UI
    return [...Array(samples)].map((_, i) => 0.2 + Math.abs(Math.sin(i * 0.2)) * 0.5);
  }
}

/**
 * Parses "MM:SS" or "HH:MM:SS" into total seconds.
 */
export function parseDuration(durationStr: string): number {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}
