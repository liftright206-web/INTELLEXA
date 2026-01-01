
import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import { GradeLevel, Subject, Message, ChatSession, User } from './types';
import { getStreamingTutorResponse, generateTutorImage } from './services/geminiService';

const STORAGE_KEY = 'intellexa_history_v1';
const USER_KEY = 'intellexa_user_v1';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'auth' | 'chat'>('landing');
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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSessionId, sessions, isTyping, isGeneratingImage]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Study Topic",
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: `Hi ${user?.name || 'there'}! I'm Intellexa, your study buddy. 🎓\n\nI'm ready to help you explore any concept, solve complex problems, or visualize ideas through flowcharts and realistic 3D models. What are we exploring today?`,
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
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(msg => msg.id === assistantMsgId ? { ...msg, content: "Oops! I hit a snag. Check your API key." } : msg) } : s));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !pendingImage) return;

    const currentText = inputValue;
    const currentImage = pendingImage;
    
    setInputValue('');
    setPendingImage(null);
    
    await sendMessage(currentText, currentImage || undefined);
  };

  const handleAction = async (actionType: 'mock-test' | 'flowchart' | 'summary' | 'problem-solver') => {
    if (isTyping || isGeneratingImage) return;

    let actionPrompt = "";
    switch(actionType) {
      case 'mock-test':
        actionPrompt = "Can you create a short Mock Test for me based on what we've been discussing? Include 3 multiple-choice questions and 1 short-answer question.";
        break;
      case 'flowchart':
        actionPrompt = "Create a detailed Mermaid flowchart architecting the main concepts of our current discussion.";
        break;
      case 'summary':
        actionPrompt = "Please provide a concise architectural summary of the key takeaways from our session.";
        break;
      case 'problem-solver':
        actionPrompt = "Let's tackle a specific practice problem related to this topic. Can you walk me through one step-by-step?";
        break;
    }
    
    await sendMessage(actionPrompt);
  };

  const handleGenerateVisual = async () => {
    if (!activeSessionId || !inputValue.trim()) return;
    
    const prompt = inputValue;
    setInputValue('');
    setIsGeneratingImage(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Please architect a visual for: ${prompt}`,
      timestamp: new Date()
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

    try {
      const imageUrl = await generateTutorImage(prompt);
      if (imageUrl) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've architected a visual aid for: **${prompt}**. This high-fidelity render should help clarify the spatial and structural details of the concept.`,
          timestamp: new Date(),
          attachments: [imageUrl]
        };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
      } else {
        throw new Error("Failed to generate image");
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't architect that visual right now. My rendering engine encountered an error.",
        timestamp: new Date()
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith('image/')) {
          setPendingImage(reader.result as string);
        } else {
          setInputValue(prev => `${prev}\n[Attached File: ${file.name}]`);
        }
      };
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Delete ALL history?")) {
      setSessions([]);
      setActiveSessionId('');
      localStorage.removeItem(STORAGE_KEY);
      handleNewChat();
    }
  };

  const deleteSession = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) setActiveSessionId(filtered.length > 0 ? filtered[0].id : '');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (sessions.length > 0) {
      setView('chat');
    } else {
      handleNewChat();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    localStorage.removeItem(USER_KEY);
  };

  const handleStartClicked = () => {
    if (user) {
      if (sessions.length > 0) setView('chat');
      else handleNewChat();
    } else {
      setView('auth');
    }
  };

  if (view === 'landing') return <LandingPage onStart={handleStartClicked} />;
  if (view === 'auth') return <Auth onLogin={handleLogin} onBack={() => setView('landing')} />;

  const QUICK_ACTIONS = [
    { id: 'mock-test', label: 'Mock Test', icon: 'fa-vial' },
    { id: 'flowchart', label: 'Flow Chart', icon: 'fa-diagram-project' },
    { id: 'summary', label: 'Summary', icon: 'fa-file-lines' },
    { id: 'problem-solver', label: 'Problem Solver', icon: 'fa-brain' }
  ];

  return (
    <Layout 
      sessions={sessions}
      activeSessionId={activeSessionId}
      user={user}
      onSessionSelect={setActiveSessionId}
      onNewChat={handleNewChat}
      onDeleteSession={deleteSession}
      onReset={clearAllHistory}
      onGoHome={() => setView('landing')}
      onLogout={handleLogout}
    >
      <div className="flex flex-col h-full bg-[#05010d]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
            {(isTyping || isGeneratingImage) && (
              <div className="flex justify-start mb-6">
                <div className="bg-zinc-900 border border-purple-900/30 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-xs text-purple-400 font-medium tracking-tight">
                    {isGeneratingImage ? "Architecting visual aid..." : "Intellexa is analyzing..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 bg-[#0a0118]/80 backdrop-blur-md border-t border-purple-900/20">
          <div className="max-w-4xl mx-auto">
            {/* Quick Actions Bar */}
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id as any)}
                  disabled={isTyping || isGeneratingImage}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/30 border border-purple-800/30 text-purple-300 text-xs font-bold uppercase tracking-wider hover:bg-purple-900/40 hover:border-purple-500/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <i className={`fas ${action.icon}`}></i>
                  {action.label}
                </button>
              ))}
            </div>

            {pendingImage && (
              <div className="relative inline-block mb-3 group animate-in fade-in zoom-in duration-200">
                <img src={pendingImage} alt="preview" className="h-24 w-24 object-cover rounded-xl border-2 border-purple-600/50 shadow-lg" />
                <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 bg-purple-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="relative group">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything or generate a visual..."
                disabled={isTyping || isGeneratingImage}
                className="w-full pl-14 pr-32 py-4 bg-zinc-950/50 border border-purple-900/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-500/50 transition-all text-sm md:text-base text-zinc-100 placeholder-zinc-700 shadow-xl backdrop-blur-sm"
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping || isGeneratingImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-purple-500 hover:text-purple-300 hover:bg-purple-900/30 rounded-lg transition-colors"
                title="Upload Photo or Document"
              >
                <i className="fas fa-paperclip text-lg"></i>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.txt,.docx" />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={handleGenerateVisual}
                  disabled={isTyping || isGeneratingImage || !inputValue.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    !inputValue.trim()
                    ? 'bg-purple-950/20 text-purple-800 opacity-50'
                    : 'bg-purple-900/40 text-purple-100 border border-purple-700/50 hover:bg-purple-800/40 active:scale-95'
                  }`}
                  title="Generate Visual Architect Render"
                >
                  <i className="fas fa-sparkles"></i>
                </button>
                <button 
                  type="submit"
                  disabled={isTyping || isGeneratingImage || (!inputValue.trim() && !pendingImage)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    !inputValue.trim() && !pendingImage
                    ? 'bg-purple-950/20 text-purple-800 opacity-50'
                    : 'bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-lg hover:from-purple-500 hover:to-violet-600 active:scale-95'
                  }`}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
