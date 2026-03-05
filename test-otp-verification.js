/**
 * Test Script for OTP Verification
 * Run this in browser console on /register page to test the RPC call
 */

async function testOTPVerification() {
  console.log('🧪 Testing OTP Verification...\n');

  // Test data
  const testCases = [
    {
      name: 'Valid format test',
      phone: '+998 88 956 38 48',
      code: '123456',
      expectedCleanPhone: '998889563848'
    },
    {
      name: 'Phone with dashes',
      phone: '+998-88-956-38-48',
      code: '654321',
      expectedCleanPhone: '998889563848'
    },
    {
      name: 'Phone without plus',
      phone: '998 88 956 38 48',
      code: '111111',
      expectedCleanPhone: '998889563848'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Input phone: "${testCase.phone}"`);
    console.log(`   Input code: "${testCase.code}"`);

    // Sanitize phone (same logic as in smsService.ts)
    const cleanPhone = testCase.phone.replace(/\D/g, '');
    console.log(`   ✓ Cleaned phone: "${cleanPhone}"`);
    console.log(`   ✓ Expected: "${testCase.expectedCleanPhone}"`);
    console.log(`   ✓ Match: ${cleanPhone === testCase.expectedCleanPhone ? '✅' : '❌'}`);

    // Show what will be sent to RPC
    console.log(`   📤 RPC call will be:`);
    console.log(`      supabase.rpc('verify_otp', {`);
    console.log(`        p_code: "${testCase.code}",`);
    console.log(`        p_phone: "${cleanPhone}"`);
    console.log(`      })`);
  }

  console.log('\n\n🔍 To test with real database:');
  console.log('1. Get a real OTP code from @MyBronRobot');
  console.log('2. Run this in console:');
  console.log('');
  console.log('   const result = await supabase.rpc("verify_otp", {');
  console.log('     p_code: "YOUR_CODE_HERE",');
  console.log('     p_phone: "998889563848"');
  console.log('   });');
  console.log('   console.log("Result:", result);');
  console.log('');
  console.log('3. Expected response:');
  console.log('   { data: true, error: null }  // if valid');
  console.log('   { data: false, error: null } // if invalid/expired');
}

// Run the test
testOTPVerification();

// Export for manual testing
window.testOTPManual = async function(code, phone) {
  console.log('\n🧪 Manual OTP Test');
  console.log('Input:', { code, phone });
  
  const cleanPhone = phone.replace(/\D/g, '');
  console.log('Cleaned phone:', cleanPhone);
  
  try {
    const result = await supabase.rpc('verify_otp', {
      p_code: code,
      p_phone: cleanPhone
    });
    
    console.log('✅ Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    return { error };
  }
};

console.log('\n💡 Tip: Use window.testOTPManual("123456", "+998 88 956 38 48") to test manually');
