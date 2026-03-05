import React, { useState, useEffect, useRef } from 'react';
import { Users, AlertCircle, Power } from 'lucide-react';
import { cn } from '../lib/utils';
import { Navigation } from '../components/Layout';

const cameras = [
  { id: 0, name: 'Main Entrance' },
];

export default function LiveFeed() {
  const [selectedCamera, setSelectedCamera] = useState(0);
  const [isOn, setIsOn] = useState(true);
  const [knownUsers, setKnownUsers] = useState([]);
  const [unknownUsers, setUnknownUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const API_BASE_URL = "http://localhost:5000";

  // Enhanced fetch recognition data with proper error handling
  const fetchRecognitionData = async () => {
    if (!isOn) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/detection_data`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the detections
      const known = [];
      const unknown = [];
      
      data.forEach(detection => {
        const userObj = {
          id: detection._id || `detection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: detection.name || "Unknown",
          time: detection.timestamp || new Date().toISOString(),
          camera: detection.camera_id !== undefined ? `Camera ${detection.camera_id}` : "Camera 0",
          image: detection.face_image || null,
          confidence: detection.confidence ? Math.round(detection.confidence * 100) : null,
        };
        
        detection.status === "known" ? known.push(userObj) : unknown.push(userObj);
      });
      
      setKnownUsers(prev => {
        // Merge with previous data, keeping only unique entries
        const merged = [...prev, ...known];
        return merged.filter((obj, index, self) =>
          index === self.findIndex(o => o.id === obj.id)
        );
      });
      
      setUnknownUsers(prev => {
        // Merge with previous data, keeping only unique entries
        const merged = [...prev, ...unknown];
        return merged.filter((obj, index, self) =>
          index === self.findIndex(o => o.id === obj.id)
        );
      });
      
    } catch (error) {
      console.error("Fetch error:", error);
      setError(`Failed to load recognition data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle video stream setup
  useEffect(() => {
    if (!videoRef.current) return;

    if (isOn) {
      // For MJPEG stream from Flask
      videoRef.current.src = `${API_BASE_URL}/video_feed`;
      
      const videoElement = videoRef.current;
      
      const errorHandler = () => {
        setError("Video feed failed to load. Check backend connection.");
      };
      
      videoElement.addEventListener('error', errorHandler);
      
      return () => {
        videoElement.removeEventListener('error', errorHandler);
        videoElement.src = '';
      };
    }
  }, [isOn, selectedCamera]);

  // Polling for recognition data
  useEffect(() => {
    let intervalId;
    
    if (isOn) {
      fetchRecognitionData(); // Initial fetch
      intervalId = setInterval(fetchRecognitionData, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOn]);

  // Camera toggle handler
  const handleCameraToggle = async () => {
    try {
      if (isOn) {
        // Stop the backend process when turning off
        await fetch(`${API_BASE_URL}/stop`, { method: 'POST' });
      }
      setIsOn(!isOn);
    } catch (err) {
      console.error("Error toggling camera:", err);
      setError("Failed to toggle camera state");
    }
  };

  // Format time display
  const formatTime = (isoString) => {
    try {
      if (!isoString) return "N/A";
      
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString || "N/A";
    }
  };

  // Get user initials for placeholder
  const getInitials = (name) => {
    if (!name || name === "Unknown") return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex">
      <Navigation />
      <div className="flex flex-col h-screen ml-[100px] w-full">
        <div className="grid grid-cols-12 gap-8 p-5 flex-1">
          <div className="col-span-8 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Live Recognition Feed</h2>
                <div className="flex items-center gap-4">
                  <select 
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(Number(e.target.value))}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {cameras.map(camera => (
                      <option key={camera.id} value={camera.id}>
                        {camera.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleCameraToggle}
                    className={cn(
                      "p-2 rounded-lg",
                      isOn ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}
                    disabled={loading}
                  >
                    <Power className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                {isOn ? (
                  <img
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    alt="Live video feed"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <p className="text-white text-xl">Camera Off</p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Known Users</h2>
                <div className="flex items-center gap-2 text-green-600">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">{knownUsers.length}</span>
                </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {knownUsers.length > 0 ? (
                  knownUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.parentElement.innerHTML = `
                              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                ${getInitials(user.name)}
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{user.name}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {formatTime(user.time)} • {user.camera}
                        </div>
                      </div>
                      {user.confidence && (
                        <div className="text-sm font-medium text-green-600">
                          {user.confidence}%
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {loading ? "Loading..." : "No known users detected"}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Unknown Users</h2>
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">{unknownUsers.length}</span>
                </div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {unknownUsers.length > 0 ? (
                  unknownUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt="Unknown person" 
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.parentElement.innerHTML = `
                              <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                                ?
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                          ?
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-yellow-600 truncate">Unknown Person</div>
                        <div className="text-sm text-gray-500 truncate">
                          {formatTime(user.time)} • {user.camera}
                        </div>
                      </div>
                      {user.confidence && (
                        <div className="text-sm font-medium text-yellow-600">
                          {user.confidence}%
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {loading ? "Loading..." : "No unknown users detected"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}