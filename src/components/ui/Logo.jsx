import React from 'react';

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#52525b" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      
      {/* Subtle outer audio ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#silverGradient)" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
      
      {/* Stylized 'C' for Cadenza */}
      <path 
        d="M 68 28 A 28 28 0 1 0 68 72" 
        stroke="url(#silverGradient)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        filter="url(#glow)"
      />
      
      {/* Soundwaves nested in the curve */}
      <rect x="42" y="38" width="5" height="24" rx="2.5" fill="url(#silverGradient)" filter="url(#glow)" />
      <rect x="52" y="26" width="5" height="48" rx="2.5" fill="url(#silverGradient)" filter="url(#glow)" />
      <rect x="62" y="42" width="5" height="16" rx="2.5" fill="url(#silverGradient)" filter="url(#glow)" />
    </svg>
  );
}
