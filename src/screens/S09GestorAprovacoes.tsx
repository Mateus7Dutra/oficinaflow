import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Percent,
  ShoppingCart,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { formatBRL } from '../engine/stateMachine';

export const S09GestorAprovacoes: React.FC = () => {
  const { managerApprovals, managerStats, resolveManagerApproval } = useOficina();
  const [justification, setJustification] = useState('');

  const discountItems = managerApprovals.filter((a) => a.type === 'DESCONTO');
  const purchaseItems = managerApprovals.filter((a) => a.type === 'COMPRA');

  const handleDecision = (id: string, decision: 'Aprovado' | 'Reprovado') => {
    const ok = resolveManagerApproval(id, decision, justification);
    if (ok) setJustification('');
  };

  return (
    <div className="space-y-6">
      {/* Weekly KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Aprovações na semana</div>
            <div className="text-2xl font-bold text-[#16A34A] mt-0.5">{managerStats.approvals}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A]">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Reprovações / Mantidos</div>
            <div className="text-2xl font-bold text-[#DC2626] mt-0.5">{managerStats.rejections}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#DC2626]">
            <ThumbsDown className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Tempo médio de resposta</div>
            <div className="text-2xl font-bold text-[#0F2942] mt-0.5">
              {managerStats.avgResponseHours}h
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59E0B]">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Approval Queues */}
        <div className="xl:col-span-8 space-y-6">
          {/* Queue 1: Desconto > 10% */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-sm font-bold text-[#0F2942] uppercase tracking-wide">
                Desconto acima da alçada (&gt; 10% · RN10)
              </h2>
            </div>

            {discountItems.map((item) => {
              const discountedTotal =
                (item.originalTotal || 0) * (1 - (item.discountPercent || 0) / 100);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#F59E0B]">
                        {item.refCode} · {item.osId}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F2942] mt-0.5">{item.title}</h3>
                      <p className="text-xs text-slate-500">
                        Solicitado por {item.requestedBy} em {item.requestedAt}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Pendente'
                          ? 'bg-amber-100 text-amber-900'
                          : item.status === 'Aprovado'
                          ? 'bg-green-100 text-[#16A34A]'
                          : 'bg-red-100 text-[#DC2626]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#F4F7FA]">
                      <div className="text-slate-500">Valor Original</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {formatBRL(item.originalTotal || 0)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F4F7FA]">
                      <div className="text-slate-500">Com {item.discountPercent}% desc.</div>
                      <div className="font-bold text-[#0F2942] mt-0.5">
                        {formatBRL(discountedTotal)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F4F7FA]">
                      <div className="text-slate-500">Margem Atual</div>
                      <div className="font-bold text-[#16A34A] mt-0.5">{item.currentMargin}%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-amber-800">Margem c/ Desconto</div>
                      <div className="font-bold text-amber-900 mt-0.5">{item.projectedMargin}%</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong>Histórico do cliente:</strong> {item.clientHistorySummary}
                  </div>

                  {item.status === 'Pendente' ? (
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDecision(item.id, 'Aprovado')}
                        className="px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar desconto
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(item.id, 'Reprovado')}
                        className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Manter valores
                      </button>
                    </div>
                  ) : (
                    item.justification && (
                      <div className="text-xs text-slate-600 italic">
                        Justificativa registrada: "{item.justification}"
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </section>

          {/* Queue 2: Compra > R$ 1.500,00 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-sm font-bold text-[#0F2942] uppercase tracking-wide">
                Compra acima da alçada (&gt; R$ 1.500,00 · RN14)
              </h2>
            </div>

            {purchaseItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#F59E0B]">
                      {item.refCode} · {item.osId}
                    </span>
                    <h3 className="text-sm font-bold text-[#0F2942] mt-0.5">{item.title}</h3>
                    <p className="text-xs text-slate-500">
                      Solicitado por {item.requestedBy} · Total:{' '}
                      <strong>{formatBRL(item.purchaseTotal || 0)}</strong>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Pendente'
                        ? 'bg-amber-100 text-amber-900'
                        : item.status === 'Aprovado'
                        ? 'bg-green-100 text-[#16A34A]'
                        : 'bg-red-100 text-[#DC2626]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {item.supplierComparison && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2">Fornecedor</th>
                          <th className="py-2">Preço</th>
                          <th className="py-2">Prazo</th>
                          <th className="py-2">Garantia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {item.supplierComparison.map((sup) => (
                          <tr
                            key={sup.supplier}
                            className={
                              sup.supplier === item.recommendedSupplier ? 'bg-green-50/60' : ''
                            }
                          >
                            <td className="py-2 font-semibold text-slate-800">
                              {sup.supplier}
                              {sup.supplier === item.recommendedSupplier && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-[#16A34A] text-white text-[10px]">
                                  Recomendado
                                </span>
                              )}
                            </td>
                            <td className="py-2 font-bold">{formatBRL(sup.price)}</td>
                            <td className="py-2">{sup.days} dia(s)</td>
                            <td className="py-2">{sup.warranty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {item.status === 'Pendente' ? (
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDecision(item.id, 'Aprovado')}
                      className="px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprovar compra
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(item.id, 'Reprovado')}
                      className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reprovar
                    </button>
                  </div>
                ) : (
                  item.justification && (
                    <div className="text-xs text-slate-600 italic">
                      Justificativa registrada: "{item.justification}"
                    </div>
                  )
                )}
              </div>
            ))}
          </section>
        </div>

        {/* Right: Decision Justification Panel */}
        <div className="xl:col-span-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3 sticky top-24">
            <h2 className="text-base font-bold text-[#0F2942]">Justificativa da Decisão</h2>
            <p className="text-xs text-slate-500">
              Campo <strong>obrigatório</strong> ao reprovar uma compra ou manter valores do
              orçamento. Registrado na Trilha de Auditoria.
            </p>
            <textarea
              rows={5}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Digite aqui a justificativa executiva (ex.: Margem abaixo do piso mínimo de 28% ou fornecedor homologado com melhor garantia)..."
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
            />
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 text-[11px] text-slate-600">
              Todas as decisões de alçada (RN10 e RN14) atualizam automaticamente a tela do
              Atendente, Compras e Fornecedor.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
