import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Brain, ArrowRight, Shield, Cpu, Zap, Database, ShieldCheck, Activity, Command } from 'lucide-react';
import Footer from '../components/Footer';

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="p-8 bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 group">
      <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

// Tactical Button Component
const GlowingButton = ({ to, children, primary = false }) => {
  return (
    <Link
      to={to}
      className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] relative overflow-hidden group transition-all duration-300 ${
        primary 
          ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]" 
          : "bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 hover:text-white"
      }`}
    >
      <span className="relative z-10 flex items-center gap-3">
        {children}
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
};

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Tactical Grid Overlay */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center pt-20" id="home">
        {/* Ambient Glows */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/5 blur-[150px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Refined Content */}
            <div className="flex flex-col items-start" style={{ transform: `translateY(${-scrollY * 0.05}px)` }}>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Tactical Neural Link Active
              </div>
              
              <h1 className="text-7xl md:text-[90px] font-black leading-[0.85] mb-8 tracking-tighter text-white">
                VISION<br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600 text-transparent bg-clip-text">GUARD</span>
              </h1>
              
              <p className="text-xl text-slate-400 mb-12 max-w-lg leading-relaxed font-medium">
                Advanced biometric intelligence engineered for enterprise security. 
              </p>
              
              <div className="flex flex-wrap gap-5 mb-16">
                <GlowingButton to="/live" primary>Live Feed</GlowingButton>
                <GlowingButton to="/attendance">View Attendance</GlowingButton>
              </div>
            </div>

            {/* Right Column: Visualizer (Dots Removed) */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-[550px] mx-auto p-12">
                {/* Tech Circles */}
                <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-[spin_30s_linear_infinite]" />
                <div className="absolute inset-8 border-t-2 border-b-2 border-blue-500/20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                
                {/* Main Scanning Frame */}
                <div className="relative w-full h-full rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl group">
                  <img 
                    src="/img/face.jpg" 
                    alt="Neural Identification" 
                    className="w-full h-full object-cover opacity-50 brightness-110 saturate-[1.2] group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Neon Scan Line */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500 to-transparent h-[2px] w-full animate-[scan_4s_ease-in-out_infinite] z-20 shadow-[0_0_20px_#3b82f6]" />
                  
                  {/* Floating Telemetry UI */}
                  <div className="absolute inset-0 z-30 p-10 pointer-events-none font-mono">
                    <div className="flex justify-between items-start">
                      <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                        <p className="text-[9px] text-blue-400 font-bold mb-1 tracking-tighter">DATA_STREAM_01</p>
                        <p className="text-[11px] text-white font-bold">LOCKED: SUBJECT_882</p>
                        <div className="mt-2 w-full bg-white/10 h-[2px] rounded-full overflow-hidden">
                           <div className="bg-blue-500 h-full w-2/3 animate-pulse" />
                        </div>
                      </div>
                      <div className="h-12 w-12 border-t-2 border-r-2 border-blue-500/50" />
                    </div>

                    <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                       <div className="bg-emerald-500/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Match Validated</span>
                       </div>
                       <div className="h-12 w-12 border-b-2 border-l-2 border-blue-500/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-40 bg-[#020617] relative z-10" id="features">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center mb-24 text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-6">Industrial Infrastructure</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">System Architecture</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Camera}
              title="Global Mesh"
              description="Deploy distributed camera sensors across any environment with centralized neural synchronization."
            />
            <FeatureCard
              icon={Shield}
              title="Forensic Encryption"
              description="Military-grade AES-256 encryption protects biometric datasets during transmission and rest."
            />
            <FeatureCard
              icon={Brain}
              title="Neural Engine"
              description="Proprietary deep-learning architecture optimized for sub-millisecond identification."
            />
            <FeatureCard
              icon={Zap}
              title="Real-Time Logic"
              description="Immediate access control decisions triggered by high-frequency frame processing."
            />
            <FeatureCard
              icon={Database}
              title="Intelligence Vault"
              description="Deep forensic logs and automated attendance reporting for organizational oversight."
            />
            <FeatureCard
              icon={Cpu}
              title="Edge Native"
              description="Process intelligence at the source to ensure low latency and high data privacy."
            />
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 5%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 95%; }
        }
      `}</style>
    </div>
  );
}