import React from 'react';

export default function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* SVG Icon */}
      <svg
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        <defs>
          {/* Teal to Gold Gradient */}
          <linearGradient id="somaFlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d6e6e" />   {/* Deep Teal */}
            <stop offset="50%" stopColor="#1ea39b" />  {/* Vibrant Teal */}
            <stop offset="100%" stopColor="#dca842" /> {/* Sunrise Gold */}
          </linearGradient>
        </defs>

        {/* Left Side: The Data/Task Bar Charts */}
        <rect x="15" y="50" width="14" height="30" rx="7" fill="url(#somaFlowGrad)" />
        <rect x="35" y="35" width="14" height="45" rx="7" fill="url(#somaFlowGrad)" />
        <rect x="55" y="20" width="14" height="60" rx="7" fill="url(#somaFlowGrad)" />

        {/* Right Side: The Flowing Energy 'S' / Infinity Curve */}
        <path
          d="M 15 85 
             C 45 85, 65 70, 80 50 
             C 95 30, 115 15, 140 15 
             C 170 15, 190 35, 190 55 
             C 190 75, 170 90, 145 90
             C 120 90, 100 70, 90 50
             C 80 30, 100 15, 125 15"
          stroke="url(#somaFlowGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* SOMAFLOW Typography */}
      <div className="flex flex-col justify-center mt-1">
        <div className="flex font-bold tracking-wider text-2xl font-sans leading-none">
          <span style={{ color: '#0d6e6e' }}>SOMA</span>
          <span style={{ color: '#dca842' }}>FLOW</span>
        </div>
      </div>
    </div>
  );
}