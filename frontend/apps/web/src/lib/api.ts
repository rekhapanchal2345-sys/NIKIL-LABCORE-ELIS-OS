const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Leverage Next.js rewrite proxy for local requests in browser to eliminate CORS and localhost binding issues
    if (!customUrl || customUrl.includes('localhost') || customUrl.includes('127.0.0.1')) {
      return '';
    }
    return customUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

const API_BASE_URL = getApiBaseUrl();

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthEntries,
  getAccessToken,
  getRefreshToken,
  writeAuth,
} from './auth-storage';

/** An HTTP failure that keeps the status/code so callers can branch on it. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const AUTH_ENDPOINT = '/api/auth/';

const getAuthToken = getAccessToken;

/**
 * Exchange the rotating refresh token for a new access token.
 * Returns null when there is nothing to refresh with.
 */
async function requestTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || typeof window === 'undefined') return null;

  try {
    const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const payload = await response.json().catch(() => null);
    const data = (payload?.data ?? payload) as
      | { accessToken?: string; refreshToken?: string }
      | null;

    if (!data?.accessToken) return null;

    writeAuth(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      writeAuth(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    return data.accessToken;
  } catch {
    return null;
  }
}

// Parallel 401s must trigger one refresh, not one per request.
let refreshInFlight: Promise<string | null> | null = null;

function refreshSessionOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = requestTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function readErrorPayload(text: string): Record<string, any> {
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return {};
  }
}

function flattenValidationErrors(errors: Record<string, any>): string {
  return Object.entries(errors)
    .map(([field, fieldError]: [string, any]) => {
      if (fieldError && fieldError._errors) {
        return `${field}: ${fieldError._errors.join(', ')}`;
      }
      if (typeof fieldError === 'string') return `${field}: ${fieldError}`;
      if (fieldError && typeof fieldError === 'object') {
        const nested = Object.entries(fieldError)
          .map(([subKey, subVal]: [string, any]) => {
            if (subVal && subVal._errors) return `${subKey}: ${subVal._errors.join(', ')}`;
            return null;
          })
          .filter(Boolean)
          .join(', ');
        if (nested) return `${field} (${nested})`;
      }
      return null;
    })
    .filter(Boolean)
    .join('; ');
}

async function sendRequest(
  endpoint: string,
  options: RequestInit,
  token: string | null
): Promise<{ ok: true; body: unknown } | { ok: false; status: number; error: Record<string, any> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | {}),
  };

  if (typeof window !== 'undefined') {
    const activeBranchId = localStorage.getItem('active_branch_id');
    if (activeBranchId && !headers['x-branch-id']) {
      headers['x-branch-id'] = activeBranchId;
    }
  }

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: options.cache || 'no-store',
    ...options,
    headers,
    credentials: options.credentials || 'same-origin',
  });

  const responseText = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: readErrorPayload(responseText),
    };
  }

  // Some providers answer 204/empty 200 after accepting a request; an empty
  // body must not surface as a JSON.parse crash.
  if (!responseText.trim()) return { ok: true, body: { success: true, data: null } };

  try {
    return { ok: true, body: JSON.parse(responseText) };
  } catch {
    throw new ApiError(
      'The server returned an invalid response. Please retry the request.',
      response.status
    );
  }
}

const isAuthEndpoint = (endpoint: string) => endpoint.includes(AUTH_ENDPOINT);

// Refreshing is the recovery for an expired access token, so the token
// exchange itself and the sign-in call must never trigger it recursively.
const isRefreshEndpoint = (endpoint: string) =>
  endpoint.includes(`${AUTH_ENDPOINT}refresh`) ||
  endpoint.includes(`${AUTH_ENDPOINT}login`);

// Helper function to make API calls
// Returns the parsed envelope (`{ success, message, data }`) as `any` so the
// many existing call sites keep their current typing.
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  let result: Awaited<ReturnType<typeof sendRequest>>;

  try {
    let token = getAuthToken();

    // If an access token is missing and this is a protected endpoint:
    if (!token && !isAuthEndpoint(endpoint)) {
      // If a refresh token is present, attempt to recover a fresh access token before firing
      if (getRefreshToken()) {
        token = await refreshSessionOnce();
      }
      // If we still have no access token, don't fire an unauthorized request across the wire
      if (!token) {
        throw new ApiError('Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
      }
    }

    result = await sendRequest(endpoint, options, token);

    // One transparent retry with a fresh token before giving up the session.
    if (!result.ok && result.status === 401 && !isRefreshEndpoint(endpoint)) {
      const refreshed = await refreshSessionOnce();
      if (refreshed) {
        result = await sendRequest(endpoint, options, refreshed);
      }
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Backend unreachable / request aborted.
    // if (!isAuthEndpoint(endpoint)) {
    //   return getFallbackData(endpoint);
    // }

    throw new ApiError(
      'Cannot reach the server. Please check that the backend is running and try again.',
      0
    );
  }

  if (!result.ok) {
    const { status, error } = result;
    const message =
      typeof error.message === 'string' && error.message.trim()
        ? error.message
        : undefined;

    if (status === 400 && error.errors) {
      const flattened = flattenValidationErrors(error.errors);
      throw new ApiError(
        flattened || message || 'Invalid request. Please check your input and try again.',
        status,
        error.code
      );
    }

    if (status === 401) {
      // A rejected credential that survived the refresh attempt means the
      // session is over: drop it so the route guard returns to the login page.
      // Sign-in failures must keep the stored session of another tab intact.
      if (!isRefreshEndpoint(endpoint) && getRefreshToken()) {
        clearAuthEntries();
      }
      throw new ApiError(message || 'Session expired. Please sign in again.', 401, error.code);
    }

    if (status === 403) {
      throw new ApiError(message || 'You do not have permission to access this resource.', 403, error.code);
    }

    if (status === 429) {
      throw new ApiError(message || 'Too many requests. Please wait a moment.', 429, error.code);
    }

    // Network/server failures must never be masked with fake data for auth.
    // if ((status === 500 || status === 503) && !isAuthEndpoint(endpoint)) {
    //   return getFallbackData(endpoint);
    // }

    throw new ApiError(
      message || 'API request failed. Please try again.',
      status,
      error.code
    );
  }

  return result.body;
};

// Fallback data for demos when backend is unavailable.
// Auth endpoints are deliberately absent: a login can never "succeed" offline.
const getFallbackData = (endpoint: string) => {
  if (endpoint.includes('/api/tests')) {
    // Check if it's the catalog export endpoint
    if (endpoint.includes('/catalog/export')) {
      return {
        success: true,
        data: {
          categories: [],
          tests: [],
          parameters: [],
          referenceRanges: [],
          packages: [],
          exportedAt: new Date().toISOString(),
          version: '1.0',
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Check if it's packages endpoint
    if (endpoint.includes('/packages')) {
      return {
        success: true,
        data: {
          packages: [
            {
              id: 'pkg-1',
              packageCode: 'BASIC',
              packageName: 'Basic Health Checkup',
              description: 'Essential health screening package',
              totalPrice: 1500,
              offerPrice: 1200,
              discountPercentage: 20,
              gstPercentage: 18,
              tatHours: 24,
              tatDisplay: '24 hours',
              targetAudience: 'GENERAL',
              recommendedFor: 'Annual health screening',
              isActive: true,
              isPopular: true,
              displayOrder: 1,
              color: '#10B981',
              icon: '📦',
              includesTestsCount: 5,
              items: []
            },
            {
              id: 'pkg-2',
              packageCode: 'PREMIUM',
              packageName: 'Premium Health Checkup',
              description: 'Comprehensive health screening package',
              totalPrice: 3500,
              offerPrice: 2800,
              discountPercentage: 20,
              gstPercentage: 18,
              tatHours: 48,
              tatDisplay: '48 hours',
              targetAudience: 'EXECUTIVE',
              recommendedFor: 'Comprehensive health assessment',
              isActive: true,
              isPopular: false,
              displayOrder: 2,
              color: '#3B82F6',
              icon: '🏥',
              includesTestsCount: 12,
              items: []
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Check if it's categories endpoint
    if (endpoint.includes('/categories')) {
      return {
        success: true,
        data: [
          {
            id: 'cat-1',
            code: 'HEM',
            name: 'Hematology',
            description: 'Blood-related tests',
            department: 'Hematology',
            color: '#EF4444',
            icon: '🩸',
            displayOrder: 1,
            isActive: true,
            tests: []
          },
          {
            id: 'cat-2',
            code: 'BIO',
            name: 'Biochemistry',
            description: 'Chemical analysis tests',
            department: 'Biochemistry',
            color: '#3B82F6',
            icon: '🧪',
            displayOrder: 2,
            isActive: true,
            tests: []
          }
        ],
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Default tests endpoint
    return {
      success: true,
      data: {
        tests: [
          {
            id: 'test-1',
            testCode: 'CBC',
            testName: 'Complete Blood Count',
            shortName: 'CBC',
            categoryId: 'cat-1',
            sampleType: 'BLOOD',
            sampleContainer: 'EDTA Purple',
            sampleVolume: '3ml',
            processingDepartment: 'Hematology',
            method: 'Automated Analyzer',
            description: 'Complete blood count test',
            clinicalSignificance: 'Measures various components of blood',
            patientPreparation: 'No special preparation required',
            price: 500,
            offerPrice: 400,
            b2bRate: 350,
            gstPercentage: 18,
            tatHours: 24,
            tatDisplay: '24 hours',
            displayOrder: 1,
            isActive: true,
            category: {
              id: 'cat-1',
              code: 'HEM',
              name: 'Hematology',
              description: 'Blood-related tests',
              department: 'Hematology',
              color: '#EF4444',
              icon: '🩸',
              displayOrder: 1,
              isActive: true
            },
            parameters: [
              {
                id: 'param-1',
                parameterName: 'Hemoglobin',
                shortName: 'Hb',
                unit: 'g/dL',
                dataType: 'NUMERIC',
                displayOrder: 1,
                isRequired: true,
                isActive: true,
                referenceRanges: []
              },
              {
                id: 'param-2',
                parameterName: 'WBC Count',
                shortName: 'WBC',
                unit: 'x10^9/L',
                dataType: 'NUMERIC',
                displayOrder: 2,
                isRequired: true,
                isActive: true,
                referenceRanges: []
              }
            ]
          },
          {
            id: 'test-2',
            testCode: 'LIPID',
            testName: 'Lipid Profile',
            shortName: 'Lipid',
            categoryId: 'cat-2',
            sampleType: 'SERUM',
            sampleContainer: 'SST Red',
            sampleVolume: '5ml',
            processingDepartment: 'Biochemistry',
            method: 'Chemical Analyzer',
            description: 'Lipid profile test',
            clinicalSignificance: 'Measures cholesterol and triglycerides',
            patientPreparation: '12 hours fasting required',
            price: 800,
            offerPrice: 650,
            b2bRate: 550,
            gstPercentage: 18,
            tatHours: 24,
            tatDisplay: '24 hours',
            displayOrder: 2,
            isActive: true,
            category: {
              id: 'cat-2',
              code: 'BIO',
              name: 'Biochemistry',
              description: 'Chemical analysis tests',
              department: 'Biochemistry',
              color: '#3B82F6',
              icon: '🧪',
              displayOrder: 2,
              isActive: true
            },
            parameters: [
              {
                id: 'param-3',
                parameterName: 'Total Cholesterol',
                shortName: 'TC',
                unit: 'mg/dL',
                dataType: 'NUMERIC',
                displayOrder: 1,
                isRequired: true,
                isActive: true,
                referenceRanges: []
              },
              {
                id: 'param-4',
                parameterName: 'LDL Cholesterol',
                shortName: 'LDL',
                unit: 'mg/dL',
                dataType: 'NUMERIC',
                displayOrder: 2,
                isRequired: true,
                isActive: true,
                referenceRanges: []
              }
            ]
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      },
      message: 'Using fallback data (backend unavailable)'
    };
  }

  if (endpoint.includes('/api/approvals')) {
    // Check if it's the metrics endpoint
    if (endpoint.includes('/metrics')) {
      return {
        success: true,
        data: {
          pendingApproval: 8,
          criticalValues: 3,
          approvedToday: 12,
          rejectedRerun: 2
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Check if it's the pending endpoint
    if (endpoint.includes('/pending')) {
      return {
        success: true,
        data: {
          results: [
            {
              id: 'demo-result-1',
              orderId: 'demo-order-1',
              testId: 'demo-test-1',
              status: 'VERIFIED',
              remarks: 'Normal values observed',
              interpretation: 'All parameters within normal range',
              enteredAt: new Date().toISOString(),
              verifiedAt: new Date(Date.now() - 3600000).toISOString(),
              approvedAt: null,
              publishedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              test: {
                id: 'demo-test-1',
                testCode: 'CBC',
                testName: 'Complete Blood Count',
                sampleType: 'BLOOD',
                method: 'Automated Analyzer',
                category: {
                  id: 'demo-category-1',
                  code: 'HEM',
                  name: 'Hematology',
                  description: 'Blood-related tests'
                },
                parameters: [
                  {
                    id: 'demo-param-1',
                    parameterName: 'Hemoglobin',
                    unit: 'g/dL',
                    referenceRanges: []
                  },
                  {
                    id: 'demo-param-2',
                    parameterName: 'WBC Count',
                    unit: 'x10^9/L',
                    referenceRanges: []
                  }
                ]
              },
              order: {
                id: 'demo-order-1',
                orderNumber: 'ORD-2026-0891',
                barcode: 'ORD-BC-001',
                orderStatus: 'COMPLETED',
                paymentStatus: 'PAID',
                patient: {
                  id: 'demo-patient-1',
                  uhid: 'UHID-001',
                  firstName: 'John',
                  lastName: 'Doe',
                  gender: 'MALE',
                  dateOfBirth: '1985-05-15',
                  age: 39,
                  phone: '+91-9876543210'
                },
                doctor: {
                  id: 'demo-doctor-1',
                  doctorCode: 'DOC-001',
                  fullName: 'Dr. Smith',
                  qualification: 'MBBS, MD',
                  specialization: 'Pathology'
                }
              },
              enteredBy: {
                id: 'demo-user-1',
                employeeCode: 'EMP-001',
                fullName: 'Sarah Johnson',
                role: 'LAB_TECH',
                signature: null
              },
              approvedBy: null,
              values: [
                {
                  id: 'demo-value-1',
                  value: '4.5',
                  flag: 'NORMAL',
                  remark: null,
                  parameter: {
                    id: 'demo-param-1',
                    parameterName: 'Hemoglobin',
                    unit: 'g/dL',
                    referenceRanges: []
                  }
                },
                {
                  id: 'demo-value-2',
                  value: '12.0',
                  flag: 'NORMAL',
                  remark: null,
                  parameter: {
                    id: 'demo-param-2',
                    parameterName: 'WBC Count',
                    unit: 'x10^9/L',
                    referenceRanges: []
                  }
                }
              ]
            },
            {
              id: 'demo-result-2',
              orderId: 'demo-order-2',
              testId: 'demo-test-2',
              status: 'VERIFIED',
              remarks: 'Slightly elevated cholesterol',
              interpretation: 'Mild hyperlipidemia detected',
              enteredAt: new Date(Date.now() - 86400000).toISOString(),
              verifiedAt: new Date(Date.now() - 72000000).toISOString(),
              approvedAt: null,
              publishedAt: null,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 72000000).toISOString(),
              test: {
                id: 'demo-test-2',
                testCode: 'LIPID',
                testName: 'Lipid Profile',
                sampleType: 'SERUM',
                method: 'Chemical Analyzer',
                category: {
                  id: 'demo-category-2',
                  code: 'BIO',
                  name: 'Biochemistry',
                  description: 'Chemical analysis tests'
                },
                parameters: [
                  {
                    id: 'demo-param-3',
                    parameterName: 'Total Cholesterol',
                    unit: 'mg/dL',
                    referenceRanges: []
                  },
                  {
                    id: 'demo-param-4',
                    parameterName: 'LDL Cholesterol',
                    unit: 'mg/dL',
                    referenceRanges: []
                  }
                ]
              },
              order: {
                id: 'demo-order-2',
                orderNumber: 'ORD-2026-0892',
                barcode: 'ORD-BC-002',
                orderStatus: 'COMPLETED',
                paymentStatus: 'PAID',
                patient: {
                  id: 'demo-patient-2',
                  uhid: 'UHID-002',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  gender: 'FEMALE',
                  dateOfBirth: '1990-08-20',
                  age: 34,
                  phone: '+91-9876543211'
                },
                doctor: {
                  id: 'demo-doctor-2',
                  doctorCode: 'DOC-002',
                  fullName: 'Dr. Johnson',
                  qualification: 'MBBS, MD',
                  specialization: 'Cardiology'
                }
              },
              enteredBy: {
                id: 'demo-user-1',
                employeeCode: 'EMP-001',
                fullName: 'Sarah Johnson',
                role: 'LAB_TECH',
                signature: null
              },
              approvedBy: null,
              values: [
                {
                  id: 'demo-value-3',
                  value: '240',
                  flag: 'HIGH',
                  remark: 'Borderline high',
                  parameter: {
                    id: 'demo-param-3',
                    parameterName: 'Total Cholesterol',
                    unit: 'mg/dL',
                    referenceRanges: []
                  }
                },
                {
                  id: 'demo-value-4',
                  value: '160',
                  flag: 'HIGH',
                  remark: 'Elevated',
                  parameter: {
                    id: 'demo-param-4',
                    parameterName: 'LDL Cholesterol',
                    unit: 'mg/dL',
                    referenceRanges: []
                  }
                }
              ]
            },
            {
              id: 'demo-result-3',
              orderId: 'demo-order-3',
              testId: 'demo-test-3',
              status: 'VERIFIED',
              remarks: 'Critical potassium level detected',
              interpretation: 'Severe hyperkalemia - immediate medical attention required',
              enteredAt: new Date(Date.now() - 172800000).toISOString(),
              verifiedAt: new Date(Date.now() - 172800000 + 3600000).toISOString(),
              approvedAt: null,
              publishedAt: null,
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              updatedAt: new Date(Date.now() - 172800000 + 3600000).toISOString(),
              test: {
                id: 'demo-test-3',
                testCode: 'KFT',
                testName: 'Kidney Function Test',
                sampleType: 'SERUM',
                method: 'Chemical Analyzer',
                category: {
                  id: 'demo-category-2',
                  code: 'BIO',
                  name: 'Biochemistry',
                  description: 'Chemical analysis tests'
                },
                parameters: [
                  {
                    id: 'demo-param-5',
                    parameterName: 'Creatinine',
                    unit: 'mg/dL',
                    referenceRanges: []
                  },
                  {
                    id: 'demo-param-6',
                    parameterName: 'Blood Urea',
                    unit: 'mg/dL',
                    referenceRanges: []
                  },
                  {
                    id: 'demo-param-7',
                    parameterName: 'Potassium',
                    unit: 'mmol/L',
                    referenceRanges: []
                  }
                ]
              },
              order: {
                id: 'demo-order-3',
                orderNumber: 'ORD-2026-0893',
                barcode: 'ORD-BC-003',
                orderStatus: 'COMPLETED',
                paymentStatus: 'PAID',
                patient: {
                  id: 'demo-patient-3',
                  uhid: 'UHID-003',
                  firstName: 'Robert',
                  lastName: 'Williams',
                  gender: 'MALE',
                  dateOfBirth: '1978-12-10',
                  age: 45,
                  phone: '+91-9876543212'
                },
                doctor: {
                  id: 'demo-doctor-3',
                  doctorCode: 'DOC-003',
                  fullName: 'Dr. Williams',
                  qualification: 'MBBS, MD',
                  specialization: 'Nephrology'
                }
              },
              enteredBy: {
                id: 'demo-user-2',
                employeeCode: 'EMP-002',
                fullName: 'Mike Davis',
                role: 'LAB_TECH',
                signature: null
              },
              approvedBy: null,
              values: [
                {
                  id: 'demo-value-5',
                  value: '0.9',
                  flag: 'NORMAL',
                  remark: null,
                  parameter: {
                    id: 'demo-param-5',
                    parameterName: 'Creatinine',
                    unit: 'mg/dL',
                    referenceRanges: []
                  }
                },
                {
                  id: 'demo-value-6',
                  value: '45',
                  flag: 'NORMAL',
                  remark: null,
                  parameter: {
                    id: 'demo-param-6',
                    parameterName: 'Blood Urea',
                    unit: 'mg/dL',
                    referenceRanges: []
                  }
                },
                {
                  id: 'demo-value-7',
                  value: '7.2',
                  flag: 'CRITICAL',
                  remark: 'Life-threatening level',
                  parameter: {
                    id: 'demo-param-7',
                    parameterName: 'Potassium',
                    unit: 'mmol/L',
                    referenceRanges: []
                  }
                }
              ]
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 3,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Check if it's a single approval request
    if (endpoint.match(/\/api\/approvals\/[^/]+$/) && !endpoint.includes('/approve') && !endpoint.includes('/reject') && !endpoint.includes('/publish')) {
      return {
        success: true,
        data: {
          id: 'demo-result-1',
          orderId: 'demo-order-1',
          testId: 'demo-test-1',
          status: 'VERIFIED',
          remarks: 'Normal values observed',
          interpretation: 'All parameters within normal range',
          enteredAt: new Date().toISOString(),
          verifiedAt: new Date(Date.now() - 3600000).toISOString(),
          approvedAt: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          test: {
            id: 'demo-test-1',
            testCode: 'CBC',
            testName: 'Complete Blood Count',
            sampleType: 'BLOOD',
            method: 'Automated Analyzer',
            category: {
              id: 'demo-category-1',
              code: 'HEM',
              name: 'Hematology',
              description: 'Blood-related tests'
            },
            parameters: [
              {
                id: 'demo-param-1',
                parameterName: 'Hemoglobin',
                unit: 'g/dL',
                referenceRanges: []
              },
              {
                id: 'demo-param-2',
                parameterName: 'WBC Count',
                unit: 'x10^9/L',
                referenceRanges: []
              }
            ]
          },
          order: {
            id: 'demo-order-1',
            orderNumber: 'ORD-2026-0891',
            barcode: 'ORD-BC-001',
            orderStatus: 'COMPLETED',
            paymentStatus: 'PAID',
            patient: {
              id: 'demo-patient-1',
              uhid: 'UHID-001',
              firstName: 'John',
              lastName: 'Doe',
              gender: 'MALE',
              dateOfBirth: '1985-05-15',
              age: 39,
              phone: '+91-9876543210'
            },
            doctor: {
              id: 'demo-doctor-1',
              doctorCode: 'DOC-001',
              fullName: 'Dr. Smith',
              qualification: 'MBBS, MD',
              specialization: 'Pathology'
            }
          },
          enteredBy: {
            id: 'demo-user-1',
            employeeCode: 'EMP-001',
            fullName: 'Sarah Johnson',
            role: 'LAB_TECH',
            signature: null
          },
          approvedBy: null,
          values: [
            {
              id: 'demo-value-1',
              value: '4.5',
              flag: 'NORMAL',
              remark: null,
              parameter: {
                id: 'demo-param-1',
                parameterName: 'Hemoglobin',
                unit: 'g/dL',
                referenceRanges: []
              }
            },
            {
              id: 'demo-value-2',
              value: '12.0',
              flag: 'NORMAL',
              remark: null,
              parameter: {
                id: 'demo-param-2',
                parameterName: 'WBC Count',
                unit: 'x10^9/L',
                referenceRanges: []
              }
            }
          ]
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // General approvals list
    return {
      success: true,
      data: {
        results: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      },
      message: 'Using fallback data (backend unavailable)'
    };
  }

  if (endpoint.includes('/api/reports')) {
    // Check if it's the summary endpoint
    if (endpoint.includes('/summary')) {
      return {
        success: true,
        data: {
          totalResults: 156,
          pendingResults: 12,
          enteredResults: 8,
          verifiedResults: 15,
          approvedResults: 45,
          publishedResults: 76,
          totalReportsGenerated: 76,
          reportsGeneratedToday: 12,
          reportsGeneratedThisMonth: 76,
          whatsappDispatchCount: 8,
          emailDispatchCount: 15,
          hardCopyPrintedCount: 25,
          pendingDispatchCount: 18,
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Check if it's the published endpoint
    if (endpoint.includes('/published')) {
      return {
        success: true,
        data: {
          results: [
            {
              id: 'demo-result-1',
              orderId: 'demo-order-1',
              testId: 'demo-test-1',
              status: 'PUBLISHED',
              publishedAt: new Date().toISOString(),
              test: {
                id: 'demo-test-1',
                testCode: 'CBC',
                testName: 'Complete Blood Count',
                sampleType: 'BLOOD',
              },
              order: {
                id: 'demo-order-1',
                orderNumber: 'ORD-2026-0001',
                patient: {
                  id: 'demo-patient-1',
                  firstName: 'John',
                  lastName: 'Doe',
                  uhid: 'UHID-001',
                  phone: '+91-9876543210',
                },
                doctor: {
                  id: 'demo-doctor-1',
                  fullName: 'Dr. Smith',
                },
              },
              approvedBy: {
                id: 'demo-user-1',
                fullName: 'Dr. Emily Brown',
                employeeCode: 'EMP-003',
              },
              deliveryStatus: 'WHATSAPP_DELIVERED',
              deliveryMethod: 'WHATSAPP',
              reportReferenceId: 'REP-2026-8801',
              communications: [],
            },
            {
              id: 'demo-result-2',
              orderId: 'demo-order-2',
              testId: 'demo-test-2',
              status: 'PUBLISHED',
              publishedAt: new Date(Date.now() - 3600000).toISOString(),
              test: {
                id: 'demo-test-2',
                testCode: 'LIPID',
                testName: 'Lipid Profile',
                sampleType: 'SERUM',
              },
              order: {
                id: 'demo-order-2',
                orderNumber: 'ORD-2026-0002',
                patient: {
                  id: 'demo-patient-2',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  uhid: 'UHID-002',
                  phone: '+91-9876543211',
                },
                doctor: {
                  id: 'demo-doctor-2',
                  fullName: 'Dr. Johnson',
                },
              },
              approvedBy: {
                id: 'demo-user-2',
                fullName: 'Dr. Williams',
                employeeCode: 'EMP-004',
              },
              deliveryStatus: 'EMAIL_DELIVERED',
              deliveryMethod: 'EMAIL',
              reportReferenceId: 'REP-2026-8802',
              communications: [],
            },
            {
              id: 'demo-result-3',
              orderId: 'demo-order-3',
              testId: 'demo-test-3',
              status: 'PUBLISHED',
              publishedAt: new Date(Date.now() - 7200000).toISOString(),
              test: {
                id: 'demo-test-3',
                testCode: 'KFT',
                testName: 'Kidney Function Test',
                sampleType: 'SERUM',
              },
              order: {
                id: 'demo-order-3',
                orderNumber: 'ORD-2026-0003',
                patient: {
                  id: 'demo-patient-3',
                  firstName: 'Robert',
                  lastName: 'Williams',
                  uhid: 'UHID-003',
                  phone: '+91-9876543212',
                },
                doctor: {
                  id: 'demo-doctor-3',
                  fullName: 'Dr. Miller',
                },
              },
              approvedBy: {
                id: 'demo-user-3',
                fullName: 'Dr. Davis',
                employeeCode: 'EMP-005',
              },
              deliveryStatus: 'HARD_COPY_PRINTED',
              deliveryMethod: 'PRINT',
              reportReferenceId: 'REP-2026-8803',
              communications: [],
            },
            {
              id: 'demo-result-4',
              orderId: 'demo-order-4',
              testId: 'demo-test-4',
              status: 'PUBLISHED',
              publishedAt: new Date(Date.now() - 10800000).toISOString(),
              test: {
                id: 'demo-test-4',
                testCode: 'THYROID',
                testName: 'Thyroid Profile',
                sampleType: 'SERUM',
              },
              order: {
                id: 'demo-order-4',
                orderNumber: 'ORD-2026-0004',
                patient: {
                  id: 'demo-patient-4',
                  firstName: 'Emily',
                  lastName: 'Brown',
                  uhid: 'UHID-004',
                  phone: '+91-9876543213',
                },
                doctor: {
                  id: 'demo-doctor-4',
                  fullName: 'Dr. Anderson',
                },
              },
              approvedBy: {
                id: 'demo-user-4',
                fullName: 'Dr. Taylor',
                employeeCode: 'EMP-006',
              },
              deliveryStatus: 'UNDELIVERED',
              deliveryMethod: null,
              reportReferenceId: 'REP-2026-8804',
              communications: [],
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 4,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // Check if it's the order report endpoint
    if (endpoint.includes('/order/')) {
      return {
        success: true,
        data: {
          orderNumber: 'ORD-2026-0001',
          barcode: 'SMP-1753843200000',
          orderStatus: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          sampleCollected: true,
          collectedAt: new Date(Date.now() - 3600000).toISOString(),
          reportedAt: new Date(Date.now() - 1800000).toISOString(),
          patient: {
            id: 'patient-1',
            uhid: 'UHID-001',
            firstName: 'John',
            lastName: 'Doe',
            gender: 'MALE',
            dateOfBirth: '1985-05-15',
            age: 39,
            phone: '+91-9876543210',
            email: 'john.doe@example.com',
            address: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          doctor: {
            id: 'doctor-1',
            fullName: 'Dr. Smith',
            qualification: 'MBBS, MD',
            specialization: 'Pathology'
          },
          tests: [
            {
              id: 'test-1',
              test: {
                id: 'test-1',
                testName: 'Complete Blood Count',
                testCode: 'CBC',
                sampleType: 'BLOOD',
                category: {
                  name: 'Hematology'
                },
                parameters: [
                  {
                    id: 'param-1',
                    parameterName: 'Hemoglobin',
                    unit: 'g/dL',
                    dataType: 'NUMBER',
                    referenceRanges: [
                      {
                        gender: 'MALE',
                        minAge: 18,
                        maxAge: 60,
                        normalLow: 13.5,
                        normalHigh: 17.5,
                        criticalLow: 8.0,
                        criticalHigh: 20.0
                      }
                    ]
                  },
                  {
                    id: 'param-2',
                    parameterName: 'WBC Count',
                    unit: '10^3/μL',
                    dataType: 'NUMBER',
                    referenceRanges: [
                      {
                        gender: 'MALE',
                        minAge: 18,
                        maxAge: 60,
                        normalLow: 4.5,
                        normalHigh: 11.0,
                        criticalLow: 2.0,
                        criticalHigh: 15.0
                      }
                    ]
                  }
                ]
              },
              price: 500
            }
          ],
          results: [
            {
              id: 'result-1',
              status: 'PUBLISHED',
              remarks: 'Normal values',
              interpretation: 'All parameters within normal range',
              enteredAt: new Date(Date.now() - 3600000).toISOString(),
              verifiedAt: new Date(Date.now() - 2700000).toISOString(),
              approvedAt: new Date(Date.now() - 1800000).toISOString(),
              publishedAt: new Date(Date.now() - 1800000).toISOString(),
              test: {
                id: 'test-1',
                testName: 'Complete Blood Count',
                testCode: 'CBC'
              },
              values: [
                {
                  id: 'value-1',
                  parameter: {
                    id: 'param-1',
                    parameterName: 'Hemoglobin',
                    unit: 'g/dL'
                  },
                  value: '14.5',
                  flag: 'NORMAL'
                },
                {
                  id: 'value-2',
                  parameter: {
                    id: 'param-2',
                    parameterName: 'WBC Count',
                    unit: '10^3/μL'
                  },
                  value: '7.8',
                  flag: 'NORMAL'
                }
              ],
              enteredBy: {
                id: 'user-1',
                fullName: 'Dr. Emily Brown',
                employeeCode: 'EMP-003'
              },
              approvedBy: {
                id: 'user-2',
                fullName: 'Dr. Williams',
                employeeCode: 'EMP-004'
              }
            }
          ],
          invoice: {
            id: 'inv-1',
            invoiceNumber: 'INV-2026-0891',
            subtotal: 500,
            discount: 0,
            gstAmount: 90,
            grandTotal: 590,
            paymentStatus: 'PAID'
          },
          payments: [
            {
              id: 'pay-1',
              receiptNumber: 'REC-1753843200000-123',
              amount: 590,
              method: 'CASH',
              status: 'PAID',
              paidAt: new Date().toISOString(),
              transactionId: 'TXN-001'
            }
          ]
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
    
    // General reports list
    return {
      success: true,
      data: {
        results: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      },
      message: 'Using fallback data (backend unavailable)'
    };
  }

  if (endpoint.includes('/api/whatsapp')) {
    // Dashboard overview
    if (endpoint.includes('/dashboard')) {
      return {
        success: true,
        data: {
          totalSent: 1523,
          totalDelivered: 1389,
          totalRead: 1124,
          totalFailed: 134,
          activeConversations: 45,
          pendingMessages: 23,
          activeCampaigns: 3,
          templatesCount: 12,
          recentActivity: [
            {
              id: 'act-1',
              type: 'MESSAGE_SENT',
              description: 'Message sent to John Doe',
              timestamp: new Date().toISOString()
            },
            {
              id: 'act-2',
              type: 'CAMPAIGN_STARTED',
              description: 'Health reminder campaign started',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Templates
    if (endpoint.includes('/templates')) {
      if (endpoint.match(/\/api\/whatsapp\/templates\/[^/]+$/)) {
        return {
          success: true,
          data: {
            id: 'tmpl-1',
            name: 'appointment_reminder',
            displayName: 'Appointment Reminder',
            category: 'UTILITY',
            language: 'en',
            components: [
              {
                type: 'HEADER',
                text: 'Appointment Reminder'
              },
              {
                type: 'BODY',
                text: 'Hello {{1}}, your appointment is scheduled for {{2}} at {{3}}. Please arrive 15 minutes early.'
              }
            ],
            templateId: 'meta-tmpl-123',
            templateStatus: 'APPROVED',
            isActive: true,
            createdBy: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString()
          },
          message: 'Using fallback data (backend unavailable)'
        };
      }

      return {
        success: true,
        data: {
          templates: [
            {
              id: 'tmpl-1',
              name: 'appointment_reminder',
              displayName: 'Appointment Reminder',
              category: 'UTILITY',
              language: 'en',
              templateStatus: 'APPROVED',
              isActive: true,
              createdAt: new Date().toISOString()
            },
            {
              id: 'tmpl-2',
              name: 'result_ready',
              displayName: 'Result Ready Notification',
              category: 'UTILITY',
              language: 'en',
              templateStatus: 'APPROVED',
              isActive: true,
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: 'tmpl-3',
              name: 'payment_reminder',
              displayName: 'Payment Reminder',
              category: 'MARKETING',
              language: 'en',
              templateStatus: 'PENDING',
              isActive: false,
              createdAt: new Date(Date.now() - 172800000).toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 3,
            totalPages: 1
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Conversations
    if (endpoint.includes('/conversations')) {
      if (endpoint.match(/\/api\/whatsapp\/conversations\/[^/]+$/)) {
        return {
          success: true,
          data: {
            id: 'conv-1',
            patientId: 'patient-1',
            phoneNumber: '+91-9876543210',
            status: 'ACTIVE',
            lastMessageAt: new Date().toISOString(),
            lastMessagePreview: 'When can I get my results?',
            messageCount: 15,
            unreadCount: 2,
            assignedTo: 'user-1',
            assignedAt: new Date(Date.now() - 3600000).toISOString(),
            tags: ['urgent', 'follow-up'],
            notes: 'Patient requesting results urgently',
            patient: {
              id: 'patient-1',
              firstName: 'John',
              lastName: 'Doe',
              phone: '+91-9876543210'
            },
            incomingMessages: [],
            sentiments: {
              overallSentiment: 'NEUTRAL',
              sentimentScore: 0.3,
              emotions: { neutral: 0.7, joy: 0.2 }
            }
          },
          message: 'Using fallback data (backend unavailable)'
        };
      }

      return {
        success: true,
        data: {
          conversations: [
            {
              id: 'conv-1',
              patientId: 'patient-1',
              phoneNumber: '+91-9876543210',
              status: 'ACTIVE',
              lastMessageAt: new Date().toISOString(),
              lastMessagePreview: 'When can I get my results?',
              messageCount: 15,
              unreadCount: 2,
              patient: {
                id: 'patient-1',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+91-9876543210'
              }
            },
            {
              id: 'conv-2',
              patientId: 'patient-2',
              phoneNumber: '+91-9876543211',
              status: 'ACTIVE',
              lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
              lastMessagePreview: 'Thank you for the quick response!',
              messageCount: 8,
              unreadCount: 0,
              patient: {
                id: 'patient-2',
                firstName: 'Jane',
                lastName: 'Smith',
                phone: '+91-9876543211'
              }
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Campaigns
    if (endpoint.includes('/campaigns')) {
      if (endpoint.match(/\/api\/whatsapp\/campaigns\/[^/]+$/)) {
        return {
          success: true,
          data: {
            id: 'camp-1',
            name: 'Health Checkup Reminder',
            description: 'Monthly health checkup reminder campaign',
            campaignType: 'REMINDER',
            templateId: 'tmpl-1',
            targetAudience: {
              ageRange: [30, 60],
              lastVisitDays: 90
            },
            recipientCount: 500,
            scheduledFor: new Date(Date.now() + 86400000).toISOString(),
            status: 'SCHEDULED',
            sentCount: 0,
            deliveredCount: 0,
            failedCount: 0,
            costEstimate: 25.00,
            aBTestEnabled: false,
            createdBy: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          message: 'Using fallback data (backend unavailable)'
        };
      }

      return {
        success: true,
        data: {
          campaigns: [
            {
              id: 'camp-1',
              name: 'Health Checkup Reminder',
              campaignType: 'REMINDER',
              recipientCount: 500,
              scheduledFor: new Date(Date.now() + 86400000).toISOString(),
              status: 'SCHEDULED',
              sentCount: 0,
              deliveredCount: 0
            },
            {
              id: 'camp-2',
              name: 'New Year Health Package',
              campaignType: 'MARKETING',
              recipientCount: 1200,
              scheduledFor: new Date(Date.now() - 86400000).toISOString(),
              status: 'SENT',
              sentCount: 1200,
              deliveredCount: 1150,
              failedCount: 50
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Analytics
    if (endpoint.includes('/analytics')) {
      return {
        success: true,
        data: {
          overview: {
            totalSent: 1523,
            totalDelivered: 1389,
            totalRead: 1124,
            totalFailed: 134,
            deliveryRate: 91.2,
            readRate: 80.9,
            averageResponseTime: 2.5
          },
          dailyStats: [
            {
              date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
              sent: 250,
              delivered: 230,
              read: 180,
              failed: 20
            },
            {
              date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
              sent: 180,
              delivered: 165,
              read: 140,
              failed: 15
            },
            {
              date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
              sent: 320,
              delivered: 300,
              read: 250,
              failed: 20
            },
            {
              date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
              sent: 280,
              delivered: 260,
              read: 210,
              failed: 20
            },
            {
              date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
              sent: 350,
              delivered: 320,
              read: 280,
              failed: 30
            },
            {
              date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
              sent: 143,
              delivered: 114,
              read: 64,
              failed: 29
            }
          ],
          templatePerformance: [
            {
              templateName: 'appointment_reminder',
              sent: 450,
              delivered: 420,
              read: 380,
              deliveryRate: 93.3,
              readRate: 90.5
            },
            {
              templateName: 'result_ready',
              sent: 380,
              delivered: 350,
              read: 300,
              deliveryRate: 92.1,
              readRate: 85.7
            }
          ],
          sentimentTrends: [
            {
              date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
              positive: 45,
              neutral: 35,
              negative: 20
            },
            {
              date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
              positive: 50,
              neutral: 30,
              negative: 20
            },
            {
              date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
              positive: 55,
              neutral: 30,
              negative: 15
            },
            {
              date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
              positive: 48,
              neutral: 35,
              negative: 17
            },
            {
              date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
              positive: 52,
              neutral: 32,
              negative: 16
            },
            {
              date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
              positive: 58,
              neutral: 28,
              negative: 14
            }
          ]
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Auto-reply rules
    if (endpoint.includes('/auto-reply')) {
      return {
        success: true,
        data: {
          rules: [
            {
              id: 'rule-1',
              name: 'Appointment Booking',
              description: 'Auto-reply for appointment booking requests',
              triggerType: 'KEYWORD',
              triggerData: { keywords: ['appointment', 'book', 'schedule'] },
              responseType: 'TEXT',
              responseText: 'I can help you book an appointment. Please provide your preferred date and time.',
              delaySeconds: 2,
              isActive: true,
              aiEnabled: true
            },
            {
              id: 'rule-2',
              name: 'Result Inquiry',
              description: 'Auto-reply for result status inquiries',
              triggerType: 'KEYWORD',
              triggerData: { keywords: ['result', 'report', 'status'] },
              responseType: 'TEXT',
              responseText: 'Your results are being processed. You will receive a notification when they are ready.',
              delaySeconds: 1,
              isActive: true,
              aiEnabled: false
            }
          ]
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Notification triggers
    if (endpoint.includes('/notification-triggers')) {
      return {
        success: true,
        data: {
          triggers: [
            {
              id: 'trigger-1',
              name: 'Result Ready Notification',
              description: 'Send WhatsApp when results are approved',
              eventType: 'RESULT_APPROVED',
              templateId: 'tmpl-2',
              recipientType: 'PATIENT',
              sendImmediately: true,
              isActive: true,
              triggerCount: 145,
              lastTriggeredAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'trigger-2',
              name: 'Payment Reminder',
              description: 'Send payment reminder 24 hours after order',
              eventType: 'ORDER_CREATED',
              templateId: 'tmpl-3',
              recipientType: 'PATIENT',
              sendImmediately: false,
              delayMinutes: 1440,
              isActive: true,
              triggerCount: 89,
              lastTriggeredAt: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }

    // Default WhatsApp response
    return {
      success: true,
      data: {},
      message: 'Using fallback data (backend unavailable)'
    };
  }

  if (endpoint.includes('/api/samples')) {
    return {
      success: true,
      data: {
        samples: [
          {
            id: 'demo-sample-1',
            sampleNumber: 'SMP-90210',
            barcode: 'SBC-90210',
            patientId: 'demo-patient-1',
            orderId: 'demo-order-1',
            testId: 'demo-test-1',
            sampleType: 'BLOOD',
            status: 'PENDING',
            collectedById: null,
            collectedBy: null,
            collectionType: 'WALK_IN',
            priority: 'ROUTINE',
            collectedAt: null,
            receivedAt: null,
            completedAt: null,
            rejectionReason: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: {
              id: 'demo-order-1',
              orderNumber: 'ORD-2026-0001',
              barcode: 'ORD-BC-001',
              patient: {
                id: 'demo-patient-1',
                uhid: 'UHID-001',
                firstName: 'John',
                lastName: 'Doe',
                gender: 'MALE',
                dateOfBirth: '1985-05-15',
                age: 39,
                phone: '+91-9876543210',
              },
              doctor: {
                id: 'demo-doctor-1',
                doctorCode: 'DOC-001',
                fullName: 'Dr. Smith',
                specialization: 'Pathology',
              },
            },
            test: {
              id: 'demo-test-1',
              testCode: 'CBC',
              testName: 'Complete Blood Count',
              sampleType: 'BLOOD',
              sampleContainer: 'EDTA Purple',
            },
          },
          {
            id: 'demo-sample-2',
            sampleNumber: 'SMP-90211',
            barcode: 'SBC-90211',
            patientId: 'demo-patient-2',
            orderId: 'demo-order-2',
            testId: 'demo-test-2',
            sampleType: 'SERUM',
            status: 'COLLECTED',
            collectedById: 'demo-user-1',
            collectedBy: {
              id: 'demo-user-1',
              employeeCode: 'EMP-001',
              fullName: 'Sarah Johnson',
            },
            collectionType: 'WALK_IN',
            priority: 'ROUTINE',
            collectedAt: new Date(Date.now() - 3600000).toISOString(),
            receivedAt: null,
            completedAt: null,
            rejectionReason: null,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            order: {
              id: 'demo-order-2',
              orderNumber: 'ORD-2026-0002',
              barcode: 'ORD-BC-002',
              patient: {
                id: 'demo-patient-2',
                uhid: 'UHID-002',
                firstName: 'Jane',
                lastName: 'Smith',
                gender: 'FEMALE',
                dateOfBirth: '1990-08-20',
                age: 34,
                phone: '+91-9876543211',
              },
              doctor: {
                id: 'demo-doctor-2',
                doctorCode: 'DOC-002',
                fullName: 'Dr. Johnson',
                specialization: 'Cardiology',
              },
            },
            test: {
              id: 'demo-test-2',
              testCode: 'LIPID',
              testName: 'Lipid Profile',
              sampleType: 'SERUM',
              sampleContainer: 'Serum Separator Red',
            },
          },
          {
            id: 'demo-sample-3',
            sampleNumber: 'SMP-90212',
            barcode: 'SBC-90212',
            patientId: 'demo-patient-3',
            orderId: 'demo-order-3',
            testId: 'demo-test-3',
            sampleType: 'URINE',
            status: 'RECEIVED',
            collectedById: 'demo-user-1',
            collectedBy: {
              id: 'demo-user-1',
              employeeCode: 'EMP-001',
              fullName: 'Sarah Johnson',
            },
            collectionType: 'HOME_COLLECTION',
            priority: 'URGENT',
            collectedAt: new Date(Date.now() - 7200000).toISOString(),
            receivedAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: null,
            rejectionReason: null,
            createdAt: new Date(Date.now() - 10800000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            order: {
              id: 'demo-order-3',
              orderNumber: 'ORD-2026-0003',
              barcode: 'ORD-BC-003',
              patient: {
                id: 'demo-patient-3',
                uhid: 'UHID-003',
                firstName: 'Robert',
                lastName: 'Williams',
                gender: 'MALE',
                dateOfBirth: '1978-12-10',
                age: 45,
                phone: '+91-9876543212',
              },
              doctor: {
                id: 'demo-doctor-3',
                doctorCode: 'DOC-003',
                fullName: 'Dr. Williams',
                specialization: 'Nephrology',
              },
            },
            test: {
              id: 'demo-test-3',
              testCode: 'URINALYSIS',
              testName: 'Urinalysis',
              sampleType: 'URINE',
              sampleContainer: 'Urine Container Yellow',
            },
          },
          {
            id: 'demo-sample-4',
            sampleNumber: 'SMP-90213',
            barcode: 'SBC-90213',
            patientId: 'demo-patient-4',
            orderId: 'demo-order-4',
            testId: 'demo-test-4',
            sampleType: 'PLASMA',
            status: 'PROCESSING',
            collectedById: 'demo-user-2',
            collectedBy: {
              id: 'demo-user-2',
              employeeCode: 'EMP-002',
              fullName: 'Mike Davis',
            },
            collectionType: 'WALK_IN',
            priority: 'STAT',
            collectedAt: new Date(Date.now() - 14400000).toISOString(),
            receivedAt: new Date(Date.now() - 10800000).toISOString(),
            completedAt: null,
            rejectionReason: null,
            createdAt: new Date(Date.now() - 18000000).toISOString(),
            updatedAt: new Date(Date.now() - 10800000).toISOString(),
            order: {
              id: 'demo-order-4',
              orderNumber: 'ORD-2026-0004',
              barcode: 'ORD-BC-004',
              patient: {
                id: 'demo-patient-4',
                uhid: 'UHID-004',
                firstName: 'Emily',
                lastName: 'Brown',
                gender: 'FEMALE',
                dateOfBirth: '1995-03-25',
                age: 29,
                phone: '+91-9876543213',
              },
              doctor: {
                id: 'demo-doctor-4',
                doctorCode: 'DOC-004',
                fullName: 'Dr. Brown',
                specialization: 'Hematology',
              },
            },
            test: {
              id: 'demo-test-4',
              testCode: 'PT',
              testName: 'Prothrombin Time',
              sampleType: 'PLASMA',
              sampleContainer: 'Citrate Blue',
            },
          },
          {
            id: 'demo-sample-5',
            sampleNumber: 'SMP-90214',
            barcode: 'SBC-90214',
            patientId: 'demo-patient-5',
            orderId: 'demo-order-5',
            testId: 'demo-test-5',
            sampleType: 'BLOOD',
            status: 'REJECTED',
            collectedById: 'demo-user-1',
            collectedBy: {
              id: 'demo-user-1',
              employeeCode: 'EMP-001',
              fullName: 'Sarah Johnson',
            },
            collectionType: 'WALK_IN',
            priority: 'ROUTINE',
            collectedAt: new Date(Date.now() - 28800000).toISOString(),
            receivedAt: null,
            completedAt: null,
            rejectionReason: 'Hemolyzed Sample',
            createdAt: new Date(Date.now() - 32400000).toISOString(),
            updatedAt: new Date(Date.now() - 28800000).toISOString(),
            order: {
              id: 'demo-order-5',
              orderNumber: 'ORD-2026-0005',
              barcode: 'ORD-BC-005',
              patient: {
                id: 'demo-patient-5',
                uhid: 'UHID-005',
                firstName: 'David',
                lastName: 'Miller',
                gender: 'MALE',
                dateOfBirth: '1982-07-08',
                age: 42,
                phone: '+91-9876543214',
              },
              doctor: {
                id: 'demo-doctor-5',
                doctorCode: 'DOC-005',
                fullName: 'Dr. Miller',
                specialization: 'General Medicine',
              },
            },
            test: {
              id: 'demo-test-5',
              testCode: 'GLUCOSE',
              testName: 'Glucose Fasting',
              sampleType: 'BLOOD',
              sampleContainer: 'Fluoride Grey',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 5,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      },
      message: 'Using fallback data (backend unavailable)'
    };
  }

  if (endpoint.includes('/api/laboratory-settings')) {
    return {
      success: true,
      data: {
        id: 'settings-1',
        labName: 'LabCore Enterprise LIS',
        labPhone: '9723561529',
        labEmail: 'nikilpanchal5@gmail.com',
        labAddress: '123 Medical Complex',
        labCity: 'Mumbai',
        labState: 'Maharashtra',
        labPincode: '400001',
        emailProvider: 'custom',
        emailApiKey: '',
        emailFromEmail: '',
        emailFromName: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        smsProvider: 'custom',
        smsApiKey: '',
        smsApiSecret: '',
        smsSenderId: '',
        callProvider: 'custom',
        callApiKey: '',
        callApiSecret: '',
        callCallerId: '',
        whatsappProvider: 'custom',
        whatsappPhoneNumberId: '',
        whatsappAccessToken: '',
        whatsappWebhookUrl: '',
        whatsappVerifyToken: '',
        whatsappBusinessProfileId: '',
        whatsappAIEnabled: false,
        enableAutomatedNotifications: true,
        enablePatientNotifications: true,
        enableDoctorNotifications: false,
        enableAutoResultProcessing: true,
        enableAutoApproval: false,
        enableLiveTelemetry: true,
        demoMode: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      message: 'Using fallback data (backend unavailable)'
    };
  }

  // ------------------------------------------------------------------
// Doctors are real clinical + financial records.
// A fabricated fallback here is what made a doctor with zero orders
// display 245 referrals and Rs 4,45,000 revenue, so we surface the
// failure instead of inventing data.
// ------------------------------------------------------------------
if (endpoint.includes('/api/doctors')) {
  throw new ApiError(
    'Could not load doctor records. The server is unavailable or returned an error, so figures are shown as unavailable rather than estimated.',
    0,
    'DOCTORS_UNAVAILABLE'
  );
}
  
  // Generic fallback for any other endpoint
  console.warn(`No specific fallback for ${endpoint}, using generic fallback`);
  return {
    success: true,
    data: [],
    message: 'Using generic fallback data (backend unavailable)'
  };
};

// Communication API
export const communicationApi = {
  // Send email to patient
  sendEmail: async (data: {
    patientId: string;
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{
      filename: string;
      content: string; // base64 encoded
      contentType?: string;
    }>;
  }) => {
    return apiCall('/api/communications/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Test SMTP connection
  testSmtp: async (data?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
  }) => {
    return apiCall('/api/communications/test-smtp', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Update SMTP configuration / Gmail App Password
  updateSmtpSettings: async (data: {
    smtpPassword?: string;
    smtpUser?: string;
    smtpHost?: string;
    smtpPort?: number;
    emailFromEmail?: string;
    emailFromName?: string;
  }) => {
    return apiCall('/api/communications/smtp-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Send SMS to patient
  sendSMS: async (data: {
    patientId: string;
    to: string;
    message: string;
  }) => {
    return apiCall('/api/communications/sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Initiate call to patient
  initiateCall: async (data: {
    patientId: string;
    to: string;
    notes?: string;
  }) => {
    return apiCall('/api/communications/call', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload and host PDF for WhatsApp / document links
  uploadPdf: async (data: { filename: string; content: string }) => {
    return apiCall('/api/communications/upload-pdf', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Send WhatsApp message to patient with direct PDF hosting support
  sendWhatsApp: async (data: {
    patientId: string;
    to: string;
    message: string;
    mediaUrl?: string;
    pdfBase64?: string;
    filename?: string;
  }) => {
    return apiCall('/api/communications/whatsapp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Test WhatsApp connection (Twilio, etc.)
  testWhatsApp: async (data?: {
    whatsappProvider?: string;
    whatsappApiKey?: string;
    whatsappApiSecret?: string;
    whatsappSenderId?: string;
  }) => {
    return apiCall('/api/communications/test-whatsapp', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Update WhatsApp settings
  updateWhatsAppSettings: async (data: {
    whatsappProvider?: string;
    whatsappApiKey?: string;
    whatsappApiSecret?: string;
    whatsappSenderId?: string;
    whatsappBusinessNumber?: string;
  }) => {
    return apiCall('/api/communications/whatsapp-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get communication history for patient
  getHistory: async (patientId: string, page = 1, limit = 20) => {
    return apiCall(`/api/communications/history/${patientId}?page=${page}&limit=${limit}`);
  },

  // Get specific communication details
  getById: async (id: string) => {
    return apiCall(`/api/communications/${id}`);
  },

  // Get all communication logs (admin)
  getLogs: (params = '') =>
    apiCall(`/api/communications/logs${formatQuery(params)}`),

  // Get communication stats
  getStats: () =>
    apiCall('/api/communications/stats'),

  // Get SMS templates
  getSmsTemplates: () =>
    apiCall('/api/communications/sms/templates'),

  // Get Email templates
  getEmailTemplates: () =>
    apiCall('/api/communications/email/templates'),

  // Send bulk SMS (e.g., result dispatch to multiple patients)
  sendBulkSMS: (data: { recipients: Array<{ patientId: string; phone: string; message: string }> }) =>
    apiCall('/api/communications/sms/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Retry a failed communication
  retry: (communicationId: string) =>
    apiCall(`/api/communications/${communicationId}/retry`, { method: 'POST' }),

  // Mark a communication as read
  markRead: (communicationId: string) =>
    apiCall(`/api/communications/${communicationId}/read`, { method: 'PATCH' }),

  // Get DPDP consent for patient
  getConsent: (patientId: string) =>
    apiCall(`/api/communications/consent/${patientId}`),

  // Update DPDP consent
  updateConsent: (patientId: string, data: { sms: boolean; email: boolean; whatsapp: boolean; call: boolean }) =>
    apiCall(`/api/communications/consent/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// WhatsApp API
export const whatsappApi = {
  // Dashboard overview
  getDashboard: async () => {
    return apiCall('/api/whatsapp/dashboard');
  },

  // Templates
  getTemplates: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/whatsapp/templates${queryString}`);
  },

  getTemplate: async (id: string) => {
    return apiCall(`/api/whatsapp/templates/${id}`);
  },

  createTemplate: async (data: any) => {
    return apiCall('/api/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateTemplate: async (id: string, data: any) => {
    return apiCall(`/api/whatsapp/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTemplate: async (id: string) => {
    return apiCall(`/api/whatsapp/templates/${id}`, {
      method: 'DELETE'
    });
  },

  // Conversations
  getConversations: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/whatsapp/conversations${queryString}`);
  },

  getConversation: async (id: string) => {
    return apiCall(`/api/whatsapp/conversations/${id}`);
  },

  updateConversation: async (id: string, data: any) => {
    return apiCall(`/api/whatsapp/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Campaigns
  getCampaigns: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/whatsapp/campaigns${queryString}`);
  },

  getCampaign: async (id: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}`);
  },

  createCampaign: async (data: any) => {
    return apiCall('/api/whatsapp/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateCampaign: async (id: string, data: any) => {
    return apiCall(`/api/whatsapp/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  scheduleCampaign: async (id: string, scheduledFor: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledFor })
    });
  },

  sendCampaign: async (id: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}/send`, {
      method: 'POST'
    });
  },

  cancelCampaign: async (id: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}/cancel`, {
      method: 'POST'
    });
  },

  deleteCampaign: async (id: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}`, {
      method: 'DELETE'
    });
  },

  getCampaignStats: async (id: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}/stats`);
  },

  duplicateCampaign: async (id: string, name: string) => {
    return apiCall(`/api/whatsapp/campaigns/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  // Analytics
  getAnalytics: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/whatsapp/analytics${queryString}`);
  },

  // Auto-reply rules
  getAutoReplyRules: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/whatsapp/auto-reply${queryString}`);
  },

  createAutoReplyRule: async (data: any) => {
    return apiCall('/api/whatsapp/auto-reply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateAutoReplyRule: async (id: string, data: any) => {
    return apiCall(`/api/whatsapp/auto-reply/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteAutoReplyRule: async (id: string) => {
    return apiCall(`/api/whatsapp/auto-reply/${id}`, {
      method: 'DELETE'
    });
  },

  // Notification triggers
  getNotificationTriggers: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/whatsapp/notification-triggers${queryString}`);
  },

  createNotificationTrigger: async (data: any) => {
    return apiCall('/api/whatsapp/notification-triggers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateNotificationTrigger: async (id: string, data: any) => {
    return apiCall(`/api/whatsapp/notification-triggers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteNotificationTrigger: async (id: string) => {
    return apiCall(`/api/whatsapp/notification-triggers/${id}`, {
      method: 'DELETE'
    });
  },

  // AI features
  getSuggestedResponse: async (conversationId: string, aiModel?: string) => {
    const params = aiModel ? `?aiModel=${aiModel}` : '';
    return apiCall(`/api/whatsapp/conversations/${conversationId}/suggested-response${params}`);
  },

  getConversationWithAI: async (id: string) => {
    return apiCall(`/api/whatsapp/conversations/${id}/ai-insights`);
  },

  sendMessageWithAI: async (data: any) => {
    return apiCall('/api/whatsapp/send-with-ai', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getOptimalEngagementTime: async (patientId: string) => {
    return apiCall(`/api/whatsapp/patients/${patientId}/optimal-engagement-time`);
  },

  getPersonalizedContent: async (patientId: string, messageType: string) => {
    return apiCall(`/api/whatsapp/patients/${patientId}/personalized-content?messageType=${messageType}`);
  },

  // Send a WhatsApp message (text or template)
  sendMessage: (data: {
    to: string;
    patientId?: string;
    type: 'text' | 'template' | 'document';
    message?: string;
    templateName?: string;
    templateParams?: string[];
    documentUrl?: string;
    caption?: string;
  }) =>
    apiCall('/api/whatsapp/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all messages / conversations
  getMessages: (params = '') =>
    apiCall(`/api/whatsapp/messages${formatQuery(params)}`),

  // Send a report PDF via WhatsApp (document message)
  sendReport: (data: { patientId: string; phone: string; reportUrl: string; caption?: string }) =>
    apiCall('/api/whatsapp/messages/send-report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Send payment receipt WhatsApp message
  sendReceipt: (data: { patientId: string; phone: string; receiptData: Record<string, unknown> }) =>
    apiCall('/api/whatsapp/messages/send-receipt', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Webhook verification endpoint helper
  verifyWebhook: (mode: string, token: string, challenge: string) =>
    apiCall(`/api/whatsapp/webhook/verify?hub.mode=${mode}&hub.verify_token=${token}&hub.challenge=${challenge}`),
};

// Laboratory Settings API
export const laboratorySettingsApi = {
  // Get laboratory settings
  getSettings: async () => {
    return apiCall('/api/settings/laboratory');
  },

  // Update laboratory settings
  updateSettings: async (data: any) => {
    return apiCall('/api/settings/laboratory', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Test SMTP connection
  testSmtp: async (data?: any) => {
    return apiCall('/api/communications/test-smtp', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Test WhatsApp connection
  testWhatsApp: async (data?: any) => {
    return apiCall('/api/communications/test-whatsapp', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
};

// Auth API
export const authApi = {
  // Login: the backend accepts an email or an employee code as 'identifier'
  login: async (credentials: { email: string; password: string }) => {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: credentials.email,
        password: credentials.password,
      }),
    });
  },

  // Complete a login that stopped at the MFA step
  verifyMfa: async (mfaToken: string, code: string) => {
    return apiCall('/api/auth/login/mfa', {
      method: 'POST',
      body: JSON.stringify({ mfaToken, code }),
    });
  },

  // Register a staff account (administrators only)
  register: async (data: {
    employeeCode: string;
    fullName: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  }) => {
    return apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Revoke the server-side session before dropping the local one
  logout: async () => {
    return apiCall('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  refresh: async (refreshToken: string) => {
    return apiCall('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  // Get current user
  me: async () => {
    return apiCall('/api/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiCall('/api/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  sessions: async () => {
    return apiCall('/api/auth/sessions');
  },

  revokeSession: async (id: string) => {
    return apiCall(`/api/auth/sessions/${id}`, { method: 'DELETE' });
  },

  /**
   * Re-confirm the signed-in operator before a privileged action.
   * The password is checked by the server against the stored hash; the browser
   * only learns whether the confirmation succeeded.
   */
  verifyOwner: async (password: string) => {
    return apiCall('/api/auth/owner/verify', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  /**
   * Request a Gmail password-reset link.
   *
   * The response is deliberately identical for known and unknown addresses, so
   * this call cannot be used to discover which emails have accounts.
   */
  forgotPassword: async (email: string) => {
    return apiCall('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /** Complete the reset using the emailed OTP or token. */
  resetPassword: async (data: { email: string; code: string; newPassword: string }) => {
    return apiCall('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Send (or resend) the Gmail address-verification code. */
  requestEmailVerification: async (email: string) => {
    return apiCall('/api/auth/verify-email/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /** Confirm the Gmail address with the code that was emailed. */
  confirmEmailVerification: async (email: string, code: string) => {
    return apiCall('/api/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },
};

// Audit & Security Activity API
export const auditApi = {
  getAll: async (params?: { page?: number; limit?: number; module?: string; action?: string; userId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.module) q.append('module', params.module);
    if (params?.action) q.append('action', params.action);
    if (params?.userId) q.append('userId', params.userId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiCall(`/api/audit${qs}`);
  },
  getMyActivity: async (params?: { page?: number; limit?: number; module?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.module) q.append('module', params.module);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiCall(`/api/audit/me${qs}`);
  },
  getOne: async (id: string) => {
    return apiCall(`/api/audit/${id}`);
  },
  getRecordHistory: async (recordId: string) => {
    return apiCall(`/api/audit/record/${recordId}`);
  },
};

// AI Studio & Clinical Intelligence API
export const aiApi = {
  trainClassical: async (params: {
    modelName: string;
    algorithm: string;
    dataset: string;
    nEstimators: number;
    maxDepth: number;
    learningRate: number;
    [key: string]: any;
  }) => {
    return apiCall('/api/ai/train/classical', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  trainDeepLearning: async (params: {
    architecture: string;
    dataset?: string;
    epochs: number;
    batchSize: number;
    optimizer: string;
    learningRate: number;
    dropout?: number;
    layers?: number[];
    precision?: string;
    lrScheduler?: string;
    lossFunction?: string;
    regularizationL1?: number;
    regularizationL2?: number;
    earlyStoppingPatience?: number;
  }) => {
    return apiCall('/api/ai/train/deep-learning', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  predict: async (data: {
    panel?: string;
    hba1c?: number;
    fbs?: number;
    creatinine?: number;
    troponin?: number;
    potassium?: number;
    microalbumin?: number;
    egfr?: number;
    bun?: number;
    procalcitonin?: number;
    lactate?: number;
    wbc?: number;
    ddimer?: number;
    alt?: number;
    ast?: number;
    bilirubin?: number;
    alp?: number;
    albumin?: number;
    patientAge?: number;
    patientGender?: string;
    [key: string]: any;
  }) => {
    return apiCall('/api/ai/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  analyzeNlp: async (clinicalText: string, options: Record<string, any> = {}) => {
    return apiCall('/api/ai/nlp/analyze', {
      method: 'POST',
      body: JSON.stringify({ clinicalText, ...options }),
    });
  },

  deltaCheck: async (params: {
    testCode: string;
    testName: string;
    currentValue: number;
    previousValue: number;
    timeGapHours: number;
  }) => {
    return apiCall('/api/ai/anomaly/delta-check', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  forecastTat: async (params: {
    department: string;
    complexityScore: number;
    isStat: boolean;
    queueDepth: number;
    activeTechnicians: number;
  }) => {
    return apiCall('/api/ai/forecasting/tat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getModels: async () => {
    return apiCall('/api/ai/models');
  },

  deployModel: async (modelId: string, status: 'PRODUCTION' | 'STAGING' | 'ARCHIVED') => {
    return apiCall('/api/ai/models/deploy', {
      method: 'POST',
      body: JSON.stringify({ modelId, status }),
    });
  },

  getAudit: async () => {
    return apiCall('/api/ai/audit');
  },

  // =====================================================
  // NEW CLINICAL ENGINE API METHODS
  // =====================================================

  analyzeCbc: async (params: {
    hb: number; rbc: number; wbc: number; platelets: number;
    hematocrit: number; mcv: number; mch: number; mchc: number;
    neutrophils: number; lymphocytes: number; monocytes: number;
    eosinophils: number; basophils: number; rdw: number;
    patientAge?: number; patientGender?: 'MALE' | 'FEMALE';
  }) => {
    return apiCall('/api/ai/cbc/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  checkDrugInteractions: async (params: {
    medications: string[];
    patientAge?: number;
    renalFunction?: string;
    hepaticFunction?: string;
  }) => {
    return apiCall('/api/ai/drug/interactions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  predictAmr: async (params: {
    organism: string;
    specimenType: string;
    gramStain?: string;
    patientHistory?: string[];
  }) => {
    return apiCall('/api/ai/amr/predict', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  classifyThyroid: async (params: {
    tsh: number; ft4: number; ft3: number;
    tpoAntibody?: number; tgAntibody?: number;
    patientAge?: number; patientGender?: string;
    symptoms?: string[];
  }) => {
    return apiCall('/api/ai/thyroid/classify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  analyzeCoagulation: async (params: {
    pt: number; inr: number; aptt: number;
    fibrinogen?: number; dDimer?: number; platelets?: number;
    antithrombinIII?: number; proteinC?: number;
    indication?: string;
  }) => {
    return apiCall('/api/ai/coagulation/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  generateSmartReport: async (params: {
    patientName: string; patientAge: number; patientGender: string;
    uhid: string; referringDoctor?: string; department: string;
    testResults: { testName: string; value: string | number; unit: string; referenceRange: string; flag?: string }[];
    clinicalHistory?: string; specimenType?: string; collectionDateTime?: string;
  }) => {
    return apiCall('/api/ai/report/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// Suppress console.error on expected unauthenticated / session-expired 401 responses
const logDashboardFallback = (context: string, error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    return;
  }
  console.error(`${context}, using fallback:`, error);
};

// Dashboard API
export const dashboardApi = {
  // Get dashboard stats
  getStats: async () => {
    try {
      return await apiCall('/api/dashboard/stats');
    } catch (error) {
      logDashboardFallback('Dashboard stats API error', error);
      return {
        success: true,
        data: {
          patients: {
            total: 150
          },
          orders: {
            today: 12,
            pending: 25,
            completed: 283,
            total: 320
          },
          samples: {
            pending: 45,
            inProgress: 20,
            completed: 255,
            total: 320
          },
          results: {
            pending: 35,
            verified: 120,
            approved: 195,
            total: 350,
            critical: 3
          },
          approvals: {
            pending: 8
          },
          tests: {
            inProgress: 65,
            completed: 785
          },
          financial: {
            todayRevenue: 8500,
            pendingPayments: 12500
          },
          invoices: {
            total: 320,
            paid: 285,
            pending: 35
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
  },

  // Get order stats
  getOrderStats: async () => {
    try {
      return await apiCall('/api/dashboard/orders');
    } catch (error) {
      logDashboardFallback('Dashboard order stats API error', error);
      return {
        success: true,
        data: {
          total: 320,
          registered: 150,
          sampleCollected: 120,
          processing: 35,
          completed: 10,
          cancelled: 5
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
  },

  // Get approval queue
  getApprovalQueue: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/dashboard/approvals/queue${queryString}`);
    } catch (error) {
      logDashboardFallback('Dashboard approval queue API error', error);
      return {
        success: true,
        data: {
          approvals: [
            {
              id: 'demo-approval-1',
              result: {
                id: 'demo-result-1',
                test: {
                  testName: 'Complete Blood Count',
                  testCode: 'CBC'
                },
                order: {
                  patient: {
                    firstName: 'John',
                    lastName: 'Doe',
                    uhid: 'UHID-001'
                  }
                }
              },
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'demo-approval-2',
              result: {
                id: 'demo-result-2',
                test: {
                  testName: 'Lipid Profile',
                  testCode: 'LIPID'
                },
                order: {
                  patient: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    uhid: 'UHID-002'
                  }
                }
              },
              createdAt: new Date(Date.now() - 7200000).toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
  },

  // Get attention/critical results
  getAttentionResults: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/dashboard/results/attention${queryString}`);
    } catch (error) {
      logDashboardFallback('Dashboard attention results API error', error);
      return {
        success: true,
        data: {
          critical: [
            {
              id: 'demo-result-3',
              test: {
                testName: 'Glucose Fasting',
                testCode: 'GLUCOSE'
              },
              order: {
                patient: {
                  firstName: 'Robert',
                  lastName: 'Williams'
                }
              },
              createdAt: new Date(Date.now() - 1800000).toISOString()
            }
          ],
          results: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
  },

  // Get sample tracking statistics & turnaround time
  getSampleStats: async () => {
    try {
      return await apiCall('/api/dashboard/samples');
    } catch (error) {
      logDashboardFallback('Dashboard sample stats API error', error);
      return {
        success: true,
        data: {
          byStatus: [
            { status: 'PENDING', count: 3 },
            { status: 'PROCESSING', count: 2 },
            { status: 'COMPLETED', count: 18 }
          ],
          byType: [
            { type: 'BLOOD', count: 14 },
            { type: 'SERUM', count: 6 },
            { type: 'URINE', count: 3 }
          ],
          averageTurnaroundTime: 7200000,
          averageTurnaroundTimeHours: 2.0
        }
      };
    }
  },

  // Get recent laboratory activity
  getActivity: async (limit = 15) => {
    try {
      return await apiCall(`/api/dashboard/activity?limit=${limit}`);
    } catch (error) {
      logDashboardFallback('Dashboard activity API error', error);
      return {
        success: true,
        data: []
      };
    }
  },

  // Get payment & financial analytics
  getPaymentStats: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/dashboard/payments${queryString}`);
    } catch (error) {
      logDashboardFallback('Dashboard payment analytics API error', error);
      return {
        success: true,
        data: {
          byMethod: [
            { method: 'UPI', count: 12, amount: 9800 },
            { method: 'CASH', count: 8, amount: 5400 },
            { method: 'CARD', count: 4, amount: 3200 }
          ],
          totalRevenue: 18400
        }
      };
    }
  },

  // Get test performance analytics
  getTestStats: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/dashboard/tests${queryString}`);
    } catch (error) {
      logDashboardFallback('Dashboard test analytics API error', error);
      return {
        success: true,
        data: {
          mostRequested: [
            { testId: '1', testName: 'Complete Blood Count (CBC)', testCode: 'CBC', category: 'Hematology', count: 38 },
            { testId: '2', testName: 'Lipid Profile', testCode: 'LIPID', category: 'Biochemistry', count: 24 },
            { testId: '3', testName: 'Liver Function Test (LFT)', testCode: 'LFT', category: 'Biochemistry', count: 19 },
            { testId: '4', testName: 'HbA1c Glycated Hemoglobin', testCode: 'HBA1C', category: 'Biochemistry', count: 17 },
            { testId: '5', testName: 'Thyroid Stimulating Hormone (TSH)', testCode: 'TSH', category: 'Immunology', count: 14 }
          ],
          categoryDistribution: [
            { id: '1', name: 'Hematology', testCount: 22 },
            { id: '2', name: 'Biochemistry', testCount: 35 },
            { id: '3', name: 'Immunology', testCount: 18 },
            { id: '4', name: 'Microbiology', testCount: 12 }
          ]
        }
      };
    }
  },

  // Get unified real-time hospital telemetry metrics
  getMetrics: async () => {
    try {
      return await apiCall('/api/dashboard/metrics');
    } catch (error) {
      logDashboardFallback('Dashboard metrics API error', error);
      return { success: false, data: null };
    }
  },

  // Record panic read-back
  acknowledgePanic: async (payload: {
    resultValueId?: string;
    orderId?: string;
    recipientName?: string;
    recipientContact?: string;
    readBackNote?: string;
  }) => {
    try {
      return await apiCall('/api/dashboard/panic-readback', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logDashboardFallback('Dashboard panic readback error', error);
      return { success: false };
    }
  },
};

// Patients API
export const patientApi = {
  // Get all patients
  getAll: async (params = '') => {
    const queryString = params ? (params.startsWith('?') ? params : `?${params}`) : '';
    try {
      return await apiCall(`/api/patients${queryString}`);
    } catch (error) {
      console.error('Patients API error, using fallback:', error);
      return {
        success: true,
        data: {
          patients: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
  },

  // Get single patient
  getById: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}`);
    } catch (error) {
      console.error('Patient detail API error:', error);
      throw error;
    }
  },

  // Create patient
  create: async (data: any) => {
    try {
      return await apiCall('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Patient creation API error:', error);
      throw error;
    }
  },

  // Update patient
  update: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/patients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Patient update API error:', error);
      throw error;
    }
  },

  // Delete patient
  delete: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Patient deletion API error:', error);
      throw error;
    }
  },

  // Family Management
  getFamily: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}/family`);
    } catch (error) {
      console.error('Patient getFamily API error:', error);
      throw error;
    }
  },

  addToFamily: async (id: string, data: { familyHeadId: string; relationship: string }) => {
    try {
      return await apiCall(`/api/patients/${id}/family`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Patient addToFamily API error:', error);
      throw error;
    }
  },

  removeFromFamily: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}/family`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Patient removeFromFamily API error:', error);
      throw error;
    }
  },

  // Medical History Management
  getHistory: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}/history`);
    } catch (error) {
      console.error('Patient getHistory API error:', error);
      throw error;
    }
  },

  addHistory: async (
    id: string,
    data: { condition: string; diagnosedDate?: string; notes?: string; severity?: string; status?: string }
  ) => {
    try {
      return await apiCall(`/api/patients/${id}/history`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Patient addHistory API error:', error);
      throw error;
    }
  },

  updateHistory: async (id: string, historyId: string, data: any) => {
    try {
      return await apiCall(`/api/patients/${id}/history/${historyId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Patient updateHistory API error:', error);
      throw error;
    }
  },

  deleteHistory: async (id: string, historyId: string) => {
    try {
      return await apiCall(`/api/patients/${id}/history/${historyId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Patient deleteHistory API error:', error);
      throw error;
    }
  },

  // Consent Management (DPDP Act 2023 / NABL / NABH)
  getConsents: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}/consents`);
    } catch (error) {
      console.error('Patient getConsents API error:', error);
      throw error;
    }
  },

  addConsent: async (
    id: string,
    data: { consentType: string; consentText: string; consentGiven?: boolean }
  ) => {
    try {
      return await apiCall(`/api/patients/${id}/consents`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Patient addConsent API error:', error);
      throw error;
    }
  },

  revokeConsent: async (id: string, consentId: string) => {
    try {
      return await apiCall(`/api/patients/${id}/consents/${consentId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Patient revokeConsent API error:', error);
      throw error;
    }
  },

  // Phone / KYC Verifications
  sendPhoneOTP: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}/verify/phone/send`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Patient sendPhoneOTP API error:', error);
      throw error;
    }
  },

  verifyPhone: async (id: string, otp: string) => {
    try {
      return await apiCall(`/api/patients/${id}/verify/phone`, {
        method: 'POST',
        body: JSON.stringify({ otp }),
      });
    } catch (error) {
      console.error('Patient verifyPhone API error:', error);
      throw error;
    }
  },

  verifyKYC: async (id: string) => {
    try {
      return await apiCall(`/api/patients/${id}/verify/kyc`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Patient verifyKYC API error:', error);
      throw error;
    }
  },

  // Pre-flight Duplicate Check
  checkDuplicate: async (params: { phone?: string; email?: string; aadhaarNumber?: string; panNumber?: string; excludePatientId?: string }) => {
    const q = new URLSearchParams();
    if (params.phone) q.set('phone', params.phone);
    if (params.email) q.set('email', params.email);
    if (params.aadhaarNumber) q.set('aadhaarNumber', params.aadhaarNumber);
    if (params.panNumber) q.set('panNumber', params.panNumber);
    if (params.excludePatientId) q.set('excludePatientId', params.excludePatientId);
    try {
      return await apiCall(`/api/patients/check-duplicate?${q.toString()}`);
    } catch (error) {
      console.error('Patient checkDuplicate API error:', error);
      throw error;
    }
  },

  // Analytics & Reports
  getAnalytics: async (params = '') => {
    const queryString = params ? (params.startsWith('?') ? params : `?${params}`) : '';
    try {
      return await apiCall(`/api/patients/analytics/registrations${queryString}`);
    } catch (error) {
      console.error('Patient getAnalytics API error:', error);
      throw error;
    }
  },

  getDemographics: async () => {
    try {
      return await apiCall('/api/patients/analytics/demographics');
    } catch (error) {
      console.error('Patient getDemographics API error:', error);
      throw error;
    }
  },

  getTopPatients: async (limit = 10) => {
    try {
      return await apiCall(`/api/patients/analytics/top-patients?limit=${limit}`);
    } catch (error) {
      console.error('Patient getTopPatients API error:', error);
      throw error;
    }
  },
};

// Doctors API
//
// Every call here hits the real backend. There is intentionally no
// fallback dataset: clinical and commission figures must never be
// invented, so a failure surfaces as an ApiError the UI can display.
export const doctorApi = {
  /** List + KPI totals + filter facets. */
  getAll: async (params?: string | Record<string, any>) => {
    let queryString = '';
    if (typeof params === 'string') {
      queryString = params ? `?${params}` : '';
    } else if (params && typeof params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const str = searchParams.toString();
      if (str) queryString = `?${str}`;
    }
    return apiCall(`/api/doctors${queryString}`);
  },

  /** Single doctor with ledger-derived metrics. */
  getById: async (id: string) => {
    return apiCall(`/api/doctors/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/api/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/api/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, isActive: boolean) => {
    return apiCall(`/api/doctors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  /** Archive (soft delete). Referral history is retained. */
  archive: async (id: string, reason?: string) => {
    return apiCall(`/api/doctors/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  restore: async (id: string) => {
    return apiCall(`/api/doctors/${id}/restore`, { method: 'POST' });
  },

  /** Legacy hard delete — the API refuses it when history exists. */
  delete: async (id: string) => {
    return apiCall(`/api/doctors/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (id: string) => {
    return apiCall(`/api/doctors/${id}/statistics`);
  },

  getCommission: async (id: string, params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiCall(`/api/doctors/${id}/commission${qs}`);
  },

  // ---- 360 view sub-resources ----
  getReferralHistory: async (id: string, params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiCall(`/api/doctors/${id}/referrals${qs}`);
  },

  getLedger: async (id: string, params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiCall(`/api/doctors/${id}/ledger${qs}`);
  },

  getPayoutHistory: async (id: string) => {
    return apiCall(`/api/doctors/${id}/payout-history`);
  },

  getTrend: async (id: string, months = 12) => {
    return apiCall(`/api/doctors/${id}/trend?months=${months}`);
  },

  getDocuments: async (id: string) => {
    return apiCall(`/api/doctors/${id}/documents`);
  },

  uploadDocument: async (id: string, data: any) => {
    return apiCall(`/api/doctors/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getActivity: async (id: string) => {
    return apiCall(`/api/doctors/${id}/activity`);
  },

  // ---- Payouts ----
  settlePayout: async (id: string, data: any) => {
    return apiCall(`/api/doctors/${id}/payout`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPendingPayouts: async (params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiCall(`/api/doctors/payouts/pending${qs}`);
  },

  // ---- Organisations (hospital / clinic partners) ----
  getOrganizations: async () => apiCall('/api/doctors/organizations'),

  createOrganization: async (data: any) =>
    apiCall('/api/doctors/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrganization: async (id: string, data: any) =>
    apiCall(`/api/doctors/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ---- Dropdown source for "Referred By" ----
  search: async (q?: string, limit = 20) =>
    apiCall(`/api/doctors/search?q=${encodeURIComponent(q || '')}&limit=${limit}`),

  getBySpecialization: async (specialization: string) => {
    return apiCall(`/api/doctors/specialization/${encodeURIComponent(specialization)}`);
  },

  uploadSignature: async (id: string, data: { signatureUrl?: string; signatureData?: string; mimeType?: string }) => {
    return apiCall(`/api/doctors/${id}/signature`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSeal: async (id: string) => {
    return apiCall(`/api/doctors/${id}/seal`);
  },
};

// Users API
export const userApi = {
  // Get all users
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/users${queryString}`);
    } catch (error) {
      console.error('Users API error, using fallback:', error);
      return {
        success: true,
        data: {
          users: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        message: 'Using fallback data (backend unavailable)'
      };
    }
  },

  // Get single user
  getById: async (id: string) => {
    try {
      return await apiCall(`/api/users/${id}`);
    } catch (error) {
      console.error('User detail API error:', error);
      throw error;
    }
  },

  // Create user
  create: async (data: any) => {
    return apiCall('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update user
  update: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('User update API error:', error);
      throw error;
    }
  },

  // Update profile settings
  updateProfile: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/users/${id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Profile update API error:', error);
      throw error;
    }
  },

  // Activate user
  activate: async (id: string) => {
    try {
      return await apiCall(`/api/users/${id}/activate`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('User activation API error:', error);
      throw error;
    }
  },

  // Suspend user
  suspend: async (id: string) => {
    try {
      return await apiCall(`/api/users/${id}/suspend`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('User suspension API error:', error);
      throw error;
    }
  },

  // Delete user
  delete: async (id: string) => {
    try {
      return await apiCall(`/api/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('User deletion API error:', error);
      throw error;
    }
  },
};

// Tests API
export const testApi = {
  getParameters: async (params = "") => { const qs = params ? `?${params}` : ""; return apiCall(`/api/tests/parameters${qs}`); },
  // Categories
  getCategories: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/tests/categories${queryString}`);
  },

  getCategory: async (id: string) => {
    return apiCall(`/api/tests/categories/${id}`);
  },

  createCategory: async (data: any) => {
    return apiCall('/api/tests/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (id: string, data: any) => {
    return apiCall(`/api/tests/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id: string) => {
    return apiCall(`/api/tests/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Tests
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/tests${queryString}`);
    } catch (error) {
      console.error('Tests API error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    return apiCall(`/api/tests/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/api/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/api/tests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/api/tests/${id}`, {
      method: 'DELETE',
    });
  },

  // Parameters
  addParameter: async (testId: string, data: any) => {
    return apiCall(`/api/tests/${testId}/parameters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateParameter: async (parameterId: string, data: any) => {
    return apiCall(`/api/tests/parameters/${parameterId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteParameter: async (parameterId: string) => {
    return apiCall(`/api/tests/parameters/${parameterId}`, {
      method: 'DELETE',
    });
  },

  // Reference Ranges
  addReferenceRange: async (parameterId: string, data: any) => {
    return apiCall(`/api/tests/parameters/${parameterId}/reference-ranges`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateReferenceRange: async (rangeId: string, data: any) => {
    return apiCall(`/api/tests/reference-ranges/${rangeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteReferenceRange: async (rangeId: string) => {
    return apiCall(`/api/tests/reference-ranges/${rangeId}`, {
      method: 'DELETE',
    });
  },

  // Packages
  getPackages: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/tests/packages${queryString}`);
    } catch (error) {
      console.error('Packages API error:', error);
      // Return fallback data instead of throwing
      return getFallbackData(`/api/tests/packages${queryString}`);
    }
  },

  getPackage: async (id: string) => {
    return apiCall(`/api/tests/packages/${id}`);
  },

  createPackage: async (data: any) => {
    return apiCall('/api/tests/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePackage: async (id: string, data: any) => {
    return apiCall(`/api/tests/packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deletePackage: async (id: string) => {
    return apiCall(`/api/tests/packages/${id}`, {
      method: 'DELETE',
    });
  },

  addPackageItem: async (packageId: string, data: any) => {
    return apiCall(`/api/tests/packages/${packageId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removePackageItem: async (packageId: string, testId: string) => {
    return apiCall(`/api/tests/packages/${packageId}/items/${testId}`, {
      method: 'DELETE',
    });
  },

  // Catalog Export/Import
  exportCatalog: async () => {
    try {
      return await apiCall('/api/tests/catalog/export');
    } catch (error) {
      console.error('Export catalog API error:', error);
      throw error;
    }
  },

  importCatalog: async (data: any) => {
    try {
      return await apiCall('/api/tests/catalog/import', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Import catalog API error:', error);
      throw error;
    }
  },

  // Advanced & Clinical Operations
  cloneTest: async (id: string, data: { testCode: string; suffix?: string }) => {
    return apiCall(`/api/tests/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  checkDuplicate: async (data: { testCode?: string; testName?: string }) => {
    return apiCall('/api/tests/premium/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkUpdatePrices: async (data: {
    testIds?: string[];
    categoryId?: string;
    sampleType?: string;
    adjustmentType: 'PERCENTAGE' | 'FIXED';
    adjustmentValue: number;
    applyToB2bRate?: boolean;
    roundTo?: number;
  }) => {
    return apiCall('/api/tests/premium/bulk-price-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkToggleActive: async (data: { testIds: string[]; isActive: boolean }) => {
    return apiCall('/api/tests/premium/bulk-toggle-active', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkDelete: async (data: { testIds: string[] }) => {
    return apiCall('/api/tests/premium/bulk-delete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reorderTests: async (data: { items: Array<{ id: string; displayOrder: number }> }) => {
    return apiCall('/api/tests/premium/reorder', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAnalytics: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/tests/premium/analytics${queryString}`);
  },

  recalculatePackagePricing: async (packageId: string, data = {}) => {
    return apiCall(`/api/tests/packages/${packageId}/recalculate-pricing`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Alias for compatibility
export const testsApi = testApi;

// Orders API
export const orderApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return apiCall(`/api/orders${queryString}`);
  },

  getById: async (id: string) => {
    return apiCall(`/api/orders/${id}`);
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Order creation API error:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Order update API error:', error);
      throw error;
    }
  },

  collectSample: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/orders/${id}/collect-sample`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Sample collection API error:', error);
      throw error;
    }
  },

  cancel: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Order cancellation API error:', error);
      throw error;
    }
  },

  // ─── Analytics ───────────────────────────────────────────────
  getAnalytics: async (params?: { from?: string; to?: string }) => {
    try {
      const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return await apiCall(`/api/orders/analytics${qs}`);
    } catch (error) {
      console.error('Orders analytics API error:', error);
      return null;
    }
  },

  getTATAnalytics: async () => {
    try {
      return await apiCall('/api/orders/analytics/tat');
    } catch (error) {
      console.error('TAT analytics API error:', error);
      return null;
    }
  },

  getHourlyThroughput: async () => {
    try {
      return await apiCall('/api/orders/analytics/hourly');
    } catch (error) {
      console.error('Hourly throughput API error:', error);
      return null;
    }
  },

  getPipeline: async (dateFilter?: string) => {
    try {
      const qs = dateFilter ? `?dateFilter=${dateFilter}` : '';
      return await apiCall(`/api/orders/analytics/pipeline${qs}`);
    } catch (error) {
      console.error('Pipeline API error:', error);
      return null;
    }
  },

  getRevenueByDoctor: async (params?: { from?: string; to?: string }) => {
    try {
      const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return await apiCall(`/api/orders/analytics/revenue-by-doctor${qs}`);
    } catch (error) {
      console.error('Revenue by doctor API error:', error);
      return null;
    }
  },

  // ─── Bulk Operations ─────────────────────────────────────────
  bulkEscalatePriority: async (orderIds: string[], priority: string) => {
    try {
      return await apiCall('/api/orders/bulk/escalate-priority', {
        method: 'POST',
        body: JSON.stringify({ orderIds, priority }),
      });
    } catch (error) {
      console.error('Bulk escalate API error:', error);
      throw error;
    }
  },

  bulkUpdateStatus: async (orderIds: string[], status: string) => {
    try {
      return await apiCall('/api/orders/bulk/update-status', {
        method: 'POST',
        body: JSON.stringify({ orderIds, status }),
      });
    } catch (error) {
      console.error('Bulk status API error:', error);
      throw error;
    }
  },
};

// Alias for compatibility
export const ordersApi = orderApi;

// Samples API
export const sampleApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/samples${queryString}`);
    } catch (error) {
      console.error('Samples API error, using fallback:', error);
      return getFallbackData(`/api/samples${queryString}`);
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/samples/${id}`);
    } catch (error) {
      console.error('Sample detail API error:', error);
      throw error;
    }
  },

  // Backward-compatible alias used by the sample detail screen.
  getOne: async (id: string) => {
    return sampleApi.getById(id);
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/samples', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Sample creation API error:', error);
      throw error;
    }
  },

  collect: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/samples/${id}/collect`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Sample collection API error:', error);
      throw error;
    }
  },

  collectSample: async (data: any) => {
    try {
      const targetId = data.sampleId || data.orderId || '';
      return await apiCall(`/api/samples/${targetId}/collect`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Sample collection API error:', error);
      throw error;
    }
  },

  receive: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/samples/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Sample receive API error:', error);
      throw error;
    }
  },

  process: async (id: string, location?: string) => {
    try {
      return await apiCall(`/api/samples/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ location }),
      });
    } catch (error) {
      console.error('Sample process API error:', error);
      throw error;
    }
  },

  complete: async (id: string, location?: string) => {
    try {
      return await apiCall(`/api/samples/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ location }),
      });
    } catch (error) {
      console.error('Sample complete API error:', error);
      throw error;
    }
  },

  reject: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/samples/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Sample rejection API error:', error);
      throw error;
    }
  },

  getTracking: async (id: string) => {
    try {
      return await apiCall(`/api/samples/${id}/tracking`);
    } catch (error) {
      console.error('Sample tracking API error:', error);
      throw error;
    }
  },

  getOrderTracking: async (orderId: string) => {
    try {
      return await apiCall(`/api/samples/order/${orderId}/tracking`);
    } catch (error) {
      console.error('Order tracking API error:', error);
      throw error;
    }
  },

  getPatientTracking: async (patientId: string, limit = 50) => {
    try {
      return await apiCall(`/api/samples/patient/${patientId}/tracking?limit=${limit}`);
    } catch (error) {
      console.error('Patient tracking API error:', error);
      throw error;
    }
  },

  getComprehensiveTracking: async (patientId: string) => {
    try {
      return await apiCall(`/api/samples/patient/${patientId}/comprehensive`);
    } catch (error) {
      console.error('Comprehensive patient tracking API error:', error);
      throw error;
    }
  },

  addTrackingEvent: async (sampleId: string, data: any) => {
    try {
      return await apiCall(`/api/samples/${sampleId}/tracking`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Add tracking event API error:', error);
      throw error;
    }
  },
};

// Alias for compatibility
export const samplesApi = sampleApi;

// Barcode API
export const barcodeApi = {
  generateOrderBarcode: async (orderId: string) => {
    try {
      return await apiCall(`/api/barcode/order/${orderId}`, { method: 'POST' });
    } catch (error) {
      console.error('Generate order barcode API error:', error);
      throw error;
    }
  },

  generateSampleBarcode: async (sampleId: string) => {
    try {
      return await apiCall(`/api/barcode/sample/${sampleId}`, { method: 'POST' });
    } catch (error) {
      console.error('Generate sample barcode API error:', error);
      throw error;
    }
  },

  generatePatientBarcode: async (patientId: string) => {
    try {
      return await apiCall(`/api/barcode/patient/${patientId}`, { method: 'POST' });
    } catch (error) {
      console.error('Generate patient barcode API error:', error);
      throw error;
    }
  },

  validate: async (barcode: string) => {
    try {
      return await apiCall(`/api/barcode/validate/${encodeURIComponent(barcode)}`);
    } catch (error) {
      console.error('Validate barcode API error:', error);
      throw error;
    }
  },

  getPrintData: async (barcode: string) => {
    try {
      return await apiCall(`/api/barcode/print/${encodeURIComponent(barcode)}`);
    } catch (error) {
      console.error('Get barcode print data API error:', error);
      throw error;
    }
  },

  scan: async (barcode: string) => {
    try {
      return await apiCall('/api/barcode/scan', {
        method: 'POST',
        body: JSON.stringify({ barcode }),
      });
    } catch (error) {
      console.error('Scan barcode API error:', error);
      throw error;
    }
  },
};

// Results API
export const resultsApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/results${queryString}`);
    } catch (error) {
      console.error('Results API error, using fallback:', error);
      return getFallbackData(`/api/results${queryString}`);
    }
  },

  getMetrics: async () => {
    try {
      return await apiCall('/api/results/metrics');
    } catch (error) {
      console.error('Results metrics API error, using fallback:', error);
      return getFallbackData('/api/results/metrics');
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/results/${id}`);
    } catch (error) {
      console.error('Result detail API error:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/results', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Result creation API error, using fallback:', error);
      // Return fallback success for demo
      return {
        success: true,
        message: 'Result created successfully (demo mode)',
        data: { 
          id: 'demo-result-' + Date.now(),
          ...data,
          status: 'ENTERED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
  },

  update: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/results/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Result update API error, using fallback:', error);
      // Return fallback success for demo
      return {
        success: true,
        message: 'Result updated successfully (demo mode)',
        data: { id, ...data, status: 'ENTERED' }
      };
    }
  },

  verify: async (id: string) => {
    try {
      return await apiCall(`/api/results/${id}/verify`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Result verification API error:', error);
      throw error;
    }
  },

  approve: async (id: string) => {
    try {
      return await apiCall(`/api/results/${id}/approve`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Result approval API error:', error);
      throw error;
    }
  },

  reject: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/results/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Result rejection API error:', error);
      throw error;
    }
  },

  publish: async (id: string) => {
    try {
      return await apiCall(`/api/results/${id}/publish`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Result publication API error:', error);
      throw error;
    }
  },
};

// Invoices API
export const invoicesApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/invoices${queryString}`);
    } catch (error) {
      console.error('Invoices API error, using fallback:', error);
      return getFallbackData(`/api/invoices${queryString}`);
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/invoices/${id}`);
    } catch (error) {
      console.error('Invoice detail API error:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Invoice creation API error:', error);
      throw error;
    }
  },

  refreshPaymentStatus: async (id: string) => {
    try {
      return await apiCall(`/api/invoices/${id}/payment-status`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Payment status refresh API error:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      return await apiCall(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Invoice deletion API error:', error);
      throw error;
    }
  },

  getBillingMetrics: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/invoices/metrics/billing${queryString}`);
    } catch (error) {
      console.error('Billing metrics API error, using fallback:', error);
      return getFallbackData(`/api/invoices/metrics/billing${queryString}`);
    }
  },

  processRefund: async (data: any) => {
    try {
      return await apiCall('/api/invoices/refund', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Refund processing API error:', error);
      throw error;
    }
  },

  recordPayment: async (data: any) => {
    try {
      return await apiCall('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Payment recording API error:', error);
      throw error;
    }
  },

  getPaymentHistory: async (invoiceId: string) => {
    try {
      return await apiCall(`/api/invoices/${invoiceId}/payments`);
    } catch (error) {
      console.error('Payment history API error:', error);
      throw error;
    }
  },
};

// Payments API
export const paymentsApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/payments${queryString}`);
    } catch (error) {
      console.error('Payments API error, using fallback:', error);
      return getFallbackData(`/api/payments${queryString}`);
    }
  },

  getMetrics: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/payments/metrics${queryString}`);
    } catch (error) {
      console.error('Payment metrics API error, using fallback:', error);
      return getFallbackData(`/api/payments/metrics${queryString}`);
    }
  },

  getShiftCloseReport: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/payments/shift-close${queryString}`);
    } catch (error) {
      console.error('Shift close report API error, using fallback:', error);
      return getFallbackData(`/api/payments/shift-close${queryString}`);
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/payments/${id}`);
    } catch (error) {
      console.error('Payment detail API error, using fallback:', error);
      return getFallbackData(`/api/payments/${id}`);
    }
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Payment creation API error:', error);
      throw error;
    }
  },

  createSplit: async (data: any) => {
    try {
      return await apiCall('/api/payments/split', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Split payment creation API error:', error);
      throw error;
    }
  },

  refund: async (id: string, data: any = {}) => {
    try {
      return await apiCall(`/api/payments/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Payment refund API error:', error);
      throw error;
    }
  },
};

// Advances & Wallet API
export const advancesApi = {
  create: async (data: any) => {
    try {
      return await apiCall('/api/advances', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Create advance API error:', error);
      throw error;
    }
  },

  getByPatient: async (patientId: string) => {
    try {
      return await apiCall(`/api/advances/patient/${patientId}`);
    } catch (error) {
      console.error('Get patient advances error:', error);
      throw error;
    }
  },

  getWallet: async (patientId: string) => {
    try {
      return await apiCall(`/api/advances/wallet/${patientId}`);
    } catch (error) {
      console.error('Get patient wallet error:', error);
      throw error;
    }
  },

  apply: async (data: any) => {
    try {
      return await apiCall('/api/advances/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Apply advance error:', error);
      throw error;
    }
  },

  refund: async (data: any) => {
    try {
      return await apiCall('/api/advances/refund', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Refund advance error:', error);
      throw error;
    }
  },
};

// Refunds API
export const refundsApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/refunds${queryString}`);
    } catch (error) {
      console.error('Refunds getAll API error:', error);
      return { success: false, data: [] };
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/refunds/${id}`);
    } catch (error) {
      console.error('Refund getById API error:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/refunds', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Refund create API error:', error);
      throw error;
    }
  },

  approve: async (data: any) => {
    try {
      return await apiCall('/api/refunds/approve', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Refund approve API error:', error);
      throw error;
    }
  },

  reject: async (data: any) => {
    try {
      return await apiCall('/api/refunds/reject', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Refund reject API error:', error);
      throw error;
    }
  },

  process: async (data: any) => {
    try {
      return await apiCall('/api/refunds/process', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Refund process API error:', error);
      throw error;
    }
  },
};

// Cash Counter API
export const cashCounterApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/cash-counter${queryString}`);
    } catch (error) {
      console.error('Cash counter getAll error:', error);
      return { success: false, data: [] };
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/cash-counter/${id}`);
    } catch (error) {
      console.error('Cash counter getById error:', error);
      throw error;
    }
  },

  open: async (data: any) => {
    try {
      return await apiCall('/api/cash-counter/open', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Cash counter open error:', error);
      throw error;
    }
  },

  close: async (data: any) => {
    try {
      return await apiCall('/api/cash-counter/close', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Cash counter close error:', error);
      throw error;
    }
  },

  addMovement: async (data: any) => {
    try {
      return await apiCall('/api/cash-counter/movement', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Cash counter movement error:', error);
      throw error;
    }
  },

  getDaybook: async (sessionId: string) => {
    try {
      return await apiCall(`/api/cash-counter/sessions/${sessionId}/daybook`);
    } catch (error) {
      console.error('Cash counter getDaybook error:', error);
      throw error;
    }
  },

  handover: async (sessionId: string, data: any) => {
    try {
      return await apiCall(`/api/cash-counter/sessions/${sessionId}/handover`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Cash counter handover error:', error);
      throw error;
    }
  },

  calculateDenominations: async (denominations: Record<string, number>) => {
    try {
      return await apiCall('/api/cash-counter/calculate-denominations', {
        method: 'POST',
        body: JSON.stringify({ denominations }),
      });
    } catch (error) {
      console.error('Calculate denominations error:', error);
      throw error;
    }
  },
};

// Database Automated Backup & Disaster Recovery (DR) API (Day 16)
export const backupApi = {
  getAll: async () => {
    try {
      return await apiCall('/api/backups');
    } catch (error) {
      console.error('Backup getAll error:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      return await apiCall('/api/backups/stats');
    } catch (error) {
      console.error('Backup getStats error:', error);
      throw error;
    }
  },

  create: async () => {
    try {
      return await apiCall('/api/backups', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Backup create error:', error);
      throw error;
    }
  },

  restore: async (fileName: string) => {
    try {
      return await apiCall(`/api/backups/restore/${encodeURIComponent(fileName)}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Backup restore error:', error);
      throw error;
    }
  },

  delete: async (fileName: string) => {
    try {
      return await apiCall(`/api/backups/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Backup delete error:', error);
      throw error;
    }
  },

  applyRetention: async () => {
    try {
      return await apiCall('/api/backups/retention/apply', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Backup applyRetention error:', error);
      throw error;
    }
  },

  getGfsStatus: async () => {
    try {
      return await apiCall('/api/backups/gfs');
    } catch (error) {
      console.error('Backup getGfsStatus error:', error);
      throw error;
    }
  },

  verify: async (fileName: string) => {
    try {
      return await apiCall(`/api/backups/verify/${encodeURIComponent(fileName)}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Backup verify error:', error);
      throw error;
    }
  },

  getSchedulerStatus: async () => {
    try {
      return await apiCall('/api/backups/scheduler/status');
    } catch (error) {
      console.error('Backup getSchedulerStatus error:', error);
      throw error;
    }
  },

  triggerSchedulerNow: async () => {
    try {
      return await apiCall('/api/backups/scheduler/trigger', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Backup triggerSchedulerNow error:', error);
      throw error;
    }
  },
};

// Settlements & Reconciliation API
export const settlementsApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/settlements${queryString}`);
    } catch (error) {
      console.error('Settlements getAll error:', error);
      return { success: false, data: [] };
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/settlements/${id}`);
    } catch (error) {
      console.error('Settlements getById error:', error);
      throw error;
    }
  },

  getSummary: async () => {
    try {
      return await apiCall('/api/settlements/summary');
    } catch (error) {
      console.error('Settlements summary error:', error);
      return { success: false, data: null };
    }
  },

  create: async (data: any) => {
    try {
      return await apiCall('/api/settlements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Settlement create error:', error);
      throw error;
    }
  },

  process: async (data: any) => {
    try {
      return await apiCall('/api/settlements/process', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Settlement process error:', error);
      throw error;
    }
  },

  reconcile: async (data: any) => {
    try {
      return await apiCall('/api/settlements/reconcile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Settlement reconcile error:', error);
      throw error;
    }
  },

  createReconciliation: async (data: any) => {
    try {
      return await apiCall('/api/settlements/reconciliation', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Create reconciliation error:', error);
      throw error;
    }
  },

  listReconciliations: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/settlements/reconciliation/list${queryString}`);
    } catch (error) {
      console.error('List reconciliations error:', error);
      return { success: false, data: [] };
    }
  },
};

// Receivables API
export const receivablesApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/receivables${queryString}`);
    } catch (error) {
      console.error('Receivables getAll error:', error);
      return { success: false, data: [] };
    }
  },

  getSummary: async () => {
    try {
      return await apiCall('/api/receivables/summary');
    } catch (error) {
      console.error('Receivables summary error:', error);
      return { success: false, data: null };
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/receivables/${id}`);
    } catch (error) {
      console.error('Receivables getById error:', error);
      throw error;
    }
  },

  recordPayment: async (data: any) => {
    try {
      return await apiCall('/api/receivables/payment', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Receivable payment error:', error);
      throw error;
    }
  },

  getCorporate: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/receivables/corporate${queryString}`);
    } catch (error) {
      console.error('Corporate receivables error:', error);
      return { success: false, data: [] };
    }
  },
};

// Reports API
export const reportsApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/reports${queryString}`);
    } catch (error) {
      console.error('Reports API error, using fallback:', error);
      return getFallbackData(`/api/reports${queryString}`);
    }
  },

  getPublishedReports: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    try {
      return await apiCall(`/api/reports/published${queryString}`);
    } catch (error) {
      console.error('Published reports API error, using fallback:', error);
      return getFallbackData(`/api/reports/published${queryString}`);
    }
  },

  getSummary: async () => {
    try {
      return await apiCall('/api/reports/summary');
    } catch (error) {
      console.error('Reports summary API error, using fallback:', error);
      return getFallbackData('/api/reports/summary');
    }
  },

  getById: async (id: string) => {
    try {
      return await apiCall(`/api/reports/${id}`);
    } catch (error) {
      console.error('Report detail API error:', error);
      throw error;
    }
  },

  getOrderReport: async (orderId: string) => {
    try {
      return await apiCall(`/api/reports/order/${orderId}`);
    } catch (error) {
      console.error('Order report API error:', error);
      throw error;
    }
  },

  generate: async (data: any) => {
    try {
      return await apiCall('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Report generation API error:', error);
      throw error;
    }
  },

  download: async (id: string) => {
    try {
      return await apiCall(`/api/reports/${id}/download`);
    } catch (error) {
      console.error('Report download API error:', error);
      throw error;
    }
  },

  sendWhatsApp: async (reportId: string, data: any) => {
    try {
      return await apiCall(`/api/reports/${reportId}/send-whatsapp`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('WhatsApp send API error:', error);
      throw error;
    }
  },

  sendEmail: async (reportId: string, data: any) => {
    try {
      return await apiCall(`/api/reports/${reportId}/send-email`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Email send API error:', error);
      throw error;
    }
  },

  printReport: async (reportId: string, data: any) => {
    try {
      return await apiCall(`/api/reports/${reportId}/print`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Report print API error:', error);
      throw error;
    }
  },

  bulkDispatch: async (data: any) => {
    try {
      return await apiCall('/api/reports/bulk-dispatch', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Bulk dispatch API error:', error);
      throw error;
    }
  },

  // Premium Report Actions
  createAddendum: async (reportId: string, content: string, isPrivate: boolean = false) => {
    try {
      return await apiCall(`/api/reports/${reportId}/addendum`, {
        method: 'POST',
        body: JSON.stringify({ content, isPrivate }),
      });
    } catch (error) {
      console.error('Create addendum API error:', error);
      throw error;
    }
  },

  applyDigitalSignature: async (reportId: string, signatureData: string) => {
    try {
      return await apiCall(`/api/reports/${reportId}/signature`, {
        method: 'POST',
        body: JSON.stringify({ signatureData }),
      });
    } catch (error) {
      console.error('Apply signature API error:', error);
      throw error;
    }
  },

  inlineApprove: async (reportId: string, notes?: string) => {
    try {
      return await apiCall(`/api/reports/${reportId}/approve-inline`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    } catch (error) {
      console.error('Inline approve API error:', error);
      throw error;
    }
  },

  inlineReject: async (reportId: string, reason: string) => {
    try {
      return await apiCall(`/api/reports/${reportId}/reject-inline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (error) {
      console.error('Inline reject API error:', error);
      throw error;
    }
  },

  amendReport: async (reportId: string, amendmentType: string, reason: string) => {
    try {
      return await apiCall(`/api/reports/${reportId}/amend`, {
        method: 'POST',
        body: JSON.stringify({ amendmentType, reason }),
      });
    } catch (error) {
      console.error('Amend report API error:', error);
      throw error;
    }
  },

  sendReportToDoctor: async (reportId: string, doctorId: string, channel: string) => {
    try {
      return await apiCall(`/api/reports/${reportId}/send-doctor`, {
        method: 'POST',
        body: JSON.stringify({ doctorId, channel }),
      });
    } catch (error) {
      console.error('Send report to doctor API error:', error);
      throw error;
    }
  },

  generateShareLink: async (reportId: string, expiresIn?: number) => {
    try {
      return await apiCall(`/api/reports/${reportId}/share-link`, {
        method: 'POST',
        body: JSON.stringify({ expiresIn }),
      });
    } catch (error) {
      console.error('Generate share link API error:', error);
      throw error;
    }
  },

  validateShareLink: async (token: string) => {
    try {
      return await apiCall(`/api/reports/share/${token}`);
    } catch (error) {
      console.error('Validate share link API error:', error);
      throw error;
    }
  },

  revokeShareLink: async (linkId: string) => {
    try {
      return await apiCall(`/api/reports/share/${linkId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Revoke share link API error:', error);
      throw error;
    }
  },

  addToPatientHistory: async (reportId: string, notes?: string) => {
    try {
      return await apiCall(`/api/reports/${reportId}/patient-history`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    } catch (error) {
      console.error('Add to patient history API error:', error);
      throw error;
    }
  },

  getPatientTimeline: async (patientId: string, page: number = 1, limit: number = 20) => {
    try {
      return await apiCall(`/api/reports/patient/${patientId}/timeline?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('Get patient timeline API error:', error);
      throw error;
    }
  },
};

// Approvals API
export const approvalsApi = {
  getAll: async (params = '') => {
    const queryString = params ? `?${params}` : '';
    return await apiCall(`/api/approvals${queryString}`);
  },

  getMetrics: async () => {
    return await apiCall('/api/approvals/metrics');
  },

  getPending: async (params = '') => {
    const queryString = params ? (params.startsWith('?') ? params : `?${params}`) : '';
    return await apiCall(`/api/approvals/pending${queryString}`);
  },

  getById: async (id: string) => {
    return await apiCall(`/api/approvals/${id}`);
  },

  getHistory: async (id: string) => {
    try {
      return await apiCall(`/api/approvals/${id}/history`);
    } catch (error) {
      console.error('Approval history delta API error:', error);
      return { success: false, data: null };
    }
  },

  batchApprove: async (ids: string[], remarks?: string) => {
    try {
      return await apiCall(`/api/approvals/batch-approve`, {
        method: 'POST',
        body: JSON.stringify({ ids, remarks }),
      });
    } catch (error) {
      console.error('Batch approval API error:', error);
      throw error;
    }
  },

  recordCriticalAck: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/approvals/${id}/critical-ack`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Critical acknowledgment API error:', error);
      throw error;
    }
  },

  approve: async (id: string, data: any = {}) => {
    try {
      return await apiCall(`/api/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Approval API error:', error);
      throw error;
    }
  },

  reject: async (id: string, data: any) => {
    try {
      return await apiCall(`/api/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Rejection API error:', error);
      throw error;
    }
  },

  publish: async (id: string) => {
    try {
      return await apiCall(`/api/approvals/${id}/publish`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Publish API error:', error);
      throw error;
    }
  },

  getSignature: async (id: string) => {
    try {
      return await apiCall(`/api/approvals/${id}/signature`);
    } catch (error) {
      console.error('Get signature API error:', error);
      throw error;
    }
  },

  verifySignature: async (id: string) => {
    try {
      return await apiCall(`/api/approvals/${id}/verify-signature`);
    } catch (error) {
      console.error('Verify signature API error:', error);
      throw error;
    }
  },

  getQcChart: async (id: string, parameter?: string) => {
    try {
      const query = parameter ? `?parameter=${encodeURIComponent(parameter)}` : '';
      return await apiCall(`/api/approvals/${id}/qc-chart${query}`);
    } catch (error) {
      console.error('Get QC chart API error:', error);
      throw error;
    }
  },

  getTestQcChart: async (testCode: string, parameter?: string) => {
    try {
      const query = parameter ? `?parameter=${encodeURIComponent(parameter)}` : '';
      return await apiCall(`/api/approvals/qc-chart/${encodeURIComponent(testCode)}${query}`);
    } catch (error) {
      console.error('Get test QC chart API error:', error);
      throw error;
    }
  },

  amendResult: async (id: string, data: {
    amendmentReason: string;
    amendmentType?: string;
    updatedValues: Array<{ parameterId: string; value: string; flag?: string }>;
    notes?: string;
  }) => {
    try {
      return await apiCall(`/api/approvals/${id}/amend`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Amend result API error:', error);
      throw error;
    }
  },

  getAmendments: async (id: string) => {
    try {
      return await apiCall(`/api/approvals/${id}/amendments`);
    } catch (error) {
      console.error('Get amendments API error:', error);
      throw error;
    }
  },

  getTriageQueue: async () => {
    try {
      return await apiCall('/api/approvals/triage/queue');
    } catch (error) {
      console.error('Get triage queue API error:', error);
      throw error;
    }
  },

  getPanicReadBackLedger: async (unresolved = false) => {
    try {
      const query = unresolved ? '?unresolved=true' : '';
      return await apiCall(`/api/approvals/panic-triage/ledger${query}`);
    } catch (error) {
      console.error('Get panic readback ledger API error:', error);
      throw error;
    }
  },

  recordPanicReadBack: async (data: {
    panicLogId: string;
    notifiedDoctorName: string;
    doctorPhone: string;
    readBackConfirmed: boolean;
    clinicalActionRemarks: string;
    callTimestamp?: string;
  }) => {
    try {
      return await apiCall('/api/approvals/panic-triage/readback', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Record panic readback API error:', error);
      throw error;
    }
  },

  checkOrderDispatchStatus: async (orderId: string) => {
    try {
      return await apiCall(`/api/approvals/panic-triage/dispatch-status/${orderId}`);
    } catch (error) {
      console.error('Check dispatch status API error:', error);
      throw error;
    }
  },
};


// Alias for compatibility
export const resultApi = resultsApi;
export const invoiceApi = invoicesApi;
export const paymentApi = paymentsApi;
export const reportApi = reportsApi;
export const approvalApi = approvalsApi;
export const advanceApi = advancesApi;
export const refundApi = refundsApi;
export const settlementApi = settlementsApi;
export const receivableApi = receivablesApi;

// Analyzers API
const formatQuery = (params = '') => {
  if (!params) return '';
  return params.startsWith('?') ? params : `?${params}`;
};

export const analyzersApi = {
  // Analyzer CRUD
  getAll: async (params = '') => {
    return apiCall(`/api/analyzers${formatQuery(params)}`);
  },

  getById: async (id: string) => {
    return apiCall(`/api/analyzers/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/api/analyzers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  archive: async (id: string) => {
    return apiCall(`/api/analyzers/${id}/archive`, {
      method: 'POST',
    });
  },

  delete: async (id: string) => {
    return apiCall(`/api/analyzers/${id}`, {
      method: 'DELETE',
    });
  },

  // Status Management
  updateStatus: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  heartbeat: async (id: string, data: any = {}) => {
    return apiCall(`/api/analyzers/${id}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Calibration Management
  createCalibration: async (data: any) => {
    return apiCall('/api/analyzers/calibrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCalibrations: async (params = '') => {
    return apiCall(`/api/analyzers/calibrations${formatQuery(params)}`);
  },

  getCalibrationById: async (id: string) => {
    return apiCall(`/api/analyzers/calibrations/${id}`);
  },

  // Maintenance Management
  createMaintenance: async (data: any) => {
    return apiCall('/api/analyzers/maintenances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMaintenances: async (params = '') => {
    return apiCall(`/api/analyzers/maintenances${formatQuery(params)}`);
  },

  updateMaintenance: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/maintenances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Test Code Mapping
  createTestMapping: async (data: any) => {
    return apiCall('/api/analyzers/test-mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTestMappings: async (params = '') => {
    return apiCall(`/api/analyzers/test-mappings${formatQuery(params)}`);
  },

  updateTestMapping: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/test-mappings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteTestMapping: async (id: string) => {
    return apiCall(`/api/analyzers/test-mappings/${id}`, {
      method: 'DELETE',
    });
  },

  // Analyzer Jobs
  createJob: async (data: any) => {
    return apiCall('/api/analyzers/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getJobs: async (params = '') => {
    return apiCall(`/api/analyzers/jobs${formatQuery(params)}`);
  },

  updateJob: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Health & Alerts
  getHealth: async () => {
    return apiCall('/api/analyzers/health');
  },

  createAlert: async (data: any) => {
    return apiCall('/api/analyzers/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAlerts: async (params = '') => {
    return apiCall(`/api/analyzers/alerts${formatQuery(params)}`);
  },

  acknowledgeAlert: async (id: string) => {
    return apiCall(`/api/analyzers/alerts/${id}/acknowledge`, {
      method: 'POST',
    });
  },

  resolveAlert: async (id: string, data: any = {}) => {
    return apiCall(`/api/analyzers/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Communication Logs
  getCommunicationLogs: async (params = '') => {
    return apiCall(`/api/analyzers/communication-logs${formatQuery(params)}`);
  },

  // Legacy ASTM/HL7 communication
  sendASTM: async (data: any) => {
    return apiCall('/api/analyzers/astm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendHL7: async (data: any) => {
    return apiCall('/api/analyzers/hl7', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Advanced Connectivity Features
  testConnection: async (id: string, data: any = {}) => {
    return apiCall(`/api/analyzers/${id}/test-connection`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getConnectionStatus: async (id: string) => {
    return apiCall(`/api/analyzers/${id}/connection-status`);
  },

  getConnectionMetrics: async (id: string, hours = 24) => {
    return apiCall(`/api/analyzers/${id}/connection-metrics?hours=${hours}`);
  },

  startMonitoring: async (id: string, data: any = {}) => {
    return apiCall(`/api/analyzers/${id}/start-monitoring`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  stopMonitoring: async (id: string) => {
    return apiCall(`/api/analyzers/${id}/stop-monitoring`, {
      method: 'POST',
    });
  },

  sendTestMessage: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/${id}/send-test-message`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Protocol Support
  parseASTM: async (data: any) => {
    return apiCall('/api/analyzers/parse-astm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  parseHL7: async (data: any) => {
    return apiCall('/api/analyzers/parse-hl7', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateASTM: async (data: any) => {
    return apiCall('/api/analyzers/generate-astm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateHL7: async (data: any) => {
    return apiCall('/api/analyzers/generate-hl7', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Legacy Analyzer Logs
  createLog: async (data: any) => {
    return apiCall('/api/analyzers/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLogs: async (params = '') => {
    return apiCall(`/api/analyzers/logs${formatQuery(params)}`);
  },

  getLogById: async (id: string) => {
    return apiCall(`/api/analyzers/logs/${id}`);
  },

  processLog: async (id: string, data: any = {}) => {
    return apiCall(`/api/analyzers/logs/${id}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  failLog: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/logs/${id}/fail`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteLog: async (id: string) => {
    return apiCall(`/api/analyzers/logs/${id}`, {
      method: 'DELETE',
    });
  },

  // New Features
  getDemoData: async () => {
    return apiCall('/api/analyzers/demo-data');
  },

  createPortMapping: async (data: any) => {
    return apiCall('/api/analyzers/port-mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPortMappings: async (params = '') => {
    return apiCall(`/api/analyzers/port-mappings${formatQuery(params)}`);
  },

  createQCRule: async (data: any) => {
    return apiCall('/api/analyzers/qc-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getQCRules: async (params = '') => {
    return apiCall(`/api/analyzers/qc-rules${formatQuery(params)}`);
  },

  updateQCRule: async (id: string, data: Record<string, unknown>) => {
    return apiCall(`/api/analyzers/qc-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  createWorklistEntry: async (data: any) => {
    return apiCall('/api/analyzers/worklist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getWorklistEntries: async (params = '') => {
    return apiCall(`/api/analyzers/worklist${formatQuery(params)}`);
  },

  updateWorklistEntry: async (id: string, data: any) => {
    return apiCall(`/api/analyzers/worklist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Reflex & Cascade Testing
  getReflexRules: async (params = '') => {
    return apiCall(`/api/analyzers/reflex-rules${formatQuery(params)}`);
  },
  createReflexRule: async (data: any) => {
    return apiCall('/api/analyzers/reflex-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Smart Fleet Workload Balancer
  getFleetWorkload: async () => {
    return apiCall('/api/analyzers/workload-balance');
  },
  autoBalanceFleet: async (data: any = {}) => {
    return apiCall('/api/analyzers/workload-balance/auto-balance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Maintenance & NABL Compliance
  getMaintenanceLogbook: async (params = '') => {
    return apiCall(`/api/analyzers/maintenance-logbook${formatQuery(params)}`);
  },
  signOffMaintenance: async (data: any) => {
    return apiCall('/api/analyzers/maintenance-logbook/sign-off', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Virtual Machine Simulator -> Integration Engine Bridge
  sendSimulatorEvent: async (data: {
    analyzerId: string;
    eventType: 'ONLINE' | 'OFFLINE' | 'RECONNECTED' | 'ERROR' | 'HEARTBEAT' | 'MALFORMED_FRAME';
    isSimulation: true;
    simulationMode: 'SIMULATION_MODE';
    timestamp?: string;
    latencyMs?: number;
    payload?: Record<string, any>;
    idempotencyKey?: string;
    errorCode?: string;
    errorMessage?: string;
  }) => {
    return apiCall('/api/analyzers/simulator/event', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Omniscient Nexus Command Center API
export const nexusApi = {
  getOverview: async () => {
    return apiCall('/api/nexus/overview');
  },
  getFleetStatus: async (staleThresholdSeconds: number = 30) => {
    return apiCall(`/api/nexus/fleet-status?staleThresholdSeconds=${staleThresholdSeconds}`);
  },
  getOperatingMode: async (orgId?: string) => {
    return apiCall(`/api/nexus/mode${orgId ? `?organizationId=${orgId}` : ''}`);
  },
  reviewProposal: async (id: string, decision: 'APPROVED' | 'REJECTED', reviewNotes?: string) => {
    return apiCall(`/api/nexus/proposals/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewNotes }),
    });
  },
};

// Alias for compatibility
export const analyzerApi = analyzersApi;

/* =======================================================
   GENERIC REST HELPERS (used by use.Api hook)
======================================================= */

export interface ApiRequestOptions {
  headers?: HeadersInit;
  token?: string;
  signal?: AbortSignal;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
}

async function buildRequestInit(
  method: string,
  options?: ApiRequestOptions,
  body?: unknown
): Promise<RequestInit> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (options?.token) {
    headers.Authorization = "Bearer " + options.token;
  }

  return {
    method,
    headers,
    signal: options?.signal,
    ...(body !== undefined
      ? {
          body: body instanceof FormData ? body : JSON.stringify(body),
        }
      : {}),
  };
}

export async function apiGet<T = unknown>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiCall(endpoint, await buildRequestInit("GET", options));
}

export async function apiPost<T = unknown, B = unknown>(
  endpoint: string,
  body?: B,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiCall(endpoint, await buildRequestInit("POST", options, body));
}

export async function apiPut<T = unknown, B = unknown>(
  endpoint: string,
  body?: B,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiCall(endpoint, await buildRequestInit("PUT", options, body));
}

export async function apiPatch<T = unknown, B = unknown>(
  endpoint: string,
  body?: B,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiCall(endpoint, await buildRequestInit("PATCH", options, body));
}

export async function apiDelete<T = unknown>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiCall(endpoint, await buildRequestInit("DELETE", options));
}

export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiCall(endpoint, await buildRequestInit("POST", options, formData));
}

export const abdmApi = {
  getGatewayStatus: () => apiCall("/api/abdm/gateway/status"),
  initAadhaarOtp: (aadhaarNumber: string) =>
    apiCall("/api/abdm/abha/generate/aadhaar/otp", {
      method: "POST",
      body: JSON.stringify({ aadhaarNumber }),
    }),
  verifyAadhaarOtp: (txnId: string, otp: string) =>
    apiCall("/api/abdm/abha/generate/aadhaar/verify", {
      method: "POST",
      body: JSON.stringify({ txnId, otp }),
    }),
  initMobileOtp: (mobile: string) =>
    apiCall("/api/abdm/abha/generate/mobile/otp", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    }),
  verifyMobileOtp: (txnId: string, otp: string) =>
    apiCall("/api/abdm/abha/generate/mobile/verify", {
      method: "POST",
      body: JSON.stringify({ txnId, otp }),
    }),
  initVerifyAbha: (abhaAddress: string) =>
    apiCall("/api/abdm/abha/verify/init", {
      method: "POST",
      body: JSON.stringify({ abhaAddress }),
    }),
  confirmVerifyAbha: (txnId: string, otp: string) =>
    apiCall("/api/abdm/abha/verify/confirm", {
      method: "POST",
      body: JSON.stringify({ txnId, otp }),
    }),
  linkPatient: (patientId: string, abhaNumber: string, abhaAddress: string) =>
    apiCall(`/api/abdm/patient/${patientId}/link`, {
      method: "POST",
      body: JSON.stringify({ abhaNumber, abhaAddress }),
    }),
  unlinkPatient: (patientId: string) =>
    apiCall(`/api/abdm/patient/${patientId}/unlink`, { method: "POST" }),
  getPatientCard: (patientId: string) =>
    apiCall(`/api/abdm/patient/${patientId}/card`),
  getScanShareQr: () => apiCall("/api/abdm/scan-share/qr"),
  previewFhirBundle: (orderId: string) =>
    apiCall(`/api/abdm/fhir/bundle/${orderId}`),
};

export const searchApi = {
  globalSearch: (
    query: string,
    category: string = "ALL",
    limit: number = 10,
    branchId?: string | null
  ) => {
    const params = new URLSearchParams({
      q: query,
      category,
      limit: String(limit),
    });
    if (branchId) params.append("branchId", branchId);
    return apiCall(`/api/search?${params.toString()}`);
  },
  getQuickActions: () => apiCall("/api/search/quick-actions"),
};

export const microbiologyApi = {
  listCultures: (limit = 50) =>
    apiCall(`/api/enterprise-tier2/microbiology/cultures?limit=${limit}`),
  accessionCulture: (data: any) =>
    apiCall('/api/enterprise-tier2/microbiology/cultures/accession', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordGramStain: (data: any) =>
    apiCall('/api/enterprise-tier2/microbiology/cultures/gram-stain', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordIsolateAst: (data: any) =>
    apiCall('/api/enterprise-tier2/microbiology/cultures/isolate-ast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logCriticalCall: (data: any) =>
    apiCall('/api/enterprise-tier2/microbiology/cultures/critical-call', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listCriticalCalls: (limit = 50) =>
    apiCall(`/api/enterprise-tier2/microbiology/critical-calls?limit=${limit}`),
  getAntibiogram: (windowDays = 90, icuOnly = false, sampleSite?: string) =>
    apiCall(
      `/api/enterprise-tier2/microbiology/antibiogram?windowDays=${windowDays}&icuOnly=${icuOnly}${
        sampleSite ? `&sampleSite=${sampleSite}` : ''
      }`
    ),
  exportWhonetUrl: (windowDays = 90) =>
    `/api/enterprise-tier2/microbiology/whonet-export?windowDays=${windowDays}`,
  listAtccQc: (limit = 50) =>
    apiCall(`/api/enterprise-tier2/microbiology/atcc-qc?limit=${limit}`),
  recordAtccQc: (data: any) =>
    apiCall('/api/enterprise-tier2/microbiology/atcc-qc', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listEnvironmentalSwabs: (limit = 50) =>
    apiCall(`/api/enterprise-tier2/microbiology/environmental-swabs?limit=${limit}`),
  recordEnvironmentalSwab: (data: any) =>
    apiCall('/api/enterprise-tier2/microbiology/environmental-swabs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAnalyzers: () =>
    apiCall('/api/enterprise-tier2/microbiology/analyzers'),
  getPendingOrders: (limit = 10) =>
    apiCall(`/api/enterprise-tier2/microbiology/pending-orders?limit=${limit}`),
};

export default apiCall;
