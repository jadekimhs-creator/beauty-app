import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ktrezsjbadwceajiwker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cmV6c2piYWR3Y2Vhaml3a2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTI1NzIsImV4cCI6MjA5MjE4ODU3Mn0.0rSuH8aPWMKz79x9UZ2yXVU6Iwt62yx-Z4tHWPs-Gxw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
