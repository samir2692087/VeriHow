
import React, { useState, useRef, useEffect } from 'react';
import { Shield, CheckCircle, Search, AlertOctagon, Info, RefreshCw, Globe, X, Upload, Languages, Download, History, Sparkles, Bot, ScanEye, ZoomIn, Trash2, ArrowRight, FileText, Zap, ChevronRight, AlertTriangle, Cpu, Clipboard, Check, Copy, Activity, ChevronDown, ChevronUp, List, Fingerprint, Lock, Radio } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { AnalysisResult, AIDetectionResult, AnalysisState, SAMPLE_TEXTS, HistoryItem, DISCLAIMER_TEXT, AppMode } from './types';
import { analyzeCredibility, detectAIImage, translateContent } from './services/geminiService';
import Gauge from './components/Gauge';
import SourceCard from './components/SourceCard';

// --- Static Content ---

const ABOUT_CONTENT = `
### VeriHow: The Standard for Digital Truth.

**VeriHow** is a professional-grade forensic analysis tool designed to help you verify information and detect synthetic media in seconds. We combine advanced AI with real-time open-source intelligence (OSINT) to give you a clear, objective analysis of the content you consume.

#### 🌟 Key Features

**1. Hybrid Fact-Checking Engine**
*   **Real-Time News Surveillance**: We don't just guess. Our engine instantly scans thousands of global and local news outlets to cross-reference claims with verified reports.
*   **Logical Stress-Testing**: Beyond news, our AI analyzes the semantic logic of a claim to detect fallacies, contradictions, and emotional manipulation.
*   **Multilingual Support**: Fluent in **English and 15+ Indian Languages** (Hindi, Bengali, Tamil, etc.), ensuring context is never lost in translation.

**2. Advanced AI & Deepfake Detection**
*   **Neural Forensic Scanner**: Detects invisible statistical anomalies in images that human eyes miss.
*   **Artifact Analysis**: Scans for "diffusion artifacts," upscaling noise, and GAN-grid residuals typical of AI-generated content.
*   **Physics & Biology Checks**: Verifies lighting consistency, shadow logic, and anatomical details (like eyes and hands) to spot fabrications.

**3. Professional Reporting Tools**
*   **PDF Export**: Generate high-quality, printable forensic reports for research or documentation.
*   **Instant Translation**: Translate complex analysis reports into your native language with a single click.
*   **Visual Evidence**: Upload images to cross-reference them with news stories (Context Verification).

#### 🛡️ Who is this for?
*   **Journalists & Researchers**: For rapid verification of breaking news and viral media.
*   **Students & Educators**: To learn media literacy and verify sources for projects.
*   **Everyday Users**: To stop the spread of misinformation in family groups and social media.

#### ⚖️ Legal Disclaimer
VeriHow is an automated analysis tool powered by Google's Gemini 2.5 architecture. While highly accurate, results are probabilistic. This report should be used as a reference tool to aid human judgment, not as absolute legal or factual proof.
`;

const PRIVACY_POLICY_CONTENT = `
### Privacy Policy
**Last Updated**: October 2023

Your privacy is our top priority. VeriHow is engineered with a **"Privacy-First"** architecture that ensures your data remains under your control. This policy outlines how we handle your information.

#### 1. No Server-Side Storage
*   **Zero Retention**: We do not operate middleware servers to store your queries, text inputs, or uploaded images.
*   **Direct-to-API**: Your data is transmitted directly from your secure browser session to the Google Gemini API for processing. Once the analysis is generated, the input data is discarded by the processing node.

#### 2. Your Data, Your Device
*   **Local History**: The "Investigation Logs" (History) feature stores data **exclusively on your physical device** (using browser LocalStorage).
*   **No Cloud Sync**: We do not sync your history to any cloud database. If you clear your browser cache or click the "Trash" icon in the app, your history is permanently deleted.

#### 3. Image & File Handling
*   **Transient Processing**: When you upload an image for forensic scanning, it is converted to a temporary secure format solely for the duration of the analysis. It is never saved to a public gallery or used for advertising.

#### 4. Third-Party Services
*   **Google Gemini API**: We utilize Google's enterprise-grade AI models for analysis. Data sent to the API is subject to Google's rigorous data privacy standards and is not used to train their public models without consent.

#### 5. Device Permissions
*   **Clipboard**: The app accesses your clipboard only when you explicitly click the "Paste" button to input text.
*   **Files/Gallery**: The app accesses your file system only when you manually select an image to upload. We do not perform background scanning.

#### 6. Contact Us
For privacy-related inquiries or feature requests, please contact the developer:
**Mohammad Samir**
(mohammadsamir2424@gmail.com)
`;

// --- Constants ---

const LOADING_STEPS = {
  FACT_CHECK_TEXT: [
    "Initializing Hybrid Investigation Protocol...",
    "Aggregating global news sources...",
    "Performing deep logic stress-tests...",
    "Triangulating primary evidence...",
    "Synthesizing comprehensive verdict..."
  ],
  FACT_CHECK_WITH_IMAGE: [
    "Extracting visual vectors...",
    "Cross-referencing media with news reports...",
    "Analyzing physical & logical consistency...",
    "Verifying geolocation & timestamps...",
    "Synthesizing forensic verdict..."
  ],
  AI_DETECTION: [
    "Initializing forensic engine...",
    "Mapping noise distribution...",
    "Scanning for diffusion artifacts...",
    "Analyzing lighting physics...",
    "Calculating probability score..."
  ]
};

// --- Helper Components ---

const BackgroundEffects = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#02040a]">
    <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-900/5 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/5 rounded-full blur-[120px]" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
    {/* Grid Pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"></div>
  </div>
);

const LoaderStyles = () => (
  <style>{`
    @keyframes scan-vertical {
      0% { top: 0%; opacity: 0.5; }
      50% { opacity: 1; box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
      100% { top: 100%; opacity: 0.5; }
    }
    .animate-scan {
      animation: scan-vertical 2s ease-in-out infinite;
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 10s linear infinite;
    }
    @keyframes spin-reverse-slow {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    .animate-spin-reverse-slow {
      animation: spin-reverse-slow 12s linear infinite;
    }
    @keyframes ping-slow {
        75%, 100% {
            transform: scale(2);
            opacity: 0;
        }
    }
    .animate-ping-slow {
        animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `}</style>
);

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING SECURE ENV");

  useEffect(() => {
    const timer1 = setTimeout(() => {
       setProgress(30);
       setStatus("LOADING FORENSIC MODULES");
    }, 500);

    const timer2 = setTimeout(() => {
       setProgress(65);
       setStatus("CONNECTING TO NEURAL GRID");
    }, 1500);

    const timer3 = setTimeout(() => {
       setProgress(100);
       setStatus("SYSTEM READY");
    }, 2500);

    const timer4 = setTimeout(() => {
       onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#02040a] flex flex-col items-center justify-center text-white overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#02040a] to-[#02040a]"></div>
       
       <div className="relative z-10 flex flex-col items-center">
          {/* Logo Container */}
          <div className="relative mb-8">
             <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse"></div>
             <div className="relative w-24 h-24 bg-[#0b101b] rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
                 <Shield className="w-12 h-12 text-blue-500" strokeWidth={1.5} />
                 
                 {/* Scanning Line */}
                 <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="h-[2px] w-full bg-blue-400/50 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-scan"></div>
                 </div>
                 
                 {/* Decorative Corners */}
                 <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-blue-500/50"></div>
                 <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-blue-500/50"></div>
                 <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-blue-500/50"></div>
                 <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-blue-500/50"></div>
             </div>
          </div>

          {/* Typography */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 flex items-center gap-2">
             VeriHow
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-4"></span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-[0.3em] uppercase mb-12">
             Forensic Intelligence Engine
          </p>

          {/* Loader */}
          <div className="w-64 space-y-2">
             <div className="flex justify-between text-[10px] font-mono text-blue-400 font-bold uppercase">
                <span>{status}</span>
                <span>{progress}%</span>
             </div>
             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                >
                   <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
             </div>
          </div>
          
          {/* Footer Tech Text */}
          <div className="absolute bottom-10 text-[10px] text-slate-700 font-mono flex gap-4 uppercase tracking-widest">
             <span className="flex items-center gap-1"><Lock size={10}/> Encrypted</span>
             <span className="flex items-center gap-1"><Radio size={10}/> Serverless</span>
             <span className="flex items-center gap-1"><Fingerprint size={10}/> Biometric-Ready</span>
          </div>
       </div>
    </div>
  );
};

const NeuralNetworkVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center min-h-[200px]">
    {/* Glow background */}
    <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full animate-pulse"></div>
    
    <svg viewBox="0 0 200 200" className="w-48 h-48 relative z-10">
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{stopColor:'rgb(59,130,246)', stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:'rgb(15,23,42)', stopOpacity:0}} />
        </radialGradient>
      </defs>
      
      {/* Central Hub */}
      <circle cx="100" cy="100" r="20" className="fill-blue-500/20 stroke-blue-400 stroke-[1.5] animate-pulse" />
      <circle cx="100" cy="100" r="8" className="fill-blue-400 animate-pulse" />
      
      {/* Orbit Ring 1 */}
      <g className="animate-spin-slow origin-center" style={{transformBox: 'fill-box'}}>
         <circle cx="100" cy="40" r="4" className="fill-indigo-400" />
         <circle cx="160" cy="100" r="4" className="fill-indigo-400" />
         <circle cx="100" cy="160" r="4" className="fill-indigo-400" />
         <circle cx="40" cy="100" r="4" className="fill-indigo-400" />
         
         <line x1="100" y1="48" x2="100" y2="88" className="stroke-indigo-500/40 stroke-[1]" />
         <line x1="152" y1="100" x2="112" y2="100" className="stroke-indigo-500/40 stroke-[1]" />
         <line x1="100" y1="152" x2="100" y2="112" className="stroke-indigo-500/40 stroke-[1]" />
         <line x1="48" y1="100" x2="88" y2="100" className="stroke-indigo-500/40 stroke-[1]" />
      </g>
      
      {/* Orbit Ring 2 */}
      <g className="animate-spin-reverse-slow origin-center" style={{transformBox: 'fill-box'}}>
         <circle cx="142" cy="58" r="3" className="fill-purple-400" />
         <circle cx="58" cy="142" r="3" className="fill-purple-400" />
         <line x1="138" y1="62" x2="108" y2="92" className="stroke-purple-500/30 stroke-[1]" />
         <line x1="62" y1="138" x2="92" y2="108" className="stroke-purple-500/30 stroke-[1]" />
      </g>
    </svg>
    
    <div className="absolute bottom-4 text-[10px] text-blue-400 font-mono animate-pulse tracking-widest">
        PROCESSING KNOWLEDGE GRAPH
    </div>
  </div>
);

const ImageScannerVisual: React.FC<{ src: string }> = ({ src }) => (
  <div className="relative w-full h-full min-h-[200px] flex items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-[#050914]">
    <img src={src} className="w-full h-full object-cover opacity-60" alt="Scanning Target" />
    
    {/* Grid Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    
    {/* Scanning Bar */}
    <div className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan z-10"></div>
    
    {/* Scanning Text */}
    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] font-mono text-blue-400 border border-blue-500/30 flex items-center gap-2">
       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
       FORENSIC SCAN
    </div>
  </div>
);

const Tooltip: React.FC<{ text: string; children: React.ReactNode; className?: string }> = ({ text, children, className = "" }) => (
  <div className={`group relative flex items-center justify-center ${className}`}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/90 text-slate-200 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-[70] border border-slate-700/50 shadow-xl backdrop-blur-sm">
      {text}
    </div>
  </div>
);

const CollapsibleSection: React.FC<{ 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  className?: string;
  count?: number;
}> = ({ title, icon: Icon, children, defaultOpen = false, className = "", count }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-[#0b101b]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-white/10 ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Icon size={18} />
          </div>
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">{title}</h3>
          {count !== undefined && count > 0 && (
             <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-white/5">{count}</span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
      </button>
      
      {/* Animated Height Container */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 border-t border-white/5 bg-black/20">
          {children}
        </div>
      </div>
    </div>
  );
};

const MarkdownDisplay: React.FC<{ content: string; score?: number; isPrintMode?: boolean }> = ({ content, score, isPrintMode = false }) => {
  // Guard clause for undefined content to prevent crash
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  const getHighlightClass = () => {
    if (isPrintMode) {
       if (score === undefined) return "bg-blue-100 text-blue-900 border-blue-200";
       if (score < 50) return "bg-red-100 text-red-900 border-red-200";
       if (score < 70) return "bg-amber-100 text-amber-900 border-amber-200";
       return "bg-emerald-100 text-emerald-900 border-emerald-200";
    }

    if (score === undefined) return "bg-blue-500/20 text-blue-200 border-blue-500/30";
    if (score < 50) return "bg-red-500/20 text-red-200 border-red-500/30";
    if (score < 70) return "bg-amber-500/20 text-amber-200 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
  };
  
  const highlightClass = getHighlightClass();
  const textColor = isPrintMode ? "text-slate-700" : "text-slate-300";
  const boldColor = isPrintMode ? "text-slate-900" : "text-slate-100";
  const headerColor = isPrintMode ? "text-slate-900" : "text-white";
  const codeBg = isPrintMode ? "bg-slate-100 text-blue-800 border-slate-300" : "bg-[#0b101b] text-blue-300 border-slate-800";
  
  const regex = /(\*\*.*?\*\*|`.*?`|==.*?==)/g;

  const renderInlineContent = (text: string, keyPrefix: string) => {
    return text.split(regex).map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        const isKey = part.endsWith('**:'); 
        return <strong key={key} className={isKey ? boldColor : `${boldColor} font-semibold`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={key} className={`${codeBg} px-1.5 py-0.5 rounded text-sm font-mono border`}>{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('==') && part.endsWith('==')) {
         return (
           <mark key={key} className={`inline-block px-1 rounded mx-0.5 border ${highlightClass}`}>
             {part.slice(2, -2)}
           </mark>
         );
      }
      return part;
    });
  };
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('```')) {
      const codeLines = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('```')) {
        codeLines.push(lines[j]);
        j++;
      }
      elements.push(
        <div key={`code-${i}`} className={`${codeBg} p-4 rounded-xl border font-mono text-sm overflow-x-auto my-4 shadow-sm`}>
          <pre>{codeLines.join('\n')}</pre>
        </div>
      );
      i = j + 1; 
      continue;
    }

    if (trimmed.startsWith('|')) {
      const tableRows = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableRows.push(lines[j]);
        j++;
      }
      
      if (tableRows.length >= 2) {
        const parseRow = (row: string) => row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        const headers = parseRow(tableRows[0]);
        const bodyRows = tableRows.slice(2).map(parseRow);

        elements.push(
          <div key={`table-${i}`} className={`overflow-x-auto my-6 border rounded-xl shadow-sm ${isPrintMode ? 'border-slate-300' : 'border-slate-800'}`}>
            <table className="w-full text-left border-collapse">
              <thead className={isPrintMode ? "bg-slate-200 text-slate-800" : "bg-slate-900/80 text-slate-200"}>
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className={`p-4 border-b font-semibold whitespace-nowrap text-xs uppercase tracking-wider ${isPrintMode ? 'border-slate-300' : 'border-slate-800'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={isPrintMode ? "divide-y divide-slate-200 bg-white" : "divide-y divide-slate-800 bg-slate-950/40"}>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={isPrintMode ? "hover:bg-slate-50" : "hover:bg-slate-900/50"}>
                     {row.map((cell, cIdx) => (
                       <td key={cIdx} className={`p-4 text-sm ${isPrintMode ? 'text-slate-700' : 'text-slate-400'}`}>{cell}</td>
                     ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j;
        continue;
      }
    }

    if (line.startsWith('### ')) {
       elements.push(<h3 key={`h3-${i}`} className={`text-lg font-bold mt-8 mb-3 flex items-center ${headerColor}`}>{line.replace('### ', '')}</h3>);
       i++; continue;
    }
    if (line.startsWith('## ')) {
       elements.push(<h2 key={`h2-${i}`} className={`text-xl font-bold mt-10 mb-4 border-b pb-3 ${isPrintMode ? 'text-blue-700 border-slate-300' : 'text-blue-400 border-slate-800'}`}>{line.replace('## ', '')}</h2>);
       i++; continue;
    }

    if (trimmed.startsWith('ch>')) {
        // Special character rendering if needed
    }

    if (trimmed.startsWith('>')) {
       elements.push(
         <blockquote key={`qt-${i}`} className={`border-l-4 pl-4 py-2 my-5 italic rounded-r-lg ${isPrintMode ? 'border-blue-600 bg-slate-100 text-slate-600' : 'border-blue-500/50 bg-blue-900/10 text-slate-400'}`}>
           {trimmed.replace(/^>\s?/, '')}
         </blockquote>
       );
       i++; continue;
    }

    if (trimmed.startsWith('- ')) {
        const cleanLine = trimmed.replace(/^- /, '');
        elements.push(
            <li key={`li-${i}`} className={`flex items-start gap-3 mb-3 leading-relaxed ${textColor}`}>
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 opacity-70"></div>
              <span>{renderInlineContent(cleanLine, `li-${i}`)}</span>
            </li>
        );
        i++; continue;
    }
    
    if (trimmed === '') {
        elements.push(<div key={`br-${i}`} className="h-2"></div>);
        i++; continue;
    }

    elements.push(
      <p key={`p-${i}`} className={`mb-4 leading-7 ${textColor}`}>
        {renderInlineContent(line, `p-${i}`)}
      </p>
    );
    i++;
  }

  return (
    <div className={`space-y-1 text-sm md:text-base font-sans ${isPrintMode ? 'text-slate-800' : 'text-slate-300'}`}>
      {elements}
    </div>
  );
};

const ImageInspector: React.FC<{ src: string }> = ({ src }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-700/50 bg-[#050914] group cursor-crosshair shadow-inner"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <img src={src} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" alt="Analyzed Target" />
      
      {isHovering && (
        <div 
          className="absolute pointer-events-none rounded-full border-2 border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.5)] bg-no-repeat z-20"
          style={{
            width: '180px',
            height: '180px',
            left: `calc(${position.x}% - 90px)`,
            top: `calc(${position.y}% - 90px)`,
            backgroundImage: `url(${src})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: '350%',
            backgroundColor: '#000'
          }}
        />
      )}
      
      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none border border-white/10 shadow-lg">
        <ZoomIn size={12} className="text-blue-400"/> Magnify
      </div>
    </div>
  );
};

const SUPPORTED_LANGUAGES = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu", "Gujarati", 
  "Kannada", "Odia", "Malayalam", "Punjabi", "Assamese", "Maithili", "Santali", 
  "Kashmiri", "Nepali", "Konkani", "Sindhi", "Dogri", "Manipuri", "Bodo", "Sanskrit"
];

const MAX_HISTORY_ITEMS = 50;

// --- Main App Component ---

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AppMode>('FACT_CHECK');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.IDLE);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [targetLang, setTargetLang] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('verihow_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (analysisState === AnalysisState.ANALYZING) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [analysisState]);

  const saveHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    setHistory(updated);
    localStorage.setItem('verihow_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('verihow_history');
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        setUploadError("Invalid file type. Please upload an image (JPG, PNG).");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        setUploadError("File too large. Maximum size is 5MB.");
        return;
    }
    
    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        processFile(file);
    }
    // Reset input to allow re-selection
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        processFile(file);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };
  
  const handleCopyReport = () => {
      const content = mode === 'AI_DETECTOR' ? aiResult?.analysis : result?.explanation;
      if (content) {
          navigator.clipboard.writeText(content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  // Helper to safely reset state when switching modes
  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    setResult(null);
    setAiResult(null);
    setErrorMessage(null);
    setAnalysisState(AnalysisState.IDLE);
    // Note: We intentionally don't clear inputs/image so user can switch contexts
  };

  const handleAnalyze = async () => {
    if (!inputText && !selectedImage) return;
    if (mode === 'AI_DETECTOR' && !selectedImage) {
      alert("Please upload an image for AI detection.");
      return;
    }

    setAnalysisState(AnalysisState.ANALYZING);
    setResult(null);
    setAiResult(null);
    setErrorMessage(null);

    // Smooth scroll to results area
    setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      if (mode === 'FACT_CHECK') {
        const res = await analyzeCredibility(inputText, selectedImage || undefined);
        setResult(res);
        saveHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: 'FACT_CHECK',
          inputText,
          imageData: selectedImage || undefined,
          factCheckResult: res
        });
      } else {
        if (!selectedImage) throw new Error("Image required");
        const res = await detectAIImage(selectedImage);
        setAiResult(res);
        saveHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: 'AI_DETECTOR',
          inputText,
          imageData: selectedImage,
          aiResult: res
        });
      }
      setAnalysisState(AnalysisState.COMPLETE);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setAnalysisState(AnalysisState.ERROR);
    }
  };

  const handleTranslate = async () => {
    if (!result?.explanation || isTranslating) return;
    setIsTranslating(true);
    try {
      const translated = await translateContent(result.explanation, targetLang);
      setResult({ ...result, explanation: translated });
    } catch (e) {
      alert("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`verihow-report-${Date.now()}.pdf`);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setMode(item.mode);
    setInputText(item.inputText || '');
    setSelectedImage(item.imageData || null);
    setErrorMessage(null);
    
    if (item.mode === 'FACT_CHECK' && (item.factCheckResult || item.verdict)) {
       const result = item.factCheckResult || {
          verdict: item.verdict!,
          score: item.score!,
          explanation: item.explanation!,
          groundingChunks: item.groundingChunks || []
       };
       setResult(result);
       setAiResult(null);
    } else if (item.mode === 'AI_DETECTOR' && item.aiResult) {
       setAiResult(item.aiResult);
       setResult(null);
    }
    
    setAnalysisState(AnalysisState.COMPLETE);
    setShowHistory(false);
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const renderAnalysisContent = () => {
    if (analysisState === AnalysisState.ANALYZING) {
      const steps = mode === 'AI_DETECTOR' 
        ? LOADING_STEPS.AI_DETECTION 
        : (selectedImage ? LOADING_STEPS.FACT_CHECK_WITH_IMAGE : LOADING_STEPS.FACT_CHECK_TEXT);

      return (
        <div ref={resultRef} className="flex flex-col items-center justify-center py-20 text-slate-400 min-h-[400px]">
           <div className="bg-[#0b101b]/80 border border-white/10 p-1 rounded-3xl shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col md:flex-row backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse z-20"></div>
              
              {/* Visual Side */}
              <div className="w-full md:w-1/2 bg-[#02040a] p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative min-h-[250px]">
                 {selectedImage ? (
                   <ImageScannerVisual src={selectedImage} />
                 ) : (
                   <NeuralNetworkVisual />
                 )}
                 <div className="mt-6 flex items-center gap-2 text-xs font-mono text-blue-400">
                    <Activity size={14} className="animate-pulse" />
                    <span>ANALYSIS_PROTOCOL_V2.5_ACTIVE</span>
                 </div>
              </div>

              {/* Steps Log Side */}
              <div className="w-full md:w-1/2 p-8 md:p-10 bg-[#0b101b]/40 flex flex-col justify-center">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                       <Cpu className="w-6 h-6 animate-pulse text-blue-400" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-200 tracking-tight">System Diagnostics</h3>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Gemini 2.5 Neural Engine</p>
                    </div>
                 </div>

                 <div className="space-y-5">
                    {steps.map((step, idx) => (
                       <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${idx > currentStep ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
                          <div className="relative shrink-0">
                             {idx < currentStep ? (
                                <div className="bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20">
                                   <CheckCircle size={16} className="text-emerald-500" />
                                </div>
                             ) : idx === currentStep ? (
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping-slow"></div>
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                                </div>
                             ) : (
                                <div className="w-6 h-6 flex items-center justify-center">
                                   <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                                </div>
                             )}
                          </div>
                          <span className={`text-sm font-medium font-mono ${idx === currentStep ? 'text-blue-300' : idx < currentStep ? 'text-slate-400' : 'text-slate-600'}`}>
                             {step}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      );
    }

    if (analysisState === AnalysisState.ERROR) {
       return (
         <div ref={resultRef} className="flex flex-col items-center justify-center py-24 text-red-400 bg-red-950/10 border border-red-500/20 rounded-3xl mt-8">
           <AlertOctagon className="w-16 h-16 mb-4 opacity-80" strokeWidth={1.5} />
           <h3 className="text-xl font-medium text-slate-200">Analysis Failed</h3>
           <p className="mt-2 text-sm text-slate-400 px-6 text-center max-w-lg">
             {errorMessage || "Please try again. If the problem persists, check your connection."}
           </p>
         </div>
       );
    }

    if (analysisState === AnalysisState.COMPLETE) {
      const isAI = mode === 'AI_DETECTOR';
      
      // Determine if we have the correct result object for the current mode.
      // We explicitly check for the existence of the specific result type.
      // If we switched modes but state hasn't fully cleared/swapped yet, this prevents using the wrong result.
      const currentResult = isAI ? aiResult : result;
      const hasValidResult = !!currentResult;

      if (hasValidResult) {
        // Safe property access with defaults to prevent crashes if result is malformed
        const scoreVal = currentResult?.score ?? 0;
        const displayScore = isAI ? (100 - scoreVal) : scoreVal;
        
        let badgeColor = "bg-slate-700 text-slate-200";
        let verdictText = "";
        
        if (!isAI && result) {
            verdictText = result.verdict || "UNVERIFIED";
            if (['CREDIBLE'].includes(verdictText)) badgeColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
            if (['QUESTIONABLE', 'SATIRE'].includes(verdictText)) badgeColor = "bg-amber-500/10 text-amber-300 border-amber-500/30";
            if (['MISLEADING', 'FALSE'].includes(verdictText)) badgeColor = "bg-red-500/10 text-red-300 border-red-500/30";
        } else if (isAI && aiResult) {
            verdictText = aiResult.verdict || "UNCLEAR";
            // Logic using Authenticity Score: High (Human) = Green, Low (AI) = Red
            if (displayScore < 50) badgeColor = "bg-red-500/10 text-red-300 border-red-500/30";
            else if (displayScore < 80) badgeColor = "bg-amber-500/10 text-amber-300 border-amber-500/30";
            else badgeColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
        }
        
        // Parsing Logic for Fact Check
        // Use optional chaining and default to empty string to prevent regex crash on undefined
        const rawExplanation = (isAI ? aiResult?.analysis : result?.explanation) || "";
        
        // Extract Executive Summary
        const summaryMatch = rawExplanation.match(/### Executive Summary([\s\S]*?)(?=###|$)/i);
        const executiveSummary = summaryMatch ? summaryMatch[1].trim() : null;
        
        // Remove Summary from body for Detailed View
        const detailedBody = rawExplanation.replace(/### Executive Summary[\s\S]*?(?=###|$)/i, '').trim();

        return (
            <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
            
            {/* Print Template (Hidden) */}
            <div className="fixed -left-[9999px] top-0 w-[210mm] bg-white text-slate-900 p-12" ref={printRef}>
                <h1 className="text-3xl font-bold mb-2">VeriHow Analysis Report</h1>
                <div className="text-sm text-slate-500 mb-8">{new Date().toLocaleString()}</div>
                
                <div className="border-2 border-slate-100 p-6 mb-8 rounded-xl bg-slate-50 flex justify-between items-center">
                    <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Verdict</div>
                    <div className="text-3xl font-bold tracking-tight">{verdictText}</div>
                    </div>
                    <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{isAI ? "Authenticity Score" : "Credibility Score"}</div>
                    <div className="text-3xl font-bold tracking-tight text-blue-600">{displayScore}/100</div>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-4 border-b pb-2">Detailed Analysis</h2>
                <MarkdownDisplay content={rawExplanation} score={displayScore} isPrintMode={true} />
                
                <div className="mt-12 pt-6 border-t text-xs text-slate-400">
                {DISCLAIMER_TEXT}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Verdict Card */}
                <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0b101b]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl group">
                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${badgeColor.includes('emerald') ? 'text-emerald-500' : badgeColor.includes('red') ? 'text-red-500' : 'text-amber-500'}`}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                    {isAI ? "Detection Verdict" : "Credibility Verdict"}
                    </h3>
                    
                    <div className={`px-6 py-2.5 rounded-full border ${badgeColor} font-bold text-lg mb-8 shadow-[0_0_20px_rgba(0,0,0,0.3)] tracking-wide`}>
                    {verdictText}
                    </div>
                    
                    <div className="w-56 h-56 relative scale-110">
                    <Gauge score={displayScore} />
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-6 text-center max-w-[200px] leading-relaxed border-t border-white/5 pt-4">
                    {isAI ? "Score reflects the likelihood of the image being original and human-created." : "Score reflects credibility based on available evidence and sources."}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleExportPDF} className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0b101b]/60 hover:bg-[#1a2236] border border-white/5 hover:border-blue-500/20 rounded-2xl transition-all text-slate-300 text-sm font-medium group">
                        <Download size={20} className="text-blue-500 group-hover:scale-110 transition-transform" /> 
                        <span>Export PDF</span>
                    </button>

                    {!isAI ? (
                    <div className="relative group/lang">
                        <button className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 bg-[#0b101b]/60 hover:bg-[#1a2236] border border-white/5 hover:border-purple-500/20 rounded-2xl transition-all text-slate-300 text-sm font-medium">
                        <Languages size={20} className="text-purple-500 group-hover/lang:scale-110 transition-transform" />
                        <span>Translate</span>
                        </button>
                        
                        <div className="absolute bottom-full left-0 w-[160%] -ml-[30%] mb-2 bg-[#0b101b] border border-slate-700/50 rounded-xl shadow-2xl p-3 hidden group-hover/lang:block z-20 animate-in fade-in zoom-in-95 duration-200">
                            <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Target Language</h4>
                            <select 
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-lg border border-slate-800 mb-3 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                            >
                            {SUPPORTED_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                            <button 
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-lg shadow-blue-900/20"
                            >
                            {isTranslating ? <RefreshCw className="animate-spin w-3 h-3"/> : "Translate Report"}
                            </button>
                        </div>
                    </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0b101b]/40 border border-white/5 rounded-2xl opacity-40 cursor-not-allowed text-slate-500 text-sm font-medium">
                        <Languages size={20} />
                        <span>n/a</span>
                        </div>
                    )}
                </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-4">
                
                {/* Image Inspector Card */}
                {selectedImage && (
                    <div className="bg-[#0b101b]/80 backdrop-blur-xl border border-white/5 p-1 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                            <ScanEye size={18} className="text-purple-400" /> 
                            Visual Analysis Target
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAI ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></span>
                            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                            {isAI ? "Forensic Layer" : "Context Layer"}
                            </div>
                        </div>
                    </div>
                    <div className="p-1 bg-black/40 h-[400px]">
                        <ImageInspector src={selectedImage} />
                    </div>
                    </div>
                )}

                {/* 1. Executive Summary Collapsible */}
                {executiveSummary && (
                    <CollapsibleSection title="Executive Summary" icon={Sparkles} defaultOpen={true}>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                            <MarkdownDisplay content={executiveSummary} />
                        </div>
                    </CollapsibleSection>
                )}

                {/* 2. Sources Collapsible (Fact Check Only) */}
                {!isAI && result?.groundingChunks && result.groundingChunks.length > 0 && (
                    <CollapsibleSection title="Verified Sources" icon={Globe} defaultOpen={true} count={result.groundingChunks.length}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {result.groundingChunks.map((chunk, idx) => (
                                <SourceCard key={idx} chunk={chunk} index={idx} />
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* 3. Detailed Analysis Collapsible */}
                <CollapsibleSection title="Detailed Investigation Report" icon={List} defaultOpen={true}>
                    <div className="prose prose-invert prose-lg max-w-none">
                        <MarkdownDisplay content={detailedBody} score={displayScore} />
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-start gap-3 opacity-75">
                        <AlertTriangle size={16} className="text-amber-500/50 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            {DISCLAIMER_TEXT}
                        </p>
                    </div>
                </CollapsibleSection>

                </div>
            </div>
            </div>
        );
      }
    }
    
    // Default Idle State
    return (
      <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-slate-500 relative animate-in fade-in duration-700">
        <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-blue-300 text-[11px] font-bold tracking-widest uppercase mb-2 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <Sparkles size={12} /> Gemini 2.5 Powered
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
              Truth in the age of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Synthetic Media.</span>
            </h2>
            
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-light">
              {mode === 'FACT_CHECK' 
                ? "Verify news, claims, and documents instantly. Our engine cross-references trusted global sources to separate fact from fiction."
                : "Detect deepfakes and AI-generated imagery with forensic precision. Analyze artifacts, lighting, and consistency in seconds."}
            </p>
        </div>
      </div>
    );
  };

  if (showSplash) {
      return (
          <>
            <LoaderStyles />
            <BackgroundEffects />
            <SplashScreen onComplete={() => setShowSplash(false)} />
          </>
      );
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white relative overflow-x-hidden animate-in fade-in duration-1000">
      
      <BackgroundEffects />
      <LoaderStyles />
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#02040a]/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleModeSwitch('FACT_CHECK')}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform">
              <Shield className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors leading-none">
                VeriHow
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">FORENSIC ENGINE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip text="History">
              <button onClick={() => setShowHistory(true)} className="p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95">
                <History size={18} />
              </button>
            </Tooltip>
            <Tooltip text="About">
              <button onClick={() => setShowAbout(true)} className="p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95">
                <Info size={18} />
              </button>
            </Tooltip>
             <Tooltip text="Privacy">
              <button onClick={() => setShowPrivacy(true)} className="p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95">
                <Shield size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 relative z-10">
        
        {/* Mode Switcher */}
        <div className="flex justify-center mb-16 relative z-20">
          <div className="relative flex w-full max-w-[360px] bg-[#0b101b] p-1.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl">
            {/* Background Pill */}
            <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-[0_2px_15px_rgba(0,0,0,0.3)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) border border-white/10 ${
                    mode === 'FACT_CHECK' 
                    ? 'left-1.5 bg-gradient-to-b from-blue-600 to-blue-700 shadow-blue-500/20' 
                    : 'translate-x-full left-1.5 bg-gradient-to-b from-indigo-600 to-indigo-700 shadow-indigo-500/20'
                }`}
            >
                {/* Inner Highlight for 3D feel */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-t-full"></div>
            </div>

            <button
                onClick={() => handleModeSwitch('FACT_CHECK')}
                className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'FACT_CHECK' ? 'text-white text-shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Search size={16} className={`transition-colors ${mode === 'FACT_CHECK' ? 'text-white' : 'text-current'}`} strokeWidth={2.5} />
                Fact Check
            </button>
            <button
                onClick={() => handleModeSwitch('AI_DETECTOR')}
                className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'AI_DETECTOR' ? 'text-white text-shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Bot size={16} className={`transition-colors ${mode === 'AI_DETECTOR' ? 'text-white' : 'text-current'}`} strokeWidth={2.5} />
                AI Detector
            </button>
          </div>
        </div>

        {/* Unified Input Console */}
        <div className="bg-[#0b101b]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 shadow-2xl transition-all hover:border-white/20 group animate-in slide-in-from-bottom-4 duration-700">
           <div className="bg-[#02040a] rounded-[24px] p-6 md:p-8 border border-white/5 relative overflow-hidden">
              {/* Subtle top glow */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 transition-all duration-500 ease-in-out">
                  
                  {/* Text Input Area - ONLY FOR FACT_CHECK */}
                  {mode === 'FACT_CHECK' && (
                  <div className="md:col-span-9 flex flex-col h-full animate-in slide-in-from-left-4 fade-in duration-500">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} className="text-blue-500"/> Analysis Context
                        </label>
                        <div className="flex gap-2">
                           {!inputText && (
                              <button onClick={handlePaste} className="text-[10px] text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-800 px-2.5 py-1 rounded transition-colors flex items-center gap-1 border border-white/5">
                                 <Clipboard size={10} /> PASTE
                              </button>
                            )}
                           {!inputText && (
                              <div className="flex gap-1.5">
                                 {SAMPLE_TEXTS.map((sample, i) => (
                                    <button 
                                      key={i} 
                                      onClick={() => setInputText(sample.text)}
                                      className="text-[10px] bg-slate-900/50 hover:bg-blue-600/20 text-slate-500 hover:text-blue-300 px-2 py-1 rounded border border-white/5 transition-colors"
                                    >
                                      {sample.label.split(' ')[0]}
                                    </button>
                                 ))}
                              </div>
                           )}
                           {inputText && <button onClick={() => setInputText('')} className="text-[10px] text-slate-500 hover:text-red-400 bg-slate-900/50 px-2 py-1 rounded transition-colors flex items-center gap-1"><Trash2 size={10}/> CLEAR</button>}
                        </div>
                    </div>
                    
                    <div className="relative group/input flex-grow">
                      <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full h-48 md:h-full min-h-[180px] bg-[#0b101b] border border-slate-800/60 rounded-2xl p-5 text-base text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none placeholder:text-slate-700 transition-all font-light leading-relaxed font-mono text-sm"
                        placeholder="// Input claim, text, or news snippet to verify..."
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] text-slate-700 pointer-events-none group-focus-within/input:text-blue-500/50 transition-colors font-mono">
                        {inputText.length} CHARS
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Divider - ONLY FOR FACT_CHECK */}
                  {mode === 'FACT_CHECK' && (
                    <div className="hidden md:block w-px bg-white/5 my-2 animate-in fade-in duration-500"></div>
                  )}

                  {/* Image Input Area - Small in Fact Check, Central in AI Detector */}
                  <div className={`${mode === 'FACT_CHECK' ? 'md:col-span-2' : 'md:col-span-6 md:col-start-4'} flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]`}>
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ScanEye size={14} className="text-indigo-500"/> {mode === 'FACT_CHECK' ? 'Evidence' : 'Target Media'}
                        </label>
                         {selectedImage && <button onClick={() => setSelectedImage(null)} className="text-[10px] text-slate-500 hover:text-red-400 bg-slate-900/50 px-2 py-1 rounded transition-colors flex items-center gap-1"><X size={10}/> REMOVE</button>}
                    </div>
                    
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative flex-grow min-h-[180px] border-2 border-dashed rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center group/drop 
                        ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : ''}
                        ${uploadError ? 'border-red-500/50 bg-red-500/5' : ''}
                        ${uploadSuccess ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                        ${!isDragging && !uploadError && !uploadSuccess && selectedImage ? 'border-indigo-500/30 bg-[#0b101b]' : ''}
                        ${!isDragging && !uploadError && !uploadSuccess && !selectedImage ? 'border-slate-800/60 bg-[#0b101b] hover:border-indigo-500/40 hover:bg-[#0b101b]/80' : ''}
                        `}
                    >
                        {/* Drag Overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b101b]/90 backdrop-blur-sm">
                                <div className="p-4 bg-blue-500/20 rounded-full mb-4 animate-bounce">
                                    <Upload size={32} className="text-blue-400" />
                                </div>
                                <p className="text-blue-200 font-bold tracking-wider text-sm">RELEASE TO SCAN</p>
                            </div>
                        )}

                        {/* Error Overlay */}
                        {uploadError && (
                            <div className="absolute top-4 left-4 right-4 z-40 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-lg shadow-red-900/20 backdrop-blur-md">
                                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                                <span className="text-xs text-red-200 font-medium">{uploadError}</span>
                                <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-200"><X size={14} /></button>
                            </div>
                        )}

                        {/* Success Overlay */}
                        {uploadSuccess && (
                            <div className="absolute top-4 left-4 right-4 z-40 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-lg shadow-emerald-900/20 backdrop-blur-md">
                                <div className="p-1 bg-emerald-500/20 rounded-full">
                                  <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                                </div>
                                <span className="text-xs text-emerald-200 font-bold tracking-wide">MEDIA VERIFIED</span>
                            </div>
                        )}

                        {selectedImage ? (
                          <div className="relative w-full h-full p-2 flex items-center justify-center">
                            <img src={selectedImage} alt="Preview" className="max-h-[160px] max-w-full object-contain rounded-lg shadow-2xl" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/drop:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs backdrop-blur-sm cursor-pointer">
                               CHANGE IMAGE
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 pointer-events-none group-hover/drop:scale-105 transition-transform duration-300">
                             {mode === 'AI_DETECTOR' ? (
                                <>
                                    <div className="w-16 h-16 bg-[#02040a] rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 group-hover/drop:border-indigo-500/50 group-hover/drop:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all">
                                       <Upload size={24} className="text-slate-600 group-hover/drop:text-indigo-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-400 group-hover/drop:text-slate-200 transition-colors">Drag & Drop Image</p>
                                    <p className="text-[10px] text-slate-600 mt-1.5 uppercase tracking-wide">JPG, PNG • Max 5MB</p>
                                </>
                             ) : (
                                <>
                                    <div className="w-10 h-10 bg-[#02040a] rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-800 group-hover/drop:border-indigo-500/50 transition-all">
                                       <Upload size={18} className="text-slate-600 group-hover/drop:text-indigo-400" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 group-hover/drop:text-slate-200 transition-colors">Add Image</p>
                                </>
                             )}
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        
                        {/* Corner Accents */}
                        {!selectedImage && !isDragging && (
                            <>
                                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-slate-600 opacity-50"></div>
                                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-slate-600 opacity-50"></div>
                                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-slate-600 opacity-50"></div>
                                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-slate-600 opacity-50"></div>
                            </>
                        )}
                    </div>
                  </div>
              </div>

              <div className="mt-8 flex justify-end pt-6 border-t border-white/5">
                  <button 
                    onClick={handleAnalyze}
                    disabled={analysisState === AnalysisState.ANALYZING || (!inputText && !selectedImage)}
                    className="group relative inline-flex items-center justify-center gap-3 bg-white text-black hover:bg-blue-50 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 disabled:cursor-not-allowed px-8 py-3.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all active:scale-95 overflow-hidden border border-transparent"
                  >
                    <span className="relative flex items-center gap-2">
                      {analysisState === AnalysisState.ANALYZING ? (
                        <><RefreshCw className="animate-spin" size={16}/> Initializing Scan...</>
                      ) : (
                        <>{mode === 'FACT_CHECK' ? 'Verify Content' : 'Start Forensic Scan'} <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </span>
                  </button>
              </div>
           </div>
        </div>

        {/* Results */}
        {renderAnalysisContent()}

      </main>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b101b] border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold text-lg flex items-center gap-2 text-white"><History size={18} className="text-blue-400" /> Investigation Logs</h3>
              <div className="flex items-center gap-2">
                 {history.length > 0 && (
                   <button onClick={clearHistory} className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 rounded-lg" title="Clear All"><Trash2 size={16} /></button>
                 )}
                 <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"><X size={18} /></button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar bg-black/20">
               {history.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
                   <div className="p-4 bg-white/5 rounded-full"><History size={32} className="opacity-50" /></div>
                   <p className="text-sm font-medium">No logs found</p>
                 </div>
               ) : (
                 history.map(item => (
                   <button 
                     key={item.id} 
                     onClick={() => loadHistoryItem(item)}
                     className="w-full text-left p-4 rounded-2xl hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group bg-[#0f1524]"
                   >
                     <div className="flex justify-between items-start mb-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${item.mode === 'FACT_CHECK' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>
                          {item.mode === 'FACT_CHECK' ? 'FACT CHECK' : 'AI FORENSICS'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm text-slate-300 line-clamp-2 font-medium group-hover:text-white transition-colors leading-relaxed">
                       {item.inputText ? item.inputText : "Image Analysis Request"}
                     </p>
                     {item.imageData && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                           <ScanEye size={12} className="text-indigo-400" /> Media Attached
                        </div>
                     )}
                   </button>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="bg-[#0b101b] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <h3 className="font-bold text-lg text-white">Platform Information</h3>
                 <button onClick={() => setShowAbout(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar bg-black/20">
                 <MarkdownDisplay content={ABOUT_CONTENT} />
              </div>
           </div>
        </div>
      )}
      
      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="bg-[#0b101b] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <h3 className="font-bold text-lg text-white">Data & Privacy</h3>
                 <button onClick={() => setShowPrivacy(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar bg-black/20">
                 <MarkdownDisplay content={PRIVACY_POLICY_CONTENT} />
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
