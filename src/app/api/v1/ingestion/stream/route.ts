// src/app/api/v1/ingestion/stream/route.ts
/**
 * NIAS-CMMS: Dual-Stream Data Ingestion & State Machine Transition API
 * Path: POST /api/v1/ingestion/stream
 * Strict UTF-8 (without BOM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalMassBalanceEngine } from '@/lib/mass-balance-engine';
import { evaluateTankThermodynamicState, transitionManifoldState } from '@/lib/tank-thermo-engine';
import { DiscreteLogisticsEvent, ContinuousTelemetryFrame1Hz, ManifoldState } from '@/types/pipeline-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const streamType = payload.streamType as 'DISCRETE_LOGISTICS' | 'CONTINUOUS_1HZ' | 'TANK_STATE_EVALUATION' | 'MANIFOLD_TRANSITION';

    if (streamType === 'DISCRETE_LOGISTICS') {
      const event = payload.event as DiscreteLogisticsEvent;
      if (!event || !event.tankNo || !event.eventType) {
        return NextResponse.json({ success: false, error: 'Missing required discrete event properties.' }, { status: 400 });
      }

      const result = globalMassBalanceEngine.ingestDiscreteEvent(event);
      return NextResponse.json({
        success: true,
        message: `Discrete logistics event ${event.eventType} registered for tank ${event.tankNo}`,
        eventId: result.eventId,
      });
    }

    if (streamType === 'CONTINUOUS_1HZ') {
      const frame = payload.frame as ContinuousTelemetryFrame1Hz;
      if (!frame || !frame.timestamp) {
        return NextResponse.json({ success: false, error: 'Missing continuous telemetry frame properties.' }, { status: 400 });
      }

      globalMassBalanceEngine.ingestContinuousTelemetry(frame);
      return NextResponse.json({
        success: true,
        message: 'Continuous 1Hz telemetry frame ingested and aggregated into time buckets',
        sequenceId: frame.sequenceId,
      });
    }

    if (streamType === 'TANK_STATE_EVALUATION') {
      const state = evaluateTankThermodynamicState(payload.params);
      return NextResponse.json({
        success: true,
        thermodynamicState: state,
      });
    }

    if (streamType === 'MANIFOLD_TRANSITION') {
      const { currentState, action } = payload;
      const nextState = transitionManifoldState(
        currentState as ManifoldState,
        action as 'CONNECT_BAY_DISCHARGE' | 'DISCONNECT_BAY' | 'TRIGGER_BOG_VENT' | 'CLOSE_VENT_TO_STANDBY'
      );
      return NextResponse.json({
        success: true,
        previousState: currentState,
        nextState,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown streamType. Expected DISCRETE_LOGISTICS, CONTINUOUS_1HZ, TANK_STATE_EVALUATION, or MANIFOLD_TRANSITION.' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error processing stream ingestion';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
