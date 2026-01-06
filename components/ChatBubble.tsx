import React from 'react';
import { Message } from '../types';
import MermaidDiagram from './MermaidDiagram';
import { IntellexaIcon } from './Branding';

interface ChatBubbleProps {
  message: Message;
  theme: 'dark' | 'light';
  onRefine?: (image: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, theme, onRefine }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string) => {
    const parts = content.split(/```mermaid([\s\S]*?)```/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <MermaidDiagram key={index} chart={part.trim()} />;
      }
      return <div key={index} className="whitespace-pre-wrap">{part}</div>;
    });
  };

  const isArchitected = !isUser && message.content.includes("visual architected");

  return (
    <div className={`flex w-full mb-10 ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-5`}>
        {/* Avatar Area */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg relative group ${
            isUser 
            ? theme === 'dark' ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700' : 'bg-white border border-purple-200'
            : theme === 'dark' ? 'bg-zinc-950 border border-purple-500/30 shadow-purple-500/20' : 'bg-purple-600 border border-purple-500 shadow-purple-200'
          }`}>
            {isUser ? (
              <i className={`fas fa-user ${theme === 'dark' ? 'text-zinc-400' : 'text-purple-600'} text-sm`}></i>
            ) : (
              <div className="p-1.5 relative z-10">
                <IntellexaIcon className="w-full h-full" />
              </div>
            )}
          </div>
        </div>

        {/* Bubble Area */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-6 py-5 rounded-[28px] text-[15px] md:text-base leading-relaxed font-medium transition-all ${
            isUser 
            ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-950 text-white rounded-tr-none border border-purple-400/20' 
            : `glass-card ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'} rounded-tl-none border-purple-500/10 shadow-md`
          }`}>
            {message.isThinking && !message.content && (
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <i className="fas fa-brain animate-pulse"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Architecting complex thought...</span>
              </div>
            )}
            <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none`}>
              {renderContent(message.content)}
            </div>
            
            {message.groundingLinks && message.groundingLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-500/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">Sources from Google Search:</p>
                <div className="flex flex-wrap gap-2">
                  {message.groundingLinks.map((link, idx) => (
                    <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100'}`}>
                      <i className="fas fa-external-link-alt mr-2"></i>
                      {link.title || 'Source'}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4">
                {message.attachments.map((img, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-[20px] border border-purple-500/20 shadow-xl">
                    <img src={img} alt="attachment" className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                      <button onClick={() => onRefine?.(img)} className="bg-purple-600 text-white h-10 px-5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 shadow-xl"><i className="fas fa-wand-magic-sparkles mr-2"></i> Edit / Refine</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className={`text-[9px] ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} mt-2.5 font-black uppercase tracking-[0.2em] px-2`}>
            {isUser ? 'Client' : 'Intelligence'} &bull; {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;