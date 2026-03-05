import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck, UserX, Users, Calendar } from 'lucide-react';

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

  // Filter lists
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
        // Assume the backend returns today's detected faces
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
    const interval = setInterval(fetchAttendance, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="text-blue-500" /> Attendance Overview
          </h1>
          <div className="flex gap-4">
            <div className="bg-gray-800 px-6 py-3 rounded-xl border border-white/10 flex items-center gap-4">
              <Users className="text-blue-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Students</p>
                <p className="text-xl font-bold">{STUDENT_ROSTER.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Two Blocks: Present vs Absent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Present Block */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-green-500/20 overflow-hidden shadow-xl shadow-green-500/5">
            <div className="bg-green-500/10 p-4 border-b border-green-500/20 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-green-400">
                <UserCheck /> Present Students
              </h2>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {presentStudents.length}
              </span>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {presentStudents.length > 0 ? (
                <div className="grid gap-3">
                  {presentStudents.map(student => (
                    <div key={student.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-400">Status: Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-10">No students detected yet.</p>
              )}
            </div>
          </div>

          {/* Absent Block */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border border-red-500/20 overflow-hidden shadow-xl shadow-red-500/5">
            <div className="bg-red-500/10 p-4 border-b border-red-500/20 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                <UserX /> Absentees
              </h2>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {absentStudents.length}
              </span>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {absentStudents.length > 0 ? (
                <div className="grid gap-3">
                  {absentStudents.map(student => (
                    <div key={student.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5 opacity-80">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-400">Status: Missing</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-10">All students are present!</p>
              )}
            </div>
          </div>
        </div>

        {/* Long Term Trend Graph */}
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
          <h2 className="text-xl font-bold mb-6">Long-term Attendance Trend</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{fill: '#9ca3af'}} 
                  tickFormatter={(str) => str.split('-')[2] + ' Mar'}
                />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
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
        
      </div>
    </div>
  );
}