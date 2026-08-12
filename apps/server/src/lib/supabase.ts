import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const supabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);
