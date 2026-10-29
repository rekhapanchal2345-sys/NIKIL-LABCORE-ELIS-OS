export type AnalyzerStatus = "ONLINE" | "IDLE" | "BUSY" | "OFFLINE" | "ERROR" | "MAINTENANCE";

export interface Analyzer {
  id: string;
  name: string;
  code?: string;
  analyzerCode?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  category?: string;
  department?: string;
  protocol?: string;
  connectionType?: string;
  ipAddress?: string;
  port?: number;
  comPort?: string;
  baudRate?: number;
  status: AnalyzerStatus | string;
  location?: string;
  isBidirectional?: boolean;
  isActive?: boolean;
  lastHeartbeat?: string;
  lastSyncAt?: string;
  testsToday?: number;
  samplesProcessed?: number;
  errorCount?: number;
  uptimePercent?: number;
  reagentLevel?: number;
  qcStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export type SampleType =
  | "WHOLE_BLOOD"
  | "SERUM"
  | "PLASMA"
  | "URINE"
  | "STOOL"
  | "SPUTUM"
  | "SWAB"
  | "CSF"
  | "FLUID"
  | "TISSUE"
  | string;

export interface TestCategory {
  id: string;
  name?: string;
  categoryName?: string;
  code?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface TestFormData {
  id?: string;
  testCode: string;
  testName: string;
  shortName?: string;
  categoryId?: string;
  category?: string | TestCategory;
  sampleType: SampleType;
  sampleVolume?: string;
  sampleContainer?: string;
  method?: string;
  price: number;
  offerPrice?: number;
  b2bRate?: number;
  tatHours?: number;
  turnaroundTime?: string;
  fastingRequired?: boolean;
  isActive?: boolean;
  isNablScope?: boolean;
  isStatCapable?: boolean;
  description?: string;
  instructions?: string;
  parameters?: any[];
  [key: string]: any;
}

export interface DashboardActivity {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  action?: string;
  user?: string;
  timestamp?: string;
  createdAt?: string;
  status?: string;
  [key: string]: any;
}

export interface Patient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  title?: string;
  gender: string;
  dateOfBirth?: string;
  age?: number;
  ageUnit?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  abhaNumber?: string;
  abhaAddress?: string;
  isVip?: boolean;
  isCritical?: boolean;
  status?: string;
  patientType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string[];
  chronicConditions?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
