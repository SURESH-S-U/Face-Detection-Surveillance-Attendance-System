import React, { useState, useEffect, useRef } from 'react';
import { Users, AlertCircle, Power, Camera } from 'lucide-react';
import { Navigation } from '../components/Layout';

const API_BASE_URL = "http://localhost:5000";

export default function LiveFeed() {
  const [isOn, setIsOn] = useState(true);
  const [knownUsers, setKnownUsers] = useState([]);
  const [unknownUsers, setUnknownUsers] = useState([]);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const fetchRecognitionData = async () => {
    if (!isOn) return;
    try {
      const response = await fetch(`${API_BASE_URL}/detection_data`);
      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();

      const known = data.filter(d => d.status === "known");
      const unknown = data.filter(d => d.status !== "known");

      // Keep only recent detections to keep list clean
      setKnownUsers(known.slice(0, 10));
      setUnknownUsers(unknown.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOn && videoRef.current) {
      videoRef.current.src = `${API_BASE_URL}/video_feed`;
    }
  }, [isOn]);

  useEffect(() => {
    let intervalId = setInterval(fetchRecognitionData, 3000);
    return () => clearInterval(intervalId);
  }, [isOn]);

  const toggleCamera = async () => {
    try {
      if (isOn) await fetch(`${API_BASE_URL}/stop`, { method: 'POST' });
      setIsOn(!isOn);
      setError(null);
    } catch (err) {
      setError("Failed to control camera");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      {/* Tactical Grid Overlay */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Header Section */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
          <Camera className="text-blue-500" /> Live Feed
        </h1>
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Real-time face recognition monitoring
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-2xl">
          
          {/* Camera Control */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Camera Control</h2>
            <button
              onClick={toggleCamera}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                isOn ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              }`}
            >
              <Power size={18} />
              {isOn ? "Stop Camera" : "Start Camera"}
            </button>
          </div>

          {error && <div className="bg-rose-500/10 border border-rose-500/50 p-4 text-rose-400 rounded-2xl text-sm font-medium mb-6">{error}</div>}

          <div className="grid grid-cols-12 gap-8">
            {/* Main Video Window */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-black/50 border border-white/10 rounded-3xl overflow-hidden h-full flex items-center justify-center relative shadow-2xl aspect-video">
                {isOn ? (
                  <img ref={videoRef} className="w-full h-full object-contain" alt="Live Stream" crossOrigin="anonymous" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-600">
                    <Camera size={64} className="opacity-50" />
                    <p className="font-black uppercase tracking-widest text-sm">Camera Feed Offline</p>
                  </div>
                )}
                {isOn && (
                  <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Side Lists */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              
              {/* Known People */}
              <div className="bg-white/[0.02] rounded-3xl border border-emerald-500/10 overflow-hidden shadow-2xl flex flex-col h-1/2">
                <div className="bg-emerald-500/5 p-5 border-b border-emerald-500/10 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                    <Users size={18} /> Known
                  </h3>
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black">
                    {knownUsers.length}
                  </span>
                </div>
                
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                  {knownUsers.length > 0 ? (
                    knownUsers.map((user, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all">
                        <img 
                          src={user.face_image || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`} 
                          className="w-10 h-10 rounded-xl object-cover" 
                          alt="" 
                        />
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status: Auto-Verified</p>
                        </div>
                        <span className="text-xs font-mono text-emerald-500">{Math.round(user.confidence * 100)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                       <Users size={32} className="mb-2" />
                       <p className="text-xs font-bold uppercase tracking-widest">No Detections</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Unknown People */}
              <div className="bg-white/[0.02] rounded-3xl border border-amber-500/10 overflow-hidden shadow-2xl flex flex-col h-1/2">
                <div className="bg-amber-500/5 p-5 border-b border-amber-500/10 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-amber-400">
                    <AlertCircle size={18} /> Unknown
                  </h3>
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black">
                    {unknownUsers.length}
                  </span>
                </div>
                
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                  {unknownUsers.length > 0 ? (
                    unknownUsers.map((user, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5 opacity-60">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black">?</div>
                        <div>
                          <p className="text-sm font-bold text-amber-500">Subject</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status: Unknown</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                       <AlertCircle size={32} className="mb-2" />
                       <p className="text-xs font-bold uppercase tracking-widest">All Secure</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}