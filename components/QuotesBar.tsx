
import React, { useState, useEffect } from 'react';

interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  { text: "Intelligence is the ability to adapt to change.", author: "Stephen Hawking" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "I have no special talent. I am only passionately curious.", author: "Albert Einstein" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" }
];

const QuotesBar: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Start the exit animation
      setIsVisible(false);
      
      // 2. Wait for the exit animation (500ms) before swapping data
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % QUOTES.length);
        // 3. Start the entrance animation
        setIsVisible(true);
      }, 600); // 600ms allows for a clean break between quotes
    }, 8000); // Rotates every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-10 z-[100] border-t backdrop-blur-md flex items-center justify-center px-6 transition-colors duration-500 ${
      theme === 'dark' 
      ? 'bg-zinc-950/60 border-purple-500/10 text-zinc-400' 
      : 'bg-white/60 border-purple-100 text-zinc-500 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]'
    }`}>
      <div className={`flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isVisible 
          ? 'opacity-100 translate-y-0 filter blur-0' 
          : 'opacity-0 -translate-y-2 filter blur-sm'
      }`}>
        <i className="fas fa-quote-left text-[10px] text-purple-500/50"></i>
        <p className="text-[11px] font-medium italic tracking-tight truncate max-w-[70vw]">
          "{QUOTES[index].text}"
        </p>
        <span className="w-1 h-1 bg-purple-500/30 rounded-full"></span>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-500/80">
          {QUOTES[index].author}
        </p>
      </div>
    </div>
  );
};

export default QuotesBar;
