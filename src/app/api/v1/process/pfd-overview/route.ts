// src/app/api/v1/process/pfd-overview/route.ts
/**
 * NIAS-CMMS: High-Density SCADA PFD Single-Snapshot API Endpoint
 * Path: GET /api/v1/process/pfd-overview
 * Strict UTF-8 (without BOM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScadaPfdService } from '@/services/scada-pfd-service';
import { calculateISO6976 } from '@/lib/iso6976-engine';
import { globalMassBalanceEngine } from '@/lib/mass-balance-engine';
import { GasCompositionMolarFractions } from '@/types/pipeline-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const timestamp = searchParams.get('timestamp') || new Date().toISOString();

    const snapshot = ScadaPfdService.generatePfdSnapshot(timestamp);

    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'X-Engine-Standard': 'ISO 6976:2016 / GPA 2172 / AGA 8-9',
        'X-Process-Cycle': 'Rolling 24-Hour Active Reconciliation',
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal SCADA snapshot aggregation error';
    return NextResponse.json(
      {
        SYSTEM_STATUS: 'DEGRADED',
        ERROR: errMsg,
        TIMESTAMP_ISO8601: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support on-demand composition override or discrete event injection
    if (body.customComposition) {
      const customGc = body.customComposition as Partial<GasCompositionMolarFractions>;
      const isoCalculated = calculateISO6976(customGc);
      return NextResponse.json({
        success: true,
        message: 'Custom ISO 6976 thermodynamic calculation completed',
        calculatedProperties: isoCalculated,
      });
    }

    if (body.discreteEvent) {
      const result = globalMassBalanceEngine.ingestDiscreteEvent(body.discreteEvent);
      return NextResponse.json({
        success: true,
        message: 'Discrete logistics event ingested into Mass Balance synchronization pipeline',
        eventId: result.eventId,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid payload format. Expected customComposition or discreteEvent.' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Processing error in SCADA endpoint';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
