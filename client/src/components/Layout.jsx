import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Camera, Users, Home, Upload, Car, MapPin, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export const Navigation = () => {
  const location = useLocation();
  
  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/live', label: 'Live Feed', icon: Camera },
    { to: '/attendance', label: 'Attendance', icon: Users },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/parking', label: 'Parking', icon: Car },
    { to: '/venue', label: 'Venue', icon: MapPin },
    { to: '/chatbot', label: 'Chatbot', icon: MessageSquare },
  ];

  return (
    <nav className="fixed top-0 left-0 h-screen w-20 bg-gray-900 flex flex-col items-center py-8 space-y-8 z-50">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            "p-3 rounded-xl transition-all duration-200 group relative",
            location.pathname === to ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          <Icon className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="ml-20">
        <Outlet />
      </main>
    </div>
  );
}