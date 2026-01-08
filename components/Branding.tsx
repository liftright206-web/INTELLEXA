
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
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>
    
    {/* Stylized 'x' as a node constellation in purple */}
    <g stroke="url(#logoGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer connections */}
      <path d="M25 25 L75 75" />
      <path d="M75 25 L25 75" />
      <path d="M25 25 L75 25 L75 75 L25 75 Z" opacity="0.3" strokeWidth="2" />
      
      {/* Nodes */}
      <circle cx="25" cy="25" r="5" fill="white" strokeWidth="3" />
      <circle cx="75" cy="25" r="5" fill="white" strokeWidth="3" />
      <circle cx="25" cy="75" r="5" fill="white" strokeWidth="3" />
      <circle cx="75" cy="75" r="5" fill="white" strokeWidth="3" />
      
      {/* Center Node */}
      <circle cx="50" cy="50" r="8" fill="url(#logoGradient)" stroke="white" strokeWidth="2">
        <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  </svg>
);

export const IntellexaWordmark: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <div className={`flex items-center gap-0 ${className}`}>
    <span className="text-3xl font-bold tracking-tight text-white lowercase" style={{ fontFamily: 'Inter, sans-serif' }}>intelle</span>
    <IntellexaIcon className="w-8 h-8 mx-[-2px] mb-[-4px]" />
    <span className="text-3xl font-bold tracking-tight text-white lowercase" style={{ fontFamily: 'Inter, sans-serif' }}>a</span>
  </div>
);
