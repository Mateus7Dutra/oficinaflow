import React, { useState } from 'react';
import { CheckCircle2, Clock, MessageSquare, ShieldCheck, XCircle } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { calculateOSTotals, formatBRL } from '../engine/stateMachine';

export const S08ClienteOrcamento: React.FC = () => {
  const {
    os,
    approveQuoteByClient,
    negotiateQuoteByClient,
    refuseQuoteByClient,
    respondAdditionalService,
  } = useOficina();

  const [negotiationNote, setNegotiationNote] = useState('');
  const [requestedDiscount, setRequestedDiscount] = useState(12);
  const [showNegotiate, setShowNegotiate] = useState(false);

  const totals = calculateOSTotals(os);
  const baseServices = os.services.filter((s) => !s.isAdditional);
  const pendingAdditional = os.services.filter(
    (s) => s.isAdditional && s.additionalStatus === 'Pendente aprovação cliente'
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left: Quote Breakdown */}
      <div className="xl:col-span-8 space-y-5">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="font-mono text-xs font-bold text-[#F59E0B]">{os.quote.code}</span>
              <h2 className="text-base font-bold text-[#0F2942]">
                Orçamento Detalhado · {os.vehicleModel} ({os.plate})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Previsão de entrega: <strong>{os.quote.deliveryEstimate}</strong> · Garantia:{' '}
                <strong>{os.quote.warrantyDays} dias</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                <Clock className="w-3.5 h-3.5" />
                Validade: {os.quote.validityDays} dias (até {os.quote.validUntil})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                  <th className="py-2">Descrição</th>
                  <th className="py-2">Tipo / Prazo</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {baseServices.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 font-medium text-slate-800">{s.description}</td>
                    <td className="py-2.5 text-slate-500">Mão de obra · {s.hours.toFixed(1)}h</td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatBRL(s.hours * s.hourlyRate)}
                    </td>
                  </tr>
                ))}
                {os.parts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-medium text-slate-800">{p.name}</td>
                    <td className="py-2.5 text-slate-500">
                      Peça ({p.qty}x) ·{' '}
                      {p.stockStatus === 'Em estoque'
                        ? 'Pronta entrega'
                        : `Sob encomenda (${p.leadTimeDays}d)`}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatBRL(p.qty * p.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 text-sm font-bold text-[#0F2942]">
                  <td colSpan={2} className="pt-3">
                    Total do Orçamento
                    {totals.discountApplied > 0 && (
                      <span className="ml-2 text-xs font-semibold text-[#16A34A]">
                        (Desconto {os.quote.discountPercent}% aplicado: -
                        {formatBRL(totals.discountApplied)})
                      </span>
                    )}
                  </td>
                  <td className="pt-3 text-right">{formatBRL(totals.approvedQuoteTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>
              Garantia legal e contratual de <strong>90 dias</strong> para peças e mão de obra
              executadas.
            </span>
          </div>
        </div>

        {/* Additional Services Pending Client Authorization (RN18) */}
        {pendingAdditional.length > 0 && (
          <div className="bg-amber-50 rounded-xl border border-[#F59E0B] p-5 space-y-3">
            <h3 className="text-sm font-bold text-amber-950">
              Serviço Adicional Aguardando Sua Autorização (RN18)
            </h3>
            <p className="text-xs text-amber-900">
              A oficina identificou um item complementar durante a execução. Ele está bloqueado até
              sua decisão:
            </p>
            {pendingAdditional.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-lg p-3.5 border border-amber-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-slate-800">{srv.description}</div>
                  <div className="text-xs font-semibold text-[#0F2942]">
                    Valor adicional: {formatBRL(srv.hours * srv.hourlyRate)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respondAdditionalService(srv.id, true)}
                    className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-semibold"
                  >
                    Autorizar adicional
                  </button>
                  <button
                    type="button"
                    onClick={() => respondAdditionalService(srv.id, false)}
                    className="px-3.5 py-2 rounded-lg bg-[#DC2626] text-white text-xs font-semibold"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Your Decision */}
      <div className="xl:col-span-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0F2942]">Sua Decisão</h2>

          {os.quote.acceptedAt ? (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 space-y-1.5">
              <div className="text-sm font-bold text-[#16A34A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Orçamento Aprovado (RN11)
              </div>
              <div className="text-xs text-green-900">
                Aceite eletrônico registrado em <strong>{os.quote.acceptedAt}</strong>
              </div>
              <div className="text-xs text-green-800">Canal: {os.quote.acceptedChannel}</div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ao aprovar, seu aceite eletrônico será gravado com data, hora e canal (RN11),
                liberando imediatamente a reserva/compra de peças e execução.
              </p>

              <button
                type="button"
                onClick={() => approveQuoteByClient()}
                className="w-full py-3 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprovar orçamento ({formatBRL(totals.approvedQuoteTotal)})
              </button>

              <button
                type="button"
                onClick={() => setShowNegotiate((v) => !v)}
                className="w-full py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F2942] text-xs font-bold inline-flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4" />
                Negociar valores
              </button>

              {showNegotiate && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-amber-950 mb-1">
                      Desconto desejado (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={requestedDiscount}
                      onChange={(e) => setRequestedDiscount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-950 mb-1">
                      Pedido de desconto / ajuste
                    </label>
                    <textarea
                      rows={2}
                      value={negotiationNote}
                      onChange={(e) => setNegotiationNote(e.target.value)}
                      placeholder="Ex.: Sou cliente recorrente, consigo 12% para pagamento via PIX?"
                      className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => negotiateQuoteByClient(negotiationNote, requestedDiscount)}
                    className="w-full py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
                  >
                    Enviar pedido de negociação
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => refuseQuoteByClient('Cliente optou por não executar o reparo')}
                className="w-full py-2.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition"
              >
                <XCircle className="w-4 h-4" />
                Recusar orçamento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
