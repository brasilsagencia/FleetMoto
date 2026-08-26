import React, { useState, useEffect } from 'react';
import {
  Comite,
  Motoboy,
  Moto,
  Entrega,
  Pedido,
  RegistroAdesivagem,
  DocumentoEleitoral,
  TransacaoFinanceira,
  Usuario,
  ConfiguracaoGeral,
  StatusEntrega,
} from './types';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { ComitesView } from './components/ComitesView';
import { PedidosView } from './components/PedidosView';
import { EstoqueView } from './components/EstoqueView';
import { ExpedicaoView } from './components/ExpedicaoView';
import { DestinosMateriaisView } from './components/DestinosMateriaisView';
import { DashboardView } from './components/DashboardView';
import { EntregasView } from './components/EntregasView';
import { MotoboyAreaView } from './components/MotoboyAreaView';
import { MotoboysView } from './components/MotoboysView';
import { MotosView } from './components/MotosView';
import { AdesivagemView } from './components/AdesivagemView';
import { DocumentosView } from './components/DocumentosView';
import { FinanceiroView } from './components/FinanceiroView';
import { RelatoriosView } from './components/RelatoriosView';
import { UsuariosView } from './components/UsuariosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { AuditoriaView } from './components/AuditoriaView';
import { ComprovanteModal } from './components/ComprovanteModal';
import { LoginModal } from './components/LoginModal';
import { AuthProvider, useAuth } from './hooks/useAuth';
import {
  clientesRepo,
  motoboysRepo,
  veiculosRepo,
  entregasRepo,
  pedidosRepo,
  adesivosRepo,
  documentosRepo,
  pagamentosRepo,
  usuariosRepo,
  configuracoesRepo,
  logsAuditoriaRepo,
  StorageService
} from './repositories';
import { seedInitialFirebaseData } from './services/firebase/seed';
import { LogAuditoriaDoc } from './models/firebase.types';
import { Wifi, WifiOff, CloudCheck, RefreshCw, AlertCircle, LogIn, LogOut, Shield } from 'lucide-react';

function MainAppContent() {
  const { currentUser: authUser, userProfile, role, isOnline, switchRoleDebug, logout } = useAuth();

  // Navigation State - Default to 'comites'
  const [currentTab, setCurrentTab] = useState<TabType>('comites');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Firestore Real-Time States
  const [comites, setComites] = useState<Comite[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [adesivagens, setAdesivagens] = useState<RegistroAdesivagem[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoEleitoral[]>([]);
  const [financeiro, setFinanceiro] = useState<TransacaoFinanceira[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<LogAuditoriaDoc[]>([]);
  const [config, setConfig] = useState<ConfiguracaoGeral>({
    taxaBaseKm: 2.8,
    taxaMinimaRota: 25.0,
    adicionalUrgenciaPercentual: 35,
    diariaPadraoMotoboy: 180.0,
    limitePesoKgPorMoto: 35,
    rastreamentoGpsAoVivo: true,
    notificacaoWhatsAppAtiva: true,
    exigirAssinaturaPOD: true,
    exigirFotoPOD: true,
    cidadeOperacao: 'São Paulo - SP (Zonas Eleitorais 001 a 420)',
    eleicaoAno: '2026',
  });

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'sincronizado' | 'salvando' | 'offline'>('sincronizado');

  // Modals & Shortcuts
  const [selectedComiteForDelivery, setSelectedComiteForDelivery] = useState<Comite | null>(null);
  const [isNewEntregaModalTriggered, setIsNewEntregaModalTriggered] = useState(false);
  const [viewingPODEntrega, setViewingPODEntrega] = useState<Entrega | null>(null);

  // Initialize Firebase Seed & Subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function initFirestore() {
      try {
        await seedInitialFirebaseData();

        // 1. Clientes
        unsubs.push(
          clientesRepo.subscribe((data) => {
            setComites(data as unknown as Comite[]);
          })
        );

        // 1.1. Pedidos
        unsubs.push(
          pedidosRepo.subscribe((data) => {
            setPedidos(data as unknown as Pedido[]);
          })
        );

        // 2. Motoboys
        unsubs.push(
          motoboysRepo.subscribe((data) => {
            setMotoboys(data as unknown as Motoboy[]);
          })
        );

        // 3. Veiculos
        unsubs.push(
          veiculosRepo.subscribe((data) => {
            setMotos(data as unknown as Moto[]);
          })
        );

        // 4. Entregas
        unsubs.push(
          entregasRepo.subscribe((data) => {
            setEntregas(data as unknown as Entrega[]);
          })
        );

        // 5. Adesivos
        unsubs.push(
          adesivosRepo.subscribe((data) => {
            setAdesivagens(data as unknown as RegistroAdesivagem[]);
          })
        );

        // 6. Documentos
        unsubs.push(
          documentosRepo.subscribe((data) => {
            setDocumentos(data as unknown as DocumentoEleitoral[]);
          })
        );

        // 7. Pagamentos
        unsubs.push(
          pagamentosRepo.subscribe((data) => {
            setFinanceiro(data as unknown as TransacaoFinanceira[]);
          })
        );

        // 8. Usuarios
        unsubs.push(
          usuariosRepo.subscribe((data) => {
            setUsuarios(
              data.map((u) => ({
                id: u.id,
                nome: u.nome,
                email: u.email,
                papel: u.papelLegado || (u.role === 'gestor' ? 'Operador de Logística' : u.role === 'atendente' ? 'Fiscal de Campanha' : u.role === 'cliente' ? 'Representante Comitê' : 'Administrador'),
                status: u.status === 'inativo' ? 'inativo' : 'ativo',
                avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                ultimoAcesso: u.ultimoAcesso || 'Hoje às 08:30',
              }))
            );
          })
        );

        // 9. Logs Auditoria
        unsubs.push(
          logsAuditoriaRepo.subscribe((data) => {
            setLogsAuditoria(data);
          })
        );

        // 10. Configuracoes
        const configDoc = await configuracoesRepo.getById('geral');
        if (configDoc) {
          setConfig({
            taxaBaseKm: configDoc.taxaBaseKm,
            taxaMinimaRota: configDoc.taxaMinimaRota,
            adicionalUrgenciaPercentual: configDoc.adicionalUrgenciaPercentual,
            diariaPadraoMotoboy: configDoc.diariaPadraoMotoboy,
            limitePesoKgPorMoto: configDoc.limitePesoKgPorMoto,
            rastreamentoGpsAoVivo: configDoc.rastreamentoGpsAoVivo,
            notificacaoWhatsAppAtiva: configDoc.notificacaoWhatsAppAtiva,
            exigirAssinaturaPOD: configDoc.exigirAssinaturaPOD,
            exigirFotoPOD: configDoc.exigirFotoPOD,
            cidadeOperacao: configDoc.cidadeOperacao,
            eleicaoAno: configDoc.eleicaoAno,
          });
        }
      } catch (err) {
        console.error('Erro na sincronização Firestore:', err);
      } finally {
        setIsLoadingInitialData(false);
      }
    }

    initFirestore();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Sync state indication
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('sincronizado');
    }
  }, [isOnline]);

  // Current active user adapter
  const activeUser: Usuario = {
    id: userProfile?.id || authUser?.uid || 'usr-admin',
    nome: userProfile?.nome || authUser?.displayName || (authUser ? authUser.email?.split('@')[0] || 'Usuário Eleitoral' : 'Roberto Silveira (Admin)'),
    email: userProfile?.email || authUser?.email || 'roberto@fleetmoto.com.br',
    papel:
      role === 'gestor'
        ? 'Operador de Logística'
        : role === 'atendente'
        ? 'Fiscal de Campanha'
        : role === 'cliente'
        ? 'Representante Comitê'
        : 'Administrador',
    status: 'ativo',
    avatarUrl: userProfile?.avatarUrl || authUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    ultimoAcesso: 'Agora',
  };

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair da sua conta no FleetMoto?')) {
      await logout();
      setIsLoginModalOpen(true);
    }
  };

  // Handler: Add Comite in Firestore
  const handleAddComite = async (
    newComiteData: Omit<Comite, 'id' | 'totalEntregas' | 'volumeTotalMateriais' | 'dataCadastro'>
  ) => {
    setSyncStatus('salvando');
    try {
      // Uniqueness check
      const dup = await clientesRepo.checkDuplicate(newComiteData.telefone, newComiteData.cnpjCampanha);
      if (dup.isDuplicate) {
        alert(`Atenção: Já existe um cliente cadastrado com este ${dup.field}.`);
        return;
      }

      await clientesRepo.create(
        {
          ...newComiteData,
          totalEntregas: 0,
          volumeTotalMateriais: 0,
          dataCadastro: new Date().toISOString().slice(0, 10),
        },
        activeUser.id
      );
    } catch (err: any) {
      alert(`Erro ao salvar cliente no Firestore: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Update Comite in Firestore
  const handleUpdateComite = async (updated: Comite) => {
    setSyncStatus('salvando');
    try {
      const dup = await clientesRepo.checkDuplicate(updated.telefone, updated.cnpjCampanha, updated.id);
      if (dup.isDuplicate) {
        alert(`Atenção: Já existe outro cliente cadastrado com este ${dup.field}.`);
        return;
      }
      await clientesRepo.update(updated.id, updated as any, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao atualizar no Firestore: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Soft Delete Comite in Firestore
  const handleDeleteComite = async (id: string) => {
    if (!window.confirm('Confirma a exclusão lógica deste cliente? Os registros de entregas passadas serão preservados para prestação de contas.')) {
      return;
    }
    setSyncStatus('salvando');
    try {
      await clientesRepo.softDelete(id, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Add Delivery in Firestore with batch counter updates
  const handleAddEntrega = async (
    newEntregaData: Omit<Entrega, 'id' | 'codigoRastreio' | 'dataCriacao'>
  ) => {
    setSyncStatus('salvando');
    try {
      const nextNum = String(entregas.length + 900).padStart(4, '0');
      const codigoRastreio = `FM-2026-${nextNum}`;

      const entregaId = await entregasRepo.create(
        {
          ...newEntregaData,
          codigoRastreio,
          dataCriacao: new Date().toISOString(),
        } as any,
        activeUser.id
      );

      // If assigned to a motoboy at creation, update motoboy status
      if (newEntregaData.motoboyId) {
        await motoboysRepo.update(newEntregaData.motoboyId, { status: 'em_rota' }, activeUser.id);
      }
    } catch (err: any) {
      alert(`Erro ao registrar entrega no Firestore: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Update Delivery Status & Assignment in Firestore
  const handleUpdateStatusEntrega = async (
    entregaId: string,
    status: StatusEntrega,
    motoboyId?: string
  ) => {
    setSyncStatus('salvando');
    try {
      const selectedM = motoboys.find((m) => m.id === motoboyId);
      const payload: any = {
        status,
      };
      if (selectedM) {
        payload.motoboyId = selectedM.id;
        payload.motoboyNome = selectedM.nome;
        payload.motoboyPlaca = selectedM.placaMoto;
        payload.motoboyTelefone = selectedM.telefone;
      }
      await entregasRepo.update(entregaId, payload, activeUser.id);

      if (selectedM && status === 'em_transito') {
        await motoboysRepo.update(selectedM.id, { status: 'em_rota' }, activeUser.id);
      }
    } catch (err: any) {
      alert(`Erro ao atualizar entrega: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Complete Delivery (POD) via Firestore Transaction
  const handleCompleteDeliveryWithPOD = async (
    entregaId: string,
    podData: {
      fotoUrl: string;
      assinaturaBase64: string;
      nomeRecebedor: string;
      documentoRecebedor: string;
      telefoneRecebedor?: string;
      dataHora: string;
      localizacaoGps: string;
      notas?: string;
    }
  ) => {
    setSyncStatus('salvando');
    try {
      await entregasRepo.concluirEntregaComPOD(entregaId, podData, activeUser.id);
      alert('Comprovante de Entrega (POD) gravado com sucesso no Firebase!');
    } catch (err: any) {
      alert(`Erro ao concluir entrega: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Add Motoboy with Duplicate Checks in Firestore
  const handleAddMotoboy = async (
    newM: Omit<Motoboy, 'id' | 'totalEntregas' | 'avaliacao' | 'taxaPontualidade' | 'dataCadastro'>
  ) => {
    setSyncStatus('salvando');
    try {
      const dup = await motoboysRepo.checkDuplicate(newM.cpf, newM.telefone, newM.placaMoto);
      if (dup.isDuplicate) {
        alert(`Atenção: Já existe um motoboy cadastrado com este ${dup.field}.`);
        return;
      }

      await motoboysRepo.create(
        {
          ...newM,
          totalEntregas: 0,
          avaliacao: 5.0,
          taxaPontualidade: 100,
          dataCadastro: new Date().toISOString().slice(0, 10),
        },
        activeUser.id
      );
    } catch (err: any) {
      alert(`Erro ao salvar motoboy no Firestore: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  const handleUpdateMotoboy = async (updated: Motoboy) => {
    setSyncStatus('salvando');
    try {
      const dup = await motoboysRepo.checkDuplicate(updated.cpf, updated.telefone, updated.placaMoto, updated.id);
      if (dup.isDuplicate) {
        alert(`Atenção: Já existe outro motoboy cadastrado com este ${dup.field}.`);
        return;
      }
      await motoboysRepo.update(updated.id, updated as any, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao atualizar motoboy: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  const handleDeleteMotoboy = async (id: string) => {
    if (!window.confirm('Confirma a exclusão lógica deste motoboy?')) return;
    setSyncStatus('salvando');
    try {
      await motoboysRepo.softDelete(id, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao excluir motoboy: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Add Motorcycle in Firestore
  const handleAddMoto = async (newMotoData: Omit<Moto, 'id'>) => {
    setSyncStatus('salvando');
    try {
      const isDup = await veiculosRepo.checkDuplicatePlaca(newMotoData.placa);
      if (isDup) {
        throw new Error(`Atenção: Já existe uma motocicleta cadastrada com a placa ${newMotoData.placa}.`);
      }
      await veiculosRepo.create(newMotoData as any, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao salvar motocicleta no Firestore: ${err.message || err}`);
      throw err;
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  const handleUpdateMoto = async (updated: Moto) => {
    setSyncStatus('salvando');
    try {
      const isDup = await veiculosRepo.checkDuplicatePlaca(updated.placa, updated.id);
      if (isDup) {
        throw new Error(`Atenção: Já existe outra motocicleta cadastrada com a placa ${updated.placa}.`);
      }
      await veiculosRepo.update(updated.id, updated as any, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao atualizar motocicleta: ${err.message || err}`);
      throw err;
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  const handleDeleteMoto = async (id: string) => {
    if (!window.confirm('Confirma a exclusão lógica desta motocicleta?')) return;
    setSyncStatus('salvando');
    try {
      await veiculosRepo.softDelete(id, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao excluir motocicleta: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Handler: Approve / Reject Adesivagem in Firestore
  const handleApproveAdesivagem = async (id: string) => {
    setSyncStatus('salvando');
    try {
      await adesivosRepo.update(
        id,
        {
          status: 'aprovado',
          dataValidacao: new Date().toISOString().slice(0, 10),
          validadoPor: `${activeUser.nome} (${activeUser.papel})`,
        },
        activeUser.id
      );
    } catch (err: any) {
      alert(`Erro ao aprovar adesivagem: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  const handleRejectAdesivagem = async (id: string) => {
    setSyncStatus('salvando');
    try {
      await adesivosRepo.update(id, { status: 'reprovado' }, activeUser.id);
    } catch (err: any) {
      alert(`Erro ao reprovar adesivagem: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  const handleSaveConfig = async (newConfig: ConfiguracaoGeral) => {
    setSyncStatus('salvando');
    try {
      await configuracoesRepo.setWithId('geral', {
        chave: 'geral',
        ...newConfig,
      } as any, activeUser.id);
      setConfig(newConfig);
      alert('Configurações salvas com sucesso no Cloud Firestore!');
    } catch (err: any) {
      alert(`Erro ao salvar configurações: ${err.message || err}`);
    } finally {
      setSyncStatus('sincronizado');
    }
  };

  // Urgent deliveries count
  const urgentCount = entregas.filter(
    (e) => e.prioridade === 'urgente_comicio' && e.status !== 'entregue'
  ).length;

  const activeDeliveriesCount = entregas.filter(
    (e) => e.status === 'em_transito' || e.status === 'pendente'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-sans flex flex-col antialiased selection:bg-orange-500 selection:text-white">
      {/* Network & Real-Time Sync Banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Conectado ao Cloud Firestore</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Modo Offline Ativo (Persistência Local IndexedDB)</span>
            </span>
          )}
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Perfil Atual: <strong className="text-white font-bold">{activeUser.papel}</strong> ({role})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {syncStatus === 'salvando' && (
            <span className="flex items-center gap-1 text-orange-400 text-[10px]">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Gravando no Firestore...
            </span>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            <span>Simular Perfil:</span>
            <button
              onClick={() => switchRoleDebug('administrador')}
              className={`px-1 rounded ${role === 'administrador' ? 'bg-[#E05328] text-white font-bold' : 'hover:text-white'}`}
            >
              Admin
            </button>
            <button
              onClick={() => switchRoleDebug('gestor')}
              className={`px-1 rounded ${role === 'gestor' ? 'bg-[#E05328] text-white font-bold' : 'hover:text-white'}`}
            >
              Gestor
            </button>
            <button
              onClick={() => switchRoleDebug('motoboy')}
              className={`px-1 rounded ${role === 'motoboy' ? 'bg-[#E05328] text-white font-bold' : 'hover:text-white'}`}
            >
              Motoboy
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={activeUser}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        urgentCount={urgentCount}
        activeDeliveriesCount={activeDeliveriesCount}
        ordersCount={pedidos.filter(p => ['pendente', 'em_separacao', 'pronto'].includes(p.status)).length}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isAuthenticated={!!authUser || !!userProfile}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 transition-all">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onSelectTab={setCurrentTab}
          onQuickNewComite={() => {
            setCurrentTab('comites');
            setTimeout(() => {
              const btn = document.getElementById('open-novo-comite-modal-btn');
              if (btn) btn.click();
            }, 100);
          }}
          onQuickNewEntrega={() => {
            setCurrentTab('entregas');
            setIsNewEntregaModalTriggered(true);
          }}
          currentUser={activeUser}
          searchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
          onLogout={handleLogout}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          isAuthenticated={!!authUser || !!userProfile}
        />

        {/* View Router */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoadingInitialData ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 text-[#E05328] animate-spin" />
              <p className="text-sm font-medium">Sincronizando dados com o Google Firebase...</p>
            </div>
          ) : (
            <>
              {currentTab === 'comites' && (
                <ComitesView
                  comites={comites}
                  onAddComite={handleAddComite}
                  onUpdateComite={handleUpdateComite}
                  onDeleteComite={handleDeleteComite}
                  onRequestDeliveryForComite={(comite) => {
                    setSelectedComiteForDelivery(comite);
                    setCurrentTab('entregas');
                    setIsNewEntregaModalTriggered(true);
                  }}
                  initialSearchQuery={globalSearchTerm}
                />
              )}

              {currentTab === 'pedidos' && (
                <PedidosView
                  pedidos={pedidos}
                  clientes={comites}
                  motoboys={motoboys}
                  entregas={entregas}
                  currentUser={activeUser}
                  onSelectTab={setCurrentTab}
                  onRefresh={async () => {
                    const fresh = await pedidosRepo.getAll();
                    setPedidos(fresh as unknown as Pedido[]);
                  }}
                />
              )}

              {currentTab === 'estoque' && (
                <EstoqueView
                  currentUser={activeUser}
                  onNavigateToPedidos={() => setCurrentTab('pedidos')}
                  onNavigateToExpedicao={() => setCurrentTab('expedicao')}
                />
              )}

              {currentTab === 'expedicao' && (
                <ExpedicaoView
                  currentUser={activeUser}
                  motoboys={motoboys}
                  clientes={comites}
                  pedidos={pedidos}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'destinos' && (
                <DestinosMateriaisView
                  entregas={entregas}
                  comites={comites}
                  motoboys={motoboys}
                  onOpenNovaEntregaComMaterial={(tipo) => {
                    setCurrentTab('entregas');
                    setIsNewEntregaModalTriggered(true);
                  }}
                  onSelectEntregaPOD={(ent) => setViewingPODEntrega(ent)}
                />
              )}

              {currentTab === 'dashboard' && (
                <DashboardView
                  comites={comites}
                  motoboys={motoboys}
                  entregas={entregas}
                  onNavigate={setCurrentTab}
                  onOpenPODModal={(ent) => setViewingPODEntrega(ent)}
                  onNewDelivery={() => {
                    setCurrentTab('entregas');
                    setIsNewEntregaModalTriggered(true);
                  }}
                />
              )}

              {currentTab === 'entregas' && (
                <EntregasView
                  entregas={entregas}
                  comites={comites}
                  motoboys={motoboys}
                  onAddEntrega={handleAddEntrega}
                  onUpdateStatusEntrega={handleUpdateStatusEntrega}
                  onOpenPODModal={(ent) => setViewingPODEntrega(ent)}
                  preSelectedComite={selectedComiteForDelivery}
                  isOpenNewModalDefault={isNewEntregaModalTriggered}
                  onCloseNewModalDefault={() => {
                    setIsNewEntregaModalTriggered(false);
                    setSelectedComiteForDelivery(null);
                  }}
                />
              )}

              {currentTab === 'motoboy_app' && (
                <MotoboyAreaView
                  motoboys={motoboys}
                  entregas={entregas}
                  onCompleteDelivery={handleCompleteDeliveryWithPOD}
                  onOpenPODModal={(ent) => setViewingPODEntrega(ent)}
                />
              )}

              {currentTab === 'motoboys' && (
                <MotoboysView
                  motoboys={motoboys}
                  onAddMotoboy={handleAddMotoboy}
                  onUpdateMotoboy={handleUpdateMotoboy}
                  onDeleteMotoboy={handleDeleteMotoboy}
                />
              )}

              {currentTab === 'motos' && (
                <MotosView
                  motos={motos}
                  motoboys={motoboys}
                  onAddMoto={handleAddMoto}
                  onUpdateMoto={handleUpdateMoto}
                  onDeleteMoto={handleDeleteMoto}
                />
              )}

              {currentTab === 'adesivagem' && (
                <AdesivagemView
                  adesivagens={adesivagens}
                  onApprove={handleApproveAdesivagem}
                  onReject={handleRejectAdesivagem}
                />
              )}

              {currentTab === 'documentos' && (
                <DocumentosView documentos={documentos} />
              )}

              {currentTab === 'financeiro' && (
                <FinanceiroView transacoes={financeiro} />
              )}

              {currentTab === 'relatorios' && (
                <RelatoriosView
                  entregas={entregas}
                  comites={comites}
                  onOpenPODModal={(ent) => setViewingPODEntrega(ent)}
                />
              )}

              {currentTab === 'usuarios' && (
                <UsuariosView
                  usuarios={usuarios}
                  onSelectUser={(u) => {
                    let r: any = 'administrador';
                    if (u.papel === 'Operador de Logística') r = 'gestor';
                    if (u.papel === 'Fiscal de Campanha') r = 'atendente';
                    if (u.papel === 'Representante Comitê') r = 'cliente';
                    switchRoleDebug(r);
                  }}
                  currentUser={activeUser}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                  onLogout={handleLogout}
                  isAuthenticated={!!authUser || !!userProfile}
                />
              )}

              {currentTab === 'auditoria' && (
                <AuditoriaView logs={logsAuditoria} />
              )}

              {currentTab === 'configuracoes' && (
                <ConfiguracoesView
                  config={config}
                  onSaveConfig={handleSaveConfig}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global POD Modal for viewing & printing signed receipts */}
      {viewingPODEntrega && (
        <ComprovanteModal
          entrega={viewingPODEntrega}
          onClose={() => setViewingPODEntrega(null)}
        />
      )}

      {/* Firebase Auth Modal (Google Sign-In & Email/Password) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

