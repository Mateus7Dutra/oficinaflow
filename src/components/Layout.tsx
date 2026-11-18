import React, { useState } from 'react';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  History,
  LogOut,
  Menu,
  PackageCheck,
  Receipt,
  ShieldAlert,
  Stethoscope,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { USER_PROFILES } from '../data/seedData';
import { OS_STATE_META } from '../engine/stateMachine';
import type { ScreenId, UserRole } from '../types/oficina';

interface MenuItem {
  screen: ScreenId;
  label: string;
  shortCode: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const SCREEN_HEADERS: Record<ScreenId, { title: string; subtitle: string }> = {
  S01: { title: 'Login e Seleção de Perfil', subtitle: 'Acesso corporativo OficinaFlow (BPMN 2.0)' },
  S02: {
    title: 'Novo Agendamento e Meus Agendamentos',
    subtitle: 'P1 · Agende seu serviço, escolha data/horário e acompanhe protocolos e propostas',
  },
  S03: {
    title: 'Agenda da Oficina (4 Boxes)',
    subtitle: 'P1 · Grade horária com controle de capacidade (1 veículo por box/faixa · RN01)',
  },
  S04: {
    title: 'Check-in e Vistoria do Veículo',
    subtitle: 'P2 · Registro de documentos, avarias com foto obrigatória (RN05) e emissão do Termo',
  },
  S05: {
    title: 'Termo de Recebimento e Acompanhamento',
    subtitle: 'P2 · Conferência do check-in, assinatura eletrônica (RN04) e linha do tempo da OS',
  },
  S06: {
    title: 'Diagnóstico Técnico da OS',
    subtitle: 'P3 · Scanner OBD, achados, estimativa de horas e peças necessárias (RN07–RN08)',
  },
  S07: {
    title: 'Montagem e Emissão do Orçamento',
    subtitle: 'P3 · Consolidação de mão de obra e peças, alçada de desconto (10%) e validade de 5 dias',
  },
  S08: {
    title: 'Aprovação do Orçamento',
    subtitle: 'P4 · Analise itens, prazos e garantia (90 dias) para aprovar, negociar ou recusar',
  },
  S09: {
    title: 'Aprovações Pendentes (Alçadas)',
    subtitle: 'Governança · Descontos acima de 10% (RN10) e compras acima de R$ 1.500,00 (RN14)',
  },
  S10: {
    title: 'Cotações, Pedido e Recebimento',
    subtitle: 'P5 · Reserva de peças, mapa comparativo de fornecedores e conferência de NF-e',
  },
  S11: {
    title: 'Portal do Fornecedor',
    subtitle: 'P5 · Resposta a cotações, anexo de NF-e, despacho e tratamento de trocas',
  },
  S12: {
    title: 'Execução e Controle de Qualidade',
    subtitle: 'P6 · Apontamento de horas/peças, serviços adicionais (RN18) e laudo obrigatório (RN19)',
  },
  S13: {
    title: 'Cobrança, Pagamento e Entrega',
    subtitle: 'P6 · Validação no gateway (PIX/Cartão), termo de entrega e encerramento com NF-e',
  },
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentRole,
    currentUser,
    currentScreen,
    navigate,
    switchRole,
    logout,
    setAuditDrawerOpen,
    os,
    appointments,
    managerApprovals,
  } = useOficina();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingApprovals = managerApprovals.filter((a) => a.status === 'Pendente').length;
  const proposedAppointments = appointments.filter((a) => a.status === 'Proposta de nova data').length;

  const menusByRole: Record<UserRole, MenuItem[]> = {
    cliente: [
      { screen: 'S02', label: 'Meus Agendamentos', shortCode: 'S02', icon: CalendarClock, badge: proposedAppointments || undefined },
      { screen: 'S05', label: 'Termo e Acompanhamento', shortCode: 'S05', icon: FileCheck2 },
      { screen: 'S08', label: 'Aprovação de Orçamento', shortCode: 'S08', icon: FileSpreadsheet },
      { screen: 'S13', label: 'Pagamento e Retirada', shortCode: 'S13', icon: Receipt },
    ],
    atendente: [
      { screen: 'S03', label: 'Agenda da Oficina', shortCode: 'S03', icon: Calendar },
      { screen: 'S04', label: 'Check-in e Vistoria', shortCode: 'S04', icon: ClipboardCheck },
      { screen: 'S07', label: 'Montagem de Orçamento', shortCode: 'S07', icon: FileSpreadsheet },
      { screen: 'S13', label: 'Cobrança e Entrega', shortCode: 'S13', icon: Receipt },
    ],
    mecanico: [
      { screen: 'S06', label: 'Diagnóstico da OS', shortCode: 'S06', icon: Stethoscope },
      { screen: 'S12', label: 'Execução e Qualidade', shortCode: 'S12', icon: Wrench },
    ],
    compras: [
      { screen: 'S10', label: 'Cotações e Recebimento', shortCode: 'S10', icon: PackageCheck },
    ],
    gestor: [
      { screen: 'S09', label: 'Aprovações Pendentes', shortCode: 'S09', icon: ShieldAlert, badge: pendingApprovals || undefined },
    ],
    fornecedor: [
      { screen: 'S11', label: 'Portal do Fornecedor', shortCode: 'S11', icon: Truck },
    ],
  };

  const menuItems = menusByRole[currentRole];
  const headerInfo = SCREEN_HEADERS[currentScreen];
  const stateMeta = OS_STATE_META[os.state];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#0F2942] text-white">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center text-[#0F2942] shadow-md">
            <Wrench className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight leading-none">
              Oficina<span className="text-[#F59E0B]">Flow</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">Gestão BPMN 2.0</div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-slate-300 hover:text-white"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill */}
      <div className="px-5 py-3 border-b border-white/10 bg-[#0A1C2E]/50">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          Perfil Ativo
        </div>
        <div className="text-sm font-semibold text-white mt-0.5 flex items-center justify-between">
          <span>{currentUser.label}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] font-semibold">
            {currentUser.initials}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          Telas do Processo
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => {
                navigate(item.screen);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-[#F59E0B] text-[#0F2942] shadow-sm font-semibold'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {item.badge ? (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      active ? 'bg-[#0F2942] text-white' : 'bg-[#F59E0B] text-[#0F2942]'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
                <span
                  className={`text-[10px] font-mono ${
                    active ? 'text-[#0F2942]/70' : 'text-slate-400'
                  }`}
                >
                  {item.shortCode}
                </span>
              </span>
            </button>
          );
        })}

        {/* OS Status Card in Sidebar */}
        <div className="pt-5">
          <div className="mx-1 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">OS em Foco</span>
              <span className="font-mono font-semibold text-[#F59E0B]">{os.id}</span>
            </div>
            <div className="text-xs font-medium text-white truncate">
              {os.vehicleModel} · {os.plate}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-white/10 text-slate-100 w-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span className="truncate">{stateMeta.label}</span>
            </div>
            <button
              onClick={() => {
                setAuditDrawerOpen(true);
                setMobileOpen(false);
              }}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition"
            >
              <History className="w-3.5 h-3.5 text-[#F59E0B]" />
              Trilha de Auditoria
            </button>
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Voltar para Login (S01)
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F4F7FA] overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 fixed inset-y-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">{SidebarContent}</div>
          <div className="flex-1 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-3 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-[#0F2942] truncate">
                  {headerInfo.title}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">{headerInfo.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Audit Quick Button (PC & Mobile) */}
              <button
                onClick={() => setAuditDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                title="Abrir Trilha de Auditoria"
              >
                <History className="w-3.5 h-3.5 text-[#0F2942]" />
                <span className="hidden sm:inline">Auditoria</span>
              </button>

              {/* Quick Profile Switcher */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="role-switcher" className="sr-only">
                  Trocar perfil
                </label>
                <select
                  id="role-switcher"
                  value={currentRole}
                  onChange={(e) => switchRole(e.target.value as UserRole)}
                  className="text-xs font-medium bg-[#F4F7FA] border border-slate-300 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-700 max-w-[145px] sm:max-w-none focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
                  title="Troca rápida de perfil para demonstração"
                >
                  {USER_PROFILES.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.label} ({p.initials})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-[#0F2942] text-white text-xs font-bold flex items-center justify-center ring-2 ring-[#F59E0B]/50 shrink-0">
                  {currentUser.initials}
                </div>
                <div className="hidden md:block leading-tight">
                  <div className="text-xs font-semibold text-slate-800">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.label}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">{children}</main>

        {/* Discrete Footer */}
        <footer className="px-4 sm:px-6 py-3 border-t border-[#E2E8F0] bg-white/80 text-xs text-slate-500 flex items-center justify-between">
          <span>Perfil: {currentUser.label}</span>
          <span className="font-mono">{currentScreen} · protótipo OficinaFlow</span>
        </footer>
      </div>
    </div>
  );
};
