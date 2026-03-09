import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { 
  Upload, UserCheck, UserX, ShieldCheck, Search, 
  Target, Cpu, Activity, Camera 
} from 'lucide-react';

const VideoAnalysisComponent = () => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoSrc(URL.createObjectURL(file));
      setAnalysisResult(null);
      setProgress(0);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!videoSrc || !fileInputRef.current?.files?.[0]) return;
    setIsAnalyzing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);

    try {
      const progressInterval = setInterval(() => setProgress(p => (p < 95 ? p + 1 : p)), 200);
      const response = await axios.post('http://127.0.0.1:8000/upload', formData);
      clearInterval(progressInterval);
      setProgress(100);
      setAnalysisResult(response.data);
    } catch (error) {
      alert("Neural Link Interrupted.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const knownFaces = useMemo(() => 
    analysisResult?.results.filter(f => f.name !== 'Unknown' && f.name.toLowerCase().includes(searchQuery.toLowerCase())) || [], 
    [analysisResult, searchQuery]
  );

  const unknownFaces = useMemo(() => 
    analysisResult?.results.filter(f => f.name === 'Unknown') || [], 
    [analysisResult]
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 font-sans">
      {/* Tactical Grid Overlay */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* --- HEADER SECTION (Identical structure to Venue page) --- */}
      <div className="mb-8 border-b border-white/5 pb-6 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <ShieldCheck className="text-blue-500" /> Video Analysis
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Activity size={12} className="text-blue-500" /> Uploaded video forensic analysis
          </p>
        </div>

        {/* Search aligned to right side of header */}
        <div className="relative mb-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input 
            type="text" 
            placeholder="SEARCH BIOMETRICS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-6 text-[10px] w-64 focus:border-blue-500/50 outline-none transition-all font-mono tracking-tighter text-slate-300"
          />
        </div>
      </div>

      {/* --- MAIN CONTENT (Centered container like Venue page) --- */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-2xl">
          <div className="grid grid-cols-12 gap-8">
            
            {/* Left: Video & Neural Status */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Camera size={16} /> Optic Stream
                </h2>
                
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 group">
                  {videoSrc ? (
                    <video src={videoSrc} className="w-full h-full object-contain" controls />
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-all group"
                    >
                      <Upload className="text-slate-700 group-hover:text-blue-500 transition-colors mb-4" size={48} />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Initialize Video Uplink</p>
                    </div>
                  )}
                  <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  
                  {isAnalyzing && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_blue] animate-scan" />
                      <div className="absolute inset-0 border-[20px] border-blue-500/5 shadow-inner" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 mt-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Cpu size={14} className={isAnalyzing ? 'animate-spin text-blue-500' : ''} />
                        Neural Engine
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-500">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing || !videoSrc}
                    className={`px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                      isAnalyzing 
                      ? 'bg-white/5 text-slate-700 border border-white/5 cursor-wait' 
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95'
                    }`}
                  >
                    {isAnalyzing ? 'Scanning...' : 'Start Deep Scan'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Results Columns */}
            <div className="col-span-12 lg:col-span-5">
              <div className="grid grid-cols-2 gap-4 h-full min-h-[500px]">
                
                {/* Identified Column */}
                <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Identified</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-mono text-emerald-500 font-bold">{knownFaces.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {knownFaces.length > 0 ? knownFaces.map((face, i) => (
                      <BiometricRow key={i} face={face} color="emerald" />
                    )) : <EmptyUnit text="No IDs" />}
                  </div>
                </div>

                {/* Unknown Column */}
                <div className="flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-rose-500" />
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Unknown</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-[10px] font-mono text-rose-500 font-bold">{unknownFaces.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {unknownFaces.length > 0 ? unknownFaces.map((face, i) => (
                      <BiometricRow key={i} face={face} color="rose" />
                    )) : <EmptyUnit text="Clear" />}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(400px); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

// ... BiometricRow and EmptyUnit remain same ...
const BiometricRow = ({ face, color }) => (
  <div className="group bg-white/[0.02] border border-white/5 rounded-2xl p-2 hover:bg-white/5 transition-all">
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <img 
            src={`data:image/jpeg;base64,${face.face_image}`} 
            className="w-10 h-10 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10" 
            alt="" 
          />
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-${color}-500`} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[9px] font-bold text-white truncate uppercase tracking-tighter">
            {face.name === 'Unknown' ? 'SUBJECT_UNK' : face.name}
          </p>
          <p className="text-[7px] font-mono text-slate-600 uppercase tracking-tighter">ID: {face.face_id.slice(0, 6)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full bg-${color}-500`} style={{ width: `${face.confidence * 100}%` }} />
        </div>
        <span className={`text-[7px] font-mono font-bold text-${color}-500`}>{(face.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  </div>
);

const EmptyUnit = ({ text }) => (
  <div className="h-full flex flex-col items-center justify-center py-20 opacity-10">
    <Target size={24} className="mb-2" />
    <span className="text-[8px] font-black uppercase tracking-[0.5em]">{text}</span>
  </div>
);

export default VideoAnalysisComponent;