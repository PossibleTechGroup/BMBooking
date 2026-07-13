const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting BM Booking Backend Flow Tests...\n');

  try {
    // --- DOCTOR FLOW ---
    console.log('🩺 Testing DOCTOR Flow:');
    
    // 1. Request OTP
    console.log('   1. Requesting OTP...');
    const reqOtpDoc = await fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+251911223344', role: 'doctor' })
    });
    console.log('      Status:', reqOtpDoc.status);

    // 2. Verify OTP
    console.log('   2. Verifying OTP...');
    const verifyOtpDoc = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+251911223344', code: '123456', role: 'doctor' })
    });
    const resDoc = await verifyOtpDoc.json();
    const docData = resDoc.data;
    const docToken = docData.token;
    console.log('      Status:', verifyOtpDoc.status, docToken ? '(Token Received)' : '(No Token!)');

    // 3. Setup Profile
    console.log('   3. Setting up Profile...');
    const setupProfile = await fetch(`${BASE_URL}/api/doctors/profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${docToken}`
      },
      body: JSON.stringify({ 
        fullName: 'Dr. Abel', 
        specialization: 'Surgery', 
        experienceYears: 10 
      })
    });
    console.log('      Status:', setupProfile.status);

    // 4. Get Profile
    console.log('   4. Getting Profile Status...');
    const getProfile = await fetch(`${BASE_URL}/api/doctors/profile`, {
      headers: { 'Authorization': `Bearer ${docToken}` }
    });
    const resProf = await getProfile.json();
    const profileData = resProf.data;
    console.log('      Status:', getProfile.status, '| Current Status:', profileData.status);


    // --- PATIENT FLOW ---
    console.log('\n👤 Testing PATIENT Flow:');

    // 1. Request OTP
    console.log('   1. Requesting OTP...');
    await fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+251999887766', role: 'patient' })
    });

    // 2. Verify OTP
    console.log('   2. Verifying OTP...');
    const verifyOtpPat = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+251999887766', code: '123456', role: 'patient' })
    });
    const resPat = await verifyOtpPat.json();
    const patData = resPat.data;
    const patToken = patData.token;
    console.log('      Status:', verifyOtpPat.status, patToken ? '(Token Received)' : '(No Token!)');

    // 3. Health Check (Protected)
    console.log('   3. Testing Protected Route (Health)...');
    const health = await fetch(`${BASE_URL}/health`, {
      headers: { 'Authorization': `Bearer ${patToken}` }
    });
    console.log('      Status:', health.status);

    console.log('\n✅ All tests completed successfully!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
  }
}

runTests();
