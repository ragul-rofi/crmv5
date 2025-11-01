import { spawn } from 'child_process';
import fetch from 'node-fetch';

console.log('🚀 Starting comprehensive server test...\n');

// Start server
const server = spawn('pnpm', ['run', 'server'], {
  stdio: 'pipe',
  shell: true
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('SERVER:', output);
  
  if (output.includes('Server running on port')) {
    serverReady = true;
    setTimeout(runTests, 2000); // Wait 2 seconds for server to be fully ready
  }
});

server.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString());
});

async function runTests() {
  if (!serverReady) {
    console.log('❌ Server not ready, skipping tests');
    return;
  }

  console.log('\n🧪 Running comprehensive tests...\n');

  const tests = [
    {
      name: 'Database Health Check',
      url: 'http://localhost:5000/api/health-check/full',
      method: 'GET'
    },
    {
      name: 'Basic Health Check',
      url: 'http://localhost:5000/health',
      method: 'GET'
    },
    {
      name: 'Test Companies (no auth)',
      url: 'http://localhost:5000/api/test/companies',
      method: 'GET'
    },
    {
      name: 'Test Tables',
      url: 'http://localhost:5000/api/test/tables',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(test.url, { method: test.method });
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${test.name}: PASSED`);
        if (test.name === 'Database Health Check') {
          console.log(`   - Database: ${data.database}`);
          console.log(`   - Tables: ${data.tables?.length || 0} found`);
          console.log(`   - Sample Data: ${JSON.stringify(data.sampleData)}`);
        }
      } else {
        console.log(`❌ ${test.name}: FAILED - ${response.status}`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }

  // Test authentication
  console.log('🔐 Testing Authentication...');
  try {
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login: PASSED');
      console.log(`   User: ${loginData.user?.email} (${loginData.user?.role})`);
      
      // Test authenticated endpoint
      const authResponse = await fetch('http://localhost:5000/api/companies', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      
      if (authResponse.ok) {
        const companiesData = await authResponse.json();
        console.log('✅ Authenticated Companies API: PASSED');
        console.log(`   Companies found: ${companiesData.data?.length || 0}`);
      } else {
        console.log('❌ Authenticated Companies API: FAILED');
      }
    } else {
      console.log('❌ Login: FAILED');
      const errorData = await loginResponse.json();
      console.log(`   Error: ${errorData.error}`);
    }
  } catch (error) {
    console.log(`❌ Authentication Test: ERROR - ${error.message}`);
  }

  console.log('\n🏁 Test completed. Press Ctrl+C to stop server.');
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  server.kill();
  process.exit(0);
});

setTimeout(() => {
  if (!serverReady) {
    console.log('❌ Server failed to start within 30 seconds');
    server.kill();
    process.exit(1);
  }
}, 30000);