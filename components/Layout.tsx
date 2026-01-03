
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, User } from '../types';
import { IntellexaIcon, IntellexaWordmark } from './Branding';

interface LayoutProps {
  children: React.ReactNode;
  sessions: ChatSession[];
  activeSessionId: string;
  user: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onReset: () => void;
  onGoHome: () => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  sessions,
  activeSessionId,
  user,
  theme,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onReset,
  onGoHome,
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const userInfoRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close popover when clicking outside
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
      <div className={`p-8 border-b ${theme === 'dark' ? 'border-purple-900/10' : 'border-purple-200/20'} flex items-center justify-between`}>
        <div className="flex flex-col cursor-pointer" onClick={onGoHome}>
          <IntellexaWordmark className="scale-105" />
          <p className={`text-[9px] ${theme === 'dark' ? 'text-purple-500/80' : 'text-purple-600/60'} font-black uppercase tracking-[0.4em] mt-2 ml-1`}>Your Study Buddy</p>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-purple-400 hover:text-white p-2">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="p-6">
        <button 
          onClick={() => {
            onNewChat();
            setIsSidebarOpen(false);
          }}
          className="w-full py-4 px-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:shadow-[0_8px_20px_rgba(124,58,237,0.3)] text-white rounded-[18px] text-xs font-black flex items-center justify-center gap-3 transition-all active:scale-[0.97] group"
        >
          <i className="fas fa-message text-[10px] group-hover:rotate-12 transition-transform"></i>
          CHAT
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-500/60'} uppercase tracking-widest px-4 mb-4 mt-2 flex items-center gap-2`}>
          <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
          Workspace History
        </p>
        {sessions.length === 0 ? (
          <div className="px-3 py-10 text-center opacity-40">
            <i className={`fas fa-folder-open mb-3 text-2xl block ${theme === 'dark' ? 'text-purple-900' : 'text-purple-300'}`}></i>
            <p className="text-[10px] uppercase font-bold tracking-widest">Workspace is empty</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className={`group relative flex items-center gap-3 px-4 py-4 rounded-2xl text-sm transition-all cursor-pointer border ${
                activeSessionId === session.id 
                ? theme === 'dark' ? 'bg-purple-600/10 text-purple-500 border-purple-500/30' : 'bg-purple-100/40 text-purple-700 border-purple-200' 
                : theme === 'dark' ? 'text-zinc-500 hover:bg-white/5 border-transparent' : 'text-zinc-500 hover:bg-white/50 border-transparent'
              }`}
              onClick={() => {
                onSessionSelect(session.id);
                setIsSidebarOpen(false);
              }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] ${activeSessionId === session.id ? 'bg-purple-600 text-white shadow-lg' : theme === 'dark' ? 'bg-zinc-900 text-zinc-600 group-hover:bg-purple-900 group-hover:text-purple-200' : 'bg-white border border-purple-100 text-purple-400 group-hover:bg-purple-50'} transition-all`}>
                <i className="fas fa-cube"></i>
              </div>
              <span className={`flex-1 truncate font-bold ${activeSessionId === session.id ? (theme === 'dark' ? 'text-purple-500' : 'text-purple-800') : ''}`}>
                {session.title || "Untitled Session"}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          ))
        )}
      </nav>

      <div className={`p-6 border-t ${theme === 'dark' ? 'border-purple-900/10' : 'border-purple-200/20'} space-y-3`}>
        <div className={`flex items-center gap-3 px-4 py-3 ${theme === 'dark' ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-purple-100/40 shadow-sm'} rounded-2xl border mb-4`}>
           <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/30">
              <img src={user?.avatar || "https://picsum.photos/100/100?random=42"} alt="User" className="w-full h-full object-cover" />
           </div>
           <div className="flex flex-col min-w-0">
              <span className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-800'} truncate`}>{user?.name}</span>
              <span className="text-[9px] text-purple-500 font-bold uppercase tracking-widest">Academic Pro</span>
           </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full py-3 flex items-center justify-start gap-4 px-4 text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors"
        >
          <i className="fas fa-power-off w-4"></i>
          Logout Console
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden text-inherit">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-80 flex flex-col border-r ${theme === 'dark' ? 'border-white/5 bg-[#080212]/95' : 'border-purple-100 bg-[#f4f1ee]/95'} backdrop-blur-3xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-20 border-b ${theme === 'dark' ? 'border-white/5 bg-[#030008]/40' : 'border-purple-200/20 bg-white/40'} backdrop-blur-2xl flex items-center justify-between px-8 shadow-sm z-50`}>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-2 text-purple-400 hover:text-purple-600 transition-colors"
            >
              <i className="fas fa-align-left text-2xl"></i>
            </button>
            
            <div className="hidden md:flex flex-col">
               <span className={`text-[10px] ${theme === 'dark' ? 'text-purple-500' : 'text-purple-600/70'} font-black uppercase tracking-[0.2em] mb-1`}>Architecture Node</span>
               <h1 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-800'} tracking-tight`}>
                 {sessions.find(s => s.id === activeSessionId)?.title || "Idle State"}
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative" ref={userInfoRef}>
             <button 
                onClick={() => setShowUserInfo(!showUserInfo)}
                className={`group flex items-center gap-3 px-3 py-1.5 rounded-2xl border transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-purple-400 hover:bg-white/10' : 'border-purple-200 bg-white text-purple-600 hover:bg-purple-50 shadow-sm'}`}
             >
                <div className="w-8 h-8 rounded-full border-2 border-purple-500 overflow-hidden shadow-lg shadow-purple-500/10 group-hover:scale-105 transition-transform">
                  <img src={user?.avatar || "https://picsum.photos/100/100?random=42"} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:flex flex-col items-start mr-1">
                   <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-800'} uppercase tracking-tighter`}>{user?.name}</span>
                   <span className="text-[8px] text-purple-500 font-bold uppercase tracking-widest">ID Active</span>
                </div>
                <i className={`fas fa-chevron-down text-[8px] text-zinc-500 transition-transform ${showUserInfo ? 'rotate-180' : ''}`}></i>
             </button>

             {showUserInfo && (
               <div className={`absolute top-16 right-0 w-72 p-6 rounded-[24px] border glass-card animate-in fade-in zoom-in slide-in-from-top-4 duration-300 z-[100] ${theme === 'dark' ? 'border-purple-500/20' : 'border-purple-200'} shadow-2xl`}>
                 <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl border-2 border-purple-500 overflow-hidden shadow-2xl">
                          <img src={user?.avatar || "https://picsum.photos/100/100?random=42"} alt="User" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col">
                          <span className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{user?.name}</span>
                          <span className="text-[9px] text-purple-500 font-extrabold uppercase tracking-[0.2em] py-0.5 px-2 bg-purple-500/10 rounded-full w-fit mt-1">Academic Pro</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-purple-500/10">
                       <div className="space-y-1">
                          <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Identity Node</p>
                          <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{user?.email}</p>
                       </div>
                       
                       <div className="flex flex-col gap-2">
                          <button 
                             onClick={async () => {
                               await window.aistudio.openSelectKey();
                               setShowUserInfo(false);
                             }}
                             className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <i className="fas fa-key"></i>
                             Manage Pro API Key
                          </button>
                          <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            className="text-[8px] text-zinc-500 hover:text-purple-500 text-center underline font-bold"
                          >
                            Billing Documentation
                          </a>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                       <button 
                          onClick={() => setShowUserInfo(false)}
                          className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${theme === 'dark' ? 'border-white/5 bg-white/5 text-zinc-400 hover:text-white' : 'border-purple-100 bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                       >
                          Close
                       </button>
                       <button 
                          onClick={onLogout}
                          className="py-2.5 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                       >
                          Sign Out
                       </button>
                    </div>
                 </div>
               </div>
             )}
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
