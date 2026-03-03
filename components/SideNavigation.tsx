import React, { useEffect, useState } from 'react';

interface Section {
  id: string;
  label: string;
  icon: string;
}

const sections: Section[] = [
  { id: 'section-upload', label: 'Upload', icon: 'fa-camera' },
  { id: 'section-analysis', label: 'Analysis', icon: 'fa-chart-pie' },
  { id: 'section-assessment', label: 'Assessment', icon: 'fa-user-doctor' },
  { id: 'section-products', label: 'FDA Verification', icon: 'fa-clipboard-check' },
  { id: 'section-clinics', label: 'Clinic Finder', icon: 'fa-map-location-dot' },
];

const SideNavigation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-10% 0px -10% 0px', // More forgiving margin
        threshold: 0, // Trigger as soon as any part is visible
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className={`
      fixed z-50 flex pointer-events-none
      /* Mobile Styles: Bottom Dock */
      bottom-6 left-1/2 -translate-x-1/2 flex-row gap-1 p-1.5
      bg-white/90 backdrop-blur-lg rounded-full shadow-2xl border border-gray-200/50
      /* Desktop Styles: Right Floating Rail */
      md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:border-none md:p-0
      md:bottom-auto md:left-auto md:right-4 lg:right-8 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:gap-4 md:items-end
    `}>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className={`group flex items-center justify-center md:justify-end gap-2 md:gap-3 transition-all duration-300 pointer-events-auto relative
            ${activeSection === section.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
          `}
          aria-label={`Scroll to ${section.label}`}
        >
          {/* Label: Desktop Only (Hover/Active) */}
          <span className={`
            hidden md:block text-[10px] font-bold uppercase tracking-widest text-[#a53d4c] bg-white/90 px-2 py-1 rounded shadow-sm transition-all duration-300 backdrop-blur-sm border border-[#a53d4c]/10
            ${activeSection === section.id ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}
          `}>
            {section.label}
          </span>

          {/* Icon Circle */}
          <div className={`
            w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 backdrop-blur-sm
            ${activeSection === section.id 
              ? 'bg-[#a53d4c] text-white border-[#a53d4c] scale-110 shadow-md' 
              : 'bg-transparent md:bg-white/80 text-gray-500 md:text-gray-400 border-transparent md:border-gray-200 group-hover:border-[#a53d4c] group-hover:text-[#a53d4c] group-hover:bg-white'}
          `}>
            <i className={`fa-solid ${section.icon} text-xs md:text-sm`}></i>
          </div>
          
          {/* Mobile Active Indicator Dot */}
          {activeSection === section.id && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#a53d4c] rounded-full md:hidden"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default SideNavigation;
