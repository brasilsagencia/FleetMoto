import React from 'react';
import {
  LayoutDashboard,
  Users,
  Bike,
  FileCheck,
  Award,
  Building2,
  Navigation,
  Layers,
  Wallet,
  FileSpreadsheet,
  Smartphone,
  ShieldCheck,
  Settings,
  ChevronRight,
  Sparkles,
  Radio,
  X,
  LogOut,
  LogIn,
  Package,
  Boxes,
  Warehouse,
  ShoppingCart,
} from 'lucide-react';
import { Usuario } from '../types';

export type TabType =
  | 'dashboard'
  | 'comites'
  | 'rotas_clientes'
  | 'pedidos'
  | 'estoque'
  | 'expedicao'
  | 'destinos'
  | 'entregas'
  | 'motoboys'
  | 'motos'
  | 'documentos'
  | 'adesivagem'
  | 'financeiro'
  | 'relatorios'
  | 'motoboy_app'
  | 'usuarios'
  | 'auditoria'
  | 'configuracoes';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: Usuario;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  urgentCount?: number;
  activeDeliveriesCount?: number;
  ordersCount?: number;
  expeditionCount?: number;
  stockAlertCount?: number;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  isAuthenticated?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isOpenMobile,
  onCloseMobile,
  urgentCount = 2,
  activeDeliveriesCount = 4,
  ordersCount,
  expeditionCount,
  stockAlertCount,
  onLogout,
  onOpenLogin,
  isAuthenticated = true,
}) => {
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comites' as TabType, label: 'Clientes', icon: Building2, badge: '6' },
    {
      id: 'rotas_clientes' as TabType,
      label: 'Criação de Rotas',
      icon: Navigation,
      badge: '4 Regiões',
      badgeColor: 'bg-[#E05328] text-white font-bold',
    },
    {
      id: 'pedidos' as TabType,
      label: 'Pedidos',
      icon: Package,
      badge: ordersCount !== undefined && ordersCount > 0 ? `${ordersCount}` : 'Novo',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'estoque' as TabType,
      label: 'Estoque',
      icon: Warehouse,
      badge: stockAlertCount !== undefined && stockAlertCount > 0 ? `${stockAlertCount} baixo` : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'expedicao' as TabType,
      label: 'Expedição',
      icon: Boxes,
      badge: expeditionCount !== undefined && expeditionCount > 0 ? `${expeditionCount}` : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'destinos' as TabType,
      label: 'Destinos & Materiais',
      icon: Layers,
      badge: '6 opções',
      badgeColor: 'bg-slate-700 text-slate-200',
    },

    {
      id: 'entregas' as TabType,
      label: 'Entregas e Rotas',
      icon: Navigation,
      badge: activeDeliveriesCount > 0 ? `${activeDeliveriesCount} ativas` : undefined,
      badgeColor: 'bg-[#E05328] text-white',
    },
    { id: 'motoboys' as TabType, label: 'Motoboys', icon: Users, badge: '5' },
    { id: 'motos' as TabType, label: 'Inclusão de Motos', icon: Bike },
    { id: 'adesivagem' as TabType, label: 'Adesivagem Eleitoral', icon: Award, alert: true },
    { id: 'documentos' as TabType, label: 'Documentos & TSE', icon: FileCheck },
    { id: 'financeiro' as TabType, label: 'Financeiro', icon: Wallet },
    { id: 'relatorios' as TabType, label: 'Prestação de Contas (TSE)', icon: FileSpreadsheet },
    {
      id: 'motoboy_app' as TabType,
      label: 'Área do Motoboy (POD)',
      icon: Smartphone,
      highlight: true,
    },
    { id: 'usuarios' as TabType, label: 'Usuários & Acessos', icon: ShieldCheck },
    { id: 'auditoria' as TabType, label: 'Logs de Auditoria (Firestore)', icon: FileCheck, badge: 'Real-time' },
    { id: 'configuracoes' as TabType, label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1A1A1E] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 pb-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E05328] to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/40">
              <Bike className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white font-sans">
                  Fleet<span className="text-[#E05328]">Moto</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-[#E05328] border border-orange-500/30">
                  TSE 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Logística & Material de Campanha
              </p>
            </div>
          </div>

          <button
            id="close-mobile-sidebar-btn"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Operations Indicator */}
        <div className="px-4 py-2.5 bg-[#141417] border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">GPS Logística Ativo</span>
          </div>
          {urgentCount > 0 && (
            <span className="text-[11px] text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-800/40 font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-orange-400 animate-pulse" />
              {urgentCount} urgentes
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Operações Principais
          </div>

          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group text-left ${
                  isActive
                    ? 'bg-[#E05328] text-white shadow-md shadow-orange-950/50 font-semibold'
                    : item.highlight
                    ? 'bg-slate-800/70 text-orange-300 hover:bg-slate-800 hover:text-white border border-orange-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-orange-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-black/20 text-white'
                          : item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.alert && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="p-3 bg-[#141417] border-t border-slate-800/80 space-y-2">
          {isAuthenticated ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.nome}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.nome}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {currentUser.papel}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  id="sidebar-logout-btn"
                  onClick={onLogout}
                  title="Sair da Conta (Logout)"
                  className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/40 border border-transparent hover:border-rose-700/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              id="sidebar-open-login-btn"
              onClick={onOpenLogin}
              className="w-full py-2 px-3 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar / Login</span>
            </button>
          )}

          {isAuthenticated && (
            <div className="flex items-center justify-between px-1 text-[11px]">
              <button
                onClick={() => onSelectTab('usuarios')}
                className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Permissões</span>
              </button>
              <button
                onClick={onLogout}
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
