import React, { useState } from 'react';
import { AnalysisResult } from '../types';

interface AnalyzedImageProps {
  result: AnalysisResult | null;
}

const AnalyzedImage: React.FC<AnalyzedImageProps> = ({ result }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!result) {
    return (
      <div className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <i className="fa-regular fa-image text-4xl mb-3"></i>
        <p className="text-sm font-medium">No image analyzed yet</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-black/5"
    >
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
          <i className="fa-solid fa-circle-notch animate-spin text-gray-400 text-2xl"></i>
        </div>
      )}
      
      <img 
        src={result.annotatedImageUrl || result.imageUrl} 
        alt="Analyzed Skin" 
        className="w-full h-auto block"
        onLoad={() => setImageLoaded(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default AnalyzedImage;
