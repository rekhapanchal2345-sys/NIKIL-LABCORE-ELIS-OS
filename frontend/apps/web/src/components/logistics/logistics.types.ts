// ============================================================
// LABCORE ELIS — Enterprise Specimen Logistics & Cold-Chain Fleet
// Types Definition — ISO 15189:2022 | CAP | CLSI H04-A6 | IATA P650
// ============================================================

export type TripType =
  | 'WARD_STAT'
  | 'SAMPLE_PICKUP'
  | 'HOME_COLLECTION'
  | 'INTER_LAB'
  | 'SUPPLY_DELIVERY'
  | 'REPORT_COURIER'
  | 'ORGAN_TRANSPORT'
  | 'CRYOGENIC_TRANSFER'
  | 'REFERENCE_LAB_REFERRAL';

export type TripStatus =
  | 'PENDING'
  | 'DISPATCHED'
  | 'ARRIVED_ORIGIN'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELAYED'
  | 'ON_HOLD_EXCURSION'
  | 'CANCELLED'
  | 'RETURNED';

export type PriorityLevel = 'STAT' | 'URGENT' | 'ROUTINE' | 'CRITICAL_ORGAN';

export type TempBand =
  | '2_TO_8_C'
  | 'FROZEN_MINUS_20'
  | 'DEEP_FREEZE_MINUS_80'
  | 'AMBIENT_15_25'
  | 'ROOM_TEMP_20_25'
  | 'CRYO_LN2_MINUS_196';

export type VacutainerType =
  | 'EDTA_LAVENDER'
  | 'SST_GOLD'
  | 'SODIUM_CITRATE_BLUE'
  | 'FLUORIDE_GREY'
  | 'BLOOD_CULTURE_AEROBIC'
  | 'BLOOD_CULTURE_ANAEROBIC'
  | 'URINE_STERILE'
  | 'PLAIN_RED'
  | 'LITHIUM_HEPARIN_GREEN'
  | 'SERUM_SEPARATOR_ORANGE'
  | 'CSF_STERILE'
  | 'CRYO_VIAL_MINUS20'
  | 'DRY_SWAB'
  | 'VIRAL_TRANSPORT_MEDIA';

export type ConditionStatus =
  | 'INTACT'
  | 'HEMOLYZED'
  | 'CLOTTED'
  | 'LEAKING'
  | 'ACCEPTED'
  | 'REJECTED_COLD_CHAIN'
  | 'QUARANTINED'
  | 'LIPEMIC'
  | 'ICTERIC';

export type VehicleType =
  | 'BIKE_COLD_BOX'
  | 'HOSPITAL_PORTER'
  | 'REFRIGERATED_VAN'
  | 'AIR_CARRIER'
  | 'PNEUMATIC_TUBE'
  | 'ELECTRIC_CART'
  | 'AMBULANCE_LOGISTICS'
  | 'DRONE_DELIVERY';

export type OriginType =
  | 'ICU_WARD'
  | 'CASUALTY'
  | 'OT_SUITE'
  | 'PATIENT_HOME'
  | 'SPOKE_CLINIC'
  | 'CENTRAL_LAB'
  | 'SUPPLY_DEPOT'
  | 'NICU'
  | 'ONCOLOGY_WARD'
  | 'BLOOD_BANK'
  | 'DIALYSIS_CENTER'
  | 'RADIOLOGY';

export type ComplianceStandard =
  | 'ISO_15189_2022'
  | 'CAP_LAP'
  | 'NABL'
  | 'IATA_P650'
  | 'CLSI_H04A6'
  | 'WHO_P_650'
  | 'CAP_15189';

export type ExcursionSeverity = 'MINOR' | 'MODERATE' | 'CRITICAL' | 'CATASTROPHIC';

export type FleetVehicleStatus =
  | 'ACTIVE_STAT'
  | 'EN_ROUTE'
  | 'AT_PICKUP'
  | 'AVAILABLE'
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'DISPATCHED_COLDCHAIN';

export type DriverCertification =
  | 'DMLT'
  | 'BMLT'
  | 'PHLEBOTOMY_CERTIFIED'
  | 'BIOLOGICAL_TRANSPORT_IATA'
  | 'COLD_CHAIN_CERTIFIED'
  | 'DEFENSIVE_DRIVING'
  | 'HOSPITAL_PORTER_CERTIFIED';

// ============================================================
// TUBE MANIFEST ITEM — Full pre-analytical specimen record
// ============================================================
export interface TubeManifestItem {
  id: string;
  barcode: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  vacutainerType: VacutainerType;
  colorHex: string;
  testName: string;
  department: string;
  conditionStatus: ConditionStatus;
  isScannedAtDock: boolean;
  volume?: string;         // e.g. "3mL", "5mL"
  collectionTime?: string; // ISO timestamp
  rejectionReason?: string;
  hilIndex?: {            // Hemolysis Icterus Lipemia
    hemolysis: 'NONE' | 'TRACE' | 'MILD' | 'MODERATE' | 'SEVERE';
    icterus: 'NONE' | 'TRACE' | 'MILD' | 'MODERATE';
    lipemia: 'NONE' | 'TRACE' | 'MILD' | 'SEVERE';
  };
  storageInstruction?: string;
  priorityFlag?: 'STAT' | 'ROUTINE' | 'URGENT' | 'CRITICAL_ORGAN';
}

// ============================================================
// CHAIN OF CUSTODY — Full digital audit trail
// ============================================================
export interface ChainOfCustodyRecord {
  releasedBy: string;
  releaseTime: string;
  courierRunnerName: string;
  courierHandoverTime?: string;
  receivedByTechnologist?: string;
  hubReceivedTime?: string;
  verificationNotes?: string;
  digitalSignatureHash?: string;     // SHA-256 of manifest
  geofenceEventsLog?: Array<{
    event: string;
    timestamp: string;
    gpsLat?: number;
    gpsLng?: number;
  }>;
  qrSealScanHistory?: Array<{
    scannedBy: string;
    scanTime: string;
    location: string;
    result: 'VALID' | 'TAMPER_DETECTED' | 'EXPIRED';
  }>;
}

// ============================================================
// TEMPERATURE EXCURSION EVENT
// ============================================================
export interface TemperatureExcursionEvent {
  id: string;
  triggeredAt: string;
  sensorId: string;
  boxId: string;
  peakTemp: number;
  excursionDurationMinutes: number;
  severity: ExcursionSeverity;
  affectedTubeIds: string[];
  capaActionTaken?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  pathologistReviewRequired: boolean;
  autoquarantined: boolean;
}

// ============================================================
// SHIPMENT TRIP — Core logistics entity
// ============================================================
export interface ShipmentTrip {
  id: string;
  trackingId: string;
  type: TripType;
  title: string;
  description: string;
  origin: string;
  originType: OriginType;
  destination: string;
  driver: string;
  driverPhone: string;
  vehicle: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  status: TripStatus;
  priority: PriorityLevel;
  etaMinutes: number;
  etaTimestamp: string;
  dispatchedAt: string;
  completedAt?: string;
  samplesCount: number;
  currentTempCelsius: number;
  tempRequirement: TempBand;
  tamperSealNumber: string;
  tubes: TubeManifestItem[];
  progressPercent: number;
  complianceStandards?: ComplianceStandard[];
  excursionEvents?: TemperatureExcursionEvent[];
  // Route telemetry
  routeDistanceKm?: number;
  currentSpeedKmh?: number;
  gpsLat?: number;
  gpsLng?: number;
  batteryPercent?: number;
  // Ward STAT info
  wardInfo?: {
    wardName: string;
    bedNumber: string;
    orderingDoctor: string;
    statReason: string;
    targetTatMinutes: number;
    elapsedMinutes: number;
    criticalityScore?: number; // 1-10
    admissionDiagnosis?: string;
  };
  // Home phlebotomy info
  homeInfo?: {
    patientAddress: string;
    appointmentSlot: string;
    phlebotomistName: string;
    otpCode: string;
    kitVerified: boolean;
    geofenceStatus: 'PENDING' | 'APPROACHING' | 'ARRIVED' | 'COLLECTED';
    miniCentrifugeUsed?: boolean;
    fastingVerified?: boolean;
  };
  // Chain of custody
  chainOfCustody: ChainOfCustodyRecord;
}

// ============================================================
// COLD CHAIN SENSOR — IoT Datalogger
// ============================================================
export interface ColdChainSensor {
  id: string;
  boxId: string;
  boxType: 'PORTABLE_CRYO_BOX' | 'REFRIGERATED_VAN_CHAMBER' | 'ICU_STAT_COOLER' | 'DEEP_FREEZE_SHIPPER' | 'LN2_DEWAR' | 'AMBIENT_INSULATED_BOX';
  assignedVehicle: string;
  assignedTripId?: string;
  currentTempCelsius: number;
  targetMinTemp: number;
  targetMaxTemp: number;
  humidityPercent?: number;
  batteryPercent: number;
  signalStrength?: 'EXCELLENT' | 'GOOD' | 'WEAK' | 'NO_SIGNAL';
  lastPingTime: string;
  pingIntervalSeconds: number;
  isAlert: boolean;
  excursionEvents?: TemperatureExcursionEvent[];
  dataLoggerSerial?: string;
  certifiedUntil?: string; // ISO 15189 calibration expiry
  history: Array<{
    time: string;
    temp: number;
    humidity?: number;
    battPercent?: number;
    isAlert?: boolean;
  }>;
  mkteStats?: {           // Mean Kinetic Temperature
    mktCelsius: number;
    calculatedAt: string;
    totalLogHours: number;
  };
}

// ============================================================
// PNEUMATIC TUBE STATION
// ============================================================
export interface PneumaticTubeStation {
  id: string;
  stationCode: string;
  name: string;
  zone: string;
  status: 'IDLE' | 'SENDING' | 'RECEIVING' | 'MAINTENANCE' | 'BLOCKED';
  airPressureBar: number;
  lastCapsuleReceived: string;
  capsuleEtaSeconds?: number;
  capsuleCountToday?: number;
  tubesInCurrentCapsule?: number;
  lastMaintenanceDate?: string;
}

// ============================================================
// FLEET VEHICLE — Real-world vehicle entity
// ============================================================
export interface FleetVehicle {
  id: string;
  plate: string;
  type: string;
  vehicleType: VehicleType;
  driver: string;
  driverPhone: string;
  driverCertifications: DriverCertification[];
  status: FleetVehicleStatus;
  battery: string;
  batteryPercent: number;
  fuelLevelPercent?: number;
  currentLocation: string;
  gpsLat?: number;
  gpsLng?: number;
  boxTemp: string;
  boxTempCelsius: number;
  tempBand: TempBand;
  tripsToday: number;
  totalKmToday: number;
  activeShipmentId?: string;
  activeShipmentTracking?: string;
  coldBoxSerialNumber?: string;
  coldBoxCertifiedUntil?: string;
  lastServiced?: string;
  nextServiceDue?: string;
  vehicleCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_SERVICE';
  insuranceExpiry?: string;
  complianceCertificates?: ComplianceStandard[];
  speedKmh?: number;
  odometer?: number;
  engineHours?: number;
}

// ============================================================
// LOGISTICS ANALYTICS KPIs — Real-time metrics
// ============================================================
export interface LogisticsKPIDashboard {
  totalTripsToday: number;
  activeInTransit: number;
  statTripsActive: number;
  deliveredToday: number;
  avgTatMinutes: number;
  coldChainCompliancePercent: number;
  excursionCountToday: number;
  rejectedSpecimensToday: number;
  tatBreachCount: number;
  fleetUtilizationPercent: number;
  totalKmCoveredToday: number;
  carbonFootprintKg?: number;
}

// ============================================================
// GEOFENCE ZONE — for auto-alert triggers
// ============================================================
export interface GeofenceZone {
  id: string;
  name: string;
  type: 'PICKUP' | 'DELIVERY' | 'RESTRICTED' | 'COLD_STORAGE';
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
}

// ============================================================
// ROUTE SEGMENT — for multi-stop trips
// ============================================================
export interface RouteSegment {
  segmentId: string;
  sequence: number;
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
}
