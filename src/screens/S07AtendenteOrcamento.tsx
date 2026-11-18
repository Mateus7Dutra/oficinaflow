import React, { useState } from 'react';
import { AlertTriangle, FileDown, Plus, ShieldCheck } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { calculateOSTotals, formatBRL, requiresManagerDiscountApproval } from '../engine/stateMachine';

export const S07AtendenteOrcamento: React.FC = () => {
  const { os, addServiceItem, addPartItem, emitQuote } = useOficina();
  const [discountPercent, setDiscountPercent] = useState<number>(os.quote.discountPercent || 0);
  const [deliveryEstimate, setDeliveryEstimate] = useState<string>(os.quote.deliveryEstimate);
  const [showAddSrv, setShowAddSrv] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [srvDesc, setSrvDesc] = useState('');
  const [srvHours, setSrvHours] = useState(1);
  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState(150);

  const totals = calculateOSTotals(os);
  const needsManager = requiresManagerDiscountApproval(discountPercent);
  const simulatedDiscount = (totals.quoteSubtotal * discountPercent) / 100;
  const simulatedNet = totals.quoteSubtotal - simulatedDiscount;
  const baseServices = os.services.filter((s) => !s.isAdditional);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left: Items table */}
      <div className="xl:col-span-8 space-y-5">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0F2942]">
                Orçamento {os.quote.code} · {os.id}
              </h2>
              <p className="text-xs text-slate-500">
                Itens puxados automaticamente do diagnóstico técnico ({os.vehicleModel} · {os.plate})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddSrv((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F2942] inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Serviço
              </button>
              <button
                type="button"
                onClick={() => setShowAddPart((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F2942] inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Peça
              </button>
            </div>
          </div>

          {showAddSrv && (
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 flex flex-wrap gap-2">
              <input
                placeholder="Descrição do serviço"
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="number"
                step="0.5"
                value={srvHours}
                onChange={(e) => setSrvHours(Number(e.target.value))}
                className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!srvDesc.trim()) return;
                  addServiceItem({ description: srvDesc, hours: srvHours, hourlyRate: 95 });
                  setSrvDesc('');
                  setShowAddSrv(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
              >
                Incluir
              </button>
            </div>
          )}

          {showAddPart && (
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 flex flex-wrap gap-2">
              <input
                placeholder="Nome da peça"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="number"
                value={partPrice}
                onChange={(e) => setPartPrice(Number(e.target.value))}
                className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!partName.trim()) return;
                  addPartItem({
                    code: `PEC-${Date.now().toString().slice(-4)}`,
                    name: partName,
                    qty: 1,
                    unitPrice: partPrice,
                    stockStatus: 'Em estoque',
                    leadTimeDays: 0,
                    reservedQty: 1,
                  });
                  setPartName('');
                  setShowAddPart(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
              >
                Incluir
              </button>
            </div>
          )}

          {/* Mão de obra */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Mão de Obra ({totals.totalEstimatedHours.toFixed(1)}h · R$ 95,00/h)
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {baseServices.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 font-medium text-slate-800">{s.description}</td>
                    <td className="py-2.5 text-slate-500 font-mono">{s.hours.toFixed(1)}h</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {formatBRL(s.hours * s.hourlyRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Peças */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Peças e Disponibilidade (RN07)
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {os.parts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{p.code}</div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.stockStatus === 'Em estoque'
                            ? 'bg-green-100 text-[#16A34A]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.stockStatus === 'Em estoque'
                          ? 'Em estoque'
                          : `Sob encomenda · ${p.leadTimeDays} dias`}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {formatBRL(p.qty * p.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right: Financial Summary & Emit */}
      <div className="xl:col-span-4 space-y-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0F2942]">Resumo Financeiro</h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Mão de obra</span>
              <span className="font-semibold">{formatBRL(totals.laborTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Peças</span>
              <span className="font-semibold">{formatBRL(totals.partsTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-semibold pt-2 border-t border-slate-100">
              <span>Subtotal</span>
              <span>{formatBRL(totals.quoteSubtotal)}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Desconto comercial (%) — Alçada Atendente: até 10%
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            {needsManager ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-[#F59E0B] text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span>
                  <strong>Alçada RN10:</strong> Desconto de {discountPercent}% excede 10%. O
                  orçamento será encaminhado ao Gestor (S09) antes do envio ao cliente.
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-[11px] text-green-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>Dentro da alçada do Atendente (≤ 10%).</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Prazo de entrega</label>
            <input
              type="text"
              value={deliveryEstimate}
              onChange={(e) => setDeliveryEstimate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <div className="text-[11px] text-slate-500">
              Validade automática: <strong>5 dias corridos (RN09)</strong> · Garantia:{' '}
              <strong>90 dias</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F2942] text-white flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-300">Valor Final do Orçamento</div>
              {discountPercent > 0 && (
                <div className="text-[11px] text-[#F59E0B]">
                  Desconto {discountPercent}% (-{formatBRL(simulatedDiscount)})
                </div>
              )}
            </div>
            <div className="text-xl font-bold">{formatBRL(simulatedNet)}</div>
          </div>

          <button
            type="button"
            onClick={() => emitQuote(discountPercent, deliveryEstimate)}
            className="w-full py-2.5 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition"
          >
            <FileDown className="w-4 h-4 text-[#F59E0B]" />
            Emitir PDF e enviar ao cliente
          </button>
        </div>
      </div>
    </div>
  );
};
