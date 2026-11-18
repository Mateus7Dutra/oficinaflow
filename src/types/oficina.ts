export type UserRole =
  | 'cliente'
  | 'atendente'
  | 'mecanico'
  | 'compras'
  | 'gestor'
  | 'fornecedor';

export type ScreenId =
  | 'S01'
  | 'S02'
  | 'S03'
  | 'S04'
  | 'S05'
  | 'S06'
  | 'S07'
  | 'S08'
  | 'S09'
  | 'S10'
  | 'S11'
  | 'S12'
  | 'S13';

export interface UserProfile {
  role: UserRole;
  label: string;
  name: string;
  initials: string;
  email: string;
  description: string;
  defaultScreen: ScreenId;
}

export type OSState =
  | 'AGENDADO'
  | 'CHECKIN_EM_ANDAMENTO'
  | 'AGUARDANDO_TERMO'
  | 'TERMO_CONTESTADO'
  | 'OS_ABERTA'
  | 'EM_DIAGNOSTICO'
  | 'ENCERRADA_SEM_REPARO'
  | 'AGUARDANDO_ORCAMENTO'
  | 'ORCAMENTO_EMITIDO'
  | 'AGUARDANDO_APROVACAO_DESCONTO'
  | 'ENCERRADA_RECUSADA'
  | 'ORCAMENTO_APROVADO'
  | 'AGUARDANDO_PECAS'
  | 'EM_EXECUCAO'
  | 'AGUARDANDO_AUTORIZACAO_ADICIONAL'
  | 'EM_CONTROLE_QUALIDADE'
  | 'PRONTO_PARA_PAGAMENTO'
  | 'PAGO_AGUARDANDO_ENTREGA'
  | 'ENCERRADA_CONCLUIDA';

export type BoxNumber = 1 | 2 | 3 | 4;

export interface Vehicle {
  id: string;
  clientName: string;
  clientEmail: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  history: VehicleHistoryEntry[];
}

export interface VehicleHistoryEntry {
  id: string;
  date: string;
  osNumber: string;
  summary: string;
  totalValue: number;
  mileage: number;
  nfeNumber?: string;
}

export type AppointmentStatus =
  | 'Confirmado'
  | 'Proposta de nova data'
  | 'Aguardando confirmação'
  | 'Recusado'
  | 'Check-in realizado';

export interface Appointment {
  id: string; // AG-2026-XXXX
  clientName: string;
  clientEmail: string;
  vehicleLabel: string;
  plate: string;
  serviceType: string;
  date: string; // Ex: Qui 19/11
  time: string; // Ex: 09:00
  box: BoxNumber | null;
  status: AppointmentStatus;
  notes: string;
  reminder24h: boolean;
  proposedDate?: string;
  proposedTime?: string;
  isEncaixe?: boolean;
}

export interface DamageItem {
  id: string;
  number: number;
  location: string;
  description: string;
  x: number; // % on car diagram
  y: number; // % on car diagram
  photoDataUrl: string;
  photoName: string;
  clientConfirmed: boolean | null; // true = confere, false = contestado, null = pendente
}

export interface EntryChecklist {
  crlv: boolean;
  clientDoc: boolean;
  noCriticalDashLights: boolean;
  spareTireJack: boolean;
  valuablesRemoved: boolean;
}

export interface InspectionData {
  mileage: number;
  fuelLevel: 'Reserva' | '1/4' | '1/2' | '3/4' | 'Cheio';
  keysCount: number;
  damages: DamageItem[];
  checklist: EntryChecklist;
  termIssuedAt?: string;
  termSignedAt?: string;
  termSignedChannel?: string;
  clientDisputeComment?: string;
  revisionCount: number;
}

export interface ServiceItem {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
  done?: boolean;
  workedHours?: number;
  isAdditional?: boolean;
  additionalStatus?: 'Pendente aprovação cliente' | 'Autorizado' | 'Recusado';
}

export interface PartItem {
  id: string;
  code: string;
  name: string;
  qty: number;
  unitPrice: number;
  stockStatus: 'Em estoque' | 'Sob encomenda';
  leadTimeDays: number;
  reservedQty: number;
  applied?: boolean;
}

export interface DiagnosisData {
  obdCodes: string[];
  findings: string;
  photos: { id: string; label: string; dataUrl: string }[];
  completedAt?: string;
  partsQueried: boolean;
  inconclusive?: boolean;
  inconclusiveReason?: string;
}

export interface QuoteData {
  code: string; // ORC-2026-0412
  issuedAt?: string;
  validUntil?: string;
  validityDays: number; // RN09: 5 dias
  warrantyDays: number; // 90 dias
  deliveryEstimate: string;
  discountPercent: number;
  discountRequestedByClient?: boolean;
  clientNegotiationNote?: string;
  discountStatus: 'Nenhum' | 'Aprovado Atendente' | 'Aguardando Gestor' | 'Aprovado Gestor' | 'Mantido Gestor';
  status: 'Rascunho' | 'Emitido' | 'Aprovado' | 'Em negociação' | 'Recusado' | 'Expirado';
  acceptedAt?: string;
  acceptedChannel?: string;
  pdfGenerated?: boolean;
}

export interface QualityChecklist {
  roadTest5km: boolean;
  brakingNoNoise: boolean;
  noLeaksAbsOff: boolean;
  cleaningDone: boolean;
  finalReport: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  inspectedAt?: string;
  reworkCount: number;
}

export interface PaymentData {
  method: 'PIX' | 'Cartão de crédito' | 'Débito';
  status: 'Pendente' | 'Validado' | 'Recusado';
  gatewayTransactionId?: string;
  paidAt?: string;
  failureReason?: string;
}

export interface DeliveryData {
  qualityApproved: boolean;
  paymentValidated: boolean;
  servicesExplained: boolean;
  termSignedByClient: boolean;
  termSignedAt?: string;
  vehicleDeliveredAt?: string;
  nfeNumber?: string;
  closedAt?: string;
}

export interface ServiceOrder {
  id: string; // OS-2026-0412
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  vehicleModel: string;
  plate: string;
  box: BoxNumber;
  complaint: string;
  state: OSState;
  createdAt: string;
  inspection: InspectionData;
  diagnosis: DiagnosisData;
  services: ServiceItem[];
  parts: PartItem[];
  quote: QuoteData;
  quality: QualityChecklist;
  payment: PaymentData;
  delivery: DeliveryData;
}

export interface SupplierQuoteOption {
  id: string;
  supplierName: string;
  unitPriceTotal: number;
  leadTimeDays: number;
  warrantyMonths: number;
  status: 'Recebida' | 'Aguardando' | 'Sem estoque';
  selected?: boolean;
}

export interface NfeReceiptItem {
  id: string;
  partCode: string;
  partName: string;
  orderedQty: number;
  receivedQty: number;
  status: 'Conforme' | 'Modelo divergente' | 'Troca solicitada' | 'Entrada confirmada';
  osId: string;
}

export interface PurchaseOrder {
  id: string; // PC-2026-088
  quoteCode: string; // COT-2026-231
  osId: string;
  partSummary: string;
  totalValue: number;
  selectedSupplier: string;
  approvalStatus: 'Não requerida' | 'Aguardando Gestor' | 'Aprovada' | 'Reprovada';
  orderStatus: 'Em cotação' | 'Aguardando aprovação' | 'Emitido ao fornecedor' | 'Despachado' | 'Recebido e reservado';
  nfeFile?: string;
  trackingCode?: string;
  exchangeOpen?: boolean;
  exchangeResolved?: boolean;
  supplierQuotes: SupplierQuoteOption[];
  nfeItems: NfeReceiptItem[];
}

export interface ManagerApprovalItem {
  id: string;
  type: 'DESCONTO' | 'COMPRA';
  refCode: string;
  osId: string;
  title: string;
  requestedBy: string;
  requestedAt: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  justification?: string;
  // Desconto fields
  originalTotal?: number;
  discountPercent?: number;
  currentMargin?: number;
  projectedMargin?: number;
  clientHistorySummary?: string;
  // Compra fields
  purchaseTotal?: number;
  recommendedSupplier?: string;
  supplierComparison?: { supplier: string; price: number; days: number; warranty: string }[];
}

export interface AuditEvent {
  id: string;
  osId: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  channel: 'Web App' | 'Portal Cliente' | 'Portal Fornecedor' | 'Sistema (BPMN)' | 'Gateway Pagamento';
  action: string;
  fromState: OSState | 'INICIO';
  toState: OSState;
  ruleRef?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
}
