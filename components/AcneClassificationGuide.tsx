import React from 'react';

const acneTypes = [
  {
    name: 'Comedones (Whiteheads & Blackheads)',
    description: 'Non-inflammatory acne lesions. Whiteheads are closed clogged pores, while blackheads are open clogged pores where the oil has oxidized.',
    treatments: ['Salicylic Acid', 'Retinoids (Adapalene)', 'Benzoyl Peroxide'],
    severity: 'Mild'
  },
  {
    name: 'Papules',
    description: 'Small, red, tender bumps caused by inflamed or infected hair follicles. They do not have a visible pus-filled tip.',
    treatments: ['Benzoyl Peroxide', 'Salicylic Acid', 'Topical Antibiotics'],
    severity: 'Mild to Moderate'
  },
  {
    name: 'Pustules',
    description: 'Similar to papules but filled with white or yellow pus. They often have a red ring around the base.',
    treatments: ['Benzoyl Peroxide', 'Topical Retinoids', 'Topical Antibiotics'],
    severity: 'Mild to Moderate'
  },
  {
    name: 'Nodules',
    description: 'Large, solid, painful lumps beneath the surface of the skin. They develop when clogged pores damage tissues deep within the skin.',
    treatments: ['Oral Antibiotics', 'Isotretinoin', 'Professional Extraction'],
    severity: 'Moderate to Severe'
  },
  {
    name: 'Cysts',
    description: 'Deep, painful, pus-filled lesions that can cause scarring. This is the most severe form of acne.',
    treatments: ['Isotretinoin', 'Corticosteroid Injections', 'Oral Contraceptives (for hormonal acne)'],
    severity: 'Severe'
  }
];

const AcneClassificationGuide: React.FC = () => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-[#a53d4c]/20 shadow-lg mt-6 md:mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#a53d4c] p-2 rounded-lg">
          <i className="fa-solid fa-book-medical text-white text-lg md:text-xl"></i>
        </div>
        <h3 className="text-lg md:text-xl font-black text-[#a53d4c] uppercase tracking-widest">Acne Classification Guide</h3>
      </div>
      
      <p className="text-xs md:text-sm text-gray-600 mb-6">
        Understanding the different types of acne is crucial for selecting the right treatment. 
        Here is a quick reference guide to common acne lesions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {acneTypes.map((type, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-[#a53d4c]/30 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-[#a53d4c] text-sm md:text-base">{type.name}</h4>
              <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${
                type.severity.includes('Severe') ? 'bg-red-100 text-red-700' :
                type.severity.includes('Moderate') ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {type.severity}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">{type.description}</p>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Common Treatments:</span>
              <div className="flex flex-wrap gap-1">
                {type.treatments.map((t, i) => (
                  <span key={i} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcneClassificationGuide;
