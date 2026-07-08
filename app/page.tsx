'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  // ==========================================
  // 1. ALL SYSTEM STATE & REFS (HOOKS)
  // ==========================================
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [neuralCapacity, setNeuralCapacity] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [energy, setEnergy] = useState('Medium');
  const [durationValue, setDurationValue] = useState(15); 
  const [durationUnit, setDurationUnit] = useState('minutes'); 
  
  const [breathingPhase, setBreathingPhase] = useState('');
  const [systemWarning, setSystemWarning] = useState<string | null>(null);

  const [thoughts, setThoughts] = useState<{id: number, text: string}[]>([]);
  const [newThought, setNewThought] = useState('');

  const [activeFrequency, setActiveFrequency] = useState<'off' | 'gamma' | 'alpha' | 'theta' | 'delta'>('off');
  const audioCtxRef = useRef<any>(null);
  const oscillatorsRef = useRef<any[]>([]);
  
  const triggeredAlerts = useRef<Set<string>>(new Set());

  // ==========================================
  // 2. ALL LOGIC AND EFFECTS (HOOKS)
  // ==========================================
  const isRelaxingTask = (taskTitle: string) => {
    const t = taskTitle.toLowerCase();
    return t.includes('sleep') || t.includes('nap') || t.includes('rest') || t.includes('eat') || t.includes('breakfast') || t.includes('lunch') || t.includes('dinner') || t.includes('bed');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // REAL AUTHENTICATION LISTENER
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch real data for the logged-in user
  useEffect(() => { 
    if (session?.user?.id) fetchTasks();
  }, [session?.user?.id]);

  useEffect(() => {
    const activeDrain = tasks.reduce((acc, t) => {
      if (isRelaxingTask(t.title)) return acc;
      return acc + (t.energy_level === 'High' ? 15 : t.energy_level === 'Medium' ? 10 : 5);
    }, 0);
    
    setNeuralCapacity(Math.max(0, Math.min(100, 100 - activeDrain)));
  }, [tasks]);

  const arrangedTasks = useMemo(() => {
    const getTaskWeight = (taskTitle: string, energyLevel: string) => {
      const t = taskTitle.toLowerCase();
      if (t.includes('breakfast') || t.includes('wake') || t.includes('morning')) return 5;
      if (t.includes('run') || t.includes('workout') || t.includes('gym') || t.includes('exercise')) return 10; 
      if (t.includes('code') || t.includes('work') || t.includes('study') || energyLevel === 'High') return 20; 
      if (t.includes('lunch')) return 25;
      if (energyLevel === 'Medium') return 30;
      if (t.includes('dinner') || t.includes('read') || energyLevel === 'Low') return 40;
      if (isRelaxingTask(taskTitle)) return 50;
      return 35;
    };

    return [...tasks].sort((a, b) => getTaskWeight(a.title, a.energy_level) - getTaskWeight(b.title, b.energy_level));
  }, [tasks]);

  const breakfastMeals = ['Oatmeal & High Protein', 'Avocado Toast & Poached Eggs', 'Greek Yogurt & Mixed Berries', 'Scrambled Eggs & Spinach', 'Protein Smoothie Bowl', 'Whole Grain Pancakes & Nuts', 'Cottage Cheese & Peaches'];
  const lunchMeals = ['Lean Protein & Leafy Greens', 'Quinoa Salad & Grilled Chicken', 'Salmon & Asparagus', 'Turkey Wrap & Hummus', 'Lentil Soup & Side Salad', 'Tuna Salad on Whole Wheat', 'Chicken Burrito Bowl (No Rice)'];
  const dinnerMeals = ['Light Carbs & Grilled Veggies', 'Baked Cod & Sweet Potato', 'Stir-fry Tofu & Broccoli', 'Grilled Steak & Zucchini', 'Chicken Breast & Roasted Carrots', 'Shrimp Scampi (Zucchini Noodles)', 'Stuffed Bell Peppers'];
  const workoutMeals = ['Banana, Oats & Electrolytes', 'Apple Slices & Peanut Butter', 'Protein Shake & Almonds', 'Rice Cakes & Turkey', 'Berry Smoothie & Chia Seeds', 'Handful of Mixed Nuts & Dates', 'Greek Yogurt & Honey'];
  const workMeals = ['Walnuts & Dark Chocolate (Omega-3s)', 'Blueberries & Almonds', 'Green Tea & Pumpkin Seeds', 'Hard Boiled Eggs & Celery', 'Edamame & Seaweed Snacks', 'Apple & Cashew Butter', 'Matcha & Macadamia Nuts'];
  const sleepMeals = ['Magnesium Rich Herbal Tea', 'Warm Milk & Nutmeg', 'Chamomile Tea & Tart Cherry', 'Valerian Root Tea', 'Golden Milk (Turmeric)', 'Passionflower Tea', 'Small Banana & Almond Butter'];
  const standardMeals = ['Mixed Fruit Bowl', 'Protein Bar', 'Carrot Sticks & Hummus', 'Handful of Pistachios', 'Cottage Cheese & Pineapple', 'Celery & Peanut Butter', 'Roasted Chickpeas'];

  const getMealOptions = (mealsArray: string[], day: number) => {
    return [
      mealsArray[day % 7],
      mealsArray[(day + 1) % 7],
      mealsArray[(day + 2) % 7]
    ];
  };

  const generateProtocolContext = (taskTitle: string, energyLevel: string, index: number) => {
    const t = taskTitle.toLowerCase();
    const dayIndex = new Date().getDay(); 
    
    let dietOptions = getMealOptions(standardMeals, dayIndex);
    let time = '02:00 PM - 04:00 PM';
    
    if (t.includes('breakfast')) { dietOptions = getMealOptions(breakfastMeals, dayIndex); time = '07:30 AM - 08:30 AM'; }
    else if (t.includes('lunch')) { dietOptions = getMealOptions(lunchMeals, dayIndex); time = '01:00 PM - 02:00 PM'; }
    else if (t.includes('dinner')) { dietOptions = getMealOptions(dinnerMeals, dayIndex); time = '07:00 PM - 08:30 PM'; }
    else if (t.includes('run') || t.includes('workout') || t.includes('gym')) { dietOptions = getMealOptions(workoutMeals, dayIndex); time = '06:30 AM - 08:00 AM'; }
    else if (t.includes('code') || t.includes('work') || t.includes('study')) { dietOptions = getMealOptions(workMeals, dayIndex); time = '09:00 AM - 01:00 PM'; }
    else if (t.includes('sleep') || t.includes('nap') || t.includes('bed')) { dietOptions = getMealOptions(sleepMeals, dayIndex); time = '10:00 PM - 06:00 AM'; }
    else if (t.includes('rest') || t.includes('eat')) { dietOptions = getMealOptions(standardMeals, dayIndex); time = 'Flexible Recovery Window'; }
    else if (index === 0) { time = '08:00 AM - 09:30 AM'; }
    else if (index === 1) { time = '11:00 AM - 01:00 PM'; }
    
    return { dietOptions, time };
  };

  const dynamicCalendar = useMemo(() => {
    if (arrangedTasks.length === 0) return [{ id: 'empty', title: 'System Awaiting Directives', time: '--:--' }];
    return arrangedTasks.map((task, index) => {
      const protocol = generateProtocolContext(task.title, task.energy_level, index);
      const displayTime = task.customTime || protocol.time;
      return { id: task.id, title: task.title, time: displayTime.split('(')[0].trim() };
    });
  }, [arrangedTasks]);

  useEffect(() => {
    if (arrangedTasks.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      arrangedTasks.forEach((task, index) => {
        const protocol = generateProtocolContext(task.title, task.energy_level, index);
        const timeRange = (task.customTime || protocol.time).split('(')[0].trim(); 
        const [startPart, endPart] = timeRange.split('-');

        if (!startPart || !endPart) return;

        const parseTimePart = (part: string) => {
          const clean = part.trim();
          const [timeStr, ampm] = clean.split(' ');
          if (!timeStr || !ampm) return { hours: -1, minutes: -1 };
          let [hours, minutes] = timeStr.split(':').map(Number);
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
          return { hours, minutes };
        };

        const start = parseTimePart(startPart);
        const end = parseTimePart(endPart);

        const startKey = `${task.id}-start`;
        if (currentHour === start.hours && currentMinute === start.minutes && !triggeredAlerts.current.has(startKey)) {
          if (Notification.permission === 'granted') {
            new Notification(`SomaFlow Protocol Initiated`, {
              body: `Time to begin: ${task.title}. Sync alignment optimized for current bodily state.`,
              icon: '/favicon.ico'
            });
            triggeredAlerts.current.add(startKey);
          }
        }

        const endKey = `${task.id}-end`;
        if (currentHour === end.hours && currentMinute === end.minutes && !triggeredAlerts.current.has(endKey)) {
          if (Notification.permission === 'granted') {
            new Notification(`SomaFlow Protocol Completed`, {
              body: `Execution window finished for: ${task.title}. Prepare for transition.`,
              icon: '/favicon.ico'
            });
            triggeredAlerts.current.add(endKey);
          }
        }
      });
    }, 15000); 

    return () => clearInterval(interval);
  }, [arrangedTasks]);

  // ==========================================
  // 3. ACTION FUNCTIONS
  // ==========================================
  async function fetchTasks() {
    try {
      const { data } = await supabase.from('tasks').select('*').eq('user_id', session?.user?.id);
      if (data && data.length > 0) setTasks(data);
    } catch (error) {
      console.warn("Database read error:", error);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    if (energy === 'High' && tasks.length > 0 && tasks[tasks.length - 1].energy_level === 'High') {
       setSystemWarning('Consecutive heavy loads blocked.'); 
       return;
    }

    const newTask = {
      id: Date.now(),
      title,
      energy_level: energy,
      durationValue,
      durationUnit,
      user_id: session.user.id
    };
    setTasks(prev => [...prev, newTask]);

    setTitle(''); setDurationValue(15); setEnergy('Medium'); setSystemWarning(null); setIsModalOpen(false);

    try {
      await supabase.from('tasks').insert([{ title, energy_level: energy, user_id: session.user.id }]);
    } catch (error) {
      console.warn("Database insert error:", error);
    }
  }

  async function deleteTask(id: number) {
    const taskToComplete = tasks.find(t => t.id === id);
    if (!taskToComplete) return;
    
    if (isRelaxingTask(taskToComplete.title)) {
      const recoveryBonus = taskToComplete.energy_level === 'High' ? 25 : taskToComplete.energy_level === 'Medium' ? 15 : 10;
      setNeuralCapacity(prev => Math.min(100, prev + recoveryBonus));
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (error) {
      console.warn("Database delete error:", error);
    }
  }

  const updateTaskCustomField = (id: number, field: string, value: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addThought = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThought.trim()) return;
    setThoughts(prev => [{ id: Date.now(), text: newThought }, ...prev]);
    setNewThought('');
  };

  const deleteThought = (id: number) => {
    setThoughts(prev => prev.filter(t => t.id !== id));
  };

  const stopFrequencies = () => {
    oscillatorsRef.current.forEach(o => { try { o.stop(); } catch(e){} });
    oscillatorsRef.current = [];
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setActiveFrequency('off');
  };

  const toggleFrequency = (type: 'gamma' | 'alpha' | 'theta' | 'delta') => {
    if (activeFrequency === type) { stopFrequencies(); return; }
    stopFrequencies();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.05;
    masterGain.connect(ctx.destination);
    
    let offset = 10; 
    if (type === 'gamma') offset = 40; 
    if (type === 'theta') offset = 6;  
    if (type === 'delta') offset = 2;  

    const oscLeft = ctx.createOscillator(); const oscRight = ctx.createOscillator();
    const pannerLeft = ctx.createStereoPanner(); const pannerRight = ctx.createStereoPanner();
    
    oscLeft.frequency.value = 432; 
    oscRight.frequency.value = 432 + offset;
    pannerLeft.pan.value = -1; 
    pannerRight.pan.value = 1;
    
    oscLeft.connect(pannerLeft).connect(masterGain); oscRight.connect(pannerRight).connect(masterGain);
    oscLeft.start(); oscRight.start();
    
    oscillatorsRef.current = [oscLeft, oscRight];
    setActiveFrequency(type);
  };

  const startBreathing = () => {
    if (breathingPhase !== '') return;
    setBreathingPhase('Inhale...');
    setTimeout(() => setBreathingPhase('Hold...'), 4000);
    setTimeout(() => setBreathingPhase('Exhale...'), 8000);
    setTimeout(() => { setBreathingPhase(''); setNeuralCapacity(prev => Math.min(100, prev + 15)); }, 16000);
  };

  const statusColor = neuralCapacity > 60 ? '#10b981' : neuralCapacity > 30 ? '#f59e0b' : '#ef4444';

  // ==========================================
  // 4. THE SECURITY BOUNCER
  // ==========================================
  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-900 text-emerald-400 flex items-center justify-center font-mono text-sm">INITIALIZING SOMAFLOW...</div>;
  }

  if (!session) {
    // Add this helper function inside the Home component or here
    const signInWithGoogle = async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
    };

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-black text-emerald-400 mb-2">ACCESS DENIED</h1>
        <p className="text-slate-400 text-sm mb-8 text-center">You must authenticate via your secure login portal to view the protocol.</p>
        
        {/* THIS IS YOUR NEW LOGIN PORTAL BUTTON */}
        <button 
          onClick={signInWithGoogle}
          className="bg-white text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // ==========================================
  // 5. THE VISUAL LAYOUT
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 opacity-15 bg-[linear-gradient(rgba(52,211,153,0.3)_2px,transparent_2px),linear-gradient(90deg,rgba(52,211,153,0.3)_2px,transparent_2px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-emerald-500/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0"></div>

      <nav className="border-b border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-emerald-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-auto py-3 sm:h-20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-900 shadow-lg shadow-emerald-500/30 text-xs sm:text-base">SF</div>
               <h1 className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">SomaFlow</h1>
             </div>
          </div>
          
          <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
             <div className="flex gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl border border-emerald-500/20 bg-slate-800/80 shadow-inner overflow-x-auto w-full sm:w-auto">
                <button onClick={() => toggleFrequency('theta')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'theta' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Theta (Calm)</button>
                <button onClick={() => toggleFrequency('delta')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'delta' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Delta (Sleep)</button>
                <button onClick={() => toggleFrequency('alpha')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'alpha' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Alpha (Flow)</button>
                <button onClick={() => toggleFrequency('gamma')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'gamma' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Gamma (Focus)</button>
             </div>
             <span className="text-[8px] sm:text-[9px] text-emerald-400/80 font-mono tracking-wider pr-1">🎧 REQUIRES HEADPHONES FOR BINAURAL SYNC</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
        <section className="col-span-1 space-y-6">
          <div className="bg-slate-800/80 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-md">
            <h2 className="text-[10px] text-emerald-400 mb-6 sm:mb-10 uppercase tracking-widest font-bold">System State</h2>
            <div 
              onClick={startBreathing} 
              className={`relative w-48 h-48 sm:w-56 sm:h-56 mx-auto cursor-pointer transition-all duration-1000 ease-in-out ${breathingPhase === 'Inhale...' ? 'scale-110' : breathingPhase === 'Exhale...' ? 'scale-95' : 'scale-100'}`}
            >
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke={statusColor} strokeDasharray={289} strokeDashoffset={289 - (neuralCapacity / 100) * 289} strokeWidth="3" className="transition-all duration-1000 ease-out" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-black text-4xl sm:text-5xl tracking-tighter">{neuralCapacity}%</span>
                {breathingPhase && <span className="text-emerald-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest animate-pulse mt-2 sm:mt-3">{breathingPhase}</span>}
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-6 sm:mt-8">Tap ring to initiate neural reset breathwork.</p>
          </div>

          <div className="bg-slate-800/80 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
            <h2 className="text-[10px] text-emerald-400 mb-4 uppercase tracking-widest font-bold">Neural Dump</h2>
            <form onSubmit={addThought} className="mb-4 flex gap-2">
              <input 
                value={newThought} 
                onChange={(e) => setNewThought(e.target.value)} 
                placeholder="Log a thought or idea..." 
                className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-700 focus:border-emerald-500 outline-none transition-colors text-slate-100 text-xs"
              />
              <button type="submit" className="bg-emerald-500 text-slate-950 px-4 rounded-xl text-xs font-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">+</button>
            </form>
            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
              {thoughts.length === 0 && <div className="text-slate-500 text-[10px] text-center py-4 border border-dashed border-slate-700 rounded-xl">No active thoughts logged.</div>}
              {thoughts.map(thought => (
                <div key={thought.id} className="bg-slate-900/60 border border-emerald-500/10 p-3 rounded-xl flex justify-between items-start group hover:bg-slate-700/50 transition-colors">
                  <p className="text-xs text-slate-300 pr-2">{thought.text}</p>
                  <button onClick={() => deleteThought(thought.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-slate-800/80 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl shadow-black/30">
            <h2 className="text-[10px] text-emerald-400 uppercase tracking-widest mb-4 font-bold">Bio-Optimized Sync Timeline</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
              {dynamicCalendar.map(ev => (
                <div key={ev.id} className="min-w-[160px] sm:min-w-[200px] p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/10 border-l-4 border-l-cyan-500 shrink-0 shadow-md snap-center">
                  <div className="text-[9px] sm:text-[10px] text-cyan-400 mb-1 font-mono font-bold">{ev.time}</div>
                  <div className="font-bold text-xs sm:text-sm text-slate-200 truncate">{ev.title}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/80 border border-emerald-500/20 rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-xl shadow-black/30">
             <div className="flex justify-between items-center mb-6 sm:mb-8 pb-4 border-b border-emerald-500/20">
               <h2 className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Action Queue</h2>
               <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-slate-950 px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">+ Add Task</button>
             </div>
             
             {systemWarning && (
               <div className="mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[10px] sm:text-xs font-bold text-center">
                 {systemWarning}
               </div>
             )}

             <div className="space-y-3 sm:space-y-4">
                {arrangedTasks.length === 0 && (
                  <div className="text-slate-500 text-xs sm:text-sm text-center py-8 sm:py-10 border border-dashed border-slate-600 rounded-2xl">
                    Queue is empty. Awaiting directives.
                  </div>
                )}
                
                {arrangedTasks.map((task, index) => {
                  const rec = generateProtocolContext(task.title, task.energy_level, index);
                  const isRest = isRelaxingTask(task.title);
                  const borderColor = isRest ? 'border-purple-500/40' : task.energy_level === 'High' ? 'border-red-500/40' : task.energy_level === 'Medium' ? 'border-yellow-500/40' : 'border-emerald-500/40';
                  
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => deleteTask(task.id)} 
                      className={`p-4 sm:p-5 rounded-2xl bg-slate-900/80 border ${borderColor} cursor-pointer hover:bg-slate-700/80 hover:scale-[1.01] transition-all duration-200 group shadow-md`}
                    >
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 truncate">
                          <h3 className="font-bold text-sm sm:text-lg text-slate-100 group-hover:text-emerald-400 transition-colors truncate">{task.title}</h3>
                          {isRest && <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md font-mono text-[8px] tracking-wider uppercase shrink-0">⚡ Restorative</span>}
                        </div>
                        <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Complete Task</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 bg-slate-950/50 p-3 sm:p-4 rounded-xl text-[10px] sm:text-xs border border-white/5">
                        
                        <div>
                          <strong className="text-emerald-400 block mb-1">Optimal Nutrition Options</strong>
                          <select 
                            value={task.customNutrition || rec.dietOptions[0]} 
                            onChange={(e) => updateTaskCustomField(task.id, 'customNutrition', e.target.value)}
                            onClick={(e) => e.stopPropagation()} 
                            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-md p-1.5 outline-none text-slate-300 text-[10px] focus:border-emerald-500/50 transition-colors cursor-pointer"
                          >
                            {rec.dietOptions.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <strong className="text-cyan-400 block mb-1">Execution Window</strong>
                          <input 
                            type="text" 
                            value={task.customTime || rec.time}
                            onChange={(e) => updateTaskCustomField(task.id, 'customTime', e.target.value)}
                            onClick={(e) => e.stopPropagation()} 
                            placeholder="e.g. 02:00 PM - 04:00 PM"
                            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-md p-1.5 outline-none text-slate-300 text-[10px] focus:border-cyan-500/50 transition-colors"
                          />
                        </div>

                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]">
          <form onSubmit={addTask} className="bg-slate-800 p-6 sm:p-8 rounded-3xl w-full max-w-sm sm:max-w-md border border-emerald-500/30 shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto">
             <h2 className="text-lg sm:text-xl font-bold mb-5 sm:mb-6 text-emerald-400">Initialize New Task</h2>
             
             <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-slate-700 focus:border-emerald-500 outline-none transition-colors text-slate-100 text-sm" placeholder="Task Designation (e.g. Sleep, Lunch, Code)..." required />
             
             <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                <input type="number" min="1" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} className="w-1/2 bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-700 focus:border-emerald-500 outline-none text-slate-100 text-sm" required />
                <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="w-1/2 bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-700 outline-none text-slate-100 cursor-pointer text-sm">
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
             </div>

             <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="w-full bg-slate-900 p-3 sm:p-4 rounded-xl mb-6 sm:mb-8 border border-slate-700 outline-none text-slate-100 cursor-pointer text-sm">
                <option value="Low">Low Energy (Routine)</option>
                <option value="Medium">Medium Energy (Standard)</option>
                <option value="High">High Energy (Deep Work)</option>
             </select>
             
             <div className="flex gap-3 sm:gap-4">
               <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 bg-slate-700 py-3 sm:py-4 rounded-xl font-bold text-slate-300 hover:bg-slate-600 transition-colors text-sm">Abort</button>
               <button type="submit" className="w-1/2 bg-emerald-500 py-3 sm:py-4 rounded-xl font-black text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 text-sm">Execute</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}