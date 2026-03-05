import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

// Constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Default total students
const TOTAL_STUDENTS = 10;

// Mock data for recognition trends
const mockTimeData = [
  { time: '08:00', known: 4, unknown: 1 },
  { time: '09:00', known: 7, unknown: 2 },
  { time: '10:00', known: 12, unknown: 3 },
  { time: '11:00', known: 15, unknown: 4 },
  { time: '12:00', known: 10, unknown: 2 },
  { time: '13:00', known: 8, unknown: 1 },
];

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState([]);
  const [quickStats, setQuickStats] = useState({
    totalStudents: TOTAL_STUDENTS,
    presentToday: 0,
    onLeave: TOTAL_STUDENTS
  });
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to calculate attendance data from quick stats
  const calculateAttendanceData = (stats) => {
    // Calculate percentages based on the stats - removed late percentage
    const onTimePercentage = Math.round((stats.presentToday / stats.totalStudents) * 100) || 0;
    const absentPercentage = 100 - onTimePercentage;

    return [
      { name: 'Present', value: onTimePercentage },
      { name: 'Absent', value: absentPercentage }
    ];
  };

  // Helper function to get status class for attendance
  const getStatusClass = (isKnown) => {
    return isKnown
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  // Fetch attendance data from the backend
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/attendance_data');
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Failed to fetch attendance data. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch count data from the backend
  const fetchCountData = async () => {
    try {
      const response = await fetch('http://localhost:5000/count_data');
      if (!response.ok) {
        throw new Error('Failed to fetch count data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching count data:', error);
      setError('Failed to fetch count data. Please try again later.');
      return null;
    }
  };

  // Update attendance data
  const updateAttendanceData = async () => {
    const countData = await fetchCountData();
    if (!countData) return;

    // Update quick stats based on count data
    const updatedStats = {
      totalStudents: TOTAL_STUDENTS,
      presentToday: countData.known_count,
      onLeave: TOTAL_STUDENTS - countData.known_count
    };

    setQuickStats(updatedStats);
    setAttendanceData(calculateAttendanceData(updatedStats));
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      const [attendanceData, countData] = await Promise.all([
        fetchAttendanceData(),
        fetchCountData()
      ]);

      if (!attendanceData || !countData) return;

      // Filter data for the selected date
      const filteredData = attendanceData.filter(record => 
        record.timestamp.startsWith(selectedDate)
      );

      setDetectedFaces(filteredData);

      // Count known faces for the selected date
      const knownCount = filteredData.reduce((count, record) => 
        record.is_known ? count + 1 : count, 0
      );

      // Update quick stats based on filtered data
      const updatedStats = {
        totalStudents: TOTAL_STUDENTS,
        presentToday: knownCount,
        onLeave: TOTAL_STUDENTS - knownCount
      };

      setQuickStats(updatedStats);
      setAttendanceData(calculateAttendanceData(updatedStats));
    };

    fetchData();
  }, [selectedDate]);

  // Set up polling for real-time updates
  useEffect(() => {
    const intervalId = setInterval(updateAttendanceData, 30000); // Poll every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Filter faces based on search term
  const filteredFaces = detectedFaces.filter(face =>
    face.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Attendance Dashboard</h1>

        {/* Search and Date Filter */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Search students..."
            className="flex-1 p-2 border rounded-lg"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="date"
            value={selectedDate}
            className="p-2 border rounded-lg"
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Recognition Trends Graph */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-6">Recognition Trends</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="known" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="unknown" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-6">Attendance Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-6">Quick Stats</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Students', value: quickStats.totalStudents.toString() },
                { label: 'Present Today', value: quickStats.presentToday.toString() },
                { label: 'Absent Today', value: quickStats.onLeave.toString() }
              ].map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{stat.label}</span>
                  <span className="text-lg font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Out of {quickStats.totalStudents} students, {quickStats.presentToday} are present today.
              {quickStats.onLeave > 0 && ` ${quickStats.onLeave} students are absent.`}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : filteredFaces.length > 0 ? (
                filteredFaces.slice(0, 5).map((face, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {face.face_image ? (
                      <img
                        src={`data:image/jpeg;base64,${face.face_image}`}
                        alt={face.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200" />
                    )}
                    <div>
                      <div className="font-medium">{face.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(face.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(face.is_known)}`}>
                      {face.is_known ? 'Present' : 'Unknown'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No attendance records found for the selected date.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;