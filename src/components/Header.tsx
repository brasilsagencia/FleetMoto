import React from 'react';
import {
  Menu,
  Bell,
  Search,
  Plus,
  Smartphone,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  LogOut,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { TabType } from './Sidebar';
import { Usuario } from '../types';

interface HeaderProps {
  currentTab: TabType;
  onOpenMobileMenu: () => void;
  onSelectTab: (tab: TabType) => void;
  onQuickNewComite: () => void;
  onQuickNewEntrega: () => void;
  currentUser: Usuario;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  isAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onSelectTab,
  onQuickNewComite,
  onQuickNewEntrega,
  currentUser,
  searchTerm,
  onSearchChange,
  onLogout,
  onOpenLogin,
  isAuthenticated = true,
}) => {
  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Dashboard Operacional',
          subtitle: 'Visão em tempo real de distribuição de material eleitoral',
        };
      case 'comites':
        return {
          title: 'Clientes',
          subtitle: 'Cadastro de candidatos, partidos, CNPJ de campanha e rotas contratadas',
        };
      case 'pedidos':
        return {
          title: 'Gestão de Pedidos',
          subtitle: 'Cadastre, acompanhe, separe, envie para expedição e gere entregas de materiais',
        };
      case 'estoque':
        return {
          title: 'Controle de Estoque & Armazém',
          subtitle: 'Cadastro de materiais, controle de saldos, entradas, saídas, reservas de pedidos, avarias e inventário',
        };
      case 'expedicao':
        return {
          title: 'Expedição & Separação de Materiais',
          subtitle: 'Separação de materiais, conferência de volumes, pesagem, controle de divergências e emissão de notas de entrega',
        };
      case 'destinos':
        return {
          title: 'Destinos & Opções de Material',
          subtitle: 'Despacho rápido: Perfurado, Revista, Cartão, Santão, Pragão e Adesivos 15x40',
        };
      case 'entregas':
        return {
          title: 'Entregas & Despacho de Material',
          subtitle: 'Perfurados, revistas, cartões, santões, pragões e adesivos 15x40 por zona eleitoral',
        };
      case 'motoboys':
        return {
          title: 'Cadastro de Motoboys',
          subtitle: 'Entregadores credenciados, CNH, placas e frotas',
        };
      case 'motos':
        return {
          title: 'Gestão da Frota & Baús',
          subtitle: 'Status operacional, revisões e capacidade de carga',
        };
      case 'adesivagem':
        return {
          title: 'Adesivagem de Campanha',
          subtitle: 'Validação e compliance de propaganda eleitoral em motos/baús',
        };
      case 'documentos':
        return {
          title: 'Documentos & TSE',
          subtitle: 'Autorizações, licenças, contratos e notas fiscais',
        };
      case 'financeiro':
        return {
          title: 'Controle Financeiro',
          subtitle: 'Faturamento de comitês e repasses diários a motoboys',
        };
      case 'relatorios':
        return {
          title: 'Prestação de Contas (TSE)',
          subtitle: 'Dossiês de comprovação de entrega com geolocalização e fotos',
        };
      case 'motoboy_app':
        return {
          title: 'Área do Motoboy (POD Mobile)',
          subtitle: 'Simulador de campo para confirmação com foto e assinatura digital',
        };
      case 'usuarios':
        return {
          title: 'Usuários & Permissões',
          subtitle: 'Controle de acesso por cargo e comitê eleitoral',
        };
      case 'auditoria':
        return {
          title: 'Logs de Auditoria & Trilha de Segurança',
          subtitle: 'Registros completos em tempo real gravados no Cloud Firestore',
        };
      case 'configuracoes':
        return {
          title: 'Configurações do Sistema',
          subtitle: 'Parâmetros de precificação por KM e regras da campanha 2026',
        };
      default:
        return {
          title: 'FleetMoto Gestão Eleitoral',
          subtitle: 'Sistema de Logística e Distribuição Eleitoral',
        };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="mobile-open-menu-btn"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight font-sans">
                {title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Eleições 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Mobile quick actions */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            onClick={() => onSelectTab('motoboy_app')}
            className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold"
            title="Abrir simulador do motoboy"
          >
            <Smartphone className="w-4 h-4 text-[#E05328]" />
          </button>
          <button
            onClick={onQuickNewEntrega}
            className="p-2 rounded-xl bg-[#E05328] text-white shadow-sm text-xs font-semibold"
            title="Nova Entrega"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right side tools */}
      <div className="flex items-center gap-2.5 justify-end">
        {/* Global search */}
        <div className="relative w-full md:w-64 lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Buscar cliente, motoboy, rota, material..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] transition-all"
          />
        </div>

        {/* Shortcut to Motoboy App */}
        <button
          id="toggle-motoboy-app-btn"
          onClick={() => onSelectTab('motoboy_app')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            currentTab === 'motoboy_app'
              ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
              : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/80'
          }`}
          title="Ver como o motoboy enxerga no celular (POD / Assinatura)"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#E05328]" />
          <span>Visão Motoboy (POD)</span>
        </button>

        {/* New Delivery button */}
        <button
          id="header-nova-entrega-btn"
          onClick={onQuickNewEntrega}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Nova Entrega</span>
        </button>

        {/* New Cliente button */}
        <button
          id="header-novo-comite-btn"
          onClick={onQuickNewComite}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>+ Novo Cliente</span>
        </button>

        {/* Election countdown badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-orange-600" />
          <span>Turno Único: <strong className="text-slate-900 font-semibold">04/Out</strong></span>
        </div>

        {/* User Auth Action (Logout / Login) */}
        {isAuthenticated ? (
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
            <button
              id="header-profile-btn"
              onClick={() => onSelectTab('usuarios')}
              className="hidden md:flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title={`${currentUser.nome} (${currentUser.papel})`}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.nome}
                className="w-7 h-7 rounded-lg object-cover border border-slate-300 shrink-0"
              />
              <div className="text-left leading-tight hidden lg:block">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{currentUser.nome.split(' ')[0]}</p>
                <p className="text-[10px] text-emerald-600 font-semibold">{currentUser.papel}</p>
              </div>
            </button>

            {/* Prominent Sair (Logout) Button */}
            <button
              id="header-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Sair da Conta (Logout)"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        ) : (
          <button
            id="header-login-btn"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar / Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
