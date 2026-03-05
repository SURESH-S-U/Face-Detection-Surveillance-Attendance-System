import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Camera, RefreshCw } from 'lucide-react';

const Venue = () => {
  const [cameraStream, setCameraStream] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [peopleCount, setPeopleCount] = useState(0);
  const [countHistory, setCountHistory] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  // Function to get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      
      // Select the first camera by default if available
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting cameras:', err);
      setError('Unable to access camera devices. Please check permissions.');
    }
  };

  // Function to start camera stream
  const startCamera = async () => {
    if (!selectedCamera) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraStream(stream);
      setIsStreaming(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to start camera. Please check permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
    }
  };

  // Function to switch camera
  const handleCameraChange = (event) => {
    setSelectedCamera(event.target.value);
  };

  // Function to fetch people count from backend
  const fetchPeopleCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/people_count');
      if (!response.ok) {
        throw new Error('Failed to fetch people count');
      }
      
      const data = await response.json();
      setPeopleCount(data.count);
      
      // Add to history with timestamp
      const now = new Date();
      setCountHistory(prevHistory => {
        // Keep only the last 10 records
        const newHistory = [...prevHistory, {
          time: format(now, 'HH:mm:ss'),
          count: data.count
        }];
        return newHistory.slice(-10);
      });
      
      return data.count;
    } catch (err) {
      console.error('Error fetching people count:', err);
      setError('Failed to fetch people count. Please try again later.');
      return null;
    }
  };

  // Function to fetch hourly data
  const fetchHourlyData = async () => {
    try {
      const response = await fetch('http://localhost:5000/hourly_count');
      if (!response.ok) {
        throw new Error('Failed to fetch hourly data');
      }
      
      const data = await response.json();
      setHourlyData(data);
    } catch (err) {
      console.error('Error fetching hourly data:', err);
      // Don't show error for this as it's secondary data
    }
  };

  // Generate mock hourly data if API doesn't exist yet
  const generateMockHourlyData = () => {
    const hours = [];
    const now = new Date();
    now.setMinutes(0, 0, 0); // Reset to the start of the current hour
    
    for (let i = 7; i >= 0; i--) {
      const hourTime = new Date(now);
      hourTime.setHours(now.getHours() - i);
      
      hours.push({
        hour: format(hourTime, 'HH:00'),
        count: Math.floor(Math.random() * 50) + 10,
      });
    }
    
    return hours;
  };

  // Initial setup - get available cameras
  useEffect(() => {
    getAvailableCameras();
    
    // Initial mock data
    setHourlyData(generateMockHourlyData());
    
    // Cleanup function
    return () => {
      stopCamera();
    };
  }, []);

  // Effect for camera change
  useEffect(() => {
    if (selectedCamera && isStreaming) {
      startCamera();
    }
  }, [selectedCamera]);

  // Polling for count updates
  useEffect(() => {
    let intervalId;
    
    if (isStreaming) {
      // Initial fetch
      fetchPeopleCount();
      fetchHourlyData();
      
      // Setup polling
      intervalId = setInterval(() => {
        fetchPeopleCount();
        // Update hourly data less frequently
        if (new Date().getMinutes() % 10 === 0) {
          fetchHourlyData();
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isStreaming]);

  // Calculate venue capacity percentage
  const maxCapacity = 100; // Example max capacity
  const capacityPercentage = Math.min(100, Math.round((peopleCount / maxCapacity) * 100));
  
  // Determine capacity status and color
  const getCapacityStatus = () => {
    if (capacityPercentage < 50) return { text: 'Low Occupancy', color: 'text-green-600' };
    if (capacityPercentage < 80) return { text: 'Moderate Occupancy', color: 'text-yellow-600' };
    return { text: 'High Occupancy', color: 'text-red-600' };
  };
  
  const capacityStatus = getCapacityStatus();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Venue Monitoring</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Camera Feed */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Camera className="mr-2" /> Live Camera Feed
              </h2>
              
              <div className="flex items-center gap-3">
                <select
                  value={selectedCamera}
                  onChange={handleCameraChange}
                  className="p-2 border rounded-lg"
                  disabled={loading}
                >
                  {availableCameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      Camera {index + 1} {camera.label ? `- ${camera.label}` : ''}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={isStreaming ? stopCamera : startCamera}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isStreaming 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={loading || !selectedCamera}
                >
                  {loading ? 'Loading...' : isStreaming ? 'Stop Camera' : 'Start Camera'}
                </button>
                
                <button
                  onClick={getAvailableCameras}
                  className="p-2 rounded-lg border hover:bg-gray-100"
                  title="Refresh camera list"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {isStreaming ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Camera size={64} className="mb-4 opacity-50" />
                  <p className="text-lg opacity-70">
                    {availableCameras.length === 0 
                      ? 'No cameras detected' 
                      : 'Select a camera and click Start Camera'}
                  </p>
                </div>
              )}
              
              {/* People count overlay */}
              {isStreaming && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
                  <span className="text-lg font-bold">{peopleCount}</span>
                  <span className="ml-2">people detected</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats and Graphs */}
          <div className="space-y-8">
            {/* Current Occupancy */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6">Current Occupancy</h2>
              
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-2">{peopleCount}</div>
                <div className="text-gray-500">out of {maxCapacity} capacity</div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className={`h-4 rounded-full ${
                    capacityPercentage < 50 ? 'bg-green-500' : 
                    capacityPercentage < 80 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${capacityPercentage}%` }}
                ></div>
              </div>
              
              <div className={`text-center font-medium ${capacityStatus.color}`}>
                {capacityStatus.text} ({capacityPercentage}%)
              </div>
            </div>
            
            {/* Real-time Count */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6">Real-time Count</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={countHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="People Count"
                      stroke="#0088FE" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Hourly Trends */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6">Hourly Trends</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Hourly Average"
                      fill="#00C49F" 
                      radius={[4, 4, 0, 0]}
                    />
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