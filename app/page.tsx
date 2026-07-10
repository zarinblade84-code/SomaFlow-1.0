'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

// ==========================================
// PREMIUM NUTRITION DATABASE
// ==========================================
const premiumMeals = [
  { name: 'Michelin-Style Miso Black Cod', type: 'Michelin', country: 'Japan', perfectFor: 'cognitive', macros: 'High Omega-3, Mod Protein', recipe: 'Ingredients: Black cod, white miso, mirin, sake. \n1. Marinate cod in miso-mirin glaze for 24h.\n2. Broil on high for 8-10 mins until caramelized.\n3. Serve with steamed bok choy.' },
  { name: 'Walnut & Pomegranate Fesenjan', type: 'Global', country: 'Iran', perfectFor: 'cognitive', macros: 'High Brain-Fats, Low GI', recipe: 'Ingredients: Chicken, walnuts, pomegranate molasses. \n1. Toast and grind walnuts.\n2. Simmer chicken in walnut and pomegranate sauce for 2 hours.\n3. Serve with saffron cauliflower rice.' },
  { name: 'Matcha & Macadamia Chia Pudding', type: 'Balanced', country: 'Global', perfectFor: 'cognitive', macros: 'High Antioxidants, sustained energy', recipe: 'Ingredients: Chia seeds, almond milk, matcha powder, macadamias. \n1. Whisk matcha into milk.\n2. Stir in chia seeds and refrigerate overnight.\n3. Top with crushed macadamias.' },
  { name: 'Wagyu Beef Tartare & Quinoa', type: 'Michelin', country: 'France', perfectFor: 'physical', macros: 'High Protein, Complex Carbs', recipe: 'Ingredients: Wagyu beef, capers, shallots, egg yolk, quinoa. \n1. Finely dice beef and mix with minced shallots/capers.\n2. Top with raw quail egg yolk.\n3. Serve alongside toasted quinoa.' },
  { name: 'Spicy Doro Wat (Chicken Stew)', type: 'Global', country: 'Ethiopia', perfectFor: 'physical', macros: 'High Protein, Iron-Rich', recipe: 'Ingredients: Chicken legs, berbere spice, red onions, boiled eggs. \n1. Slow-cook minced onions without oil until dark.\n2. Add berbere and chicken, simmer 1hr.\n3. Add hard-boiled eggs at the end.' },
  { name: 'Sweet Potato & Black Bean Empanadas', type: 'Global', country: 'Argentina', perfectFor: 'physical', macros: 'High Carb, Plant Protein', recipe: 'Ingredients: Masa dough, sweet potato, black beans, cumin. \n1. Mash roasted sweet potatoes with black beans.\n2. Stuff dough and bake at 400F for 20 mins.' },
  { name: 'Lavender & Honey Sous-Vide Duck', type: 'Michelin', country: 'France', perfectFor: 'recovery', macros: 'Mod Protein, Melatonin Support', recipe: 'Ingredients: Duck breast, culinary lavender, honey. \n1. Sous-vide duck at 135F for 2 hours.\n2. Sear skin-side down until crispy.\n3. Drizzle with lavender-infused honey.' },
  { name: 'Ashwagandha & Turmeric Golden Milk', type: 'Balanced', country: 'India', perfectFor: 'recovery', macros: 'Anti-inflammatory, Sleep Aid', recipe: 'Ingredients: Coconut milk, turmeric, black pepper, ashwagandha root. \n1. Heat milk on low.\n2. Whisk in spices until dissolved.\n3. Drink 1 hour before sleep.' },
  { name: 'Tom Kha Gai (Coconut Soup)', type: 'Global', country: 'Thailand', perfectFor: 'recovery', macros: 'Electrolytes, Immune Support', recipe: 'Ingredients: Coconut milk, galangal, lemongrass, chicken, mushrooms. \n1. Simmer aromatics in broth.\n2. Add coconut milk and chicken, cook until tender.\n3. Finish with lime juice.' },
  { name: 'Chilled Cucumber & Kefir Soup', type: 'Balanced', country: 'Global', perfectFor: 'cooling', macros: 'High Hydration, Probiotics', recipe: 'Ingredients: Kefir, cucumber, dill, mint. \n1. Blend ingredients until smooth.\n2. Chill for 2 hours.\n3. Perfect for rapid core temperature cooling post-heat exposure.' }
];

export default function Home() {
  // ==========================================
  // 1. ALL SYSTEM STATE & REFS
  // ==========================================
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [isPro, setIsPro] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [neuralCapacity, setNeuralCapacity] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isProtocolSaveModalOpen, setIsProtocolSaveModalOpen] = useState(false);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [protocolName, setProtocolName] = useState('');
  const [protocolDesc, setProtocolDesc] = useState('');
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editDescValue, setEditDescValue] = useState('');
  const [activeRecipe, setActiveRecipe] = useState<any | null>(null);

  const [energyLogs, setEnergyLogs] = useState<any[]>([]);
  const initialLoadRef = useRef(true);

  // NEW: DATE AND WEATHER STATE
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [taskDate, setTaskDate] = useState(getTodayStr());
  const [localEnvironment, setLocalEnvironment] = useState({ temp: 32, humidity: 75, uvIndex: 9, condition: 'Hot/Humid' }); // Simulated local weather

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

  const theme = isDarkMode ? {
    bg: 'bg-slate-900', text: 'text-white', muted: 'text-slate-400', card: 'bg-slate-800/80',
    input: 'bg-slate-900/80 border-slate-700 text-white', item: 'bg-slate-900/60', modal: 'bg-slate-800',
    nav: 'bg-slate-900/80', hover: 'hover:bg-slate-700/50', btnSec: 'bg-slate-700 text-slate-300 hover:bg-slate-600',
    chartBg: '#0f172a', border: 'border-slate-700'
  } : {
    bg: 'bg-slate-50', text: 'text-slate-900', muted: 'text-slate-500', card: 'bg-white/80',
    input: 'bg-white border-slate-300 text-slate-900 shadow-sm', item: 'bg-slate-100', modal: 'bg-white',
    nav: 'bg-white/80', hover: 'hover:bg-slate-100', btnSec: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    chartBg: '#ffffff', border: 'border-slate-300'
  };

  useEffect(() => {
    if (neuralCapacity < 50) {
      setTasks(prevTasks => {
        const hasResetTask = prevTasks.some(t => t.title === 'Neural Reset Breathwork');
        if (!hasResetTask) return [{ id: Date.now(), title: 'Neural Reset Breathwork', energy_level: 'Critical', durationValue: 5, durationUnit: 'minutes', taskDate: getTodayStr(), user_id: session?.user?.id }, ...prevTasks];
        return prevTasks;
      });
    }
  }, [neuralCapacity, session]);

  // ==========================================
  // 2. LOGIC AND SUPABASE SYNC
  // ==========================================
  const isRelaxingTask = (t: string) => t.toLowerCase().match(/sleep|nap|rest|eat|breakfast|lunch|dinner|bed/);

  useEffect(() => { if (typeof window !== 'undefined' && 'Notification' in window) Notification.requestPermission(); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session?.user?.id) fetchProfile(session.user.id); setIsAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); if (session?.user?.id) fetchProfile(session.user.id); });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
    if (data) setIsPro(data.is_pro);
  }

  useEffect(() => { if (session?.user?.id) fetchTasks(); }, [session?.user?.id]);

  useEffect(() => {
    if (initialLoadRef.current) { initialLoadRef.current = false; return; }
    if (session?.user?.id) supabase.from('energy_logs').insert([{ user_id: session.user.id, capacity_score: neuralCapacity }]).then(() => fetchLogs());
  }, [neuralCapacity, session?.user?.id]);

  useEffect(() => {
    const drain = tasks.reduce((acc, t) => isRelaxingTask(t.title) ? acc : acc + (t.energy_level === 'High' ? 15 : t.energy_level === 'Medium' ? 10 : 5), 0);
    setNeuralCapacity(Math.max(0, Math.min(100, 100 - drain)));
  }, [tasks]);

  const analyzeTask = (taskTitle: string) => {
    const t = taskTitle.toLowerCase();
    if (t.match(/code|build|program|study|write|design|read|focus|meeting/)) return 'cognitive';
    if (t.match(/run|lift|gym|workout|cardio|train|sport|football|basketball/)) return 'physical';
    if (t.match(/sleep|nap|rest|recover|meditate/)) return 'recovery';
    return 'balanced';
  };

  // --- NEW: ENVIRONMENTAL SCHEDULING ENGINE ---
  const getRecommendations = (taskTitle: string, index: number) => {
    const category = analyzeTask(taskTitle);
    const titleLower = taskTitle.toLowerCase();
    let suitableMeals = category === 'balanced' ? premiumMeals : premiumMeals.filter(m => m.perfectFor === category);
    
    let time = '10:00 AM - 11:00 AM';
    let environmentalWarning = null;

    // 1. Weather-Optimized Physical Tasks
    if (category === 'physical') {
       if (localEnvironment.temp > 30 || localEnvironment.uvIndex > 7) {
          // Push to early morning or late evening to avoid heat stroke/UV damage
          time = '06:00 AM - 07:30 AM (Heat/UV Avoidance)';
          environmentalWarning = `High Temp (${localEnvironment.temp}°C) & UV (${localEnvironment.uvIndex}) detected. Auto-shifted to early AM to prevent heat exhaustion.`;
          
          // Inject cooling hydration meal if heat is detected
          const coolingMeal = premiumMeals.find(m => m.perfectFor === 'cooling');
          if (coolingMeal && !suitableMeals.includes(coolingMeal)) suitableMeals.unshift(coolingMeal);
       } else {
          time = '04:30 PM - 06:00 PM (Metabolic Spike)';
       }
    } 
    // 2. Logically Correct Sleep/Rest Tasks
    else if (category === 'recovery') {
       if (titleLower.includes('nap') || titleLower.includes('afternoon')) {
          time = '02:00 PM - 03:00 PM (Circadian Dip)';
       } else if (titleLower.includes('sleep') || titleLower.includes('bed')) {
          time = '10:00 PM - 06:00 AM (Deep REM Block)';
       } else {
          time = '08:00 PM - 09:00 PM (Down-regulation)';
       }
    }
    // 3. Cognitive Tasks
    else if (category === 'cognitive') {
       time = '08:00 AM - 11:30 AM (Peak Cortisol/Focus)';
    }

    return { dietOptions: suitableMeals.map(m => m.name), time, suitableMeals, environmentalWarning };
  };

  const arrangedTasks = useMemo(() => {
    const getTaskWeight = (title: string, lvl: string) => {
      if (lvl === 'Critical') return 0; const c = analyzeTask(title);
      if (title.toLowerCase().includes('morning')) return 5;
      if (c === 'physical') return 10; if (c === 'cognitive' || lvl === 'High') return 20;
      if (title.toLowerCase().includes('lunch')) return 25; if (lvl === 'Medium') return 30;
      if (lvl === 'Low') return 40; if (c === 'recovery') return 50; return 35;
    };
    return [...tasks].sort((a, b) => {
      // Sort by date first, then by task weight
      const dateA = a.taskDate || getTodayStr();
      const dateB = b.taskDate || getTodayStr();
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return getTaskWeight(a.title, a.energy_level) - getTaskWeight(b.title, b.energy_level);
    });
  }, [tasks]);

  const dynamicCalendar = useMemo(() => {
    if (arrangedTasks.length === 0) return [{ id: 'empty', title: 'System Awaiting Directives', time: '--:--', date: '' }];
    return arrangedTasks.map((t, i) => ({ 
      id: t.id, 
      title: t.title, 
      time: (t.customTime || getRecommendations(t.title, i).time).split('(')[0].trim(),
      date: t.taskDate || getTodayStr()
    }));
  }, [arrangedTasks]);

  const chartData = useMemo(() => energyLogs.length === 0 ? [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), Capacity: neuralCapacity }] : energyLogs.map(l => ({ time: new Date(l.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), Capacity: l.capacity_score })), [energyLogs, neuralCapacity]);

  // --- NEW: DATE-AWARE NOTIFICATION SYSTEM ---
  useEffect(() => {
    if (arrangedTasks.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
      const todayString = getTodayStr();

      arrangedTasks.forEach((task, i) => {
        // Skip notifications if the task is scheduled for a future/past date
        if (task.taskDate && task.taskDate !== todayString) return;

        const [startPart, endPart] = (task.customTime || getRecommendations(task.title, i).time).split('(')[0].trim().split('-');
        if (!startPart || !endPart) return;
        const parseTime = (part: string) => {
          const [timeStr, ampm] = part.trim().split(' '); if (!timeStr || !ampm) return { hours: -1, minutes: -1 };
          let [hours, mins] = timeStr.split(':').map(Number);
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12; if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
          return { hours, minutes: mins };
        };
        const s = parseTime(startPart); const e = parseTime(endPart);
        if (h === s.hours && m === s.minutes && !triggeredAlerts.current.has(`${task.id}-s`)) { if (Notification.permission === 'granted') new Notification(`Protocol Initiated`, { body: `Begin: ${task.title}` }); triggeredAlerts.current.add(`${task.id}-s`); }
        if (h === e.hours && m === e.minutes && !triggeredAlerts.current.has(`${task.id}-e`)) { if (Notification.permission === 'granted') new Notification(`Task Missed!`, { body: `${task.title} window passed.` }); triggeredAlerts.current.add(`${task.id}-e`); }
      });
    }, 15000); 
    return () => clearInterval(interval);
  }, [arrangedTasks]);

  // ==========================================
  // 3. ACTION FUNCTIONS
  // ==========================================
  async function fetchTasks() {
    try {
      const { data: t } = await supabase.from('tasks').select('*').eq('user_id', session?.user?.id); if (t) setTasks(t);
      const { data: p } = await supabase.from('protocols').select('*').eq('user_id', session?.user?.id); if (p) setProtocols(p);
      fetchLogs();
    } catch (error) { console.warn(error); }
  }
  async function fetchLogs() { if (!session?.user?.id) return; const { data } = await supabase.from('energy_logs').select('*').eq('user_id', session.user.id).order('logged_at', { ascending: true }).limit(30); if (data) setEnergyLogs(data); }

  const handleUpgrade = async () => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session?.user?.id, userEmail: session?.user?.email }) });
      const data = await res.json(); if (data.url) window.location.href = data.url; else alert("Payment gateway failed.");
    } catch (err) { console.error(err); } finally { setIsCheckoutLoading(false); }
  };

  const handleRecipeClick = (mealName: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!isPro) return handleUpgrade();
    const recipeData = premiumMeals.find(m => m.name === mealName); if (recipeData) setActiveRecipe(recipeData);
  };

  const saveCurrentQueueAsProtocol = async (e: React.FormEvent) => {
    e.preventDefault(); if (tasks.length === 0) return setSystemWarning("Cannot save empty queue.");
    const newProtocol = { user_id: session.user.id, name: protocolName, description: protocolDesc, task_count: tasks.length, saved_tasks: tasks.map(t => ({ title: t.title, energy_level: t.energy_level, durationValue: t.durationValue, durationUnit: t.durationUnit, customTime: t.customTime, customNutrition: t.customNutrition })) };
    const { data, error } = await supabase.from('protocols').insert([newProtocol]).select().single();
    if (!error && data) { setProtocols(prev => [data, ...prev]); setProtocolName(''); setProtocolDesc(''); setIsProtocolSaveModalOpen(false); }
  };

  const loadProtocolToQueue = (p: any) => { if (!p.saved_tasks) return; setTasks(prev => [...prev, ...p.saved_tasks.map((t: any, i: number) => ({ ...t, id: Date.now() + i, user_id: session?.user?.id, taskDate: getTodayStr() }))]); };
  const startEditingProtocol = (p: any) => { setEditingProtocolId(p.id); setEditNameValue(p.name); setEditDescValue(p.description || ''); };
  const saveEditedProtocol = async (id: string) => { const { error } = await supabase.from('protocols').update({ name: editNameValue, description: editDescValue }).eq('id', id); if (!error) setProtocols(prev => prev.map(p => p.id === id ? { ...p, name: editNameValue, description: editDescValue } : p)); setEditingProtocolId(null); };

  async function addTask(e: React.FormEvent) {
    e.preventDefault(); if (!session?.user?.id) return;
    if (energy === 'High' && tasks.length > 0 && tasks[tasks.length - 1].energy_level === 'High') return setSystemWarning('Consecutive heavy loads blocked.'); 
    const newTask = { id: Date.now(), title, energy_level: energy, durationValue, durationUnit, taskDate, user_id: session.user.id };
    
    setTasks(prev => [...prev, newTask]); 
    setTitle(''); setDurationValue(15); setEnergy('Medium'); setTaskDate(getTodayStr()); setSystemWarning(null); setIsModalOpen(false);
    
    try { await supabase.from('tasks').insert([{ title, energy_level: energy, taskDate, user_id: session.user.id }]); } catch (error) {}
  }

  async function deleteTask(id: number) {
    const t = tasks.find(t => t.id === id); if (!t) return;
    if (isRelaxingTask(t.title)) setNeuralCapacity(prev => Math.min(100, prev + (t.energy_level === 'High' ? 25 : t.energy_level === 'Medium' ? 15 : 10)));
    setTasks(prev => prev.filter(task => task.id !== id));
    try { await supabase.from('tasks').delete().eq('id', id); } catch (error) {}
  }

  const updateTaskCustomField = (id: number, field: string, value: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  
  const formatToHHMM = (rangeStr: string) => {
    if (!rangeStr) return "09:00"; const startStr = rangeStr.split('-')[0].trim(); if (!startStr.includes(':')) return "09:00";
    const [time, ampm] = startStr.split(' '); let [h, m] = time.split(':').map(Number);
    if (ampm?.toUpperCase() === 'PM' && h < 12) h += 12; if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // --- NEW: VALIDATE MANUAL TIME AGAINST WEATHER ---
  const handleNativeTimeChange = (id: number, hhmm: string, durationVal: number, durationUn: string) => {
    const [h, m] = hhmm.split(':').map(Number); const startDate = new Date(); startDate.setHours(h, m, 0, 0); const endDate = new Date(startDate);
    if (durationUn === 'hours') endDate.setHours(endDate.getHours() + durationVal); else endDate.setMinutes(endDate.getMinutes() + durationVal);
    
    updateTaskCustomField(id, 'customTime', `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

    // Weather Validation Check for User Inputs
    const task = tasks.find(t => t.id === id);
    if (task && analyzeTask(task.title) === 'physical') {
       if (h >= 11 && h <= 15 && (localEnvironment.uvIndex > 7 || localEnvironment.temp > 30)) {
          updateTaskCustomField(id, 'weatherWarning', `MANUAL OVERRIDE WARNING: Scheduling physical output at ${hhmm} exposes you to peak UV (${localEnvironment.uvIndex}) and Heat (${localEnvironment.temp}°C). Hydration protocol critical.`);
       } else {
          updateTaskCustomField(id, 'weatherWarning', '');
       }
    }
  };

  const checkIsExpired = (rangeStr: string, taskDateStr: string) => {
    if (!rangeStr || !taskDateStr) return false; 
    
    const endStr = rangeStr.split('-')[1]?.trim(); if (!endStr) return false;
    const [time, ampm] = endStr.split(' '); if(!time || !ampm) return false; let [h, m] = time.split(':').map(Number);
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12; if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    
    // Parse the task's specific date
    const [year, month, day] = taskDateStr.split('-').map(Number);
    const taskEnd = new Date(year, month - 1, day, h, m, 0, 0); 
    
    return new Date() > taskEnd;
  };

  const addThought = (e: React.FormEvent) => { e.preventDefault(); if (!newThought.trim()) return; setThoughts(prev => [{ id: Date.now(), text: newThought }, ...prev]); setNewThought(''); };
  const deleteThought = (id: number) => setThoughts(prev => prev.filter(t => t.id !== id));

  const stopFrequencies = () => { oscillatorsRef.current.forEach(o => { try { o.stop(); o.disconnect(); } catch(e){} }); oscillatorsRef.current = []; if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; } setActiveFrequency('off'); };
  
  const toggleFrequency = async (type: 'gamma' | 'alpha' | 'theta' | 'delta') => {
    if (activeFrequency === type) return stopFrequencies();
    stopFrequencies();
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext(); audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();
    const masterGain = ctx.createGain(); masterGain.gain.value = 0.05; masterGain.connect(ctx.destination);
    let offset = type === 'gamma' ? 40 : type === 'theta' ? 6 : type === 'delta' ? 2 : 10;
    const oscLeft = ctx.createOscillator(); const oscRight = ctx.createOscillator();
    const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null; const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    oscLeft.frequency.value = 432; oscRight.frequency.value = 432 + offset; 
    if (pannerLeft && pannerRight) { pannerLeft.pan.value = -1; pannerRight.pan.value = 1; oscLeft.connect(pannerLeft).connect(masterGain); oscRight.connect(pannerRight).connect(masterGain); } 
    else { oscLeft.connect(masterGain); oscRight.connect(masterGain); }
    oscLeft.start(); oscRight.start(); oscillatorsRef.current = [oscLeft, oscRight]; setActiveFrequency(type);
  };

  const startBreathing = () => {
    if (breathingPhase !== '') return; setBreathingPhase('Inhale...'); setTimeout(() => setBreathingPhase('Hold...'), 4000);
    setTimeout(() => setBreathingPhase('Exhale...'), 8000); setTimeout(() => { setBreathingPhase(''); setNeuralCapacity(prev => Math.min(100, prev + 15)); }, 16000);
  };

  const statusColor = neuralCapacity > 60 ? '#10b981' : neuralCapacity > 30 ? '#f59e0b' : '#ef4444';

  const ProGate = ({ title, children }: { title: string, children: React.ReactNode }) => {
    if (isPro) return <>{children}</>;
    return (
      <div className={`relative overflow-hidden rounded-3xl border border-emerald-500/20 ${theme.card} p-1`}>
        <div className="filter blur-sm opacity-30 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
          <div className={`${theme.nav} border border-yellow-500/30 p-6 rounded-2xl shadow-2xl backdrop-blur-md`}>
            <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-black uppercase mb-3 inline-block">Pro Feature</span>
            <h3 className={`${theme.text} font-bold mb-4 text-lg`}>{title} is locked.</h3>
            <button onClick={handleUpgrade} disabled={isCheckoutLoading} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 px-6 py-3 rounded-full font-black text-sm hover:scale-105 transition-transform shadow-lg disabled:opacity-50 w-full">
              {isCheckoutLoading ? "Routing..." : "Upgrade to Unlock"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isAuthLoading) return <div className={`min-h-screen ${theme.bg} text-emerald-400 flex items-center justify-center font-mono text-sm`}>INITIALIZING SOMAFLOW...</div>;
  if (!session) return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center p-4`}>
      <h1 className="text-2xl font-black text-emerald-400 mb-8">ACCESS DENIED</h1>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="bg-emerald-500 text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg">Sign in with Google</button>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans relative overflow-x-hidden transition-colors duration-300`}>
      <div className="fixed inset-0 opacity-15 bg-[linear-gradient(rgba(52,211,153,0.3)_2px,transparent_2px),linear-gradient(90deg,rgba(52,211,153,0.3)_2px,transparent_2px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-emerald-500/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none z-0"></div>

      <nav className={`border-b border-emerald-500/20 ${theme.nav} backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-emerald-900/10 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-auto py-3 sm:h-20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-900 shadow-lg shadow-emerald-500/30 text-xs sm:text-base">SF</div>
               <h1 className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">SomaFlow</h1>
             </div>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`sm:hidden px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-md transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'bg-white text-orange-500 border border-slate-200'}`}>
                {isDarkMode ? '☀️ LIGHT' : '🌙 DARK'}
             </button>
          </div>
          <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
             <div className={`flex gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl border border-emerald-500/20 ${theme.card} shadow-inner overflow-x-auto w-full sm:w-auto items-center`}>
                <button onClick={() => toggleFrequency('theta')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'theta' ? 'bg-purple-500/20 text-purple-500 shadow-sm' : `${theme.muted} hover:text-emerald-400`}`}>Theta</button>
                <button onClick={() => toggleFrequency('delta')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'delta' ? 'bg-indigo-500/20 text-indigo-500 shadow-sm' : `${theme.muted} hover:text-emerald-400`}`}>Delta</button>
                <button onClick={() => toggleFrequency('alpha')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'alpha' ? 'bg-cyan-500/20 text-cyan-500 shadow-sm' : `${theme.muted} hover:text-emerald-400`}`}>Alpha</button>
                <button onClick={() => toggleFrequency('gamma')} className={`whitespace-nowrap text-[9px] sm:text-[10px] uppercase font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${activeFrequency === 'gamma' ? 'bg-emerald-500/20 text-emerald-500 shadow-sm' : `${theme.muted} hover:text-emerald-400`}`}>Gamma</button>
                
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`hidden sm:block ml-2 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-md transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'bg-white text-orange-500 border border-slate-200'}`}>
                  {isDarkMode ? '☀️' : '🌙'}
                </button>

                {!isPro && (
                  <button onClick={handleUpgrade} disabled={isCheckoutLoading} className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black text-[9px] sm:text-[10px] uppercase hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20 disabled:opacity-50">
                    {isCheckoutLoading ? "Routing..." : "Upgrade PRO"}
                  </button>
                )}
             </div>
             <span className={`text-[8px] sm:text-[9px] text-emerald-500 font-mono tracking-wider pr-1`}>🎧 HEADPHONES FOR BINAURAL SYNC</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
        
        {/* LEFT COLUMN */}
        <section className="col-span-1 space-y-6">
          <div className={`${theme.card} border border-emerald-500/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md transition-colors duration-300`}>
            <h2 className="text-[10px] text-emerald-500 mb-6 sm:mb-10 uppercase tracking-widest font-bold">System State</h2>
            <div onClick={startBreathing} className={`relative w-48 h-48 sm:w-56 sm:h-56 mx-auto cursor-pointer transition-all duration-1000 ease-in-out ${breathingPhase === 'Inhale...' ? 'scale-110' : breathingPhase === 'Exhale...' ? 'scale-95' : 'scale-100'}`}>
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke={statusColor} strokeDasharray={289} strokeDashoffset={289 - (neuralCapacity / 100) * 289} strokeWidth="3" className="transition-all duration-1000 ease-out" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-black text-4xl sm:text-5xl tracking-tighter ${theme.text}`}>{neuralCapacity}%</span>
                {breathingPhase && <span className="text-emerald-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest animate-pulse mt-2 sm:mt-3">{breathingPhase}</span>}
              </div>
            </div>
            <p className={`text-[10px] sm:text-xs ${theme.muted} mt-6 sm:mt-8`}>Tap ring to initiate neural reset breathwork.</p>
          </div>

          <ProGate title="Neural Capacity Trends">
            <div className={`${theme.card} border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md transition-colors duration-300`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Neural Capacity Trends</h2>
                <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">PRO</span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ backgroundColor: theme.chartBg, border: '1px solid #10b981', borderRadius: '12px', fontSize: '12px', color: isDarkMode ? '#fff' : '#000' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line type="monotone" dataKey="Capacity" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: theme.chartBg, stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#10b981', stroke: isDarkMode ? '#fff' : '#000' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ProGate>
          
          <div className={`${theme.card} border border-emerald-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-md transition-colors`}>
             <h2 className="text-[10px] text-emerald-500 mb-2 uppercase tracking-widest font-bold">Environment AI</h2>
             <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
               <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Local Conditions</span>
                  <span className="font-bold text-sm">{localEnvironment.temp}°C • {localEnvironment.condition}</span>
               </div>
               <div className="text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">UV Index</span>
                  <span className="font-bold text-sm text-orange-500">{localEnvironment.uvIndex} (High)</span>
               </div>
             </div>
          </div>

        </section>

        {/* RIGHT COLUMN */}
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className={`${theme.card} border border-emerald-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl transition-colors duration-300`}>
            <h2 className="text-[10px] text-emerald-500 uppercase tracking-widest mb-4 font-bold">Bio-Optimized Sync Timeline</h2>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
              {dynamicCalendar.map(ev => (
                <div key={ev.id} className={`min-w-[160px] sm:min-w-[200px] p-3 sm:p-4 rounded-2xl ${theme.input} border border-emerald-500/10 border-l-4 border-l-cyan-500 shrink-0 shadow-md snap-center relative`}>
                  {ev.date !== getTodayStr() && <span className="absolute top-2 right-2 bg-slate-800 text-cyan-400 text-[8px] px-1.5 py-0.5 rounded font-bold">{ev.date.slice(5)}</span>}
                  <div className="text-[9px] sm:text-[10px] text-cyan-500 mb-1 font-mono font-bold">{ev.time}</div>
                  <div className={`font-bold text-xs sm:text-sm ${theme.text} truncate`}>{ev.title}</div>
                </div>
              ))}
            </div>
          </div>

          <ProGate title="Protocol Library">
            <div className={`${theme.card} border border-emerald-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl transition-colors duration-300`}>
               <div className="flex justify-between items-center mb-4 border-b border-emerald-500/20 pb-3">
                 <h2 className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold flex items-center gap-2">Protocol Library <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded text-[8px]">PRO</span></h2>
               </div>
               {protocols.length === 0 ? (
                 <div className={`text-xs italic text-center py-6 border border-dashed rounded-2xl ${theme.border} ${theme.muted}`}>Library is empty.</div>
               ) : (
                 <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                   {protocols.map(p => {
                     const isEditing = editingProtocolId === p.id;
                     return (
                       <div key={p.id} className={`min-w-[250px] p-4 rounded-xl ${theme.input} hover:border-emerald-500/50 transition-colors group relative`}>
                         {isEditing ? (
                           <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                             <input type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className={`w-full ${theme.input} border-emerald-500/40 rounded p-1 text-xs outline-none`} />
                             <textarea value={editDescValue} onChange={(e) => setEditDescValue(e.target.value)} rows={2} className={`w-full ${theme.input} rounded p-1 text-[10px] outline-none resize-none`} />
                             <button onClick={() => saveEditedProtocol(p.id)} className="w-full bg-emerald-500 text-slate-900 py-1 rounded text-[10px] font-black hover:bg-emerald-400 transition-colors">Save</button>
                           </div>
                         ) : (
                           <>
                             <div className="flex justify-between items-start mb-1">
                               <h3 className={`text-xs font-bold ${theme.text} truncate pr-2 w-32`}>{p.name}</h3>
                               <span className={`text-[8px] ${theme.item} text-emerald-500 px-1.5 py-0.5 rounded shrink-0`}>{p.task_count} Tasks</span>
                             </div>
                             <p className={`text-[9px] ${theme.muted} line-clamp-2 mb-3 h-6`}>{p.description || "No description provided."}</p>
                             <div className="flex gap-2">
                               <button onClick={() => loadProtocolToQueue(p)} className={`flex-1 ${theme.item} text-emerald-500 py-1.5 rounded-lg text-[10px] font-bold ${theme.hover} transition-colors border ${theme.border}`}>Load Protocol</button>
                               <button onClick={(e) => { e.stopPropagation(); startEditingProtocol(p); }} className={`px-2 ${theme.item} ${theme.muted} rounded-lg text-[10px] font-bold hover:text-emerald-500 transition-colors border ${theme.border}`} title="Edit">⚙</button>
                             </div>
                           </>
                         )}
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </ProGate>

          <div className={`${theme.card} border border-emerald-500/20 rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-xl transition-colors duration-300`}>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-emerald-500/20">
               <h2 className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Action Queue</h2>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={() => setIsProtocolSaveModalOpen(true)} className={`flex-1 sm:flex-none ${theme.item} ${theme.text} border border-emerald-500/30 px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold hover:border-emerald-500 transition-colors shadow-sm`}>Save Protocol</button>
                 <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none bg-emerald-500 text-slate-900 px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">+ Add Task</button>
               </div>
             </div>
             
             {systemWarning && <div className="mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] sm:text-xs font-bold text-center">{systemWarning}</div>}

             <div className="space-y-3 sm:space-y-4">
                {arrangedTasks.length === 0 && <div className={`text-xs sm:text-sm text-center py-8 sm:py-10 border border-dashed rounded-2xl ${theme.border} ${theme.muted}`}>Queue is empty.</div>}
                {arrangedTasks.map((task, index) => {
                  const rec = getRecommendations(task.title, index);
                  const isRest = isRelaxingTask(task.title);
                  const isCritical = task.energy_level === 'Critical';
                  const currentWindow = task.customTime || rec.time;
                  
                  // Use the task's specific date for expiration checks
                  const taskDateString = task.taskDate || getTodayStr();
                  const isExpired = checkIsExpired(currentWindow, taskDateString);
                  const isFuture = taskDateString > getTodayStr();
                  
                  const borderColor = isCritical ? 'border-red-500/80 shadow-red-500/20' : isRest ? 'border-purple-500/40' : task.energy_level === 'High' ? 'border-orange-500/40' : task.energy_level === 'Medium' ? 'border-yellow-500/40' : 'border-emerald-500/40';
                  const bgState = isExpired ? `${theme.item} grayscale opacity-50` : `${theme.input} hover:scale-[1.01]`;
                  
                  return (
                    <div key={task.id} onClick={() => deleteTask(task.id)} className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 group shadow-md ${borderColor} ${bgState}`}>
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 truncate">
                          {isFuture && <span className="bg-slate-800 text-cyan-400 px-2 py-0.5 rounded-md font-mono text-[8px] tracking-wider shrink-0 border border-cyan-500/30">{taskDateString}</span>}
                          <h3 className={`font-bold text-sm sm:text-lg ${theme.text} group-hover:text-emerald-500 transition-colors truncate`}>{task.title}</h3>
                          {isCritical && <span className="bg-red-500 text-white px-2 py-0.5 rounded-md font-mono text-[8px] tracking-wider uppercase shrink-0 animate-pulse">RESET</span>}
                          {isRest && !isCritical && <span className="bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded-md font-mono text-[8px] tracking-wider uppercase shrink-0">⚡ Restorative</span>}
                        </div>
                        <span className={`text-[8px] sm:text-[10px] uppercase font-bold ${theme.muted} group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0`}>Complete Task</span>
                      </div>
                      
                      {/* WEATHER WARNING ALERTS */}
                      {task.weatherWarning && (
                        <div className="mb-3 bg-orange-500/10 border border-orange-500/40 text-orange-500 text-[9px] sm:text-[10px] p-2 rounded-lg font-bold">
                          ⚠️ {task.weatherWarning}
                        </div>
                      )}
                      {!task.weatherWarning && rec.environmentalWarning && !task.customTime && (
                        <div className="mb-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-500 text-[9px] sm:text-[10px] p-2 rounded-lg font-bold">
                           🌱 {rec.environmentalWarning}
                        </div>
                      )}

                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 ${theme.item} p-3 sm:p-4 rounded-xl text-[10px] sm:text-xs border ${theme.border}`}>
                        <div>
                          <strong className="text-emerald-500 block mb-1">Smart Nutrition AI</strong>
                          <div className="flex gap-2">
                            <select value={task.customNutrition || rec.dietOptions[0]} onChange={(e) => updateTaskCustomField(task.id, 'customNutrition', e.target.value)} onClick={(e) => e.stopPropagation()} className={`flex-1 ${theme.input} border-slate-700/50 rounded-md p-1.5 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer truncate`}>
                              {rec.dietOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option> )}
                            </select>
                            <button onClick={(e) => handleRecipeClick(task.customNutrition || rec.dietOptions[0], e)} className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 px-2 rounded font-bold hover:bg-yellow-500/40 transition-colors">RECIPE</button>
                          </div>
                        </div>
                        <div>
                          <strong className="text-cyan-500 block mb-1">AI Execution Window</strong>
                          <input type="time" value={formatToHHMM(currentWindow)} onChange={(e) => handleNativeTimeChange(task.id, e.target.value, task.durationValue || 15, task.durationUnit || 'minutes')} onClick={(e) => e.stopPropagation()} className={`w-full ${theme.input} border-cyan-500/50 rounded-md p-2 outline-none font-bold focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer`} required />
                          <p className={`text-[9px] ${theme.muted} mt-1`}>{currentWindow}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>
      </main>

      {/* RECIPE MODAL */}
      {activeRecipe && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className={`${theme.modal} p-8 rounded-3xl w-full max-w-lg border border-yellow-500/50 shadow-2xl relative transition-colors duration-300`}>
            <button onClick={() => setActiveRecipe(null)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 font-bold text-xl">✕</button>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded text-[10px] font-black uppercase">PRO RECIPE</span>
              <span className={`${theme.muted} text-xs`}>| {activeRecipe.country} • {activeRecipe.type}</span>
            </div>
            <h2 className={`text-2xl font-black ${theme.text} mb-2`}>{activeRecipe.name}</h2>
            <p className="text-emerald-500 text-xs font-mono mb-6">{activeRecipe.macros}</p>
            <div className={`${theme.input} rounded-xl p-6 text-sm whitespace-pre-line border border-slate-700/50`}>
              {activeRecipe.recipe}
            </div>
          </div>
        </div>
      )}

      {/* SAVE PROTOCOL MODAL */}
      {isProtocolSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]">
          <form onSubmit={saveCurrentQueueAsProtocol} className={`${theme.modal} p-6 sm:p-8 rounded-3xl w-full max-w-sm sm:max-w-md border border-emerald-500/30 shadow-2xl transition-colors duration-300`}>
             <div className="flex items-center gap-2 mb-5 sm:mb-6">
               <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded text-[10px] font-bold">PRO</span>
               <h2 className="text-lg sm:text-xl font-bold text-emerald-500">Save as Protocol</h2>
             </div>
             <input value={protocolName} onChange={(e) => setProtocolName(e.target.value)} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border focus:border-emerald-500 outline-none transition-colors text-sm`} placeholder="Protocol Name..." required />
             <textarea value={protocolDesc} onChange={(e) => setProtocolDesc(e.target.value)} rows={3} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl mb-6 sm:mb-8 border focus:border-emerald-500 outline-none transition-colors text-sm`} placeholder="Description..." />
             <div className="flex gap-3 sm:gap-4">
               <button type="button" onClick={() => setIsProtocolSaveModalOpen(false)} className={`w-1/2 ${theme.btnSec} py-3 sm:py-4 rounded-xl font-bold transition-colors`}>Cancel</button>
               <button type="submit" className="w-1/2 bg-emerald-500 py-3 sm:py-4 rounded-xl font-black text-slate-900 shadow-lg shadow-emerald-500/20">Save</button>
             </div>
          </form>
        </div>
      )}

      {/* ADD TASK MODAL (UPDATED WITH DATE PICKER) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]">
          <form onSubmit={addTask} className={`${theme.modal} p-6 sm:p-8 rounded-3xl w-full max-w-sm sm:max-w-md border border-emerald-500/30 shadow-2xl transition-colors duration-300`}>
             <h2 className="text-lg sm:text-xl font-bold mb-5 sm:mb-6 text-emerald-500">Initialize New Task</h2>
             <input value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border focus:border-emerald-500 outline-none transition-colors text-sm`} placeholder="Task Designation (e.g. Code, Workout)..." required />
             
             <div className="mb-3 sm:mb-4">
                <label className="text-[10px] text-emerald-500 uppercase font-bold mb-1 block">Execution Date</label>
                <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl border focus:border-emerald-500 outline-none text-sm cursor-pointer`} required />
             </div>

             <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-1/2">
                   <label className="text-[10px] text-emerald-500 uppercase font-bold mb-1 block">Duration</label>
                   <input type="number" min="1" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl border focus:border-emerald-500 outline-none text-sm`} required />
                </div>
                <div className="w-1/2">
                   <label className="text-[10px] text-transparent uppercase font-bold mb-1 block">Unit</label>
                   <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl border outline-none cursor-pointer text-sm`}>
                     <option value="minutes">Minutes</option>
                     <option value="hours">Hours</option>
                   </select>
                </div>
             </div>
             
             <label className="text-[10px] text-emerald-500 uppercase font-bold mb-1 block">Energy Draw</label>
             <select value={energy} onChange={(e) => setEnergy(e.target.value)} className={`w-full ${theme.input} p-3 sm:p-4 rounded-xl mb-6 sm:mb-8 border outline-none cursor-pointer text-sm`}>
                <option value="Low">Low Energy</option>
                <option value="Medium">Medium Energy</option>
                <option value="High">High Energy</option>
             </select>
             
             <div className="flex gap-3 sm:gap-4">
               <button type="button" onClick={() => setIsModalOpen(false)} className={`w-1/2 ${theme.btnSec} py-3 sm:py-4 rounded-xl font-bold transition-colors`}>Abort</button>
               <button type="submit" className="w-1/2 bg-emerald-500 py-3 sm:py-4 rounded-xl font-black text-slate-900 shadow-lg shadow-emerald-500/20">Execute</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}