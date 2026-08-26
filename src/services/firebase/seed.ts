import {
  usuariosRepo,
  motoboysRepo,
  clientesRepo,
  veiculosRepo,
  entregasRepo,
  pedidosRepo,
  rotasRepo,
  pagamentosRepo,
  adesivosRepo,
  documentosRepo,
  ocorrenciasRepo,
  notificacoesRepo,
  configuracoesRepo,
  logsAuditoriaRepo,
  expedicoesRepo,
  divergenciasRepo,
  rotasExpedicaoRepo,
  materiaisRepo,
  estoqueSaldosRepo,
  estoqueMovimentacoesRepo,
  estoqueReservasRepo,
  inventariosRepo
} from '../../repositories';

import {
  INITIAL_COMITES,
  INITIAL_MOTOBOYS,
  INITIAL_MOTOS,
  INITIAL_ENTREGAS,
  INITIAL_ADESIVAGENS,
  INITIAL_DOCUMENTOS,
  INITIAL_FINANCEIRO,
  INITIAL_USUARIOS,
  INITIAL_CONFIG
} from '../../data/mockData';

export async function seedInitialFirebaseData() {
  try {
    const existingClientes = await clientesRepo.getAll();
    if (existingClientes.length > 0) {
      console.log('Firebase Firestore já populado. Ignorando seed.');
      return;
    }

    console.log('Iniciando carga inicial de dados reais no Firestore...');

    // 1. Clientes
    for (const c of INITIAL_COMITES) {
      await clientesRepo.setWithId(c.id, {
        nome: c.nome,
        candidato: c.candidato,
        cargo: c.cargo,
        partido: c.partido,
        numero: c.numero,
        cnpjCampanha: c.cnpjCampanha,
        responsavel: c.responsavel,
        cargoResponsavel: c.cargoResponsavel,
        telefone: c.telefone,
        email: c.email,
        endereco: c.endereco,
        numeroEnd: c.numeroEnd,
        bairro: c.bairro,
        cidade: c.cidade,
        uf: c.uf,
        cep: c.cep || '01451-000',
        zonaEleitoral: c.zonaEleitoral,
        secoesAtendidas: c.secoesAtendidas,
        valorBaseRota: c.valorBaseRota,
        status: c.status,
        origemCliente: c.origemCliente || 'CRM',
        materiais: c.materiais || ['perfurado', 'santao'],
        modeloCarro: c.modeloCarro || 'Fiat Strada 2024',
        totalEntregas: c.totalEntregas || 0,
        volumeTotalMateriais: c.volumeTotalMateriais || 0,
        dataCadastro: c.dataCadastro,
        observacoes: c.observacoes
      });
    }

    // 2. Motoboys
    for (const m of INITIAL_MOTOBOYS) {
      await motoboysRepo.setWithId(m.id, {
        nome: m.nome,
        cpf: m.cpf,
        cnh: m.cnh,
        cnhCategoria: m.cnhCategoria,
        validadeCnh: m.validadeCnh,
        telefone: m.telefone,
        fotoUrl: m.fotoUrl,
        placaMoto: m.placaMoto,
        modeloMoto: m.modeloMoto,
        anoMoto: m.anoMoto,
        capacidadeBau: m.capacidadeBau,
        tipoFrota: m.tipoFrota,
        status: m.status,
        statusAdesivagem: m.statusAdesivagem,
        partidoAdesivado: m.partidoAdesivado,
        zonaPreferencial: m.zonaPreferencial,
        totalEntregas: m.totalEntregas,
        taxaPontualidade: m.taxaPontualidade,
        avaliacao: m.avaliacao,
        valorDiaria: m.valorDiaria,
        pix: m.pix,
        dataCadastro: m.dataCadastro
      });
    }

    // 3. Veiculos
    for (const v of INITIAL_MOTOS) {
      await veiculosRepo.setWithId(v.id, {
        placa: v.placa,
        modelo: v.modelo,
        marca: v.marca,
        ano: v.ano,
        cor: v.cor,
        capacidadeBauLts: v.capacidadeBauLts,
        tipoPropriedade: v.tipoPropriedade,
        motoboyResponsavel: v.motoboyResponsavel,
        status: v.status,
        adesivoCampanha: v.adesivoCampanha,
        partidoAdesivo: v.partidoAdesivo,
        dataUltimaRevisao: v.dataUltimaRevisao,
        proximaRevisaoKm: v.proximaRevisaoKm,
        kmAtual: v.kmAtual
      });
    }

    // 4. Entregas
    for (const e of INITIAL_ENTREGAS) {
      await entregasRepo.setWithId(e.id, {
        codigoRastreio: e.codigoRastreio,
        comiteId: e.comiteId,
        comiteNome: e.comiteNome,
        candidato: e.candidato,
        partido: e.partido,
        cnpjCampanha: e.cnpjCampanha,
        tipoMaterial: e.tipoMaterial,
        descricaoMaterial: e.descricaoMaterial,
        quantidade: e.quantidade,
        unidadeMedida: e.unidadeMedida,
        pesoKg: e.pesoKg,
        enderecoDestino: e.enderecoDestino,
        bairro: e.bairro,
        cidade: e.cidade,
        zonaEleitoral: e.zonaEleitoral,
        pontoReferencia: e.pontoReferencia,
        responsavelRecebimento: e.responsavelRecebimento,
        telefoneContato: e.telefoneContato,
        prioridade: e.prioridade,
        motoboyId: e.motoboyId,
        motoboyNome: e.motoboyNome,
        motoboyTelefone: e.motoboyTelefone,
        motoboyPlaca: e.motoboyPlaca,
        status: e.status,
        dataCriacao: e.dataCriacao,
        dataPrevisao: e.dataPrevisao,
        dataEntrega: e.dataEntrega,
        valorFrete: e.valorFrete,
        comprovantePOD: e.comprovantePOD,
        observacoes: e.observacoes
      });
    }

    // 5. Adesivos
    for (const a of INITIAL_ADESIVAGENS) {
      await adesivosRepo.setWithId(a.id, {
        motoboyId: a.motoboyId,
        motoboyNome: a.motoboyNome,
        placa: a.placa,
        tipoAdesivagem: a.tipoAdesivagem,
        candidato: a.candidato,
        partido: a.partido,
        cnpjCampanha: a.cnpjCampanha,
        fotoAdesivagemUrl: a.fotoAdesivagemUrl,
        status: a.status,
        dataEnvio: a.dataEnvio,
        dataValidacao: a.dataValidacao,
        validadoPor: a.validadoPor,
        motivoReprovacao: a.motivoReprovacao
      });
    }

    // 6. Documentos
    for (const d of INITIAL_DOCUMENTOS) {
      await documentosRepo.setWithId(d.id, {
        titulo: d.titulo,
        categoria: d.categoria,
        entidadeTipo: d.entidadeTipo,
        entidadeNome: d.entidadeNome,
        entidadeId: d.entidadeId,
        numeroRegistro: d.numeroRegistro,
        dataEmissao: d.dataEmissao,
        dataValidade: d.dataValidade,
        status: d.status,
        arquivoNome: d.arquivoNome,
        tamanho: d.tamanho
      });
    }

    // 7. Pagamentos
    for (const p of INITIAL_FINANCEIRO) {
      await pagamentosRepo.setWithId(p.id, {
        tipo: p.tipo,
        descricao: p.descricao,
        entidadeNome: p.entidadeNome,
        entidadeId: p.entidadeId,
        partidoOuPlaca: p.partidoOuPlaca,
        valor: p.valor,
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento,
        status: p.status,
        metodoPagamento: p.metodoPagamento,
        comprovanteRef: p.comprovanteRef
      });
    }

    // 8. Usuarios
    for (const u of INITIAL_USUARIOS) {
      let role: any = 'administrador';
      if (u.papel === 'Operador de Logística') role = 'gestor';
      if (u.papel === 'Fiscal de Campanha') role = 'atendente';
      if (u.papel === 'Representante Comitê') role = 'cliente';

      await usuariosRepo.setWithId(u.id, {
        nome: u.nome,
        email: u.email,
        role: role,
        papelLegado: u.papel,
        status: u.status,
        avatarUrl: u.avatarUrl,
        ultimoAcesso: u.ultimoAcesso
      });
    }

    // 9. Configurações
    await configuracoesRepo.setWithId('geral', {
      chave: 'geral',
      taxaBaseKm: INITIAL_CONFIG.taxaBaseKm,
      taxaMinimaRota: INITIAL_CONFIG.taxaMinimaRota,
      adicionalUrgenciaPercentual: INITIAL_CONFIG.adicionalUrgenciaPercentual,
      diariaPadraoMotoboy: INITIAL_CONFIG.diariaPadraoMotoboy,
      limitePesoKgPorMoto: INITIAL_CONFIG.limitePesoKgPorMoto,
      rastreamentoGpsAoVivo: INITIAL_CONFIG.rastreamentoGpsAoVivo,
      notificacaoWhatsAppAtiva: INITIAL_CONFIG.notificacaoWhatsAppAtiva,
      exigirAssinaturaPOD: INITIAL_CONFIG.exigirAssinaturaPOD,
      exigirFotoPOD: INITIAL_CONFIG.exigirFotoPOD,
      cidadeOperacao: INITIAL_CONFIG.cidadeOperacao,
      eleicaoAno: INITIAL_CONFIG.eleicaoAno
    });

    // 10. Rotas
    await rotasRepo.setWithId('rota-1', {
      nome: 'Rota Zona Sul - Distribuição de Perfurados',
      motoboyId: 'mb-1',
      motoboyNome: 'Carlos Eduardo Santos',
      status: 'em_andamento',
      entregasIds: ['ent-1', 'ent-3'],
      totalParadas: 2,
      distanciaKmEstimada: 18.5,
      tempoMinutosEstimado: 45,
      dataInicio: new Date().toISOString(),
      valorTotalRota: 90
    });

    // 11. Ocorrências
    await ocorrenciasRepo.setWithId('oco-1', {
      titulo: 'Comitê fechado na primeira tentativa',
      descricao: 'O comitê na Av. Paulista estava com portão trancado às 09:30. Contato feito com o coordenador para reagendamento.',
      tipo: 'recusa_recebimento',
      gravidade: 'media',
      status: 'resolvida',
      entregaId: 'ent-2',
      motoboyId: 'mb-2',
      clienteId: 'com-2',
      resolucao: 'Entrega entregue com sucesso às 11h.',
      dataResolucao: new Date().toISOString()
    });

    // 12. Notificações
    await notificacoesRepo.setWithId('notif-1', {
      usuarioId: 'usr-1',
      titulo: 'Nova Entrega Urgente Solicitada',
      mensagem: 'Comitê Central Pinheiros solicitou entrega de 5.000 perfurados com prioridade alta.',
      tipo: 'urgente',
      lida: false,
      dataEnvio: new Date().toISOString()
    });

    // 13. Pedidos Iniciais
    const existingPedidos = await pedidosRepo.getAll();
    if (existingPedidos.length === 0) {
      await pedidosRepo.setWithId('ped-1', {
        numeroPedido: 'PED-2026-000101',
        clienteId: 'com-1',
        clienteNome: 'Comitê Central Pinheiros',
        candidato: 'Dra. Mariana Costa',
        cargoCandidato: 'Deputada Federal',
        partido: 'PSD',
        numeroCandidato: '5510',
        cnpjCampanha: '45.123.890/0001-22',
        responsavel: 'Carlos Alberto Silva',
        telefone: '(11) 98765-4321',
        email: 'contato@marianacosta.com.br',
        itens: [
          {
            id: 'item-101-1',
            tipoMaterial: 'santinhos_impressos',
            nomeMaterial: 'Santinhos impressos',
            descricao: 'Santinhos tradicionais 7x10cm 4x4 cores c/ coligação',
            quantidade: 10000,
            unidadeMedida: 'unidades',
            valorUnitario: 0.10,
            subtotal: 1000.0,
          },
          {
            id: 'item-101-2',
            tipoMaterial: 'perfurado_vidro',
            nomeMaterial: 'Perfurado — Vidro traseiro',
            descricao: 'Adesivo perfurado microperfurado para vidro traseiro de veículo',
            quantidade: 200,
            unidadeMedida: 'unidades',
            valorUnitario: 15.0,
            subtotal: 3000.0,
          }
        ],
        quantidadeTotal: 10200,
        subtotal: 4000.0,
        desconto: 200.0,
        acrescimo: 0,
        valorTotal: 3800.0,
        prioridade: 'alta',
        modalidade: 'entrega',
        enderecoEntrega: {
          cep: '05422-000',
          endereco: 'Av. Brigadeiro Faria Lima',
          numero: '2232',
          complemento: 'Conjunto 81',
          bairro: 'Pinheiros',
          cidade: 'São Paulo',
          uf: 'SP',
          zonaEleitoral: '251ª Zona Pinheiros',
          responsavelRecebimento: 'Carlos Alberto Silva',
          telefoneRecebedor: '(11) 98765-4321',
        },
        status: 'em_separacao',
        dataPedido: new Date(Date.now() - 3600000 * 5).toISOString(),
        dataPrevisao: new Date(Date.now() + 3600000 * 20).toISOString(),
        observacoes: 'Urgente para evento de inauguração do comitê.',
        criadoPor: 'usr-1',
        criadoPorNome: 'Roberto Silveira',
        historicoStatus: [
          {
            status: 'pendente',
            dataHora: new Date(Date.now() - 3600000 * 5).toISOString(),
            usuarioId: 'usr-1',
            usuarioNome: 'Roberto Silveira',
            observacao: 'Pedido registrado no sistema',
          },
          {
            status: 'em_separacao',
            dataHora: new Date(Date.now() - 3600000 * 2).toISOString(),
            usuarioId: 'usr-1',
            usuarioNome: 'Roberto Silveira',
            observacao: 'Enviado para setor de separação gráfica',
          }
        ]
      });

      await pedidosRepo.setWithId('ped-2', {
        numeroPedido: 'PED-2026-000102',
        clienteId: 'com-2',
        clienteNome: 'Comitê Regional Mooca',
        candidato: 'Prof. João Mendes',
        cargoCandidato: 'Deputado Estadual',
        partido: 'MDB',
        numeroCandidato: '15020',
        cnpjCampanha: '48.987.654/0001-33',
        responsavel: 'Ana Paula Rocha',
        telefone: '(11) 97654-3210',
        email: 'comite@profjoaomendes.com.br',
        itens: [
          {
            id: 'item-102-1',
            tipoMaterial: 'pragao_10cm',
            nomeMaterial: 'Pragão — Adesivo de 10 cm',
            descricao: 'Adesivo redondo formato pragão 10cm de diâmetro',
            quantidade: 3000,
            unidadeMedida: 'unidades',
            valorUnitario: 0.35,
            subtotal: 1050.0,
          },
          {
            id: 'item-102-2',
            tipoMaterial: 'bandeiras_haste',
            nomeMaterial: 'Bandeiras com haste',
            descricao: 'Bandeiras de tecido poliéster c/ haste plástica de apoio',
            quantidade: 150,
            unidadeMedida: 'unidades',
            valorUnitario: 12.0,
            subtotal: 1800.0,
          }
        ],
        quantidadeTotal: 3150,
        subtotal: 2850.0,
        desconto: 0,
        acrescimo: 50.0,
        valorTotal: 2900.0,
        prioridade: 'normal',
        modalidade: 'retirada',
        status: 'pronto',
        dataPedido: new Date(Date.now() - 3600000 * 12).toISOString(),
        dataPrevisao: new Date(Date.now() + 3600000 * 6).toISOString(),
        observacoes: 'Retirada agendada pelo coordenador distrital.',
        criadoPor: 'usr-1',
        criadoPorNome: 'Roberto Silveira',
        historicoStatus: [
          {
            status: 'pendente',
            dataHora: new Date(Date.now() - 3600000 * 12).toISOString(),
            usuarioId: 'usr-1',
            usuarioNome: 'Roberto Silveira',
            observacao: 'Pedido cadastrado via balcão',
          },
          {
            status: 'pronto',
            dataHora: new Date(Date.now() - 3600000 * 1).toISOString(),
            usuarioId: 'usr-1',
            usuarioNome: 'Roberto Silveira',
            observacao: 'Volumes prontos para retirada no galpão central',
          }
        ]
      });
    }

    // 10. Materiais de Estoque & Saldos Iniciais
    const existingMateriais = await materiaisRepo.getAll();
    if (existingMateriais.length === 0) {
      console.log('Populando catálogo de materiais e saldos iniciais de estoque...');

      const SEED_MATERIAIS = [
        {
          id: 'mat-1',
          sku: 'MAT-000001',
          codigoBarras: '7891234560012',
          nome: 'Perfurado — Vidro Traseiro Oficial',
          categoria: 'Adesivos e perfurados',
          tipoMaterial: 'perfurado_vidro_traseiro',
          tipoMaterialLabel: 'Perfurado — Vidro traseiro',
          descricao: 'Vinil perfurado microperfurado 50/50 com proteção UV para vidro traseiro de automóveis',
          unidadeMedida: 'unidade',
          estoqueMinimo: 100,
          estoqueMaximo: 2000,
          custoUnitario: 18.50,
          localizacao: 'Setor A — Prateleira 01-02',
          tamanhoFormato: '110 x 45 cm',
          lote: 'LOT-2026-A1',
          fornecedor: 'Gráfica Alpha Eleitoral',
          candidato: 'Dra. Helena Martins',
          partido: 'PL',
          numeroCandidato: '22022',
          status: 'ativo' as const,
          quantidadeInicial: 450,
        },
        {
          id: 'mat-2',
          sku: 'MAT-000002',
          codigoBarras: '7891234560029',
          nome: 'Pragão — Adesivo Redondo 10cm',
          categoria: 'Adesivos e perfurados',
          tipoMaterial: 'pragao_10cm',
          tipoMaterialLabel: 'Pragão — Adesivo de 10 cm',
          descricao: 'Adesivo redondo couche brilho autocolante padrão 10cm',
          unidadeMedida: 'unidade',
          estoqueMinimo: 5000,
          estoqueMaximo: 100000,
          custoUnitario: 0.28,
          localizacao: 'Setor B — Prateleira 02-01',
          tamanhoFormato: 'Diâmetro 10 cm',
          lote: 'LOT-2026-B4',
          fornecedor: 'PrintFlex Soluções Gráficas',
          candidato: 'Prof. João Mendes',
          partido: 'MDB',
          numeroCandidato: '15020',
          status: 'ativo' as const,
          quantidadeInicial: 25000,
        },
        {
          id: 'mat-3',
          sku: 'MAT-000003',
          codigoBarras: '7891234560036',
          nome: 'Santinhos Eleitorais 7x10 Papel Couchê',
          categoria: 'Impressos gráficos',
          tipoMaterial: 'santinhos_impressos',
          tipoMaterialLabel: 'Santinhos impressos',
          descricao: 'Santinho clássico 7x10cm couche 115g 4x4 cores com propostas e QR Code',
          unidadeMedida: 'milheiro',
          estoqueMinimo: 20,
          estoqueMaximo: 500,
          custoUnitario: 35.00,
          localizacao: 'Setor C — Prateleira 01-04',
          tamanhoFormato: '7 x 10 cm',
          lote: 'LOT-2026-C2',
          fornecedor: 'Gráfica Paulista Ltda',
          candidato: 'Dra. Helena Martins',
          partido: 'PL',
          numeroCandidato: '22022',
          status: 'ativo' as const,
          quantidadeInicial: 80,
        },
        {
          id: 'mat-4',
          sku: 'MAT-000004',
          codigoBarras: '7891234560043',
          nome: 'Bandeiras com Haste Plástica 1.20m',
          categoria: 'Bandeiras e estandartes',
          tipoMaterial: 'bandeiras_haste',
          tipoMaterialLabel: 'Bandeiras com haste',
          descricao: 'Bandeira em tecido Oxford sublimado com haste de plástico leve e reforçada',
          unidadeMedida: 'unidade',
          estoqueMinimo: 200,
          estoqueMaximo: 5000,
          custoUnitario: 9.50,
          localizacao: 'Setor D — Prateleira 03-01',
          tamanhoFormato: '70 x 100 cm',
          lote: 'LOT-2026-D1',
          fornecedor: 'Têxtil Brasil Eleições',
          candidato: 'Prof. João Mendes',
          partido: 'MDB',
          numeroCandidato: '15020',
          status: 'ativo' as const,
          quantidadeInicial: 850,
        },
        {
          id: 'mat-5',
          sku: 'MAT-000005',
          codigoBarras: '7891234560050',
          nome: 'Windbanner Dupla Face para Calçada',
          categoria: 'Estrutura e sinalização',
          tipoMaterial: 'windbanners_calcada',
          tipoMaterialLabel: 'Windbanners de calçada',
          descricao: 'Kit completo windbanner modelo gota com base de água e haste flexível',
          unidadeMedida: 'kit',
          estoqueMinimo: 15,
          estoqueMaximo: 200,
          custoUnitario: 85.00,
          localizacao: 'Setor E — Galpão 01-01',
          tamanhoFormato: '2.5 metros',
          lote: 'LOT-2026-E1',
          fornecedor: 'FlagDesign Sinalização',
          status: 'ativo' as const,
          quantidadeInicial: 45,
        },
        {
          id: 'mat-6',
          sku: 'MAT-000006',
          codigoBarras: '7891234560067',
          nome: 'Revista Tabloide Prestação de Contas',
          categoria: 'Impressos gráficos',
          tipoMaterial: 'revista_tabloide',
          tipoMaterialLabel: 'Revista — Informativo ou tabloide',
          descricao: 'Revista informativa 8 páginas formato tabloide couche brilho',
          unidadeMedida: 'unidade',
          estoqueMinimo: 3000,
          estoqueMaximo: 50000,
          custoUnitario: 0.75,
          localizacao: 'Setor C — Prateleira 02-01',
          tamanhoFormato: 'A4 Aberto',
          lote: 'LOT-2026-C8',
          fornecedor: 'Gráfica Paulista Ltda',
          candidato: 'Dra. Helena Martins',
          partido: 'PL',
          status: 'ativo' as const,
          quantidadeInicial: 12000,
        },
        {
          id: 'mat-7',
          sku: 'MAT-000007',
          codigoBarras: '7891234560074',
          nome: 'Adesivo de Para-choque 15x40',
          categoria: 'Adesivos e perfurados',
          tipoMaterial: 'adesivo_15x40',
          tipoMaterialLabel: 'Adesivos 15x40 — Para-choque',
          descricao: 'Adesivo em vinil brilhante com cola removível de alta aderência',
          unidadeMedida: 'unidade',
          estoqueMinimo: 1000,
          estoqueMaximo: 20000,
          custoUnitario: 0.90,
          localizacao: 'Setor A — Prateleira 02-03',
          tamanhoFormato: '15 x 40 cm',
          lote: 'LOT-2026-A5',
          fornecedor: 'PrintFlex Soluções Gráficas',
          status: 'ativo' as const,
          quantidadeInicial: 3200,
        },
        {
          id: 'mat-8',
          sku: 'MAT-000008',
          codigoBarras: '7891234560081',
          nome: 'Combo Completo de Materiais de Comício',
          categoria: 'Brindes e utilitários',
          tipoMaterial: 'combo_comicio',
          tipoMaterialLabel: 'Combo completo para comício',
          descricao: 'Caixa organizadora com 20 bandeiras, 100 pragões, 500 santinhos e 5 faixas',
          unidadeMedida: 'caixa',
          estoqueMinimo: 12,
          estoqueMaximo: 50,
          custoUnitario: 240.00,
          localizacao: 'Setor E — Prateleira 02-05',
          tamanhoFormato: 'Caixa Padrão G',
          lote: 'LOT-2026-E9',
          fornecedor: 'FleetMoto Logística Integrada',
          status: 'ativo' as const,
          quantidadeInicial: 6, // ALERTA: Abaixo do estoque mínimo de 12!
        }
      ];

      for (const m of SEED_MATERIAIS) {
        const { quantidadeInicial, ...matData } = m;
        await materiaisRepo.setWithId(m.id, {
          ...matData,
          isDeleted: false,
          deletedAt: null,
          createdBy: 'sistema',
          updatedBy: 'sistema',
        });

        await estoqueSaldosRepo.setWithId(m.id, {
          materialId: m.id,
          estoqueFisico: quantidadeInicial,
          disponivel: quantidadeInicial,
          reservado: 0,
          emSeparacao: 0,
          liberado: 0,
          avariado: 0,
          bloqueado: 0,
          isDeleted: false,
        });

        await estoqueMovimentacoesRepo.create({
          materialId: m.id,
          materialNome: m.nome,
          materialSku: m.sku,
          tipo: 'entrada',
          subtipo: 'saldo_inicial',
          quantidade: quantidadeInicial,
          saldoAnterior: 0,
          saldoPosterior: quantidadeInicial,
          custoUnitario: m.custoUnitario,
          valorTotal: quantidadeInicial * m.custoUnitario,
          motivo: 'Lançamento de Saldo Inicial no Sistema',
          lote: m.lote,
          localizacaoDestino: m.localizacao,
          usuarioId: 'usr-1',
          usuarioNome: 'Roberto Silveira',
          isDeleted: false,
        });
      }
    }

    console.log('Seed do Firebase concluído com sucesso!');
  } catch (err) {
    console.error('Erro durante o seed de dados no Firebase:', err);
  }
}
