export type TripType = 
  | 'WARD_STAT'
  | 'SAMPLE_PICKUP'
  | 'HOME_COLLECTION'
  | 'INTER_LAB'
  | 'SUPPLY_DELIVERY'
  | 'REPORT_COURIER';

export type TripStatus = 
  | 'PENDING'
  | 'DISPATCHED'
  | 'ARRIVED_ORIGIN'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELAYED';

export type PriorityLevel = 'STAT' | 'URGENT' | 'ROUTINE';

export type TempBand = '2_TO_8_C' | 'FROZEN_MINUS_20' | 'AMBIENT_15_25';

export interface TubeManifestItem {
  id: string;
  barcode: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  vacutainerType: 'EDTA_LAVENDER' | 'SST_GOLD' | 'SODIUM_CITRATE_BLUE' | 'FLUORIDE_GREY' | 'BLOOD_CULTURE' | 'URINE_STERILE';
  colorHex: string;
  testName: string;
  department: string;
  conditionStatus: 'INTACT' | 'HEMOLYZED' | 'CLOTTED' | 'LEAKING' | 'ACCEPTED';
  isScannedAtDock: boolean;
}

export interface ShipmentTrip {
  id: string;
  trackingId: string;
  type: TripType;
  title: string;
  description: string;
  origin: string;
  originType: 'ICU_WARD' | 'CASUALTY' | 'OT_SUITE' | 'PATIENT_HOME' | 'SPOKE_CLINIC' | 'CENTRAL_LAB' | 'SUPPLY_DEPOT';
  destination: string;
  driver: string;
  driverPhone: string;
  vehicle: string;
  vehiclePlate: string;
  vehicleType: 'BIKE_COLD_BOX' | 'HOSPITAL_PORTER' | 'REFRIGERATED_VAN' | 'AIR_CARRIER';
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
  wardInfo?: {
    wardName: string;
    bedNumber: string;
    orderingDoctor: string;
    statReason: string;
    targetTatMinutes: number;
    elapsedMinutes: number;
  };
  homeInfo?: {
    patientAddress: string;
    appointmentSlot: string;
    phlebotomistName: string;
    otpCode: string;
    kitVerified: boolean;
    geofenceStatus: 'PENDING' | 'APPROACHING' | 'ARRIVED' | 'COLLECTED';
  };
  chainOfCustody: {
    releasedBy: string;
    releaseTime: string;
    courierRunnerName: string;
    courierHandoverTime?: string;
    receivedByTechnologist?: string;
    hubReceivedTime?: string;
    verificationNotes?: string;
  };
}

export interface ColdChainSensor {
  id: string;
  boxId: string;
  boxType: 'PORTABLE_CRYO_BOX' | 'REFRIGERATED_VAN_CHAMBER' | 'ICU_STAT_COOLER' | 'DEEP_FREEZE_SHIPPER';
  assignedVehicle: string;
  currentTempCelsius: number;
  targetMinTemp: number;
  targetMaxTemp: number;
  batteryPercent: number;
  lastPingTime: string;
  isAlert: boolean;
  history: Array<{ time: string; temp: number }>;
}

export interface PneumaticTubeStation {
  id: string;
  stationCode: string;
  name: string;
  zone: string;
  status: 'IDLE' | 'SENDING' | 'RECEIVING' | 'MAINTENANCE';
  airPressureBar: number;
  lastCapsuleReceived: string;
  capsuleEtaSeconds?: number;
}
