// Debug script to test firing logs data saving
// Run this in your browser console while on the firing logs page

async function debugFiringLogs() {
  console.log('🔍 Starting firing logs debug...');
  
  // Check if Supabase is available
  if (typeof window !== 'undefined' && window.supabase) {
    console.log('✅ Supabase client found');
  } else {
    console.log('❌ Supabase client not found');
    return;
  }

  // Test basic connection
  try {
    const { data, error } = await window.supabase
      .from('firing_logs')
      .select('id, title, kiln_name, created_at')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching firing logs:', error);
    } else {
      console.log('✅ Firing logs fetched successfully:', data);
    }
  } catch (err) {
    console.error('❌ Exception fetching firing logs:', err);
  }

  // Test insert
  try {
    const testData = {
      user_id: 'test-user-id', // This will fail due to RLS, but we can see the error
      kiln_name: 'Debug Test Kiln',
      title: 'Debug Test Firing',
      date: new Date().toISOString().split('T')[0],
      notes: 'Debug test',
      firing_type: 'bisque',
      target_temperature: 999,
      actual_temperature: 1000,
      firing_duration_hours: 1.0,
      ramp_rate: 100.0,
      warning_flags: [],
      temperature_entries: []
    };

    console.log('🧪 Testing insert with data:', testData);

    const { data: insertData, error: insertError } = await window.supabase
      .from('firing_logs')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      console.log('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insert test successful:', insertData);
    }
  } catch (err) {
    console.error('❌ Exception during insert test:', err);
  }

  // Check current user
  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error) {
      console.error('❌ Error getting user:', error);
    } else {
      console.log('👤 Current user:', user);
    }
  } catch (err) {
    console.error('❌ Exception getting user:', err);
  }
}

// Run the debug function
debugFiringLogs();
