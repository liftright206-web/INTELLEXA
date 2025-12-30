
import React from 'react';
import { IntellexaWordmark } from './Branding';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 pb-20">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#27272a 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
        <IntellexaWordmark />
        <div className="w-10"></div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
          </span>
          Advanced AI Architect for Students
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
          Master Any Subject.<br />
          <span className="text-zinc-500">Design Your Knowledge.</span>
        </h1>
        
        <p className="max-w-2xl text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed">
          Intellexa isn't just a chatbot. It's an expert AI architect that visualizes complex logic, solves problems step-by-step, and builds your academic confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onStart}
            className="px-10 py-5 bg-zinc-100 text-black font-bold rounded-2xl hover:bg-white transition-all transform hover:-translate-y-1 shadow-2xl shadow-zinc-500/20 text-lg"
          >
            Start Learning Now
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/50 backdrop-blur-sm text-left group hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-project-diagram text-zinc-400 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Visual Architecture</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Instantly turn dense notes into beautiful, downloadable Mermaid flowcharts and conceptual diagrams.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/50 backdrop-blur-sm text-left group hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-brain text-zinc-400 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Deep Reasoning</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Intellexa breaks down numerical problems and logic using first-principles thinking, not just answers.
            </p>
          </div>

          <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950/50 backdrop-blur-sm text-left group hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="fas fa-microscope text-zinc-400 text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Modal Learning</h3>
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
