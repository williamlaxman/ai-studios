import React, { useState, useRef, useEffect } from 'react';
import { Stats, AnalysisResult } from './types';
import StatsCards from './components/StatsCards';
import AnalyzedImage from './components/AnalyzedImage';
import { analyzeImage, isDemoMode, DEFAULT_API_KEY, DEFAULT_MODEL_ENDPOINT } from './services/roboflowService';
import { getSkinCareInsights } from './services/geminiService';

const App: React.FC = () => {
  // App State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('acne_away_api_key') || DEFAULT_API_KEY);
  const [modelId, setModelId] = useState(localStorage.getItem('acne_away_model_id') || DEFAULT_MODEL_ENDPOINT);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Upload Feedback State
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    acneTypesFound: 0,
    avgConfidence: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('apiKey');
    const urlModel = params.get('modelId');
    if (urlKey || urlModel) {
      if (urlKey) localStorage.setItem('acne_away_api_key', urlKey);
      if (urlModel) localStorage.setItem('acne_away_model_id', urlModel);
      window.location.href = window.location.origin + window.location.pathname;
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('acne_away_api_key', apiKey);
    localStorage.setItem('acne_away_model_id', modelId);
    setShowSettings(false);
    window.location.reload(); 
  };

  const handleShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?apiKey=${encodeURIComponent(apiKey)}&modelId=${encodeURIComponent(modelId)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        setUploadStatus('error');
        setError('Please upload a valid image file.');
        return;
      }

      // Reset states
      setUploadStatus('uploading');
      setUploadProgress(0);
      setSelectedFile(null); // Clear previous file until upload 'finishes'
      setResult(null);
      setInsights(null);
      setError(null);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setSelectedFile(file);
            setUploadStatus('success');
            return 100;
          }
          return prev + 10;
        });
      }, 50);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeImage(selectedFile);
      setResult(analysis);
      const uniqueClasses = new Set(analysis.predictions.map(p => p.class));
      const totalConf = analysis.predictions.reduce((acc, p) => acc + p.confidence, 0);
      setStats({
        totalDetections: analysis.predictions.length,
        acneTypesFound: uniqueClasses.size,
        avgConfidence: analysis.predictions.length > 0 ? totalConf / analysis.predictions.length : 0,
      });
      // Pass the apiKey from state so the service uses the user's custom key
      const aiInsights = await getSkinCareInsights(analysis.predictions, apiKey);
      setInsights(aiInsights);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isDemo = isDemoMode();

  return (
    <div className="min-h-screen bg-[#f7e7ce] pb-20">
      {/* Header Banner */}
      <header className="relative w-full bg-[#a53d4c] curved-banner pt-12 pb-24 px-6 text-center shadow-2xl overflow-hidden">
        {/* Decorative Background Icons */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.07]">
            <i className="fa-solid fa-dna absolute top-10 left-[5%] text-7xl animate-pulse"></i>
            <i className="fa-solid fa-microscope absolute bottom-20 right-[5%] text-9xl transform -rotate-12"></i>
            <i className="fa-solid fa-notes-medical absolute top-20 right-[20%] text-6xl"></i>
            <i className="fa-solid fa-user-doctor absolute bottom-10 left-[15%] text-6xl"></i>
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-4 mb-2 opacity-90">
                <div className="hidden md:block h-px w-12 bg-[#fde2e4]/50"></div>
                <p className="text-[#fde2e4] text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] drop-shadow-sm text-center">
                  Automated Acne Type Detection through Artificial Intelligence
                </p>
                <div className="hidden md:block h-px w-12 bg-[#fde2e4]/50"></div>
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-10 mt-6">
                <i className="fa-solid fa-star-of-life text-[#fde2e4]/20 text-3xl md:text-5xl hidden md:block"></i>
                <h1 className="header-title text-6xl md:text-9xl text-white font-bold uppercase drop-shadow-xl tracking-tighter relative">
                  ACNE-AWAY
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] whitespace-nowrap opacity-60 font-sans font-bold tracking-[0.4em] text-[#fde2e4]">
                    AI Diagnostic Research Tool
                  </span>
                </h1>
                <i className="fa-solid fa-wand-magic-sparkles text-[#fde2e4]/20 text-3xl md:text-5xl hidden md:block"></i>
            </div>
        </div>
        
        <div className="absolute top-6 right-8 flex items-center gap-4 z-50">
            <button onClick={() => setShowSettings(true)} className="p-2 text-white/50 hover:text-white transition-colors" title="Settings">
                <i className="fa-solid fa-gear text-lg shadow-sm"></i>
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 -mt-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Background & Diagnostic Input */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white/40 poster-card p-6 border border-[#a53d4c]/20">
            <div className="section-label">Background</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 bg-[#fdf2e9] p-3 rounded-2xl border border-orange-100">
                <i className="fa-solid fa-money-bill-trend-up text-green-600 text-xl"></i>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">Access to professional skin care remains unequal.</p>
              </div>
              <div className="flex items-center gap-3 bg-[#fff9db] p-3 rounded-2xl border border-yellow-100">
                <i className="fa-solid fa-clock-rotate-left text-amber-600 text-xl"></i>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">Many patients seek treatment only when severe.</p>
              </div>
              <div className="flex items-center gap-3 bg-[#fde2e4] p-3 rounded-2xl border border-red-100">
                <i className="fa-solid fa-flask-vial text-red-600 text-xl"></i>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">Improper product use may worsen conditions.</p>
              </div>
            </div>
          </section>

          <section className="bg-white poster-card p-8 shadow-xl border-t-8 border-[#a53d4c]">
            <div className="text-center mb-6">
              <i className="fa-solid fa-microscope text-[#a53d4c] text-4xl mb-4"></i>
              <h3 className="text-lg font-black text-[#a53d4c] uppercase tracking-tighter">Diagnostic Panel</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Image Upload Center</p>
            </div>

            <div 
              className={`relative border-4 border-dotted rounded-[2rem] p-8 text-center cursor-pointer transition-all overflow-hidden ${
                uploadStatus === 'error' ? 'border-red-300 bg-red-50' : 
                selectedFile ? 'border-[#a53d4c] bg-[#fdf2e9]' : 'border-gray-100 hover:border-[#a53d4c]/30'
              }`}
              onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              
              {uploadStatus === 'uploading' ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-[#a53d4c] transition-all duration-100 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] font-black text-[#a53d4c] uppercase tracking-widest animate-pulse">Uploading Scan...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center relative z-10">
                   <i className={`fa-solid ${
                     uploadStatus === 'success' ? 'fa-circle-check text-[#a53d4c]' : 
                     uploadStatus === 'error' ? 'fa-circle-exclamation text-red-500' :
                     'fa-camera-retro text-gray-200'
                   } text-5xl mb-4 transition-all duration-500`}></i>
                   
                   <p className="text-[10px] font-black text-gray-500 uppercase leading-tight">
                     {selectedFile ? selectedFile.name : 'Choose Patient Image'}
                   </p>
                   
                   {uploadStatus === 'success' && (
                     <span className="mt-2 text-[9px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase tracking-widest animate-in fade-in zoom-in duration-300">
                       <i className="fa-solid fa-check mr-1"></i> Upload Complete
                     </span>
                   )}
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing || uploadStatus === 'uploading'}
              className="w-full mt-6 py-5 bg-[#a53d4c] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-[#8b2635] disabled:bg-gray-200 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-sm relative overflow-hidden"
            >
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/10 flex items-end">
                   <div className="h-1 bg-white/50 w-full animate-pulse"></div>
                </div>
              )}
              {isAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-bolt-lightning"></i>}
              {isAnalyzing ? 'Processing...' : 'Run Diagnostics'}
            </button>
            {error && <p className="mt-4 text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-lg text-center">{error}</p>}
          </section>
        </div>

        {/* Right Content Area: Results and Discussion */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#fff9f0] poster-card p-1 shadow-md overflow-hidden border border-[#f3d9b1]">
             <div className="bg-[#a53d4c] px-8 py-3 text-white flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-widest">Results and Discussion</h2>
                {isDemo && <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Using Demo Data</span>}
             </div>
             
             <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Visual Mapping */}
                  <div className="md:col-span-7">
                    <AnalyzedImage result={result} />
                  </div>
                  
                  {/* Stats Circles */}
                  <div className="md:col-span-5">
                    <StatsCards stats={stats} />
                  </div>
                </div>
                
                {/* Clinical Insights */}
                {insights && (
                  <div className="mt-8 bg-white/60 p-6 rounded-[2rem] border border-[#a53d4c]/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="fa-solid fa-quote-left text-[#a53d4c] text-2xl"></i>
                      <h3 className="text-xs font-black text-[#a53d4c] uppercase tracking-widest">Clinical AI Assessment</h3>
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed font-medium space-y-4" dangerouslySetInnerHTML={{ __html: insights.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                  </div>
                )}

                {!result && !isAnalyzing && (
                  <div className="py-20 text-center opacity-30 italic">
                     <i className="fa-solid fa-chart-line text-6xl mb-4 text-[#a53d4c]"></i>
                     <p className="text-xs font-bold uppercase">Ready for Clinical Data Input</p>
                  </div>
                )}
             </div>
          </div>
          
          {/* Research Footnote Style Card */}
          <div className="bg-[#7a2833] text-white poster-card p-6 flex items-center justify-between">
             <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#fde2e4]">Model Methodology</h5>
                <p className="text-[9px] font-bold opacity-80 uppercase leading-tight mt-1">
                  YOLOv11 Architecture Optimized for Multi-Class Acne Classification and Real-Time Web Deployment
                </p>
             </div>
             <div className="flex gap-4">
                <i className="fa-solid fa-dna text-2xl text-[#e9c46a] opacity-50"></i>
                <i className="fa-solid fa-trophy text-3xl text-[#e9c46a]"></i>
             </div>
          </div>
        </div>

      </main>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="bg-[#fff9f0] rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-[#a53d4c]/30">
            <div className="px-10 py-8 bg-[#a53d4c] text-white flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-black text-xl uppercase tracking-tighter">Model Config</h3>
                <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">API / Endpoint Authorization</span>
              </div>
              <button onClick={() => setShowSettings(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-10 space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#a53d4c] uppercase tracking-widest mb-2">Roboflow Private Key</label>
                  <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full px-6 py-4 bg-white border border-[#f3d9b1] rounded-2xl focus:ring-2 focus:ring-[#a53d4c] outline-none text-sm font-bold shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#a53d4c] uppercase tracking-widest mb-2">Endpoint URL</label>
                  <input type="text" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="e.g. acne-type/3" className="w-full px-6 py-4 bg-white border border-[#f3d9b1] rounded-2xl focus:ring-2 focus:ring-[#a53d4c] outline-none text-sm font-bold shadow-inner" />
                </div>
                <button type="submit" className="w-full py-5 bg-[#a53d4c] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#8b2635] transform active:scale-95 transition-all">
                  Authorize & Refresh
                </button>
              </form>
              <div className="pt-6 border-t border-[#f3d9b1] flex flex-col items-center">
                <button onClick={handleShareLink} className={`w-full py-3 rounded-2xl border-2 font-black transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${copySuccess ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-[#f3d9b1] text-[#a53d4c] hover:bg-white'}`}>
                  <i className={`fa-solid ${copySuccess ? 'fa-check' : 'fa-link'}`}></i>
                  {copySuccess ? 'Link Copied' : 'Share Configuration Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 py-16 text-center border-t border-[#a53d4c]/10">
        <div className="max-w-3xl mx-auto px-6 opacity-60">
          <div className="flex justify-center gap-8 mb-8 grayscale hover:grayscale-0 transition-all duration-500">
             <i className="fa-solid fa-microchip text-4xl text-[#a53d4c]"></i>
             <i className="fa-solid fa-user-doctor text-4xl text-[#a53d4c]"></i>
             <i className="fa-solid fa-earth-americas text-4xl text-[#a53d4c]"></i>
          </div>
          <p className="text-[10px] text-[#a53d4c] font-black uppercase tracking-[0.5em] mb-4 text-center">Scientific Support Panel</p>
          <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight text-center">
            Research funded through Sustainable Development Goals Initiative. Powered by Google Gemini Pro Intelligence and YOLOv11 Computer Vision Models. Built for diagnostic assistance and research evaluation purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;