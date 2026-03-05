import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck, UserX, Users, Calendar, Activity } from 'lucide-react';
import { Navigation } from '../components/Layout';

// Mocked total student roster to calculate absentees
const STUDENT_ROSTER = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Smith" },
  { id: 3, name: "Charlie Davis" },
  { id: 4, name: "Diana Prince" },
  { id: 5, name: "Ethan Hunt" },
  { id: 6, name: "Fiona Shrek" },
  { id: 7, name: "George Miller" },
  { id: 8, name: "Hannah Abbott" },
  { id: 9, name: "Ian Wright" },
  { id: 10, name: "Jenny Lake" }
];

// Mock historical data for the long-term graph
const historicalData = [
  { date: '2024-03-01', present: 8, absent: 2 },
  { date: '2024-03-02', present: 9, absent: 1 },
  { date: '2024-03-03', present: 7, absent: 3 },
  { date: '2024-03-04', present: 10, absent: 0 },
  { date: '2024-03-05', present: 6, absent: 4 },
  { date: '2024-03-06', present: 9, absent: 1 },
  { date: '2024-03-07', present: 8, absent: 2 },
];

export default function Attendance() {
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Logic to determine who is present vs absent
  const presentStudents = STUDENT_ROSTER.filter(student => 
    detectedFaces.some(face => face.name.toLowerCase() === student.name.toLowerCase())
  );
  
  const absentStudents = STUDENT_ROSTER.filter(student => 
    !detectedFaces.some(face => face.name.toLowerCase() === student.name.toLowerCase())
  );

  const fetchAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/attendance_data');
      if (response.ok) {
        const data = await response.json();
        setDetectedFaces(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Navigation />
      
      <main className="flex-1 ml-[80px] p-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="text-blue-500" /> Attendance Management
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> System Live: Tracking {STUDENT_ROSTER.length} Subjects
            </p>
          </div>
          
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
            <Users className="text-blue-400 w-5 h-5" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enrolled Students</p>
              <p className="text-xl font-black text-white">{STUDENT_ROSTER.length}</p>
            </div>
          </div>
        </div>

        {/* Present vs Absent Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Present Block */}
          <div className="bg-white/[0.02] rounded-3xl border border-emerald-500/10 overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-emerald-500/5 p-5 border-b border-emerald-500/10 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                <UserCheck size={18} /> Verified Present
              </h2>
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black">
                {presentStudents.length}
              </span>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {presentStudents.length > 0 ? (
                presentStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{student.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status: Auto-Verified</p>
                    </div>
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

          {/* Absent Block */}
          <div className="bg-white/[0.02] rounded-3xl border border-rose-500/10 overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-rose-500/5 p-5 border-b border-rose-500/10 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-rose-400">
                <UserX size={18} /> Unreported (Absent)
              </h2>
              <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black">
                {absentStudents.length}
              </span>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {absentStudents.length > 0 ? (
                absentStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 font-black">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{student.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status: Missing</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-emerald-500/30">
                   <UserCheck size={32} className="mb-2" />
                   <p className="text-xs font-bold uppercase tracking-widest">100% Attendance Reached</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Long Term Graph */}
        <div className="bg-white/[0.02] border border-white/10 p-8 rounded-3xl shadow-xl">
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-8 flex items-center gap-2">
            <Activity size={16} /> Historical Intelligence (Last 7 Sessions)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10}
                  tickFormatter={(str) => str.split('-')[2] + ' Mar'}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                  name="Present"
                />
                <Area 
                  type="monotone" 
                  dataKey="absent" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAbsent)" 
                  name="Absent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}