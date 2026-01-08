
import React from 'react';

const RocketTransition: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#05010d]">
      {/* Stars Background */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              animation: `pulse ${1 + Math.random() * 2}s infinite`
            }}
          />
        ))}
      </div>

      {/* The Rocket Container */}
      <div className="relative animate-rocket flex flex-col items-center">
        {/* Rocket Body */}
        <div className="w-16 h-28 bg-zinc-200 rounded-t-full relative border-x-4 border-zinc-300">
           {/* Window */}
           <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-400 rounded-full border-2 border-zinc-400"></div>
           {/* Fins */}
           <div className="absolute -left-6 bottom-0 w-8 h-12 bg-purple-600 rounded-l-full border-r-2 border-purple-800"></div>
           <div className="absolute -right-6 bottom-0 w-8 h-12 bg-purple-600 rounded-r-full border-l-2 border-purple-800"></div>
        </div>
        
        {/* Thrust Fire */}
        <div className="relative mt-[-4px]">
           <div className="w-10 h-20 bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 rounded-b-full animate-fire blur-[2px]"></div>
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-24 bg-orange-600/30 blur-xl animate-fire"></div>
        </div>
      </div>

      {/* Thrust Zoom Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="animate-thrust-zoom w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 via-purple-600 to-indigo-800 blur-sm"></div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RocketTransition;
