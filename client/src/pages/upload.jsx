import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Upload, UserCheck, UserX, ShieldCheck, PlayCircle, Fingerprint, Search, ExternalLink, Activity } from 'lucide-react';
import { Navigation } from '../components/Layout';

const VideoAnalysisComponent = () => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('known');
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
    setAnalysisResult(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);

    try {
      const progressInterval = setInterval(() => setProgress(p => (p < 95 ? p + 2 : p)), 400);
      const response = await axios.post('http://127.0.0.1:8000/upload', formData);
      clearInterval(progressInterval);
      setProgress(100);
      setAnalysisResult(response.data);
    } catch (error) {
      alert("Analysis failed. System Offline.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredPeople = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.results.filter(face => {
      const isTypeMatch = activeTab === 'known' ? face.name !== 'Unknown' : face.name === 'Unknown';
      const isSearchMatch = face.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            face.face_id.toLowerCase().includes(searchQuery.toLowerCase());
      return isTypeMatch && isSearchMatch;
    });
  }, [analysisResult, activeTab, searchQuery]);

  return (
    <div className="flex w-full min-h-screen bg-[#020617] text-slate-200">
      <Navigation />
      
      <div className="flex-1 ml-[80px] flex flex-col">
        {/* Simple Integrated Header */}
        <header className="border-b border-white/5 px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Video Forensic Analysis</h1>
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-2">
              <Activity size={12} className="text-blue-500" /> Neural Scan Engine v2.0
            </p>
          </div>
          {analysisResult && (
            <div className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/20 text-[11px] font-bold tracking-wider">
              <ShieldCheck className="inline w-3 h-3 mr-1" /> SECURE SESSION
            </div>
          )}
        </header>

        <main className="p-8 max-w-[1400px] w-full mx-auto grid grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Input Data</h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-xl aspect-video flex flex-col items-center justify-center transition-all ${
                  videoSrc ? 'border-white/10 bg-black' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                {videoSrc ? (
                  <video src={videoSrc} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                )}
                <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>

              <button
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing || !videoSrc}
                className={`w-full mt-6 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  isAnalyzing 
                    ? 'bg-white/10 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                }`}
              >
                {isAnalyzing ? `Scanning... ${progress}%` : 'Execute Deep Scan'}
              </button>
            </div>

            {analysisResult && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <UserCheck className="w-5 h-5 text-emerald-500 mb-2" />
                  <div className="text-2xl font-bold text-white">{analysisResult.known_count}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identified</div>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <UserX className="w-5 h-5 text-rose-500 mb-2" />
                  <div className="text-2xl font-bold text-white">{analysisResult.unknown_count}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unknown</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {!analysisResult && !isAnalyzing ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-700 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                <Fingerprint className="w-16 h-16 mb-4 opacity-10 text-white" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting Intelligence Input</p>
              </div>
            ) : analysisResult && (
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                {/* List Filter Bar */}
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setActiveTab('known')}
                      className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'known' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Personnel
                    </button>
                    <button 
                      onClick={() => setActiveTab('unknown')}
                      className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'unknown' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Subjects
                    </button>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search records..."
                      className="bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs w-full focus:outline-none focus:border-blue-500 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Data List */}
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID Reference</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accuracy</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredPeople.map((face) => (
                        <tr key={face.face_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img 
                                src={`data:image/jpeg;base64,${face.face_image}`} 
                                className="w-10 h-10 rounded-lg object-cover border border-white/10" 
                                alt="" 
                              />
                              <span className="text-sm font-medium text-white">
                                {face.name === 'Unknown' ? 'Unknown' : face.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 uppercase">
                            #{face.face_id.slice(0, 12)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${face.confidence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${face.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold">{(face.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-500 hover:text-blue-500">
                              <ExternalLink size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Minimal Stats Graph */}
            {analysisResult && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisResult.results.slice(0, 15)}>
                    <Bar dataKey="confidence" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="name" hide />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default VideoAnalysisComponent;