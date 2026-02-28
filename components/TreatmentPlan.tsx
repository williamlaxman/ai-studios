import React from 'react';

interface TreatmentPlanProps {
  plan: string[];
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({ plan }) => {
  const amRoutine = plan.filter(item => typeof item === 'string' && item.startsWith('AM:'));
  const pmRoutine = plan.filter(item => typeof item === 'string' && item.startsWith('PM:'));
  const otherItems = plan.filter(item => typeof item === 'string' && !item.startsWith('AM:') && !item.startsWith('PM:'));

  const renderRoutineItem = (item: string) => {
    // Remove the prefix "AM: " or "PM: "
    const cleanItem = item.replace(/^(AM|PM):\s*/, '');
    return (
      <li className="text-[10px] md:text-xs text-gray-700 flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="bg-green-50 p-1.5 rounded-full flex-shrink-0 mt-0.5">
          <i className="fa-solid fa-check text-green-600 text-[8px]"></i>
        </div>
        <span className="leading-relaxed">{cleanItem}</span>
      </li>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs md:text-sm font-black text-green-800 uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-clipboard-list text-green-600"></i> Personalized Routine
        </h4>
        <span className="text-[9px] font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full uppercase tracking-wide">
          Daily Plan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Routine */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fa-regular fa-sun text-6xl text-yellow-500"></i>
          </div>
          <h5 className="text-[10px] md:text-xs font-bold text-yellow-800 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
            <i className="fa-regular fa-sun text-yellow-600"></i> Morning (AM)
          </h5>
          <ul className="space-y-3 relative z-10">
            {amRoutine.length > 0 ? (
              amRoutine.map((item, idx) => <React.Fragment key={idx}>{renderRoutineItem(item)}</React.Fragment>)
            ) : (
              <p className="text-[10px] text-gray-500 italic">No specific morning routine steps provided.</p>
            )}
          </ul>
        </div>

        {/* Evening Routine */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fa-regular fa-moon text-6xl text-indigo-500"></i>
          </div>
          <h5 className="text-[10px] md:text-xs font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
            <i className="fa-regular fa-moon text-indigo-600"></i> Evening (PM)
          </h5>
          <ul className="space-y-3 relative z-10">
            {pmRoutine.length > 0 ? (
              pmRoutine.map((item, idx) => <React.Fragment key={idx}>{renderRoutineItem(item)}</React.Fragment>)
            ) : (
              <p className="text-[10px] text-gray-500 italic">No specific evening routine steps provided.</p>
            )}
          </ul>
        </div>
      </div>

      {/* Lifestyle & Notes */}
      {otherItems.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <h5 className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-notes-medical text-gray-400"></i> Lifestyle & Important Notes
          </h5>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherItems.map((item, idx) => (
              <li key={idx} className="text-[10px] md:text-xs text-gray-600 flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100">
                <i className="fa-solid fa-info-circle text-blue-400 mt-0.5 text-[10px]"></i>
                <span>{item.replace(/^(Lifestyle|Note|URGENT):\s*/i, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlan;
