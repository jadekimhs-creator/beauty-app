import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ktrezsjbadwceajiwker.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AfDcbKtuQ-otIV9ylWqNbA_2kwaPz5u';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
