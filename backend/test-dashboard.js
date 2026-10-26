require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function login() {
  const email = process.env.ADMIN_EMAIL || 'admin@labcore.local';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ ADMIN_PASSWORD is not set in environment. Please set it in backend/.env');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success && data.data.token) {
      authToken = data.data.token;
      console.log('✅ Login successful');
      return true;
    }
    console.log('❌ Login failed:', data.message);
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testDashboardEndpoints() {
  console.log('\n=== Testing Dashboard Endpoints ===\n');
  
  const endpoints = [
    { name: 'Dashboard Stats', path: '/dashboard/stats' },
    { name: 'Unified Hospital Metrics', path: '/dashboard/metrics' },
    { name: 'Order Stats', path: '/dashboard/orders' },
    { name: 'Approval Queue', path: '/dashboard/approvals/queue?limit=5' },
    { name: 'Attention Results', path: '/dashboard/results/attention?limit=5' },
    { name: 'Sample Stats', path: '/dashboard/samples' },
    { name: 'Payment Analytics', path: '/dashboard/payments' },
    { name: 'Test Analytics', path: '/dashboard/tests' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name} (${response.status})`);
      } else {
        console.log(`❌ ${endpoint.name} (${response.status})`);
        console.log(`   Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Network error: ${error.message}`);
    }
  }
}

async function main() {
  if (await login()) {
    await testDashboardEndpoints();
  }
}

main();