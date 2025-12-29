
import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBubble from './components/ChatBubble';
import { GradeLevel, Subject, Message, ChatSession } from './types';
import { getStreamingTutorResponse } from './services/geminiService';

const STORAGE_KEY = 'intellexa_history_v1';

const App: React.FC = () => {
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
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Handle auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSessionId, sessions, isTyping]);

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
        content: "Hi there! I'm Intellexa, your study buddy. 🎓\n\nI'm ready to help you explore any concept, solve complex problems, or visualize ideas through flowcharts. There are no limits to what we can learn together.\n\nWhat are we exploring today?",
        timestamp: new Date()
      }],
      createdAt: new Date(),
      grade: GradeLevel.HighSchool,
      subject: Subject.General
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSessionId) return;
    if (!inputValue.trim() && !pendingImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      attachments: pendingImage ? [pendingImage] : []
    };

    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        const newTitle = s.messages.length <= 1 ? (inputValue.substring(0, 30) || "Visual Learning") : s.title;
        return { 
          ...s, 
          title: newTitle,
          messages: [...s.messages, userMessage] 
        };
      }
      return s;
    });
    setSessions(updatedSessions);

    setInputValue('');
    const currentPendingImage = pendingImage;
    setPendingImage(null);
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
        currentPendingImage || undefined
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
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map(msg => 
              msg.id === assistantMsgId ? { ...msg, content: "Oops! I hit a snag. Check your internet or API key and try asking again. 😅" } : msg
            )
          };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
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
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Delete ALL your study history? This cannot be undone.")) {
      setSessions([]);
      setActiveSessionId('');
      localStorage.removeItem(STORAGE_KEY);
      handleNewChat();
    }
  };

  const deleteSession = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered.length > 0 ? filtered[0].id : '');
    }
  };

  return (
    <Layout 
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSessionSelect={setActiveSessionId}
      onNewChat={handleNewChat}
      onDeleteSession={deleteSession}
      onReset={clearAllHistory}
    >
      <div className="flex flex-col h-full bg-black">
        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar"
        >
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <div className="flex justify-start mb-6">
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium tracking-tight">Intellexa is analyzing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-950/30 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto no-scrollbar py-2">
            <button 
              onClick={() => { setInputValue("Can you turn the above concept into a visual flowchart?"); }}
              className="whitespace-nowrap px-4 py-2 bg-zinc-100/5 border border-zinc-700/50 rounded-full text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all shadow-sm"
            >
              📊 Create Flowchart
            </button>
            <button 
              onClick={() => { setInputValue("Explain this in simple terms with a real-life analogy."); }}
              className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-sm"
            >
              💡 Simple Analogy
            </button>
            <button 
              onClick={() => { setInputValue("Give me a quick 3-question quiz to test my understanding."); }}
              className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-sm"
            >
              📝 Quick Quiz
            </button>
            <button 
              onClick={() => { setInputValue("Summarize the key points of this topic in a table."); }}
              className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-sm"
            >
              📋 Key Summary
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-zinc-950 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto">
            {pendingImage && (
              <div className="relative inline-block mb-3 group animate-in fade-in zoom-in duration-200">
                <img src={pendingImage} alt="preview" className="h-24 w-24 object-cover rounded-xl border-2 border-zinc-700 shadow-lg" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 bg-zinc-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="relative group">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything or upload notes..."
                disabled={isTyping}
                className="w-full pl-14 pr-28 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all text-sm md:text-base text-zinc-100 placeholder-zinc-600 shadow-lg"
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Upload Photo or Document"
              >
                <i className="fas fa-paperclip text-lg"></i>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,.pdf,.txt,.docx"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  type="submit"
                  disabled={isTyping || (!inputValue.trim() && !pendingImage)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    !inputValue.trim() && !pendingImage
                    ? 'bg-zinc-800 text-zinc-600 opacity-50'
                    : 'bg-zinc-100 text-black shadow-lg hover:bg-white active:scale-95'
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