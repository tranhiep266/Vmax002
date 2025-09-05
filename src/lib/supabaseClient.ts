﻿import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Missing Supabase env. Update .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}
export const supabase = createClient(supabaseUrl, supabaseKey);
