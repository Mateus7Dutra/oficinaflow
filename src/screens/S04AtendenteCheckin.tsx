import React, { useState } from 'react';
import { Camera, CheckCircle2, FileText, Save, Send, Trash2, Upload } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import type { EntryChecklist } from '../types/oficina';

export const S04AtendenteCheckin: React.FC = () => {
  const { os, updateInspection, addDamage, removeDamage, issueReceptionTerm, addToast } =
    useOficina();
  const [step, setStep] = useState<1 | 2 | 3>(2);
  const [damageLoc, setDamageLoc] = useState('');
  const [damageDesc, setDamageDesc] = useState('');
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');

  const handleDiagramClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingPoint({ x, y });
    const zone =
      y < 30 ? 'Dianteira' : y > 70 ? 'Traseira' : x < 45 ? 'Lateral esquerda' : 'Lateral direita';
    setDamageLoc(zone);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSimulatePhoto = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#0F2942"/><text x="160" y="95" text-anchor="middle" fill="#F59E0B" font-family="sans-serif" font-size="14" font-weight="bold">Foto Vistoria · ${damageLoc || 'Avaria'}</text><text x="160" y="120" text-anchor="middle" fill="#CBD5E1" font-family="sans-serif" font-size="11">Evidência obrigatória RN05</text></svg>`;
    setPhotoPreview(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    setPhotoName(`foto_avaria_${Date.now().toString().slice(-4)}.jpg`);
  };

  const handleAddDamage = () => {
    if (!damageLoc.trim() || !damageDesc.trim()) {
      addToast({ type: 'warning', title: 'Informe local e descrição da avaria.' });
      return;
    }
    if (!photoPreview) {
      addToast({
        type: 'error',
        title: 'Bloqueio RN05 · Foto obrigatória',
        description: 'Toda avaria registrada precisa de foto anexada.',
      });
      return;
    }
    addDamage({
      location: damageLoc,
      description: damageDesc,
      x: pendingPoint?.x ?? 50,
      y: pendingPoint?.y ?? 50,
      photoDataUrl: photoPreview,
      photoName,
    });
    setDamageLoc('');
    setDamageDesc('');
    setPendingPoint(null);
    setPhotoPreview('');
    setPhotoName('');
  };

  const toggleChecklist = (key: keyof EntryChecklist) => {
    updateInspection({
      checklist: { ...os.inspection.checklist, [key]: !os.inspection.checklist[key] },
    });
  };

  const checklistLabels: { key: keyof EntryChecklist; label: string }[] = [
    { key: 'crlv', label: 'CRLV / Documento do veículo conferido' },
    { key: 'clientDoc', label: 'Documento de identificação do cliente conferido' },
    { key: 'noCriticalDashLights', label: 'Painel sem luzes críticas acesas' },
    { key: 'spareTireJack', label: 'Estepe, macaco e chave de roda presentes' },
    { key: 'valuablesRemoved', label: 'Objetos de valor retirados pelo cliente' },
  ];

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {[
            { num: 1 as const, label: '1 · Documentos' },
            { num: 2 as const, label: '2 · Vistoria' },
            { num: 3 as const, label: '3 · Termo de recebimento' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                step === s.num
                  ? 'bg-[#0F2942] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-600">
          <span className="font-mono font-bold text-[#0F2942]">{os.id}</span> · {os.vehicleModel} (
          {os.plate}) · {os.clientName}
        </div>
      </div>

      {os.state === 'TERMO_CONTESTADO' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
          <strong>Atenção (RN06 · Termo Contestado):</strong> O cliente contestou o checklist:{' '}
          <em>"{os.inspection.clientDisputeComment}"</em>. Ajuste os itens abaixo e clique em{' '}
          <strong>Emitir termo e enviar ao cliente</strong>.
        </div>
      )}

      {/* Step 1: Documentos e dados de entrada */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[#0F2942]">Dados de Entrada e Documentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quilometragem (km)
              </label>
              <input
                type="number"
                value={os.inspection.mileage}
                onChange={(e) => updateInspection({ mileage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nível de Combustível
              </label>
              <select
                value={os.inspection.fuelLevel}
                onChange={(e) =>
                  updateInspection({
                    fuelLevel: e.target.value as typeof os.inspection.fuelLevel,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {['Reserva', '1/4', '1/2', '3/4', 'Cheio'].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade de Chaves
              </label>
              <input
                type="number"
                min={1}
                max={3}
                value={os.inspection.keysCount}
                onChange={(e) => updateInspection({ keysCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Checklist de Entrada
            </h3>
            <div className="space-y-2">
              {checklistLabels.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={os.inspection.checklist[c.key]}
                    onChange={() => toggleChecklist(c.key)}
                    className="rounded border-slate-300 text-[#0F2942]"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
            >
              Avançar para Vistoria →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vistoria + Diagrama interativo */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Car Interactive Diagram */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#0F2942]">Diagrama Interativo do Veículo</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Clique sobre a silhueta do veículo para marcar um novo ponto de avaria.
            </p>
            <div className="bg-[#F4F7FA] rounded-xl p-4 border border-slate-200 flex justify-center">
              <svg
                viewBox="0 0 220 340"
                onClick={handleDiagramClick}
                className="w-56 h-80 cursor-crosshair select-none touch-manipulation"
              >
                {/* Car silhouette top-down */}
                <rect
                  x="40"
                  y="20"
                  width="140"
                  height="300"
                  rx="42"
                  fill="#FFFFFF"
                  stroke="#0F2942"
                  strokeWidth="3"
                />
                {/* Windshield & rear glass */}
                <path d="M58 85 Q110 65 162 85 L154 125 L66 125 Z" fill="#E2E8F0" stroke="#94A3B8" />
                <path d="M66 215 L154 215 L162 255 Q110 272 58 255 Z" fill="#E2E8F0" stroke="#94A3B8" />
                {/* Roof */}
                <rect x="66" y="128" width="88" height="84" rx="12" fill="#F8FAFC" stroke="#CBD5E1" />
                {/* Wheels */}
                <rect x="28" y="65" width="12" height="44" rx="4" fill="#334155" />
                <rect x="180" y="65" width="12" height="44" rx="4" fill="#334155" />
                <rect x="28" y="230" width="12" height="44" rx="4" fill="#334155" />
                <rect x="180" y="230" width="12" height="44" rx="4" fill="#334155" />
                <text x="110" y="14" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">
                  FRENTE
                </text>
                <text x="110" y="336" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">
                  TRASEIRA
                </text>

                {/* Existing damages */}
                {os.inspection.damages.map((d) => (
                  <g key={d.id}>
                    <circle
                      cx={(d.x / 100) * 220}
                      cy={(d.y / 100) * 340}
                      r="12"
                      fill="#DC2626"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={(d.x / 100) * 220}
                      y={(d.y / 100) * 340 + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#FFFFFF"
                    >
                      {d.number}
                    </text>
                  </g>
                ))}

                {/* Pending clicked marker */}
                {pendingPoint && (
                  <circle
                    cx={(pendingPoint.x / 100) * 220}
                    cy={(pendingPoint.y / 100) * 340}
                    r="11"
                    fill="#F59E0B"
                    stroke="#0F2942"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Right: Damage List + Add New */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-[#0F2942]">
                Registrar Nova Avaria (Foto Obrigatória · RN05)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Local (ex: Porta dianteira direita)"
                  value={damageLoc}
                  onChange={(e) => setDamageLoc(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  placeholder="Descrição da avaria"
                  value={damageDesc}
                  onChange={(e) => setDamageDesc(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Anexar foto
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleSimulatePhoto}
                  className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capturar foto (demo)
                </button>
                {photoName && (
                  <span className="text-xs text-[#16A34A] font-medium">✓ {photoName}</span>
                )}
                <button
                  type="button"
                  onClick={handleAddDamage}
                  className="ml-auto px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#1A3A5C]"
                >
                  + Adicionar avaria
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#0F2942]">
                  Avarias Registradas ({os.inspection.damages.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-[#0F2942] hover:underline"
                >
                  Ir para Termo de Recebimento →
                </button>
              </div>

              <div className="space-y-3">
                {os.inspection.damages.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-[#F4F7FA]/50 overflow-hidden"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#DC2626] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {d.number}
                    </span>
                    <img
                      src={d.photoDataUrl}
                      alt={d.location}
                      className="w-16 sm:w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{d.location}</div>
                      <div className="text-xs text-slate-600 truncate">{d.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {d.photoName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDamage(d.id)}
                      className="p-1.5 text-slate-400 hover:text-[#DC2626]"
                      title="Remover avaria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Termo de Recebimento */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#F59E0B]" />
              <div>
                <h2 className="text-base font-bold text-[#0F2942]">
                  Resumo do Termo de Recebimento (RN04)
                </h2>
                <p className="text-xs text-slate-500">
                  Nenhuma OS pode ser aberta sem assinatura eletrônica do cliente neste termo.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              Revisão #{os.inspection.revisionCount}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
              <div className="text-slate-500">Quilometragem</div>
              <div className="font-bold text-slate-800 mt-0.5">
                {os.inspection.mileage.toLocaleString('pt-BR')} km
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
              <div className="text-slate-500">Combustível</div>
              <div className="font-bold text-slate-800 mt-0.5">{os.inspection.fuelLevel}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
              <div className="text-slate-500">Chaves</div>
              <div className="font-bold text-slate-800 mt-0.5">{os.inspection.keysCount} un.</div>
            </div>
            <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200">
              <div className="text-slate-500">Avarias com Foto</div>
              <div className="font-bold text-[#16A34A] mt-0.5 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {os.inspection.damages.length} registrada(s)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => issueReceptionTerm()}
              className="px-5 py-2.5 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold inline-flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4 text-[#F59E0B]" />
              Emitir termo e enviar ao cliente
            </button>
            <button
              type="button"
              onClick={() =>
                addToast({
                  type: 'info',
                  title: 'Rascunho da vistoria salvo',
                  description: 'Os dados de check-in foram preservados localmente.',
                })
              }
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Salvar rascunho
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
