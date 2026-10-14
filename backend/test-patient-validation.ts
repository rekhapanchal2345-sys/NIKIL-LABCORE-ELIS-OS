import { createPatientSchema } from './api/src/modules/patients/patient.validation';
import { buildPatientData } from './api/src/modules/patients/patient.mapper';

function testValidation() {
  console.log('Testing createPatientSchema validation...');
  
  const frontendPayload = {
    title: 'Mr',
    firstName: 'Aarav',
    lastName: 'Patel',
    gender: 'MALE',
    dateOfBirth: '1992-04-15',
    patientType: 'GENERAL',
    phone: '9876543210',
    whatsappNumber: '9876543210',
    email: 'aarav.patel@example.com',
    address: '42 MG Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380001',
    country: 'India',
    bloodGroup: 'O+',
    maritalStatus: 'MARRIED',
    emergencyContactName: 'Priya Patel',
    emergencyContactRelationship: 'SPOUSE',
    emergencyContactPhone: '9876543211',
    allergies: ['Penicillin', 'Peanuts'],
    chronicDiseases: ['Hypertension'],
    medicalConditions: ['Hypertension'],
    currentMedications: [{ name: 'Amlodipine 5mg' }],
    hasInsurance: true,
    insuranceProvider: 'Star Health',
    insuranceNumber: 'SH12345678',
    preferredLanguage: 'English',
    preferredCommunicationMethod: 'WHATSAPP',
    notificationPreferences: ['WhatsApp', 'Email'],
    communicationPreference: { sms: true, email: true, whatsapp: true, call: true },
    consentForTreatment: true,
    consentForDataSharing: true,
    privacyConsent: true,
    dpdpConsent: {
      version: 'DPDP-v1.0-2024',
      timestamp: new Date().toISOString(),
      clinicalDiagnostics: true,
      digitalCommunication: true,
      abhaRecordExchange: true,
    },
    abhaNumber: '12-3456-7890-1234',
    abhaAddress: 'aarav@abdm',
    notes: 'Routine health checkup'
  };

  const parsed = createPatientSchema.body.safeParse(frontendPayload);
  if (!parsed.success) {
    console.error('❌ Validation failed:');
    console.error(JSON.stringify(parsed.error.issues, null, 2));
  } else {
    console.log('✅ Validation passed!');
    console.log('Parsed data:', parsed.data);

    const mapped = buildPatientData(parsed.data, undefined, { strict: true });
    console.log('Mapped Prisma data:', mapped);
    
    // Check if critical fields were retained:
    console.log('Retained abhaNumber:', (mapped as any).abhaNumber);
    console.log('Retained abhaAddress:', (mapped as any).abhaAddress);
    console.log('Retained pincode:', (mapped as any).pincode);
    console.log('Retained bloodGroup:', (mapped as any).bloodGroup);
    console.log('Retained allergies:', (mapped as any).allergies);
    console.log('Retained chronicDiseases:', (mapped as any).chronicDiseases);
    console.log('Retained currentMedications:', (mapped as any).currentMedications);
  }
}

testValidation();
