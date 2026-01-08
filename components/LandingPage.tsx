
import React from 'react';
import { IntellexaWordmark } from './Branding';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-inherit">
      {/* Deep Space / Lab Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto">
        <IntellexaWordmark className="scale-110" />
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onStart}
            className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 bg-purple-600 text-white hover:bg-purple-500"
          >
            GET STARTED
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] mb-12 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
          Your Study Buddy
        </div>
        
        <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black tracking-tighter mb-8 leading-[0.85] text-white">
          ARCHITECT <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-fuchsia-400 drop-shadow-sm">KNOWLEDGE.</span>
        </h1>
        
        <p className="max-w-xl text-zinc-400 text-lg md:text-xl mb-14 leading-relaxed font-medium">
          Step into a sophisticated learning studio. Intellexa builds complex concepts into structural SVG architectures through advanced logic synthesis.
        </p>

        <button 
          onClick={onStart}
          className="relative px-14 py-6 bg-purple-600 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl text-xl tracking-tight flex items-center gap-4 group"
        >
          <span>INITIALIZE BUDDY</span>
          <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          {[
            { icon: 'fa-user-graduate', title: 'Logic Buddy', desc: 'Breaking complex problems into atomic architectural steps with total clarity.' },
            { icon: 'fa-project-diagram', title: 'Diagram Synthesis', desc: 'Instantly renders high-fidelity Mermaid diagrams to visualize concepts structurally.' },
            { icon: 'fa-compass', title: 'Research Hub', desc: 'Directly linked to verified web sources for absolute factual precision in every session.' }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-3xl glass-card text-left hover:border-purple-500/30 transition-all hover:translate-y-[-4px] duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/10 flex items-center justify-center mb-6 text-purple-500 text-xl">
                <i className={`fas ${item.icon}`}></i>
              </div>
              <h3 className="text-xl font-black mb-3 text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed font-medium text-zinc-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
