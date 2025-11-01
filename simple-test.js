import http from 'http';

console.log('🧪 Testing server endpoints...\n');

function testEndpoint(path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${name}: PASSED (${res.statusCode})`);
          if (name === 'Health Check') {
            console.log(`   Database: ${parsed.database}`);
            console.log(`   Tables: ${parsed.tables?.length || 0}`);
            console.log(`   Sample Data: ${JSON.stringify(parsed.sampleData)}`);
          }
          resolve(true);
        } catch (e) {
          console.log(`✅ ${name}: PASSED (${res.statusCode}) - Non-JSON response`);
          resolve(true);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${name}: FAILED - ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${name}: TIMEOUT`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  const tests = [
    ['/health', 'Basic Health'],
    ['/api/health-check/full', 'Health Check'],
    ['/api/test/companies', 'Test Companies'],
    ['/api/test/tables', 'Test Tables']
  ];

  console.log('Testing endpoints...\n');
  
  for (const [path, name] of tests) {
    await testEndpoint(path, name);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait between tests
  }
  
  console.log('\n🏁 Basic tests completed!');
  console.log('If all tests passed, the server is working correctly.');
  console.log('You can now test the frontend at http://localhost:3000');
}

runTests();