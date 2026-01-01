
import React, { useState } from 'react';
import { IntellexaWordmark } from './Branding';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name: formData.name || formData.email.split('@')[0],
      email: formData.email,
      avatar: `https://picsum.photos/100/100?random=${Math.random()}`
    });
  };

  return (
    <div className="min-h-screen bg-[#05010d] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#7c3aed 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-10">
          <IntellexaWordmark className="h-10" />
        </div>

        <div className="bg-zinc-950 border border-purple-900/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(88,28,135,0.2)] backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            {isLogin ? 'Access your architectural workspace.' : 'Start your journey with Intellexa.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Leonardo Da Vinci"
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600 text-zinc-200 placeholder-zinc-700 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="leo@architect.edu"
                className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600 text-zinc-200 placeholder-zinc-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600 text-zinc-200 placeholder-zinc-700 transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-700 text-white font-bold rounded-xl hover:from-purple-500 hover:to-violet-600 transition-all transform active:scale-[0.98] mt-4 shadow-lg shadow-purple-900/20"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-900 flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            <button 
              onClick={onBack}
              className="text-xs text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;