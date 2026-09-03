import React, { useState } from 'react';
import { Repeat, X, Check } from 'lucide-react';
import { FleetTankItem } from '@/types/lng';

interface NiasTankRelocationDrawerProps {
    tank: FleetTankItem | null;
    onClose: () => void;
    onConfirm: (data: {
        tankNo: string;
        origin: string;
        targetZone: string;
        slotNumber: number;
        heelPct: number;
        heelPressMPa: number;
        heelTempC: number;
        heelWeightKg: number;
        remarks: string;
    }) => void;
}

export function NiasTankRelocationDrawer({ tank, onClose, onConfirm }: NiasTankRelocationDrawerProps) {
    const [relocateTargetZone, setRelocateTargetZone] = useState<string>('Laydown 1');
    const [relocateSlotNumber, setRelocateSlotNumber] = useState<number>(1);
    const [relocateHeelPct, setRelocateHeelPct] = useState<number>(4.0);
    const [relocateHeelPressMPa, setRelocateHeelPressMPa] = useState<number>(0.22);
    const [relocateHeelTempC, setRelocateHeelTempC] = useState<number>(-135.0);
    const [relocateHeelWeightKg, setRelocateHeelWeightKg] = useState<number>(350);
    const [relocateRemarks, setRelocateRemarks] = useState<string>('');

    if (!tank) return null;

    const handleConfirmRelocation = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            tankNo: tank.tankNo,
            origin: tank.position || 'Nias Yard',
            targetZone: relocateTargetZone,
            slotNumber: relocateSlotNumber,
            heelPct: relocateHeelPct,
            heelPressMPa: relocateHeelPressMPa,
            heelTempC: relocateHeelTempC,
            heelWeightKg: relocateHeelWeightKg,
            remarks: relocateRemarks,
        });
    };

    return (
        <div className="fixed inset-0 z-50 win-panel/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="win-panel p-0 max-w-lg w-full bg-[#ece9d8] shadow-2xl overflow-hidden flex flex-col">
                {/* Titlebar */}
                <div className="bg-[#0a2540] text-white px-3 py-1.5 flex justify-between items-center select-none shrink-0 border-b-2 border-slate-700">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-slate-950 font-bold" />
                        <span>Relocate ISO Tank {tank.tankNo}</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="win-btn px-2 py-0 text-xs bg-red-600 hover:bg-red-500 text-white font-bold border-red-800"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto custom-scada-scrollbar">
                    <p className="text-xs text-slate-950 font-bold mb-4">
                        Seamlessly reassign vessel <span className="font-bold text-slate-950 font-bold font-mono">{tank.tankNo}</span> ({tank.serialNo}) across physical terminal lifecycle zones:
                    </p>

                    <form onSubmit={handleConfirmRelocation} className="space-y-4 text-xs">
                        {/* Origin vs Target Preview */}
                        <div className="flex items-center justify-between bg-slate-300 p-2 border border-slate-400 font-mono text-center mb-2">
                            <div className="flex-1 bg-slate-100 p-1.5 border border-slate-300 shadow-inner">
                                <span className="text-[10px] text-slate-600 block uppercase">Current Origin</span>
                                <span className="font-bold text-slate-950 font-bold text-xs truncate block">
                                    {tank.position || 'Nias Yard'}
                                </span>
                            </div>
                            <div className="px-3 text-slate-500"><Repeat className="w-4 h-4 mx-auto" /></div>
                            <div className="flex-1 bg-emerald-100 p-1.5 border border-emerald-300 shadow-inner">
                                <span className="text-[10px] text-emerald-800 block uppercase">New Target</span>
                                <span className="font-bold text-slate-950 font-bold text-xs truncate block">
                                    {relocateTargetZone} {relocateTargetZone.startsWith('Laydown') ? `(Slot ${relocateSlotNumber})` : ''}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Zone Selector */}
                            <div>
                                <label className="block text-slate-950 font-bold mb-1 font-bold">Target Zone:</label>
                                <select
                                    value={relocateTargetZone}
                                    onChange={(e) => setRelocateTargetZone(e.target.value)}
                                    className="win-input w-full px-2 py-1.5 text-xs font-mono font-bold"
                                >
                                    <option value="Laydown 1">Laydown 1 (ORU Buffer)</option>
                                    <option value="Laydown 2">Laydown 2 (Heel Storage)</option>
                                    <option value="Laydown 3">Laydown 3 (Export Staging)</option>
                                    <option value="Maintenance">MRO Maintenance Bay</option>
                                    <option value="Gatehouse">Gatehouse Checkout</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-tight">
                                    {relocateTargetZone === 'Laydown 2' ? 'Requires Heel retention validation.' : 'Standard staging placement.'}
                                </p>
                            </div>

                            {/* Slot Selector (If target is a Yard) */}
                            {relocateTargetZone.startsWith('Laydown') && (
                                <div>
                                    <label className="block text-slate-950 font-bold mb-1 font-bold">Yard Slot #:</label>
                                    <select
                                        value={relocateSlotNumber}
                                        onChange={(e) => setRelocateSlotNumber(parseInt(e.target.value) || 1)}
                                        className="win-input w-full px-2 py-1.5 text-xs font-mono"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(slot => (
                                            <option key={slot} value={slot}>Slot {slot.toString().padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Laydown Yard 2 Heel Preservation Parameters */}
                        {(relocateTargetZone === 'Laydown 2' || relocateTargetZone === 'Laydown 3') && (
                            <div className="p-3.5 bg-purple-950/30 border border-purple-500/40 rounded-none space-y-3">
                                <h4 className="text-purple-900 font-bold border-b border-purple-300 pb-1 flex justify-between items-center">
                                    <span>Cryo Heel Preservation Data</span>
                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-200 px-1 border border-purple-400">LD-2/3 REQ</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-900 font-bold mb-1 text-[10px]">Heel Level (%):</label>
                                        <div className="flex items-center gap-1 bg-white border border-slate-400 p-0.5">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={relocateHeelPct}
                                                onChange={(e) => setRelocateHeelPct(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none text-right font-mono font-bold text-purple-900 px-1 outline-none focus:bg-amber-100"
                                            />
                                            <span className="text-slate-500 font-mono text-[10px] pr-1">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-900 font-bold mb-1 text-[10px]">Holding Press (MPa):</label>
                                        <div className="flex items-center gap-1 bg-white border border-slate-400 p-0.5">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={relocateHeelPressMPa}
                                                onChange={(e) => setRelocateHeelPressMPa(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none text-right font-mono font-bold text-purple-900 px-1 outline-none focus:bg-amber-100"
                                            />
                                            <span className="text-slate-500 font-mono text-[10px] pr-1">MPa</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-900 font-bold mb-1 text-[10px]">Bulk Temp (°C):</label>
                                        <div className="flex items-center gap-1 bg-white border border-slate-400 p-0.5">
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={relocateHeelTempC}
                                                onChange={(e) => setRelocateHeelTempC(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none text-right font-mono font-bold text-purple-900 px-1 outline-none focus:bg-amber-100"
                                            />
                                            <span className="text-slate-500 font-mono text-[10px] pr-1">°C</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-900 font-bold mb-1 text-[10px]">Est. Mass (kg):</label>
                                        <div className="flex items-center gap-1 bg-white border border-slate-400 p-0.5 bg-slate-100">
                                            <input
                                                type="number"
                                                value={relocateHeelWeightKg}
                                                onChange={(e) => setRelocateHeelWeightKg(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-none text-right font-mono font-bold text-slate-900 px-1 outline-none"
                                            />
                                            <span className="text-slate-500 font-mono text-[10px] pr-1">kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-950 font-bold mb-1 font-bold">Relocation Remarks / Reason:</label>
                            <input
                                type="text"
                                placeholder="e.g. Staged for peak evening load / Venting boil-off gas"
                                value={relocateRemarks}
                                onChange={(e) => setRelocateRemarks(e.target.value)}
                                className="win-input w-full px-2 py-1.5 text-xs font-mono"
                            />
                        </div>

                        {/* Actions */}
                        <div className="mt-6 pt-4 border-t border-slate-300 flex justify-end gap-2 bg-[#d4d0c8] -mx-4 -mb-4 p-3 shadow-inner">
                            <button
                                type="button"
                                onClick={onClose}
                                className="win-btn px-4 py-1.5 bg-slate-200 text-slate-800 font-bold text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="win-btn px-6 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-emerald-800 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                <span>Confirm Relocation</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
