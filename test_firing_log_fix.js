// Test script to verify the firing log fix
// Run this in your browser console after the migration

async function testFiringLogFix() {
  console.log('🧪 Testing firing log fix...');
  
  // Test data with decimal ramp_rate
  const testData = {
    user_id: '4781dbdb-d75c-4450-aa5e-673d86977501', // Your user ID from the logs
    kiln_name: 'Test Kiln',
    title: 'Test Firing Log Fix',
    date: new Date().toISOString().split('T')[0],
    notes: 'Testing decimal ramp_rate',
    firing_type: 'bisque',
    target_temperature: 999,
    actual_temperature: 1000,
    firing_duration_hours: 8.5, // Decimal value
    ramp_rate: 71165.55, // The problematic decimal value
    warning_flags: [],
    temperature_entries: []
  };

  console.log('Test data:', testData);

  try {
    const { data, error } = await window.supabase
      .from('firing_logs')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ Test failed:', error);
      return false;
    }

    console.log('✅ Test successful! Data saved:', data);
    
    // Clean up test data
    if (data && data[0]) {
      await window.supabase
        .from('firing_logs')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Test data cleaned up');
    }

    return true;
  } catch (err) {
    console.error('❌ Test error:', err);
    return false;
  }
}

// Run the test
testFiringLogFix();
