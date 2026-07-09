"use client";

import { useState, useEffect } from 'react';

export default function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if the user has completed the guide before
    const hasSeenGuide = localStorage.getItem('somaflow_guide_complete');
    if (!hasSeenGuide) {
      setIsOpen(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('somaflow_guide_complete', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const guideSteps = [
    {
      title: "Welcome to SomaFlow 🌊",
      description: "Stop fighting against your own schedule. SomaFlow is designed to help you work *with* your natural energy levels."
    },
    {
      title: "1. The System State",
      description: "Tap the main ring to log your current energy (Low, Medium, or High). Do this first thing in the morning to track your daily rhythm."
    },
    {
      title: "2. Your Action Queue",
      description: "Don't just make a messy list. Add your tasks here, and match them to your energy. Do hard things when energy is High, and easy things when it's Low."
    },
    {
      title: "3. Protocol Library",
      description: "Create repeatable 'playbooks' for your day (like a 'Morning Routine' or 'Deep Work Sprint'). Use these to get into flow without overthinking."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0B1120] border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        
        {/* Step Indicators (Little dots at the top) */}
        <div className="flex justify-center gap-2 mb-6">
          {guideSteps.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all duration-300 ${index === step ? 'w-6 bg-[#1ea39b]' : 'w-2 bg-zinc-700'}`}
            />
          ))}
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-white mb-3">
          {guideSteps[step].title}
        </h2>
        <p className="text-zinc-400 leading-relaxed mb-8 min-h-[80px]">
          {guideSteps[step].description}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button 
            onClick={completeOnboarding}
            className="text-zinc-500 hover:text-white transition-colors text-sm font-medium"
          >
            Skip Guide
          </button>
          
          <button 
            onClick={() => {
              if (step < guideSteps.length - 1) {
                setStep(step + 1);
              } else {
                completeOnboarding();
              }
            }}
            className="bg-gradient-to-r from-[#0d6e6e] to-[#1ea39b] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {step === guideSteps.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}