import React, { useState } from 'react';
import { AlertOctagon, Camera, CheckCircle2, Cpu, Plus, Trash2 } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { formatBRL } from '../engine/stateMachine';

const OBD_OPTIONS = [
  'Nenhum código ativo',
  'C1234 · Sensor ABS dianteiro',
  'P0300 · Falha múltipla de ignição',
  'P0420 · Eficiência catalisador',
  'C0035 · Circuito sensor velocidade roda',
];

export const S06MecanicoDiagnostico: React.FC = () => {
  const {
    os,
    updateDiagnosis,
    addServiceItem,
    removeServiceItem,
    addPartItem,
    removePartItem,
    completeDiagnosis,
    markDiagnosisInconclusive,
  } = useOficina();

  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvHours, setNewSrvHours] = useState(0.5);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartPrice, setNewPartPrice] = useState(120);
  const [showInconclusive, setShowInconclusive] = useState(false);
  const [inconclusiveReason, setInconclusiveReason] = useState('');

  const baseServices = os.services.filter((s) => !s.isAdditional);
  const totalHours = baseServices.reduce((sum, s) => sum + s.hours, 0);

  const toggleObd = (code: string) => {
    if (code === 'Nenhum código ativo') {
      updateDiagnosis({ obdCodes: ['Nenhum código ativo'] });
      return;
    }
    const clean = os.diagnosis.obdCodes.filter((c) => c !== 'Nenhum código ativo');
    const exists = clean.includes(code);
    const next = exists ? clean.filter((c) => c !== code) : [...clean, code];
    updateDiagnosis({ obdCodes: next.length ? next : ['Nenhum código ativo'] });
  };

  const handleAddService = () => {
    if (!newSrvDesc.trim()) return;
    addServiceItem({
      description: newSrvDesc,
      hours: newSrvHours,
      hourlyRate: 95,
      done: false,
      workedHours: 0,
    });
    setNewSrvDesc('');
    setNewSrvHours(0.5);
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    addPartItem({
      code: newPartCode || `PEC-${Date.now().toString().slice(-4)}`,
      name: newPartName,
      qty: 1,
      unitPrice: newPartPrice,
      stockStatus: 'Em estoque',
      leadTimeDays: 0,
      reservedQty: 1,
    });
    setNewPartName('');
    setNewPartCode('');
    setNewPartPrice(120);
  };

  return (
    <div className="space-y-5">
      {/* OS Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#0F2942]">{os.id}</span>
            <span className="px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#0F2942] text-xs font-bold">
              Box {os.box}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800 mt-1">
            {os.vehicleModel} · Placa {os.plate} · {os.inspection.mileage.toLocaleString('pt-BR')} km
          </div>
          <div className="text-xs text-slate-600 mt-1">
            <strong>Queixa do cliente:</strong> "{os.complaint}"
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Horas Estimadas
          </div>
          <div className="text-2xl font-bold text-[#0F2942]">{totalHours.toFixed(1)}h</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: OBD + Findings + Photos */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-sm font-bold text-[#0F2942]">Códigos do Scanner OBD-II</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {OBD_OPTIONS.map((code) => {
                const active = os.diagnosis.obdCodes.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleObd(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition text-left ${
                      active
                        ? 'bg-[#0F2942] text-white border-[#0F2942]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Achados Técnicos
              </label>
              <textarea
                rows={4}
                value={os.diagnosis.findings}
                onChange={(e) => updateDiagnosis({ findings: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
              />
            </div>
          </div>

          {/* Evidence Photos */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F2942] inline-flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#F59E0B]" />
                Evidências Fotográficas ({os.diagnosis.photos.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {os.diagnosis.photos.map((ph) => (
                <div key={ph.id} className="rounded-lg border border-slate-200 overflow-hidden">
                  <img src={ph.dataUrl} alt={ph.label} className="w-full h-24 object-cover" />
                  <div className="p-2 text-[11px] font-medium text-slate-700 truncate">
                    {ph.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Services + Parts + Actions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Services */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F2942]">Serviços Necessários (Mão de Obra)</h2>
              <span className="text-xs font-bold text-[#0F2942]">Total: {totalHours.toFixed(1)}h</span>
            </div>

            <div className="divide-y divide-slate-100">
              {baseServices.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-800">{s.description}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold">
                      {s.hours.toFixed(1)}h
                    </span>
                    <button
                      type="button"
                      onClick={() => removeServiceItem(s.id)}
                      className="text-slate-400 hover:text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <input
                placeholder="Novo serviço técnico..."
                value={newSrvDesc}
                onChange={(e) => setNewSrvDesc(e.target.value)}
                className="flex-1 min-w-[180px] px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={newSrvHours}
                onChange={(e) => setNewSrvHours(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Parts */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-[#0F2942]">Peças Necessárias</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Código / Peça</th>
                    <th className="py-2">Qtd</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Unit.</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {os.parts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.code}</div>
                      </td>
                      <td className="py-2">{p.qty}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.stockStatus === 'Em estoque'
                              ? 'bg-green-100 text-[#16A34A]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.stockStatus === 'Em estoque'
                            ? 'Em estoque'
                            : `Sob encomenda · ${p.leadTimeDays}d`}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold">{formatBRL(p.unitPrice)}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removePartItem(p.id)}
                          className="text-slate-400 hover:text-[#DC2626]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <input
                placeholder="Nome da peça..."
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="flex-1 min-w-[160px] px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <input
                placeholder="Código"
                value={newPartCode}
                onChange={(e) => setNewPartCode(e.target.value)}
                className="w-28 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                value={newPartPrice}
                onChange={(e) => setNewPartPrice(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Peça
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => completeDiagnosis()}
                className="px-5 py-2.5 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Concluir diagnóstico (RN07)
              </button>
              <button
                type="button"
                onClick={() => setShowInconclusive((v) => !v)}
                className="px-4 py-2.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <AlertOctagon className="w-4 h-4" />
                Marcar como inconclusivo e recomendar encaminhamento
              </button>
            </div>

            {showInconclusive && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-2">
                <label className="block text-xs font-semibold text-red-900">
                  Motivo / Recomendação de encaminhamento (encerra OS sem reparo · RN08)
                </label>
                <input
                  value={inconclusiveReason}
                  onChange={(e) => setInconclusiveReason(e.target.value)}
                  placeholder="Ex.: Falha interna no módulo eletrônico ABS — encaminhar à concessionária."
                  className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => markDiagnosisInconclusive(inconclusiveReason)}
                  className="px-4 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-semibold"
                >
                  Confirmar encerramento sem reparo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
