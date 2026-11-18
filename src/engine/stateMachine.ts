import type { Appointment, BoxNumber, OSState, ServiceOrder } from '../types/oficina';

export interface StateMeta {
  label: string;
  phase: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
  phaseLabel: string;
  color: 'navy' | 'amber' | 'green' | 'red' | 'blue' | 'slate';
  timelineStep: number; // 0 to 6 for vertical client timeline
}

export const OS_STATE_META: Record<OSState, StateMeta> = {
  AGENDADO: {
    label: 'Agendado',
    phase: 'P1',
    phaseLabel: 'P1 · Agendamento',
    color: 'blue',
    timelineStep: 0,
  },
  CHECKIN_EM_ANDAMENTO: {
    label: 'Check-in em andamento',
    phase: 'P2',
    phaseLabel: 'P2 · Recebimento e OS',
    color: 'amber',
    timelineStep: 1,
  },
  AGUARDANDO_TERMO: {
    label: 'Aguardando assinatura do termo',
    phase: 'P2',
    phaseLabel: 'P2 · Recebimento e OS',
    color: 'amber',
    timelineStep: 1,
  },
  TERMO_CONTESTADO: {
    label: 'Termo contestado (em ajuste)',
    phase: 'P2',
    phaseLabel: 'P2 · Recebimento e OS',
    color: 'red',
    timelineStep: 1,
  },
  OS_ABERTA: {
    label: 'OS Aberta',
    phase: 'P2',
    phaseLabel: 'P2 · Recebimento e OS',
    color: 'navy',
    timelineStep: 1,
  },
  EM_DIAGNOSTICO: {
    label: 'Em diagnóstico técnico',
    phase: 'P3',
    phaseLabel: 'P3 · Diagnóstico e Orçamento',
    color: 'blue',
    timelineStep: 2,
  },
  ENCERRADA_SEM_REPARO: {
    label: 'Encerrada sem reparo',
    phase: 'P3',
    phaseLabel: 'P3 · Diagnóstico Inconclusivo',
    color: 'red',
    timelineStep: 2,
  },
  AGUARDANDO_ORCAMENTO: {
    label: 'Aguardando montagem do orçamento',
    phase: 'P3',
    phaseLabel: 'P3 · Diagnóstico e Orçamento',
    color: 'amber',
    timelineStep: 3,
  },
  ORCAMENTO_EMITIDO: {
    label: 'Orçamento enviado ao cliente',
    phase: 'P4',
    phaseLabel: 'P4 · Autorização do Orçamento',
    color: 'amber',
    timelineStep: 4,
  },
  AGUARDANDO_APROVACAO_DESCONTO: {
    label: 'Aguardando alçada de desconto (Gestor)',
    phase: 'P4',
    phaseLabel: 'P4 · Autorização do Orçamento',
    color: 'amber',
    timelineStep: 4,
  },
  ENCERRADA_RECUSADA: {
    label: 'Encerrada (orçamento recusado/expirado)',
    phase: 'P4',
    phaseLabel: 'P4 · Autorização do Orçamento',
    color: 'red',
    timelineStep: 4,
  },
  ORCAMENTO_APROVADO: {
    label: 'Orçamento aprovado',
    phase: 'P4',
    phaseLabel: 'P4 · Autorização do Orçamento',
    color: 'green',
    timelineStep: 4,
  },
  AGUARDANDO_PECAS: {
    label: 'Aguardando compra/recebimento de peças',
    phase: 'P5',
    phaseLabel: 'P5 · Compra de Peças',
    color: 'amber',
    timelineStep: 5,
  },
  EM_EXECUCAO: {
    label: 'Em execução na oficina',
    phase: 'P6',
    phaseLabel: 'P6 · Execução, Qualidade e Entrega',
    color: 'blue',
    timelineStep: 5,
  },
  AGUARDANDO_AUTORIZACAO_ADICIONAL: {
    label: 'Aguardando autorização de serviço adicional',
    phase: 'P6',
    phaseLabel: 'P6 · Execução, Qualidade e Entrega',
    color: 'amber',
    timelineStep: 5,
  },
  EM_CONTROLE_QUALIDADE: {
    label: 'Em controle de qualidade',
    phase: 'P6',
    phaseLabel: 'P6 · Execução, Qualidade e Entrega',
    color: 'navy',
    timelineStep: 5,
  },
  PRONTO_PARA_PAGAMENTO: {
    label: 'Pronto para cobrança e retirada',
    phase: 'P6',
    phaseLabel: 'P6 · Execução, Qualidade e Entrega',
    color: 'green',
    timelineStep: 6,
  },
  PAGO_AGUARDANDO_ENTREGA: {
    label: 'Pagamento validado · Aguardando entrega',
    phase: 'P6',
    phaseLabel: 'P6 · Execução, Qualidade e Entrega',
    color: 'green',
    timelineStep: 6,
  },
  ENCERRADA_CONCLUIDA: {
    label: 'OS Encerrada e Veículo Entregue',
    phase: 'P6',
    phaseLabel: 'P6 · Concluída',
    color: 'green',
    timelineStep: 6,
  },
};

/**
 * Máquina de estados rigorosa BPMN 2.0:
 * Transições fora deste mapa são bloqueadas.
 */
export const ALLOWED_TRANSITIONS: Record<OSState, OSState[]> = {
  AGENDADO: ['CHECKIN_EM_ANDAMENTO'],
  CHECKIN_EM_ANDAMENTO: ['AGUARDANDO_TERMO'],
  AGUARDANDO_TERMO: ['TERMO_CONTESTADO', 'OS_ABERTA'],
  TERMO_CONTESTADO: ['AGUARDANDO_TERMO'],
  OS_ABERTA: ['EM_DIAGNOSTICO'],
  EM_DIAGNOSTICO: ['AGUARDANDO_ORCAMENTO', 'ENCERRADA_SEM_REPARO'],
  ENCERRADA_SEM_REPARO: [],
  AGUARDANDO_ORCAMENTO: ['ORCAMENTO_EMITIDO', 'AGUARDANDO_APROVACAO_DESCONTO'],
  ORCAMENTO_EMITIDO: [
    'AGUARDANDO_APROVACAO_DESCONTO',
    'ORCAMENTO_APROVADO',
    'ENCERRADA_RECUSADA',
  ],
  AGUARDANDO_APROVACAO_DESCONTO: ['ORCAMENTO_EMITIDO', 'ORCAMENTO_APROVADO'],
  ENCERRADA_RECUSADA: [],
  ORCAMENTO_APROVADO: ['AGUARDANDO_PECAS', 'EM_EXECUCAO'],
  AGUARDANDO_PECAS: ['EM_EXECUCAO'],
  EM_EXECUCAO: ['AGUARDANDO_AUTORIZACAO_ADICIONAL', 'EM_CONTROLE_QUALIDADE'],
  AGUARDANDO_AUTORIZACAO_ADICIONAL: ['EM_EXECUCAO'],
  EM_CONTROLE_QUALIDADE: ['EM_EXECUCAO', 'PRONTO_PARA_PAGAMENTO'],
  PRONTO_PARA_PAGAMENTO: ['PAGO_AGUARDANDO_ENTREGA'],
  PAGO_AGUARDANDO_ENTREGA: ['ENCERRADA_CONCLUIDA'],
  ENCERRADA_CONCLUIDA: [],
};

export interface TransitionValidation {
  ok: boolean;
  error?: string;
  ruleRef?: string;
}

export function canTransition(from: OSState, to: OSState): TransitionValidation {
  if (from === to) return { ok: true };
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      error: `Transição BPMN bloqueada: não é permitido avançar de "${OS_STATE_META[from].label}" diretamente para "${OS_STATE_META[to].label}".`,
      ruleRef: 'BPMN State Machine',
    };
  }
  return { ok: true };
}

// RN01: Capacidade de 4 boxes, 1 veículo por box/horário
export function validateBoxCapacity(
  appointments: Appointment[],
  box: BoxNumber,
  date: string,
  time: string,
  ignoreId?: string
): TransitionValidation {
  const conflict = appointments.find(
    (a) =>
      a.id !== ignoreId &&
      a.box === box &&
      a.date === date &&
      a.time === time &&
      a.status !== 'Recusado'
  );
  if (conflict) {
    return {
      ok: false,
      error: `RN01: O Box ${box} já está ocupado em ${date} às ${time} (${conflict.id} · ${conflict.vehicleLabel}).`,
      ruleRef: 'RN01',
    };
  }
  return { ok: true };
}

// RN04 & RN05: Avarias exigem foto anexada; termo precisa de assinatura
export function validateInspectionForTerm(os: ServiceOrder): TransitionValidation {
  const missingPhoto = os.inspection.damages.find((d) => !d.photoDataUrl);
  if (missingPhoto) {
    return {
      ok: false,
      error: `RN05: A avaria #${missingPhoto.number} (${missingPhoto.location}) exige foto anexada antes de emitir o Termo de Recebimento.`,
      ruleRef: 'RN05',
    };
  }
  if (os.inspection.mileage <= 0) {
    return {
      ok: false,
      error: 'RN04: Informe a quilometragem válida do veículo no check-in.',
      ruleRef: 'RN04',
    };
  }
  return { ok: true };
}

// RN07: Orçamento só após horas estimadas E consulta de peças
export function validateReadyForQuote(os: ServiceOrder): TransitionValidation {
  const baseServices = os.services.filter((s) => !s.isAdditional);
  const totalHours = baseServices.reduce((acc, s) => acc + s.hours, 0);
  if (totalHours <= 0 || !os.diagnosis.completedAt) {
    return {
      ok: false,
      error: 'RN07: O mecânico precisa concluir o diagnóstico com estimativa de horas antes da emissão do orçamento.',
      ruleRef: 'RN07',
    };
  }
  if (!os.diagnosis.partsQueried) {
    return {
      ok: false,
      error: 'RN07: É obrigatório consultar estoque, preço e prazo das peças antes de emitir o orçamento.',
      ruleRef: 'RN07',
    };
  }
  return { ok: true };
}

// RN10: Desconto > 10% exige aprovação do Gestor
export function requiresManagerDiscountApproval(discountPercent: number): boolean {
  return discountPercent > 10;
}

// RN14: Compra > R$ 1.500,00 exige aprovação do Gestor
export function requiresManagerPurchaseApproval(totalValue: number): boolean {
  return totalValue > 1500;
}

// RN19: Qualidade obrigatória antes de ir para cobrança
export function validateQualityChecklist(os: ServiceOrder): TransitionValidation {
  const q = os.quality;
  if (!q.roadTest5km || !q.brakingNoNoise || !q.noLeaksAbsOff || !q.cleaningDone) {
    return {
      ok: false,
      error: 'RN19: Todos os itens obrigatórios do Controle de Qualidade devem ser marcados para aprovação.',
      ruleRef: 'RN19',
    };
  }
  if (!q.finalReport.trim()) {
    return {
      ok: false,
      error: 'RN19: Preencha o Laudo Final de qualidade antes de liberar o veículo para cobrança.',
      ruleRef: 'RN19',
    };
  }
  return { ok: true };
}

// RN20 & RN21: Encerramento exige pagamento validado, qualidade aprovada, termo assinado
export function validateCloseOS(os: ServiceOrder): TransitionValidation {
  if (os.quality.status !== 'Aprovado') {
    return {
      ok: false,
      error: 'RN19: A OS não pode ser encerrada sem aprovação no Controle de Qualidade.',
      ruleRef: 'RN19',
    };
  }
  if (os.payment.status !== 'Validado') {
    return {
      ok: false,
      error: 'RN20: É obrigatório validar o pagamento no gateway (PIX/Cartão) antes de encerrar a OS.',
      ruleRef: 'RN20',
    };
  }
  if (!os.delivery.termSignedByClient) {
    return {
      ok: false,
      error: 'RN21: O cliente precisa assinar eletronicamente o Termo de Entrega antes do encerramento.',
      ruleRef: 'RN21',
    };
  }
  return { ok: true };
}

// Helpers financeiros
export function calculateOSTotals(os: ServiceOrder) {
  const baseServices = os.services.filter((s) => !s.isAdditional);
  const additionalServices = os.services.filter(
    (s) => s.isAdditional && s.additionalStatus === 'Autorizado'
  );
  const pendingAdditional = os.services.filter(
    (s) => s.isAdditional && s.additionalStatus === 'Pendente aprovação cliente'
  );

  const laborTotal = baseServices.reduce((sum, s) => sum + s.hours * s.hourlyRate, 0);
  const partsTotal = os.parts.reduce((sum, p) => sum + p.qty * p.unitPrice, 0);
  const quoteSubtotal = laborTotal + partsTotal;

  const discountApplied =
    os.quote.discountStatus === 'Aprovado Atendente' ||
    os.quote.discountStatus === 'Aprovado Gestor'
      ? (quoteSubtotal * os.quote.discountPercent) / 100
      : 0;

  const approvedQuoteTotal = quoteSubtotal - discountApplied;
  const additionalTotal = additionalServices.reduce(
    (sum, s) => sum + s.hours * s.hourlyRate,
    0
  );
  const pendingAdditionalTotal = pendingAdditional.reduce(
    (sum, s) => sum + s.hours * s.hourlyRate,
    0
  );
  const finalTotal = approvedQuoteTotal + additionalTotal;

  return {
    laborTotal,
    partsTotal,
    quoteSubtotal,
    discountApplied,
    approvedQuoteTotal,
    additionalTotal,
    pendingAdditionalTotal,
    finalTotal,
    totalEstimatedHours: baseServices.reduce((sum, s) => sum + s.hours, 0),
    totalWorkedHours: os.services.reduce((sum, s) => sum + (s.workedHours ?? 0), 0),
  };
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
