import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, Plus, UserPlus, Zap } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import type { BoxNumber } from '../types/oficina';

const HOURS = ['08:00', '09:00', '10:30', '13:30', '15:00'];
const BOXES: BoxNumber[] = [1, 2, 3, 4];

export const S03AtendenteAgenda: React.FC = () => {
  const {
    appointments,
    vehicles,
    createAppointment,
    proposeAlternativeDate,
    reserveAppointmentSlot,
    startCheckinFromAppointment,
    registerClientVehicle,
  } = useOficina();

  const [selectedDay, setSelectedDay] = useState('Qui 19/11');
  const [selectedBox, setSelectedBox] = useState<BoxNumber>(2);
  const [selectedTime, setSelectedTime] = useState('13:30');
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [serviceType, setServiceType] = useState('Freios');
  const [altDate, setAltDate] = useState('Sex 20/11');
  const [altTime, setAltTime] = useState('14:00');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Modal state for new client/vehicle
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState(2022);
  const [newPlate, setNewPlate] = useState('');
  const [newMileage, setNewMileage] = useState(25000);

  const pendingRequest =
    appointments.find((a) => a.status === 'Aguardando confirmação' || a.status === 'Proposta de nova data') ||
    appointments[0];

  const slotOccupied = appointments.find(
    (a) => a.date === selectedDay && a.time === selectedTime && a.box === selectedBox && a.status !== 'Recusado'
  );

  const selectedVeh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleReserve = () => {
    if (pendingRequest && !pendingRequest.box) {
      reserveAppointmentSlot(pendingRequest.id, selectedBox, selectedDay, selectedTime);
    } else if (selectedVeh) {
      createAppointment({
        clientName: selectedVeh.clientName,
        clientEmail: selectedVeh.clientEmail,
        vehicleLabel: `${selectedVeh.model} · ${selectedVeh.plate}`,
        plate: selectedVeh.plate,
        serviceType,
        date: selectedDay,
        time: selectedTime,
        box: selectedBox,
        notes: 'Reserva confirmada pela recepção.',
      });
    }
  };

  const handleEncaixe = () => {
    if (!selectedVeh) return;
    // Busca primeiro box livre no dia/horário
    const freeBox = BOXES.find(
      (b) =>
        !appointments.some(
          (a) => a.date === selectedDay && a.time === selectedTime && a.box === b && a.status !== 'Recusado'
        )
    );
    createAppointment({
      clientName: selectedVeh.clientName,
      clientEmail: selectedVeh.clientEmail,
      vehicleLabel: `${selectedVeh.model} · ${selectedVeh.plate}`,
      plate: selectedVeh.plate,
      serviceType: `${serviceType} (Encaixe)`,
      date: selectedDay,
      time: selectedTime,
      box: freeBox || selectedBox,
      notes: 'Encaixe prioritário registrado pela recepção.',
      isEncaixe: true,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newModel || !newPlate) return;
    registerClientVehicle({
      clientName: newClientName,
      clientEmail: newClientEmail || 'cliente@email.com',
      model: newModel,
      year: newYear,
      plate: newPlate.toUpperCase(),
      mileage: newMileage,
    });
    setShowRegisterModal(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewModel('');
    setNewPlate('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left: 4-Box Schedule Grid */}
      <div className="xl:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F2942]">Grade Horária dos 4 Boxes</h2>
            <p className="text-xs text-slate-500">
              Regra RN01: máximo de 1 veículo por box em cada faixa de horário.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['Qui 19/11', 'Sex 20/11', 'Seg 23/11'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedDay === day
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr>
                <th className="w-20 p-2.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200">
                  Horário
                </th>
                {BOXES.map((b) => (
                  <th
                    key={b}
                    className="p-2.5 text-left text-xs font-bold text-[#0F2942] border-b border-slate-200"
                  >
                    Box {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="border-b border-slate-100">
                  <td className="p-2.5 text-xs font-mono font-semibold text-slate-600 align-top">
                    {hour}
                  </td>
                  {BOXES.map((box) => {
                    const item = appointments.find(
                      (a) =>
                        a.date === selectedDay &&
                        a.time === hour &&
                        a.box === box &&
                        a.status !== 'Recusado'
                    );
                    const isSelectedCell = selectedBox === box && selectedTime === hour;
                    return (
                      <td key={box} className="p-1.5 align-top">
                        {item ? (
                          <div className="rounded-lg p-2.5 bg-[#0F2942] text-white text-xs shadow-sm space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] text-[#F59E0B] font-bold">
                                {item.id}
                              </span>
                              {item.isEncaixe && (
                                <span className="px-1.5 py-0.2 rounded bg-[#F59E0B] text-[#0F2942] text-[9px] font-bold">
                                  ENCAIXE
                                </span>
                              )}
                            </div>
                            <div className="font-semibold truncate">{item.clientName}</div>
                            <div className="text-[11px] text-slate-300 truncate">
                              {item.vehicleLabel}
                            </div>
                            <div className="text-[10px] text-amber-200 truncate">
                              {item.serviceType}
                            </div>
                            <button
                              type="button"
                              onClick={() => startCheckinFromAppointment(item.id)}
                              className="mt-1.5 w-full py-1 rounded bg-[#F59E0B] hover:bg-[#D97706] text-[#0F2942] text-[10px] font-bold transition"
                            >
                              Iniciar Check-in →
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBox(box);
                              setSelectedTime(hour);
                            }}
                            className={`w-full h-20 rounded-lg border border-dashed text-xs transition flex flex-col items-center justify-center gap-1 ${
                              isSelectedCell
                                ? 'border-[#F59E0B] bg-amber-50 text-[#0F2942] font-semibold'
                                : 'border-slate-200 hover:border-slate-300 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isSelectedCell ? 'Selecionado' : 'Livre'}</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: New Request & Actions */}
      <div className="xl:col-span-4 space-y-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F2942]">Nova Solicitação</h2>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="text-xs font-semibold text-[#0F2942] hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#F59E0B]" />+ Cadastrar cliente/veículo
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente / Veículo
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.clientName} · {v.model} ({v.plate})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Box</label>
                <select
                  value={selectedBox}
                  onChange={(e) => setSelectedBox(Number(e.target.value) as BoxNumber)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {BOXES.map((b) => (
                    <option key={b} value={b}>
                      Box {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Horário</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serviço</label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            {/* Availability Feedback */}
            <div
              className={`p-3 rounded-lg text-xs border ${
                slotOccupied
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}
            >
              {slotOccupied ? (
                <span>
                  <strong>Indisponível (RN01):</strong> Box {selectedBox} ocupado às {selectedTime}{' '}
                  por {slotOccupied.clientName}.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>
                    Vaga disponível: <strong>Box {selectedBox}</strong> em {selectedDay} às{' '}
                    {selectedTime}.
                  </span>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleReserve}
                className="w-full py-2.5 rounded-lg bg-[#0F2942] hover:bg-[#1A3A5C] text-white text-xs font-semibold transition"
              >
                Reservar horário
              </button>
              <button
                type="button"
                onClick={handleEncaixe}
                className="w-full py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-[#F59E0B] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                Registrar encaixe
              </button>
            </div>
          </div>

          {/* Propose Alternative Date */}
          {pendingRequest && (
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F2942]">
                <CalendarClock className="w-4 h-4 text-[#F59E0B]" />
                <span>Sugestão de data alternativa ({pendingRequest.id})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={altDate}
                  onChange={(e) => setAltDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={altTime}
                  onChange={(e) => setAltTime(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => proposeAlternativeDate(pendingRequest.id, altDate, altTime)}
                className="w-full py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F2942] text-xs font-bold transition"
              >
                Propor data alternativa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cadastrar Cliente/Veículo */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-[#0F2942] mb-1">
              Cadastrar Cliente e Veículo
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Novo registro ficará imediatamente disponível para agendamento.
            </p>
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <input
                required
                placeholder="Nome completo do cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="email"
                placeholder="E-mail do cliente"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  required
                  placeholder="Modelo (ex: HB20)"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Placa (ex: ABC-1D23)"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase"
                />
                <input
                  type="number"
                  placeholder="KM atual"
                  value={newMileage}
                  onChange={(e) => setNewMileage(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F2942] text-white hover:bg-[#1A3A5C]"
                >
                  Salvar cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
