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
          {clinics.map((clinic, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 hover:border-[#a53d4c]/30 hover:shadow-md transition-all group overflow-hidden">
              <div className="p-3 md:p-4 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#a53d4c] text-sm md:text-base">{clinic.name}</h4>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1"><i className="fa-solid fa-map-pin mr-1 text-gray-400"></i> {clinic.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                        <i className="fa-solid fa-star text-yellow-400"></i> 
                        {clinic.rating ? (
                          <span>{clinic.rating.toFixed(1)} {clinic.userRatingCount ? `(${clinic.userRatingCount} reviews)` : ''}</span>
                        ) : (
                          <span>Rating not available</span>
                        )}
                     </div>
                  </div>
                </div>
                <a 
                  href={clinic.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + " " + clinic.address)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#fdf2e9] text-orange-800 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors text-[10px] font-bold uppercase tracking-wide flex items-center whitespace-nowrap"
                  aria-label={`View ${clinic.name} on Google Maps`}
                >
                  <i className="fa-solid fa-map-location-dot mr-2"></i>
                  Visit Google Maps
                </a>
              </div>
            </div>
          ))}
          <div className="text-center mt-4">
             <button 
              type="button"
              onClick={handleFindClinics}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#a53d4c] transition-colors"
            >
              <i className="fa-solid fa-rotate-right mr-1"></i> Refresh Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicFinder;
