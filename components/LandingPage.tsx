
import React from 'react';
import { IntellexaWordmark } from './Branding';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#05010d] text-white selection:bg-purple-900/50 pb-20">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-30" 
           style={{ backgroundImage: 'radial-gradient(#4c1d95 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}>
      </div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-purple-900/10 via-transparent to-black pointer-events-none"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
        <IntellexaWordmark />
        <div className="w-10"></div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300 mb-8 animate-fade-in backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          Advanced AI Architect for Students
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
          Master Any Subject.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-300">Design Your Knowledge.</span>
        </h1>
        
        <p className="max-w-2xl text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed">
          Intellexa isn't just a chatbot. It's an expert AI architect that visualizes complex logic, solves problems step-by-step, and builds your academic confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onStart}
            className="px-10 py-5 bg-gradient-to-br from-purple-600 to-violet-700 text-white font-bold rounded-2xl hover:from-purple-500 hover:to-violet-600 transition-all transform hover:-translate-y-1 shadow-[0_0_30px_rgba(124,58,237,0.4)] text-lg"
          >
            Start Learning Now
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          <div className="p-8 rounded-3xl border border-purple-900/50 bg-zinc-950/50 backdrop-blur-md text-left group hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-800/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-900/50 transition-all">
              <i className="fas fa-project-diagram text-purple-400 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple-50">Visual Architecture</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Instantly turn dense notes into beautiful, downloadable Mermaid flowcharts and conceptual diagrams.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-purple-900/50 bg-zinc-950/50 backdrop-blur-md text-left group hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-800/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-900/50 transition-all">
              <i className="fas fa-brain text-purple-400 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple-50">Deep Reasoning</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Intellexa breaks down numerical problems and logic using first-principles thinking, not just answers.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-purple-900/50 bg-zinc-950/50 backdrop-blur-md text-left group hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-800/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-900/50 transition-all">
              <i className="fas fa-microscope text-purple-400 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple-50">Multi-Modal Learning</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Upload textbook photos, hand-written notes, or complex datasets for immediate architectural analysis.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;