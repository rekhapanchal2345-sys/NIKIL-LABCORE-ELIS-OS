import crypto from 'crypto';

export type NexusOperatingMode =
  | 'DEMO_MODE'
  | 'SHADOW_MODE'
  | 'CONTROLLED_PRODUCTION_MODE';

export type TelemetryHealthState =
  | 'LIVE'
  | 'STALE'
  | 'SIMULATED'
  | 'DISCONNECTED'
  | 'DEGRADED'
  | 'UNKNOWN';

export interface OperatingModeState {
  organizationId: string;
  mode: NexusOperatingMode;
  emergencyStopActive: boolean;
  enabledCapabilities: ReadonlyArray<string>;
  updatedByUserId: string;
  updatedAtIso: string;
  signatureHash: string;
}

export interface InstrumentConnectionSnapshot {
  analyzerId: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  protocol: 'ASTM_E1381_E1394' | 'HL7_V251_MLLP' | 'SIMULATOR';
  socketConnected: boolean;
  lastVerifiedMessageAtIso: string | null;
  recentNakCount: number;
  dlqDepth: number;
  isSyntheticSource: boolean;
}

export interface EvaluatedTelemetryStatus {
  analyzerId: string;
  state: TelemetryHealthState;
  lastVerifiedMessageAtIso: string | null;
  ageSeconds: number | null;
  allowLiveOperationalMutation: boolean;
  diagnosticMessage: string;
}

const DEFAULT_STALE_THRESHOLD_SECONDS = 120;

export class NexusOperatingModeService {
  private currentState: Map<string, OperatingModeState> = new Map();

  /**
   * Safe default is always DEMO_MODE unless explicitly transitioned by an
   * authorized LAB_DIRECTOR with a verifiable signature.
   */
  public getOperatingMode(organizationId: string): OperatingModeState {
    const existing = this.currentState.get(organizationId);
    if (existing) {
      return existing;
    }
    const safeDefault: OperatingModeState = {
      organizationId,
      mode: 'DEMO_MODE',
      emergencyStopActive: false,
      enabledCapabilities: [],
      updatedByUserId: 'SYSTEM_DEFAULT',
      updatedAtIso: new Date().toISOString(),
      signatureHash: 'SAFE_DEFAULT_DEMO_MODE',
    };
    this.currentState.set(organizationId, safeDefault);
    return safeDefault;
  }

  /**
   * Transitions operating mode with strict RBAC and clinical policy verification.
   */
  public transitionMode(params: {
    organizationId: string;
    targetMode: NexusOperatingMode;
    actorUserId: string;
    actorRole: string;
    reason: string;
    enabledCapabilities: string[];
    signingSecret: string;
  }): OperatingModeState {
    if (!params.organizationId || !params.actorUserId || !params.reason.trim()) {
      throw new Error('MODE_TRANSITION_INVALID_PARAMETERS');
    }

    if (
      params.targetMode === 'CONTROLLED_PRODUCTION_MODE' &&
      params.actorRole !== 'LAB_DIRECTOR'
    ) {
      throw new Error(
        'UNAUTHORIZED_MODE_TRANSITION: Only LAB_DIRECTOR may activate CONTROLLED_PRODUCTION_MODE'
      );
    }

    if (
      params.targetMode === 'SHADOW_MODE' &&
      !['LAB_DIRECTOR', 'PATHOLOGIST', 'QUALITY_MANAGER'].includes(params.actorRole)
    ) {
      throw new Error('UNAUTHORIZED_MODE_TRANSITION: Insufficient role for SHADOW_MODE');
    }

    const updatedAtIso = new Date().toISOString();
    const canonical = JSON.stringify({
      organizationId: params.organizationId,
      targetMode: params.targetMode,
      actorUserId: params.actorUserId,
      enabledCapabilities: [...params.enabledCapabilities].sort(),
      reason: params.reason,
      updatedAtIso,
    });

    const signatureHash = crypto
      .createHmac('sha256', params.signingSecret)
      .update(canonical)
      .digest('hex');

    const nextState: OperatingModeState = {
      organizationId: params.organizationId,
      mode: params.targetMode,
      emergencyStopActive: false,
      enabledCapabilities: Object.freeze([...params.enabledCapabilities]),
      updatedByUserId: params.actorUserId,
      updatedAtIso,
      signatureHash,
    };

    this.currentState.set(params.organizationId, nextState);
    return nextState;
  }

  /**
   * Triggers immediate Emergency Stop: downgrades operational mutations and blocks autoverification.
   */
  public triggerEmergencyStop(params: {
    organizationId: string;
    actorUserId: string;
    reason: string;
  }): OperatingModeState {
    const current = this.getOperatingMode(params.organizationId);
    const haltedState: OperatingModeState = {
      ...current,
      emergencyStopActive: true,
      mode: current.mode === 'CONTROLLED_PRODUCTION_MODE' ? 'SHADOW_MODE' : current.mode,
      enabledCapabilities: [],
      updatedByUserId: params.actorUserId,
      updatedAtIso: new Date().toISOString(),
    };
    this.currentState.set(params.organizationId, haltedState);
    return haltedState;
  }

  /**
   * Evaluates true hardware status and strictly prevents synthetic data from masquerading as LIVE.
   */
  public evaluateAnalyzerTelemetryState(
    organizationId: string,
    snapshot: InstrumentConnectionSnapshot,
    nowMs: number = Date.now(),
    staleThresholdSeconds: number = DEFAULT_STALE_THRESHOLD_SECONDS
  ): EvaluatedTelemetryStatus {
    const modeState = this.getOperatingMode(organizationId);

    // Rule 1: Never allow synthetic telemetry in SHADOW or CONTROLLED_PRODUCTION modes
    if (snapshot.isSyntheticSource || snapshot.protocol === 'SIMULATOR') {
      if (modeState.mode !== 'DEMO_MODE') {
        throw new Error(
          `SECURITY_SAFETY_VIOLATION: Synthetic telemetry source [${snapshot.analyzerId}] blocked in ${modeState.mode}`
        );
      }
      return {
        analyzerId: snapshot.analyzerId,
        state: 'SIMULATED',
        lastVerifiedMessageAtIso: snapshot.lastVerifiedMessageAtIso,
        ageSeconds: null,
        allowLiveOperationalMutation: false,
        diagnosticMessage: 'SIMULATED TELEMETRY (DEMO MODE ONLY - NO HARDWARE CONNECTED)',
      };
    }

    // Rule 2: Disconnected socket is always DISCONNECTED (never fallback to fake online metrics)
    if (!snapshot.socketConnected) {
      return {
        analyzerId: snapshot.analyzerId,
        state: 'DISCONNECTED',
        lastVerifiedMessageAtIso: snapshot.lastVerifiedMessageAtIso,
        ageSeconds: snapshot.lastVerifiedMessageAtIso
          ? Math.max(0, Math.floor((nowMs - Date.parse(snapshot.lastVerifiedMessageAtIso)) / 1000))
          : null,
        allowLiveOperationalMutation: false,
        diagnosticMessage: `Socket disconnected. Last verified message: ${
          snapshot.lastVerifiedMessageAtIso ?? 'NEVER'
        }`,
      };
    }

    // Rule 3: Connected socket with no verified messages yet is UNKNOWN
    if (!snapshot.lastVerifiedMessageAtIso) {
      return {
        analyzerId: snapshot.analyzerId,
        state: 'UNKNOWN',
        lastVerifiedMessageAtIso: null,
        ageSeconds: null,
        allowLiveOperationalMutation: false,
        diagnosticMessage: 'Socket open; awaiting first verified ASTM/HL7 frame.',
      };
    }

    const ageSeconds = Math.max(
      0,
      Math.floor((nowMs - Date.parse(snapshot.lastVerifiedMessageAtIso)) / 1000)
    );

    // Rule 4: Degraded if high NAK count or unacknowledged DLQ messages exist
    if (snapshot.recentNakCount >= 3 || snapshot.dlqDepth > 0) {
      return {
        analyzerId: snapshot.analyzerId,
        state: 'DEGRADED',
        lastVerifiedMessageAtIso: snapshot.lastVerifiedMessageAtIso,
        ageSeconds,
        allowLiveOperationalMutation: false,
        diagnosticMessage: `Interface degraded (NAK count=${snapshot.recentNakCount}, DLQ=${snapshot.dlqDepth}).`,
      };
    }

    // Rule 5: Stale if heartbeat/message age exceeds threshold
    if (ageSeconds > staleThresholdSeconds) {
      return {
        analyzerId: snapshot.analyzerId,
        state: 'STALE',
        lastVerifiedMessageAtIso: snapshot.lastVerifiedMessageAtIso,
        ageSeconds,
        allowLiveOperationalMutation: false,
        diagnosticMessage: `Telemetry stale (${ageSeconds}s > ${staleThresholdSeconds}s threshold).`,
      };
    }

    const allowMutation =
      modeState.mode === 'CONTROLLED_PRODUCTION_MODE' && !modeState.emergencyStopActive;

    return {
      analyzerId: snapshot.analyzerId,
      state: 'LIVE',
      lastVerifiedMessageAtIso: snapshot.lastVerifiedMessageAtIso,
      ageSeconds,
      allowLiveOperationalMutation: allowMutation,
      diagnosticMessage: `Verified live interface (${snapshot.protocol}).`,
    };
  }
}

export const nexusOperatingModeService = new NexusOperatingModeService();
