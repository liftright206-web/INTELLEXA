import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, User } from '../types';
import { IntellexaWordmark } from './Branding';

interface LayoutProps {
  children: React.ReactNode;
  sessions: ChatSession[];
  activeSessionId: string;
  user: User | null;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onReset: () => void;
  onGoHome: () => void;
  onLogout: () => void;
  onSwitchKey: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  sessions,
  activeSessionId,
  user,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onReset,
  onGoHome,
  onLogout,
  onSwitchKey,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const userInfoRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userInfoRef.current && !userInfoRef.current.contains(event.target as Node)) {
        setShowUserInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center justify-between">
        <div className="flex flex-col cursor-pointer" onClick={onGoHome}>
          <IntellexaWordmark />
          <p className="text-[10px] text-purple-400/80 font-black uppercase tracking-[0.3em] mt-2 ml-1">Study Console</p>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-purple-400 p-2">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="px-6 pb-6 space-y-3">
        <button 
          onClick={() => {
            onNewChat();
            setIsSidebarOpen(false);
          }}
          className="w-full py-4 px-5 bg-gradient-to-r from-purple-600 to-indigo-800 hover:from-purple-500 hover:to-indigo-700 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-xl shadow-purple-900/20 group"
        >
          <i className="fas fa-plus text-[10px]"></i>
          NEW SESSION
        </button>
        <button 
          onClick={onSwitchKey}
          className="w-full py-2.5 px-5 bg-zinc-900 border border-white/5 hover:border-purple-500/50 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
        >
          <i className="fas fa-key text-[9px]"></i>
          Switch API Key
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4 flex items-center justify-between">
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Historical Nodes</p>
           <button onClick={onReset} title="Reset Workspace" className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors uppercase font-black">Reset</button>
        </div>
        {sessions.length === 0 ? (
          <div className="px-3 py-10 text-center opacity-20">
            <i className="fas fa-cube mb-3 text-2xl block text-purple-500"></i>
            <p className="text-[10px] uppercase font-bold tracking-widest">Workspace Offline</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all cursor-pointer border ${
                activeSessionId === session.id 
                ? 'bg-white/5 text-purple-400 border-purple-500/20 shadow-lg' 
                : 'text-zinc-500 border-transparent hover:bg-white/5'
              }`}
              onClick={() => {
                onSessionSelect(session.id);
                setIsSidebarOpen(false);
              }}
            >
              <i className={`fas fa-terminal text-xs ${activeSessionId === session.id ? 'text-purple-500' : 'text-zinc-600'}`}></i>
              <span className="flex-1 truncate font-bold text-xs">
                {session.title || "Untitled Session"}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-500 transition-all"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
              </button>
            </div>
          ))
        )}
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5">
           <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-500/20 border border-purple-500/20">
              <img src={user?.avatar} alt="User" className="w-full h-full object-cover avatar-animated" />
           </div>
           <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-white truncate">{user?.name}</span>
              <span className="text-[9px] text-purple-500 font-bold uppercase tracking-widest">Architect</span>
           </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 flex flex-col border-r border-white/5 bg-[#05010d] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
      `}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative bg-inherit">
        <header className="h-16 border-b border-white/5 bg-[#05010d]/60 backdrop-blur-md flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden p-2 text-purple-500">
              <i className="fas fa-bars-staggered text-xl"></i>
            </button>
            <div className="flex flex-col">
               <h1 className="text-sm font-black text-white tracking-tight">
                 {activeSessionId ? (sessions.find(s => s.id === activeSessionId)?.title || "Study Hub") : "Standby"}
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative" ref={userInfoRef}>
                <button onClick={() => setShowUserInfo(!showUserInfo)} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-500/30 transition-transform active:scale-95">
                   <img src={user?.avatar} alt="User" className="w-full h-full object-cover avatar-animated" />
                </button>
                {showUserInfo && (
                  <div className="absolute top-14 right-0 w-64 p-5 rounded-2xl border glass-card shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={user?.avatar} className="w-12 h-12 rounded-xl border border-purple-500/20 avatar-animated" />
                      <div>
                        <p className="text-xs font-black text-white">{user?.name}</p>
                        <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">Active Profile</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-purple-500/10 flex flex-col gap-2">
                       <button onClick={onSwitchKey} className="w-full py-2 bg-zinc-900 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">Change API Key</button>
                       <button onClick={onLogout} className="text-[10px] font-black text-red-500 uppercase tracking-widest py-2">Sign Out</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;