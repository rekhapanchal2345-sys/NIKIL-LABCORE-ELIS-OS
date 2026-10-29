const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Add SI unit fields to TestParameter if not already present
if (!schema.includes('siUnit')) {
  schema = schema.replace(
    '  decimalPrecision        Int?\n  isActive                Boolean',
    '  decimalPrecision        Int?\n  siUnit                  String?                       @map("si_unit")\n  siConversionFactor      Decimal?                      @map("si_conversion_factor") @db.Decimal(10, 4)\n  isActive                Boolean'
  );
}

// 2. Append Part-3 models if not already present
if (!schema.includes('model HematologyScattergram')) {
  const part3Models = `
model HematologyScattergram {
  id                         String   @id @default(uuid())
  barcode                    String   @unique
  testCode                   String   @default("CBC") @map("test_code")
  wbcHistogramUrl            String?  @map("wbc_histogram_url")
  rbcHistogramUrl            String?  @map("rbc_histogram_url")
  pltHistogramUrl            String?  @map("plt_histogram_url")
  diffScattergramUrl         String?  @map("diff_scattergram_url")
  channelData256             Json?    @map("channel_data_256")
  suspectFlags               String[] @map("suspect_flags")
  manualSlideReviewRequired  Boolean  @default(false) @map("manual_slide_review_required")
  uncorrectedWbc             Decimal? @map("uncorrected_wbc") @db.Decimal(10, 2)
  nrbcCountPer100Wbc         Decimal? @map("nrbc_count_per_100_wbc") @db.Decimal(6, 2)
  correctedWbc               Decimal? @map("corrected_wbc") @db.Decimal(10, 2)
  createdAt                  DateTime @default(now()) @map("created_at")

  @@index([barcode])
  @@map("hematology_scattergrams")
}

model MicroplateLayout96 {
  id                   String   @id @default(uuid())
  plateId              String   @unique @map("plate_id")
  assayType            String   @map("assay_type")
  direction            String   @default("ROW_WISE_A1_A12")
  blankOD              Decimal? @map("blank_od") @db.Decimal(6, 4)
  negativeControlOD    Decimal? @map("negative_control_od") @db.Decimal(6, 4)
  positiveControlOD    Decimal? @map("positive_control_od") @db.Decimal(6, 4)
  isPlateControlsValid Boolean  @default(false) @map("is_plate_controls_valid")
  cutOffIndexValue     Decimal? @map("cut_off_index_value") @db.Decimal(8, 4)
  wellsData            Json     @map("wells_data")
  createdAt            DateTime @default(now()) @map("created_at")

  @@index([plateId])
  @@map("microplate_layouts_96")
}

model BloodBankReservation {
  id                    String    @id @default(uuid())
  unitNumber            String    @unique @map("unit_number")
  bloodGroup            String    @map("blood_group")
  status                String    @default("AVAILABLE_IN_STOCK")
  reservedForPatientId  String?   @map("reserved_for_patient_id")
  reservedAt            DateTime? @map("reserved_at")
  crossMatchExpiryAt    DateTime? @map("cross_match_expiry_at")
  forwardGroupingJson   Json?     @map("forward_grouping_json")
  reverseGroupingJson   Json?     @map("reverse_grouping_json")
  isDiscrepancyResolved Boolean   @default(true) @map("is_discrepancy_resolved")
  createdAt             DateTime  @default(now()) @map("created_at")

  @@index([unitNumber])
  @@index([status])
  @@map("blood_bank_reservations")
}

model DynamicSeriesTest {
  id                   String    @id @default(uuid())
  orderId              String    @map("order_id")
  patientId            String    @map("patient_id")
  seriesType           String    @default("OGTT_75G") @map("series_type")
  fastingValue         Decimal?  @map("fasting_value") @db.Decimal(8, 2)
  fastingScannedAt     DateTime? @map("fasting_scanned_at")
  glucoseLoadGivenAt   DateTime? @map("glucose_load_given_at")
  oneHourValue         Decimal?  @map("one_hour_value") @db.Decimal(8, 2)
  oneHourScannedAt     DateTime? @map("one_hour_scanned_at")
  twoHourValue         Decimal?  @map("two_hour_value") @db.Decimal(8, 2)
  twoHourScannedAt     DateTime? @map("two_hour_scanned_at")
  isTimeWindowCompliant Boolean   @default(true) @map("is_time_window_compliant")
  deviationReason      String?   @map("deviation_reason")
  createdAt            DateTime  @default(now()) @map("created_at")

  @@index([orderId])
  @@index([patientId])
  @@map("dynamic_series_tests")
}

model EquipmentComplianceLog {
  id                             String   @id @default(uuid())
  equipmentCode                  String   @unique @map("equipment_code")
  calibrationExpiryDate          DateTime @map("calibration_expiry_date")
  nextPreventiveMaintenanceDate  DateTime @map("next_preventive_maintenance_date")
  isComplianceLocked             Boolean  @default(false) @map("is_compliance_locked")
  lockReason                     String?  @map("lock_reason")
  updatedAt                      DateTime @updatedAt @map("updated_at")

  @@index([equipmentCode])
  @@map("equipment_compliance_logs")
}

model EqasProficiencyRecord {
  id             String   @id @default(uuid())
  cycleId        String   @map("cycle_id")
  parameterCode  String   @map("parameter_code")
  blindBarcode   String   @unique @map("blind_barcode")
  labResultValue Decimal  @map("lab_result_value") @db.Decimal(10, 4)
  peerMean       Decimal  @map("peer_mean") @db.Decimal(10, 4)
  peerSD         Decimal  @map("peer_sd") @db.Decimal(10, 4)
  zScore         Decimal  @map("z_score") @db.Decimal(6, 2)
  isSatisfactory Boolean  @default(true) @map("is_satisfactory")
  capaTicketId   String?  @map("capa_ticket_id")
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([blindBarcode])
  @@map("eqas_proficiency_records")
}

model TempExcursionCapa {
  id                      String   @id @default(uuid())
  sensorLocation          String   @map("sensor_location")
  minTempRecorded         Decimal  @map("min_temp_recorded") @db.Decimal(5, 2)
  maxTempRecorded         Decimal  @map("max_temp_recorded") @db.Decimal(5, 2)
  isExcursionActive       Boolean  @default(false) @map("is_excursion_active")
  quarantinedReagentLots  String[] @map("quarantined_reagent_lots")
  capaActionTaken         String?  @map("capa_action_taken")
  recordedAt              DateTime @default(now()) @map("recorded_at")

  @@index([sensorLocation])
  @@map("temp_excursion_capas")
}
`;
  schema += part3Models;
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Part-3 schema updated successfully.');
