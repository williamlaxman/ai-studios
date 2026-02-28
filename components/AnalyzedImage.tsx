import React, { useEffect, useRef, useState } from 'react';
import { AnalysisResult } from '../types';

interface AnalyzedImageProps {
  result: AnalysisResult | null;
  confidenceThreshold: number;
}

const AnalyzedImage: React.FC<AnalyzedImageProps> = ({ result, confidenceThreshold }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!result) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle potential CORS issues if image is from external URL
    img.src = result.imageUrl;

    img.onload = () => {
      setImageLoaded(true);
      // Determine canvas dimensions based on container width while maintaining aspect ratio
      // We use the parent element's width, but cap it at the image's natural width if it's smaller
      // to avoid upscaling artifacts, or cap at a max width for layout.
      const container = canvas.parentElement;
      const containerWidth = container ? container.clientWidth : 800;
      
      // Calculate scale factor
      const scale = containerWidth / img.width;
      
      canvas.width = containerWidth;
      canvas.height = img.height * scale;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Filter predictions
      // Confidence threshold from slider is 0-100.
      // Predictions from Roboflow are 0.0 - 1.0.
      const threshold = confidenceThreshold / 100;
      
      const filteredPredictions = result.predictions.filter(
        (p) => p.confidence >= threshold
      );

      console.log(`Filtering: Slider=${confidenceThreshold}, Threshold=${threshold}, Total=${result.predictions.length}, Visible=${filteredPredictions.length}`);

      // Draw bounding boxes and labels
      filteredPredictions.forEach((prediction) => {
        // Scale coordinates
        const x = (prediction.x - prediction.width / 2) * scale;
        const y = (prediction.y - prediction.height / 2) * scale;
        const w = prediction.width * scale;
        const h = prediction.height * scale;

        // Color coding based on class
        let strokeColor = '#ef4444'; // red-500 default
        let fillColor = 'rgba(239, 68, 68, 0.2)';

        const type = prediction.class.toLowerCase();
        if (type.includes('blackhead')) {
            strokeColor = '#1f2937'; // gray-800
            fillColor = 'rgba(31, 41, 55, 0.2)';
        } else if (type.includes('whitehead')) {
            strokeColor = '#f3f4f6'; // gray-100 (white-ish)
            fillColor = 'rgba(243, 244, 246, 0.2)';
        } else if (type.includes('papule')) {
            strokeColor = '#f97316'; // orange-500
            fillColor = 'rgba(249, 115, 22, 0.2)';
        } else if (type.includes('pustule')) {
            strokeColor = '#ef4444'; // red-500
            fillColor = 'rgba(239, 68, 68, 0.2)';
        } else if (type.includes('nodule') || type.includes('cyst')) {
            strokeColor = '#7f1d1d'; // red-900
            fillColor = 'rgba(127, 29, 29, 0.2)';
        }

        // Draw Box
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Draw Fill
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        // Draw Label Background
        ctx.fillStyle = strokeColor;
        const text = `${prediction.class} ${(prediction.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 12px Inter, sans-serif';
        const textMetrics = ctx.measureText(text);
        const textHeight = 16; // Approx height
        const textPadding = 4;
        
        // Ensure label stays within canvas bounds
        let labelY = y - textHeight - textPadding;
        if (labelY < 0) labelY = y + h + textPadding;

        ctx.fillRect(x, labelY, textMetrics.width + (textPadding * 2), textHeight + textPadding);

        // Draw Label Text
        ctx.fillStyle = '#ffffff';
        // Adjust text color for whiteheads/light backgrounds if needed, but white usually works on colored bg
        if (type.includes('whitehead')) ctx.fillStyle = '#000000';
        
        ctx.fillText(text, x + textPadding, labelY + textHeight - 2);
      });
    };
  }, [result, confidenceThreshold]);

  if (!result) {
    return (
      <div className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <i className="fa-regular fa-image text-4xl mb-3"></i>
        <p className="text-sm font-medium">No image analyzed yet</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-black/5">
       {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-circle-notch animate-spin text-gray-400 text-2xl"></i>
          </div>
       )}
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>
  );
};

export default AnalyzedImage;
