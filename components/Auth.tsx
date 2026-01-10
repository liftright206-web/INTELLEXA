import React, { useState } from 'react';
import { IntellexaWordmark } from './Branding';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const ANIMAL_AVATARS = [
  { id: 'cat', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXAzY2g0YjJ6YnV4bmYxbWp6bm5icnl6bm5icnl6bm5icnl6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9iZCZjdD1n/3o7TKMGpxP5e7H1V28/giphy.gif', label: 'Curious Cat' },
  { id: 'fox', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXAzY2g0YjJ6YnV4bmYxbWp6bm5icnl6bm5icnl6bm5icnl6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9iZCZjdD1n/Xp2Mof48y0hEY/giphy.gif', label: 'Wise Fox' },
  { id: 'penguin', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXAzY2g0YjJ6YnV4bmYxbWp6bm5icnl6bm5icnl6bm5icnl6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9iZCZjdD1n/S96pAd5B72K30XGjWp/giphy.gif', label: 'Logic Penguin' },
  { id: 'bear', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaGlncTNidXk4M3l6bzRrdndpNmZ1Yzhobm9nbDZyMHFjM3NnNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lp88yR0T58f6XQnBvP/giphy.gif', label: 'Study Bear' },
  { id: 'owl', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXAzY2g0YjJ6YnV4bmYxbWp6bm5icnl6bm5icnl6bm5icnl6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9iZCZjdD1n/4Hx5nJBfi8FDa/giphy.gif', label: 'Sage Owl' },
  { id: 'koala', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXAzY2g0YjJ6YnV4bmYxbWp6bm5icnl6bm5icnl6bm5icnl6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9iZCZjdD1n/589ZpInhG4m9G/giphy.gif', label: 'Koala Mentor' }
];

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(ANIMAL_AVATARS[0]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name: formData.name || 'Student Architect',
      email: formData.email,
      avatar: selectedAvatar.url
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#05010d]">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <IntellexaWordmark className="mx-auto scale-125" />
        </div>

        <div className="glass-card p-8 md:p-10 rounded-[32px] border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600"></div>
          
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Profile'}
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">
            {isLogin ? 'Enter credentials to continue' : 'Join the elite architect network'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-[9px] font-black text-purple-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-purple-500 uppercase tracking-widest mb-3">Choose Your Animal Avatar</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ANIMAL_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          selectedAvatar.id === avatar.id 
                            ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                            : 'border-white/5 grayscale hover:grayscale-0'
                        }`}
                        title={avatar.label}
                      >
                        <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                        {selectedAvatar.id === avatar.id && (
                          <div className="absolute inset-0 bg-purple-600/10 pointer-events-none"></div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-widest">
                    Selected: {selectedAvatar.label}
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-[9px] font-black text-purple-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium"
                placeholder="architect@intellexa.ai"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-purple-500 uppercase tracking-widest mb-2">Security Key</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-purple-500 active:scale-[0.98] mt-4"
            >
              {isLogin ? 'LOG IN' : 'FINALIZE PROFILE'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-purple-400 transition-colors"
            >
              {isLogin ? "DON'T HAVE A PROFILE? CREATE ONE" : "ALREADY HAVE A PROFILE? SIGN IN"}
            </button>
          </div>
        </div>

        <button
          onClick={onBack}
          className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Command Center
        </button>
      </div>
    </div>
  );
};

export default Auth;