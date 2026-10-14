// Comprehensive API Testing Script
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function login() {
  const email = process.env.TEST_EMAIL || process.env.ADMIN_EMAIL || 'admin@labcore.local';
  const password = process.env.TEST_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ TEST_PASSWORD or ADMIN_PASSWORD is not set in environment. Please set it in backend/.env');
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
    console.log('❌ Login failed');
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testEndpoint(method, endpoint, body = null, description = '') {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${description || endpoint} (${response.status})`);
    
    if (!response.ok) {
      console.log(`   Error: ${data.message || JSON.stringify(data)}`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ ${description || endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== LabCore ELIS API Testing ===\n');

  // Login
  if (!await login()) {
    console.log('Cannot proceed without authentication');
    return;
  }

  console.log('\n--- Testing Core Modules ---\n');

  // Dashboard
  await testEndpoint('GET', '/dashboard/stats', null, 'Dashboard Stats');

  // Patients
  await testEndpoint('GET', '/patients?page=1&limit=10', null, 'List Patients');
  await testEndpoint('GET', '/patients/count', null, 'Count Patients');

  // Orders
  await testEndpoint('GET', '/orders?page=1&limit=10', null, 'List Orders');
  await testEndpoint('GET', '/orders/count', null, 'Count Orders');

  // Results
  await testEndpoint('GET', '/results?page=1&limit=10', null, 'List Results');
  await testEndpoint('GET', '/results/count', null, 'Count Results');

  // Samples
  await testEndpoint('GET', '/samples?page=1&limit=10', null, 'List Samples');
  await testEndpoint('GET', '/samples/count', null, 'Count Samples');

  // Tests
  await testEndpoint('GET', '/tests?page=1&limit=10', null, 'List Tests');
  await testEndpoint('GET', '/tests/count', null, 'Count Tests');

  // Doctors
  await testEndpoint('GET', '/doctors?page=1&limit=10', null, 'List Doctors');
  await testEndpoint('GET', '/doctors/count', null, 'Count Doctors');

  // Reports
  await testEndpoint('GET', '/reports?page=1&limit=10', null, 'List Reports');
  await testEndpoint('GET', '/reports/count', null, 'Count Reports');

  // Invoices
  await testEndpoint('GET', '/invoices?page=1&limit=10', null, 'List Invoices');
  await testEndpoint('GET', '/invoices/count', null, 'Count Invoices');

  // Payments
  await testEndpoint('GET', '/payments?page=1&limit=10', null, 'List Payments');
  await testEndpoint('GET', '/payments/count', null, 'Count Payments');

  // Analyzers
  await testEndpoint('GET', '/analyzers?page=1&limit=10', null, 'List Analyzers');
  await testEndpoint('GET', '/analyzers/count', null, 'Count Analyzers');

  // Users
  await testEndpoint('GET', '/users?page=1&limit=10', null, 'List Users');
  await testEndpoint('GET', '/users/count', null, 'Count Users');

  // Settings
  await testEndpoint('GET', '/settings/laboratory', null, 'Lab Settings');

  // Notifications
  await testEndpoint('GET', '/notifications/templates', null, 'Notification Templates');

  // Backup
  await testEndpoint('GET', '/backups', null, 'List Backups');

  // Audit
  await testEndpoint('GET', '/audit?page=1&limit=10', null, 'Audit Logs');

  console.log('\n--- Testing CRUD Operations ---\n');

  // Test creating a patient
  const newPatient = {
    uhid: 'LC-TEST-001',
    firstName: 'Test',
    lastName: 'User',
    gender: 'MALE',
    dateOfBirth: '1990-01-01',
    phone: '+91 9876543210',
    email: 'test@example.com',
    bloodGroup: 'O+',
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456'
  };

  const createPatient = await testEndpoint('POST', '/patients', newPatient, 'Create Patient');
  
  if (createPatient) {
    console.log('✅ Patient creation test passed');
  }

  console.log('\n=== Testing Complete ===');
}

runTests();