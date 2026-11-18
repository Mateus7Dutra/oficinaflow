import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { calculateOSTotals, formatBRL } from '../engine/stateMachine';

export const S12MecanicoExecucao: React.FC = () => {
  const {
    os,
    toggleServiceDone,
    logWorkedHours,
    togglePartApplied,
    requestAdditionalService,
    updateQuality,
    approveQuality,
    rejectQualityRework,
  } = useOficina();

  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraDesc, setExtraDesc] = useState('');
  const [extraVal, setExtraVal] = useState(95);

  const totals = calculateOSTotals(os);

  const handleRequestExtra = () => {
    const ok = requestAdditionalService(extraDesc, extraVal);
    if (ok) {
      setExtraDesc('');
      setExtraVal(95);
      setShowAddExtra(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left: Execution Tasks & Parts */}
      <div className="xl:col-span-7 space-y-5">
        {/* Hours Summary */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#0F2942]">{os.id}</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                Box {os.box}
              </span>
              {os.quality.reworkCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-100 text-[#DC2626] text-xs font-bold">
                  Retrabalho #{os.quality.reworkCount}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {os.vehicleModel} · {os.plate} · Cliente: {os.clientName}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-semibold">Horas Trabalhadas</div>
              <div className="text-lg font-bold text-[#0F2942] inline-flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
                {totals.totalWorkedHours.toFixed(1)}h / {totals.totalEstimatedHours.toFixed(1)}h
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0F2942] inline-flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#F59E0B]" />
              Tarefas da Ordem de Serviço
            </h2>
            <button
              type="button"
              onClick={() => setShowAddExtra((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F2942] text-xs font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Solicitar serviço adicional
            </button>
          </div>

          {showAddExtra && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-[#F59E0B] space-y-2.5">
              <div className="text-xs font-bold text-amber-950">
                Novo Serviço Adicional (Bloqueado até aprovação do cliente · RN18)
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  placeholder="Ex.: Troca de coifa da homocinética"
                  value={extraDesc}
                  onChange={(e) => setExtraDesc(e.target.value)}
                  className="flex-1 min-w-[180px] px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
                />
                <input
                  type="number"
                  value={extraVal}
                  onChange={(e) => setExtraVal(Number(e.target.value))}
                  className="w-24 px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleRequestExtra}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
                >
                  Solicitar autorização
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {os.services.map((s) => {
              const locked = s.isAdditional && s.additionalStatus !== 'Autorizado';
              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    locked
                      ? 'border-amber-300 bg-amber-50/40'
                      : s.done
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[200px]">
                    <input
                      type="checkbox"
                      checked={!!s.done}
                      onChange={() => toggleServiceDone(s.id)}
                      className="rounded border-slate-300 text-[#16A34A]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span>{s.description}</span>
                        {s.isAdditional && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              s.additionalStatus === 'Autorizado'
                                ? 'bg-green-100 text-[#16A34A]'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {locked && <Lock className="w-2.5 h-2.5" />}
                            {s.additionalStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Estimado: {s.hours.toFixed(1)}h · Apontado: {(s.workedHours ?? 0).toFixed(1)}h
                        {s.isAdditional ? ` · ${formatBRL(s.hours * s.hourlyRate)}` : ''}
                      </div>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => logWorkedHours(s.id, 0.5)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                  >
                    + 0,5h
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applied Parts */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-[#0F2942]">Peças Aplicadas na Execução</h2>
          <div className="space-y-2">
            {os.parts.map((p) => (
              <label
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={!!p.applied}
                    onChange={() => togglePartApplied(p.id)}
                    className="rounded border-slate-300 text-[#0F2942]"
                  />
                  <span className="font-medium text-slate-800">{p.name}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">{p.code}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Mandatory Quality Control (RN19) */}
      <div className="xl:col-span-5">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4 sticky top-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              <div>
                <h2 className="text-base font-bold text-[#0F2942]">
                  Controle de Qualidade (Obrigatório)
                </h2>
                <p className="text-xs text-slate-500">
                  RN19: O veículo só vai para cobrança após aprovação neste checklist.
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                os.quality.status === 'Aprovado'
                  ? 'bg-green-100 text-[#16A34A]'
                  : os.quality.status === 'Reprovado'
                  ? 'bg-red-100 text-[#DC2626]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {os.quality.status}
            </span>
          </div>

          <div className="space-y-2">
            {[
              { key: 'roadTest5km' as const, label: 'Teste de rodagem (5 km) concluído sem anomalias' },
              { key: 'brakingNoNoise' as const, label: 'Frenagem eficiente, progressiva e sem ruído' },
              { key: 'noLeaksAbsOff' as const, label: 'Sem vazamentos de fluido · Luz ABS apagada no painel' },
              { key: 'cleaningDone' as const, label: 'Limpeza de cortesia (volante, manopla e área de trabalho)' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={os.quality[item.key]}
                  onChange={(e) => updateQuality({ [item.key]: e.target.checked })}
                  className="rounded border-slate-300 text-[#16A34A]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Laudo Final de Qualidade
            </label>
            <textarea
              rows={3}
              value={os.quality.finalReport}
              onChange={(e) => updateQuality({ finalReport: e.target.value })}
              placeholder="Ex.: Veículo testado em via urbana (5,4 km). Frenagem silenciosa, scanner OBD limpo sem código C1234."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => approveQuality()}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aprovar e registrar laudo
            </button>
            <button
              type="button"
              onClick={() => rejectQualityRework(os.quality.finalReport)}
              className="py-2.5 px-4 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Reprovar (retrabalho)
            </button>
          </div>

          {os.quality.status === 'Reprovado' && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>OS devolvida para execução devido à reprovação no controle de qualidade.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
