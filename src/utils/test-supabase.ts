/**
 * Quick Supabase Connection Test
 * 
 * Run this to verify your Supabase connection is working
 * Uses the shared supabase client instance
 */

import { supabase } from '../services/supabase';

async function testConnection() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? '✅ Configured' : '❌ Missing');

    try {
        // Test database connection
        const { error } = await supabase
            .from('ai_coder_projects')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Connection failed:', error.message);
            return false;
        }

        console.log('✅ Database connected successfully!');

        // Test auth
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth session:', session ? '✅ Signed in' : '⚠️ Not signed in');

        return true;
    } catch (err) {
        console.error('❌ Connection error:', err);
        return false;
    }
}

// Auto-run on import during development
if (import.meta.env.DEV) {
    testConnection();
}

export { testConnection };
