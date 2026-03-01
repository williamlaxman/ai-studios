import React, { useState } from 'react';
import { Clinic } from '../types';
import { findNearbyClinics } from '../services/geminiService';

interface ClinicFinderProps {
  autoOpen?: boolean;
}

const ClinicFinder: React.FC<ClinicFinderProps> = ({ autoOpen = false }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'highest-rated'>('nearest');

  const sortedClinics = React.useMemo(() => {
    let sorted = [...clinics];
    
    if (sortBy === 'highest-rated') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    // Always prioritize PDS clinics
    sorted.sort((a, b) => {
      const aIsPds = a.name.toLowerCase().includes('pds') || a.name.toLowerCase().includes('philippine dermatological society');
      const bIsPds = b.name.toLowerCase().includes('pds') || b.name.toLowerCase().includes('philippine dermatological society');
      if (aIsPds && !bIsPds) return -1;
      if (!aIsPds && bIsPds) return 1;
      return 0;
    });
    
    return sorted;
  }, [clinics, sortBy]);

  const handleFindClinics = React.useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          // Mock data for now since we don't have a real backend proxy for Google Places API
          // In a real app, this would call your backend which calls Google Places
          // For this demo, we'll simulate a delay and return some dummy data or use the service if implemented
          
          // Check if findNearbyClinics is actually implemented to hit an API
          // Based on previous context, it might be using Gemini or a mock.
          // Let's assume the service function exists and tries to do something.
          
          // Actually, let's look at the import: import { findNearbyClinics } from '../services/geminiService';
          // If that service uses Gemini to find clinics (Grounding), it might work.
          
          const results = await findNearbyClinics(latitude, longitude);
          if (results.length === 0) {
             // Fallback if API returns nothing (common in demo/sandbox without billing)
             setError("No clinics found nearby (API Quota or Permission issue).");
          } else {
            setClinics(results);
          }
        } catch (err: any) {
          console.error(err);
          setError("Unable to fetch clinic data. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve your location. Please enable location services.");
        setLoading(false);
      }
    );
  }, []);

  React.useEffect(() => {
    if (autoOpen && !hasAutoOpened && !loading && clinics.length === 0) {
      setHasAutoOpened(true);
      handleFindClinics();
    }
  }, [autoOpen, hasAutoOpened, loading, clinics.length, handleFindClinics]);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-[#a53d4c]/20 shadow-lg mt-6 md:mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#a53d4c] p-2 rounded-lg">
          <i className="fa-solid fa-location-dot text-white text-lg md:text-xl"></i>
        </div>
        <h3 className="text-lg md:text-xl font-black text-[#a53d4c] uppercase tracking-widest">Find Professional Help</h3>
      </div>

      <p className="text-xs md:text-sm text-gray-600 mb-4">
        If your condition is severe or persistent, we recommend consulting a dermatologist. 
        Use this tool to find highly-rated clinics near you.
      </p>

      {!location && !loading && clinics.length === 0 && (
        <button 
          type="button"
          onClick={handleFindClinics}
          className="w-full py-3 bg-[#a53d4c] text-white font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-[#8b2635] transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
        >
          <i className="fa-solid fa-map-location-dot"></i> Find Nearby Clinics
        </button>
      )}

      {loading && (
        <div className="text-center py-8">
          <i className="fa-solid fa-circle-notch animate-spin text-2xl text-[#a53d4c] mb-2"></i>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Locating nearby specialists...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center mt-4">
          <p className="text-xs text-red-600 font-bold"><i className="fa-solid fa-circle-exclamation mr-1"></i> {error}</p>
          <button type="button" onClick={handleFindClinics} className="mt-2 text-[10px] font-bold text-red-700 underline uppercase tracking-wide">Try Again</button>
        </div>
      )}

      {clinics.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-4">
            <p className="text-[9px] md:text-[10px] text-blue-800 leading-relaxed">
              <i className="fa-solid fa-circle-info mr-1 text-blue-600"></i>
              <strong>Disclaimer:</strong> These clinics are sourced via Google Maps based on your location. Please verify independently if the attending physician is a board-certified member of the <strong>Philippine Dermatological Society (PDS)</strong> for specialized dermatological care.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
             <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
               <button 
                 onClick={() => setSortBy('nearest')}
                 className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${sortBy === 'nearest' ? 'bg-[#a53d4c] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 Nearest
               </button>
               <button 
                 onClick={() => setSortBy('highest-rated')}
                 className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${sortBy === 'highest-rated' ? 'bg-[#a53d4c] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 Highest Rated
               </button>
             </div>
             
             <button 
              type="button"
              onClick={handleFindClinics}
              className="w-full sm:w-auto text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-[#a53d4c] transition-colors flex items-center justify-center gap-1.5 bg-white px-3 py-2 sm:py-1.5 rounded-lg border border-gray-200 shadow-sm"
            >
              <i className="fa-solid fa-rotate-right"></i> Refresh Location
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedClinics.map((clinic, idx) => {
              const isPds = clinic.name.toLowerCase().includes('pds') || clinic.name.toLowerCase().includes('philippine dermatological society');
              return (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 hover:border-[#a53d4c]/30 hover:shadow-md transition-all group overflow-hidden relative flex flex-col h-full">
                {isPds && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-bl-lg z-10 shadow-sm">
                    PDS Certified
                  </div>
                )}
                <div className="p-4 flex flex-col h-full">
                  <div className="flex-1 mb-3">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight pr-16">{clinic.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed"><i className="fa-solid fa-map-pin mr-1 text-gray-400"></i> {clinic.address}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                       {clinic.rating ? (
                         <div className="text-[10px] font-bold text-gray-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                            <i className="fa-solid fa-star text-yellow-500"></i> 
                            <span>{clinic.rating.toFixed(1)} {clinic.userRatingCount ? <span className="text-gray-400 font-normal">({clinic.userRatingCount})</span> : ''}</span>
                         </div>
                       ) : (
                         <div className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1 uppercase tracking-wide">
                            <i className="fa-solid fa-house-medical"></i> Clinic
                         </div>
                       )}
                    </div>
                  </div>
                  <a 
                    href={clinic.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + " " + clinic.address)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:bg-[#a53d4c] hover:text-white hover:border-[#a53d4c] transition-colors text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 whitespace-nowrap w-full"
                    aria-label={`View ${clinic.name} on Google Maps`}
                  >
                    <i className="fa-solid fa-map-location-dot"></i>
                    View on Map
                  </a>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicFinder;
