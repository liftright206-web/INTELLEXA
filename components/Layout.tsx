
import React, { useState } from 'react';
import { ChatSession, User } from '../types';
import { IntellexaIcon, IntellexaWordmark } from './Branding';

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
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex flex-col">
          <IntellexaWordmark />
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-1 ml-1">Your Study Buddy</p>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-white p-2 transition-colors">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="p-4 space-y-2">
        <button 
          onClick={onGoHome}
          className="w-full py-2.5 px-4 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold flex items-center justify-start gap-3 transition-all"
        >
          <i className="fas fa-home w-4"></i>
          Home Page
        </button>
        <button 
          onClick={() => {
            onNewChat();
            setIsSidebarOpen(false);
          }}
          className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <i className="fas fa-plus"></i>
          New Study Session
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 mb-3 mt-4">History</p>
        {sessions.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-zinc-600 italic">No history yet</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                activeSessionId === session.id 
                ? 'bg-zinc-800 text-white border border-zinc-700' 
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
              }`}
              onClick={() => {
                onSessionSelect(session.id);
                setIsSidebarOpen(false);
              }}
            >
              <i className="fas fa-comment-alt w-4 text-center text-[10px]"></i>
              <span className="flex-1 truncate font-medium">
                {session.title || "New Chat"}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
              >
                <i className="fas fa-trash text-[10px]"></i>
              </button>
            </div>
          ))
        )}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        <button 
          onClick={onLogout}
          className="w-full py-2 flex items-center justify-start gap-3 px-4 text-sm font-medium text-zinc-500 hover:text-red-400 transition-colors"
        >
          <i className="fas fa-sign-out-alt w-4"></i>
          Logout
        </button>
        <button 
          onClick={() => {
            onReset();
            setIsSidebarOpen(false);
          }}
          className="w-full py-2 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-colors"
        >
          <i className="fas fa-trash-alt"></i>
          Clear All History
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-100">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-zinc-800 bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-black">
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle Menu"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>

            {/* Mobile Logo Branding */}
            <div className="md:hidden flex items-center gap-2">
              <IntellexaIcon className="w-8 h-8" />
              <h1 className="font-bold text-xl leading-tight text-white tracking-tight">intellexa</h1>
            </div>
            
            <div className="hidden md:flex flex-col">
               <span className="text-sm font-bold text-zinc-100">
                 {sessions.find(s => s.id === activeSessionId)?.title || "Study Workspace"}
               </span>
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Study Session</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-zinc-200">{user?.name || 'Student'}</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Cloud Sync</span>
               </div>
               <div className="w-9 h-9 rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-sm overflow-hidden hover:border-zinc-400 transition-all cursor-pointer" onClick={onGoHome}>
                  <img src={user?.avatar || "https://picsum.photos/100/100?random=42"} alt="Avatar" className="w-full h-full object-cover" />
               </div>
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
