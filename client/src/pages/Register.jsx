import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, ImagePlus, UserPlus, ArrowRight, Power, Play, Info } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [step, setStep] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSurveillancePaused, setIsSurveillancePaused] = useState(false); // New State
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = "http://localhost:5000";

  // --- UPDATED LIVE FEED CONTROL ---
  const toggleSurveillance = async () => {
    const endpoint = isSurveillancePaused ? '/resume_surveillance' : '/pause_surveillance';
    try {
      await fetch(`${API_BASE_URL}${endpoint}`);
      setIsSurveillancePaused(!isSurveillancePaused);
    } catch (err) {
      alert("Failed to communicate with Backend");
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    if (!isSurveillancePaused) {
      alert("Please 'Stop Live Feed' at the top before using the registration camera.");
      return;
    }

    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied. Make sure no other app is using it.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      if (step === 1) setGalleryImages([...galleryImages, file]);
      else setProfilePic(file);
      stopCamera();
    }, 'image/jpeg');
  };

  // --- FILE HANDLING & UPLOAD (KEEPING YOUR EXISTING LOGIC) ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (step === 1) setGalleryImages([...galleryImages, ...files]);
    else setProfilePic(files[0]);
  };

  const removeImage = (index) => setGalleryImages(galleryImages.filter((_, i) => i !== index));

  const handleFinalUpload = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('profile_picture', profilePic);
    galleryImages.forEach((img, i) => formData.append(`gallery_${i}`, img));

    try {
      const response = await fetch(`${API_BASE_URL}/register`, { method: 'POST', body: formData });
      if (response.ok) {
        alert("Registration completed successfully!");
        setName(''); setGalleryImages([]); setProfilePic(null); setStep(1);
      }
    } catch (error) { console.error("Upload error:", error); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      {/* Tactical Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Header Section with Toggle Button */}
      <div className="mb-4 border-b border-white/5 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <UserPlus className="text-blue-500" /> People Registration
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSurveillancePaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            {isSurveillancePaused ? "Surveillance Standby (Camera Released)" : "Surveillance Live"}
          </p>
        </div>

        {/* --- NEW TOGGLE BUTTON --- */}
        <button 
          onClick={toggleSurveillance}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
            isSurveillancePaused 
            ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600/20' 
            : 'bg-rose-600/10 text-rose-500 border border-rose-500/20 hover:bg-rose-600/20'
          }`}
        >
          {isSurveillancePaused ? <Play size={18} /> : <Power size={18} />}
          {isSurveillancePaused ? "Start Live Feed" : "Stop Live Feed"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-2xl">
          
          {/* STEP 1: NAME & GALLERY */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Name</h2>
                <input
                  type="text" placeholder="Enter full name"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500/50 transition-all"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <ImagePlus className="text-blue-400" /> Reference Gallery
                </h3>
                
                {/* --- NEW DESCRIPTION SECTION --- */}
                <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                  <Info className="text-blue-400 mt-1 shrink-0" size={18} />
                  <p className="text-sm text-slate-400 leading-relaxed">
                    To ensure high-accuracy face recognition, please capture or upload <strong className="text-white">more than 5 images</strong> of the person. Include different angles such as front-facing, looking slightly left, slightly right, and looking slightly up or down.
                  </p>
                </div>

                <div className="flex gap-4 mb-6">
                  <button onClick={() => fileInputRef.current.click()} className="flex-1 flex items-center justify-center gap-3 bg-blue-600/10 text-blue-400 p-4 rounded-2xl border border-blue-500/20 hover:bg-blue-600/20 transition-all group">
                    <Upload className="w-5 h-5" /> Upload Images
                  </button>
                  <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-3 bg-emerald-600/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 hover:bg-emerald-600/20 transition-all group">
                    <Camera className="w-5 h-5" /> Live Capture
                  </button>
                </div>

                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(img)} className="h-32 w-full object-cover rounded-xl border border-white/10 group-hover:border-blue-500/30 transition-all" alt="preview" />
                        <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Updated validation logic: requiring 5 images to proceed */}
              <button disabled={!name || galleryImages.length < 5} onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest disabled:bg-gray-600 disabled:opacity-50 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group">
                Proceed to Verification <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
              </button>
              {galleryImages.length > 0 && galleryImages.length < 5 && (
                <p className="text-center text-xs text-amber-500 mt-2">Please add {5 - galleryImages.length} more images to meet the minimum requirement.</p>
              )}
            </div>
          )}

          {/* STEP 2: PROFILE PICTURE */}
          {step === 2 && (
            <div className="space-y-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Profile Verification</h2>
              <div className="flex justify-center">
                {profilePic ? (
                  <div className="relative group">
                    <img src={URL.createObjectURL(profilePic)} className="h-48 w-48 rounded-3xl object-cover border-4 border-blue-500/20 shadow-2xl" alt="Profile" />
                    <button onClick={() => setProfilePic(null)} className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="h-48 w-48 rounded-3xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/20"><User size={80} className="text-slate-600" /></div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={() => fileInputRef.current.click()} className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-slate-300 p-4 rounded-2xl border border-white/10 hover:text-white transition-all"><Upload size={20} /> Choose File</button>
                <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-slate-300 p-4 rounded-2xl border border-white/10 hover:text-white transition-all"><Camera size={20} /> Use Camera</button>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-2xl border border-white/10 font-medium">Back</button>
                <button onClick={handleFinalUpload} disabled={!profilePic} className="flex-[2] bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-widest disabled:bg-gray-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group">
                  Complete Registration <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CAMERA MODAL (Browser Camera) --- */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl max-w-md w-full">
            <video ref={videoRef} autoPlay className="w-full rounded-2xl shadow-2xl border border-white/10" />
            <div className="mt-6 flex gap-4">
              <button onClick={stopCamera} className="flex-1 bg-white/5 text-slate-300 py-3 rounded-2xl border border-white/10 hover:text-white transition-all">Cancel</button>
              <button onClick={capturePhoto} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all">Capture</button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} hidden multiple={step === 1} accept="image/*" onChange={handleFileChange} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Register;