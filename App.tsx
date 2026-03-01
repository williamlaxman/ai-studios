import React, { useState, useRef, useEffect, useMemo } from 'react';
import TreatmentPlan from './components/TreatmentPlan';
import { Stats, AnalysisResult, PatientHistory } from './types';
import StatsCards from './components/StatsCards';
import DiagnosisCard from './components/DiagnosisCard';
import AnalyzedImage from './components/AnalyzedImage';
import FDAResults from './components/FDAResults';
import ClinicFinder from './components/ClinicFinder';
import AcneClassificationGuide from './components/AcneClassificationGuide';
import { classifyImage, analyzeImage, isDemoMode, DEFAULT_API_KEY, DEFAULT_MODEL_ENDPOINT } from './services/roboflowService';
import { getSkinCareInsights, AIInsights } from './services/geminiService';

const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      
      // The tooltip is initially centered above the container via CSS (left: 50%, transform: translateX(-50%))
      // We need to calculate if this initial position causes overflow
      
      // Expected left and right edges of the tooltip in viewport coordinates
      const expectedLeft = containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
      const expectedRight = containerRect.left + containerRect.width / 2 + tooltipRect.width / 2;

      let newShift = 0;

      if (expectedRight > screenWidth - 16) {
        // Overflow right: shift left by the overflow amount
        newShift = (screenWidth - 16) - expectedRight;
      } else if (expectedLeft < 16) {
        // Overflow left: shift right by the overflow amount
        newShift = 16 - expectedLeft;
      }

      setShift(newShift);
    }
  }, [isVisible]);

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && (
        <div 
            ref={tooltipRef}
            className="absolute bottom-full left-1/2 mb-2 w-56 md:w-64 p-2 md:p-3 bg-gray-900/95 text-white text-[10px] md:text-xs rounded-xl shadow-xl z-50 backdrop-blur-sm border border-white/10 animate-in fade-in zoom-in duration-200 pointer-events-none"
            style={{ 
                transform: `translateX(calc(-50% + ${shift}px))`
            }}
        >
          {content}
          <div 
            className="absolute top-full left-1/2 border-4 border-transparent border-t-gray-900/95"
            style={{ 
                transform: `translateX(calc(-50% - ${shift}px))`
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

const MultiSelectWithOther: React.FC<{
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ label, options, value, onChange, placeholder }) => {
  // Parse the comma-separated string into an array
  const currentValues = value ? value.split(', ').filter(v => v.trim() !== '') : [];
  
  // Separate predefined options from custom "other" values
  const selectedOptions = currentValues.filter(v => options.includes(v));
  const otherValues = currentValues.filter(v => !options.includes(v));
  const otherText = otherValues.join(', ');

  const handleCheckboxChange = (option: string, checked: boolean) => {
    let newValues = [...selectedOptions];
    let newOtherText = otherText;

    if (checked) {
      if (option === 'None') {
        newValues = ['None'];
        newOtherText = ''; // Clear other text if None is selected
      } else {
        newValues = newValues.filter(v => v !== 'None');
        newValues.push(option);
      }
    } else {
      newValues = newValues.filter(v => v !== option);
    }
    
    // Recombine with other text
    const finalString = [...newValues, ...(newOtherText ? [newOtherText] : [])].join(', ');
    onChange(finalString);
  };

  const handleOtherChange = (text: string) => {
    // If typing in "other", remove "None"
    const newValues = selectedOptions.filter(v => v !== 'None');
    const finalString = [...newValues, ...(text ? [text] : [])].join(', ');
    onChange(finalString);
  };

  return (
    <div>
      <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {options.map(option => (
          <label key={option} className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-4 h-4 rounded border border-gray-300 bg-white group-hover:border-[#a53d4c] transition-colors">
              <input 
                type="checkbox" 
                className="absolute opacity-0 w-full h-full cursor-pointer"
                checked={selectedOptions.includes(option)}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              />
              {selectedOptions.includes(option) && <i className="fa-solid fa-check text-[8px] text-[#a53d4c]"></i>}
            </div>
            <span className="text-[10px] md:text-xs text-gray-700">{option}</span>
          </label>
        ))}
      </div>
      <input 
        type="text" 
        value={otherText}
        onChange={(e) => handleOtherChange(e.target.value)}
        placeholder={placeholder || "Other (please specify)"}
        className="w-full p-2 rounded-lg border border-gray-200 text-xs font-medium focus:border-[#a53d4c] outline-none bg-white/50 min-h-[36px]"
      />
    </div>
  );
};

const PatientHistoryForm: React.FC<{ history: PatientHistory, setHistory: (h: PatientHistory) => void }> = ({ history, setHistory }) => {
  const treatmentOptions = [
    "None",
    "Salicylic Acid",
    "Benzoyl Peroxide",
    "Retinoids (Adapalene/Tretinoin)",
    "Oral Antibiotics",
    "Isotretinoin (Accutane)",
    "Birth Control Pills"
  ];

  const historyOptions = [
    "None",
    "Hormonal Imbalance (PCOS)",
    "Sensitive Skin / Rosacea",
    "Eczema / Dermatitis",
    "Allergies to Skincare",
    "High Stress Levels",
    "Dietary Triggers (Dairy/Sugar)"
  ];

  return (
    <div className="bg-white/40 poster-card p-4 md:p-6 border border-[#a53d4c]/20 mt-4 md:mt-6">
      <div className="section-label mb-3 md:mb-4 text-[10px] md:text-xs">Patient History</div>
      <div className="space-y-4 md:space-y-5">
        <div>
          <label htmlFor="skinType" className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Skin Type</label>
          <select 
            id="skinType"
            value={history.skinType} 
            onChange={(e) => setHistory({...history, skinType: e.target.value})}
            className="w-full p-2 md:p-3 rounded-lg border border-gray-200 text-xs font-medium focus:border-[#a53d4c] outline-none bg-white/50 min-h-[44px]"
          >
            <option value="">Select Skin Type</option>
            <option value="Oily">Oily</option>
            <option value="Dry">Dry</option>
            <option value="Combination">Combination</option>
            <option value="Sensitive">Sensitive</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
        
        <MultiSelectWithOther 
          label="Previous Treatments"
          options={treatmentOptions}
          value={history.previousTreatments}
          onChange={(val) => setHistory({...history, previousTreatments: val})}
          placeholder="Other treatments..."
        />

        <MultiSelectWithOther 
          label="Medical/Skin History"
          options={historyOptions}
          value={history.history}
          onChange={(val) => setHistory({...history, history: val})}
          placeholder="Other medical history..."
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // App State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [recommendedIngredients, setRecommendedIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'treatment' | 'rationale'>('findings');
  
  const [patientHistory, setPatientHistory] = useState<PatientHistory>({
    skinType: '',
    previousTreatments: '',
    history: ''
  });
  
  // Settings State
  const [roboflowKey, setRoboflowKey] = useState(DEFAULT_API_KEY);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ENDPOINT);
  const [geminiKey, setGeminiKey] = useState('');
  
  // Upload Feedback State
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Confidence Threshold State
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(40);

  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    acneTypesFound: 0,
    avgConfidence: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // Handle URL Params without reloading the page
    const params = new URLSearchParams(window.location.search);
    const urlRoboflowKey = params.get('apiKey'); 
    const urlModel = params.get('modelId');
    const urlGeminiKey = params.get('geminiKey');
    
    let updated = false;

    if (urlRoboflowKey) {
      setRoboflowKey(urlRoboflowKey);
      updated = true;
    }
    if (urlModel) {
      setModelId(urlModel);
      updated = true;
    }
    if (urlGeminiKey) {
      setGeminiKey(urlGeminiKey);
      updated = true;
    }

    if (updated) {
        // Clean URL cleanly
        window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSettings(false);
  };

  const [showShareModal, setShowShareModal] = useState(false);

  // ... (existing state)

  const handleShareLink = () => {
    setShowShareModal(true);
  };

  const ShareModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [includeKeys, setIncludeKeys] = useState(true);
    const [copied, setCopied] = useState(false);

    const getShareUrl = () => {
      const baseUrl = window.location.origin + window.location.pathname;
      if (!includeKeys) return baseUrl;
      
      const params = new URLSearchParams();
      if (roboflowKey !== DEFAULT_API_KEY) params.set('apiKey', roboflowKey);
      if (modelId !== DEFAULT_MODEL_ENDPOINT) params.set('modelId', modelId);
      if (geminiKey) params.set('geminiKey', geminiKey);
      
      const queryString = params.toString();
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(getShareUrl()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-[#a53d4c] p-4 flex justify-between items-center text-white">
            <h3 className="font-bold uppercase tracking-widest text-sm"><i className="fa-solid fa-share-nodes mr-2"></i> Share Application</h3>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${includeKeys ? 'bg-[#a53d4c] border-[#a53d4c]' : 'border-gray-300'}`}>
                  {includeKeys && <i className="fa-solid fa-check text-white text-xs"></i>}
                </div>
                <input type="checkbox" checked={includeKeys} onChange={(e) => setIncludeKeys(e.target.checked)} className="hidden" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Include API Keys</div>
                  <div className="text-[10px] text-gray-400">Allows others to use the app without their own keys.</div>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shareable Link</div>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={getShareUrl()} 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono focus:outline-none"
                />
                <button 
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-all ${copied ? 'bg-green-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  {copied ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-copy"></i>}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3">
              <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
              <div>
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Important Note</div>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  This link points to a <strong>temporary preview</strong>. For a permanent website, you must deploy this code to a hosting provider like Vercel or Netlify.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        setUploadStatus('error');
        setError('Please upload a valid image file.');
        return;
      }

      // Clear any existing upload/processing
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

      // Reset states
      setUploadStatus('success'); // Immediate success
      setUploadProgress(100);
      setSelectedFile(file);
      setResult(null);
      setInsights(null);
      setRecommendedIngredients([]);
      setError(null);
    }
  };

  // Helper to resize image
  const resizeImage = (file: File, targetSize = 224): Promise<{ base64: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // ResNet-50 typically expects 224x224 images. 
          // Resizing to exactly 224x224 or a max dimension of 224 significantly speeds up 
          // both the Roboflow classification and Gemini API calls on mobile networks.
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > targetSize) {
              height = Math.round((height * targetSize) / width);
              width = targetSize;
            }
          } else {
            if (height > targetSize) {
              width = Math.round((width * targetSize) / height);
              height = targetSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve({
            base64: canvas.toDataURL('image/jpeg', 0.6),
            width,
            height
          });
        };
      };
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    
    // Clear previous results to ensure clean state
    setResult(null);
    setInsights(null);
    setRecommendedIngredients([]);

    try {
      // 1. Pre-process Image (Resize for speed)
      const { base64: imageBase64, width, height } = await resizeImage(selectedFile);

      // 2. Parallel Execution: Start Roboflow requests immediately
      const detectionPromise = analyzeImage(imageBase64, 1, { width, height })
        .catch(err => { 
            console.warn("Roboflow Detection failed:", err);
            return null;
        });

      const classificationPromise = classifyImage(imageBase64)
        .catch(err => {
            console.warn("Roboflow Classification failed:", err);
            return null;
        });

      // 3. Wait for Detection (Critical Path for Visual Feedback)
      const detectionResult = await detectionPromise;

      if (!detectionResult) {
          throw new Error("Could not detect lesions. Please check your connection and try again.");
      }

      // 4. Initial Render (Detections Only)
      // Infer classification from detections initially while we wait for the specialized classifier
      let predictions = detectionResult.predictions;
      
      // Filter predictions based on the CURRENT slider value (default 40%)
      // This ensures stats and Gemini only see what the user sees
      const filteredPredictions = predictions.filter((p: any) => p.confidence * 100 >= confidenceThreshold);
      
      let classificationLabel = "Analyzing...";
      let classificationPredictions: { class: string; confidence: number }[] = [];
      
      if (filteredPredictions.length > 0) {
          const classConfidences: Record<string, number[]> = {};
          filteredPredictions.forEach((p: any) => {
              if (!classConfidences[p.class]) classConfidences[p.class] = [];
              classConfidences[p.class].push(p.confidence);
          });
          
          const topClass = Object.keys(classConfidences).reduce((a, b) => classConfidences[a].length > classConfidences[b].length ? a : b);
          classificationLabel = `${topClass} Dominant`;
          
          classificationPredictions = Object.keys(classConfidences).map(cls => {
              const confs = classConfidences[cls];
              const avgConf = confs.reduce((a, b) => a + b, 0) / confs.length;
              return {
                 class: cls,
                 confidence: avgConf
              };
          }).sort((a, b) => b.confidence - a.confidence);
      } else {
          classificationLabel = "No Acne Detected";
      }

      const initialAnalysis = {
        predictions: predictions, // Keep ALL predictions for the visual slider to work
        imageUrl: imageBase64,
        imageDimensions: { width, height },
        classificationLabel: classificationLabel,
        classificationPredictions: classificationPredictions
      };
      
      // Calculate Stats based on FILTERED predictions
      const uniqueClasses = new Set(filteredPredictions.map((p: any) => p.class));
      // Initially use average confidence of detections since we don't have the classifier result yet.
      // We will update this later when the classifier returns.
      const initialAvgConfidence = filteredPredictions.length > 0 ? filteredPredictions.reduce((acc: any, p: any) => acc + p.confidence, 0) / filteredPredictions.length : 0;
      
      const newStats = {
        totalDetections: filteredPredictions.length,
        acneTypesFound: uniqueClasses.size,
        avgConfidence: initialAvgConfidence,
      };

      // IMMEDIATE UPDATE: Show visual results!
      setStats(newStats);
      setResult(initialAnalysis);
      setIsAnalyzing(false); // Stop main loading spinner

      // 5. Handle Classification Update (in background)
      // We wait for classification to complete before sending to Gemini to ensure accuracy
      const classificationData = await classificationPromise;
      
      if (classificationData) {
          let newLabel = "";
          let newConf = 0;

          // Handle Roboflow response formats (Array vs Object)
          if (classificationData.predictions) {
              let newPreds: { class: string; confidence: number }[] = [];
              if (Array.isArray(classificationData.predictions)) {
                  // Format: [{ class: "name", confidence: 0.9 }, ...]
                  newPreds = classificationData.predictions
                      .map((p: any) => ({ class: p.class, confidence: p.confidence }))
                      .sort((a: any, b: any) => b.confidence - a.confidence);
              } else if (typeof classificationData.predictions === 'object') {
                  // Format: { "class_name": { confidence: 0.9 }, ... } OR { "class_name": 0.9, ... }
                  newPreds = Object.entries(classificationData.predictions)
                      .map(([className, val]: [string, any]) => {
                          const conf = typeof val === 'number' ? val : val.confidence;
                          return { class: className, confidence: conf };
                      })
                      .sort((a, b) => b.confidence - a.confidence);
              }
              
              if (newPreds.length > 0) {
                  newLabel = newPreds[0].class;
                  newConf = newPreds[0].confidence;
              }
          } 
          
          // Fallback to top/confidence if predictions parsing failed or was empty, but top exists
          if (!newLabel && classificationData.top) {
              newLabel = classificationData.top;
              newConf = classificationData.confidence;
          }

          if (newLabel) {
              console.log("Updated Classification:", newLabel);
              classificationLabel = newLabel; // Update local var for Gemini
              
              // Update stats with the NEW, more accurate confidence from the classifier
              setStats(prev => ({
                  ...prev,
                  avgConfidence: newConf > 0 ? newConf : prev.avgConfidence
              }));

              setResult(prev => {
                  if (!prev) return null;
                  return {
                      ...prev,
                      classificationLabel: newLabel
                      // DO NOT overwrite classificationPredictions! 
                      // The user wants to see ALL types detected by the object detection model, 
                      // not just the single primary classification.
                  };
              });
          }
      }

      // 6. Generate Insights (Now using the ACTUAL detection/classification data)
      setIsGeneratingInsights(true);
      
      try {
        // Pass FILTERED predictions to Gemini so it doesn't hallucinate based on low-confidence noise
        let aiInsights = await getSkinCareInsights(
            initialAnalysis.imageUrl, 
            filteredPredictions, 
            geminiKey || undefined, 
            patientHistory, 
            classificationLabel
        );
        
        if (!aiInsights || aiInsights.clinicalImpression === "Analysis Failed" || aiInsights.clinicalImpression === "System Error") {
           console.log("Gemini Analysis failed, retrying immediately...");
           // Retry once
           aiInsights = await getSkinCareInsights(initialAnalysis.imageUrl, filteredPredictions, geminiKey || undefined, patientHistory, classificationLabel);
        }
        
        if (aiInsights) {
            setInsights(aiInsights);
            setRecommendedIngredients(aiInsights.recommendedIngredients);
        }
      } catch (insightErr) {
        console.error("Insight Generation Failed:", insightErr);
        // We don't fail the whole flow, just the insights part
      } finally {
        setIsGeneratingInsights(false);
      }
      
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An unexpected error occurred during analysis.");
      setIsAnalyzing(false); // Ensure we stop loading on error
    }
  };

  const handleRefreshInsights = async () => {
    if (!result) return;
    setIsRefreshingInsights(true);
    
    try {
      let aiInsights = await getSkinCareInsights(result.imageUrl, result.predictions, geminiKey || undefined, patientHistory, result.classificationLabel);
      
      if (aiInsights.clinicalImpression === "Analysis Failed" || aiInsights.clinicalImpression === "System Error") {
         console.log("Gemini Analysis failed, retrying once...");
         await new Promise(r => setTimeout(r, 1000)); // Wait 1s
         aiInsights = await getSkinCareInsights(result.imageUrl, result.predictions, geminiKey || undefined, patientHistory, result.classificationLabel);
      }
      
      setInsights(aiInsights);
      setRecommendedIngredients(aiInsights.recommendedIngredients);
    } catch (err) {
      console.error("Error refreshing insights:", err);
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  const handleExportReport = () => {
    if (!result || !insights) return;
    const report = `
ACNE-AWAY CLINICAL REPORT
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

PATIENT HISTORY
----------------
Skin Type: ${patientHistory.skinType}
Previous Treatments: ${patientHistory.previousTreatments}
Medical History: ${patientHistory.history}

ANALYSIS SUMMARY
----------------
Total Detections: ${stats.totalDetections}
Acne Types Found: ${stats.acneTypesFound}
Average Confidence: ${(stats.avgConfidence * 100).toFixed(1)}%

CLINICAL IMPRESSION
-------------------
Severity: ${insights.severity}
Primary Type: ${insights.acneType}

${insights.clinicalImpression}

OBJECTIVE FINDINGS
------------------
${(insights.objectiveFindings || []).map(f => `- ${f}`).join('\n')}

TREATMENT PLAN
--------------
${(insights.treatmentPlan || []).map(p => `- ${p}`).join('\n')}

DISCLAIMER
----------
${insights.disclaimer}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acne-away-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDemo = isDemoMode();

  const displayStats = useMemo(() => {
    if (!result) return { ...stats, dynamicPredictions: [] };
    
    // Filter detections based on the slider
    const threshold = confidenceThreshold / 100;
    const filteredDetections = result.predictions.filter((p: any) => p.confidence >= threshold);
    const uniqueClasses = new Set(filteredDetections.map((p: any) => p.class));
    
    // Dynamically calculate average confidence for each detected class based on the filtered boxes
    const classConfidences: Record<string, number[]> = {};
    filteredDetections.forEach((p: any) => {
        if (!classConfidences[p.class]) classConfidences[p.class] = [];
        classConfidences[p.class].push(p.confidence);
    });
    
    const dynamicPredictions = Object.keys(classConfidences).map(cls => {
        const confs = classConfidences[cls];
        const avgConf = confs.reduce((a, b) => a + b, 0) / confs.length;
        return {
           class: cls,
           confidence: avgConf
        };
    }).sort((a, b) => b.confidence - a.confidence);
    
    // Calculate the overall average confidence of all visible detections
    const overallAvgConfidence = filteredDetections.length > 0 
      ? filteredDetections.reduce((acc: any, p: any) => acc + p.confidence, 0) / filteredDetections.length 
      : 0;

    return {
      ...stats,
      totalDetections: filteredDetections.length,
      acneTypesFound: uniqueClasses.size,
      avgConfidence: overallAvgConfidence,
      dynamicPredictions
    };
  }, [result, confidenceThreshold, stats]);

  return (
    <div className="min-h-screen bg-[#f7e7ce] pb-10 md:pb-20">
      {/* Header Banner */}
      <header className="relative w-full bg-[#a53d4c] curved-banner pt-8 pb-16 md:pt-12 md:pb-24 px-4 md:px-6 text-center shadow-2xl overflow-hidden">
        {/* Decorative Background Icons */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-[0.07]">
            <i className="fa-solid fa-dna absolute top-10 left-[5%] text-5xl md:text-7xl animate-pulse"></i>
            <i className="fa-solid fa-microscope absolute bottom-20 right-[5%] text-7xl md:text-9xl transform -rotate-12"></i>
            <i className="fa-solid fa-notes-medical absolute top-20 right-[20%] text-4xl md:text-6xl"></i>
            <i className="fa-solid fa-user-doctor absolute bottom-10 left-[15%] text-4xl md:text-6xl"></i>
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 opacity-90">
                <div className="hidden md:block h-px w-8 md:w-12 bg-[#fde2e4]/50"></div>
                <p className="text-[#fde2e4] text-[8px] md:text-sm font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] drop-shadow-sm text-center max-w-[80%] md:max-w-none leading-tight">
                  Automated Acne Type Detection through Artificial Intelligence
                </p>
                <div className="hidden md:block h-px w-8 md:w-12 bg-[#fde2e4]/50"></div>
            </div>

            <div className="flex items-center justify-center gap-3 md:gap-10 mt-4 md:mt-6">
                <i className="fa-solid fa-star-of-life text-[#fde2e4]/20 text-2xl md:text-5xl hidden md:block"></i>
                <h1 className="header-title text-5xl md:text-6xl lg:text-9xl text-white font-bold uppercase drop-shadow-xl tracking-tighter relative">
                  ACNE-AWAY
                  <span className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] whitespace-nowrap opacity-60 font-sans font-bold tracking-[0.3em] md:tracking-[0.4em] text-[#fde2e4]">
                    AI Diagnostic Research Tool
                  </span>
                </h1>
                <i className="fa-solid fa-wand-magic-sparkles text-[#fde2e4]/20 text-2xl md:text-5xl hidden md:block"></i>
            </div>
        </div>
        
        <div className="absolute top-4 right-4 md:top-6 md:right-8 flex items-center gap-4 z-50">
            <button type="button" onClick={handleShareLink} className="p-2 text-white/50 hover:text-white transition-colors" title="Share App" aria-label="Share Application">
                <i className="fa-solid fa-share-nodes text-lg shadow-sm" aria-hidden="true"></i>
            </button>
            <button type="button" onClick={() => setShowSettings(true)} className="p-2 text-white/50 hover:text-white transition-colors" title="Settings" aria-label="Open Settings">
                <i className="fa-solid fa-gear text-lg shadow-sm" aria-hidden="true"></i>
            </button>
        </div>
      </header>

      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}

      <main className="max-w-7xl mx-auto px-4 -mt-8 md:-mt-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left column: Background & Diagnostic Input */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <section className="bg-white/40 poster-card p-4 md:p-6 border border-[#a53d4c]/20">
            <div className="section-label text-[10px] md:text-xs">Background</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 bg-[#fdf2e9] p-3 rounded-2xl border border-orange-100">
                <i className="fa-solid fa-money-bill-trend-up text-green-600 text-lg md:text-xl"></i>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">Access to professional skin care remains unequal.</p>
              </div>
              <div className="flex items-center gap-3 bg-[#fff9db] p-3 rounded-2xl border border-yellow-100">
                <i className="fa-solid fa-clock-rotate-left text-amber-600 text-lg md:text-xl"></i>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">Many patients seek treatment only when severe.</p>
              </div>
              <div className="flex items-center gap-3 bg-[#fde2e4] p-3 rounded-2xl border border-red-100">
                <i className="fa-solid fa-flask-vial text-red-600 text-lg md:text-xl"></i>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">Improper product use may worsen conditions.</p>
              </div>
            </div>
          </section>

          <form onSubmit={(e) => e.preventDefault()}>
            <PatientHistoryForm history={patientHistory} setHistory={setPatientHistory} />
          </form>

          {/* System Capabilities Card */}
          <div className="bg-[#7a2833] text-white poster-card p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 text-center md:text-left">
             <div className="flex-1">
                <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#fde2e4]">Detection Capabilities</h5>
                <p className="text-[8px] md:text-[9px] font-bold opacity-80 uppercase leading-tight mt-1 mb-2">
                  AI-Powered Analysis for Common Skin Conditions
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                   <span className="text-[8px] bg-[#a53d4c] px-2 py-1 rounded border border-[#fde2e4]/20">Blackheads</span>
                   <span className="text-[8px] bg-[#a53d4c] px-2 py-1 rounded border border-[#fde2e4]/20">Whiteheads</span>
                   <span className="text-[8px] bg-[#a53d4c] px-2 py-1 rounded border border-[#fde2e4]/20">Papules</span>
                   <span className="text-[8px] bg-[#a53d4c] px-2 py-1 rounded border border-[#fde2e4]/20">Pustules</span>
                   <span className="text-[8px] bg-[#a53d4c] px-2 py-1 rounded border border-[#fde2e4]/20">Nodules</span>
                   <span className="text-[8px] bg-[#a53d4c] px-2 py-1 rounded border border-[#fde2e4]/20">Normal Skin</span>
                </div>
             </div>
             <div className="flex gap-4 border-l border-[#fde2e4]/20 pl-6 ml-4">
                <div className="text-center">
                   <div className="text-xl md:text-2xl font-black text-[#e9c46a]">89.4%</div>
                   <div className="text-[7px] uppercase tracking-widest opacity-70">Accuracy</div>
                </div>
                <div className="text-center">
                   <div className="text-xl md:text-2xl font-black text-[#e9c46a]">5</div>
                   <div className="text-[7px] uppercase tracking-widest opacity-70">Types</div>
                </div>
             </div>
          </div>

          <section className={`bg-white poster-card p-5 md:p-8 shadow-xl border-t-8 border-[#a53d4c] transition-opacity duration-300 ${!patientHistory.skinType ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="text-center mb-4 md:mb-6">
              <i className="fa-solid fa-microscope text-[#a53d4c] text-3xl md:text-4xl mb-2 md:mb-4"></i>
              <h3 className="text-base md:text-lg font-black text-[#a53d4c] uppercase tracking-tighter">Diagnostic Panel</h3>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Image Upload Center</p>
              {!patientHistory.skinType && (
                 <p className="text-[8px] md:text-[9px] text-red-500 font-bold uppercase tracking-widest mt-2 animate-pulse">
                   <i className="fa-solid fa-circle-exclamation mr-1"></i> Please complete patient history first
                 </p>
              )}
            </div>

            {/* Confidence Threshold Slider */}
            <div className="mb-6 px-2">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="confidence-slider" className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Detection Confidence
                </label>
                <span className="text-[10px] md:text-xs font-black text-[#a53d4c] bg-[#fde2e4] px-2 py-1 rounded">
                  {confidenceThreshold}%
                </span>
              </div>
              <input
                id="confidence-slider"
                type="range"
                min="10"
                max="90"
                step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#a53d4c]"
              />
              <p className="text-[9px] md:text-[10px] text-gray-500 mt-2 text-center leading-relaxed">
                <strong>Lower this</strong> if the AI is missing spots. <strong>Raise it</strong> if the AI is highlighting things that aren't acne.
              </p>
            </div>

            {/* Photo Instructions */}
            <div className="mb-6 bg-white/40 border border-[#a53d4c]/20 rounded-2xl p-4 md:p-5 shadow-sm">
              <h4 className="text-[10px] md:text-xs font-black text-[#a53d4c] uppercase tracking-widest mb-3 flex items-center gap-2">
                <i className="fa-solid fa-camera-retro"></i> Photo Guidelines
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white/60 rounded-xl p-3 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-[8px] border border-amber-100">
                      <i className="fa-solid fa-sun"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Lighting</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-relaxed">Face a window for natural, even lighting. Avoid harsh shadows or dark rooms.</p>
                </div>
                
                <div className="bg-white/60 rounded-xl p-3 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-[8px] border border-rose-100">
                      <i className="fa-solid fa-magnifying-glass-plus"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Focus</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-relaxed">Take a close-up of the affected area or your whole face. Take separate photos if needed.</p>
                </div>

                <div className="bg-white/60 rounded-xl p-3 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[8px] border border-emerald-100">
                      <i className="fa-solid fa-eye"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Clarity</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-relaxed">Ensure the photo is sharp and in focus. Remove glasses and pull hair back.</p>
                </div>
              </div>
            </div>

            <div 
              role="button"
              tabIndex={0}
              aria-label="Upload image for analysis"
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && uploadStatus !== 'uploading' && patientHistory.skinType) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative border-4 border-dotted rounded-[2rem] p-6 md:p-8 text-center cursor-pointer transition-all overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#a53d4c]/50 ${
                uploadStatus === 'error' ? 'border-red-300 bg-red-50' : 
                selectedFile ? 'border-[#a53d4c] bg-[#fdf2e9]' : 'border-gray-100 hover:border-[#a53d4c]/30'
              }`}
              onClick={() => uploadStatus !== 'uploading' && patientHistory.skinType && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={!patientHistory.skinType} aria-hidden="true" tabIndex={-1} />
              
              {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                <div className="flex flex-col items-center justify-center py-4 w-full px-8">
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3 border border-gray-200 relative">
                    <div 
                      className={`h-full ${uploadStatus === 'processing' ? 'bg-[#a53d4c]' : 'bg-gradient-to-r from-[#a53d4c] to-[#d65c6c]'} transition-all duration-300 ease-out relative`}
                      style={{ width: `${uploadProgress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] border-r border-white/30"></div>
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-[9px] font-bold uppercase tracking-widest text-[#a53d4c]">
                    <span className="animate-pulse flex items-center gap-2">
                      {uploadStatus === 'processing' ? (
                        <>
                          <i className="fa-solid fa-gear animate-spin"></i> Processing Image...
                        </>
                      ) : 'Uploading Scan...'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
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
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing || uploadStatus === 'uploading' || !patientHistory.skinType}
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
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="bg-[#fff9f0] poster-card shadow-md overflow-hidden border border-[#f3d9b1]">
             <div className="bg-[#a53d4c] px-4 py-2 md:px-8 md:py-3 text-white flex justify-between items-center">
                <h2 className="text-xs md:text-sm font-black uppercase tracking-widest">Results and Discussion</h2>
                {isDemo && <span className="text-[8px] md:text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Using Demo Data</span>}
             </div>
             
             <div className="p-4 md:p-8">
                {result && (
                  <div className="flex justify-end gap-2 mb-4">
                    <button 
                      type="button"
                      onClick={handleExportReport}
                      disabled={!insights}
                      className="bg-[#a53d4c] text-white hover:bg-[#8b2635] px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Export analysis report as text file"
                    >
                      <i className="fa-solid fa-file-export" aria-hidden="true"></i> Export Report
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                  {/* Visual Mapping */}
                  <div className="md:col-span-7">
                    <AnalyzedImage result={result} confidenceThreshold={confidenceThreshold / 100} />
                  </div>
                  
                  {/* Stats Circles */}
                  <div className="md:col-span-5 flex flex-col gap-6">
                    {insights ? (
                        <DiagnosisCard 
                          severity={insights.severity} 
                          acneType={result?.classificationLabel || insights.acneType} 
                          predictions={displayStats.dynamicPredictions}
                        />
                    ) : result ? (
                        // Skeleton for Diagnosis Card
                        <div className="bg-white/60 p-4 rounded-2xl border border-[#a53d4c]/10 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                        </div>
                    ) : null}
                    <StatsCards stats={displayStats} />
                  </div>
                </div>
                
                {/* Clinical Insights */}
                {result && (
                  <>
                    {/* Acne Classification Guide */}
                    <AcneClassificationGuide />
                    
                    {insights ? (
                      <div className="mt-6 md:mt-8 bg-white/60 p-4 md:p-8 rounded-[2rem] border border-[#a53d4c]/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="bg-[#a53d4c] p-2.5 rounded-xl shrink-0">
                              <i className="fa-solid fa-user-doctor text-white text-lg md:text-xl"></i>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <h3 className="text-xs md:text-sm font-black text-[#a53d4c] uppercase tracking-widest leading-tight">Clinical AI Assessment</h3>
                              <Tooltip content="These insights are generated by an AI model based on the visual analysis of your skin. They are for informational purposes only and do not constitute a medical diagnosis. Always consult a dermatologist.">
                                <i className="fa-solid fa-circle-info text-[#a53d4c] opacity-50 hover:opacity-100 cursor-help text-sm md:text-base shrink-0" aria-label="Learn more about AI assessment limitations"></i>
                              </Tooltip>
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={handleRefreshInsights} 
                            disabled={isRefreshingInsights}
                            className="text-[10px] md:text-[10px] font-bold uppercase tracking-wider text-[#a53d4c] bg-[#a53d4c]/5 hover:bg-[#a53d4c]/10 px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto border border-[#a53d4c]/10"
                          >
                            <i className={`fa-solid fa-rotate-right ${isRefreshingInsights ? 'animate-spin' : ''}`}></i>
                            {isRefreshingInsights ? 'Refreshing...' : 'Refresh Insights'}
                          </button>
                        </div>
                        
                        <div className={`space-y-6 md:space-y-8 transition-opacity duration-300 ${isRefreshingInsights ? 'opacity-50' : 'opacity-100'}`}>
                          {/* Clinical Impression Section */}
                          <div>
                            <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <i className="fa-solid fa-stethoscope"></i> Clinical Impression
                            </h4>
                            <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium">
                              {insights.clinicalImpression}
                            </p>
                          </div>

                          {/* Tabs for Insights */}
                          <div className="bg-white/50 rounded-2xl border border-gray-100">
                            <div className="grid grid-cols-3 border-b border-gray-100 rounded-t-2xl overflow-hidden">
                              <button 
                                type="button"
                                onClick={() => setActiveTab('findings')}
                                className={`py-3 px-1 text-[9px] md:text-xs font-bold uppercase tracking-wider transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'findings' ? 'bg-[#a53d4c] text-white' : 'text-gray-500 hover:bg-gray-50 border-r border-gray-100'}`}
                              >
                                <i className="fa-solid fa-microscope text-sm md:text-base"></i> <span className="hidden sm:inline">Findings</span><span className="sm:hidden">Find</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => setActiveTab('treatment')}
                                className={`py-3 px-1 text-[9px] md:text-xs font-bold uppercase tracking-wider transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'treatment' ? 'bg-[#a53d4c] text-white' : 'text-gray-500 hover:bg-gray-50 border-r border-gray-100'}`}
                              >
                                <i className="fa-solid fa-prescription-bottle-medical text-sm md:text-base"></i> <span className="hidden sm:inline">Treatment</span><span className="sm:hidden">Treat</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => setActiveTab('rationale')}
                                className={`py-3 px-1 text-[9px] md:text-xs font-bold uppercase tracking-wider transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'rationale' ? 'bg-[#a53d4c] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                              >
                                <i className="fa-solid fa-mortar-pestle text-sm md:text-base"></i> <span className="hidden sm:inline">Rationale</span><span className="sm:hidden">Why</span>
                              </button>
                            </div>

                            <div className="p-4 md:p-6 min-h-[200px]">
                              {activeTab === 'findings' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                   <h4 className="text-[10px] md:text-xs font-bold text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                     <i className="fa-solid fa-microscope"></i> Objective Findings
                                   </h4>
                                   <ul className="space-y-3">
                                     {(insights.objectiveFindings || []).map((finding, idx) => (
                                       <li key={idx} className="text-[10px] md:text-xs text-gray-700 flex items-start gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 hover:border-orange-200 transition-colors">
                                         <div className="bg-orange-100 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                                           <i className="fa-solid fa-magnifying-glass text-orange-500 text-[10px]"></i>
                                         </div>
                                         <span className="leading-relaxed font-medium">{finding}</span>
                                       </li>
                                     ))}
                                   </ul>
                                </div>
                              )}

                              {activeTab === 'treatment' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                   <TreatmentPlan plan={insights.treatmentPlan || []} />
                                </div>
                              )}

                              {activeTab === 'rationale' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-mortar-pestle"></i> Pharmacological Rationale
                                  </h4>
                                  {insights.ingredientRationale && insights.ingredientRationale.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                      {insights.ingredientRationale.map((item, idx) => (
                                        <Tooltip key={idx} content={item.rationale}>
                                          <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-gray-100 shadow-sm hover:border-[#a53d4c]/30 hover:shadow-md transition-all cursor-help group">
                                            <span className="font-bold text-[#a53d4c] text-[10px] md:text-xs flex items-center gap-2">
                                              {item.ingredient}
                                              <i className="fa-solid fa-circle-info text-[8px] md:text-[10px] opacity-30 group-hover:opacity-100 transition-opacity text-[#a53d4c]"></i>
                                            </span>
                                          </div>
                                        </Tooltip>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 italic">No specific pharmacological rationale provided.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Disclaimer */}
                          <div className="bg-red-50 p-3 md:p-4 rounded-xl border border-red-100 flex gap-3 items-start">
                            <i className="fa-solid fa-shield-heart text-red-400 mt-1"></i>
                            <div>
                              <h5 className="text-[9px] md:text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">Medical Disclaimer</h5>
                              <p className="text-[9px] md:text-[10px] text-red-700 leading-relaxed">
                                {insights.disclaimer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isGeneratingInsights ? (
                        // Skeleton Loader for Insights
                        <div className="mt-6 md:mt-8 bg-white/60 p-4 md:p-8 rounded-[2rem] border border-[#a53d4c]/10 shadow-sm animate-pulse">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="space-y-4 mb-8">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                            </div>
                            <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
                        </div>
                    ) : null}

                    {/* FDA Results */}
                    {insights && (
                      <FDAResults 
                        ingredients={recommendedIngredients} 
                        products={insights?.recommendedProducts}
                        onRefresh={handleRefreshInsights}
                        isRefreshing={isRefreshingInsights}
                      />
                    )}

                    {/* Clinic Finder */}
                    {insights && (
                      <ClinicFinder autoOpen={(insights?.clinicalImpression || '').toLowerCase().includes('severe')} />
                    )}
                  </>
                )}

                {!result && !isAnalyzing && (
                  <div className="py-12 md:py-20 text-center opacity-30 italic">
                     <i className="fa-solid fa-chart-line text-4xl md:text-6xl mb-4 text-[#a53d4c]"></i>
                     <p className="text-[10px] md:text-xs font-bold uppercase">Ready for Clinical Data Input</p>
                  </div>
                )}
                
                {isAnalyzing && (
                  <div className="py-12 md:py-20 text-center flex flex-col items-center justify-center">
                     <div className="relative w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6">
                        <div className="absolute inset-0 border-4 border-[#a53d4c]/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#a53d4c] rounded-full border-t-transparent animate-spin"></div>
                        <i className="fa-solid fa-microscope text-2xl md:text-3xl text-[#a53d4c] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></i>
                     </div>
                     <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#a53d4c] animate-pulse mb-2">Analyzing Skin Lesions...</p>
                     <p className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wide">Generating Clinical Assessment Report</p>
                  </div>
                )}
             </div>
          </div>
        </div>

      </main>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="bg-[#fff9f0] rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-[#a53d4c]/30">
            <div className="px-6 py-6 md:px-10 md:py-8 bg-[#a53d4c] text-white flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="font-black text-lg md:text-xl uppercase tracking-tighter">Model Config</h3>
                <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">API / Endpoint Authorization</span>
              </div>
              <button type="button" onClick={() => setShowSettings(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-all" aria-label="Close Settings"><i className="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <div className="p-6 md:p-10 space-y-4 md:space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-4 md:space-y-5">
                <div>
                  <label htmlFor="roboflowKey" className="block text-[9px] md:text-[10px] font-black text-[#a53d4c] uppercase tracking-widest mb-2">Roboflow Private Key</label>
                  <input id="roboflowKey" type="password" value={roboflowKey} onChange={(e) => setRoboflowKey(e.target.value)} className="w-full px-4 py-3 md:px-6 md:py-4 bg-white border border-[#f3d9b1] rounded-2xl focus:ring-2 focus:ring-[#a53d4c] outline-none text-xs md:text-sm font-bold shadow-inner" placeholder="Roboflow Key" />
                </div>
                <div>
                  <label htmlFor="modelId" className="block text-[9px] md:text-[10px] font-black text-[#a53d4c] uppercase tracking-widest mb-2">Roboflow Endpoint URL</label>
                  <input id="modelId" type="text" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="e.g. acne-type/3" className="w-full px-4 py-3 md:px-6 md:py-4 bg-white border border-[#f3d9b1] rounded-2xl focus:ring-2 focus:ring-[#a53d4c] outline-none text-xs md:text-sm font-bold shadow-inner" />
                </div>
                <div>
                  <label htmlFor="geminiKey" className="block text-[9px] md:text-[10px] font-black text-[#a53d4c] uppercase tracking-widest mb-2">Gemini API Key (Optional)</label>
                  <input id="geminiKey" type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="w-full px-4 py-3 md:px-6 md:py-4 bg-white border border-[#f3d9b1] rounded-2xl focus:ring-2 focus:ring-[#a53d4c] outline-none text-xs md:text-sm font-bold shadow-inner" placeholder="Gemini API Key" />
                </div>

                <button type="submit" className="w-full py-4 md:py-5 bg-[#a53d4c] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#8b2635] transform active:scale-95 transition-all text-xs md:text-sm">
                  Save & Authorize
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 md:mt-20 py-8 md:py-16 text-center border-t border-[#a53d4c]/10">
        <div className="max-w-3xl mx-auto px-6 opacity-60">
          <div className="flex justify-center gap-6 md:gap-8 mb-6 md:mb-8 grayscale hover:grayscale-0 transition-all duration-500">
             <i className="fa-solid fa-microchip text-2xl md:text-4xl text-[#a53d4c]"></i>
             <i className="fa-solid fa-user-doctor text-2xl md:text-4xl text-[#a53d4c]"></i>
             <i className="fa-solid fa-earth-americas text-2xl md:text-4xl text-[#a53d4c]"></i>
          </div>
          <p className="text-[9px] md:text-[10px] text-[#a53d4c] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3 md:mb-4 text-center">Scientific Support Panel</p>
          <p className="text-[8px] md:text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight text-center mb-4 md:mb-6">
            Research funded through Sustainable Development Goals Initiative. Powered by Google Gemini Pro Intelligence and ResNet-50 Computer Vision Models. Built for diagnostic assistance and research evaluation purposes only.
          </p>
          <div className="bg-[#a53d4c]/5 p-3 md:p-4 rounded-xl border border-[#a53d4c]/10">
            <p className="text-[8px] md:text-[9px] text-[#a53d4c] font-bold uppercase tracking-wide leading-relaxed">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              Disclaimer: The AI-driven assessment and recommendations provided by this tool are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your dermatologist or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;