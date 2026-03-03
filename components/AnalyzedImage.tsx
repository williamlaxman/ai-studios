import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult } from '../types';

interface AnalyzedImageProps {
  result: AnalysisResult | null;
  confidenceThreshold: number;
}

const AnalyzedImage: React.FC<AnalyzedImageProps> = ({ result, confidenceThreshold }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!result) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [result, imageLoaded]);

  if (!result) {
    return (
      <div className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <i className="fa-regular fa-image text-4xl mb-3"></i>
        <p className="text-sm font-medium">No image analyzed yet</p>
      </div>
    );
  }

  const threshold = confidenceThreshold;
  const filteredPredictions = result.predictions.filter(
    (p) => p.confidence >= threshold
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-black/5"
    >
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
          <i className="fa-solid fa-circle-notch animate-spin text-gray-400 text-2xl"></i>
        </div>
      )}
      
      <img 
        src={result.imageUrl} 
        alt="Analyzed Skin" 
        className="w-full h-auto block"
        onLoad={() => setImageLoaded(true)}
        referrerPolicy="no-referrer"
      />

      {imageLoaded && dimensions.width > 0 && filteredPredictions.map((prediction, idx) => {
        // Calculate percentages for positioning
        const leftPercent = ((prediction.x - prediction.width / 2) / result.imageDimensions.width) * 100;
        const topPercent = ((prediction.y - prediction.height / 2) / result.imageDimensions.height) * 100;
        const widthPercent = (prediction.width / result.imageDimensions.width) * 100;
        const heightPercent = (prediction.height / result.imageDimensions.height) * 100;

        const type = prediction.class.toLowerCase();
        let colorClass = 'border-red-500 bg-red-500/20 text-red-700';
        let badgeBg = 'bg-red-500 text-white';

        if (type.includes('blackhead')) {
          colorClass = 'border-gray-800 bg-gray-800/20 text-gray-900';
          badgeBg = 'bg-gray-800 text-white';
        } else if (type.includes('whitehead')) {
          colorClass = 'border-gray-200 bg-gray-100/40 text-gray-800';
          badgeBg = 'bg-gray-200 text-gray-800';
        } else if (type.includes('papule')) {
          colorClass = 'border-orange-500 bg-orange-500/20 text-orange-800';
          badgeBg = 'bg-orange-500 text-white';
        } else if (type.includes('nodule') || type.includes('cyst')) {
          colorClass = 'border-red-900 bg-red-900/20 text-red-900';
          badgeBg = 'bg-red-900 text-white';
        }

        return (
          <div
            key={idx}
            className={`absolute border-2 rounded-sm transition-all duration-300 hover:bg-opacity-40 group ${colorClass}`}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
          >
            {/* Label Badge */}
            <div className={`absolute -top-6 left-0 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 ${badgeBg}`}>
              {prediction.class} {(prediction.confidence * 100).toFixed(0)}%
            </div>
            
            {/* Persistent small indicator if box is too small */}
            <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full shadow-sm flex items-center justify-center text-[8px] md:hidden ${badgeBg}`}>
              <i className="fa-solid fa-crosshairs"></i>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyzedImage;
