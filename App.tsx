import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import QuotesBar from './components/QuotesBar';
import { GradeLevel, Subject, Message, ChatSession, User, ImageGenerationConfig, ChatMode, GroundingLink } from './types';
import { getStreamingTutorResponse, generateTutorImage, getVisualSuggestions } from './services/geminiService';

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
  const [chatMode, setChatMode] = useState<ChatMode>('lite');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showVisualArchitect, setShowVisualArchitect] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [refiningImage, setRefiningImage] = useState<string | null>(null);
  
  const [visualSuggestions, setVisualSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const [visualConfig, setVisualConfig] = useState<ImageGenerationConfig>({
    prompt: '',
    aspectRatio: '1:1'
  });

  const [debouncedVisualPrompt, setDebouncedVisualPrompt] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Debounce visual architect prompt input
  useEffect(() => {
    if (showVisualArchitect) {
      const timer = setTimeout(() => {
        setDebouncedVisualPrompt(visualConfig.prompt);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [visualConfig.prompt, showVisualArchitect]);

  // Fetch suggestions
  useEffect(() => {
    if (showVisualArchitect && !refiningImage && activeSession) {
      const fetchIdeas = async () => {
        setIsFetchingSuggestions(true);
        const ideas = await getVisualSuggestions(activeSession.messages, debouncedVisualPrompt);
        if (ideas.length > 0) setVisualSuggestions(ideas);
        setIsFetchingSuggestions(false);
      };
      fetchIdeas();
    }
  }, [debouncedVisualPrompt, showVisualArchitect, refiningImage]);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
        }
        if (transcript) setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported.");
    if (isListening) recognitionRef.current.stop();
    else { recognitionRef.current.start(); setIsListening(true); }
  };

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
        content: `Initialization sequence complete. Hello ${user?.name || 'Academic'}! How shall we architect your knowledge today? I can now think deeper, search the web, and analyze images in high fidelity.`,
        timestamp: new Date()
      }],
      createdAt: new Date(),
      grade: GradeLevel.HighSchool,
      subject: Subject.General,
      mode: 'lite'
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
      timestamp: new Date(),
      isThinking: chatMode === 'complex' && !image
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
    ));

    try {
      let accumulatedContent = '';
      let accumulatedLinks: GroundingLink[] = [];
      const stream = getStreamingTutorResponse(
        userMessage.content,
        messages.slice(-10),
        chatMode,
        image || undefined
      );

      for await (const chunk of stream) {
        accumulatedContent += chunk.text;
        if (chunk.links.length > 0) {
          // Merge unique links
          chunk.links.forEach(link => {
            if (!accumulatedLinks.some(l => l.uri === link.uri)) accumulatedLinks.push(link);
          });
        }
        
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(msg => 
                msg.id === assistantMsgId ? { ...msg, content: accumulatedContent, groundingLinks: accumulatedLinks } : msg
              )
            };
          }
          return s;
        }));
      }
    } catch (error: any) {
      console.error(error);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(msg => msg.id === assistantMsgId ? { ...msg, content: "Neural link interrupted." } : msg) } : s));
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
    if (isListening) recognitionRef.current.stop();
    await sendMessage(text, img || undefined);
  };

  const handleGenerateVisual = async (configOverride?: Partial<ImageGenerationConfig>) => {
    if (!activeSessionId) return;

    const finalConfig: ImageGenerationConfig = { 
      ...visualConfig, 
      prompt: visualConfig.prompt || inputValue || "an educational diagram",
      base64Source: refiningImage || undefined,
      ...configOverride 
    };
    
    setIsGeneratingImage(true);
    setShowVisualArchitect(false);
    if (!configOverride?.prompt) setInputValue('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: refiningImage ? `Refine Visual: ${finalConfig.prompt}` : `Architect Visual: ${finalConfig.prompt}`,
      timestamp: new Date()
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

    try {
      const imageUrl = await generateTutorImage(finalConfig);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: refiningImage ? `Visual refined.` : `Visual architected.`,
        timestamp: new Date(),
        attachments: [imageUrl]
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
    } catch (error: any) {
      console.error("Image generation failed:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Warning:** ${error.message}`,
        timestamp: new Date()
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsGeneratingImage(false);
      setRefiningImage(null);
      setVisualConfig(prev => ({ ...prev, prompt: '' }));
      setVisualSuggestions([]);
      setDebouncedVisualPrompt('');
    }
  };

  const handleRefine = (image: string) => {
    setRefiningImage(image);
    setVisualConfig(prev => ({ ...prev, prompt: '' }));
    setShowVisualArchitect(true);
  };

  const handleAction = async (actionType: 'mock-test' | 'flowchart' | 'summary' | 'problem-solver' | 'visual-render') => {
    if (isTyping || isGeneratingImage) return;
    if (actionType === 'visual-render') {
      setVisualConfig(prev => ({ ...prev, prompt: inputValue }));
      setRefiningImage(null);
      setShowVisualArchitect(true);
      return;
    }
    let actionPrompt = "";
    switch(actionType) {
      case 'mock-test': actionPrompt = "Initiate a diagnostic Mock Test."; break;
      case 'flowchart': actionPrompt = "Architect a Mermaid flowchart."; break;
      case 'summary': actionPrompt = "Generate an executive summary."; break;
      case 'problem-solver': actionPrompt = "Break down a specific problem into atomic logical steps."; break;
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

  const handleLogout = () => { setUser(null); setView('landing'); localStorage.removeItem(USER_KEY); };
  const handleStartClicked = () => { if (user) setView('chat'); else setView('auth'); };

  if (view === 'landing') return <LandingPage onStart={handleStartClicked} theme={theme} onToggleTheme={toggleTheme} />;
  if (view === 'auth') return <Auth onLogin={(u) => { setUser(u); setView('chat'); if (sessions.length === 0) handleNewChat(); }} onBack={() => setView('landing')} theme={theme} onToggleTheme={toggleTheme} />;

  const QUICK_ACTIONS = [
    { id: 'visual-render', label: 'VISUAL RENDER', icon: 'fa-sparkles' },
    { id: 'mock-test', label: 'MOCK TEST', icon: 'fa-vial-circle-check' },
    { id: 'flowchart', label: 'FLOW LOGIC', icon: 'fa-diagram-project' },
    { id: 'summary', label: 'SUMMARY', icon: 'fa-rectangle-list' }
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
      onReset={() => { if(confirm("Purge history?")) { setSessions([]); handleNewChat(); } }}
      onGoHome={() => setView('landing')}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full relative">
        {/* Mode Selector */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1 gap-1">
          {[
            { id: 'lite', icon: 'bolt', label: 'Fast' },
            { id: 'search', icon: 'globe', label: 'Search' },
            { id: 'complex', icon: 'brain', label: 'Think' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setChatMode(mode.id as ChatMode)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${chatMode === mode.id ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <i className={`fas fa-${mode.icon}`}></i>
              {mode.label}
            </button>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-48">
            {messages.map((msg) => <ChatBubble key={msg.id} message={msg} theme={theme} onRefine={handleRefine} />)}
            {(isTyping || isGeneratingImage) && (
              <div className="flex justify-start mb-6 animate-pulse">
                <div className={`${theme === 'dark' ? 'bg-zinc-950 border-purple-500/30' : 'bg-white border-purple-200'} border px-6 py-4 rounded-3xl rounded-tl-none shadow-xl flex items-center gap-4`}>
                   <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">
                    {isGeneratingImage ? "SYNTHESIZING V-RENDER..." : chatMode === 'complex' ? "THINKING DEEP..." : chatMode === 'search' ? "BROWSING WEB..." : "ANALYZING..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Architect Modal */}
        {showVisualArchitect && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
            <div className={`w-full max-w-2xl glass-card rounded-[40px] p-10 shadow-2xl border-purple-500/20 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[95vh] custom-scrollbar ${theme === 'dark' ? 'bg-[#0a0515]' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <i className="fas fa-wand-magic-sparkles text-xl"></i>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} tracking-tight`}>
                      {refiningImage ? 'Visual Refinement Node' : 'Visual Architect Console'}
                    </h3>
                    <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>
                      Powered by Gemini Flash Image
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowVisualArchitect(false); setRefiningImage(null); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-zinc-500 hover:text-red-500">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-8">
                {refiningImage && (
                  <div className="flex gap-6 items-center p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-purple-500/30">
                      <img src={refiningImage} alt="refining" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Editing Source</p>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Request changes like "add a retro filter", "remove person", or "architect modification".</p>
                    </div>
                  </div>
                )}

                {!refiningImage && visualSuggestions.length > 0 && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-lightbulb"></i> Suggestions</label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                      {visualSuggestions.map((suggestion, i) => (
                        <button key={i} onClick={() => setVisualConfig(prev => ({ ...prev, prompt: suggestion }))} className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-purple-600 hover:bg-purple-50'}`}>{suggestion}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="fas fa-terminal"></i> Prompt</label>
                    <textarea 
                      value={visualConfig.prompt}
                      onChange={(e) => setVisualConfig({...visualConfig, prompt: e.target.value})}
                      placeholder={refiningImage ? "Describe your edits (e.g., 'Add a retro filter')..." : "Describe the visual to architect..."}
                      className={`w-full h-44 p-5 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-purple-50 border-purple-100 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium resize-none text-sm`}
                    />
                  </div>
                  {!refiningImage && (
                    <div className="grid grid-cols-1 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4">Aspect Ratio</label>
                        <div className="grid grid-cols-5 gap-2">
                          {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                            <button key={ratio} onClick={() => setVisualConfig({...visualConfig, aspectRatio: ratio as any})} className={`py-2 rounded-xl text-[9px] font-black border transition-all ${visualConfig.aspectRatio === ratio ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 text-zinc-400'}`}>{ratio}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-6 flex">
                  <button onClick={() => handleGenerateVisual()} disabled={!visualConfig.prompt.trim()} className="flex-1 py-5 bg-gradient-to-r from-purple-600 via-indigo-700 to-fuchsia-700 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                    <i className="fas fa-microchip"></i>
                    {refiningImage ? 'SYNTHESIZE EDITS' : 'ARCHITECT VISUAL'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Console */}
        <div className="absolute bottom-10 left-0 right-0 p-6 md:p-10 z-50 pointer-events-none">
          <div className="max-w-5xl mx-auto pointer-events-auto">
            <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.id} onClick={() => handleAction(action.id as any)} disabled={isTyping} className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5 text-zinc-400' : 'bg-white border-purple-100 text-zinc-600'} backdrop-blur-xl border text-[10px] font-black uppercase tracking-widest hover:border-purple-500/50 transition-all shadow-xl disabled:opacity-30`}>
                  <i className={`fas ${action.icon} text-purple-500`}></i>{action.label}
                </button>
              ))}
            </div>
            <div className={`relative glass-card p-2 rounded-[32px] shadow-2xl border-white/10 overflow-hidden`}>
               {pendingImage && (
                <div className="relative inline-block m-3 animate-in zoom-in">
                  <img src={pendingImage} alt="preview" className="h-28 w-28 object-cover rounded-2xl border-2 border-purple-500 shadow-2xl" />
                  <button onClick={() => setPendingImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xl"><i className="fas fa-times"></i></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center relative gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-14 h-14 flex items-center justify-center text-zinc-500 hover:text-purple-400 transition-colors rounded-2xl"><i className="fas fa-paperclip text-xl"></i></button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={chatMode === 'complex' ? "Architect complex query..." : "Ask your tutor..."} className={`flex-1 py-4 px-4 bg-transparent focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-zinc-800'} font-medium text-lg`} />
                <div className="flex items-center gap-2 pr-2">
                  <button type="button" onClick={toggleListening} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500/10 text-red-500 animate-pulse' : 'text-zinc-500'}`}><i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i></button>
                  <button type="button" onClick={() => handleAction('visual-render')} className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-500 hover:text-purple-400" title="Visual Architect Console"><i className="fas fa-wand-magic-sparkles text-lg"></i></button>
                  <button type="submit" disabled={isTyping || (!inputValue.trim() && !pendingImage)} className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 disabled:opacity-20"><i className="fas fa-arrow-right-long text-xl"></i></button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <QuotesBar theme={theme} />
      </div>
    </Layout>
  );
};

export default App;