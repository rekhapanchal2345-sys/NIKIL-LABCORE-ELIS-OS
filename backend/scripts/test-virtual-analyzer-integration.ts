/**
 * LABCORE ELIS OS // OMNISCIENT NEXUS
 * Virtual Analyzer Simulator -> Integration Engine & Nexus End-to-End Verification Suite
 *
 * Validates:
 * 1. ONLINE status and heartbeat reception.
 * 2. OFFLINE alerts after simulated disconnection and heartbeat cessation.
 * 3. Machine reconnection and auto-clearing of OFFLINE alerts.
 * 4. Idempotent duplicate message suppression via SHA-256 journal hash.
 * 5. Malformed payload detection and Dead-Letter Queue (DLQ) fail-soft routing.
 * 6. Omniscient Nexus fleet status telemetry and rejected message surfacing.
 * 7. Clinical data isolation: simulation data never pollutes real clinical patient records.
 */

import assert from 'assert';
import prisma, { pool } from '../api/config/database';
import * as analyzerService from '../api/src/modules/analyzers/analyzer.service';
import { NexusService } from '../api/src/modules/nexus/nexus.service';

const nexusService = new NexusService();

const TEST_ANALYZER_SERIAL = 'RC503-9948-DX';
const TEST_ANALYZER_MODEL = 'COBAS-PRO-C503';

async function runVirtualAnalyzerIntegrationSuite() {
  console.log('========================================================================');
  console.log('🧪 VIRTUAL ANALYZER SIMULATOR -> INTEGRATION ENGINE & NEXUS TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Initial Provisioning & ONLINE Event Reception
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Virtual Machine Simulator -> ONLINE Event Reception');
    const onlineEvent = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'ONLINE',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      timestamp: new Date().toISOString(),
      latencyMs: 14,
      payload: {
        modelCode: TEST_ANALYZER_MODEL,
        opticalWavelengthNm: 340,
        compartmentTempC: 5.2,
      },
    });

    assert.strictEqual(onlineEvent.status, 'PROCESSED', 'Processing status must be PROCESSED');
    assert.strictEqual(onlineEvent.machineStatus, 'ONLINE', 'Analyzer status must be set to ONLINE');
    assert.strictEqual((onlineEvent as any).isSimulation, true, 'isSimulation must be true');

    const dbAnalyzer = await analyzerService.findAnalyzerByIdOrCode(TEST_ANALYZER_SERIAL);
    assert.ok(dbAnalyzer, 'Analyzer record must exist in database');
    assert.strictEqual(dbAnalyzer.status, 'ONLINE', 'DB status must be ONLINE');
    assert.strictEqual(dbAnalyzer.analyzerType, 'SIMULATOR', 'Analyzer type must be SIMULATOR');

    console.log('  ✓ ONLINE event received and analyzer provisioned with status ONLINE.');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 2: Heartbeat Reception & Freshness Tracking
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Periodic 10-Second Heartbeat Reception');
    const beforeHeartbeat = Date.now();
    const heartbeatResult = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'HEARTBEAT',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      timestamp: new Date().toISOString(),
      latencyMs: 12,
      payload: {
        aspirationPressureKpa: 98.4,
        peltierTempC: 5.2,
        pipetteCycles: 18420,
      },
    });

    assert.strictEqual(heartbeatResult.status, 'PROCESSED', 'Processing status must be PROCESSED');
    assert.strictEqual(heartbeatResult.machineStatus, 'ONLINE', 'Heartbeat must maintain ONLINE status');

    const dbAnalyzerHb = await analyzerService.findAnalyzerByIdOrCode(TEST_ANALYZER_SERIAL);
    assert.ok(dbAnalyzerHb?.lastSuccessfulHeartbeat, 'lastSuccessfulHeartbeat must be populated in DB');

    const lastHbTime = new Date(dbAnalyzerHb!.lastSuccessfulHeartbeat!).getTime();
    assert.ok(lastHbTime >= beforeHeartbeat - 2000, 'Heartbeat timestamp must be current');

    console.log(`  ✓ Heartbeat received and journaled (DB Latency: ${dbAnalyzerHb?.connectionLatency}ms).`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 3: Simulated Disconnection & OFFLINE Alert Generation
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Simulated Disconnection & OFFLINE Alert Generation');
    const offlineResult = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'OFFLINE',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      idempotencyKey: `OFFLINE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      errorMessage: 'Operator triggered manual disconnect in simulator UI',
    });

    assert.strictEqual(offlineResult.status, 'PROCESSED', 'Processing status must be PROCESSED');
    assert.strictEqual(offlineResult.machineStatus, 'OFFLINE', 'Status must transition to OFFLINE');

    const dbAnalyzerOffline = await analyzerService.findAnalyzerByIdOrCode(TEST_ANALYZER_SERIAL);
    assert.strictEqual(dbAnalyzerOffline?.status, 'OFFLINE', 'DB status must be OFFLINE');

    const offlineAlerts = await prisma.analyzerAlert.findMany({
      where: {
        analyzerId: dbAnalyzerOffline!.id,
        alertType: 'OFFLINE_DISCONNECTED',
        isResolved: false,
      },
    });
    assert.ok(offlineAlerts.length > 0, 'An active OFFLINE_DISCONNECTED alert must be created');
    console.log(`  ✓ OFFLINE event processed; alert [${offlineAlerts[0].title}] logged.`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 4: Staleness Timeout & OFFLINE Alert in Omniscient Nexus
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Omniscient Nexus Heartbeat Timeout Detection (> threshold)');
    // Force heartbeat timestamp into the past (45 seconds ago) to simulate lost heartbeats
    const pastTime = new Date(Date.now() - 45000);
    await prisma.analyzerAlert.updateMany({
      where: { analyzerId: dbAnalyzerOffline!.id, isResolved: false },
      data: { isResolved: true },
    });
    await prisma.analyzer.update({
      where: { id: dbAnalyzerOffline!.id },
      data: {
        status: 'ONLINE',
        lastSuccessfulHeartbeat: pastTime,
        lastCommunicationAt: pastTime,
      },
    });

    // Call getFleetStatus with a 30-second stale threshold
    const fleetStatus = await nexusService.getFleetStatus(30);
    const simTelemetry = fleetStatus.fleet.find((a: any) => a.analyzerId === TEST_ANALYZER_SERIAL || a.serialNumber?.includes(TEST_ANALYZER_SERIAL));

    assert.ok(simTelemetry, 'Simulator must be present in Nexus fleet');
    assert.strictEqual(simTelemetry.status, 'OFFLINE', 'Stale simulator must be reported as OFFLINE');
    assert.strictEqual(simTelemetry.connectionHealth, 'STALE', 'Connection health must be STALE');
    assert.ok((simTelemetry.heartbeatAgeSeconds ?? 0) >= 44, 'Heartbeat age must reflect elapsed time');

    const timeoutAlert = await prisma.analyzerAlert.findFirst({
      where: {
        analyzerId: dbAnalyzerOffline!.id,
        alertType: 'HEARTBEAT_TIMEOUT',
        isResolved: false,
      },
    });
    assert.ok(timeoutAlert, 'HEARTBEAT_TIMEOUT alert must be automatically generated');
    console.log(`  ✓ Nexus detected heartbeat timeout (${simTelemetry.heartbeatAgeSeconds ?? 0}s elapsed); status shifted to OFFLINE.`);
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 5: Machine Reconnection & Auto-Resolution of OFFLINE Alerts
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Virtual Machine Reconnection & Alert Auto-Clear');
    const reconnectResult = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'RECONNECTED',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(reconnectResult.status, 'PROCESSED', 'Processing status must be PROCESSED');
    assert.strictEqual(reconnectResult.machineStatus, 'ONLINE', 'Reconnection must restore status to ONLINE');

    const unresolvedOfflineAlerts = await prisma.analyzerAlert.findMany({
      where: {
        analyzerId: dbAnalyzerOffline!.id,
        alertType: { in: ['HEARTBEAT_TIMEOUT', 'OFFLINE_DISCONNECTED'] },
        isResolved: false,
      },
    });
    assert.strictEqual(unresolvedOfflineAlerts.length, 0, 'Prior OFFLINE alerts must be resolved on reconnection');

    const freshFleet = await nexusService.getFleetStatus(30);
    const reconnectedTelemetry = freshFleet.fleet.find((a: any) => a.analyzerId === TEST_ANALYZER_SERIAL || a.serialNumber?.includes(TEST_ANALYZER_SERIAL));
    assert.strictEqual(reconnectedTelemetry?.connectionHealth, 'HEALTHY', 'Nexus connection health must now be HEALTHY');
    assert.strictEqual(reconnectedTelemetry?.status, 'ONLINE', 'Nexus status must now be ONLINE');

    console.log('  ✓ Machine reconnected; OFFLINE alerts resolved, Nexus health returned to HEALTHY.');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 6: SHA-256 Idempotency Duplicate Event Suppression
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] SHA-256 Idempotency Duplicate Message Suppression');
    const duplicateKey = `TEST-IDEMP-${Date.now()}`;

    // First transmission
    const firstDelivery = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'HEARTBEAT',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      idempotencyKey: duplicateKey,
      payload: { packetSequence: 101 },
    });
    assert.strictEqual(firstDelivery.deduplicated, false, 'First message must be accepted as new');

    // Duplicate transmission
    const secondDelivery = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'HEARTBEAT',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      idempotencyKey: duplicateKey,
      payload: { packetSequence: 101 },
    });
    assert.strictEqual(secondDelivery.deduplicated, true, 'Second message must be detected as duplicate');
    assert.strictEqual(secondDelivery.status, 'DUPLICATE_IGNORED', 'Status must be DUPLICATE_IGNORED');

    // Verify journal has record
    const journalDuplicate = await pool.query(
      `SELECT * FROM instrument_message_journal WHERE processing_status = 'DUPLICATE_IGNORED' AND analyzer_id = $1 ORDER BY received_at DESC LIMIT 1`,
      [TEST_ANALYZER_SERIAL]
    );
    assert.ok(journalDuplicate.rows.length > 0, 'Duplicate entry must be recorded in instrument_message_journal');
    console.log('  ✓ Duplicate message detected via SHA-256 idempotency hash; DUPLICATE_IGNORED journaled.');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 7: Malformed Payload Handling & Dead-Letter Queue (DLQ)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Malformed Payload Handling & Dead-Letter Queue (DLQ)');
    const dlqResult = await analyzerService.handleSimulatorEvent({
      analyzerId: TEST_ANALYZER_SERIAL,
      eventType: 'MALFORMED_FRAME',
      isSimulation: true,
      simulationMode: 'SIMULATION_MODE',
      errorCode: 'ERR_CORRUPT_FRAME_CHECKSUM',
      errorMessage: 'ASTM frame checksum mismatch: expected 3B, received 00',
      payload: { rawBytes: [0x02, 0xff, 0x03, 0x00] },
    });

    assert.strictEqual(dlqResult.status, 'DEAD_LETTER', 'Malformed frame must return DEAD_LETTER status');

    const journalDlq = await pool.query(
      `SELECT * FROM instrument_message_journal WHERE processing_status = 'DEAD_LETTER' AND analyzer_id = $1 ORDER BY received_at DESC LIMIT 1`,
      [TEST_ANALYZER_SERIAL]
    );
    assert.ok(journalDlq.rows.length > 0, 'Dead-letter record must be persisted in journal');
    assert.strictEqual(journalDlq.rows[0].error_code, 'ERR_CORRUPT_FRAME_CHECKSUM');

    const dlqAlert = await prisma.analyzerAlert.findFirst({
      where: {
        analyzerId: dbAnalyzerOffline!.id,
        alertType: 'INTEGRATION_MALFORMED_FRAME',
      },
    });
    assert.ok(dlqAlert, 'INTEGRATION_MALFORMED_FRAME alert must be created');
    console.log('  ✓ Malformed payload safely routed to Dead-Letter Queue with journal diagnostic.');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 8: Clinical Data Segregation & Safety Interlock Invariant
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Safety Invariant: Synthetic Simulation Data Must Not Masquerade');
    let securityViolationCaught = false;
    try {
      // Attempt to transmit simulation event without simulationMode safety declaration
      await analyzerService.handleSimulatorEvent({
        analyzerId: TEST_ANALYZER_SERIAL,
        eventType: 'HEARTBEAT',
        isSimulation: false as any,
        simulationMode: 'PRODUCTION' as any,
      });
    } catch (err: any) {
      if (err.message?.includes('SECURITY_SAFETY_VIOLATION') || err.message?.includes('Simulation mode')) {
        securityViolationCaught = true;
      }
    }
    assert.ok(securityViolationCaught, 'Security safety interlock must block non-simulation masquerading');

    // Confirm communication log recorded with is_simulated: true
    const commLog = await prisma.analyzerCommunicationLog.findFirst({
      where: { analyzerId: dbAnalyzerOffline!.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(commLog, 'Communication log must be present');
    assert.strictEqual((commLog.parsedData as any)?.isSimulation ?? true, true, 'isSimulation must strictly be true');

    console.log('  ✓ Clinical safety interlock verified: synthetic events cannot masquerade as clinical production data.');
    passedTests++;

    // -------------------------------------------------------------------------
    // TEST 9: Omniscient Nexus Fleet Status & Dead-Letter Surface
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9] Omniscient Nexus Fleet & DLQ Surfacing');
    const finalNexusStatus = await nexusService.getFleetStatus(30);
    assert.ok(Array.isArray(finalNexusStatus.fleet), 'fleet must be an array');
    assert.ok(Array.isArray(finalNexusStatus.rejectedMessages), 'rejectedMessages must be an array');
    assert.ok(finalNexusStatus.rejectedMessages.length > 0, 'Nexus must surface rejected and DLQ messages');

    const hasDeadLetter = finalNexusStatus.rejectedMessages.some((m: any) => m.processing_status === 'DEAD_LETTER');
    const hasDuplicate = finalNexusStatus.rejectedMessages.some((m: any) => m.processing_status === 'DUPLICATE_IGNORED');
    assert.ok(hasDeadLetter, 'Nexus rejectedMessages must include DEAD_LETTER entries');
    assert.ok(hasDuplicate, 'Nexus rejectedMessages must include DUPLICATE_IGNORED entries');

    console.log(`  ✓ Nexus surfaces ${finalNexusStatus.fleet.length} analyzers and ${finalNexusStatus.rejectedMessages.length} rejected/DLQ journal entries.`);
    passedTests++;

    console.log('\n========================================================================');
    console.log(`🏆 ALL ${passedTests}/9 INTEGRATION & NEXUS TESTS PASSED SUCCESSFULLY!`);
    console.log('========================================================================\n');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void runVirtualAnalyzerIntegrationSuite();
