
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
  { text: "I have no special talent. I am only passionately curious.", author: "Albert Einstein" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Change is the end result of all true learning.", author: "Leo Buscaglia" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" }
];

const QuotesBar: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % QUOTES.length);
        setIsVisible(true);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-9 z-[100] border-t backdrop-blur-md flex items-center justify-center px-6 transition-colors duration-500 bg-black/60 border-white/5 text-zinc-500">
      <div className={`flex items-center gap-3 transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      }`}>
        <p className="text-[10px] font-bold italic truncate max-w-[75vw]">
          "{QUOTES[index].text}"
        </p>
        <span className="w-1 h-1 bg-purple-500/50 rounded-full"></span>
        <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">
          {QUOTES[index].author}
        </p>
      </div>
    </div>
  );
};

export default QuotesBar;
