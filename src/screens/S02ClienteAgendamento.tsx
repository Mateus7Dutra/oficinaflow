import React, { useState } from 'react';
import { Bell, Calendar, Car, Check, Clock, PlusCircle, X } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';

const SERVICE_OPTIONS = [
  'Revisão 40 mil km',
  'Freios',
  'Suspensão',
  'Elétrica',
  'Diagnóstico',
  'Outro',
];

const TIME_SLOTS = ['08:00', '09:00', '13:30', '15:00'];

export const S02ClienteAgendamento: React.FC = () => {
  const { appointments, vehicles, currentUser, createAppointment, respondProposedAppointment } =
    useOficina();

  const clientVehicles = vehicles.filter((v) => v.clientEmail === currentUser.email);
  const [selectedVehicle, setSelectedVehicle] = useState(
    clientVehicles[0]
      ? `${clientVehicles[0].model} · ${clientVehicles[0].plate}`
      : 'Honda Civic 2018 · RTA-4F21'
  );
  const [serviceType, setServiceType] = useState('Revisão 40 mil km');
  const [preferredDate, setPreferredDate] = useState('Sex 20/11');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const myAppointments = appointments.filter((a) => a.clientEmail === currentUser.email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plate = selectedVehicle.split('·')[1]?.trim() || 'RTA-4F21';
    const ok = createAppointment({
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      vehicleLabel: selectedVehicle,
      plate,
      serviceType,
      date: preferredDate,
      time: preferredTime,
      box: null,
      notes: notes || 'Solicitação via Portal do Cliente.',
    });
    if (ok) setNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: New Appointment Form */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[#0F2942]">Solicitar Novo Agendamento</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocolo único (RN02) e lembrete automático 24h antes (RN03).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0F2942]/10 text-[#0F2942]">
            P1 · Agendamento
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Veículo cadastrado
            </label>
            <div className="relative">
              <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942] bg-white"
              >
                {clientVehicles.map((v) => {
                  const label = `${v.model} · ${v.plate}`;
                  return (
                    <option key={v.id} value={label}>
                      {label} ({v.mileage.toLocaleString('pt-BR')} km)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de serviço
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_OPTIONS.map((srv) => (
                <button
                  key={srv}
                  type="button"
                  onClick={() => setServiceType(srv)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                    serviceType === srv
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {srv}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Data preferida
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942] bg-white"
                >
                  <option value="Qui 19/11">Qui 19/11</option>
                  <option value="Sex 20/11">Sex 20/11</option>
                  <option value="Seg 23/11">Seg 23/11</option>
                  <option value="Ter 24/11">Ter 24/11</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Horário preferido
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPreferredTime(slot)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition ${
                      preferredTime === slot
                        ? 'bg-[#F59E0B] text-[#0F2942] border-[#F59E0B]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observações ou sintomas percebidos
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Barulho ao frear em baixa velocidade, luz do ABS acendendo..."
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-sm font-semibold transition inline-flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
            Solicitar agendamento
          </button>
        </form>
      </div>

      {/* Right: My Appointments */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0F2942]">Meus Agendamentos</h2>
            <span className="text-xs font-semibold text-slate-500">
              {myAppointments.length} protocolo(s)
            </span>
          </div>

          <div className="space-y-3.5">
            {myAppointments.map((app) => {
              const isProposed = app.status === 'Proposta de nova data';
              const isConfirmed = app.status === 'Confirmado';
              const isRefused = app.status === 'Recusado';

              return (
                <div
                  key={app.id}
                  className={`rounded-xl border p-4 transition ${
                    isProposed
                      ? 'border-[#F59E0B] bg-amber-50/40'
                      : isRefused
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F2942]">{app.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isConfirmed
                          ? 'bg-green-100 text-[#16A34A]'
                          : isProposed
                          ? 'bg-[#F59E0B] text-white'
                          : isRefused
                          ? 'bg-red-100 text-[#DC2626]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-slate-800">{app.serviceType}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{app.vehicleLabel}</div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {app.date} às {app.time}
                    </span>
                    {app.box && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                        Box {app.box}
                      </span>
                    )}
                  </div>

                  {app.reminder24h && isConfirmed && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#16A34A] bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                      <Bell className="w-3.5 h-3.5 shrink-0" />
                      <span>Lembrete automático agendado 24h antes (RN03)</span>
                    </div>
                  )}

                  {isProposed && (
                    <div className="mt-3 pt-3 border-t border-amber-200 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <Clock className="w-4 h-4 text-[#F59E0B]" />
                        <span>
                          Nova data proposta: {app.proposedDate} às {app.proposedTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respondProposedAppointment(app.id, true)}
                          className="flex-1 py-2 px-3 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aceitar nova data
                        </button>
                        <button
                          onClick={() => respondProposedAppointment(app.id, false)}
                          className="flex-1 py-2 px-3 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          Recusar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
