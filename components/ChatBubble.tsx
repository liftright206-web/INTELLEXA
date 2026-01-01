
import React from 'react';
import { Message } from '../types';
import MermaidDiagram from './MermaidDiagram';
import { IntellexaIcon } from './Branding';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
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

  const isArchitected = !isUser && message.content.includes("architected a visual aid");

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg mt-1 overflow-hidden transition-transform hover:scale-105 ${
          isUser ? 'bg-purple-950/50 text-purple-100 border border-purple-600/30' : 'bg-zinc-900 border border-zinc-800 shadow-zinc-900/10'
        }`}>
          {isUser ? (
            <i className="fas fa-user text-xs"></i>
          ) : (
            <div className="p-1">
              <IntellexaIcon className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-md text-[15px] leading-relaxed transition-all ${
            isUser 
            ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-tr-none shadow-purple-950/40' 
            : 'bg-zinc-950/80 border border-purple-900/20 text-zinc-200 rounded-tl-none backdrop-blur-sm'
          }`}>
            {renderContent(message.content)}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-3">
                {message.attachments.map((img, idx) => (
                  <div key={idx} className="relative group">
                    {isArchitected && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-purple-950/80 backdrop-blur-md rounded-md text-[9px] font-bold text-purple-100 uppercase tracking-widest border border-purple-700/50 shadow-xl pointer-events-none">
                        <i className="fas fa-cube mr-1 text-purple-400"></i>
                        Architect Render
                      </div>
                    )}
                    <img 
                      src={img} 
                      alt="attachment" 
                      className="rounded-lg max-h-80 w-auto object-contain border border-purple-800/20 shadow-lg group-hover:border-purple-500 transition-colors" 
                    />
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = img;
                        link.download = `intellexa-render-${Date.now()}.png`;
                        link.click();
                      }}
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-purple-950/60 backdrop-blur-md text-white p-2 rounded-lg text-xs hover:bg-purple-950/80 transition-all border border-purple-700/50"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="text-[10px] text-purple-900 mt-1.5 font-bold uppercase tracking-wider opacity-70">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;