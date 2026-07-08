import { createClient } from '@supabase/supabase-js';

// Hardcoding these temporarily to bypass environment variable issues
const supabaseUrl = 'https://ilykqnlcgdvtelrjkqhc.supabase.co';
const supabaseAnonKey = 'sb_publishable_2MTbpXC4iqifygtSegMpIg_nmJpdA-Z'; 

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);