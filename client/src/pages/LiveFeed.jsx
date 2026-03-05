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
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Navigation />
      
      <main className="flex-1 ml-[80px] p-8 flex flex-col gap-8">
        {/* Simple Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Feed</h1>
            <p className="text-slate-400 text-sm">Real-time face recognition monitoring</p>
          </div>
          
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
              isOn ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
            }`}
          >
            <Power size={18} />
            {isOn ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 p-3 text-red-400 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-12 gap-8 flex-1">
          {/* Main Video Window */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden h-full flex items-center justify-center relative shadow-xl">
              {isOn ? (
                <img ref={videoRef} className="w-full h-full object-contain" alt="Live Stream" crossOrigin="anonymous" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <Camera size={48} />
                  <p className="font-medium">Camera Feed Offline</p>
                </div>
              )}
              {isOn && (
                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Side Lists */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* Known People */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col h-1/2">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-white">
                  <Users size={18} className="text-emerald-500" /> Known
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  {knownUsers.length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {knownUsers.length > 0 ? (
                  knownUsers.map((user, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                      <img 
                        src={user.face_image || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`} 
                        className="w-10 h-10 rounded-lg object-cover" 
                        alt="" 
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{new Date(user.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-500">{Math.round(user.confidence * 100)}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-600 text-xs py-10">No matches</p>
                )}
              </div>
            </div>

            {/* Unknown People */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col h-1/2">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-white">
                  <AlertCircle size={18} className="text-amber-500" /> Unknown
                </h2>
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unknownUsers.length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {unknownUsers.map((user, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold border border-amber-500/20">?</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-500">Subject</p>
                      <p className="text-[10px] text-slate-500">{new Date(user.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {unknownUsers.length === 0 && <p className="text-center text-slate-600 text-xs py-10">All secure</p>}
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}