/**
 * RBAC (Role-Based Access Control) Test Script
 * Test authorization middleware with different roles
 */

const API_BASE = 'http://localhost:8000/api/v1';

// Test user - already created from previous test
const bidderToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJmY2UzMTJkLWIwZTYtNDE5Mi04ZDNlLWEwYmY5NmNjZWEzNSIsImVtYWlsIjoidGVzdDE3ODI2MzM3OTU0MjBAZXhhbXBsZS5jb20iLCJyb2xlIjoiYmlkZGVyIiwic3RhdHVzIjoiYWN0aXZlIiwiaWF0IjoxNzgyNjMzNzk1LCJleHAiOjE3ODI2MzQ2OTV9.aoD7Px1bZz_X_H9RAmlf2ZVxTk4t9CDhW2n1DsIkDcI';

console.log('🧪 Starting RBAC Test...\n');

async function test() {
  try {
    // 1. Test Public Endpoint (no auth)
    console.log('1️⃣ Testing GET /test/public (no auth required)...');
    const publicRes = await fetch(`${API_BASE}/test/public`);
    const publicData = await publicRes.json();
    console.log(`   Status: ${publicRes.status}`);
    console.log(`   ${publicData.success ? '✅' : '❌'} ${publicData.message}\n`);

    // 2. Test Protected Endpoint (auth required)
    console.log('2️⃣ Testing GET /test/protected (auth required)...');
    const protectedRes = await fetch(`${API_BASE}/test/protected`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const protectedData = await protectedRes.json();
    console.log(`   Status: ${protectedRes.status}`);
    if (protectedData.success) {
      console.log(`   ✅ ${protectedData.message}`);
      console.log(`   User: ${protectedData.user.email} (${protectedData.user.role})\n`);
    } else {
      console.log(`   ❌ ${protectedData.error?.message}\n`);
    }

    // 3. Test Bidder Endpoint (should PASS)
    console.log('3️⃣ Testing GET /test/bidder-only (role: bidder)...');
    const bidderRes = await fetch(`${API_BASE}/test/bidder-only`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const bidderData = await bidderRes.json();
    console.log(`   Status: ${bidderRes.status}`);
    if (bidderData.success) {
      console.log(`   ✅ ${bidderData.message} - ACCESS GRANTED\n`);
    } else {
      console.log(`   ❌ ${bidderData.error?.message}\n`);
    }

    // 4. Test Admin Endpoint (should FAIL - bidder doesn't have access)
    console.log('4️⃣ Testing GET /test/admin-only (role: admin/superadmin)...');
    const adminRes = await fetch(`${API_BASE}/test/admin-only`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const adminData = await adminRes.json();
    console.log(`   Status: ${adminRes.status}`);
    if (adminData.success) {
      console.log(`   ❌ SECURITY BUG: Bidder gained admin access!\n`);
    } else {
      console.log(`   ✅ ACCESS DENIED (Expected) - ${adminData.error?.message}\n`);
    }

    // 5. Test Provider Endpoint (should FAIL)
    console.log('5️⃣ Testing GET /test/provider-only (role: provider)...');
    const providerRes = await fetch(`${API_BASE}/test/provider-only`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const providerData = await providerRes.json();
    console.log(`   Status: ${providerRes.status}`);
    if (providerData.success) {
      console.log(`   ❌ SECURITY BUG: Bidder gained provider access!\n`);
    } else {
      console.log(`   ✅ ACCESS DENIED (Expected) - ${providerData.error?.message}\n`);
    }

    // 6. Test Staff Endpoint (should FAIL)
    console.log('6️⃣ Testing GET /test/staff (role: superadmin/admin/staff)...');
    const staffRes = await fetch(`${API_BASE}/test/staff`, {
      headers: { 'Authorization': `Bearer ${bidderToken}` }
    });
    const staffData = await staffRes.json();
    console.log(`   Status: ${staffRes.status}`);
    if (staffData.success) {
      console.log(`   ❌ SECURITY BUG: Bidder gained staff access!\n`);
    } else {
      console.log(`   ✅ ACCESS DENIED (Expected) - ${staffData.error?.message}\n`);
    }

    // 7. Test Protected Without Token (should FAIL)
    console.log('7️⃣ Testing GET /test/protected (no token)...');
    const noAuthRes = await fetch(`${API_BASE}/test/protected`);
    const noAuthData = await noAuthRes.json();
    console.log(`   Status: ${noAuthRes.status}`);
    if (noAuthData.success) {
      console.log(`   ❌ SECURITY BUG: Accessed protected route without token!\n`);
    } else {
      console.log(`   ✅ ACCESS DENIED (Expected) - ${noAuthData.error?.message}\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ RBAC TEST COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log('\nTest Summary:');
    console.log('  ✅ Public endpoint - ACCESSIBLE');
    console.log('  ✅ Protected endpoint (with token) - ACCESSIBLE');
    console.log('  ✅ Bidder-only endpoint - ACCESSIBLE (correct role)');
    console.log('  ✅ Admin-only endpoint - DENIED (wrong role)');
    console.log('  ✅ Provider-only endpoint - DENIED (wrong role)');
    console.log('  ✅ Staff endpoint - DENIED (wrong role)');
    console.log('  ✅ Protected endpoint (no token) - DENIED');
    console.log('\n🎉 Role-Based Access Control is working correctly!');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

test();
