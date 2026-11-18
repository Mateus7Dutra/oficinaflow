import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  KeyRound,
  QrCode,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { calculateOSTotals, formatBRL } from '../engine/stateMachine';
import type { PaymentData } from '../types/oficina';

export const S13CobrancaEntrega: React.FC = () => {
  const {
    currentRole,
    os,
    vehicles,
    processPayment,
    signDeliveryTermByClient,
    markServicesExplained,
    deliverVehicleAndCloseOS,
  } = useOficina();

  const [selectedMethod, setSelectedMethod] = useState<PaymentData['method']>(os.payment.method);
  const totals = calculateOSTotals(os);
  const vehicle = vehicles.find((v) => v.plate === os.plate);
  const isClientView = currentRole === 'cliente';

  return (
    <div className="space-y-6">
      {/* Quality Pending Notice (RN19) */}
      {os.quality.status !== 'Aprovado' && os.state !== 'ENCERRADA_CONCLUIDA' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-[#F59E0B] text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Atenção (RN19):</strong> O Controle de Qualidade desta OS ainda está pendente na
            tela <strong>S12 (Mecânico)</strong>. Aprove o checklist e registre o laudo final em S12
            para liberar a validação de pagamento e entrega.
          </span>
        </div>
      )}

      {/* Top Banner if Closed */}
      {os.state === 'ENCERRADA_CONCLUIDA' && (
        <div className="p-5 rounded-xl bg-green-50 border-2 border-[#16A34A] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />
            <div>
              <h2 className="text-base font-bold text-green-950">
                OS Encerrada e Veículo Entregue com Sucesso! (RN21)
              </h2>
              <p className="text-xs text-green-800">
                {os.delivery.nfeNumber} emitida em {os.delivery.closedAt} · Histórico do veículo{' '}
                {os.plate} atualizado.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#16A34A] text-white text-xs font-bold">
            Ciclo P1 → P6 Concluído
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Financial Summary & Payment Gateway */}
        <div className="xl:col-span-7 space-y-5">
          {/* Resumo da OS */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#F59E0B]">{os.id}</span>
                <h2 className="text-base font-bold text-[#0F2942]">
                  Resumo Financeiro da Cobrança
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {os.vehicleModel} · {os.plate}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">
                  Orçamento aprovado ({os.quote.code} · Mão de obra + Peças)
                </span>
                <span className="font-semibold text-slate-800">
                  {formatBRL(totals.approvedQuoteTotal)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">
                  Serviço adicional autorizado (Fluido de freio DOT4)
                </span>
                <span className="font-semibold text-slate-800">
                  + {formatBRL(totals.additionalTotal)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold text-[#0F2942]">
                <span>Valor Final</span>
                <span>{formatBRL(totals.finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F2942] inline-flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#F59E0B]" />
                {isClientView ? 'Pagamento Online (PIX ou Cartão)' : 'Gateway de Pagamento (RN20)'}
              </h2>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  os.payment.status === 'Validado'
                    ? 'bg-green-100 text-[#16A34A]'
                    : os.payment.status === 'Recusado'
                    ? 'bg-red-100 text-[#DC2626]'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {os.payment.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['PIX', 'Cartão de crédito', 'Débito'] as PaymentData['method'][]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition ${
                    selectedMethod === m
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {selectedMethod === 'PIX' && os.payment.status !== 'Validado' && (
              <div className="p-4 rounded-xl bg-[#F4F7FA] border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 bg-white rounded-xl border border-slate-300 flex flex-col items-center justify-center shrink-0 p-2">
                  <QrCode className="w-20 h-20 text-[#0F2942]" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-[#0F2942]">QR Code PIX · OficinaFlow</div>
                  <p className="text-slate-600">
                    Escaneie no app do seu banco ou clique abaixo para simular a validação imediata
                    no gateway de pagamento.
                  </p>
                  <div className="font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-500">
                    00020126360014BR.GOV.BCB.PIX...OFICINAFLOW
                  </div>
                </div>
              </div>
            )}

            {os.payment.status === 'Recusado' && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <strong>Pagamento recusado:</strong> {os.payment.failureReason}
                </div>
              </div>
            )}

            {os.payment.status === 'Validado' ? (
              <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-900 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  Pagamento validado via {os.payment.method} em {os.payment.paidAt}
                </span>
                <span className="font-mono text-[11px]">{os.payment.gatewayTransactionId}</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => processPayment(selectedMethod, false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold"
                >
                  {isClientView
                    ? `Pagar ${formatBRL(totals.finalTotal)} via ${selectedMethod}`
                    : `Validar pagamento (${selectedMethod})`}
                </button>
                {!isClientView && (
                  <button
                    type="button"
                    onClick={() => processPayment(selectedMethod, true)}
                    className="py-2.5 px-4 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold"
                  >
                    Solicitar nova forma de pagamento (simular recusa)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Delivery Checklist & Term / Closing */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="text-base font-bold text-[#0F2942]">
                {isClientView ? 'Conferência e Termo de Entrega' : 'Checklist de Entrega (RN21)'}
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
                <span>Controle de qualidade aprovado (RN19)</span>
                <span
                  className={`font-bold ${
                    os.quality.status === 'Aprovado' ? 'text-[#16A34A]' : 'text-amber-700'
                  }`}
                >
                  {os.quality.status === 'Aprovado' ? '✓ Aprovado' : 'Pendente'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
                <span>Pagamento validado no gateway (RN20)</span>
                <span
                  className={`font-bold ${
                    os.payment.status === 'Validado' ? 'text-[#16A34A]' : 'text-amber-700'
                  }`}
                >
                  {os.payment.status === 'Validado' ? '✓ Validado' : 'Pendente'}
                </span>
              </div>
              <label className="flex items-center justify-between p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 cursor-pointer">
                <span>Serviços executados e garantia (90d) explicados</span>
                <input
                  type="checkbox"
                  checked={os.delivery.servicesExplained}
                  onChange={(e) => markServicesExplained(e.target.checked)}
                  className="rounded border-slate-300 text-[#16A34A]"
                />
              </label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
                <span>Termo de Entrega assinado pelo cliente</span>
                <span
                  className={`font-bold ${
                    os.delivery.termSignedByClient ? 'text-[#16A34A]' : 'text-amber-700'
                  }`}
                >
                  {os.delivery.termSignedByClient ? '✓ Assinado' : 'Aguardando'}
                </span>
              </div>
            </div>

            {isClientView ? (
              <button
                type="button"
                onClick={() => signDeliveryTermByClient()}
                disabled={os.delivery.termSignedByClient}
                className="w-full py-3 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-4 h-4 text-[#F59E0B]" />
                {os.delivery.termSignedByClient
                  ? `Termo assinado em ${os.delivery.termSignedAt}`
                  : 'Conferir veículo e assinar Termo de Entrega'}
              </button>
            ) : (
              <div className="space-y-2.5 pt-1">
                {!os.delivery.termSignedByClient && (
                  <button
                    type="button"
                    onClick={() => signDeliveryTermByClient()}
                    className="w-full py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    Coletar assinatura eletrônica do cliente no balcão
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deliverVehicleAndCloseOS()}
                  className="w-full py-2.5 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-[#F59E0B]" />
                  Entregar veículo e chaves · Encerrar OS (NF-e + histórico)
                </button>
              </div>
            )}
          </div>

          {/* Histórico do Veículo */}
          {vehicle && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0F2942]" />
                <h3 className="text-sm font-bold text-[#0F2942]">
                  Histórico do Veículo ({vehicle.plate})
                </h3>
              </div>
              <div className="space-y-2">
                {vehicle.history.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-lg bg-[#F4F7FA] border border-slate-200 text-xs"
                  >
                    <div className="flex justify-between font-semibold text-[#0F2942]">
                      <span>
                        {h.osNumber} · {h.nfeNumber}
                      </span>
                      <span>{h.date}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{h.summary}</div>
                    <div className="text-slate-500 mt-0.5">
                      {h.mileage.toLocaleString('pt-BR')} km · {formatBRL(h.totalValue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
