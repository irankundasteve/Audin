
import React, { useEffect, useRef } from "react";

interface SpectrumAnalyzerProps {
  data: Uint8Array;
  color?: string;
  count?: number;
}

export default function SpectrumAnalyzer({ data, color = "#2196F3", count = 32 }: SpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / count;
      const step = Math.floor(data.length / count);

      for (let i = 0; i < count; i++) {
        const value = data[i * step] || 0;
        const barHeight = (value / 255) * height;
        
        ctx.fillStyle = color;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
      }
    };

    render();
  }, [data, color, count]);

  return <canvas ref={canvasRef} width={300} height={40} className="w-full h-10" />;
}
