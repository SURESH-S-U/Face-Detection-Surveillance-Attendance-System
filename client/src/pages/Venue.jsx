import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { Camera, RefreshCw, Users, Activity, Zap } from 'lucide-react';

const Venue = () => {
  const [peopleCount, setPeopleCount] = useState(0);
  const [hourlyData, setHourlyData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [availableCameras] = useState([{ deviceId: 'default', label: 'Main Entrance' }]);
  const [selectedCamera, setSelectedCamera] = useState('default');

  const API_BASE_URL = "http://localhost:5000";

  const fetchVenueData = async () => {
    if (!isStreaming) return;
    try {
      const response = await fetch(`${API_BASE_URL}/venue_occupancy`);
      if (response.ok) {
        const data = await response.json();
        const currentCount = data.person_count || 0;
        
        setPeopleCount(currentCount);

        // CORRECT WAY: Create a new array AND a new object for the updated item
        setHourlyData(prevData => {
          if (prevData.length === 0) return prevData;

          return prevData.map((item, index) => {
            // If it's the last item in the array (the current hour)
            if (index === prevData.length - 1) {
              // Return a brand new object with the updated count
              return { ...item, count: currentCount };
            }
            // Otherwise return the item as is
            return item;
          });
        });
      }
    } catch (err) {
      console.error("Occupancy fetch error:", err);
    }
  };

  useEffect(() => {
    // Generate initial historical mock data
    setHourlyData(generateMockHourlyData());
    
    const interval = setInterval(fetchVenueData, 2000); // Faster updates
    return () => clearInterval(interval);
  }, [isStreaming]);

  const generateMockHourlyData = () => {
    const hours = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const h = new Date(now);
      h.setHours(now.getHours() - i);
      hours.push({ 
        hour: format(h, 'HH:00'), 
        count: Math.floor(Math.random() * 10) // Small random start
      });
    }
    return hours;
  };

  const maxCapacity = 50; 
  const capacityPercentage = Math.min(100, Math.round((peopleCount / maxCapacity) * 100));
  
  const getStatus = () => {
    if (capacityPercentage < 50) return { text: 'Low Density', color: 'text-emerald-500', bar: 'bg-emerald-500' };
    if (capacityPercentage < 80) return { text: 'Moderate Density', color: 'text-amber-500', bar: 'bg-amber-500' };
    return { text: 'Critical Density', color: 'text-rose-500', bar: 'bg-rose-500' };
  };
  
  const status = getStatus();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="mb-8 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
          <Camera className="text-blue-500" /> Venue Intelligence
        </h1>
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <Activity size={12} className="text-blue-500" /> Live person detection & occupancy analytics
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-2xl">
          <div className="grid grid-cols-12 gap-8">
            
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Camera size={16} /> Neural Person Stream
                  </h2>
                  <div className="flex gap-2">
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      {availableCameras.map((c, i) => (
                        <option key={c.deviceId} value={c.deviceId} className="bg-slate-900">{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 group">
                  {isStreaming ? (
                    <>
                      <img 
                        src={`${API_BASE_URL}/venue_stream`} 
                        className="w-full h-full object-contain" 
                        alt="Live Stream" 
                      />
                      <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Body Tracking Active</span>
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
                  onClick={() => setIsStreaming(!isStreaming)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isStreaming ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isStreaming ? 'Disconnect Stream' : 'Initialize Vision'}
                </button>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-xl">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Live Body Count</h2>
                      <p className={`text-[10px] font-bold uppercase ${status.color}`}>{status.text}</p>
                   </div>
                   <Users className="text-blue-500 w-5 h-5" />
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl font-black text-white">{peopleCount}</span>
                  <span className="text-slate-500 font-bold">In Frame</span>
                </div>

                <div className="w-full bg-white/5 rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${status.bar}`}
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-500 text-right uppercase tracking-widest">
                  Capacity: {capacityPercentage}%
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 h-[340px] shadow-xl">
                <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                  <Zap size={14} /> Real-time Traffic Bar
                </h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="hour" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
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
        </div>
      </div>
    </div>
  );
};

export default Venue;