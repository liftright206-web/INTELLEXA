
import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import { GradeLevel, Subject, Message, ChatSession, User, ImageGenerationConfig } from './types';
import { getStreamingTutorResponse, generateTutorImage } from './services/geminiService';

// Fix: Define AIStudio interface to satisfy TS compiler requirement for window object property.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const STORAGE_KEY = 'intellexa_history_v2';
const USER_KEY = 'intellexa_user_v2';
const THEME_KEY = 'intellexa_theme';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'chat'>('landing');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions.length > 0 ? sessions[0].id : '';
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showVisualArchitect, setShowVisualArchitect] = useState(false);
  
  const [visualConfig, setVisualConfig] = useState<ImageGenerationConfig>({
    prompt: '',
    aspectRatio: '1:1',
    quality: 'standard'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeSessionId, sessions, isTyping, isGeneratingImage]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Project Node",
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: `Initialization sequence complete. Hello ${user?.name || 'Academic'}! I am Intellexa. I've optimized my cognitive modules for our upcoming study session. 🧠⚡\n\nHow shall we architect your knowledge today? I can generate interactive flowcharts, solve logical puzzles, or render visual representations of abstract concepts.`,
        timestamp: new Date()
      }],
      createdAt: new Date(),
      grade: GradeLevel.HighSchool,
      subject: Subject.General
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setView('chat');
  };

  const sendMessage = async (text: string, image?: string) => {
    if (!activeSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      attachments: image ? [image] : []
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMessage] } : s));
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
    ));

    try {
      let accumulatedContent = '';
      const stream = getStreamingTutorResponse(
        userMessage.content,
        messages.slice(-10),
        image || undefined
      );

      for await (const chunk of stream) {
        accumulatedContent += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(msg => 
                msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
              )
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(msg => msg.id === assistantMsgId ? { ...msg, content: "Neural link interrupted. Please check your connectivity or API credentials." } : msg) } : s));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !pendingImage) return;
    const text = inputValue;
    const img = pendingImage;
    setInputValue('');
    setPendingImage(null);
    await sendMessage(text, img || undefined);
  };

  const handleGenerateVisual = async (configOverride?: Partial<ImageGenerationConfig>) => {
    if (!activeSessionId) return;
    
    const finalConfig = { 
      ...visualConfig, 
      prompt: visualConfig.prompt || inputValue || "an educational diagram of the current topic",
      ...configOverride 
    };

    if (finalConfig.quality === 'pro') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceeding assuming selection was successful per guidelines
      }
    }

    setIsGeneratingImage(true);
    setShowVisualArchitect(false);
    if (!configOverride?.prompt) setInputValue('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Visual Request: ${finalConfig.quality.toUpperCase()}] Architect a ${finalConfig.aspectRatio} visual render of: ${finalConfig.prompt}`,
      timestamp: new Date()
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

    try {
      const imageUrl = await generateTutorImage(finalConfig);
      if (imageUrl) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've successfully rendered a ${finalConfig.quality === 'pro' ? 'high-fidelity' : 'standard'} visual architecture for: **${finalConfig.prompt}**. Aspect Ratio: ${finalConfig.aspectRatio}.`,
          timestamp: new Date(),
          attachments: [imageUrl]
        };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
      } else {
        throw new Error("Render failure");
      }
    } catch (error: any) {
      let errorText = "Visualization engine error. Could not allocate resources for this specific render.";
      
      // Fix: Follow guideline to prompt user to select a key again if request fails with PRO_KEY_MISSING (mapped from "Requested entity was not found.")
      if (error.message === "PRO_KEY_MISSING") {
        errorText = "Pro Rendering requires a selected API key from a paid GCP project. Please select a valid key.";
        // Trigger key selection dialog as required by guidelines for this specific failure state.
        await window.aistudio.openSelectKey();
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date()
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAction = async (actionType: 'mock-test' | 'flowchart' | 'summary' | 'problem-solver' | 'visual-render') => {
    if (isTyping || isGeneratingImage) return;
    
    if (actionType === 'visual-render') {
      setVisualConfig(prev => ({ ...prev, prompt: inputValue }));
      setShowVisualArchitect(true);
      return;
    }

    let actionPrompt = "";
    switch(actionType) {
      case 'mock-test': actionPrompt = "Initiate a diagnostic Mock Test based on our current context. Include 3 logic-based questions."; break;
      case 'flowchart': actionPrompt = "Architect a Mermaid flowchart visualizing the core components of our discussion."; break;
      case 'summary': actionPrompt = "Generate a high-level executive summary of our session architectures so far."; break;
      case 'problem-solver': actionPrompt = "Let's isolate a specific practice problem and break it down into atomic logical steps."; break;
    }
    await sendMessage(actionPrompt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith('image/')) setPendingImage(reader.result as string);
        else setInputValue(prev => `${prev}\n[Attached File: ${file.name}]`);
      };
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    localStorage.removeItem(USER_KEY);
  };

  const handleStartClicked = () => {
    if (user) setView('chat');
    else setView('auth');
  };

  if (view === 'landing') return <LandingPage onStart={handleStartClicked} theme={theme} onToggleTheme={toggleTheme} />;
  if (view === 'auth') return <Auth onLogin={(u) => { setUser(u); setView('chat'); if (sessions.length === 0) handleNewChat(); }} onBack={() => setView('landing')} theme={theme} onToggleTheme={toggleTheme} />;

  const QUICK_ACTIONS = [
    { id: 'visual-render', label: 'VISUAL RENDER', icon: 'fa-sparkles' },
    { id: 'mock-test', label: 'MOCK TEST', icon: 'fa-vial-circle-check' },
    { id: 'flowchart', label: 'FLOW LOGIC', icon: 'fa-diagram-project' },
    { id: 'summary', label: 'EXECUTIVE SUMMARY', icon: 'fa-rectangle-list' },
    { id: 'problem-solver', label: 'PROBLEM LAB', icon: 'fa-microscope' }
  ];

  return (
    <Layout 
      sessions={sessions}
      activeSessionId={activeSessionId}
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSessionSelect={setActiveSessionId}
      onNewChat={handleNewChat}
      onDeleteSession={(id) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) setActiveSessionId(''); }}
      onReset={() => { if(confirm("Purge workspace history?")) { setSessions([]); handleNewChat(); } }}
      onGoHome={() => setView('landing')}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-32">
            {messages.map((msg) => <ChatBubble key={msg.id} message={msg} theme={theme} />)}
            {(isTyping || isGeneratingImage) && (
              <div className="flex justify-start mb-6 animate-pulse">
                <div className={`${theme === 'dark' ? 'bg-zinc-950 border-purple-500/30' : 'bg-white border-purple-200'} border px-6 py-4 rounded-3xl rounded-tl-none shadow-xl flex items-center gap-4`}>
                   <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">
                    {isGeneratingImage ? "SYNTHESIZING V-RENDER..." : "ANALYZING NEURAL DATA..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Architect Modal */}
        {showVisualArchitect && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-lg glass-card rounded-[32px] p-8 shadow-2xl border-purple-500/20 animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#0a0515]' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <i className="fas fa-wand-magic-sparkles text-purple-500 text-xl"></i>
                  <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} tracking-tight`}>Visual Architect</h3>
                </div>
                <button onClick={() => setShowVisualArchitect(false)} className="text-zinc-500 hover:text-red-500 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Architectural Prompt</label>
                  <textarea 
                    value={visualConfig.prompt}
                    onChange={(e) => setVisualConfig({...visualConfig, prompt: e.target.value})}
                    placeholder="Describe the educational visual..."
                    className={`w-full h-24 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-purple-50 border-purple-100 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Aspect Ratio</label>
                    <select 
                      value={visualConfig.aspectRatio}
                      onChange={(e) => setVisualConfig({...visualConfig, aspectRatio: e.target.value as any})}
                      className={`w-full p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-purple-100 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-purple-500/30`}
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Portrait</option>
                      <option value="4:3">4:3 Desktop</option>
                      <option value="3:4">3:4 Mobile</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Render Quality</label>
                    <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-purple-100'}`}>
                      <button 
                        onClick={() => setVisualConfig({...visualConfig, quality: 'standard'})}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${visualConfig.quality === 'standard' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500'}`}
                      >
                        Standard
                      </button>
                      <button 
                        onClick={() => setVisualConfig({...visualConfig, quality: 'pro'})}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${visualConfig.quality === 'pro' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-500'}`}
                      >
                        PRO
                      </button>
                    </div>
                  </div>
                </div>

                {visualConfig.quality === 'pro' && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
                      <i className="fas fa-circle-info mr-2"></i>
                      Pro rendering requires a personal API key from a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-black">paid GCP project</a>.
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => handleGenerateVisual()}
                  className={`w-full py-4 mt-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                    visualConfig.quality === 'pro' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-purple-500/20'
                  }`}
                >
                  Architect Visual Node
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Console */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-50 pointer-events-none">
          <div className="max-w-5xl mx-auto pointer-events-auto">
            {/* Quick Actions Console */}
            <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id as any)}
                  disabled={isTyping || isGeneratingImage}
                  className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5 text-zinc-400' : 'bg-white border-purple-100 text-zinc-600'} backdrop-blur-xl border text-[10px] font-black uppercase tracking-widest hover:border-purple-500/50 hover:text-purple-600 transition-all active:scale-95 disabled:opacity-30 shadow-xl group`}
                >
                  <i className={`fas ${action.icon} ${action.id === 'visual-render' ? 'text-amber-400' : 'text-purple-500'} group-hover:scale-110 transition-transform`}></i>
                  {action.label}
                </button>
              ))}
            </div>

            <div className={`relative glass-card p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-white/10 overflow-hidden`}>
               {pendingImage && (
                <div className="relative inline-block m-3 animate-in zoom-in duration-300">
                  <img src={pendingImage} alt="preview" className="h-28 w-28 object-cover rounded-2xl border-2 border-purple-500 shadow-2xl" />
                  <button onClick={() => setPendingImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xl hover:bg-red-600">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center relative gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping || isGeneratingImage}
                  className="w-14 h-14 flex items-center justify-center text-zinc-500 hover:text-purple-400 transition-colors rounded-2xl hover:bg-purple-500/5"
                >
                  <i className="fas fa-paperclip text-xl"></i>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.txt" />

                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Architect your question..."
                  disabled={isTyping || isGeneratingImage}
                  className={`flex-1 py-4 px-4 bg-transparent focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-zinc-800'} font-medium placeholder-zinc-500 text-base md:text-lg`}
                />

                <div className="flex items-center gap-2 pr-2">
                  <button 
                    type="submit"
                    disabled={isTyping || isGeneratingImage || (!inputValue.trim() && !pendingImage)}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale"
                  >
                    <i className="fas fa-arrow-right-long text-xl"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
