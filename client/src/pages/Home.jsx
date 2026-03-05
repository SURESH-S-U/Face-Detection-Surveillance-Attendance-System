import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Brain, ArrowRight, Shield, Cpu, Zap, Database, Eye } from 'lucide-react';
import Footer from '../components/Footer';

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
      <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

// Enhanced Glowing Button Component
const GlowingButton = ({ to, children, primary = false }) => {
  return (
    <Link
      to={to}
      className={`px-8 py-4 rounded-lg font-bold text-lg relative overflow-hidden group ${
        primary 
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
          : "bg-white/10 backdrop-blur-md text-white border border-white/20"
      }`}
    >
      <span className="relative z-10 flex items-center">
        {children}
        <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
      </span>
      <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
    </Link>
  );
};

// Main Component
export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track scroll position for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Set loaded state after a short delay to ensure smooth animations
    const loadTimer = setTimeout(() => setIsLoaded(true), 500);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-black text-white overflow-hidden transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="h-screen relative flex items-center" id="home">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-b from-black via-blue-900/30 to-black opacity-80" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="transform transition-all duration-1000 translate-y-0" style={{ transform: `translateY(${-scrollY * 0.1}px)` }}>
            <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
              <span className="block mb-2">Revolutionizing</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">Face Recognition</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Experience the future of security and access control with our advanced AI-powered 
              face recognition system delivering unparalleled accuracy and speed.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <GlowingButton to="/live" primary>Try Live Demo</GlowingButton>
              <GlowingButton to="/attendance">View Attendance</GlowingButton>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <a href="#features" className="animate-bounce bg-white/10 backdrop-blur-md p-2 rounded-full">
            <ArrowRight className="w-6 h-6 text-white transform rotate-90" />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-black via-blue-900/10 to-black" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Cutting-Edge Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our system combines advanced AI algorithms with state-of-the-art hardware 
              to deliver a seamless and secure experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Camera}
              title="Multi-Camera Integration"
              description="Seamlessly integrate and manage multiple cameras across your facility for comprehensive coverage and monitoring."
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise-Grade Security"
              description="Military-grade encryption and advanced threat detection to ensure your data remains protected at all times."
            />
            <FeatureCard
              icon={Brain}
              title="Advanced AI Processing"
              description="Our proprietary neural networks deliver 99.9% accuracy in face recognition even in challenging lighting conditions."
            />
            <FeatureCard
              icon={Zap}
              title="Real-Time Processing"
              description="Sub-second response times ensure immediate access control decisions without compromising security."
            />
            <FeatureCard
              icon={Database}
              title="Comprehensive Analytics"
              description="Detailed reports and insights on attendance, access patterns, and security events."
            />
            <FeatureCard
              icon={Cpu}
              title="Edge Computing"
              description="Process data locally on-device to reduce latency and enhance privacy protection."
            />
          </div>
        </div>
      </section>
      
      {/* Loading Overlay */}
      <div className={`fixed inset-0 bg-black z-[100] flex items-center justify-center transition-opacity duration-1000 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col items-center">
          <Eye className="w-16 h-16 text-blue-500 animate-pulse" />
          <div className="mt-4 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
            512D
          </div>
          <div className="mt-2 text-gray-400">Loading experience...</div>
          <div className="mt-8 w-48 h-1 bg-white/10 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0; transform: translateX(100%); }
        }
      `}</style>

      <Footer />
    </div>
  );
}