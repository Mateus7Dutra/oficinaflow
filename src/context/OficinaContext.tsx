import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_MANAGER_APPROVALS,
  INITIAL_OS,
  INITIAL_PURCHASE_ORDER,
  INITIAL_VEHICLES,
  USER_PROFILES,
} from '../data/seedData';
import {
  calculateOSTotals,
  canTransition,
  nowTimestamp,
  requiresManagerDiscountApproval,
  requiresManagerPurchaseApproval,
  validateBoxCapacity,
  validateCloseOS,
  validateInspectionForTerm,
  validateQualityChecklist,
  validateReadyForQuote,
} from '../engine/stateMachine';
import type {
  Appointment,
  AuditEvent,
  BoxNumber,
  DamageItem,
  ManagerApprovalItem,
  OSState,
  PartItem,
  PurchaseOrder,
  ScreenId,
  ServiceItem,
  ServiceOrder,
  ToastMessage,
  UserProfile,
  UserRole,
  Vehicle,
} from '../types/oficina';

const STORAGE_KEY = 'oficinaflow_state_v1';

interface PersistedState {
  vehicles: Vehicle[];
  appointments: Appointment[];
  os: ServiceOrder;
  purchaseOrder: PurchaseOrder;
  managerApprovals: ManagerApprovalItem[];
  auditEvents: AuditEvent[];
  managerStats: { approvals: number; rejections: number; avgResponseHours: number };
}

interface OficinaContextValue extends PersistedState {
  isLoggedIn: boolean;
  currentRole: UserRole;
  currentUser: UserProfile;
  currentScreen: ScreenId;
  auditDrawerOpen: boolean;
  toasts: ToastMessage[];
  setAuditDrawerOpen: (open: boolean) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  navigate: (screen: ScreenId) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;

  // P1 · Agendamento (S02 & S03)
  createAppointment: (input: {
    clientName: string;
    clientEmail: string;
    vehicleLabel: string;
    plate: string;
    serviceType: string;
    date: string;
    time: string;
    box: BoxNumber | null;
    notes: string;
    isEncaixe?: boolean;
  }) => boolean;
  respondProposedAppointment: (appointmentId: string, accept: boolean) => void;
  proposeAlternativeDate: (appointmentId: string, proposedDate: string, proposedTime: string) => void;
  reserveAppointmentSlot: (appointmentId: string, box: BoxNumber, date: string, time: string) => boolean;
  startCheckinFromAppointment: (appointmentId: string) => void;
  registerClientVehicle: (input: { clientName: string; clientEmail: string; model: string; year: number; plate: string; mileage: number }) => void;

  // P2 · Check-in e Termo (S04 & S05)
  updateInspection: (patch: Partial<ServiceOrder['inspection']>) => void;
  addDamage: (damage: Omit<DamageItem, 'id' | 'number' | 'clientConfirmed'>) => void;
  removeDamage: (id: string) => void;
  issueReceptionTerm: () => boolean;
  signReceptionTerm: () => boolean;
  disputeReceptionTerm: (disputedDamageIds: string[], comment: string) => boolean;

  // P3 · Diagnóstico e Orçamento (S06 & S07)
  updateDiagnosis: (patch: Partial<ServiceOrder['diagnosis']>) => void;
  addServiceItem: (item: Omit<ServiceItem, 'id'>) => void;
  removeServiceItem: (id: string) => void;
  addPartItem: (item: Omit<PartItem, 'id'>) => void;
  removePartItem: (id: string) => void;
  completeDiagnosis: () => boolean;
  markDiagnosisInconclusive: (reason: string) => boolean;
  emitQuote: (discountPercent: number, deliveryEstimate: string) => boolean;

  // P4 · Autorização do Orçamento (S08)
  approveQuoteByClient: () => boolean;
  negotiateQuoteByClient: (note: string, requestedDiscount: number) => boolean;
  refuseQuoteByClient: (reason: string) => boolean;

  // Gestor Alçadas (S09)
  resolveManagerApproval: (approvalId: string, decision: 'Aprovado' | 'Reprovado', justification: string) => boolean;

  // P5 · Compras e Fornecedor (S10 & S11)
  requestSupplierQuotes: () => void;
  selectSupplierQuote: (quoteId: string) => void;
  submitPurchaseOrder: () => boolean;
  supplierSendQuote: (price: number, leadTimeDays: number, warrantyMonths: number) => void;
  supplierDeclineQuote: () => void;
  supplierDispatchOrder: (nfeFile: string, trackingCode: string) => void;
  supplierResendCorrectPart: () => void;
  requestPartExchange: (nfeItemId: string) => void;
  confirmPartReceiptAndReserve: (nfeItemId: string) => void;

  // P6 · Execução, Qualidade e Entrega (S12 & S13)
  toggleServiceDone: (serviceId: string) => void;
  logWorkedHours: (serviceId: string, hoursDelta: number) => void;
  togglePartApplied: (partId: string) => void;
  requestAdditionalService: (description: string, value: number) => boolean;
  respondAdditionalService: (serviceId: string, authorize: boolean) => boolean;
  updateQuality: (patch: Partial<ServiceOrder['quality']>) => void;
  approveQuality: () => boolean;
  rejectQualityRework: (reason: string) => boolean;
  processPayment: (method: ServiceOrder['payment']['method'], simulateDecline?: boolean) => boolean;
  signDeliveryTermByClient: () => boolean;
  markServicesExplained: (val: boolean) => void;
  deliverVehicleAndCloseOS: () => boolean;
}

const OficinaContext = createContext<OficinaContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch {
    // ignore corrupted storage
  }
  return {
    vehicles: INITIAL_VEHICLES,
    appointments: INITIAL_APPOINTMENTS,
    os: INITIAL_OS,
    purchaseOrder: INITIAL_PURCHASE_ORDER,
    managerApprovals: INITIAL_MANAGER_APPROVALS,
    auditEvents: INITIAL_AUDIT_EVENTS,
    managerStats: { approvals: 14, rejections: 3, avgResponseHours: 1.4 },
  };
}

export const OficinaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('cliente');
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('S01');
  const [auditDrawerOpen, setAuditDrawerOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const currentUser = USER_PROFILES.find((u) => u.role === currentRole) || USER_PROFILES[0];

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const appendAudit = (
    prev: PersistedState,
    params: {
      action: string;
      fromState: OSState | 'INICIO';
      toState: OSState;
      channel?: AuditEvent['channel'];
      ruleRef?: string;
      actorOverride?: string;
      roleOverride?: UserRole;
    }
  ): AuditEvent[] => {
    const evt: AuditEvent = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      osId: prev.os.id,
      timestamp: nowTimestamp(),
      actor: params.actorOverride ?? currentUser.name,
      role: params.roleOverride ?? currentRole,
      channel: params.channel ?? (currentRole === 'cliente' ? 'Portal Cliente' : currentRole === 'fornecedor' ? 'Portal Fornecedor' : 'Web App'),
      action: params.action,
      fromState: params.fromState,
      toState: params.toState,
      ruleRef: params.ruleRef,
    };
    return [evt, ...prev.auditEvents];
  };

  const login = (role: UserRole) => {
    const prof = USER_PROFILES.find((u) => u.role === role) || USER_PROFILES[0];
    setCurrentRole(role);
    setIsLoggedIn(true);
    setCurrentScreen(prof.defaultScreen);
    addToast({
      type: 'info',
      title: `Bem-vindo(a), ${prof.name}`,
      description: `Perfil ativo: ${prof.label} · Consentimento LGPD registrado.`,
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('S01');
  };

  const switchRole = (role: UserRole) => {
    const prof = USER_PROFILES.find((u) => u.role === role) || USER_PROFILES[0];
    setCurrentRole(role);
    setIsLoggedIn(true);
    setCurrentScreen(prof.defaultScreen);
    addToast({
      type: 'info',
      title: `Perfil alternado para ${prof.label}`,
      description: `${prof.name} (${prof.initials})`,
    });
  };

  const navigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      vehicles: INITIAL_VEHICLES,
      appointments: INITIAL_APPOINTMENTS,
      os: INITIAL_OS,
      purchaseOrder: INITIAL_PURCHASE_ORDER,
      managerApprovals: INITIAL_MANAGER_APPROVALS,
      auditEvents: INITIAL_AUDIT_EVENTS,
      managerStats: { approvals: 14, rejections: 3, avgResponseHours: 1.4 },
    });
    addToast({
      type: 'success',
      title: 'Cenário de demonstração restaurado',
      description: 'Todos os dados iniciais da OS-2026-0412 e pendências foram recarregados.',
    });
  };

  // ==================== P1 · AGENDAMENTO ====================
  const createAppointment: OficinaContextValue['createAppointment'] = (input) => {
    if (input.box) {
      const cap = validateBoxCapacity(state.appointments, input.box, input.date, input.time);
      if (!cap.ok) {
        addToast({ type: 'error', title: 'Bloqueio RN01 · Capacidade do Box', description: cap.error });
        return false;
      }
    }
    const nextNum = 193 + state.appointments.length;
    const protocol = `AG-2026-0${nextNum}`;
    const newApp: Appointment = {
      id: protocol,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      vehicleLabel: input.vehicleLabel,
      plate: input.plate,
      serviceType: input.serviceType,
      date: input.date,
      time: input.time,
      box: input.box,
      status: input.box ? 'Confirmado' : 'Aguardando confirmação',
      notes: input.notes,
      reminder24h: true,
      isEncaixe: input.isEncaixe,
    };
    setState((prev) => ({
      ...prev,
      appointments: [newApp, ...prev.appointments],
    }));
    addToast({
      type: 'success',
      title: `Protocolo ${protocol} gerado (RN02)`,
      description: `Lembrete automático 24h antes agendado (RN03). ${input.box ? `Box ${input.box} reservado.` : 'Aguardando alocação de box.'}`,
    });
    return true;
  };

  const respondProposedAppointment = (appointmentId: string, accept: boolean) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) => {
        if (a.id !== appointmentId) return a;
        if (accept) {
          return {
            ...a,
            date: a.proposedDate || a.date,
            time: a.proposedTime || a.time,
            box: a.box || 2,
            status: 'Confirmado',
            proposedDate: undefined,
            proposedTime: undefined,
          };
        }
        return { ...a, status: 'Recusado' };
      }),
    }));
    addToast({
      type: accept ? 'success' : 'warning',
      title: accept ? `Nova data aceita (${appointmentId})` : `Proposta recusada (${appointmentId})`,
      description: accept
        ? 'Agendamento confirmado com lembrete 24h ativado.'
        : 'A oficina será notificada para reagendamento.',
    });
  };

  const proposeAlternativeDate = (appointmentId: string, proposedDate: string, proposedTime: string) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === appointmentId
          ? { ...a, status: 'Proposta de nova data', proposedDate, proposedTime }
          : a
      ),
    }));
    addToast({
      type: 'info',
      title: 'Proposta de data alternativa enviada',
      description: `Sugestão ${proposedDate} às ${proposedTime} enviada ao cliente.`,
    });
  };

  const reserveAppointmentSlot = (appointmentId: string, box: BoxNumber, date: string, time: string) => {
    const cap = validateBoxCapacity(state.appointments, box, date, time, appointmentId);
    if (!cap.ok) {
      addToast({ type: 'error', title: 'Bloqueio RN01', description: cap.error });
      return false;
    }
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === appointmentId ? { ...a, box, date, time, status: 'Confirmado' } : a
      ),
    }));
    addToast({
      type: 'success',
      title: `Horário reservado no Box ${box}`,
      description: `${appointmentId} confirmado para ${date} às ${time}.`,
    });
    return true;
  };

  const registerClientVehicle: OficinaContextValue['registerClientVehicle'] = (input) => {
    const newVeh: Vehicle = {
      id: `VEH-${Date.now().toString().slice(-4)}`,
      ...input,
      history: [],
    };
    setState((prev) => ({ ...prev, vehicles: [newVeh, ...prev.vehicles] }));
    addToast({
      type: 'success',
      title: 'Cliente e veículo cadastrados',
      description: `${input.clientName} · ${input.model} (${input.plate})`,
    });
  };

  const startCheckinFromAppointment = (appointmentId: string) => {
    const app = state.appointments.find((a) => a.id === appointmentId);
    if (!app) return;
    const newOsId = `OS-2026-${Math.floor(413 + Math.random() * 500)}`;
    const veh = state.vehicles.find((v) => v.plate === app.plate);
    const now = nowTimestamp();
    const newOS: ServiceOrder = {
      id: newOsId,
      appointmentId: app.id,
      clientName: app.clientName,
      clientEmail: app.clientEmail,
      vehicleModel: app.vehicleLabel.split('·')[0]?.trim() || app.vehicleLabel,
      plate: app.plate,
      box: app.box || 2,
      complaint: app.notes || `${app.serviceType} solicitado no agendamento ${app.id}.`,
      state: 'CHECKIN_EM_ANDAMENTO',
      createdAt: now,
      inspection: {
        mileage: veh?.mileage || 42000,
        fuelLevel: '1/2',
        keysCount: 1,
        damages: [],
        checklist: {
          crlv: true,
          clientDoc: true,
          noCriticalDashLights: true,
          spareTireJack: true,
          valuablesRemoved: true,
        },
        revisionCount: 0,
      },
      diagnosis: {
        obdCodes: ['Nenhum código ativo'],
        findings: '',
        photos: [],
        partsQueried: false,
      },
      services: [],
      parts: [],
      quote: {
        code: `ORC-${newOsId.replace('OS-', '')}`,
        validityDays: 5,
        warrantyDays: 90,
        deliveryEstimate: '24/11/2026 às 17:00',
        discountPercent: 0,
        discountStatus: 'Nenhum',
        status: 'Rascunho',
      },
      quality: {
        roadTest5km: false,
        brakingNoNoise: false,
        noLeaksAbsOff: false,
        cleaningDone: false,
        finalReport: '',
        status: 'Pendente',
        reworkCount: 0,
      },
      payment: {
        method: 'PIX',
        status: 'Pendente',
      },
      delivery: {
        qualityApproved: false,
        paymentValidated: false,
        servicesExplained: false,
        termSignedByClient: false,
      },
    };

    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'Check-in realizado' } : a
      ),
      os: newOS,
      auditEvents: [
        {
          id: `AUD-${Date.now()}`,
          osId: newOsId,
          timestamp: now,
          actor: currentUser.name,
          role: currentRole,
          channel: 'Web App',
          action: `Check-in iniciado a partir do agendamento ${app.id} (${app.vehicleLabel}).`,
          fromState: 'AGENDADO',
          toState: 'CHECKIN_EM_ANDAMENTO',
          ruleRef: 'RN04',
        },
        ...prev.auditEvents,
      ],
    }));
    setCurrentScreen('S04');
    addToast({
      type: 'success',
      title: `Check-in iniciado (${newOsId})`,
      description: 'Preencha vistoria/avarias e emita o Termo de Recebimento (RN04/RN05).',
    });
  };

  // ==================== P2 · CHECK-IN E TERMO ====================
  const updateInspection = (patch: Partial<ServiceOrder['inspection']>) => {
    setState((prev) => ({
      ...prev,
      os: { ...prev.os, inspection: { ...prev.os.inspection, ...patch } },
    }));
  };

  const addDamage = (damage: Omit<DamageItem, 'id' | 'number' | 'clientConfirmed'>) => {
    setState((prev) => {
      const nextNum = prev.os.inspection.damages.length + 1;
      const newDmg: DamageItem = {
        ...damage,
        id: `DMG-${Date.now()}`,
        number: nextNum,
        clientConfirmed: null,
      };
      return {
        ...prev,
        os: {
          ...prev.os,
          inspection: {
            ...prev.os.inspection,
            damages: [...prev.os.inspection.damages, newDmg],
          },
        },
      };
    });
    addToast({ type: 'success', title: 'Avaria registrada com foto (RN05)' });
  };

  const removeDamage = (id: string) => {
    setState((prev) => {
      const filtered = prev.os.inspection.damages
        .filter((d) => d.id !== id)
        .map((d, idx) => ({ ...d, number: idx + 1 }));
      return {
        ...prev,
        os: { ...prev.os, inspection: { ...prev.os.inspection, damages: filtered } },
      };
    });
  };

  const issueReceptionTerm = () => {
    const check = validateInspectionForTerm(state.os);
    if (!check.ok) {
      addToast({ type: 'error', title: `Bloqueio ${check.ruleRef}`, description: check.error });
      return false;
    }
    const targetState: OSState = 'AGUARDANDO_TERMO';
    // Permite reemissão se estiver em AGENDADO, CHECKIN_EM_ANDAMENTO, TERMO_CONTESTADO ou AGUARDANDO_TERMO
    const validSource: OSState[] = ['AGENDADO', 'CHECKIN_EM_ANDAMENTO', 'TERMO_CONTESTADO', 'AGUARDANDO_TERMO'];
    if (!validSource.includes(state.os.state)) {
      // Se o usuário estiver demonstrando S04 depois da OS já avançada, informamos o bloqueio da máquina de estados
      addToast({
        type: 'warning',
        title: 'Transição BPMN bloqueada',
        description: `A ${state.os.id} já passou da fase de Check-in (estado atual: ${state.os.state}). Use "Reiniciar Demo" na Trilha de Auditoria ou acompanhe a etapa atual.`,
      });
      return false;
    }

    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: targetState,
        inspection: {
          ...prev.os.inspection,
          termIssuedAt: nowTimestamp(),
          revisionCount: prev.os.inspection.revisionCount + 1,
          damages: prev.os.inspection.damages.map((d) => ({ ...d, clientConfirmed: null })),
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Termo de Recebimento emitido (revisão #${prev.os.inspection.revisionCount + 1}) e enviado ao cliente.`,
        fromState: prev.os.state,
        toState: targetState,
        ruleRef: 'RN04/RN05',
      }),
    }));
    addToast({
      type: 'success',
      title: 'Termo de Recebimento enviado ao cliente',
      description: 'RN04: A OS só será aberta após assinatura eletrônica do cliente na tela S05.',
    });
    return true;
  };

  const signReceptionTerm = () => {
    const trans = canTransition(state.os.state, 'OS_ABERTA');
    if (!trans.ok) {
      addToast({ type: 'error', title: 'Transição bloqueada (RN04)', description: trans.error });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'OS_ABERTA',
        inspection: {
          ...prev.os.inspection,
          termSignedAt: nowTimestamp(),
          termSignedChannel: 'Portal Cliente (Web)',
          damages: prev.os.inspection.damages.map((d) => ({ ...d, clientConfirmed: true })),
        },
      },
      auditEvents: appendAudit(prev, {
        action: 'Termo de Recebimento assinado eletronicamente pelo cliente. OS aberta oficialmente.',
        fromState: prev.os.state,
        toState: 'OS_ABERTA',
        ruleRef: 'RN04',
      }),
    }));
    addToast({
      type: 'success',
      title: 'Termo assinado! OS aberta (RN04)',
      description: `${state.os.id} liberada para diagnóstico do mecânico.`,
    });
    return true;
  };

  const disputeReceptionTerm = (disputedDamageIds: string[], comment: string) => {
    if (!comment.trim()) {
      addToast({ type: 'warning', title: 'Informe o comentário da contestação (RN06)' });
      return false;
    }
    const trans = canTransition(state.os.state, 'TERMO_CONTESTADO');
    if (!trans.ok && state.os.state !== 'TERMO_CONTESTADO') {
      // Permite demonstração de contestação apenas se ainda em AGUARDANDO_TERMO
      addToast({ type: 'error', title: 'Transição BPMN bloqueada', description: trans.error });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'TERMO_CONTESTADO',
        inspection: {
          ...prev.os.inspection,
          clientDisputeComment: comment,
          damages: prev.os.inspection.damages.map((d) => ({
            ...d,
            clientConfirmed: disputedDamageIds.includes(d.id) ? false : true,
          })),
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Cliente contestou itens do checklist de recebimento: "${comment}". Laço de ajuste aberto.`,
        fromState: prev.os.state,
        toState: 'TERMO_CONTESTADO',
        ruleRef: 'RN06',
      }),
    }));
    addToast({
      type: 'warning',
      title: 'Contestação registrada (RN06)',
      description: 'A atendente foi notificada para ajustar a vistoria e reemitir o termo.',
    });
    return true;
  };

  // ==================== P3 · DIAGNÓSTICO E ORÇAMENTO ====================
  const updateDiagnosis = (patch: Partial<ServiceOrder['diagnosis']>) => {
    setState((prev) => ({
      ...prev,
      os: { ...prev.os, diagnosis: { ...prev.os.diagnosis, ...patch } },
    }));
  };

  const addServiceItem = (item: Omit<ServiceItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        services: [...prev.os.services, { ...item, id: `SRV-${Date.now()}` }],
      },
    }));
  };

  const removeServiceItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        services: prev.os.services.filter((s) => s.id !== id),
      },
    }));
  };

  const addPartItem = (item: Omit<PartItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        parts: [...prev.os.parts, { ...item, id: `PRT-${Date.now()}` }],
      },
    }));
  };

  const removePartItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        parts: prev.os.parts.filter((p) => p.id !== id),
      },
    }));
  };

  const completeDiagnosis = () => {
    const allowedFrom: OSState[] = ['OS_ABERTA', 'EM_DIAGNOSTICO', 'AGUARDANDO_ORCAMENTO'];
    if (!allowedFrom.includes(state.os.state)) {
      addToast({
        type: 'error',
        title: 'Transição BPMN bloqueada',
        description: `Diagnóstico não pode ser concluído no estado atual (${state.os.state}).`,
      });
      return false;
    }
    const totalHours = state.os.services.filter((s) => !s.isAdditional).reduce((a, b) => a + b.hours, 0);
    if (totalHours <= 0) {
      addToast({ type: 'error', title: 'RN07: Informe ao menos um serviço com estimativa de horas.' });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'AGUARDANDO_ORCAMENTO',
        diagnosis: {
          ...prev.os.diagnosis,
          completedAt: nowTimestamp(),
          partsQueried: true,
          inconclusive: false,
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Diagnóstico concluído (${totalHours.toFixed(1)}h). Consulta automática de peças executada (RN07).`,
        fromState: prev.os.state,
        toState: 'AGUARDANDO_ORCAMENTO',
        ruleRef: 'RN07',
      }),
    }));
    addToast({
      type: 'success',
      title: 'Diagnóstico concluído (RN07)',
      description: 'Saldo, preço e prazo das peças consultados automaticamente. Orçamento liberado para a Atendente.',
    });
    return true;
  };

  const markDiagnosisInconclusive = (reason: string) => {
    if (!reason.trim()) {
      addToast({ type: 'warning', title: 'Informe o motivo do diagnóstico inconclusivo.' });
      return false;
    }
    const allowedFrom: OSState[] = ['OS_ABERTA', 'EM_DIAGNOSTICO'];
    if (!allowedFrom.includes(state.os.state)) {
      addToast({
        type: 'error',
        title: 'Transição BPMN bloqueada',
        description: `Só é possível marcar inconclusivo durante o diagnóstico (estado atual: ${state.os.state}).`,
      });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'ENCERRADA_SEM_REPARO',
        diagnosis: {
          ...prev.os.diagnosis,
          inconclusive: true,
          inconclusiveReason: reason,
          completedAt: nowTimestamp(),
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Diagnóstico inconclusivo: "${reason}". OS encerrada sem reparo com recomendação de encaminhamento.`,
        fromState: prev.os.state,
        toState: 'ENCERRADA_SEM_REPARO',
        ruleRef: 'RN08',
      }),
    }));
    addToast({
      type: 'warning',
      title: 'OS encerrada sem reparo (RN08)',
      description: 'Encaminhamento técnico registrado na trilha de auditoria.',
    });
    return true;
  };

  const emitQuote = (discountPercent: number, deliveryEstimate: string) => {
    const ready = validateReadyForQuote(state.os);
    if (!ready.ok) {
      addToast({ type: 'error', title: `Bloqueio ${ready.ruleRef}`, description: ready.error });
      return false;
    }
    const needsManager = requiresManagerDiscountApproval(discountPercent);
    const targetState: OSState = needsManager ? 'AGUARDANDO_APROVACAO_DESCONTO' : 'ORCAMENTO_EMITIDO';
    const validFrom: OSState[] = ['AGUARDANDO_ORCAMENTO', 'ORCAMENTO_EMITIDO', 'AGUARDANDO_APROVACAO_DESCONTO'];
    if (!validFrom.includes(state.os.state)) {
      addToast({
        type: 'error',
        title: 'Transição BPMN bloqueada',
        description: `Orçamento não pode ser reemitido no estado atual (${state.os.state}).`,
      });
      return false;
    }

    setState((prev) => {
      const subtotal =
        prev.os.services.filter((s) => !s.isAdditional).reduce((s, i) => s + i.hours * i.hourlyRate, 0) +
        prev.os.parts.reduce((s, p) => s + p.qty * p.unitPrice, 0);

      let updatedApprovals = prev.managerApprovals;
      if (needsManager) {
        const exists = prev.managerApprovals.some((a) => a.type === 'DESCONTO' && a.status === 'Pendente');
        if (!exists) {
          updatedApprovals = [
            {
              id: `APR-DESC-${Date.now().toString().slice(-4)}`,
              type: 'DESCONTO',
              refCode: prev.os.quote.code,
              osId: prev.os.id,
              title: `Desconto comercial de ${discountPercent}% solicitado no orçamento ${prev.os.quote.code}`,
              requestedBy: `${currentUser.name} (${currentUser.label})`,
              requestedAt: nowTimestamp(),
              status: 'Pendente',
              originalTotal: subtotal,
              discountPercent,
              currentMargin: 34,
              projectedMargin: Math.max(12, Math.round(34 - discountPercent * 0.67)),
              clientHistorySummary: 'Cliente recorrente · 2 revisões anteriores · Sem inadimplência.',
            },
            ...prev.managerApprovals,
          ];
        }
      }

      return {
        ...prev,
        managerApprovals: updatedApprovals,
        os: {
          ...prev.os,
          state: targetState,
          quote: {
            ...prev.os.quote,
            issuedAt: nowTimestamp(),
            validityDays: 5,
            validUntil: '23/11/2026',
            deliveryEstimate,
            discountPercent,
            discountStatus: needsManager
              ? 'Aguardando Gestor'
              : discountPercent > 0
              ? 'Aprovado Atendente'
              : 'Nenhum',
            status: needsManager ? 'Em negociação' : 'Emitido',
            pdfGenerated: true,
          },
        },
        auditEvents: appendAudit(prev, {
          action: needsManager
            ? `Orçamento ${prev.os.quote.code} com desconto de ${discountPercent}% (>10%) enviado à alçada do Gestor (RN10).`
            : `PDF do orçamento ${prev.os.quote.code} emitido (validade 5 dias · desconto ${discountPercent}%) e enviado ao cliente.`,
          fromState: prev.os.state,
          toState: targetState,
          ruleRef: needsManager ? 'RN10' : 'RN09',
        }),
      };
    });

    addToast({
      type: needsManager ? 'warning' : 'success',
      title: needsManager ? 'Alçada do Gestor acionada (RN10)' : 'Orçamento emitido e enviado (RN09)',
      description: needsManager
        ? `Desconto de ${discountPercent}% excede o limite de 10% do Atendente. Encaminhado para S09.`
        : 'Validade automática de 5 dias corridos aplicada. Cliente notificado em S08.',
    });
    return true;
  };

  // ==================== P4 · AUTORIZAÇÃO CLIENTE ====================
  const approveQuoteByClient = () => {
    const trans = canTransition(state.os.state, 'ORCAMENTO_APROVADO');
    if (!trans.ok) {
      addToast({ type: 'error', title: 'Transição BPMN bloqueada', description: trans.error });
      return false;
    }
    const hasMissingParts = state.os.parts.some((p) => p.reservedQty < p.qty);
    const nextState: OSState = hasMissingParts ? 'AGUARDANDO_PECAS' : 'EM_EXECUCAO';

    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: nextState,
        quote: {
          ...prev.os.quote,
          status: 'Aprovado',
          acceptedAt: nowTimestamp(),
          acceptedChannel: 'Portal Cliente (Web PWA)',
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Orçamento ${prev.os.quote.code} aprovado pelo cliente (aceite eletrônico registrado). ${
          hasMissingParts ? 'Encaminhado para Compras (peças sob encomenda).' : 'Liberado para execução.'
        }`,
        fromState: prev.os.state,
        toState: nextState,
        ruleRef: 'RN11',
      }),
    }));
    addToast({
      type: 'success',
      title: 'Orçamento aprovado! (RN11)',
      description: hasMissingParts
        ? 'Aceite gravado com data/hora e canal. OS avançou para P5 (Compra de Peças).'
        : 'Aceite gravado. OS liberada diretamente para P6 (Execução).',
    });
    return true;
  };

  const negotiateQuoteByClient = (note: string, requestedDiscount: number) => {
    if (!note.trim()) {
      addToast({ type: 'warning', title: 'Descreva o pedido de ajuste/desconto antes de enviar.' });
      return false;
    }
    const needsManager = requiresManagerDiscountApproval(requestedDiscount);
    const nextState: OSState = needsManager ? 'AGUARDANDO_APROVACAO_DESCONTO' : 'ORCAMENTO_EMITIDO';

    setState((prev) => {
      const subtotal =
        prev.os.services.filter((s) => !s.isAdditional).reduce((s, i) => s + i.hours * i.hourlyRate, 0) +
        prev.os.parts.reduce((s, p) => s + p.qty * p.unitPrice, 0);

      let approvals = prev.managerApprovals;
      if (needsManager) {
        approvals = [
          {
            id: `APR-DESC-${Date.now().toString().slice(-4)}`,
            type: 'DESCONTO',
            refCode: prev.os.quote.code,
            osId: prev.os.id,
            title: `Negociação cliente: desconto de ${requestedDiscount}% na ${prev.os.quote.code}`,
            requestedBy: `${prev.os.clientName} (Portal Cliente)`,
            requestedAt: nowTimestamp(),
            status: 'Pendente',
            originalTotal: subtotal,
            discountPercent: requestedDiscount,
            currentMargin: 34,
            projectedMargin: Math.max(12, Math.round(34 - requestedDiscount * 0.67)),
            clientHistorySummary: `Observação do cliente: "${note}"`,
          },
          ...prev.managerApprovals,
        ];
      }

      return {
        ...prev,
        managerApprovals: approvals,
        os: {
          ...prev.os,
          state: nextState,
          quote: {
            ...prev.os.quote,
            discountPercent: requestedDiscount,
            discountRequestedByClient: true,
            clientNegotiationNote: note,
            discountStatus: needsManager ? 'Aguardando Gestor' : 'Aprovado Atendente',
            status: 'Em negociação',
          },
        },
        auditEvents: appendAudit(prev, {
          action: `Cliente solicitou negociação (${requestedDiscount}% desconto): "${note}".`,
          fromState: prev.os.state,
          toState: nextState,
          ruleRef: needsManager ? 'RN10' : 'RN11',
        }),
      };
    });

    addToast({
      type: 'info',
      title: needsManager ? 'Negociação enviada ao Gestor (RN10)' : 'Pedido de negociação registrado',
      description: needsManager
        ? `Desconto de ${requestedDiscount}% excede 10% e aguarda análise em S09.`
        : 'A atendente recebeu sua solicitação de ajuste.',
    });
    return true;
  };

  const refuseQuoteByClient = (reason: string) => {
    const trans = canTransition(state.os.state, 'ENCERRADA_RECUSADA');
    if (!trans.ok) {
      addToast({ type: 'error', title: 'Transição BPMN bloqueada', description: trans.error });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'ENCERRADA_RECUSADA',
        quote: { ...prev.os.quote, status: 'Recusado' },
      },
      auditEvents: appendAudit(prev, {
        action: `Orçamento recusado pelo cliente (${reason || 'sem motivo informado'}). OS encerrada sem execução.`,
        fromState: prev.os.state,
        toState: 'ENCERRADA_RECUSADA',
        ruleRef: 'RN12/RN13',
      }),
    }));
    addToast({
      type: 'warning',
      title: 'Orçamento recusado · OS encerrada (RN12)',
      description: 'O veículo será liberado sem execução de reparos.',
    });
    return true;
  };

  // ==================== GESTOR ALÇADAS (S09) ====================
  const resolveManagerApproval = (
    approvalId: string,
    decision: 'Aprovado' | 'Reprovado',
    justification: string
  ) => {
    if (decision === 'Reprovado' && !justification.trim()) {
      addToast({
        type: 'error',
        title: 'Justificativa obrigatória',
        description: 'Ao reprovar ou manter valores, informe a justificativa da decisão.',
      });
      return false;
    }

    const item = state.managerApprovals.find((a) => a.id === approvalId);
    if (!item) return false;

    setState((prev) => {
      const updatedApprovals = prev.managerApprovals.map((a) =>
        a.id === approvalId ? { ...a, status: decision, justification } : a
      );

      let updatedOS = prev.os;
      let updatedPO = prev.purchaseOrder;
      let auditAction = '';
      let fromState = prev.os.state;
      let toState = prev.os.state;
      let ruleRef = '';

      if (item.type === 'DESCONTO') {
        ruleRef = 'RN10';
        const approved = decision === 'Aprovado';
        toState = prev.os.state === 'AGUARDANDO_APROVACAO_DESCONTO' ? 'ORCAMENTO_EMITIDO' : prev.os.state;
        updatedOS = {
          ...prev.os,
          state: toState,
          quote: {
            ...prev.os.quote,
            discountPercent: approved ? item.discountPercent ?? prev.os.quote.discountPercent : 0,
            discountStatus: approved ? 'Aprovado Gestor' : 'Mantido Gestor',
            status: 'Emitido',
          },
        };
        auditAction = approved
          ? `Gestor aprovou desconto de ${item.discountPercent}% na ${item.refCode}. ${justification ? `Obs: ${justification}` : ''}`
          : `Gestor manteve valores originais na ${item.refCode}. Justificativa: ${justification}`;
      } else {
        ruleRef = 'RN14';
        const approved = decision === 'Aprovado';
        updatedPO = {
          ...prev.purchaseOrder,
          approvalStatus: approved ? 'Aprovada' : 'Reprovada',
          orderStatus: approved ? 'Emitido ao fornecedor' : 'Em cotação',
        };
        auditAction = approved
          ? `Gestor aprovou compra ${prev.purchaseOrder.id} (R$ ${prev.purchaseOrder.totalValue.toFixed(2)}). Pedido emitido ao fornecedor ${prev.purchaseOrder.selectedSupplier}.`
          : `Gestor reprovou compra ${prev.purchaseOrder.id}. Justificativa: ${justification}`;
      }

      return {
        ...prev,
        managerApprovals: updatedApprovals,
        os: updatedOS,
        purchaseOrder: updatedPO,
        managerStats: {
          ...prev.managerStats,
          approvals: prev.managerStats.approvals + (decision === 'Aprovado' ? 1 : 0),
          rejections: prev.managerStats.rejections + (decision === 'Reprovado' ? 1 : 0),
        },
        auditEvents: appendAudit(prev, {
          action: auditAction,
          fromState,
          toState,
          ruleRef,
        }),
      };
    });

    addToast({
      type: decision === 'Aprovado' ? 'success' : 'warning',
      title: `Decisão registrada: ${decision}`,
      description:
        item.type === 'DESCONTO'
          ? 'Orçamento atualizado e liberado para aceite do cliente.'
          : decision === 'Aprovado'
          ? 'Pedido de compra liberado no Portal do Fornecedor (S11).'
          : 'Compras notificado para nova cotação.',
    });
    return true;
  };

  // ==================== P5 · COMPRAS & FORNECEDOR (S10 & S11) ====================
  const requestSupplierQuotes = () => {
    setState((prev) => ({
      ...prev,
      purchaseOrder: { ...prev.purchaseOrder, orderStatus: 'Em cotação' },
      auditEvents: appendAudit(prev, {
        action: `Solicitação de cotações (${prev.purchaseOrder.quoteCode}) disparada para 3 fornecedores homologados.`,
        fromState: prev.os.state,
        toState: prev.os.state,
        ruleRef: 'RN14',
      }),
    }));
    addToast({
      type: 'success',
      title: 'Cotações solicitadas aos fornecedores',
      description: 'AutoPeças Capixaba, Distribuidora Vitória e Freios & Cia notificados.',
    });
  };

  const selectSupplierQuote = (quoteId: string) => {
    setState((prev) => {
      const target = prev.purchaseOrder.supplierQuotes.find((q) => q.id === quoteId);
      if (!target) return prev;
      return {
        ...prev,
        purchaseOrder: {
          ...prev.purchaseOrder,
          selectedSupplier: target.supplierName,
          totalValue: target.unitPriceTotal,
          supplierQuotes: prev.purchaseOrder.supplierQuotes.map((q) => ({
            ...q,
            selected: q.id === quoteId,
          })),
        },
      };
    });
  };

  const submitPurchaseOrder = () => {
    const needsManager = requiresManagerPurchaseApproval(state.purchaseOrder.totalValue);
    setState((prev) => {
      let approvals = prev.managerApprovals;
      if (needsManager) {
        const exists = approvals.some((a) => a.type === 'COMPRA' && a.status === 'Pendente');
        if (!exists) {
          approvals = [
            {
              id: `APR-COMP-${Date.now().toString().slice(-4)}`,
              type: 'COMPRA',
              refCode: `${prev.purchaseOrder.id} · ${prev.purchaseOrder.quoteCode}`,
              osId: prev.os.id,
              title: `Compra acima da alçada (> R$ 1.500,00) · ${prev.purchaseOrder.partSummary}`,
              requestedBy: `${currentUser.name} (Compras e Estoque)`,
              requestedAt: nowTimestamp(),
              status: 'Pendente',
              purchaseTotal: prev.purchaseOrder.totalValue,
              recommendedSupplier: prev.purchaseOrder.selectedSupplier,
              supplierComparison: prev.purchaseOrder.supplierQuotes.map((q) => ({
                supplier: q.supplierName,
                price: q.unitPriceTotal,
                days: q.leadTimeDays,
                warranty: `${q.warrantyMonths} meses`,
              })),
            },
            ...approvals,
          ];
        }
      }
      return {
        ...prev,
        managerApprovals: approvals,
        purchaseOrder: {
          ...prev.purchaseOrder,
          approvalStatus: needsManager ? 'Aguardando Gestor' : 'Não requerida',
          orderStatus: needsManager ? 'Aguardando aprovação' : 'Emitido ao fornecedor',
        },
        auditEvents: appendAudit(prev, {
          action: needsManager
            ? `Pedido ${prev.purchaseOrder.id} (R$ ${prev.purchaseOrder.totalValue.toFixed(2)} > R$ 1.500) enviado ao Gestor para aprovação (RN14).`
            : `Pedido ${prev.purchaseOrder.id} emitido diretamente ao fornecedor ${prev.purchaseOrder.selectedSupplier}.`,
          fromState: prev.os.state,
          toState: prev.os.state,
          ruleRef: 'RN14',
        }),
      };
    });
    addToast({
      type: needsManager ? 'warning' : 'success',
      title: needsManager ? 'Enviado à alçada do Gestor (RN14)' : 'Pedido emitido ao fornecedor',
      description: needsManager
        ? 'Compras acima de R$ 1.500,00 exigem aprovação em S09 antes da emissão.'
        : 'Fornecedor notificado no Portal (S11).',
    });
    return true;
  };

  const supplierSendQuote = (price: number, leadTimeDays: number, warrantyMonths: number) => {
    setState((prev) => ({
      ...prev,
      purchaseOrder: {
        ...prev.purchaseOrder,
        totalValue: price,
        supplierQuotes: prev.purchaseOrder.supplierQuotes.map((q) =>
          q.supplierName === 'AutoPeças Capixaba'
            ? { ...q, unitPriceTotal: price, leadTimeDays, warrantyMonths, status: 'Recebida' }
            : q
        ),
      },
      auditEvents: appendAudit(prev, {
        action: `Fornecedor AutoPeças Capixaba enviou cotação: R$ ${price.toFixed(2)}, prazo ${leadTimeDays}d, garantia ${warrantyMonths}m.`,
        fromState: prev.os.state,
        toState: prev.os.state,
        channel: 'Portal Fornecedor',
      }),
    }));
    addToast({ type: 'success', title: 'Cotação enviada à oficina!', description: 'Mapa comparativo atualizado em S10.' });
  };

  const supplierDeclineQuote = () => {
    setState((prev) => ({
      ...prev,
      purchaseOrder: {
        ...prev.purchaseOrder,
        supplierQuotes: prev.purchaseOrder.supplierQuotes.map((q) =>
          q.supplierName === 'AutoPeças Capixaba' ? { ...q, status: 'Sem estoque', selected: false } : q
        ),
      },
      auditEvents: appendAudit(prev, {
        action: 'Fornecedor AutoPeças Capixaba informou indisponibilidade das peças.',
        fromState: prev.os.state,
        toState: prev.os.state,
        channel: 'Portal Fornecedor',
      }),
    }));
    addToast({ type: 'warning', title: 'Indisponibilidade informada à oficina' });
  };

  const supplierDispatchOrder = (nfeFile: string, trackingCode: string) => {
    if (!trackingCode.trim()) {
      addToast({ type: 'warning', title: 'Informe o código de rastreio antes de despachar.' });
      return;
    }
    setState((prev) => ({
      ...prev,
      purchaseOrder: {
        ...prev.purchaseOrder,
        nfeFile: nfeFile || 'NFe_2026_088_AutoPecasCapixaba.xml',
        trackingCode,
        orderStatus: 'Despachado',
      },
      auditEvents: appendAudit(prev, {
        action: `Fornecedor despachou pedido ${prev.purchaseOrder.id} · NF-e anexada · Rastreio: ${trackingCode}.`,
        fromState: prev.os.state,
        toState: prev.os.state,
        channel: 'Portal Fornecedor',
        ruleRef: 'RN15',
      }),
    }));
    addToast({ type: 'success', title: 'Despacho informado!', description: `Rastreio ${trackingCode} disponível para conferência em S10.` });
  };

  const supplierResendCorrectPart = () => {
    setState((prev) => ({
      ...prev,
      purchaseOrder: {
        ...prev.purchaseOrder,
        exchangeOpen: false,
        exchangeResolved: true,
        nfeItems: prev.purchaseOrder.nfeItems.map((i) =>
          i.status === 'Modelo divergente' || i.status === 'Troca solicitada'
            ? { ...i, partName: 'Par de discos ventilados 282mm (Reenviado · Correto)', status: 'Conforme' }
            : i
        ),
      },
      auditEvents: appendAudit(prev, {
        action: 'Fornecedor reenviou peça correta em atendimento à solicitação de troca.',
        fromState: prev.os.state,
        toState: prev.os.state,
        channel: 'Portal Fornecedor',
        ruleRef: 'RN16',
      }),
    }));
    addToast({ type: 'success', title: 'Reenvio da peça correta registrado!', description: 'Item atualizado para "Conforme" na conferência de NF-e.' });
  };

  const requestPartExchange = (nfeItemId: string) => {
    setState((prev) => ({
      ...prev,
      purchaseOrder: {
        ...prev.purchaseOrder,
        exchangeOpen: true,
        exchangeResolved: false,
        nfeItems: prev.purchaseOrder.nfeItems.map((i) =>
          i.id === nfeItemId ? { ...i, status: 'Troca solicitada' } : i
        ),
      },
      auditEvents: appendAudit(prev, {
        action: 'Divergência na conferência de NF-e: solicitação de troca enviada ao fornecedor (RN15/RN16).',
        fromState: prev.os.state,
        toState: prev.os.state,
        ruleRef: 'RN16',
      }),
    }));
    addToast({
      type: 'warning',
      title: 'Troca solicitada ao fornecedor (RN16)',
      description: 'Entrada no estoque bloqueada até recebimento do item conforme.',
    });
  };

  const confirmPartReceiptAndReserve = (nfeItemId: string) => {
    const item = state.purchaseOrder.nfeItems.find((i) => i.id === nfeItemId);
    if (!item) return;
    if (item.status !== 'Conforme') {
      addToast({
        type: 'error',
        title: 'Bloqueio RN15/RN16 · Conferência NF-e',
        description: 'Nenhuma peça com divergência pode dar entrada no estoque antes da troca.',
      });
      return;
    }

    setState((prev) => {
      const updatedNfe = prev.purchaseOrder.nfeItems.map((i) =>
        i.id === nfeItemId ? { ...i, status: 'Entrada confirmada' as const } : i
      );
      const updatedParts = prev.os.parts.map((p) =>
        p.code === item.partCode
          ? { ...p, stockStatus: 'Em estoque' as const, reservedQty: p.qty }
          : p
      );
      const allReserved = updatedParts.every((p) => p.reservedQty >= p.qty);
      const nextState: OSState =
        prev.os.state === 'AGUARDANDO_PECAS' && allReserved ? 'EM_EXECUCAO' : prev.os.state;

      return {
        ...prev,
        purchaseOrder: {
          ...prev.purchaseOrder,
          nfeItems: updatedNfe,
          orderStatus: updatedNfe.every((i) => i.status === 'Entrada confirmada')
            ? 'Recebido e reservado'
            : prev.purchaseOrder.orderStatus,
        },
        os: {
          ...prev.os,
          state: nextState,
          parts: updatedParts,
        },
        auditEvents: appendAudit(prev, {
          action: `Entrada de ${item.partName} confirmada contra NF-e e reservada automaticamente para ${prev.os.id} (RN17).`,
          fromState: prev.os.state,
          toState: nextState,
          ruleRef: 'RN17',
        }),
      };
    });
    addToast({
      type: 'success',
      title: 'Peça recebida e reservada à OS (RN17)',
      description: 'Saldo atualizado e vinculado automaticamente à OS-2026-0412.',
    });
  };

  // ==================== P6 · EXECUÇÃO, QUALIDADE E ENTREGA (S12 & S13) ====================
  const toggleServiceDone = (serviceId: string) => {
    const srv = state.os.services.find((s) => s.id === serviceId);
    if (srv?.isAdditional && srv.additionalStatus !== 'Autorizado') {
      addToast({
        type: 'error',
        title: 'Bloqueio RN18 · Serviço adicional não autorizado',
        description: 'Este serviço extra só pode ser executado após aprovação expressa do cliente.',
      });
      return;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        services: prev.os.services.map((s) => (s.id === serviceId ? { ...s, done: !s.done } : s)),
      },
    }));
  };

  const logWorkedHours = (serviceId: string, hoursDelta: number) => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        services: prev.os.services.map((s) =>
          s.id === serviceId ? { ...s, workedHours: Math.max(0, Number(((s.workedHours ?? 0) + hoursDelta).toFixed(1))) } : s
        ),
      },
    }));
  };

  const togglePartApplied = (partId: string) => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        parts: prev.os.parts.map((p) => (p.id === partId ? { ...p, applied: !p.applied } : p)),
      },
    }));
  };

  const requestAdditionalService = (description: string, value: number) => {
    if (!description.trim() || value <= 0) {
      addToast({ type: 'warning', title: 'Informe descrição e valor do serviço adicional.' });
      return false;
    }
    setState((prev) => {
      const nextState: OSState =
        prev.os.state === 'EM_EXECUCAO' ? 'AGUARDANDO_AUTORIZACAO_ADICIONAL' : prev.os.state;
      return {
        ...prev,
        os: {
          ...prev.os,
          state: nextState,
          services: [
            ...prev.os.services,
            {
              id: `SRV-ADD-${Date.now().toString().slice(-4)}`,
              description,
              hours: 1,
              hourlyRate: value,
              done: false,
              workedHours: 0,
              isAdditional: true,
              additionalStatus: 'Pendente aprovação cliente',
            },
          ],
        },
        auditEvents: appendAudit(prev, {
          action: `Serviço adicional solicitado: "${description}" (R$ ${value.toFixed(2)}). Execução bloqueada até autorização do cliente (RN18).`,
          fromState: prev.os.state,
          toState: nextState,
          ruleRef: 'RN18',
        }),
      };
    });
    addToast({
      type: 'warning',
      title: 'Serviço adicional bloqueado (RN18)',
      description: 'Aguardando autorização do cliente na tela S08 antes da execução.',
    });
    return true;
  };

  const respondAdditionalService = (serviceId: string, authorize: boolean) => {
    setState((prev) => {
      const updatedServices = prev.os.services.map((s) =>
        s.id === serviceId
          ? { ...s, additionalStatus: (authorize ? 'Autorizado' : 'Recusado') as ServiceItem['additionalStatus'] }
          : s
      );
      const stillPending = updatedServices.some(
        (s) => s.isAdditional && s.additionalStatus === 'Pendente aprovação cliente'
      );
      const nextState: OSState =
        prev.os.state === 'AGUARDANDO_AUTORIZACAO_ADICIONAL' && !stillPending
          ? 'EM_EXECUCAO'
          : prev.os.state;
      return {
        ...prev,
        os: { ...prev.os, state: nextState, services: updatedServices },
        auditEvents: appendAudit(prev, {
          action: `Cliente ${authorize ? 'autorizou' : 'recusou'} serviço adicional (${serviceId}).`,
          fromState: prev.os.state,
          toState: nextState,
          ruleRef: 'RN18',
        }),
      };
    });
    addToast({
      type: authorize ? 'success' : 'warning',
      title: authorize ? 'Serviço adicional autorizado (RN18)' : 'Serviço adicional recusado',
      description: authorize ? 'Liberado para execução do mecânico na tela S12.' : 'Item não será executado nem cobrado.',
    });
    return true;
  };

  const updateQuality = (patch: Partial<ServiceOrder['quality']>) => {
    setState((prev) => ({
      ...prev,
      os: { ...prev.os, quality: { ...prev.os.quality, ...patch } },
    }));
  };

  const approveQuality = () => {
    const valid = validateQualityChecklist(state.os);
    if (!valid.ok) {
      addToast({ type: 'error', title: `Bloqueio ${valid.ruleRef}`, description: valid.error });
      return false;
    }
    const allowedStates: OSState[] = ['EM_EXECUCAO', 'EM_CONTROLE_QUALIDADE', 'AGUARDANDO_PECAS', 'ORCAMENTO_APROVADO'];
    if (!allowedStates.includes(state.os.state)) {
      addToast({
        type: 'error',
        title: 'Transição BPMN bloqueada',
        description: `O veículo precisa ter orçamento aprovado e estar em execução antes da aprovação de qualidade (estado atual: ${state.os.state}).`,
      });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'PRONTO_PARA_PAGAMENTO',
        quality: {
          ...prev.os.quality,
          status: 'Aprovado',
          inspectedAt: nowTimestamp(),
        },
        delivery: {
          ...prev.os.delivery,
          qualityApproved: true,
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Controle de qualidade aprovado com laudo final. Veículo liberado para cobrança e retirada (RN19).`,
        fromState: prev.os.state,
        toState: 'PRONTO_PARA_PAGAMENTO',
        ruleRef: 'RN19',
      }),
    }));
    addToast({
      type: 'success',
      title: 'Controle de qualidade aprovado (RN19)',
      description: 'OS liberada para cobrança e entrega na tela S13.',
    });
    return true;
  };

  const rejectQualityRework = (reason: string) => {
    if (!reason.trim()) {
      addToast({ type: 'warning', title: 'Informe o motivo da reprovação no laudo para gerar retrabalho.' });
      return false;
    }
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'EM_EXECUCAO',
        quality: {
          ...prev.os.quality,
          status: 'Reprovado',
          finalReport: reason,
          reworkCount: prev.os.quality.reworkCount + 1,
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Controle de qualidade REPROVADO (retrabalho #${prev.os.quality.reworkCount + 1}): "${reason}". Devolvido para execução.`,
        fromState: prev.os.state,
        toState: 'EM_EXECUCAO',
        ruleRef: 'RN19',
      }),
    }));
    addToast({
      type: 'error',
      title: 'Qualidade reprovada · Retrabalho aberto',
      description: 'A OS foi devolvida para a fila de execução do mecânico.',
    });
    return true;
  };

  const processPayment = (method: ServiceOrder['payment']['method'], simulateDecline = false) => {
    if (state.os.quality.status !== 'Aprovado') {
      addToast({
        type: 'error',
        title: 'Bloqueio RN19 · Qualidade obrigatória',
        description: 'O pagamento só pode ser validado após aprovação no Controle de Qualidade (S12).',
      });
      return false;
    }
    if (simulateDecline) {
      setState((prev) => ({
        ...prev,
        os: {
          ...prev.os,
          payment: {
            method,
            status: 'Recusado',
            failureReason: 'Transação não autorizada pelo emissor. Solicite nova forma de pagamento.',
          },
        },
        auditEvents: appendAudit(prev, {
          action: `Pagamento via ${method} RECUSADO pelo gateway. Nova forma de pagamento solicitada.`,
          fromState: prev.os.state,
          toState: prev.os.state,
          channel: 'Gateway Pagamento',
          ruleRef: 'RN20',
        }),
      }));
      addToast({
        type: 'error',
        title: 'Pagamento recusado pelo gateway (RN20)',
        description: 'Solicite uma nova forma de pagamento ao cliente.',
      });
      return false;
    }

    const txId = `GW-${Date.now().toString().slice(-6)}`;
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'PAGO_AGUARDANDO_ENTREGA',
        payment: {
          method,
          status: 'Validado',
          gatewayTransactionId: txId,
          paidAt: nowTimestamp(),
          failureReason: undefined,
        },
        delivery: {
          ...prev.os.delivery,
          paymentValidated: true,
        },
      },
      auditEvents: appendAudit(prev, {
        action: `Pagamento via ${method} validado pelo gateway (ID ${txId}).`,
        fromState: prev.os.state,
        toState: 'PAGO_AGUARDANDO_ENTREGA',
        channel: 'Gateway Pagamento',
        ruleRef: 'RN20',
      }),
    }));
    addToast({
      type: 'success',
      title: `Pagamento validado (${method})`,
      description: `Transação ${txId} confirmada pelo gateway (RN20).`,
    });
    return true;
  };

  const signDeliveryTermByClient = () => {
    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        delivery: {
          ...prev.os.delivery,
          termSignedByClient: true,
          termSignedAt: nowTimestamp(),
        },
      },
      auditEvents: appendAudit(prev, {
        action: 'Cliente conferiu o veículo e assinou eletronicamente o Termo de Entrega.',
        fromState: prev.os.state,
        toState: prev.os.state,
        channel: 'Portal Cliente',
        ruleRef: 'RN21',
      }),
    }));
    addToast({ type: 'success', title: 'Termo de Entrega assinado (RN21)' });
    return true;
  };

  const markServicesExplained = (val: boolean) => {
    setState((prev) => ({
      ...prev,
      os: { ...prev.os, delivery: { ...prev.os.delivery, servicesExplained: val } },
    }));
  };

  const deliverVehicleAndCloseOS = () => {
    const valid = validateCloseOS(state.os);
    if (!valid.ok) {
      addToast({ type: 'error', title: `Bloqueio ${valid.ruleRef}`, description: valid.error });
      return false;
    }
    const nfeNum = `NF-e 005.${Math.floor(100 + Math.random() * 899)}`;
    const now = nowTimestamp();
    const { finalTotal } = calculateOSTotals(state.os);

    setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        state: 'ENCERRADA_CONCLUIDA',
        delivery: {
          ...prev.os.delivery,
          servicesExplained: true,
          vehicleDeliveredAt: now,
          nfeNumber: nfeNum,
          closedAt: now,
        },
      },
      vehicles: prev.vehicles.map((v) =>
        v.plate === prev.os.plate
          ? {
              ...v,
              mileage: prev.os.inspection.mileage,
              history: [
                {
                  id: `HIST-${Date.now()}`,
                  date: now.split(' ')[0],
                  osNumber: prev.os.id,
                  summary: 'Substituição pastilhas/discos dianteiros, sensor ABS e fluido DOT4',
                  totalValue: finalTotal,
                  mileage: prev.os.inspection.mileage,
                  nfeNumber: nfeNum,
                },
                ...v.history,
              ],
            }
          : v
      ),
      auditEvents: appendAudit(prev, {
        action: `Veículo e chaves entregues. ${nfeNum} emitida e histórico do veículo ${prev.os.plate} atualizado. OS encerrada (RN21).`,
        fromState: prev.os.state,
        toState: 'ENCERRADA_CONCLUIDA',
        ruleRef: 'RN21',
      }),
    }));
    addToast({
      type: 'success',
      title: `OS encerrada com sucesso! (${nfeNum})`,
      description: 'Veículo entregue, NF-e simulada emitida e histórico do veículo atualizado (RN21).',
    });
    return true;
  };

  return (
    <OficinaContext.Provider
      value={{
        ...state,
        isLoggedIn,
        currentRole,
        currentUser,
        currentScreen,
        auditDrawerOpen,
        toasts,
        setAuditDrawerOpen,
        login,
        logout,
        switchRole,
        navigate,
        addToast,
        dismissToast,
        resetDemoData,
        createAppointment,
        respondProposedAppointment,
        proposeAlternativeDate,
        reserveAppointmentSlot,
        startCheckinFromAppointment,
        registerClientVehicle,
        updateInspection,
        addDamage,
        removeDamage,
        issueReceptionTerm,
        signReceptionTerm,
        disputeReceptionTerm,
        updateDiagnosis,
        addServiceItem,
        removeServiceItem,
        addPartItem,
        removePartItem,
        completeDiagnosis,
        markDiagnosisInconclusive,
        emitQuote,
        approveQuoteByClient,
        negotiateQuoteByClient,
        refuseQuoteByClient,
        resolveManagerApproval,
        requestSupplierQuotes,
        selectSupplierQuote,
        submitPurchaseOrder,
        supplierSendQuote,
        supplierDeclineQuote,
        supplierDispatchOrder,
        supplierResendCorrectPart,
        requestPartExchange,
        confirmPartReceiptAndReserve,
        toggleServiceDone,
        logWorkedHours,
        togglePartApplied,
        requestAdditionalService,
        respondAdditionalService,
        updateQuality,
        approveQuality,
        rejectQualityRework,
        processPayment,
        signDeliveryTermByClient,
        markServicesExplained,
        deliverVehicleAndCloseOS,
      }}
    >
      {children}
    </OficinaContext.Provider>
  );
};

export function useOficina() {
  const ctx = useContext(OficinaContext);
  if (!ctx) throw new Error('useOficina must be used inside OficinaProvider');
  return ctx;
}
