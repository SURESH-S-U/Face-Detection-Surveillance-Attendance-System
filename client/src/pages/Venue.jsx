import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { Camera, RefreshCw, Users, Activity, ShieldCheck, Zap } from 'lucide-react';
import { Navigation } from '../components/Layout';

const Venue = () => {
  const [cameraStream, setCameraStream] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [peopleCount, setPeopleCount] = useState(0);
  const [hourlyData, setHourlyData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const API_BASE_URL = "http://localhost:5000";

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !selectedCamera) setSelectedCamera(cameras[0].deviceId);
    } catch (err) {
      setError('Camera access denied');
    }
  };

  const startCamera = async () => {
    if (!selectedCamera) return;
    setLoading(true);
    try {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCamera } }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraStream(stream);
      setIsStreaming(true);
    } catch (err) {
      setError('Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    getAvailableCameras();
    setHourlyData(generateMockHourlyData());
    return () => stopCamera();
  }, []);

  const generateMockHourlyData = () => {
    const hours = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const h = new Date(now);
      h.setHours(now.getHours() - i);
      hours.push({ hour: format(h, 'HH:00'), count: Math.floor(Math.random() * 60) + 10 });
    }
    return hours;
  };

  const maxCapacity = 100;
  const capacityPercentage = Math.min(100, Math.round((peopleCount / maxCapacity) * 100));
  
  const getStatus = () => {
    if (capacityPercentage < 50) return { text: 'Low Density', color: 'text-emerald-500', bar: 'bg-emerald-500' };
    if (capacityPercentage < 80) return { text: 'Moderate Density', color: 'text-amber-500', bar: 'bg-amber-500' };
    return { text: 'Critical Density', color: 'text-rose-500', bar: 'bg-rose-500' };
  };
  
  const status = getStatus();

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Navigation />
      
      <main className="flex-1 ml-[80px] p-8 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Venue Intelligence</h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <Activity size={12} className="text-blue-500" /> Live Occupancy Analytics
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
              <ShieldCheck className="text-emerald-500 w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Zone: Main Hall</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* Left: Camera Feed */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Camera size={16} /> Optic Stream
                </h2>
                
                <div className="flex gap-2">
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    {availableCameras.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId} className="bg-slate-900">Cam {i + 1}</option>
                    ))}
                  </select>
                  <button onClick={getAvailableCameras} className="p-2 hover:bg-white/5 rounded-lg text-slate-500"><RefreshCw size={14} /></button>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 group">
                {isStreaming ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Neural Scan Active</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                    <Camera size={64} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Signal Offline</p>
                  </div>
                )}
              </div>

              <button
                onClick={isStreaming ? stopCamera : startCamera}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  isStreaming ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                }`}
              >
                {isStreaming ? 'Disconnect Stream' : 'Initialize Vision'}
              </button>
            </div>
          </div>

          {/* Right: Metrics */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            
            {/* Occupancy Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Density Index</h2>
                    <p className={`text-[10px] font-bold uppercase ${status.color}`}>{status.text}</p>
                 </div>
                 <Users className="text-blue-500 w-5 h-5" />
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-black text-white">{peopleCount}</span>
                <span className="text-slate-500 font-bold">/ {maxCapacity}</span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2 mb-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${status.bar}`}
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-slate-500 text-right uppercase tracking-widest">
                System Load: {capacityPercentage}%
              </p>
            </div>

            {/* Hourly Trends Chart */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 h-[340px] shadow-xl">
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                <Zap size={14} /> Chrono-Traffic Trends
              </h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#475569" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hourlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === hourlyData.length - 1 ? '#3b82f6' : '#1e293b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Venue;