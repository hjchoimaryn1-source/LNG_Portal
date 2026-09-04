import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { NiasTankAsset, NiasZone } from '../../NiasTerminalView';
import NiasSkidSendoutHeelModal from './NiasSkidSendoutHeelModal';

export interface NiasTankDetailModalProps {
  tank: NiasTankAsset | null;
  onClose: () => void;
  activeBays: any[];
  getRackTag: (bayId: string) => string;
  tankInventory: NiasTankAsset[];
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  unmountBay: (bayId: string) => void;
  mountTankToBay: (bayId: string, tankId: string) => void;
  moveTankLocation: (tankId: string, targetLocation: string, targetSlot?: number, options?: any) => void;
  setToastMessage: (msg: string | null) => void;
  onNavigateToSkid?: () => void;
  setSelectedDetailTank?: React.Dispatch<React.SetStateAction<NiasTankAsset | null>>;
}

export const NiasTankDetailModal: React.FC<NiasTankDetailModalProps> = ({
  tank,
  onClose,
  activeBays,
  getRackTag,
  tankInventory,
  setTankInventory,
  unmountBay,
  mountTankToBay,
  moveTankLocation,
  setToastMessage,
  onNavigateToSkid,
  setSelectedDetailTank,
}) => {
  if (!tank) return null;

  const isSkidTank =
    tank.currentZone.includes('BAY') ||
    activeBays.some((b) => b.tankNo === tank.id);
  const activeBayObj = activeBays.find((b) => b.tankNo === tank.id);
  const rackTag = activeBayObj ? getRackTag(activeBayObj.bayId) : getRackTag(tank.currentZone);

  const currentMassKg = Math.round((tank.levelPercent / 100) * 18200);
  const usableKg = Math.max(0, currentMassKg - 420);
  const remHours = usableKg / 900;
  const etaDate = new Date(Date.now() + remHours * 3600 * 1000);
  const etaTimeStr = `${String(etaDate.getHours()).padStart(2, '0')}:${String(etaDate.getMinutes()).padStart(2, '0')}`;

  const idNum = parseInt(tank.id.replace(/\D/g, ''), 10) || 1;
  const daysAgo = ((idNum * 3) % 7) + 1.3;
  const baseTime = new Date('2026-08-29T14:00:00+07:00').getTime();
  const stagedTime = new Date(baseTime - daysAgo * 24 * 3600 * 1000);
  const yyyy = stagedTime.getFullYear();
  const mm = String(stagedTime.getMonth() + 1).padStart(2, '0');
  const dd = String(stagedTime.getDate()).padStart(2, '0');
  const hh = String(stagedTime.getHours()).padStart(2, '0');
  const min = String(stagedTime.getMinutes()).padStart(2, '0');
  const formattedDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  const daysStr = daysAgo.toFixed(1);

  const zoneLabel =
    tank.currentZone === 'LAYDOWN_1'
      ? `ORU (LD-1) Slot #${tank.slotIndex || 1}`
      : tank.currentZone === 'LAYDOWN_2'
        ? `ORU (LD-2) Slot #${tank.slotIndex || 1}`
        : `ORU (ISO TK-Skid) Rack ${rackTag}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="win-window border-2 border-slate-400 max-w-4xl w-full p-0 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden select-none bg-[#d4d0c8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar */}
        <div className="bg-[#002b4d] text-white px-4 py-2 flex justify-between items-center select-none border-b border-blue-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm uppercase tracking-wider">
              {isSkidTank
                ? `Active Skid Sendout Monitor — ${tank.id} (${rackTag})`
                : `ISO Tank Condition — ${tank.id}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white font-mono font-bold text-sm px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sub-Header Banner (Dark Gray Background) */}
        <div className="bg-[#2d3748] text-slate-200 px-4 py-2.5 text-xs sm:text-sm font-mono flex flex-wrap justify-between items-center border-b border-slate-600 gap-2">
          <div className="flex flex-col gap-1">
            {isSkidTank ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    <strong className="text-white">Rack:</strong> {rackTag} (Liquid Feed)
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>
                    <strong className="text-white">PLTMG Load:</strong> 18.5 MW (74.0%)
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>
                    <strong className="text-white">Sendout:</strong> 1,700 Nm³/h
                  </span>
                </div>
                <div className="text-xs text-amber-300 font-mono">
                  <strong className="text-white">Cutoff Target:</strong> Heel 1.0 m³ Cutoff Tracking Active (SOP Rev.0)
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    <strong className="text-white">ID:</strong> {tank.id}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>
                    <strong className="text-white">Serial:</strong> {tank.serialNo || 'SIMU-820101'}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>
                    <strong className="text-white">Zone:</strong> {zoneLabel}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  <strong className="text-white">Staged Since:</strong> {formattedDate} (~{daysStr} Days Staged)
                </div>
              </>
            )}
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold font-mono border self-center ${tank.currentZone === 'LAYDOWN_1'
            ? 'bg-slate-900 text-cyan-300 border-cyan-400/40'
            : tank.currentZone === 'LAYDOWN_2'
              ? 'bg-slate-900 text-purple-200 border-purple-400/40'
              : 'bg-slate-900 text-emerald-300 border-emerald-400/40'
            }`}>
            {tank.currentZone === 'LAYDOWN_1'
              ? 'ORU (LD-1) CRYO STORAGE'
              : tank.currentZone === 'LAYDOWN_2'
                ? 'ORU (LD-2) HEEL BUFFER'
                : `PLTMG SENDOUT RACK (${rackTag})`}
          </span>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {isSkidTank ? (
            <NiasSkidSendoutHeelModal
              targetTank={tank}
              activeBay={activeBayObj}
              rackTag={rackTag}
              currentMassKg={currentMassKg}
              remHours={remHours}
              etaTimeStr={etaTimeStr}
              onClose={onClose}
              onNavigateToSkid={() => {
                onClose();
                onNavigateToSkid?.();
              }}
              onConfirm={(data) => {
                const occupiedSlots = new Set(
                  tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2').map((t) => t.slotIndex)
                );
                let targetSlot = 1;
                for (let s = 1; s <= 16; s++) {
                  if (!occupiedSlots.has(s)) {
                    targetSlot = s;
                    break;
                  }
                }
                const { pressureMpa, levelMmH2O, heelVolM3, heelMassKg } = data;
                const heelPct = Math.round((heelVolM3 / 44.0) * 100 * 10) / 10; // ~2.3%

                setTankInventory((prev) =>
                  prev.map((t) =>
                    t.id === tank.id
                      ? {
                        ...t,
                        currentZone: 'LAYDOWN_2',
                        slotIndex: targetSlot,
                        levelPercent: heelPct,
                        levelM3: heelVolM3,
                        levelMmH2O: levelMmH2O,
                        pressureMpa: pressureMpa,
                        tempC: -135.0,
                      }
                      : t
                  )
                );
                const bayToUnmount = activeBayObj ? activeBayObj.bayId : tank.currentZone;
                unmountBay(bayToUnmount);
                moveTankLocation(tank.id, 'Laydown 2', targetSlot, {
                  heelLevelPct: heelPct,
                  heelPressureMPa: pressureMpa,
                  heelTempC: -135.0,
                  heelWeightKg: heelMassKg,
                  remarks: `Regas Complete: Final Heel ${heelVolM3} m³ (${heelMassKg} kg) moved to Laydown 2`,
                });
                onClose();
                setToastMessage(`⏹ ${tank.id} completed: Final Heel ${heelVolM3} m³ (${heelMassKg} kg) moved to ORU (LD-2) Slot #${targetSlot}`);
                setTimeout(() => setToastMessage(null), 3000);
              }}
            />
          ) : (
            /* ========================================================================= */
            /* YARD TANK CONDITION SECTIONS (LAYDOWN 1 & LAYDOWN 2)                      */
            /* ========================================================================= */
            <>
              {/* Section 1: Current Telemetry */}
              <div className="win-panel p-3 bg-white border border-slate-300 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-slate-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                    Current Telemetry
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Holding Pressure */}
                  <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">Holding Pressure</span>
                    <strong className={`font-mono text-base sm:text-lg font-bold block my-0.5 ${(tank.pressureMpa || 0) >= 0.74 ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                      {(tank.pressureMpa || 0.76).toFixed(2)} MPa
                    </strong>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {(tank.pressureMpa || 0) >= 0.74 ? 'Overpressure (≥0.74)' : 'Normal (<0.74)'}
                    </span>
                  </div>

                  {/* Liquid Level / Volume */}
                  <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">Liquid Level / Volume</span>
                    <strong className="font-mono text-base sm:text-lg font-bold text-blue-950 block my-0.5">
                      {(tank.levelPercent * 0.44).toFixed(1)} / 44.0 m³ ({tank.levelPercent}%)
                    </strong>
                    <div className="w-3/4 mx-auto bg-slate-200 h-1.5 mt-1 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-[#0284c7]"
                        style={{ width: `${Math.min(100, Math.max(0, tank.levelPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Cryogenic Temp */}
                  <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">Cryogenic Temp</span>
                    <strong className="font-mono text-base sm:text-lg font-bold text-slate-900 block my-0.5">
                      {(tank.tempC ?? -126.5).toFixed(1)} °C
                    </strong>
                    <span className="text-[10px] font-mono text-emerald-700 block">Cryo Intact</span>
                  </div>

                  {/* Calculated LNG Mass */}
                  <div className="win-sunken bg-slate-50 p-3 border border-slate-200 text-center flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 font-sans block mb-1">LNG Mass</span>
                    <strong className="font-mono text-base sm:text-lg font-bold text-emerald-800 block my-0.5">
                      {currentMassKg.toLocaleString()} kg
                    </strong>
                    <span className="text-[10px] font-mono text-slate-500 block">Density: 441 kg/m³</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Sensor Cross-Check (Excel-Style Table) */}
              <div className="win-panel p-3 bg-white border border-slate-300 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                  Sensor Cross-Check
                </h4>
                <div className="overflow-x-auto border border-slate-300 rounded-none">
                  <table className="w-full text-xs font-mono text-left border-collapse">
                    <thead className="bg-slate-800 text-slate-200">
                      <tr>
                        <th className="py-1.5 px-3 font-semibold border-r border-slate-700">Parameter</th>
                        <th className="py-1.5 px-3 font-semibold text-center border-r border-slate-700">Local Analog</th>
                        <th className="py-1.5 px-3 font-semibold text-center border-r border-slate-700">SCADA / SMT</th>
                        <th className="py-1.5 px-3 font-semibold text-center border-r border-slate-700">Delta</th>
                        <th className="py-1.5 px-3 font-semibold text-center">Integrity Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Pressure</td>
                        <td className="py-1.5 px-3 text-center text-slate-700 border-r border-slate-200">{(tank.pressureMpa || 0.76).toFixed(3)} MPa</td>
                        <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">{((tank.pressureMpa || 0.76) - 0.002).toFixed(3)} MPa</td>
                        <td className="py-1.5 px-3 text-center text-slate-700 border-r border-slate-200">+0.002 MPa</td>
                        <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">In-Spec (Calibrated)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Vacuum Annulus</td>
                        <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">&lt; 1.0 Pa</td>
                        <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Hard Vacuum Sealed</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Telemetry Battery</td>
                        <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">{tank.batteryPercent || 75}%</td>
                        <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Solar Float OK</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">BOG Venting State</td>
                        <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1.5 px-3 text-center text-slate-900 font-bold border-r border-slate-200">{(tank.pressureMpa || 0) >= 0.74 ? 'Required' : 'Normal'}</td>
                        <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                        <td className={`py-1.5 px-3 text-center font-bold ${(tank.pressureMpa || 0) >= 0.74 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {(tank.pressureMpa || 0) >= 0.74 ? 'Action Needed (≥0.74)' : 'Stable (<0.74)'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Mount to (4-Column Grid) */}
              <div className="win-panel p-3 bg-[#e5e3dc] border border-slate-300 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
                  Mount to
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Bay 01', 'Bay 02', 'Bay 03', 'Bay 04'].map((bayId) => {
                    const bayObj = activeBays.find((b) => b.bayId === bayId);
                    const isOccupied = !!bayObj?.tankNo;
                    const rackT = getRackTag(bayId);
                    return (
                      <button
                        key={bayId}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => {
                          const bayZoneKey = (bayId.replace(' ', '_').toUpperCase()) as NiasZone;
                          setTankInventory((prev) =>
                            prev.map((t) =>
                              t.id === tank.id
                                ? { ...t, currentZone: bayZoneKey }
                                : t
                            )
                          );
                          mountTankToBay(bayId, tank.id);
                          setSelectedDetailTank?.((prev) =>
                            prev ? { ...prev, currentZone: bayZoneKey } : null
                          );
                          setToastMessage(`Mounted ${tank.id} to ${rackT} for Regasification`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className={`win-btn py-1 px-2 font-mono text-center ${isOccupied
                          ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed opacity-75'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-600 cursor-pointer shadow-xs'
                          }`}
                      >
                        {isOccupied ? (
                          <div className="flex flex-col items-center justify-center py-1">
                            <span className="font-bold text-xs text-slate-800">{rackT}</span>
                            <span className="text-[11px] text-amber-700 font-medium">(Active: {bayObj?.tankNo})</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-1">
                            <span className="font-bold text-xs text-slate-700">Mount {rackT}</span>
                            <span className="text-[10px] text-slate-400 font-normal">(Standby / Empty)</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Toolbar (Clean Single Close Button) */}
        <div className="bg-[#d4d0c8] p-3 px-4 flex justify-end items-center border-t border-slate-300">
          <button
            type="button"
            onClick={onClose}
            className="win-btn bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold px-6 py-1.5 text-xs cursor-pointer border border-slate-400 shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NiasTankDetailModal;
