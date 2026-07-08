'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AddTaskModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [energy, setEnergy] = useState('Medium');
  const router = useRouter();

  if (!isOpen) return null;

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('tasks').insert([{ title, energy_level: energy }]);
    setTitle('');
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <form onSubmit={addTask} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Queue New Action</h2>
        <input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-white mb-4 focus:outline-none focus:border-emerald-500"
          required
        />
        <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-white mb-6">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 py-3 rounded-lg font-bold transition">Save Action</button>
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-lg font-bold transition">Cancel</button>
        </div>
      </form>
    </div>
  );
}