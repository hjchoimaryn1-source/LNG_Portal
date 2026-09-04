import React from 'react';
import { Flame, XCircle } from 'lucide-react';

export interface NiasQuickMountModalProps {
  tankNo: string | null;
  activeBays: any[];
  onMount: (bayId: string, tankNo: string) => void;
  onClose: () => void;
}

export const NiasQuickMountModal: React.FC<NiasQuickMountModalProps> = ({
  tankNo,
  activeBays,
  onMount,
  onClose,
}) => {
  if (!tankNo) return null;

  return (
    <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-md w-full p-6 shadow-none animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-slate-950 font-bold" />
            Mount {tankNo} to Vaporizer Bay
          </h3>
          <button onClick={onClose} className="text-slate-950 font-bold hover:text-slate-950">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-950 font-bold mb-4">
          Choose which vaporizer bay to hook up {tankNo}:
        </p>

        <div className="space-y-2 mb-6">
          {activeBays.map((bay) => (
            <div
              key={bay.bayId}
              onClick={() => onMount(bay.bayId, tankNo)}
              className="p-3 rounded-none win-panel border border-slate-200 hover:border-amber-500 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-bold text-sm text-slate-950 font-bold block">{bay.bayId}</span>
                <span className="text-[10px] text-slate-950 font-bold">
                  {bay.tankNo ? `Current: ${bay.tankNo} (${bay.status})` : 'Available (Empty)'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${bay.status === 'RUNNING'
                  ? 'bg-amber-500/20 text-white font-bold border-amber-200'
                  : 'bg-emerald-500/20 text-white font-bold border-emerald-200'
                  }`}
              >
                {bay.status === 'RUNNING' ? 'In Use' : 'Ready'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none text-xs font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NiasQuickMountModal;
