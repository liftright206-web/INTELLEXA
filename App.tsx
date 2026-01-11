import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import QuotesBar from './components/QuotesBar';
import RocketTransition from './components/RocketTransition';
import { GradeLevel, Subject, Message, ChatSession, User, ChatMode, GroundingLink, LearningEnvironment } from './types';
import { getStreamingTutorResponse, getDialogueSuggestions } from './services/geminiService';

const STORAGE_KEY = 'intellexa_history_v4';
const USER_KEY = 'intellexa_user_v4';
const ENV_KEY = 'intellexa_envs_v4';

const DEFAULT_ENVS: LearningEnvironment[] = [
  { id: 'env-1', name: 'General Hub', icon: 'fa-brain', subject: Subject.General, complexity: 'adept', archetype: 'socratic' },
  { id: 'env-2', name: 'Math Studio', icon: 'fa-calculator', subject: Subject.Mathematics, complexity: 'master', archetype: 'technical' }
];

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'chat'>('landing');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [environments, setEnvironments] = useState<LearningEnvironment[]>(() => {
    const saved = localStorage.getItem(ENV_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_ENVS;
  });

  const [activeEnvId, setActiveEnvId] = useState<string>(environments[0].id);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [newEnv, setNewEnv] = useState<Partial<LearningEnvironment>>({
    name: '',
    icon: 'fa-microscope',
    subject: Subject.General,
    complexity: 'adept',
    archetype: 'storyteller',
    customInstructions: ''
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
  const [dialogueChips, setDialogueChips] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeEnv = environments.find(e => e.id === activeEnvId);

  useEffect(() => {
    localStorage.setItem(ENV_KEY, JSON.stringify(environments));
  }, [environments]);

  const handleOpenKeyPicker = async () => {
    const win = window as any;
    if (win.aistudio) {
      try {
        await win.aistudio.openSelectKey();
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      } catch (e) {
        console.error("Failed to open key picker", e);
      }
    }
  };

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
  }, [activeSessionId, sessions, isTyping, dialogueChips]);

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
        content: `LOGIC GATES: OPEN! Welcome to the ${activeEnv?.name || 'Hub'}! I'm Intellexa. Architecting solutions within the ${activeEnv?.subject} framework. Ready to begin?`,
        timestamp: new Date()
      }],
      createdAt: new Date(),
      grade: GradeLevel.HighSchool,
      subject: Subject.General,
      mode: 'lite',
      environmentId: activeEnvId
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setDialogueChips(["Let's explore Math!", "How about Science?", "Explain how AI works."]);
  };

  const handleCreateEnv = () => {
    if (!newEnv.name) return;
    const id = `env-${Date.now()}`;
    const env: LearningEnvironment = { ...newEnv as LearningEnvironment, id };
    setEnvironments([...environments, env]);
    setActiveEnvId(id);
    setShowEnvModal(false);
    setNewEnv({ name: '', icon: 'fa-microscope', subject: Subject.General, complexity: 'adept', archetype: 'storyteller', customInstructions: '' });
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

  const sendMessage = async (text: string) => {
    if (!activeSessionId) return;

    if (!apiKeyReady) {
      await handleOpenKeyPicker();
    }

    setDialogueChips([]);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMessage] } : s));
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: chatMode === 'complex'
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s));

    try {
      let accumulatedContent = '';
      let accumulatedLinks: GroundingLink[] = [];
      const stream = getStreamingTutorResponse(userMessage.content, messages.slice(-10), chatMode, activeEnv);

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

      const suggestions = await getDialogueSuggestions([...messages, userMessage, { ...assistantMessage, content: accumulatedContent }]);
      setDialogueChips(suggestions);

    } catch (error: any) {
      console.error(error);
      let errorMsg = `Communication Error: ${error.message}.`;
      
      if (error.message?.includes("QUOTA") || error.message?.includes("429")) {
        errorMsg = "Critical: Current API project quota exhausted. Please try again later or select a different project key.";
        await handleOpenKeyPicker();
      }

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(msg => msg.id === assistantMsgId ? { ...msg, content: errorMsg, isThinking: false } : msg) } : s));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const handleAction = async (actionType: 'mock-test' | 'flowchart' | 'summary' | 'problem-solver') => {
    if (isTyping) return;
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
    { id: 'flowchart', label: 'DIAGRAM AID', icon: 'fa-diagram-project' },
    { id: 'mock-test', label: 'PRACTICE TEST', icon: 'fa-vial' },
    { id: 'summary', label: 'SUMMARY', icon: 'fa-book' },
    { id: 'problem-solver', label: 'STEP SOLVER', icon: 'fa-calculator' }
  ];

  return (
    <div className="animate-in fade-in duration-1000 h-full">
      <Layout 
        sessions={sessions}
        activeSessionId={activeSessionId}
        user={user}
        environments={environments}
        activeEnvId={activeEnvId}
        onEnvSelect={setActiveEnvId}
        onNewEnv={() => setShowEnvModal(true)}
        onSessionSelect={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={(id) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) setActiveSessionId(''); }}
        onReset={() => { if(confirm("Reset Workspace? This will delete all history.")) { setSessions([]); handleNewChat(); } }}
        onGoHome={() => setView('landing')}
        onLogout={handleLogout}
        onSwitchKey={handleOpenKeyPicker}
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
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
              {isTyping && (
                <div className="flex justify-start mb-8 animate-pulse">
                  <div className="bg-zinc-900 border border-purple-500/20 px-5 py-3.5 rounded-2xl rounded-tl-none shadow-xl flex items-center gap-4">
                     <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                      SYNTHESIZING...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                  <button key={action.id} onClick={() => handleAction(action.id as any)} disabled={isTyping} className="flex-shrink-0 flex items-center gap-3 px-4 md:px-5 py-2.5 rounded-xl bg-zinc-900/80 border-white/5 text-zinc-400 backdrop-blur-xl border text-[9px] font-black uppercase tracking-widest hover:border-purple-500 transition-all shadow-2xl disabled:opacity-30">
                    <i className={`fas ${action.icon} text-purple-500`}></i>{action.label}
                  </button>
                ))}
              </div>

              <div className="relative glass-card p-1.5 rounded-3xl shadow-2xl border-white/10 overflow-hidden">
                <form onSubmit={handleSendMessage} className="flex items-center relative gap-1 px-4">
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={`Engage with Intellexa in ${activeEnv?.name || 'Lab'}...`} className="flex-1 py-3.5 px-3 bg-transparent focus:outline-none text-white font-medium text-base md:text-lg" />
                  <button type="submit" disabled={isTyping || !inputValue.trim()} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-purple-600 text-white shadow-lg hover:bg-purple-500 disabled:opacity-20 active:scale-95 transition-all"><i className="fas fa-paper-plane"></i></button>
                </form>
              </div>
            </div>
          </div>
          <QuotesBar />
        </div>

        {showEnvModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg animate-in fade-in">
            <div className="w-full max-w-xl glass-card rounded-[32px] p-8 border-white/10 shadow-2xl animate-in zoom-in-95">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Architect New Lab</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Environment Creation Protocol</p>
                  </div>
                  <button onClick={() => setShowEnvModal(false)} className="text-zinc-500 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Environment Name</label>
                    <input type="text" value={newEnv.name} onChange={e => setNewEnv({...newEnv, name: e.target.value})} placeholder="e.g. Quantum Physics Hub" className="w-full px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Subject Focus</label>
                      <select value={newEnv.subject} onChange={e => setNewEnv({...newEnv, subject: e.target.value as Subject})} className="w-full px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium appearance-none">
                        {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Icon</label>
                      <select value={newEnv.icon} onChange={e => setNewEnv({...newEnv, icon: e.target.value})} className="w-full px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium appearance-none">
                        <option value="fa-microscope">Microscope</option>
                        <option value="fa-atom">Atom</option>
                        <option value="fa-book-open">Book</option>
                        <option value="fa-code">Code</option>
                        <option value="fa-flask">Flask</option>
                        <option value="fa-globe">Globe</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Instructional Archetype</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['storyteller', 'technical', 'socratic'].map(arch => (
                         <button key={arch} onClick={() => setNewEnv({...newEnv, archetype: arch as any})} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newEnv.archetype === arch ? 'bg-purple-600 border-purple-400 text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>{arch}</button>
                       ))}
                    </div>
                  </div>

                  <button onClick={handleCreateEnv} disabled={!newEnv.name} className="w-full py-4 bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-purple-500 active:scale-95 disabled:opacity-50">INITIALIZE ENVIRONMENT</button>
               </div>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
};

export default App;