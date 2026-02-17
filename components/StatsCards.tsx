import React from 'react';
import { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats;
}

const StatsCircle: React.FC<{ label: string, value: string, sub: string, colorClass: string, bgClass: string }> = ({ label, value, sub, colorClass, bgClass }) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-28 h-28 rounded-full border-[10px] ${colorClass} ${bgClass} flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105`}>
        <span className="text-xl font-extrabold text-[#4a2c2a]">{value}</span>
        <span className="text-[8px] font-bold text-[#4a2c2a] uppercase">{sub}</span>
      </div>
      <p className="mt-3 text-[10px] font-black text-[#a53d4c] uppercase tracking-tighter text-center max-w-[100px] leading-tight">{label}</p>
    </div>
  );
};

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="bg-[#fff9f0] rounded-[2.5rem] p-8 shadow-md border border-[#f3d9b1] h-full">
      <div className="text-[#a53d4c] font-black text-2xl uppercase tracking-tighter mb-8 text-center border-b-2 border-[#a53d4c]/20 pb-4">
        Model Comparison Data
      </div>
      <div className="flex flex-col gap-10 items-center justify-center h-full pb-8">
        <StatsCircle 
          label="Lesions Detected" 
          value={`${stats.totalDetections}`} 
          sub="Detections" 
          colorClass="border-[#a53d4c]"
          bgClass="bg-[#fde2e4]"
        />
        <StatsCircle 
          label="AI Model Confidence" 
          value={`${(stats.avgConfidence * 100).toFixed(1)}%`} 
          sub="Confidence" 
          colorClass="border-[#7a2833]"
          bgClass="bg-[#e9c46a]/20"
        />
        <StatsCircle 
          label="Classification Score" 
          value={`${stats.acneTypesFound}`} 
          sub="Types" 
          colorClass="border-[#e9c46a]"
          bgClass="bg-[#fff3b0]"
        />
      </div>
    </div>
  );
};

export default StatsCards;