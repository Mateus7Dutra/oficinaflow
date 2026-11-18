import React from 'react';
import { ArrowRight, History, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { ALLOWED_TRANSITIONS, OS_STATE_META } from '../engine/stateMachine';

export const AuditDrawer: React.FC = () => {
  const { auditDrawerOpen, setAuditDrawerOpen, auditEvents, os, resetDemoData } = useOficina();
  if (!auditDrawerOpen) return null;

  const currentMeta = OS_STATE_META[os.state];
  const nextStates = ALLOWED_TRANSITIONS[os.state] || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F2942] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h2 className="text-base font-semibold">Trilha de Auditoria · {os.id}</h2>
              <p className="text-xs text-slate-300">
                Log imutável de eventos, regras de negócio (RN01–RN21) e máquina BPMN 2.0
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuditDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200"
            aria-label="Fechar gaveta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current BPMN State Box */}
        <div className="p-4 bg-[#F4F7FA] border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Estado Atual na Máquina BPMN
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F2942] text-white">
                  {currentMeta.phase}
                </span>
                <span className="text-sm font-bold text-slate-800">{currentMeta.label}</span>
              </div>
            </div>
            <button
              onClick={resetDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              title="Restaura os dados iniciais do cenário de demonstração"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar Demo
            </button>
          </div>
          <div className="text-xs text-slate-600 bg-white rounded-lg p-2.5 border border-slate-200">
            <span className="font-semibold text-slate-700">Próximas transições válidas: </span>
            {nextStates.length > 0 ? (
              <span className="inline-flex flex-wrap gap-1.5 mt-1">
                {nextStates.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]"
                  >
                    {OS_STATE_META[s].label}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-slate-500 italic">Estado terminal (processo encerrado).</span>
            )}
          </div>
        </div>

        {/* Events Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {auditEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#0F2942]">{evt.actor}</span>
                <span className="text-slate-500 font-mono text-[11px]">{evt.timestamp}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                  Canal: {evt.channel}
                </span>
                {evt.ruleRef && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    {evt.ruleRef}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">{evt.action}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono text-slate-500 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-slate-100">
                  {evt.fromState === 'INICIO' ? 'INÍCIO' : evt.fromState}
                </span>
                <ArrowRight className="w-3 h-3 text-[#F59E0B]" />
                <span className="px-1.5 py-0.5 rounded bg-[#0F2942]/10 text-[#0F2942] font-semibold">
                  {evt.toState}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
