
import React from 'react';
import { IntellexaWordmark } from './Branding';

interface LandingPageProps {
  onStart: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme, onToggleTheme }) => {
  return (
    <div className="min-h-screen relative overflow-hidden text-inherit">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-400/10'} rounded-full blur-[120px] animate-pulse`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-400/10'} rounded-full blur-[120px] animate-pulse`} style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Background Grid Pattern */}
      <div className={`absolute inset-0 z-0 ${theme === 'dark' ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} 
           style={{ backgroundImage: 'linear-gradient(rgba(124, 58, 237, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-10 max-w-7xl mx-auto">
        <IntellexaWordmark className="scale-110" />
        <div className="flex items-center gap-4">
           {/* Theme toggle removed as requested in previous turns */}
           <button 
            onClick={onStart}
            className={`px-6 py-2.5 ${theme === 'dark' ? 'bg-purple-950/40 border-purple-500/20' : 'bg-purple-50 border-purple-200 text-purple-600'} border rounded-full text-sm font-bold tracking-tight hover:scale-105 transition-all backdrop-blur-md`}
          >
            Sign In
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center">
        <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border ${theme === 'dark' ? 'border-purple-500/30 bg-white/5 text-purple-200' : 'border-purple-200 bg-white text-purple-600'} text-[10px] font-extrabold uppercase tracking-[0.3em] mb-10 backdrop-blur-xl animate-fade-in shadow-2xl`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          Intelligence Redefined
        </div>
        
        <h1 className={`text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter mb-10 leading-[0.9] ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          Knowledge <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 drop-shadow-sm">Architected.</span>
        </h1>
        
        <p className={`max-w-2xl ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} text-lg md:text-xl mb-14 leading-relaxed font-medium`}>
          Deploy your personal AI architect. Intellexa bridges the gap between raw data and deep understanding through visual logic and high-fidelity reasoning.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 relative">
          <div className={`absolute inset-0 bg-purple-500 blur-[60px] opacity-20 pointer-events-none`}></div>
          <button 
            onClick={onStart}
            className="relative px-12 py-5 bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(124,58,237,0.3)] text-xl tracking-tight"
          >
            Launch Study Console
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40 w-full max-w-6xl">
          {[
            { icon: 'fa-project-diagram', title: 'Logic Mapping', desc: 'Transform complex textbook chapters into clear, interactive architectural flowcharts.' },
            { icon: 'fa-brain', title: 'Deep Logic Engine', desc: 'Beyond simple answers. Our engine builds step-by-step reasoning for 100% clarity.' },
            { icon: 'fa-cube', title: '3D Visualization', desc: 'Ask for a visual, and watch our AI render realistic educational diagrams in seconds.' }
          ].map((feature, i) => (
            <div key={i} className="group p-10 rounded-[32px] glass-card text-left hover:border-purple-500/40 transition-all hover:translate-y-[-8px] duration-500 shadow-xl">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme === 'dark' ? 'from-purple-600/20 to-indigo-600/20 border-purple-500/20' : 'from-white to-purple-50 border-purple-200 shadow-sm'} border flex items-center justify-center mb-8 group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                <i className={`fas ${feature.icon} text-purple-600 text-2xl`}></i>
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} group-hover:text-purple-600 transition-colors`}>{feature.title}</h3>
              <p className={`text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
