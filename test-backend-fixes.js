/**
 * Manual Test Script for Backend Fixes
 * Run with: node test-backend-fixes.js
 * 
 * Prerequisites:
 * - Server running on http://localhost:5000
 * - Test users created (admin, manager, datacollector)
 */

const API_BASE = 'http://localhost:5000/api/v1';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function login(email, password) {
  console.log(`\n🔐 Logging in as ${email}...`);
  const result = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (result.status === 200 && result.data.token) {
    console.log(`✅ Login successful`);
    return result.data.token;
  } else {
    console.log(`❌ Login failed: ${result.data.error || result.error}`);
    return null;
  }
}

async function testBulkApprovalAuth() {
  console.log(`\n\n========================================`);
  console.log(`TEST 1: Bulk Approval Authorization`);
  console.log(`========================================`);
  
  const dcToken = await login('datacollector@test.com', 'password');
  const managerToken = await login('manager@test.com', 'password');
  
  if (!dcToken || !managerToken) {
    console.log(`⚠️  Test skipped - users not found`);
    return;
  }
  
  // Test 1a: DataCollector should be denied
  console.log(`\n📝 Test 1a: DataCollector bulk approval (should fail)...`);
  const dcResult = await makeRequest(`${API_BASE}/companies/approvals/bulk`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${dcToken}` },
    body: JSON.stringify({ ids: [], action: 'approve' })
  });
  
  if (dcResult.status === 403) {
    console.log(`✅ PASS: DataCollector correctly denied (403)`);
  } else {
    console.log(`❌ FAIL: Expected 403, got ${dcResult.status}`);
  }
  
  // Test 1b: Manager should be allowed
  console.log(`\n📝 Test 1b: Manager bulk approval (should succeed)...`);
  const managerResult = await makeRequest(`${API_BASE}/companies/approvals/bulk`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ ids: [], action: 'approve' })
  });
  
  if (managerResult.status !== 403) {
    console.log(`✅ PASS: Manager allowed (status: ${managerResult.status})`);
  } else {
    console.log(`❌ FAIL: Manager denied with 403`);
  }
}

async function testFollowUpDateValidation() {
  console.log(`\n\n========================================`);
  console.log(`TEST 2: Follow-Up Date Validation`);
  console.log(`========================================`);
  
  const adminToken = await login('admin@test.com', 'password');
  if (!adminToken) {
    console.log(`⚠️  Test skipped - admin user not found`);
    return;
  }
  
  // Create test company
  console.log(`\n📝 Creating test company...`);
  const companyResult = await makeRequest(`${API_BASE}/companies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Test Company ' + Date.now(),
      contact_person: 'Test Contact'
    })
  });
  
  if (companyResult.status !== 201) {
    console.log(`⚠️  Could not create company`);
    return;
  }
  
  const companyId = companyResult.data.data?.id;
  console.log(`✅ Company created: ${companyId}`);
  
  // Test 2a: Invalid dates (follow_up < contacted)
  console.log(`\n📝 Test 2a: Invalid follow-up date (should fail)...`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const today = new Date();
  
  const invalidResult = await makeRequest(`${API_BASE}/follow-ups`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      company_id: companyId,
      contacted_date: tomorrow.toISOString().split('T')[0],
      follow_up_date: today.toISOString().split('T')[0],
      follow_up_notes: 'Should fail'
    })
  });
  
  if (invalidResult.status === 400) {
    console.log(`✅ PASS: Invalid dates rejected (400)`);
    console.log(`   Error: ${invalidResult.data.error || invalidResult.data.details?.[0]?.message}`);
  } else {
    console.log(`❌ FAIL: Expected 400, got ${invalidResult.status}`);
  }
  
  // Test 2b: Valid dates
  console.log(`\n📝 Test 2b: Valid follow-up date (should succeed)...`);
  const validResult = await makeRequest(`${API_BASE}/follow-ups`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      company_id: companyId,
      contacted_date: today.toISOString().split('T')[0],
      follow_up_date: tomorrow.toISOString().split('T')[0],
      follow_up_notes: 'Valid'
    })
  });
  
  if (validResult.status === 201) {
    console.log(`✅ PASS: Valid dates accepted (201)`);
    return validResult.data.data?.id;
  } else {
    console.log(`❌ FAIL: Expected 201, got ${validResult.status}`);
  }
}

async function testAdminDeleteWorkflow(followUpId) {
  console.log(`\n\n========================================`);
  console.log(`TEST 3: Admin-Only Follow-Up Delete`);
  console.log(`========================================`);
  
  if (!followUpId) {
    console.log(`⚠️  Test skipped - no follow-up ID`);
    return;
  }
  
  const dcToken = await login('datacollector@test.com', 'password');
  const adminToken = await login('admin@test.com', 'password');
  
  if (!dcToken || !adminToken) {
    console.log(`⚠️  Test skipped - users not found`);
    return;
  }
  
  // Test 3a: Non-admin delete (should fail)
  console.log(`\n📝 Test 3a: DataCollector delete (should fail)...`);
  const dcResult = await makeRequest(`${API_BASE}/follow-ups/${followUpId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${dcToken}` }
  });
  
  if (dcResult.status === 403) {
    console.log(`✅ PASS: DataCollector correctly denied (403)`);
    console.log(`   Hint: ${dcResult.data.hint}`);
  } else {
    console.log(`❌ FAIL: Expected 403, got ${dcResult.status}`);
  }
  
  // Test 3b: Admin delete (should succeed)
  console.log(`\n📝 Test 3b: Admin delete (should succeed)...`);
  const adminResult = await makeRequest(`${API_BASE}/follow-ups/${followUpId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (adminResult.status === 200) {
    console.log(`✅ PASS: Admin delete successful (200)`);
  } else {
    console.log(`❌ FAIL: Expected 200, got ${adminResult.status}`);
  }
}

async function testCSVImport() {
  console.log(`\n\n========================================`);
  console.log(`TEST 4: CSV Import Server Endpoint`);
  console.log(`========================================`);
  
  const adminToken = await login('admin@test.com', 'password');
  if (!adminToken) {
    console.log(`⚠️  Test skipped - admin user not found`);
    return;
  }
  
  // Test 4a: Invalid import (missing name)
  console.log(`\n📝 Test 4a: Invalid import data (should fail)...`);
  const invalidResult = await makeRequest(`${API_BASE}/companies/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      companies: [{ email: 'test@example.com' }] // Missing name
    })
  });
  
  if (invalidResult.status === 400) {
    console.log(`✅ PASS: Invalid data rejected (400)`);
  } else {
    console.log(`❌ FAIL: Expected 400, got ${invalidResult.status}`);
  }
  
  // Test 4b: Valid import
  console.log(`\n📝 Test 4b: Valid import (should succeed)...`);
  const validResult = await makeRequest(`${API_BASE}/companies/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      companies: [
        {
          name: 'Import Test 1 ' + Date.now(),
          contact_person: 'Test',
          company_type: 'YES',
          conversionStatus: 'Waiting'
        },
        {
          name: 'Import Test 2 ' + Date.now(),
          contact_person: 'Test',
          company_type: 'NO',
          conversionStatus: 'Contacted'
        }
      ]
    })
  });
  
  if ([201, 207].includes(validResult.status)) {
    console.log(`✅ PASS: Import successful (${validResult.status})`);
    console.log(`   Imported: ${validResult.data.data?.imported || 0}`);
  } else {
    console.log(`❌ FAIL: Expected 201/207, got ${validResult.status}`);
  }
  
  // Test 4c: Limit check
  console.log(`\n📝 Test 4c: Import limit check (should fail)...`);
  const tooMany = Array.from({ length: 1001 }, (_, i) => ({
    name: `Company ${i}`,
    contact_person: 'Test'
  }));
  
  const limitResult = await makeRequest(`${API_BASE}/companies/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ companies: tooMany })
  });
  
  if (limitResult.status === 400) {
    console.log(`✅ PASS: Limit enforced (400)`);
  } else {
    console.log(`❌ FAIL: Expected 400, got ${limitResult.status}`);
  }
}

async function testFinalizeValidation() {
  console.log(`\n\n========================================`);
  console.log(`TEST 5: Finalize Status Validation`);
  console.log(`========================================`);
  
  const adminToken = await login('admin@test.com', 'password');
  if (!adminToken) {
    console.log(`⚠️  Test skipped - admin user not found`);
    return;
  }
  
  // Create unconfirmed company
  console.log(`\n📝 Creating unconfirmed company...`);
  const unconfirmedResult = await makeRequest(`${API_BASE}/companies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Unconfirmed ' + Date.now(),
      contact_person: 'Test',
      conversionStatus: 'Waiting'
    })
  });
  
  const unconfirmedId = unconfirmedResult.data.data?.id;
  
  // Test 5a: Finalize unconfirmed (should fail)
  console.log(`\n📝 Test 5a: Finalize Waiting status (should fail)...`);
  const failResult = await makeRequest(`${API_BASE}/companies/${unconfirmedId}/finalize`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (failResult.status === 500 && failResult.data.error?.includes('Confirmed')) {
    console.log(`✅ PASS: Unconfirmed company rejected`);
  } else {
    console.log(`❌ FAIL: Expected error about Confirmed status`);
  }
  
  // Create confirmed company
  console.log(`\n📝 Creating confirmed company...`);
  const confirmedResult = await makeRequest(`${API_BASE}/companies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Confirmed ' + Date.now(),
      contact_person: 'Test',
      conversionStatus: 'Confirmed'
    })
  });
  
  const confirmedId = confirmedResult.data.data?.id;
  
  // Test 5b: Finalize confirmed (should succeed)
  console.log(`\n📝 Test 5b: Finalize Confirmed status (should succeed)...`);
  const successResult = await makeRequest(`${API_BASE}/companies/${confirmedId}/finalize`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (successResult.status === 200) {
    console.log(`✅ PASS: Confirmed company finalized`);
  } else {
    console.log(`❌ FAIL: Expected 200, got ${successResult.status}`);
  }
  
  // Test 5c: Duplicate finalize (should fail)
  console.log(`\n📝 Test 5c: Duplicate finalize (should fail)...`);
  const dupResult = await makeRequest(`${API_BASE}/companies/${confirmedId}/finalize`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (dupResult.status === 500 && dupResult.data.error?.includes('already finalized')) {
    console.log(`✅ PASS: Duplicate finalize rejected`);
  } else {
    console.log(`❌ FAIL: Expected error about already finalized`);
  }
}

async function runAllTests() {
  console.log(`\n\n╔════════════════════════════════════════╗`);
  console.log(`║  Backend Fixes Test Suite             ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`\nNote: Tests require the following test users:`);
  console.log(`  - admin@test.com (password: password)`);
  console.log(`  - manager@test.com (password: password)`);
  console.log(`  - datacollector@test.com (password: password)`);
  
  try {
    await testBulkApprovalAuth();
    const followUpId = await testFollowUpDateValidation();
    await testAdminDeleteWorkflow(followUpId);
    await testCSVImport();
    await testFinalizeValidation();
    
    console.log(`\n\n╔════════════════════════════════════════╗`);
    console.log(`║  Test Suite Complete                   ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
  } catch (error) {
    console.error(`\n❌ Test suite error:`, error);
  }
}

// Run tests
runAllTests();
