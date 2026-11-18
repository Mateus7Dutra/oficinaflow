import React, { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Clock, FileSignature, X } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { OS_STATE_META } from '../engine/stateMachine';

const TIMELINE_STEPS = [
  'Agendado',
  'Recebimento do veículo',
  'Diagnóstico',
  'Orçamento',
  'Autorização',
  'Execução e qualidade',
  'Pronto para retirada',
];

export const S05ClienteTermo: React.FC = () => {
  const { os, signReceptionTerm, disputeReceptionTerm } = useOficina();
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { km: true, fuel: true };
    os.inspection.damages.forEach((d) => {
      initial[d.id] = d.clientConfirmed !== false;
    });
    return initial;
  });
  const [comment, setComment] = useState(os.inspection.clientDisputeComment || '');

  const currentStepIdx = OS_STATE_META[os.state].timelineStep;
  const disputedIds = os.inspection.damages.filter((d) => checks[d.id] === false).map((d) => d.id);
  const canSignOrDispute = os.state === 'AGUARDANDO_TERMO' || os.state === 'TERMO_CONTESTADO';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Reception Term Checklist */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0F2942]">
              Termo de Recebimento · {os.id}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {os.vehicleModel} ({os.plate}) · Box {os.box} · Emitido em{' '}
              {os.inspection.termIssuedAt || '18/11/2026 09:10'}
            </p>
          </div>
          {os.inspection.termSignedAt ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-[#16A34A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Assinado em {os.inspection.termSignedAt}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5" />
              Aguardando conferência (RN04)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-3">Item do Check-in</th>
                <th className="py-2.5 px-3">Registro / Evidência</th>
                <th className="py-2.5 pl-3 text-right">Confere?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-800">Quilometragem</td>
                <td className="py-3 px-3 text-slate-600">
                  {os.inspection.mileage.toLocaleString('pt-BR')} km
                </td>
                <td className="py-3 pl-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChecks((p) => ({ ...p, km: true }))}
                      className={`w-7 h-7 rounded-md flex items-center justify-center border transition ${
                        checks.km
                          ? 'bg-[#16A34A] border-[#16A34A] text-white'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecks((p) => ({ ...p, km: false }))}
                      className={`w-7 h-7 rounded-md flex items-center justify-center border transition ${
                        checks.km === false
                          ? 'bg-[#DC2626] border-[#DC2626] text-white'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-800">Nível de Combustível</td>
                <td className="py-3 px-3 text-slate-600">{os.inspection.fuelLevel}</td>
                <td className="py-3 pl-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChecks((p) => ({ ...p, fuel: true }))}
                      className={`w-7 h-7 rounded-md flex items-center justify-center border transition ${
                        checks.fuel
                          ? 'bg-[#16A34A] border-[#16A34A] text-white'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecks((p) => ({ ...p, fuel: false }))}
                      className={`w-7 h-7 rounded-md flex items-center justify-center border transition ${
                        checks.fuel === false
                          ? 'bg-[#DC2626] border-[#DC2626] text-white'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {os.inspection.damages.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 pr-3 align-top">
                    <div className="font-semibold text-slate-800">
                      Avaria #{d.number} · {d.location}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{d.description}</div>
                  </td>
                  <td className="py-3 px-3">
                    <img
                      src={d.photoDataUrl}
                      alt={d.location}
                      className="w-24 h-16 object-cover rounded-lg border border-slate-200"
                    />
                  </td>
                  <td className="py-3 pl-3 text-right align-middle">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setChecks((p) => ({ ...p, [d.id]: true }))}
                        className={`w-7 h-7 rounded-md flex items-center justify-center border transition ${
                          checks[d.id] !== false
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                        title="Confere"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setChecks((p) => ({ ...p, [d.id]: false }))}
                        className={`w-7 h-7 rounded-md flex items-center justify-center border transition ${
                          checks[d.id] === false
                            ? 'bg-[#DC2626] border-[#DC2626] text-white'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                        title="Contestar item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dispute Comment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Comentário sobre os itens contestados (obrigatório ao contestar · RN06)
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Descreva qualquer divergência encontrada na quilometragem, combustível ou avarias..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => signReceptionTerm()}
            disabled={!canSignOrDispute && !!os.inspection.termSignedAt}
            className="px-5 py-2.5 rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
          >
            <FileSignature className="w-4 h-4" />
            Assinar termo
          </button>
          <button
            type="button"
            onClick={() => disputeReceptionTerm(disputedIds, comment)}
            className="px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
          >
            <AlertTriangle className="w-4 h-4" />
            Contestar itens marcados
          </button>
        </div>
      </div>

      {/* Right: Real-time Vertical Timeline */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#0F2942]">Acompanhar OS</h2>
          <span className="font-mono text-xs font-bold text-[#F59E0B]">{os.id}</span>
        </div>

        <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 mb-5">
          <div className="text-[11px] text-slate-500 font-semibold uppercase">Status Atual</div>
          <div className="text-sm font-bold text-[#0F2942] mt-0.5">
            {OS_STATE_META[os.state].label}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {OS_STATE_META[os.state].phaseLabel}
          </div>
        </div>

        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
          {TIMELINE_STEPS.map((label, idx) => {
            const done = idx < currentStepIdx || os.state === 'ENCERRADA_CONCLUIDA';
            const current = idx === currentStepIdx && os.state !== 'ENCERRADA_CONCLUIDA';
            return (
              <li key={label} className="ml-5 relative">
                <span
                  className={`absolute -left-[29px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    done
                      ? 'bg-[#16A34A] border-[#16A34A] text-white'
                      : current
                      ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0F2942] ring-4 ring-amber-100'
                      : 'bg-white border-slate-300 text-slate-300'
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </span>
                <div
                  className={`text-xs font-semibold ${
                    done ? 'text-slate-800' : current ? 'text-[#0F2942] font-bold' : 'text-slate-400'
                  }`}
                >
                  {label}
                </div>
                {current && (
                  <div className="text-[11px] text-[#F59E0B] font-semibold mt-0.5">
                    Etapa em andamento
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
