import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import QuotesBar from './components/QuotesBar';
import RocketTransition from './components/RocketTransition';
import { GradeLevel, Subject, Message, ChatSession, User, ChatMode, GroundingLink, ImageGenerationConfig } from './types';
import { getStreamingTutorResponse, generateTutorImage, getVisualSuggestions, getDialogueSuggestions } from './services/geminiService';

const STORAGE_KEY = 'intellexa_history_v3';
const USER_KEY = 'intellexa_user_v3';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'chat'>('landing');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  
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
  const [isListening, setIsListening] = useState(false);
  const [dialogueChips, setDialogueChips] = useState<string[]>([]);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showVisualArchitect, setShowVisualArchitect] = useState(false);
  const [refiningImage, setRefiningImage] = useState<string | null>(null);
  const [visualConfig, setVisualConfig] = useState<ImageGenerationConfig>({ prompt: '', aspectRatio: '1:1' });
  const [visualSuggestions, setVisualSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [debouncedVisualPrompt, setDebouncedVisualPrompt] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      } else {
        setApiKeyReady(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

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
  }, [activeSessionId, sessions, isTyping, isGeneratingImage, dialogueChips]);

  useEffect(() => {
    if (showVisualArchitect) {
      const timer = setTimeout(() => {
        setDebouncedVisualPrompt(visualConfig.prompt);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [visualConfig.prompt, showVisualArchitect]);

  useEffect(() => {
    if (showVisualArchitect && !refiningImage && activeSession && apiKeyReady) {
      const fetchIdeas = async () => {
        setIsFetchingSuggestions(true);
        const ideas = await getVisualSuggestions(activeSession.messages, debouncedVisualPrompt);
        if (ideas.length > 0) setVisualSuggestions(ideas);
        setIsFetchingSuggestions(false);
      };
      fetchIdeas();
    }
  }, [debouncedVisualPrompt, showVisualArchitect, refiningImage, apiKeyReady]);

  const handleOpenKeyPicker = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setApiKeyReady(true);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: `LOGIC GATES: OPEN! Welcome back, ${user?.name || 'Friend'}! I'm Intellexa. I can architect solutions for your homework, draw structural diagrams, or even generate educational visuals! What's on your mind?`,
        timestamp: new Date()
      }],
      createdAt: new Date(),
      grade: GradeLevel.HighSchool,
      subject: Subject.General,
      mode: 'lite'
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setDialogueChips(["Let's explore Math!", "How about Science?", "Explain how AI works."]);
  };

  const startTransitionToChat = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setView('chat');
      if (sessions.length === 0) handleNewChat();
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); 
    }, 1500); 
  };

  const sendMessage = async (text: string, image?: string) => {
    if (!activeSessionId) return;

    if (!apiKeyReady) {
      handleOpenKeyPicker();
      return;
    }

    setDialogueChips([]);
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

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s));

    try {
      let accumulatedContent = '';
      let accumulatedLinks: GroundingLink[] = [];
      const stream = getStreamingTutorResponse(userMessage.content, messages.slice(-10), chatMode, image || undefined);

      for await (const chunk of stream) {
        accumulatedContent += chunk.text;
        if (chunk.links.length > 0) {
          chunk.links.forEach(link => {
            if (!accumulatedLinks.some(l => l.uri === link.uri)) accumulatedLinks.push(link);
          });
        }
        
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(msg => 
                msg.id === assistantMsgId ? { ...msg, content: accumulatedContent, groundingLinks: accumulatedLinks, isThinking: false } : msg
              )
            };
          }
          return s;
        }));
      }

      const updatedHistory = [...messages, userMessage, { ...assistantMessage, content: accumulatedContent }];
      const suggestions = await getDialogueSuggestions(updatedHistory);
      setDialogueChips(suggestions);

    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("not found")) {
        setApiKeyReady(false);
        handleOpenKeyPicker();
      }
      const errorMessage = `Connection Disrupted: ${error.message}. Please ensure you've selected an active API key with available quota.`;
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(msg => msg.id === assistantMsgId ? { ...msg, content: errorMessage, isThinking: false } : msg) } : s));
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
    if (!apiKeyReady) {
      handleOpenKeyPicker();
      return;
    }

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
      content: refiningImage ? `Polishing visual: ${finalConfig.prompt}` : `Synthesizing visual: ${finalConfig.prompt}`,
      timestamp: new Date()
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

    try {
      const imageUrl = await generateTutorImage(finalConfig);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: refiningImage ? `Polished architecture ready!` : `I've synthesized the visual you requested!`,
        timestamp: new Date(),
        attachments: [imageUrl]
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
    } catch (error: any) {
      console.error(error);
      let errorText = `Visual Synthesis Failed: ${error.message}.`;
      
      if (error.message?.includes("QUOTA_EXHAUSTED") || error.message?.includes("429")) {
        errorText = "Visual Synthesis Failed: Your current API key has no quota for image generation. Please select a project with active billing.";
        handleOpenKeyPicker(); // Force re-selection on quota error
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
      setRefiningImage(null);
      setVisualConfig(prev => ({ ...prev, prompt: '' }));
    }
  };

  const handleAction = async (actionType: 'mock-test' | 'flowchart' | 'summary' | 'problem-solver' | 'visual-render') => {
    if (isTyping || isGeneratingImage) return;
    if (actionType === 'visual-render') {
      if (!apiKeyReady) {
        handleOpenKeyPicker();
        return;
      }
      setVisualConfig(prev => ({ ...prev, prompt: inputValue }));
      setRefiningImage(null);
      setShowVisualArchitect(true);
      return;
    }
    let actionPrompt = "";
    switch(actionType) {
      case 'mock-test': actionPrompt = "Initiate a quick practice test!"; break;
      case 'flowchart': actionPrompt = "Create a detailed Mermaid flowchart of this concept."; break;
      case 'summary': actionPrompt = "Summarize this information clearly."; break;
      case 'problem-solver': actionPrompt = "Explain this problem step-by-step."; break;
    }
    await sendMessage(actionPrompt);
  };

  const handleLogout = () => { setUser(null); setView('landing'); localStorage.removeItem(USER_KEY); };
  const handleStartClicked = () => { if (user) startTransitionToChat(); else setView('auth'); };

  if (isTransitioning) return <RocketTransition />;
  if (view === 'landing') return <LandingPage onStart={handleStartClicked} />;
  if (view === 'auth') return <Auth onLogin={(u) => { setUser(u); startTransitionToChat(); }} onBack={() => setView('landing')} />;

  const QUICK_ACTIONS = [
    { id: 'visual-render', label: 'VISUAL AID', icon: 'fa-wand-sparkles' },
    { id: 'flowchart', label: 'DIAGRAM AID', icon: 'fa-diagram-project' },
    { id: 'mock-test', label: 'PRACTICE TEST', icon: 'fa-vial' },
    { id: 'summary', label: 'SUMMARY', icon: 'fa-book' }
  ];

  return (
    <div className="animate-in fade-in duration-1000 h-full">
      <Layout 
        sessions={sessions}
        activeSessionId={activeSessionId}
        user={user}
        onSessionSelect={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={(id) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) setActiveSessionId(''); }}
        onReset={() => { if(confirm("Reset Workspace? This will delete all your study history.")) { setSessions([]); handleNewChat(); } }}
        onGoHome={() => setView('landing')}
        onLogout={handleLogout}
      >
        <div className="flex flex-col h-full relative">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1 gap-1 shadow-lg max-w-[95%] overflow-x-auto no-scrollbar">
            {[
              { id: 'lite', icon: 'bolt', label: 'Quick' },
              { id: 'search', icon: 'globe', label: 'Research' },
              { id: 'complex', icon: 'brain', label: 'Deep' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setChatMode(mode.id as ChatMode)}
                className={`px-4 md:px-5 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${chatMode === mode.id ? 'bg-purple-600 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <i className={`fas fa-${mode.icon}`}></i>
                {mode.label}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto pb-64">
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} onRefine={(img) => { setRefiningImage(img); setShowVisualArchitect(true); }} />)}
              {(isTyping || isGeneratingImage) && (
                <div className="flex justify-start mb-8 animate-pulse">
                  <div className="bg-zinc-900 border border-purple-500/20 px-5 py-3.5 rounded-2xl rounded-tl-none shadow-xl flex items-center gap-4">
                     <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                      {isGeneratingImage ? "SYNTHESIZING VISUAL..." : "PROCESSING..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showVisualArchitect && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-2xl glass-card bg-[#05010d] rounded-3xl p-6 md:p-8 shadow-2xl border-white/5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                      <i className="fas fa-wand-magic-sparkles text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-white tracking-tight">{refiningImage ? 'Visual Polishing' : 'Architect Studio'}</h3>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Image Synthesis</p>
                    </div>
                  </div>
                  <button onClick={() => setShowVisualArchitect(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-zinc-500">
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {refiningImage && (
                    <div className="flex gap-4 items-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                      <img src={refiningImage} className="w-16 h-16 rounded-lg object-cover border border-purple-500/20" />
                      <p className="text-xs font-medium text-zinc-400">Describe refinements for this visual.</p>
                    </div>
                  )}

                  <textarea 
                    value={visualConfig.prompt}
                    onChange={(e) => setVisualConfig({...visualConfig, prompt: e.target.value})}
                    placeholder="Describe the educational visual..."
                    className="w-full h-32 p-4 rounded-xl border bg-zinc-900 border-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium resize-none text-sm"
                  />

                  <div className="grid grid-cols-5 gap-2">
                    {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                      <button key={ratio} onClick={() => setVisualConfig({...visualConfig, aspectRatio: ratio as any})} className={`py-2 rounded-lg text-[10px] font-black border transition-all ${visualConfig.aspectRatio === ratio ? 'bg-purple-600 text-white border-purple-500' : 'bg-zinc-800 text-zinc-500 border-transparent'}`}>{ratio}</button>
                    ))}
                  </div>

                  <button onClick={() => handleGenerateVisual()} disabled={!visualConfig.prompt.trim()} className="w-full py-4 bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-purple-500 disabled:opacity-50 active:scale-95">
                    {refiningImage ? 'REFINE VISUAL' : 'SYNTHESIZE'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-10 left-0 right-0 p-4 md:p-6 z-50 pointer-events-none">
            <div className="max-w-4xl mx-auto pointer-events-auto">
              
              {!isTyping && dialogueChips.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-2">
                  {dialogueChips.map((chip, idx) => (
                    <button key={idx} onClick={() => sendMessage(chip)} className="suggestion-chip flex-shrink-0 px-4 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-200 text-[10px] font-bold hover:bg-purple-600/40 hover:border-purple-500/50 transition-all backdrop-blur-md shadow-lg" style={{ animationDelay: `${idx * 0.1}s` }}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.id} onClick={() => handleAction(action.id as any)} disabled={isTyping || isGeneratingImage} className="flex-shrink-0 flex items-center gap-3 px-4 md:px-5 py-2.5 rounded-xl bg-zinc-900/80 border-white/5 text-zinc-400 backdrop-blur-xl border text-[9px] font-black uppercase tracking-widest hover:border-purple-500 transition-all shadow-2xl disabled:opacity-30">
                    <i className={`fas ${action.icon} text-purple-500`}></i>{action.label}
                  </button>
                ))}
              </div>

              <div className="relative glass-card p-1.5 rounded-3xl shadow-2xl border-white/10 overflow-hidden">
                 {pendingImage && (
                  <div className="relative inline-block m-2">
                    <img src={pendingImage} className="h-20 w-20 object-cover rounded-xl border border-purple-500 shadow-xl" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg"><i className="fas fa-times"></i></button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center relative gap-1 px-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-zinc-500 hover:text-purple-400"><i className="fas fa-plus-circle text-xl"></i></button>
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setPendingImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} className="hidden" accept="image/*" />
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Engage with Intellexa..." className="flex-1 py-3.5 px-3 bg-transparent focus:outline-none text-white font-medium text-base md:text-lg" />
                  <button type="submit" disabled={isTyping || (!inputValue.trim() && !pendingImage)} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-purple-600 text-white shadow-lg hover:bg-purple-500 disabled:opacity-20 active:scale-95 transition-all"><i className="fas fa-paper-plane"></i></button>
                </form>
              </div>
            </div>
          </div>
          <QuotesBar />
        </div>
      </Layout>
    </div>
  );
};

export default App;