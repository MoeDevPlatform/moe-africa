import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kpavoczevwqakxfpbuod.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYXZvY3pldndxYWt4ZnBidW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NzUwMTksImV4cCI6MjA0NjA1MTAxOX0.2sLOFgzKMlgqZYDPJHOHMDjHOUVW6GQiJpinI4kYN38";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

