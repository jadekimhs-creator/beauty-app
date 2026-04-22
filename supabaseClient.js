import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ktrezsjbadwceajiwker.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AfDcbKtuQ-otIV9ylWqNbA_2kwaPz5u';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Client Initialized with URL:', SUPABASE_URL);
if (SUPABASE_ANON_KEY.startsWith('sb_')) {
    console.warn('Warning: The Supabase Anon Key format looks unusual (starts with "sb_"). Please verify it in your Supabase Dashboard -> Settings -> API.');
}
