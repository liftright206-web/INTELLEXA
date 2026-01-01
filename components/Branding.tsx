
import React from 'react';

export const IntellexaIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
    </defs>
    {/* Stylized Node-X Logo */}
    <circle cx="50" cy="50" r="8" stroke="url(#logoGradient)" strokeWidth="4" />
    
    <line x1="20" y1="20" x2="42" y2="42" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <line x1="80" y1="20" x2="58" y2="42" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <line x1="20" y1="80" x2="42" y2="58" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <line x1="80" y1="80" x2="58" y2="58" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    
    <circle cx="20" cy="20" r="6" fill="url(#logoGradient)" />
    <circle cx="80" cy="20" r="6" fill="url(#logoGradient)" />
    <circle cx="20" cy="80" r="6" fill="url(#logoGradient)" />
    <circle cx="80" cy="80" r="6" fill="url(#logoGradient)" />
    <circle cx="41" cy="49" r="5" fill="url(#logoGradient)" />
    <circle cx="59" cy="49" r="5" fill="url(#logoGradient)" />
  </svg>
);

export const IntellexaWordmark: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    <span className="text-2xl font-bold tracking-tight text-white">intelle</span>
    <IntellexaIcon className="w-6 h-6 mt-1" />
    <span className="text-2xl font-bold tracking-tight text-white">a</span>
  </div>
);