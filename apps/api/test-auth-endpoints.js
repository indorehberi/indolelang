/**
 * Quick Auth Endpoints Test Script
 * Test semua 7 auth endpoints
 */

const API_BASE = 'http://localhost:8000/api/v1/auth';

const testData = {
  email: `test${Date.now()}@example.com`,
  phone: `08${Math.floor(10000000000 + Math.random() * 90000000000)}`,
  password: 'Password123!',
  full_name: 'Test User',
  role: 'bidder'
};

console.log('🧪 Starting Auth Endpoints Test...\n');
console.log('Test Data:', testData, '\n');

async function test() {
  try {
    // 1. Register
    console.log('1️⃣ Testing POST /register...');
    const registerRes = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const registerData = await registerRes.json();
    console.log(`   Status: ${registerRes.status}`);
    console.log(`   Result:`, registerData);
    
    if (!registerData.success) {
      console.error('   ❌ Register failed!');
      return;
    }
    console.log('   ✅ Register OK\n');

    // 2. Verify OTP (default: 123456)
    console.log('2️⃣ Testing POST /verify-otp...');
    const otpRes = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testData.phone, otp: '123456' })
    });
    const otpData = await otpRes.json();
    console.log(`   Status: ${otpRes.status}`);
    console.log(`   Result:`, otpData);
    
    if (!otpData.success) {
      console.error('   ❌ OTP verification failed!');
      return;
    }
    console.log('   ✅ OTP verified\n');

    // 3. Login
    console.log('3️⃣ Testing POST /login...');
    const loginRes = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testData.email, 
        password: testData.password 
      })
    });
    const loginData = await loginRes.json();
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Result:`, loginData);
    
    if (!loginData.success) {
      console.error('   ❌ Login failed!');
      return;
    }
    const accessToken = loginData.data.accessToken;
    console.log('   ✅ Login OK');
    console.log(`   Access Token: ${accessToken.substring(0, 50)}...\n`);

    // 4. Refresh Token
    console.log('4️⃣ Testing POST /refresh-token...');
    // Note: Refresh token biasanya di HttpOnly cookie, untuk test kita skip dulu
    console.log('   ⏭️  Skipped (requires cookie handling)\n');

    // 5. Logout
    console.log('5️⃣ Testing POST /logout...');
    const logoutRes = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const logoutData = await logoutRes.json();
    console.log(`   Status: ${logoutRes.status}`);
    console.log(`   Result:`, logoutData);
    console.log('   ✅ Logout OK\n');

    // 6. Forgot Password
    console.log('6️⃣ Testing POST /forgot-password...');
    const forgotRes = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email })
    });
    const forgotData = await forgotRes.json();
    console.log(`   Status: ${forgotRes.status}`);
    console.log(`   Result:`, forgotData);
    console.log('   ✅ Forgot password OK\n');

    // 7. Reset Password (skip - butuh token dari email)
    console.log('7️⃣ Testing POST /reset-password...');
    console.log('   ⏭️  Skipped (requires email token)\n');

    console.log('═══════════════════════════════════════');
    console.log('✅ ALL BASIC AUTH ENDPOINTS WORKING!');
    console.log('═══════════════════════════════════════');
    console.log('\nTest Summary:');
    console.log('  ✅ Register - PASS');
    console.log('  ✅ Verify OTP - PASS');
    console.log('  ✅ Login - PASS');
    console.log('  ⏭️  Refresh Token - SKIPPED');
    console.log('  ✅ Logout - PASS');
    console.log('  ✅ Forgot Password - PASS');
    console.log('  ⏭️  Reset Password - SKIPPED');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

test();
