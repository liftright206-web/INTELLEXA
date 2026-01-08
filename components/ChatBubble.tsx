
import React from 'react';
import { Message } from '../types';
import MermaidDiagram from './MermaidDiagram';
import { IntellexaIcon } from './Branding';

interface ChatBubbleProps {
  message: Message;
  onRefine?: (image: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onRefine }) => {
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

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-500`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        <div className="flex-shrink-0 mt-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
            isUser 
            ? 'bg-zinc-800 border-zinc-700' 
            : 'bg-gradient-to-br from-purple-600 to-indigo-800 border-purple-500 shadow-lg shadow-purple-500/20'
          }`}>
            {isUser ? <i className="fas fa-user text-zinc-400"></i> : <IntellexaIcon className="w-6 h-6" />}
          </div>
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-6 py-4 rounded-[24px] text-[15px] leading-relaxed transition-all ${
            isUser 
            ? 'bg-zinc-900 border border-white/5 text-zinc-100 rounded-tr-none'
            : 'glass-card text-white rounded-tl-none border-purple-500/20'
          }`}>
            {message.isThinking && !message.content && (
              <div className="flex items-center gap-3 mb-3 text-purple-400">
                <i className="fas fa-microchip animate-pulse"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synthesizing Architecture...</span>
              </div>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {message.attachments.map((img, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-xl border border-white/10 shadow-lg">
                    <img src={img} className="max-w-full max-h-[300px] object-cover transition-transform group-hover:scale-105" />
                    {!isUser && onRefine && (
                      <button 
                        onClick={() => onRefine(img)}
                        className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Refine
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              {renderContent(message.content)}
            </div>
            
            {message.groundingLinks && message.groundingLinks.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-3">Verification Nodes:</p>
                <div className="flex flex-wrap gap-2">
                  {message.groundingLinks.map((link, idx) => (
                    <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/5 bg-zinc-900/50 hover:border-purple-500/50 transition-all flex items-center gap-2">
                      <i className="fas fa-link opacity-50 text-purple-400"></i>
                      {link.title || 'Source'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2 px-1">
            {isUser ? 'Operator' : 'Architect'} &bull; {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
