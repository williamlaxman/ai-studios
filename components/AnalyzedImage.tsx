import React, { useEffect, useRef } from 'react';
import { AnalysisResult } from '../types';

interface AnalyzedImageProps {
  result: AnalysisResult | null;
  confidenceThreshold?: number;
}

const AnalyzedImage: React.FC<AnalyzedImageProps> = ({ result, confidenceThreshold = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = result.imageUrl;
    img.onload = () => {
      // Scale canvas to match image or container
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const scale = containerWidth / result.imageDimensions.width;
      
      canvas.width = containerWidth;
      canvas.height = result.imageDimensions.height * scale;

      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Filter predictions based on confidence threshold
      const filteredPredictions = result.predictions.filter(p => p.confidence >= confidenceThreshold);

      // Draw predictions
      filteredPredictions.forEach((pred) => {
        const x = (pred.x - pred.width / 2) * scale;
        const y = (pred.y - pred.height / 2) * scale;
        const w = pred.width * scale;
        const h = pred.height * scale;

        // Choose color based on class
        let color = '#3b82f6'; // Default blue
        if (pred.class.toLowerCase().includes('pustule')) color = '#ef4444'; // Red
        if (pred.class.toLowerCase().includes('blackhead')) color = '#1f2937'; // Dark gray
        if (pred.class.toLowerCase().includes('papule')) color = '#f97316'; // Orange

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Draw label background
        ctx.fillStyle = color;
        const labelText = `${pred.class} ${(pred.confidence * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(labelText, x + 5, y - 8);
      });
    };
  }, [result, confidenceThreshold]);

  if (!result) {
    return (
      <div className="w-full h-96 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
        <div className="text-center">
          <i className="fa-regular fa-image text-4xl mb-2"></i>
          <p>Analyzed image will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <canvas ref={canvasRef} className="max-w-full h-auto block" />
    </div>
  );
};

export default AnalyzedImage;
