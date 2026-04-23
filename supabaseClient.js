import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ktrezsjbadwceajiwker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cmV6c2piYWR3Y2Vhaml3a2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTI1NzIsImV4cCI6MjA5MjE4ODU3Mn0.0rSuH8aPWMKz79x9UZ2yXVU6Iwt62yx-Z4tHWPs-Gxw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signUp(email, password) {
    return await supabase.auth.signUp({ email, password });
}

export async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
    return await supabase.auth.signOut();
}

export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return session;
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user || null;
}

export async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export async function getProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
    return data;
}
