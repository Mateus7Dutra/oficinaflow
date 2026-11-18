import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Package,
  RefreshCw,
  Send,
  ShoppingBag,
} from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { formatBRL, requiresManagerPurchaseApproval } from '../engine/stateMachine';

export const S10ComprasCotacoes: React.FC = () => {
  const {
    os,
    purchaseOrder,
    requestSupplierQuotes,
    selectSupplierQuote,
    submitPurchaseOrder,
    requestPartExchange,
    confirmPartReceiptAndReserve,
  } = useOficina();

  const receivedQuotes = purchaseOrder.supplierQuotes.filter((q) => q.status === 'Recebida');
  const minPrice = Math.min(...receivedQuotes.map((q) => q.unitPriceTotal));
  const minDays = Math.min(...receivedQuotes.map((q) => q.leadTimeDays));
  const overThreshold = requiresManagerPurchaseApproval(purchaseOrder.totalValue);

  return (
    <div className="space-y-6">
      {/* Panel 1: Estoque da OS */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h2 className="text-base font-bold text-[#0F2942]">Estoque da OS · {os.id}</h2>
              <p className="text-xs text-slate-500">
                Peças disponíveis são reservadas automaticamente; itens faltantes seguem para cotação.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestSupplierQuotes}
            className="px-4 py-2 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#F59E0B]" />
            Solicitar cotações a fornecedores
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {os.parts.map((p) => {
            const reserved = p.reservedQty >= p.qty;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border text-xs ${
                  reserved
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-amber-300 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-500">{p.code}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      reserved ? 'bg-green-100 text-[#16A34A]' : 'bg-[#F59E0B] text-[#0F2942]'
                    }`}
                  >
                    {reserved ? 'Reservada p/ OS' : 'Faltante · Comprar'}
                  </span>
                </div>
                <div className="font-bold text-slate-800 mt-1.5">{p.name}</div>
                <div className="text-slate-600 mt-1">
                  Qtd: {p.qty} · Reservada: {p.reservedQty}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel 2: Mapa Comparativo */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-xs font-bold text-[#F59E0B]">
              {purchaseOrder.quoteCode} · {purchaseOrder.id}
            </span>
            <h2 className="text-base font-bold text-[#0F2942]">Mapa Comparativo de Fornecedores</h2>
            <p className="text-xs text-slate-500">{purchaseOrder.partSummary}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Status: {purchaseOrder.orderStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {purchaseOrder.supplierQuotes.map((q) => {
            const isCheapest = q.unitPriceTotal === minPrice && q.status === 'Recebida';
            const isFastest = q.leadTimeDays === minDays && q.status === 'Recebida';
            return (
              <div
                key={q.id}
                onClick={() => q.status === 'Recebida' && selectSupplierQuote(q.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition space-y-2.5 ${
                  q.selected
                    ? 'border-[#0F2942] bg-[#0F2942]/[0.03] shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[#0F2942]">{q.supplierName}</div>
                  {q.selected && (
                    <span className="px-2 py-0.5 rounded bg-[#0F2942] text-white text-[10px] font-bold">
                      Selecionado
                    </span>
                  )}
                </div>

                {q.status === 'Sem estoque' ? (
                  <div className="text-xs font-semibold text-[#DC2626]">
                    Sem estoque informado pelo fornecedor
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        {formatBRL(q.unitPriceTotal)}
                      </span>
                      {isCheapest && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-[#16A34A] text-[10px] font-bold">
                          Menor preço
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Prazo: <strong>{q.leadTimeDays} dia(s)</strong>
                      </span>
                      {isFastest && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                          Menor prazo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Garantia: <strong>{q.warrantyMonths} meses</strong>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {overThreshold && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-[#F59E0B] text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <span>
              <strong>Alçada RN14:</strong> Valor acima de R$ 1.500,00 (
              {formatBRL(purchaseOrder.totalValue)}): o pedido segue ao Gestor para aprovação antes
              de ser emitido.
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => submitPurchaseOrder()}
            className="px-5 py-2.5 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-[#F59E0B]" />
            {overThreshold ? 'Enviar pedido à alçada do Gestor' : 'Emitir pedido ao fornecedor'}
          </button>
        </div>
      </div>

      {/* Panel 3: Recebimento · Conferência de NF-e */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#16A34A]" />
          <div>
            <h2 className="text-base font-bold text-[#0F2942]">
              Recebimento · Conferência de NF-e (RN15–RN17)
            </h2>
            <p className="text-xs text-slate-500">
              Nenhuma peça entra no estoque sem conferência. Itens conformes são reservados à OS de
              origem.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <th className="py-2">Peça / Código</th>
                <th className="py-2 text-center">Pedida</th>
                <th className="py-2 text-center">Recebida</th>
                <th className="py-2">Status Conferência</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrder.nfeItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <div className="font-semibold text-slate-800">{item.partName}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {item.partCode} · {item.osId}
                    </div>
                  </td>
                  <td className="py-3 text-center font-semibold">{item.orderedQty}</td>
                  <td className="py-3 text-center font-semibold">{item.receivedQty}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'Conforme' || item.status === 'Entrada confirmada'
                          ? 'bg-green-100 text-[#16A34A]'
                          : item.status === 'Modelo divergente'
                          ? 'bg-red-100 text-[#DC2626]'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      {item.status !== 'Entrada confirmada' && (
                        <>
                          {item.status === 'Modelo divergente' && (
                            <button
                              type="button"
                              onClick={() => requestPartExchange(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Solicitar troca ao fornecedor
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => confirmPartReceiptAndReserve(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Dar entrada e reservar para a OS
                          </button>
                        </>
                      )}
                      {item.status === 'Entrada confirmada' && (
                        <span className="text-[11px] font-semibold text-[#16A34A]">
                          ✓ Reservado p/ {item.osId}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
