require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/patients';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtdTBweXVyNzAwMDA1MHZneTZjdDZ0Y3IiLCJlbWFpbCI6Im5pa2lscGFuY2hhbDBAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzkxNDYwOTMxLCJleHAiOjE3OTE0NjQ1MzEsImF1ZCI6ImxhYmNvcmUtd2ViIiwiaXNzIjoibGFiY29yZS1hcGkifQ.l-udEUfUZTx9h6uHUL4jFqi3DgbZUMcvAB4VgbAW0CI'; // Generated token

async function testEndpoint(method, endpoint, body = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`${response.ok ? '✅' : '❌'} ${method} ${endpoint} (${response.status})`);
    if (!response.ok) console.log(`   Error: ${JSON.stringify(data)}`);
    return { ok: response.ok, data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { ok: false, data: null };
  }
}

async function runTests() {
  console.log('=== Patient Module E2E Test ===');
  
  // 1. Count
  await testEndpoint('GET', '/count');
  
  // 2. List
  const listRes = await testEndpoint('GET', '?page=1&limit=5');
  console.log('List Patients response:', JSON.stringify(listRes.data, null, 2));
  let patientId = null;
  if (listRes.ok && listRes.data.data && listRes.data.data.length > 0) {
    patientId = listRes.data.data[0].id;
  }
  
  // 3. Analytics
  await testEndpoint('GET', '/analytics/registrations');
  await testEndpoint('GET', '/analytics/demographics');
  await testEndpoint('GET', '/analytics/top-patients');
  
  // 4. Drafts
  await testEndpoint('GET', '/drafts');
  
  // 5. Individual Patient Endpoints
  if (patientId) {
    await testEndpoint('GET', `/${patientId}`);
    await testEndpoint('GET', `/${patientId}/family`);
    await testEndpoint('GET', `/${patientId}/history`);
    await testEndpoint('GET', `/${patientId}/consents`);
  } else {
    console.log('⚠️ No patient ID found to test individual endpoints.');
  }
  
  // 6. Create Patient
  const newPatient = {
    uhid: 'LC-TEST-' + Date.now(),
    firstName: 'End',
    lastName: 'Toend',
    gender: 'FEMALE',
    dateOfBirth: '1995-05-05T00:00:00.000Z',
    phone: '+91 9999999999',
    bloodGroup: 'B+',
    address: 'Test Addr',
    city: 'City',
    state: 'State',
    pincode: '123123',
    patientType: 'GENERAL'
  };
  
  const createRes = await testEndpoint('POST', '/', newPatient);
  if (createRes.ok && createRes.data.data) {
    const newId = createRes.data.data.id;
    await testEndpoint('PATCH', `/${newId}`, { firstName: 'UpdatedEnd' });
    await testEndpoint('DELETE', `/${newId}`);
  }
  
  console.log('=== Done ===');
}

runTests();
