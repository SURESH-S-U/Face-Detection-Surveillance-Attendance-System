import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck, UserX, Users, Calendar, Activity } from 'lucide-react';

const historicalData = [
  { date: '01 Mar', present: 8, absent: 2 },
  { date: '02 Mar', present: 9, absent: 1 },
  { date: '03 Mar', present: 7, absent: 3 },
  { date: '04 Mar', present: 10, absent: 0 },
  { date: '05 Mar', present: 6, absent: 4 },
  { date: '06 Mar', present: 9, absent: 1 },
];

export default function Attendance() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  const presentStudents = attendanceList.filter(s => s.status === "present");
  const absentStudents = attendanceList.filter(s => s.status === "absent");

  const fetchAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/attendance_data');
      if (response.ok) {
        const data = await response.json();
        setAttendanceList(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Header Section */}
      <div className="border-b border-white/5 pb-6 mb-8 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <Calendar className="text-blue-500" /> Attendance Control
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2 font-medium">
            <Activity size={14} className="text-blue-500" />
            System Live: Biometric Session Tracking
          </p>
        </div>

        {/* TOP COUNTERS - Number of people at the top */}
        <div className="flex gap-4">
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total</p>
            <p className="text-2xl font-black text-white">{attendanceList.length}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Present</p>
            <p className="text-2xl font-black text-emerald-400">{presentStudents.length}</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 px-6 py-3 rounded-2xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Absent</p>
            <p className="text-2xl font-black text-rose-400">{absentStudents.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Present Block */}
          <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-emerald-500/10 overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-emerald-500/5 p-5 border-b border-emerald-500/10 flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                <UserCheck size={18} /> Present Roster
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {presentStudents.map((student, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                  <img 
                    src={student.face_image || `https://ui-avatars.com/api/?name=${student.name}`} 
                    className="w-12 h-12 rounded-xl object-cover" 
                    alt="" 
                  />
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{student.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Absent Block - Now clear and matching present style */}
          <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-rose-500/10 overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="bg-rose-500/5 p-5 border-b border-rose-500/10 flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-rose-400">
                <UserX size={18} /> Absent Roster
              </h2>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {absentStudents.map((student, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                  <img 
                    src={student.face_image || `https://ui-avatars.com/api/?name=${student.name}`} 
                    className="w-12 h-12 rounded-xl object-cover" // Removed grayscale and opacity
                    alt="" 
                  />
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{student.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Graph */}
        <div className="bg-white/[0.02] border border-white/10 p-8 rounded-3xl shadow-xl">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-8 flex items-center gap-2">
            <Activity size={16} /> Historical Comparison
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...historicalData, { date: 'Current', present: presentStudents.length, absent: absentStudents.length }]}>
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
                <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="present" stackId="1" stroke="#10b981" fill="url(#colorPresent)" name="Present" />
                <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="url(#colorAbsent)" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}