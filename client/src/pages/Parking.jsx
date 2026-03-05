import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Navigation } from '../components/Layout';

// Constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
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

// Default parking capacity
const TOTAL_FOUR_WHEELERS = 30;
const TOTAL_TWO_WHEELERS = 30;

const Parking = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [parkingData, setParkingData] = useState([]);
  const [parkingStats, setParkingStats] = useState({
    totalFourWheelerSlots: TOTAL_FOUR_WHEELERS,
    occupiedFourWheelerSlots: 0,
    availableFourWheelerSlots: TOTAL_FOUR_WHEELERS,
    totalTwoWheelerSlots: TOTAL_TWO_WHEELERS,
    occupiedTwoWheelerSlots: 0,
    availableTwoWheelerSlots: TOTAL_TWO_WHEELERS
  });
  const [detectedVehicles, setDetectedVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leftVideoFile, setLeftVideoFile] = useState(null);
  const [rightVideoFile, setRightVideoFile] = useState(null);
  const [leftVideoUrl, setLeftVideoUrl] = useState(null);
  const [rightVideoUrl, setRightVideoUrl] = useState(null);
  const [processingLeft, setProcessingLeft] = useState(false);
  const [processingRight, setProcessingRight] = useState(false);

  // Helper function to calculate parking data from stats
  const calculateParkingData = (stats) => {
    // Calculate occupancy percentages
    const fourWheelerOccupancy = Math.round((stats.occupiedFourWheelerSlots / stats.totalFourWheelerSlots) * 100) || 0;
    const fourWheelerAvailable = 100 - fourWheelerOccupancy;
    const twoWheelerOccupancy = Math.round((stats.occupiedTwoWheelerSlots / stats.totalTwoWheelerSlots) * 100) || 0;
    const twoWheelerAvailable = 100 - twoWheelerOccupancy;

    return [
      { name: '4W Occupied', value: fourWheelerOccupancy },
      { name: '4W Available', value: fourWheelerAvailable },
      { name: '2W Occupied', value: twoWheelerOccupancy },
      { name: '2W Available', value: twoWheelerAvailable }
    ];
  };

  // Helper function to get status class for vehicle
  const getStatusClass = (vehicleType) => {
    return vehicleType === 'four_wheeler'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  };

  // Simulate processing the exit (left) video - decrease available slots
  const processExitVideo = (vehicleType) => {
    setProcessingLeft(true);
    
    // Simulate API call and processing time
    setTimeout(() => {
      setParkingStats(prevStats => {
        let newStats = { ...prevStats };
        
        if (vehicleType === 'four_wheeler') {
          if (newStats.availableFourWheelerSlots > 0) {
            newStats.occupiedFourWheelerSlots += 1;
            newStats.availableFourWheelerSlots -= 1;
          }
        } else {
          if (newStats.availableTwoWheelerSlots > 0) {
            newStats.occupiedTwoWheelerSlots += 1;
            newStats.availableTwoWheelerSlots -= 1;
          }
        }
        
        // Add to detected vehicles
        const newVehicle = {
          id: Date.now(),
          type: vehicleType,
          timestamp: new Date().toISOString(),
          action: 'exit',
          licensePlate: `XYZ-${Math.floor(1000 + Math.random() * 9000)}`
        };
        
        setDetectedVehicles(prev => [newVehicle, ...prev]);
        
        return newStats;
      });
      
      setParkingData(calculateParkingData(parkingStats));
      setProcessingLeft(false);
    }, 2000);
  };

  // Simulate processing the entrance (right) video - increase available slots
  const processEntranceVideo = (vehicleType) => {
    setProcessingRight(true);
    
    // Simulate API call and processing time
    setTimeout(() => {
      setParkingStats(prevStats => {
        let newStats = { ...prevStats };
        
        if (vehicleType === 'four_wheeler') {
          if (newStats.occupiedFourWheelerSlots > 0) {
            newStats.occupiedFourWheelerSlots -= 1;
            newStats.availableFourWheelerSlots += 1;
          }
        } else {
          if (newStats.occupiedTwoWheelerSlots > 0) {
            newStats.occupiedTwoWheelerSlots -= 1;
            newStats.availableTwoWheelerSlots += 1;
          }
        }
        
        // Add to detected vehicles
        const newVehicle = {
          id: Date.now(),
          type: vehicleType,
          timestamp: new Date().toISOString(),
          action: 'entrance',
          licensePlate: `ABC-${Math.floor(1000 + Math.random() * 9000)}`
        };
        
        setDetectedVehicles(prev => [newVehicle, ...prev]);
        
        return newStats;
      });
      
      setParkingData(calculateParkingData(parkingStats));
      setProcessingRight(false);
    }, 2000);
  };

  // Handle left video upload (exit - decreases available slots)
  const handleLeftVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLeftVideoFile(file);
      setLeftVideoUrl(URL.createObjectURL(file));
      
      // Simulate vehicle detection and processing
      // For demo, randomly choose between 2 and 4 wheelers
      const vehicleType = Math.random() > 0.5 ? 'four_wheeler' : 'two_wheeler';
      processExitVideo(vehicleType);
    }
  };

  // Handle right video upload (entrance - increases available slots)
  const handleRightVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRightVideoFile(file);
      setRightVideoUrl(URL.createObjectURL(file));
      
      // Simulate vehicle detection and processing
      // For demo, randomly choose between 2 and 4 wheelers
      const vehicleType = Math.random() > 0.5 ? 'four_wheeler' : 'two_wheeler';
      processEntranceVideo(vehicleType);
    }
  };

  // Initialize data
  useEffect(() => {
    // Set initial random occupancy for demonstration
    const initialFourWheelerOccupied = Math.floor(Math.random() * 15);
    const initialTwoWheelerOccupied = Math.floor(Math.random() * 15);
    
    const initialStats = {
      totalFourWheelerSlots: TOTAL_FOUR_WHEELERS,
      occupiedFourWheelerSlots: initialFourWheelerOccupied,
      availableFourWheelerSlots: TOTAL_FOUR_WHEELERS - initialFourWheelerOccupied,
      totalTwoWheelerSlots: TOTAL_TWO_WHEELERS,
      occupiedTwoWheelerSlots: initialTwoWheelerOccupied,
      availableTwoWheelerSlots: TOTAL_TWO_WHEELERS - initialTwoWheelerOccupied
    };
    
    setParkingStats(initialStats);
    setParkingData(calculateParkingData(initialStats));
    
    // Generate some sample detected vehicles
    const sampleVehicles = [];
    for (let i = 0; i < 5; i++) {
      const vehicleType = Math.random() > 0.5 ? 'four_wheeler' : 'two_wheeler';
      const action = Math.random() > 0.5 ? 'entrance' : 'exit';
      
      sampleVehicles.push({
        id: i,
        type: vehicleType,
        timestamp: new Date(Date.now() - i * 600000).toISOString(),
        action: action,
        licensePlate: `${action === 'entrance' ? 'ABC' : 'XYZ'}-${1000 + i}`
      });
    }
    
    setDetectedVehicles(sampleVehicles);
  }, []);

  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1 ml-20 p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Parking Management Dashboard</h1>

          {/* Date Filter */}
          <div className="flex gap-4 mb-8">
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

          {/* Video Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Video (Exit) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4">Exit Video Upload</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload video from exit point (decreases available slots)
              </p>
              
              <div className="mb-4">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleLeftVideoUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              
              {leftVideoUrl && (
                <div className="relative">
                  <video 
                    src={leftVideoUrl} 
                    controls 
                    className="w-full h-48 object-cover rounded-lg"
                  ></video>
                  {processingLeft && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-white">Processing...</div>
                    </div>
                  )}
                </div>
              )}
              
              {!leftVideoUrl && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center">
                  <p className="text-gray-500">Upload exit video</p>
                </div>
              )}
            </div>
            
            {/* Right Video (Entrance) */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4">Entrance Video Upload</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload video from entrance point (increases available slots)
              </p>
              
              <div className="mb-4">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleRightVideoUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
              </div>
              
              {rightVideoUrl && (
                <div className="relative">
                  <video 
                    src={rightVideoUrl} 
                    controls 
                    className="w-full h-48 object-cover rounded-lg"
                  ></video>
                  {processingRight && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-white">Processing...</div>
                    </div>
                  )}
                </div>
              )}
              
              {!rightVideoUrl && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center">
                  <p className="text-gray-500">Upload entrance video</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Parking Occupancy Chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6">Parking Occupancy</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={parkingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {parkingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Parking Stats */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6">Parking Statistics</h2>
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Four Wheeler Parking</h3>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Total Slots</span>
                  <span className="text-lg font-bold">{parkingStats.totalFourWheelerSlots}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Occupied</span>
                  <span className="text-lg font-bold">{parkingStats.occupiedFourWheelerSlots}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Available</span>
                  <span className="text-lg font-bold">{parkingStats.availableFourWheelerSlots}</span>
                </div>
                
                <h3 className="font-medium text-lg mt-6">Two Wheeler Parking</h3>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Total slots</span>
                  <span className="text-lg font-bold">{parkingStats.totalTwoWheelerSlots}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Occupied</span>
                  <span className="text-lg font-bold">{parkingStats.occupiedTwoWheelerSlots}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Available</span>
                  <span className="text-lg font-bold">{parkingStats.availableTwoWheelerSlots}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : detectedVehicles.length > 0 ? (
                  detectedVehicles.slice(0, 5).map((vehicle, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        vehicle.type === 'four_wheeler' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          {vehicle.type === 'four_wheeler' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4 5v-5m-4 0v5" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{vehicle.licensePlate}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(vehicle.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.action === 'entrance' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.action === 'entrance' ? 'Entering' : 'Exiting'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No vehicle activity records found for the selected date.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parking;