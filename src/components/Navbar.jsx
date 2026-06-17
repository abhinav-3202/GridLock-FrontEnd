// import React from 'react';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          P
        </div>
        <span className="text-white font-semibold text-lg tracking-wide">
          ParkSense AI
        </span>
      </div>

      <div className="text-gray-400 text-sm font-medium">
        Bengaluru Traffic Violation Intelligence
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-gray-400 text-sm">Live Analysis Active</span>
      </div>
    </nav>
  )
}