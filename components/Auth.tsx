
import React, { useState } from 'react';
import { IntellexaWordmark } from './Branding';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack, theme, onToggleTheme }) => {
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
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden text-inherit`}>
      {/* Background Decor */}
      <div className={`absolute top-0 left-0 w-full h-full ${theme === 'dark' ? 'opacity-10' : 'opacity-[0.05]'} pointer-events-none`} 
           style={{ backgroundImage: 'radial-gradient(#7c3aed 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-between items-center mb-10">
          <button onClick={onBack} className="text-purple-500 hover:text-purple-700 transition-colors">
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <IntellexaWordmark className="h-10" />
          <div className="w-10"></div> {/* Placeholder to keep alignment */}
        </div>

        <div className={`glass-card rounded-[32px] p-10 shadow-2xl`}>
          <h2 className={`text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className={`${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'} text-sm mb-10 font-medium`}>
            {isLogin ? 'Access your architectural workspace.' : 'Start your journey with Intellexa.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-3 ml-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Leonardo Da Vinci"
                  className={`w-full px-6 py-4 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-purple-50/50 border-purple-100 text-zinc-900'} border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium`}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="leo@architect.edu"
                className={`w-full px-6 py-4 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-purple-50/50 border-purple-100 text-zinc-900'} border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className={`w-full px-6 py-4 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-purple-50/50 border-purple-100 text-zinc-900'} border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium`}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-800 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest mt-4"
            >
              {isLogin ? 'SIGN IN NOW' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-purple-500/10 flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-purple-500 hover:text-purple-600 transition-colors"
            >
              {isLogin ? "New here? Create Workspace" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
