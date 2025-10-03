// Test script to verify Supabase connection
// Run this in your browser console at http://localhost:3001

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');

  // Check if supabase is available
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase client not available in window');
    return;
  }

  // Get current session
  const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
  } else if (session) {
    console.log('Current session:', session);
    console.log('User:', session.user);
  } else {
    console.log('No active session');
  }

  // Test the Supabase URL
  console.log('Supabase URL:', window.supabase.supabaseUrl);
  console.log('Storage key:', 'heritage-whisper-auth');

  // Check localStorage for auth data
  const authData = localStorage.getItem('heritage-whisper-auth');
  if (authData) {
    console.log('Auth data in localStorage:', JSON.parse(authData));
  } else {
    console.log('No auth data in localStorage');
  }
}

// Instructions:
console.log(`
To test Supabase connection:
1. Open your browser at http://localhost:3001
2. Open DevTools (F12)
3. Go to Console tab
4. Copy and paste this entire script
5. Run: testSupabaseConnection()

To manually test login:
await window.supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
})
`);

testSupabaseConnection();