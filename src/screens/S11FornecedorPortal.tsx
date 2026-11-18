import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, RefreshCw, Send, Truck, XCircle } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { formatBRL } from '../engine/stateMachine';

export const S11FornecedorPortal: React.FC = () => {
  const {
    purchaseOrder,
    supplierSendQuote,
    supplierDeclineQuote,
    supplierDispatchOrder,
    supplierResendCorrectPart,
  } = useOficina();

  const [price, setPrice] = useState<number>(2340);
  const [leadDays, setLeadDays] = useState<number>(2);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [nfeFile, setNfeFile] = useState<string>(
    purchaseOrder.nfeFile || 'NFe_2026_088_AutoPecasCapixaba.xml'
  );
  const [trackingCode, setTrackingCode] = useState<string>(
    purchaseOrder.trackingCode || 'BR849201944EX'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Pedido de Cotação */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#F59E0B]">
              {purchaseOrder.quoteCode}
            </span>
            <h2 className="text-base font-bold text-[#0F2942]">Pedido de Cotação</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800">
            OficinaFlow · Matriz
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#F4F7FA] border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-800">{purchaseOrder.partSummary}</div>
          <div className="text-slate-600">
            Referência OS: <strong>{purchaseOrder.osId}</strong> · Itens: 2x Sensor ABS OEM Civic
            18 + 2x Par de discos ventilados 282mm
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preço Total (R$)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prazo (dias)
            </label>
            <input
              type="number"
              min={1}
              value={leadDays}
              onChange={(e) => setLeadDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Garantia (meses)
            </label>
            <input
              type="number"
              min={3}
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => supplierSendQuote(price, leadDays, warrantyMonths)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#F59E0B]" />
            Enviar cotação ({formatBRL(price)})
          </button>
          <button
            type="button"
            onClick={supplierDeclineQuote}
            className="py-2.5 px-4 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Não tenho as peças
          </button>
        </div>
      </div>

      {/* Right: Pedido de Compra Aprovado + Troca */}
      <div className="lg:col-span-6 space-y-5">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-[#F59E0B]">{purchaseOrder.id}</span>
              <h2 className="text-base font-bold text-[#0F2942]">Pedido de Compra Aprovado</h2>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                purchaseOrder.approvalStatus === 'Aprovada' ||
                purchaseOrder.approvalStatus === 'Não requerida'
                  ? 'bg-green-100 text-[#16A34A]'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              Alçada: {purchaseOrder.approvalStatus}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anexo de NF-e (XML / PDF)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nfeFile}
                  onChange={(e) => setNfeFile(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
                <label className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5" />
                  XML/PDF
                  <input
                    type="file"
                    accept=".xml,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setNfeFile(f.name);
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de Rastreio / Transportadora
              </label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => supplierDispatchOrder(nfeFile, trackingCode)}
              className="w-full py-2.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Informar despacho
            </button>
          </div>
        </div>

        {/* Alerta de Troca Aberta */}
        {purchaseOrder.exchangeOpen ? (
          <div className="bg-red-50 rounded-xl border border-red-300 p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  Solicitação de Troca Aberta (RN16)
                </h3>
                <p className="text-xs text-red-900 mt-1">
                  Divergência apontada na conferência de NF-e: <strong>DSC-CIV18-VNT</strong> —
                  enviado disco 262mm em vez de 282mm.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={supplierResendCorrectPart}
              className="w-full py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F2942] text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reenviar peça correta
            </button>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-xs text-green-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Nenhuma solicitação de troca pendente. Peça correta reenviada e conforme!</span>
          </div>
        )}
      </div>
    </div>
  );
};
