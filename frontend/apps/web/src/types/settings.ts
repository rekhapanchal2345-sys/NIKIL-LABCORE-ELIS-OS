// ============================================================
// NIKIL-LABCORE-ELIS-OS :: Settings Domain Type Definitions
// Production-Grade Clinical & Administrative Configuration Schemas
// ============================================================

// ─── Domain 1: Facility, Branches & Operational Scheduling ───────────────────

export interface BranchRecord {
  id: string;
  branchCode: string;
  branchName: string;
  branchType: "HEAD_OFFICE" | "COLLECTION_CENTER" | "SATELLITE_LAB" | "HOSPITAL_WING";
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  is24x7: boolean;
  geoLat?: string;
  geoLng?: string;
}

export interface ShiftSlot {
  shiftName: string;
  startTime: string;
  endTime: string;
  role: string;
  staffName: string;
  isOnCall: boolean;
}

export interface DepartmentRecord {
  id: string;
  deptCode: string;
  deptName: string;
  category: "CLINICAL_LAB" | "RADIOLOGY" | "PHLEBOTOMY" | "CLINICAL" | "ADMIN";
  headName: string;
  extension: string;
  isActive: boolean;
  hasNablAccreditation: boolean;
}

export interface FacilitySettingsData {
  hospitalLegalName: string;
  tradeName: string;
  ceaRegistrationNumber: string;
  stateMedicalLicenseNo: string;
  hfrFacilityId: string;
  rohiniId: string;
  pndtRegNo: string;
  bmwAuthorizationNo: string;
  facilityType: "STANDALONE_LAB" | "CLINIC" | "HOSPITAL_LAB_CLINIC" | "MULTI_BRANCH_CHAIN" | "COLLECTION_CENTER";
  geoLatitude: string;
  geoLongitude: string;
  opdStartTime: string;
  opdEndTime: string;
  ipdAvailable: boolean;
  is24x7Emergency: boolean;
  sampleCutoffTime: string;
  homeCollectionEnabled: boolean;
  homeCollectionEarliestSlot: string;
  homeCollectionLatestSlot: string;
  opdSlotDurationMinutes: number;
  workingDays: string[];
  holidays: string[];
  shifts: ShiftSlot[];
  departments: DepartmentRecord[];
  branches: BranchRecord[];
  icuBeds: number;
  ccuBeds: number;
  nicuBeds: number;
  generalWardBeds: number;
  privateDeluxeBeds: number;
  daycareBeds: number;
}

// ─── Domain 2: Diagnostic & Laboratory Governance ────────────────────────────

export interface WestgardRule {
  rule: "1_2s" | "1_3s" | "2_2s" | "R_4s" | "4_1s" | "10x" | "7T" | "6x";
  enabled: boolean;
  action: "WARNING" | "REJECT" | "HOLD";
  description: string;
}

export interface CriticalValueThreshold {
  id: string;
  analyte: string;
  unit: string;
  criticalLow: number | null;
  criticalHigh: number | null;
  panicLow: number | null;
  panicHigh: number | null;
  department: string;
  notifyMethod: "PHONE" | "SMS" | "WHATSAPP" | "PAGER" | "ALL";
  escalationMinutes: number;
}

export interface EQASProvider {
  id: string;
  providerName: string;
  programName: string;
  enrollmentNo: string;
  validUntil: string;
  frequency: string;
  lastParticipationDate: string;
  lastZScore: string;
  isActive: boolean;
}

export interface TubeColorCode {
  color: string;
  colorHex: string;
  additive: string;
  use: string;
  volumeMl: number;
  inversion: number;
  storageTemp: string;
}

export interface DiagnosticGovernanceData {
  nablCertificateNo: string;
  nablValidFrom: string;
  nablValidUntil: string;
  nablScopeOfTesting: string;
  nablStatus: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "APPLIED";
  nabhCertificateNo: string;
  nabhValidUntil: string;
  isoCertification: string;
  capNumber: string;
  icmrId: string;
  cliaId: string;
  westgardStrictMode: boolean;
  westgardRules: WestgardRule[];
  iqcRunFrequency: "EACH_RUN" | "DAILY" | "SHIFT_WISE";
  leveyJenningsEnabled: boolean;
  iqcHoldOnRuleViolation: boolean;
  eqasProviders: EQASProvider[];
  panicSlaMinutes: number;
  panicEscalationEnabled: boolean;
  panicEscalationTierMinutes: number;
  panicTelephonyMandatory: boolean;
  criticalValueThresholds: CriticalValueThreshold[];
  deltaCheckEnabled: boolean;
  deltaCheckWindowHours: number;
  deltaCheckDefaultPercent: number;
  deltaCheckAction: "FLAG" | "HOLD" | "REJECT";
  barcodeSymbology: "CODE128" | "GS1_128" | "DATAMATRIX" | "QR_CODE" | "CODE39";
  accessionPrefix: string;
  accessionYearSuffix: boolean;
  accessionSequenceLength: number;
  tubeColorCodes: TubeColorCode[];
  statTatMinutes: number;
  routineTatHours: number;
  urgentTatHours: number;
  reportingCutoffTime: string;
  requireDualSignoff: boolean;
  dualSignoffForHistopath: boolean;
  juniorEntryRole: string;
  seniorApprovalRole: string;
}

// ─── Domain 3: Doctor, Staff & Signature Vault ───────────────────────────────

export type SystemRole =
  | "HOSPITAL_SUPER_ADMIN"
  | "SENIOR_PATHOLOGIST"
  | "CHIEF_BIOCHEMIST"
  | "LAB_TECHNICIAN"
  | "PHLEBOTOMIST"
  | "BILLING_CASHIER"
  | "NURSE"
  | "OPD_COORDINATOR"
  | "RADIOLOGIST"
  | "MICROBIOLOGIST"
  | "RECEPTIONIST"
  | "IT_ADMIN";

export interface PermissionMatrix {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface RoleDefinition {
  id: string;
  roleName: string;
  displayName: string;
  description: string;
  permissions: PermissionMatrix[];
  canOverrideDiscount: boolean;
  canReleaseCritical: boolean;
  canCancelTest: boolean;
  canRecalculateResult: boolean;
  requiresMfa: boolean;
  maxSessionHours: number;
  isCustomRole: boolean;
}

export interface SignatureRecord {
  id: string;
  staffName: string;
  designation: string;
  qualifications: string;
  nmcRegistrationNo: string;
  stateMedicalCouncil: string;
  signatureImageUrl: string;
  stampImageUrl: string;
  signatureHash: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  validUntil: string;
  isActive: boolean;
}

export interface StaffSettingsData {
  signatureVault: SignatureRecord[];
  roleDefinitions: RoleDefinition[];
  requirePinForSignature: boolean;
  pinLength: number;
  signatureAuditEnabled: boolean;
  maxSignatureValidityDays: number;
}

// ─── Domain 4: Billing, Tariffs, Insurance & Statutory Taxes ─────────────────

export interface TariffCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  discountPercent: number;
  creditDays: number;
  isActive: boolean;
}

export interface GovernmentScheme {
  id: string;
  schemeName: string;
  schemeCode: string;
  authorityName: string;
  empanelmentNo: string;
  validUntil: string;
  rateListVersion: string;
  claimSubmissionMode: "ONLINE_PORTAL" | "EMAIL" | "MANUAL";
  claimCycleFrequency: string;
  isActive: boolean;
}

export interface BillingSettingsData {
  gstEnabled: boolean;
  gstin: string;
  panNumber: string;
  tanNumber: string;
  clinicalServicesExempt: boolean;
  sacCode: string;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  taxInclusive: boolean;
  invoicePrefix: string;
  receiptPrefix: string;
  creditNotePrefix: string;
  currentFinancialYear: string;
  autoSequenceReset: boolean;
  tariffCategories: TariffCategory[];
  maxWalkInDiscountPercent: number;
  discountOtpThresholdPercent: number;
  requireApprovalForFreeService: boolean;
  statEmergencySurchargePercent: number;
  homeCollectionCharge: number;
  governmentSchemes: GovernmentScheme[];
  cghsEmpanelled: boolean;
  echsEmpanelled: boolean;
  pmjayEmpanelled: boolean;
  upiMerchantVpa: string;
  upiQrCodeType: "STATIC" | "DYNAMIC";
  posTerminalEnabled: boolean;
  posTerminalIp: string;
  posTerminalMerchantId: string;
  posProvider: "PINELABS" | "PAYTM_POS" | "RAZORPAY_POS" | "INGENICO" | "VERIFONE";
  allowPartialPayments: boolean;
  allowCreditBilling: boolean;
  invoiceDueDays: number;
  bankAccountDetails: string;
  ifscCode: string;
}

// ─── Domain 5: Medical Hardware, Interoperability & LIS Interfacing ──────────

export interface AnalyzerConnection {
  id: string;
  instrumentName: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  department: string;
  connectionType: "RS232_SERIAL" | "TCPIP_SOCKET" | "USB" | "FILE_BASED";
  protocol: "ASTM_E1381" | "ASTM_E1394" | "HL7_V2" | "PROPRIETARY";
  comPort?: string;
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "NONE" | "ODD" | "EVEN";
  ipAddress?: string;
  port?: number;
  transferMode: "BIDIRECTIONAL" | "UNIDIRECTIONAL_RESULT" | "HOST_QUERY";
  isActive: boolean;
  lastSyncTimestamp?: string;
}

export interface HL7MessageHandler {
  messageType: "ADT_A01" | "ADT_A03" | "ORM_O01" | "ORU_R01" | "QBP_Q11" | "SIU_S12";
  enabled: boolean;
  inboundEnabled: boolean;
  outboundEnabled: boolean;
  endpoint?: string;
}

export interface HardwareIntegrationData {
  analyzerConnections: AnalyzerConnection[];
  defaultBaudRate: number;
  defaultDataBits: number;
  defaultStopBits: number;
  defaultParity: "NONE" | "ODD" | "EVEN";
  astmEnabled: boolean;
  astmMllpPort: number;
  hl7Enabled: boolean;
  hl7Version: "2.3" | "2.3.1" | "2.4" | "2.5" | "2.5.1";
  hl7MllpHost: string;
  hl7MllpPort: number;
  hl7MessageHandlers: HL7MessageHandler[];
  fhirEnabled: boolean;
  fhirVersion: "R4" | "R5";
  fhirBaseUrl: string;
  fhirAuthMethod: "NONE" | "BEARER_TOKEN" | "OAUTH2" | "SMART_ON_FHIR";
  abdmEnabled: boolean;
  abdmEnvironment: "SANDBOX" | "PRODUCTION";
  abdmClientId: string;
  abdmClientSecret: string;
  abdmFacilityId: string;
  pacsDicomEnabled: boolean;
  pacsAeTitle: string;
  pacsRemoteAeTitle: string;
  pacsRemoteHost: string;
  pacsRemotePort: number;
  dicomMwlEnabled: boolean;
  dicomStorageSCU: boolean;
}

// ─── Domain 6: Stationery, Report Header/Footer & Security ───────────────────

export interface ReportLayoutData {
  printMode: "FULL_DIGITAL" | "PRE_PRINTED_SHEET";
  paperSize: "A4" | "A4_LONG" | "LETTER" | "CUSTOM";
  paperWidthMm: number;
  paperHeightMm: number;
  headerHeightMm: number;
  footerHeightMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  showHospitalLogo: boolean;
  showNablLogo: boolean;
  showNabhLogo: boolean;
  showAccreditationCredentials: boolean;
  showFacilityAddress: boolean;
  showContactInfo: boolean;
  footerDisclaimer: string;
  showSignatoryBlock: boolean;
  showVerificationQr: boolean;
  qrCodePosition: "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_CENTER" | "BOTTOM_RIGHT";
  qrVerificationBaseUrl: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  preliminaryReportWatermark: boolean;
  duplicateCopyWatermark: boolean;
  reportFontFamily: string;
  reportFontSizePt: number;
  showReferenceRanges: boolean;
  highlightAbnormals: boolean;
  highlightCriticals: boolean;
  showDeltaFlag: boolean;
  showAnalyzerFlags: boolean;
}

export interface AuditSecurityData {
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  forceLogoutOnBrowserClose: boolean;
  deviceFingerprintEnabled: boolean;
  minPasswordLength: number;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  passwordHistoryCount: number;
  mfaEnabled: boolean;
  mfaMethod: "TOTP_APP" | "SMS_OTP" | "EMAIL_OTP" | "HARDWARE_KEY";
  mfaRequiredForRoles: string[];
  mfaGracePeriodHours: number;
  auditLoginActivity: boolean;
  auditClinicalChanges: boolean;
  auditBillingChanges: boolean;
  auditConfigChanges: boolean;
  hipaaLoggingEnabled: boolean;
  dishaComplianceEnabled: boolean;
  dpdpConsentEnforcement: boolean;
  aadhaarMaskingEnabled: boolean;
  auditLogRetentionDays: number;
  immutableAuditEnabled: boolean;
  autoBackupEnabled: boolean;
  backupFrequencyCron: string;
  backupDestinationLocal: string;
  backupDestinationCloud: "S3" | "GCS" | "AZURE_BLOB" | "NONE";
  backupCloudBucketPath: string;
  backupEncryptionAlgorithm: string;
  backupIntegrityCheck: boolean;
  backupRetentionDays: number;
  lastBackupTimestamp?: string;
  lastBackupSha256?: string;
}

// ─── Navigation Structure ─────────────────────────────────────────────────────

export type SettingsDomain =
  | "facility"
  | "diagnostic"
  | "staff"
  | "billing"
  | "hardware"
  | "security";

export interface SettingsNavItem {
  id: string;
  domain: SettingsDomain;
  tab: string;
  label: string;
  sublabel: string;
  iconName: string;
  badge?: string;
  badgeVariant?: "blue" | "green" | "amber" | "red";
  verified?: boolean;
  rbacRoles?: string[];
}

export interface SettingsDomainGroup {
  domain: SettingsDomain;
  domainLabel: string;
  iconName: string;
  accentClass: string;
  items: SettingsNavItem[];
}
