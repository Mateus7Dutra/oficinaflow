import React, { useState } from 'react';
import {
  Briefcase,
  Lock,
  Mail,
  Package,
  ShieldCheck,
  Truck,
  User,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useOficina } from '../context/OficinaContext';
import { USER_PROFILES } from '../data/seedData';
import type { UserRole } from '../types/oficina';

const ROLE_ICONS: Record<UserRole, React.FC<{ className?: string }>> = {
  cliente: User,
  atendente: UserCheck,
  mecanico: Wrench,
  compras: Package,
  gestor: Briefcase,
  fornecedor: Truck,
};

export const S01Login: React.FC = () => {
  const { login } = useOficina();
  const [selectedRole, setSelectedRole] = useState<UserRole>('cliente');
  const [email, setEmail] = useState<string>(USER_PROFILES[0].email);
  const [password, setPassword] = useState<string>('••••••••••••');
  const [keepConnected, setKeepConnected] = useState<boolean>(true);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const prof = USER_PROFILES.find((u) => u.role === role);
    if (prof) setEmail(prof.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
  };

  const selectedProfile = USER_PROFILES.find((u) => u.role === selectedRole)!;

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-between">
      {/* Top Corporate Strip */}
      <div className="bg-[#0F2942] text-white py-5 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center text-[#0F2942] shadow">
              <Wrench className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">
                Oficina<span className="text-[#F59E0B]">Flow</span>
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Gestão de Oficinas Mecânicas · Processos BPMN 2.0 (P1 a P6)
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>21 Regras de Negócio Ativas · PWA</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 6 Profile Cards */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                Etapa 1 · Selecione o perfil de acesso
              </span>
              <h2 className="text-lg font-bold text-[#0F2942] mt-0.5">
                Escolha o ator do processo BPMN
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Cada perfil acessa suas telas dedicadas com dados pré-carregados da OS-2026-0412.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {USER_PROFILES.map((profile) => {
                const Icon = ROLE_ICONS[profile.role];
                const isSelected = selectedRole === profile.role;
                return (
                  <button
                    key={profile.role}
                    type="button"
                    onClick={() => handleSelectRole(profile.role)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-[#0F2942] bg-[#0F2942]/[0.03] shadow-sm ring-2 ring-[#F59E0B]/40'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#0F2942] text-[#F59E0B]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#0F2942]">{profile.label}</div>
                          <div className="text-xs text-slate-500">{profile.name}</div>
                        </div>
                      </div>
                      <span
                        className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#F59E0B] text-[#0F2942]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {profile.initials}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {profile.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Etapa 2 · Autenticação
              </span>
              <h2 className="text-lg font-bold text-[#0F2942] mt-0.5">
                Entrar como {selectedProfile.label}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Usuário demonstrativo: <strong className="text-slate-700">{selectedProfile.name}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2942] bg-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepConnected}
                  onChange={(e) => setKeepConnected(e.target.checked)}
                  className="rounded border-slate-300 text-[#0F2942] focus:ring-[#0F2942]"
                />
                <span>Manter conectado</span>
              </label>

              <div className="p-3 rounded-lg bg-[#F4F7FA] border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F2942] shrink-0 mt-0.5" />
                <span>
                  Ao entrar você concorda com o uso dos seus dados conforme a{' '}
                  <strong className="text-[#0F2942]">LGPD</strong> (Lei nº 13.709/2018) para gestão
                  de agendamentos, ordens de serviço e trilha de auditoria.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0F2942] hover:bg-[#1A3A5C] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                Entrar no OficinaFlow
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-[#E2E8F0] bg-white text-xs text-slate-500 flex items-center justify-between">
        <span>Perfil: Seleção de Acesso</span>
        <span className="font-mono">S01 · protótipo OficinaFlow</span>
      </footer>
    </div>
  );
};
