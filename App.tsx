
import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import QuotesBar from './components/QuotesBar';
import { GradeLevel, Subject, Message, ChatSession, User, ImageGenerationConfig } from './types';
import { getStreamingTutorResponse, generateTutorImage, getVisualSuggestions } from './services/geminiService';

const STORAGE_KEY = 'intellexa_history_v2';
const USER_KEY = 'intellexa_user_v2';
const THEME_KEY = 'intellexa_theme';

const VISUAL_STYLES = [
  { id: 'academic', label: 'Academic Render', icon: 'fa-graduation-cap' },
  { id: '3d-render', label: '3D Isometric', icon: 'fa-cube' },
  { id: 'photorealistic', label: 'Photorealistic', icon: 'fa-camera' },
  { id: 'blueprint', label: 'Technical Blueprint', icon: 'fa-drafting-compass' },
  { id: 'sketch', label: 'Pencil Sketch', icon: 'fa-pen-nib' },
  { id: 'diagram', label: 'Flat Diagram', icon: 'fa-chart-pie' }
];

const CAMERA_ANGLES = [
  { id: 'eye-level', label: 'Eye Level', icon: 'fa-eye' },
  { id: 'top-down', label: 'Top Down', icon: 'fa-arrow-down' },
  { id: 'low-angle', label: 'Hero / Low Angle', icon: 'fa-up-long' },
  { id: 'macro', label: 'Macro Close-up', icon: 'fa-magnifying-glass-plus' },
  { id: 'wide', label: 'Wide Panorama', icon: 'fa-arrows-left-right' }
];

const LIGHTING_OPTIONS = [
  { id: 'cinematic', label: 'Cinematic Studio', icon: 'fa-film' },
  { id: 'soft', label: 'Soft Ambient', icon: 'fa-cloud' },
  { id: 'scientific', label: 'Clean Laboratory', icon: 'fa-flask' },
  { id: 'dramatic', label: 'High Contrast', icon: 'fa-bolt' },
  { id: 'neon', label: 'Holographic Glow', icon: 'fa-wand-sparkles' }
];

const TEXTURE_OPTIONS = [
  { id: 'polished', label: 'Polished Metal', icon: 'fa-circle-half-stroke' },
  { id: 'matte', label: 'Matte Polymer', icon: 'fa-square' },
  { id: 'glass', label: 'Translucent Glass', icon: 'fa-ghost' },
  { id: 'carbon', label: 'High-Tech Carbon', icon: 'fa-dna' },
  { id: 'paper', label: 'Organic / Paper', icon: 'fa-leaf' }
];

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
  const [isListening, setIsListening] = useState(false);
  const [refiningImage, setRefiningImage] = useState<string | null>(null);
  
  const [visualSuggestions, setVisualSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const [visualConfig, setVisualConfig] = useState<ImageGenerationConfig>({
    prompt: '',
    aspectRatio: '1:1',
    style: 'academic',
    cameraAngle: 'eye-level',
    lighting: 'scientific',
    texture: 'matte'
  });

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

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (showVisualArchitect && !refiningImage && activeSession) {
      const fetchIdeas = async () => {
        setIsFetchingSuggestions(true);
        const ideas = await getVisualSuggestions(activeSession.messages);
        setVisualSuggestions(ideas);
        setIsFetchingSuggestions(false);
      };
      fetchIdeas();
    }
  }, [showVisualArchitect, refiningImage]);

  // Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
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
    } catch (error: any) {
      console.error(error);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(msg => msg.id === assistantMsgId ? { ...msg, content: "Neural link interrupted. Please check your connectivity or system configuration." } : msg) } : s));
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
      prompt: visualConfig.prompt || inputValue || "an educational diagram of the current topic",
      base64Source: refiningImage || undefined,
      ...configOverride 
    };

    setIsGeneratingImage(true);
    setShowVisualArchitect(false);
    if (!configOverride?.prompt) setInputValue('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: refiningImage 
        ? `Refine Architecting Visual: ${finalConfig.prompt} [Refinement Loop Active]` 
        : `Architect a ${finalConfig.aspectRatio} ${finalConfig.style} render of: ${finalConfig.prompt} [Advanced Node Active]`,
      timestamp: new Date()
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

    try {
      const imageUrl = await generateTutorImage(finalConfig);
      if (imageUrl) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: refiningImage 
            ? `Render refinement complete. I have updated the visual logic according to your latest parameters.`
            : `I've architected a visual aid with advanced parameters:\n\n- **Style**: ${finalConfig.style}\n- **Perspective**: ${finalConfig.cameraAngle}\n- **Lighting**: ${finalConfig.lighting}\n- **Materials**: ${finalConfig.texture}\n- **Aspect Ratio**: ${finalConfig.aspectRatio}`,
          timestamp: new Date(),
          attachments: [imageUrl]
        };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
      } else {
        throw new Error("Render failure");
      }
    } catch (error: any) {
      console.error("Image generation failed:", error);
      let errorText = "Visualization engine error. Could not allocate resources for this specific architectural render.";
      
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
      setVisualSuggestions([]);
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
                    {isGeneratingImage ? "SYNTHESIZING V-RENDER..." : "ANALYZING NEURAL DATA..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Architect Modal */}
        {showVisualArchitect && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
            <div className={`w-full max-w-4xl glass-card rounded-[40px] p-10 shadow-2xl border-purple-500/20 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[95vh] custom-scrollbar ${theme === 'dark' ? 'bg-[#0a0515]' : 'bg-white'}`}>
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
                      {refiningImage ? 'Specify modifications to the existing render' : 'Advanced Architectural Render Settings'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowVisualArchitect(false); setRefiningImage(null); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-10">
                {refiningImage && (
                  <div className="flex gap-6 items-center p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 animate-in slide-in-from-top-4 duration-500">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-purple-500/30 flex-shrink-0">
                      <img src={refiningImage} alt="refining" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Source Material Active</p>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Instruction node will focus on modifying the visual data of this specific render.
                      </p>
                    </div>
                  </div>
                )}

                {!refiningImage && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-lightbulb"></i> Cognitive Suggestions
                    </label>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                      {isFetchingSuggestions ? (
                        Array(3).fill(0).map((_, i) => (
                          <div key={i} className={`flex-shrink-0 h-10 w-48 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-purple-100/50'}`}></div>
                        ))
                      ) : visualSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setVisualConfig(prev => ({ ...prev, prompt: suggestion }))}
                          className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-purple-600 hover:bg-purple-50 shadow-sm'} flex items-center gap-2 group whitespace-nowrap`}
                        >
                          <i className="fas fa-sparkles text-purple-500 group-hover:scale-110 transition-transform"></i>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Left Column: Prompt & Aspect Ratio */}
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fas fa-terminal"></i> 
                        {refiningImage ? 'Refinement Instructions' : 'Architectural Prompt'}
                      </label>
                      <textarea 
                        value={visualConfig.prompt}
                        onChange={(e) => setVisualConfig({...visualConfig, prompt: e.target.value})}
                        placeholder={refiningImage ? "e.g. Add more detail to the mitochondria, change the lighting to cinematic..." : "Describe the conceptual visual in architectural detail..."}
                        className={`w-full h-40 p-5 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-purple-50 border-purple-100 text-zinc-900'} focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium resize-none text-sm leading-relaxed`}
                      />
                    </div>

                    {!refiningImage && (
                      <div>
                        <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <i className="fas fa-expand"></i> Output Aspect Ratio
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setVisualConfig({...visualConfig, aspectRatio: ratio as any})}
                              className={`py-3 rounded-2xl text-[10px] font-black border transition-all ${visualConfig.aspectRatio === ratio ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-zinc-600 hover:bg-purple-50'}`}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Style & Perspective */}
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fas fa-palette"></i> Synthesis Style
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {VISUAL_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setVisualConfig({...visualConfig, style: style.id})}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold border transition-all ${visualConfig.style === style.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-zinc-600 hover:bg-purple-50'}`}
                          >
                            <i className={`fas ${style.icon} w-4 text-sm opacity-70`}></i>
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <i className="fas fa-video"></i> Camera Perspective
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {CAMERA_ANGLES.map((angle) => (
                          <button
                            key={angle.id}
                            onClick={() => setVisualConfig({...visualConfig, cameraAngle: angle.id})}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold border transition-all ${visualConfig.cameraAngle === angle.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-zinc-600 hover:bg-purple-50'}`}
                          >
                            <i className={`fas ${angle.icon} w-4 text-sm opacity-70`}></i>
                            {angle.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <i className="fas fa-sun"></i> Lighting Environment
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {LIGHTING_OPTIONS.map((light) => (
                        <button
                          key={light.id}
                          onClick={() => setVisualConfig({...visualConfig, lighting: light.id})}
                          className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-bold border transition-all ${visualConfig.lighting === light.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-zinc-600 hover:bg-purple-50'}`}
                        >
                          <i className={`fas ${light.icon} text-lg mb-1`}></i>
                          {light.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <i className="fas fa-brush"></i> Surface & Material
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TEXTURE_OPTIONS.map((tex) => (
                        <button
                          key={tex.id}
                          onClick={() => setVisualConfig({...visualConfig, texture: tex.id})}
                          className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-bold border transition-all ${visualConfig.texture === tex.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-purple-100 text-zinc-600 hover:bg-purple-50'}`}
                        >
                          <i className={`fas ${tex.icon} text-lg mb-1`}></i>
                          {tex.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => { setShowVisualArchitect(false); setRefiningImage(null); setVisualSuggestions([]); }}
                    className={`flex-1 py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] border transition-all ${theme === 'dark' ? 'border-white/10 text-zinc-400 hover:bg-white/5' : 'border-purple-100 text-zinc-500 hover:bg-zinc-50'}`}
                  >
                    Abort {refiningImage ? 'Refinement' : 'Synthesis'}
                  </button>
                  <button 
                    onClick={() => handleGenerateVisual()}
                    className="flex-[2] py-5 bg-gradient-to-r from-purple-600 via-indigo-700 to-fuchsia-700 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 shadow-purple-500/20 flex items-center justify-center gap-4 group"
                  >
                    <i className="fas fa-microchip group-hover:rotate-180 transition-transform duration-700"></i>
                    {refiningImage ? 'Synthesize Refined Render' : 'Initiate Multi-Node Render'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Console */}
        <div className="absolute bottom-10 left-0 right-0 p-6 md:p-10 z-50 pointer-events-none">
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
                  <i className={`fas ${action.icon} text-purple-500 group-hover:scale-110 transition-transform`}></i>
                  {action.label}
                </button>
              ))}
            </div>

            <div className={`relative glass-card p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-white/10 overflow-hidden`}>
               {pendingImage && (
                <div className="relative inline-block m-3 animate-in zoom-in duration-300">
                  <img src={pendingImage} alt="preview" className="h-28 w-28 object-cover rounded-2xl border-2 border-purple-500 shadow-2xl" />
                  <button onClick={() => setPendingImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white h-7 rounded-full flex items-center justify-center text-xs shadow-2xl hover:bg-red-600">
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
                  title="Attach File"
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
                    type="button"
                    onClick={toggleListening}
                    disabled={isTyping || isGeneratingImage}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500/10 text-red-500 animate-pulse' : theme === 'dark' ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-purple-50 text-purple-400'} hover:text-purple-500`}
                    title={isListening ? "Stop Listening" : "Start Dictation"}
                  >
                    <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i>
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleAction('visual-render')}
                    disabled={isTyping || isGeneratingImage}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-purple-50 text-purple-400'} hover:text-purple-500`}
                    title="Advanced V-Render Architect"
                  >
                    <i className="fas fa-sliders-h text-lg"></i>
                  </button>
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

        {/* Quotes Bar */}
        <QuotesBar theme={theme} />
      </div>
    </Layout>
  );
};

export default App;
