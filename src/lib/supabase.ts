import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://saqhlkqhwpcpzplkajtb.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcWhsa3Fod3BjcHpwbGthanRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTg5OTQsImV4cCI6MjA5ODAzNDk5NH0.aaY3CCpfLFAHHI452GGAobnm0G1NCHIuo4BzYd-IlU0";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing from environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
