import React from 'react';
import { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-rose-200 hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-bullseye text-rose-500"></i>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {(stats.avgConfidence * 100).toFixed(0)}<span className="text-sm text-gray-400">%</span>
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Confidence</div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-amber-200 hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-layer-group text-amber-500"></i>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {stats.acneTypesFound}
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Types Detected</div>
      </div>
    </div>
  );
};

export default StatsCards;