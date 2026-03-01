import React from 'react';

interface DiagnosisCardProps {
  severity: string;
  acneType: string;
  predictions?: { class: string; confidence: number }[];
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ severity, acneType, predictions }) => {
  const normalizeSeverity = (sev: string) => {
    if (!sev) return 'Unknown';
    const lowerSev = sev.toLowerCase();
    if (lowerSev.includes('normal') || lowerSev.includes('clear') || lowerSev.includes('none')) return 'Normal';
    if (lowerSev.includes('mild')) return 'Mild';
    if (lowerSev.includes('moderate')) return 'Moderate';
    if (lowerSev.includes('severe')) return 'Severe';
    return sev; // Fallback to original if no match
  };

  const normalizedSeverity = normalizeSeverity(severity);

  const getSeverityConfig = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'normal':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-100',
          icon: 'fa-face-grin-stars',
          label: 'Normal / Clear Skin'
        };
      case 'mild': 
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-100',
          icon: 'fa-face-smile',
          label: 'Mild Condition'
        };
      case 'moderate': 
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-100',
          icon: 'fa-face-meh',
          label: 'Moderate Condition'
        };
      case 'severe': 
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-100',
          icon: 'fa-face-frown',
          label: 'Severe Condition'
        };
      default: 
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-100',
          icon: 'fa-circle-question',
          label: 'Unknown Severity'
        };
    }
  };

  const config = getSeverityConfig(normalizedSeverity);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 ${config.bg} rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-50`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
            <i className="fa-solid fa-user-doctor text-sm"></i>
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">AI Diagnosis</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Severity Level</span>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
              <i className={`fa-solid ${config.icon} text-sm`}></i>
              <span className="text-sm font-bold">{config.label}</span>
            </div>
          </div>
          
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Detected Conditions</span>
            <div className="text-lg font-bold text-gray-900 leading-tight break-words mb-3 capitalize">
              {predictions && predictions.length > 0 
                ? predictions.map(p => p.class).join(", ") 
                : (acneType || "Unspecified Acne")}
            </div>
            
            {predictions && predictions.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Model Confidence</span>
                {predictions.slice(0, 5).map((pred, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-medium text-gray-600 mb-1">
                        <span>{pred.class}</span>
                        <span>{(pred.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#a53d4c] rounded-full" 
                          style={{ width: `${pred.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-[8px] md:text-[9px] text-gray-400 mt-3 italic leading-relaxed">
                  <i className="fa-solid fa-circle-info mr-1"></i>
                  If you feel that the diagnosis is wrong or missing other types, try adjusting the <strong>Detection Confidence</strong> slider.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisCard;
