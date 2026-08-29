import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ItemRelatorioCentral, ModeloRelatorioConfig } from '../types';
import { formatCurrency, formatDate, formatNumber } from './formatters';

export interface RelatorioPdfConfig {
  modeloAtivo: ModeloRelatorioConfig;
  itens: ItemRelatorioCentral[];
  usuarioAtualNome: string;
  orientacao?: 'retrato' | 'paisagem';
  tipoVisualizacao?: 'analitico' | 'sintetico';
  incluirValores?: boolean;
  incluirAssinaturas?: boolean;
  observacoesPersonalizadas?: string;
  codigoAutenticacao?: string;
  dataEmissao?: string;
  fileName?: string;
}

/**
 * Cria um documento jsPDF profissional, vetorizado e 100% nativo com tabelas,
 * cabeçalho oficial SPCE-TSE, KPIs, assinaturas e paginação automática.
 */
export function buildRelatorioJsPdf(config: RelatorioPdfConfig): jsPDF {
  const isLandscape = config.orientacao === 'paisagem';
  const orientation = isLandscape ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const dataEmissao = config.dataEmissao || new Date().toLocaleString('pt-BR');
  const authCode =
    config.codigoAutenticacao ||
    `DOC-TSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const totalRegistros = config.itens.length;
  const valorTotal = config.itens.reduce((acc, it) => acc + (it.valor || it.custo || 0), 0);
  const quantidadeTotal = config.itens.reduce((acc, it) => acc + (it.quantidade || 0), 0);

  // 1. Cabeçalho Superior Oficial
  // Barra de destaque superior
  doc.setFillColor(224, 83, 40); // Laranja #E05328
  doc.rect(margin, 10, contentWidth, 2.5, 'F');

  // Logotipo / Título da Empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('FLEETMOTO LOGÍSTICA ELEITORAL', margin, 18);

  // Tag SPCE-TSE
  doc.setFontSize(8);
  doc.setFillColor(254, 242, 237); // Laranja claro
  doc.setDrawColor(224, 83, 40);
  doc.roundedRect(margin + 98, 13.5, 34, 5.5, 1, 1, 'FD');
  doc.setTextColor(194, 65, 12);
  doc.text('SPCE-TSE • OFICIAL', margin + 100, 17.5);

  // Título do Relatório
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(224, 83, 40);
  doc.text(config.modeloAtivo.titulo, margin, 24);

  // Subtítulo / Descrição
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  const splitDesc = doc.splitTextToSize(config.modeloAtivo.descricao || 'Relatório de inteligência e movimentação operacional', contentWidth - 75);
  doc.text(splitDesc, margin, 28.5);

  // Dados de emissão (Lado direito)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Emissão: ${dataEmissao}`, pageWidth - margin, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Operador: ${config.usuarioAtualNome || 'Administrador'}`, pageWidth - margin, 20, { align: 'right' });
  doc.setFont('courier', 'bold');
  doc.setTextColor(224, 83, 40);
  doc.text(authCode, pageWidth - margin, 24, { align: 'right' });

  // Linha separadora
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.line(margin, 34, pageWidth - margin, 34);

  // 2. Blocos de Métricas / KPIs
  const kpiY = 37;
  const kpiHeight = 13;
  const kpiCount = config.incluirValores !== false ? 3 : 2;
  const kpiWidth = (contentWidth - (kpiCount - 1) * 3) / kpiCount;

  // KPI 1: Registros
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DE REGISTROS', margin + 3, kpiY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatNumber(totalRegistros)} itens`, margin + 3, kpiY + 10);

  // KPI 2: Quantidade / Volume
  const kpi2X = margin + kpiWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi2X, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('VOLUME TOTAL DE MATERIAIS', kpi2X + 3, kpiY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatNumber(quantidadeTotal)} un`, kpi2X + 3, kpiY + 10);

  // KPI 3: Valor Consolidado (opcional)
  if (config.incluirValores !== false) {
    const kpi3X = margin + (kpiWidth + 3) * 2;
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(kpi3X, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(21, 128, 61);
    doc.text('VALOR TOTAL CONSOLIDADO', kpi3X + 3, kpiY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text(formatCurrency(valorTotal), kpi3X + 3, kpiY + 10);
  }

  // 3. Renderização das Tabelas via jspdf-autotable
  const tableStartY = kpiY + kpiHeight + 5;

  if (config.tipoVisualizacao === 'sintetico') {
    // Modo Sintético: Agrupado por status
    const agrupadoPorStatus: Record<string, { count: number; qtd: number; valor: number }> = {};
    config.itens.forEach((it) => {
      const st = it.statusLabel || it.status || 'Não Definido';
      if (!agrupadoPorStatus[st]) {
        agrupadoPorStatus[st] = { count: 0, qtd: 0, valor: 0 };
      }
      agrupadoPorStatus[st].count += 1;
      agrupadoPorStatus[st].qtd += it.quantidade || 0;
      agrupadoPorStatus[st].valor += it.valor || it.custo || 0;
    });

    const headers = ['Status Operacional', 'Qtd Registros', 'Volume de Materiais'];
    if (config.incluirValores !== false) headers.push('Valor Consolidado (R$)');

    const rows = Object.entries(agrupadoPorStatus).map(([st, d]) => {
      const row = [st, formatNumber(d.count), `${formatNumber(d.qtd)} un`];
      if (config.incluirValores !== false) row.push(formatCurrency(d.valor));
      return row;
    });

    // Linha de total
    const totalRow = ['TOTAL CONSOLIDADO', formatNumber(totalRegistros), `${formatNumber(quantidadeTotal)} un`];
    if (config.incluirValores !== false) totalRow.push(formatCurrency(valorTotal));
    rows.push(totalRow);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
      margin: { left: margin, right: margin, bottom: 25 },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52] },
      },
      didParseCell: (data) => {
        // Estilizar a última linha de total
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
    });
  } else {
    // Modo Analítico (Completo Linha a Linha)
    const isAgendamentoModel = config.modeloAtivo.id === 'agendamentos_cronograma';
    const headers = isAgendamentoModel
      ? ['Data Agendada', 'Horário', 'Cliente / Candidato', 'Região / Rota', 'Responsável / Contato', 'Status']
      : ['Data', 'Identificador', 'Cliente / Beneficiário', 'Material / Ref.', 'Qtd', 'Status'];
    if (config.incluirValores !== false) headers.push('Valor (R$)');

    const rows = config.itens.map((it) => {
      let row: (string | number)[];
      if (isAgendamentoModel) {
        const dataStr = it.dataAgendamento ? formatDate(it.dataAgendamento) : (it.dataHoraFormatada || formatDate(it.dataHora));
        const horaStr = it.horarioAgendamento || '14:00';
        const candStr = it.candidato && it.candidato !== it.clienteNome ? `${it.clienteNome || ''} (${it.candidato})` : (it.clienteNome || '-');
        const rotaStr = it.regiaoRota || it.rotaNome || '-';
        const respStr = it.responsavelNome ? `${it.responsavelNome} ${it.telefone ? `(${it.telefone})` : ''}` : (it.telefone || '-');
        row = [
          dataStr,
          horaStr,
          candStr,
          rotaStr,
          respStr,
          it.statusLabel || it.status || 'AGENDADO',
        ];
      } else {
        row = [
          it.dataHoraFormatada || formatDate(it.dataHora),
          it.numeroPedido ? `#${it.numeroPedido}` : it.id.slice(0, 8),
          it.clienteNome || '-',
          it.materialNome || '-',
          it.quantidade !== undefined ? formatNumber(it.quantidade) : '-',
          it.statusLabel || it.status || 'OK',
        ];
      }
      if (config.incluirValores !== false) {
        row.push(it.valor ? formatCurrency(it.valor) : it.custo ? formatCurrency(it.custo) : '-');
      }
      return row;
    });

    // Rodapé de totais
    const footerRow = [
      'TOTAL CONSOLIDADO',
      `${totalRegistros} registros`,
      '',
      '',
      isAgendamentoModel ? '' : `${formatNumber(quantidadeTotal)} un`,
      '',
    ];
    if (config.incluirValores !== false) {
      footerRow.push(formatCurrency(valorTotal));
    }
    rows.push(footerRow);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
      margin: { left: margin, right: margin, bottom: 25 },
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [51, 65, 85],
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: isLandscape ? 26 : 22 },
        1: { cellWidth: isLandscape ? 24 : 20, font: 'courier', fontStyle: 'bold' },
        2: { cellWidth: isLandscape ? 70 : 45 },
        3: { cellWidth: isLandscape ? 65 : 42 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: isLandscape ? 22 : 18 },
        5: { cellWidth: isLandscape ? 30 : 23 },
        6: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52], cellWidth: isLandscape ? 28 : 22 },
      },
      didParseCell: (data) => {
        // Estilizar linha final de total
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fillColor = [226, 232, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
    });
  }

  // 4. Observações e Assinaturas (Adicionadas ao final do documento)
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
  let currentY = finalY + 6;

  // Se o espaço restante for insuficiente, adiciona nova página para assinaturas
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  // Observações personalizadas
  if (config.observacoesPersonalizadas) {
    doc.setFillColor(254, 252, 232); // Amber 50
    doc.setDrawColor(253, 224, 71); // Amber 300
    const obsLines = doc.splitTextToSize(`Observações: ${config.observacoesPersonalizadas}`, contentWidth - 6);
    const obsHeight = Math.max(10, obsLines.length * 4 + 4);

    doc.roundedRect(margin, currentY, contentWidth, obsHeight, 1, 1, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 63, 18);
    doc.text(obsLines, margin + 3, currentY + 4.5);

    currentY += obsHeight + 6;
  }

  // Assinaturas TSE
  if (config.incluirAssinaturas !== false) {
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = 20;
    }

    const sigWidth = (contentWidth - 20) / 2;
    const sig1X = margin;
    const sig2X = margin + sigWidth + 20;
    const lineY = currentY + 12;

    doc.setDrawColor(148, 163, 184); // Slate 400
    doc.line(sig1X, lineY, sig1X + sigWidth, lineY);
    doc.line(sig2X, lineY, sig2X + sigWidth, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(config.usuarioAtualNome || 'Responsável Operacional', sig1X + sigWidth / 2, lineY + 4, { align: 'center' });
    doc.text('Auditoria Financeira & Jurídica', sig2X + sigWidth / 2, lineY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('FleetMoto Logística Eleitoral 2026', sig1X + sigWidth / 2, lineY + 7.5, { align: 'center' });
    doc.text('Comitê de Prestação de Contas TSE', sig2X + sigWidth / 2, lineY + 7.5, { align: 'center' });
  }

  // 5. Paginação e Rodapé em todas as páginas
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FleetMoto Logística Eleitoral • Documento Oficial SPCE-TSE • Lei 9.504/97 • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Realiza o download direto do relatório em formato PDF
 */
export function downloadRelatorioPdf(config: RelatorioPdfConfig): { success: boolean; error?: string } {
  try {
    const doc = buildRelatorioJsPdf(config);
    const fileName = config.fileName
      ? config.fileName.endsWith('.pdf')
        ? config.fileName
        : `${config.fileName}.pdf`
      : `Relatorio_FleetMoto_${config.modeloAtivo.numero}_${Date.now()}.pdf`;

    doc.save(fileName);
    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro ao baixar PDF:', error);
    return {
      success: false,
      error: error?.message || 'Falha ao gerar o arquivo PDF.',
    };
  }
}

/**
 * Abre o relatório PDF diretamente para impressão através de Blob URL ou Iframe
 */
export function printRelatorioPdf(config: RelatorioPdfConfig): { success: boolean; error?: string } {
  try {
    const doc = buildRelatorioJsPdf(config);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // Tenta abrir janela ou imprimir via iframe invisível
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '-9999px';
    printIframe.style.bottom = '-9999px';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.src = blobUrl;
    document.body.appendChild(printIframe);

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('[pdfGenerator] Falha ao acionar print no iframe, abrindo em nova aba:', printErr);
          window.open(blobUrl, '_blank');
        } finally {
          setTimeout(() => {
            if (printIframe.parentNode) printIframe.parentNode.removeChild(printIframe);
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      }, 300);
    };

    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro ao imprimir PDF:', error);
    // Em caso de falha, aciona o download
    return downloadRelatorioPdf(config);
  }
}

/**
 * Gera e baixa o PDF oficial de um Dossiê / Pedido individual
 */
export function downloadDossieItemPdf(item: ItemRelatorioCentral, usuarioNome?: string): { success: boolean; error?: string } {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const original = item.registroOriginal || {};
    const dataEmissao = new Date().toLocaleString('pt-BR');
    const authCode = `DOSSIE-${item.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Header
    doc.setFillColor(224, 83, 40);
    doc.rect(margin, 10, contentWidth, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('FLEETMOTO LOGÍSTICA ELEITORAL', margin, 18);

    doc.setFontSize(8);
    doc.setFillColor(254, 242, 237);
    doc.setDrawColor(224, 83, 40);
    doc.roundedRect(margin + 95, 13.5, 36, 5.5, 1, 1, 'FD');
    doc.setTextColor(194, 65, 12);
    doc.text('DOSSIÊ AUDITADO TSE', margin + 97, 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(224, 83, 40);
    doc.text(`Ficha Operacional: ${item.numeroPedido ? `Pedido #${item.numeroPedido}` : item.clienteNome || 'Registro'}`, margin, 24);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Emissão: ${dataEmissao}`, pageWidth - margin, 18, { align: 'right' });
    doc.setFont('courier', 'bold');
    doc.setTextColor(224, 83, 40);
    doc.text(authCode, pageWidth - margin, 23, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 28, pageWidth - margin, 28);

    // Grid de Informações Principais
    const kpiY = 32;
    const gridCols = [
      ['Data/Hora', item.dataHoraFormatada || formatDate(item.dataHora)],
      ['Cliente / Comitê', item.clienteNome || 'N/A'],
      ['Status', item.statusLabel || item.status || 'OK'],
      ['Material Principal', item.materialNome || 'N/A'],
      ['Entregador', item.motoboyNome || 'Não atribuído'],
      ['Valor / Custo', item.valor ? formatCurrency(item.valor) : item.custo ? formatCurrency(item.custo) : 'R$ 0,00'],
    ];

    autoTable(doc, {
      head: [['Campo', 'Informação Registrada']],
      body: gridCols,
      startY: kpiY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    });

    let currentY = (doc as any).lastAutoTable?.finalY + 6;

    // Itens do Pedido se existirem
    if (original.itens && Array.isArray(original.itens) && original.itens.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Itens e Materiais do Pedido (${original.itens.length})`, margin, currentY);

      const itensRows = original.itens.map((it: any) => [
        it.materialNome || it.nome || 'Material',
        `${formatNumber(it.quantidade)} ${it.unidadeMedida || 'un'}`,
        formatCurrency(it.precoUnitario || 0),
        formatCurrency(it.subtotal || (it.quantidade * (it.precoUnitario || 0))),
      ]);

      autoTable(doc, {
        head: [['Material / Descrição', 'Quantidade', 'Preço Unit.', 'Subtotal']],
        body: itensRows,
        startY: currentY + 2,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' },
        },
      });

      currentY = (doc as any).lastAutoTable?.finalY + 6;
    }

    // Comprovante POD
    if (original.comprovantePOD) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52);
      doc.text('COMPROVANTE DE ENTREGA DIGITAL (POD) VALIDADO', margin + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61);
      doc.text(`Recebedor: ${original.comprovantePOD.nomeRecebedor || '-'} • Doc: ${original.comprovantePOD.documentoRecebedor || 'Validado'}`, margin + 3, currentY + 9);
      doc.text(`Data/Hora: ${original.comprovantePOD.dataHora || '-'} • Hash SHA256: ${original.comprovantePOD.hashSha256 || 'CONFORME-TSE-OK'}`, margin + 3, currentY + 13.5);

      currentY += 24;
    }

    // Assinaturas
    const sigWidth = (contentWidth - 20) / 2;
    const lineY = currentY + 14;

    doc.setDrawColor(148, 163, 184);
    doc.line(margin, lineY, margin + sigWidth, lineY);
    doc.line(margin + sigWidth + 20, lineY, margin + sigWidth * 2 + 20, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(usuarioNome || 'Operador Logístico', margin + sigWidth / 2, lineY + 3.5, { align: 'center' });
    doc.text('Conformidade TSE / Comitê', margin + sigWidth + 20 + sigWidth / 2, lineY + 3.5, { align: 'center' });

    doc.save(`Dossie_${item.numeroPedido || item.id.slice(0, 8)}_${Date.now()}.pdf`);
    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro ao baixar dossiê:', error);
    return { success: false, error: error?.message || 'Falha ao gerar dossiê.' };
  }
}

/**
 * Gera e baixa o PDF oficial do Relatório de Rotas e Entregas
 */
export function downloadRotasReportPdf(config: {
  paradas: any[];
  rotas: any[];
  totalParadas: number;
  entregues: number;
  pendentes: number;
  insucesso: number;
  kmTotal: number;
  custoTotal: number;
  fileName?: string;
}): { success: boolean; error?: string } {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 297;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const dataEmissao = new Date().toLocaleString('pt-BR');

    // Header
    doc.setFillColor(224, 83, 40);
    doc.rect(margin, 10, contentWidth, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('FLEETMOTO LOGÍSTICA ELEITORAL', margin, 18);

    doc.setFontSize(8);
    doc.setFillColor(254, 242, 237);
    doc.setDrawColor(224, 83, 40);
    doc.roundedRect(margin + 95, 13.5, 36, 5.5, 1, 1, 'FD');
    doc.setTextColor(194, 65, 12);
    doc.text('AUDITORIA DE ROTAS TSE', margin + 97, 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(224, 83, 40);
    doc.text('Relatório Consolidado de Rotas & Entregas', margin, 24);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Emissão: ${dataEmissao}`, pageWidth - margin, 18, { align: 'right' });

    // KPIs
    const kpiY = 28;
    const kpiW = (contentWidth - 12) / 4;
    const kpiH = 11;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, kpiY, kpiW, kpiH, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL DE PARADAS', margin + 2, kpiY + 4);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${config.totalParadas} paradas`, margin + 2, kpiY + 8.5);

    const kpi2X = margin + kpiW + 4;
    doc.roundedRect(kpi2X, kpiY, kpiW, kpiH, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('ENTREGAS CONCLUÍDAS', kpi2X + 2, kpiY + 4);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(`${config.entregues} (${config.totalParadas > 0 ? Math.round((config.entregues / config.totalParadas) * 100) : 0}%)`, kpi2X + 2, kpiY + 8.5);

    const kpi3X = margin + (kpiW + 4) * 2;
    doc.roundedRect(kpi3X, kpiY, kpiW, kpiH, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('QUILOMETRAGEM TOTAL', kpi3X + 2, kpiY + 4);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${config.kmTotal.toFixed(1)} km`, kpi3X + 2, kpiY + 8.5);

    const kpi4X = margin + (kpiW + 4) * 3;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(kpi4X, kpiY, kpiW, kpiH, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(21, 128, 61);
    doc.text('CUSTO TOTAL DE ROTAS', kpi4X + 2, kpiY + 4);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(formatCurrency(config.custoTotal), kpi4X + 2, kpiY + 8.5);

    // Table
    const headers = ['Rota', 'Cliente', 'Destinatário', 'Endereço / Bairro', 'Região', 'Material', 'Qtd', 'Status', 'Motoboy'];
    const rows = config.paradas.map((p) => [
      p.rotaCodigo || '-',
      p.clienteNome || '-',
      p.nomeDestinatario || '-',
      `${p.enderecoCompleto || ''}, ${p.bairro || ''}`,
      p.regiao || '-',
      p.tipoMaterial || '-',
      formatNumber(p.quantidadeMaterial || 1),
      p.status === 'entregue' ? 'Entregue' : p.status === 'insucesso' ? 'Insucesso' : 'Pendente',
      p.motoboyNome || '-',
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: kpiY + kpiH + 5,
      margin: { left: margin, right: margin, bottom: 15 },
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20, font: 'courier', fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 60 },
        4: { cellWidth: 22 },
        5: { cellWidth: 30 },
        6: { cellWidth: 15, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 22 },
        8: { cellWidth: 25 },
      },
    });

    doc.save(config.fileName || `Relatorio_Rotas_${Date.now()}.pdf`);
    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro ao baixar relatório de rotas:', error);
    return { success: false, error: error?.message || 'Falha ao gerar relatório.' };
  }
}

export interface ClientesReportPdfConfig {
  clientes: any[];
  usuarioAtualNome?: string;
  orientacao?: 'retrato' | 'paisagem';
  tipoVisualizacao?: 'analitico' | 'sintetico';
  incluirEnderecos?: boolean;
  incluirContatos?: boolean;
  incluirInterferencias?: boolean;
  incluirAssinaturas?: boolean;
  observacoesPersonalizadas?: string;
  filtrosDescricao?: string;
  codigoAutenticacao?: string;
  dataEmissao?: string;
  fileName?: string;
}

/**
 * Cria o jsPDF oficial para Relatório de Clientes / Comitês
 */
export function buildClientesJsPdf(config: ClientesReportPdfConfig): jsPDF {
  const isLandscape = config.orientacao === 'paisagem';
  const orientation = isLandscape ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const dataEmissao = config.dataEmissao || new Date().toLocaleString('pt-BR');
  const authCode =
    config.codigoAutenticacao ||
    `CLI-TSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const clientes = config.clientes || [];
  const totalRegistros = clientes.length;
  const volumeTotal = clientes.reduce((acc, c) => acc + (c.volumeTotalMateriais || 0), 0);
  const entregasTotal = clientes.reduce((acc, c) => acc + (c.totalEntregas || 0), 0);

  // Contadores de Agendamento
  const hojeStr = new Date().toISOString().slice(0, 10);
  const amanhaCalc = new Date();
  amanhaCalc.setDate(amanhaCalc.getDate() + 1);
  const amanhaStr = amanhaCalc.toISOString().slice(0, 10);

  const agendadosHoje = clientes.filter((c) => (c.dataAgendada || c.data || '').slice(0, 10) === hojeStr).length;
  const agendadosAmanha = clientes.filter((c) => (c.dataAgendada || c.data || '').slice(0, 10) === amanhaStr).length;

  // 1. Cabeçalho Oficial
  doc.setFillColor(224, 83, 40); // Laranja #E05328
  doc.rect(margin, 8, contentWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('FLEETMOTO LOGÍSTICA ELEITORAL', margin, 15);

  doc.setFontSize(7.5);
  doc.setFillColor(254, 242, 237);
  doc.setDrawColor(224, 83, 40);
  doc.roundedRect(margin + 88, 11, 38, 5, 1, 1, 'FD');
  doc.setTextColor(194, 65, 12);
  doc.text('CADASTRO DE CLIENTES TSE', margin + 90, 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(224, 83, 40);
  doc.text('Relatório Oficial de Clientes, Rotas & Agendamentos', margin, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const filtrosInfo = config.filtrosDescricao || 'Listagem consolidada de comitês, candidatos e cronogramas de entrega';
  doc.text(filtrosInfo, margin, 25);

  // Metadados direita
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Emissão: ${dataEmissao}`, pageWidth - margin, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Operador: ${config.usuarioAtualNome || 'Administrador'}`, pageWidth - margin, 18, { align: 'right' });
  doc.setFont('courier', 'bold');
  doc.setTextColor(224, 83, 40);
  doc.text(authCode, pageWidth - margin, 22, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 27, pageWidth - margin, 27);

  // 2. KPIs
  const kpiY = 29;
  const kpiH = 10;
  const kpiCount = 4;
  const kpiW = (contentWidth - (kpiCount - 1) * 3) / kpiCount;

  // KPI 1: Total
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, kpiY, kpiW, kpiH, 1, 1, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DE CLIENTES', margin + 2.5, kpiY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalRegistros} cadastros`, margin + 2.5, kpiY + 8);

  // KPI 2: Agendados Hoje/Amanhã
  const kpi2X = margin + kpiW + 3;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(kpi2X, kpiY, kpiW, kpiH, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(21, 128, 61);
  doc.text('AGENDADOS HOJE / AMANHÃ', kpi2X + 2.5, kpiY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text(`${agendadosHoje} hoje • ${agendadosAmanha} amanhã`, kpi2X + 2.5, kpiY + 8);

  // KPI 3: Volume Materiais
  const kpi3X = margin + (kpiW + 3) * 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(kpi3X, kpiY, kpiW, kpiH, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('VOLUME MATERIAIS', kpi3X + 2.5, kpiY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatNumber(volumeTotal)} un`, kpi3X + 2.5, kpiY + 8);

  // KPI 4: Total Entregas
  const kpi4X = margin + (kpiW + 3) * 3;
  doc.roundedRect(kpi4X, kpiY, kpiW, kpiH, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ENTREGAS', kpi4X + 2.5, kpiY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatNumber(entregasTotal)} concluídas`, kpi4X + 2.5, kpiY + 8);

  // 3. Tabela
  const tableStartY = kpiY + kpiH + 4;

  if (config.tipoVisualizacao === 'sintetico') {
    // Agrupamento por Região / Rota
    const agrupado: Record<string, { total: number; volume: number; hoje: number; amanha: number }> = {};
    clientes.forEach((c) => {
      const reg = c.regiaoRota || 'Sem Rota Definida';
      if (!agrupado[reg]) {
        agrupado[reg] = { total: 0, volume: 0, hoje: 0, amanha: 0 };
      }
      agrupado[reg].total += 1;
      agrupado[reg].volume += c.volumeTotalMateriais || 0;
      const d = (c.dataAgendada || c.data || '').slice(0, 10);
      if (d === hojeStr) agrupado[reg].hoje += 1;
      if (d === amanhaStr) agrupado[reg].amanha += 1;
    });

    const headers = ['Região / Rota Operacional', 'Qtd Clientes', 'Agendados Hoje', 'Agendados Amanhã', 'Volume Materiais'];
    const rows = Object.entries(agrupado).map(([reg, d]) => [
      reg,
      formatNumber(d.total),
      formatNumber(d.hoje),
      formatNumber(d.amanha),
      `${formatNumber(d.volume)} un`,
    ]);

    rows.push([
      'TOTAL CONSOLIDADO',
      formatNumber(totalRegistros),
      formatNumber(agendadosHoje),
      formatNumber(agendadosAmanha),
      `${formatNumber(volumeTotal)} un`,
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
      margin: { left: margin, right: margin, bottom: 20 },
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52] },
        3: { halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  } else {
    // Modo Analítico Completo
    const headers = [
      'Data / Hora',
      'Cliente / Candidato',
      'Rota / Região',
      'Endereço / Bairro',
      'Materiais',
      'Contato / Responsável',
      'Status',
    ];

    const rows = clientes.map((c) => {
      const dataStr = c.dataAgendada || c.data ? formatDate(c.dataAgendada || c.data) : 'Sem data';
      const horaStr = c.horarioAgendado || c.horario ? ` às ${c.horarioAgendado || c.horario}h` : '';
      const candStr = c.candidato && c.candidato !== c.nome ? `${c.nome}\n(${c.candidato}${c.partido ? ` • ${c.partido}` : ''})` : c.nome;
      const endStr = `${c.endereco || ''}${c.numeroEnd ? `, ${c.numeroEnd}` : ''}${c.bairro ? ` - ${c.bairro}` : ''}`;
      const matStr = (c.materiais || []).join(', ') || '-';
      const contStr = `${c.responsavel || ''}${c.telefone ? `\nTel: ${c.telefone}` : ''}`;
      const statusStr = c.status ? c.status.toUpperCase() : 'ATIVO';

      return [
        `${dataStr}${horaStr}`,
        candStr,
        c.regiaoRota || 'Sem rota',
        endStr || '-',
        matStr,
        contStr || '-',
        statusStr,
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
      margin: { left: margin, right: margin, bottom: 20 },
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: isLandscape ? 28 : 24, fontStyle: 'bold' },
        1: { cellWidth: isLandscape ? 45 : 36, fontStyle: 'bold', textColor: [15, 23, 42] },
        2: { cellWidth: isLandscape ? 30 : 25 },
        3: { cellWidth: isLandscape ? 60 : 42 },
        4: { cellWidth: isLandscape ? 35 : 24 },
        5: { cellWidth: isLandscape ? 40 : 26 },
        6: { cellWidth: isLandscape ? 22 : 16, halign: 'center' },
      },
    });
  }

  // 4. Observações e Assinaturas
  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
  let currentY = finalY + 5;

  if (config.observacoesPersonalizadas) {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 15;
    }
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(253, 224, 71);
    const obsLines = doc.splitTextToSize(`Observações do Relatório: ${config.observacoesPersonalizadas}`, contentWidth - 6);
    const obsHeight = Math.max(9, obsLines.length * 3.5 + 4);
    doc.roundedRect(margin, currentY, contentWidth, obsHeight, 1, 1, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(113, 63, 18);
    doc.text(obsLines, margin + 3, currentY + 4);
    currentY += obsHeight + 5;
  }

  if (config.incluirAssinaturas !== false) {
    if (currentY > pageHeight - 25) {
      doc.addPage();
      currentY = 15;
    }
    const sigWidth = (contentWidth - 20) / 2;
    const lineY = currentY + 10;
    doc.setDrawColor(148, 163, 184);
    doc.line(margin, lineY, margin + sigWidth, lineY);
    doc.line(margin + sigWidth + 20, lineY, margin + sigWidth * 2 + 20, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(config.usuarioAtualNome || 'Responsável pela Logística', margin + sigWidth / 2, lineY + 3.5, { align: 'center' });
    doc.text('Auditoria de Entregas & Conformidade TSE', margin + sigWidth + 20 + sigWidth / 2, lineY + 3.5, { align: 'center' });
  }

  // 5. Numeração de páginas
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FleetMoto Logística Eleitoral • Relatório Oficial de Clientes • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Realiza o download direto do Relatório de Clientes em PDF
 */
export function downloadClientesReportPdf(config: ClientesReportPdfConfig): { success: boolean; error?: string } {
  try {
    const doc = buildClientesJsPdf(config);
    const fileName = config.fileName
      ? config.fileName.endsWith('.pdf')
        ? config.fileName
        : `${config.fileName}.pdf`
      : `Relatorio_Clientes_FleetMoto_${Date.now()}.pdf`;

    doc.save(fileName);
    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro ao baixar relatório de clientes:', error);
    return {
      success: false,
      error: error?.message || 'Falha ao gerar o arquivo PDF de clientes.',
    };
  }
}

/**
 * Abre o Relatório de Clientes para impressão direta ou janela do navegador
 */
export function printClientesReportPdf(config: ClientesReportPdfConfig): { success: boolean; error?: string } {
  try {
    const doc = buildClientesJsPdf(config);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '-9999px';
    printIframe.style.bottom = '-9999px';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.src = blobUrl;
    document.body.appendChild(printIframe);

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('[pdfGenerator] Falha ao acionar print no iframe, abrindo em nova aba:', printErr);
          window.open(blobUrl, '_blank');
        } finally {
          setTimeout(() => {
            if (printIframe.parentNode) printIframe.parentNode.removeChild(printIframe);
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      }, 300);
    };

    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro ao imprimir PDF de clientes:', error);
    return downloadClientesReportPdf(config);
  }
}

/**
 * Fallback genérico para exportar qualquer elemento HTML para PDF via html2canvas
 */
export interface GenericPdfOptions {
  fileName?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportElementToPdf(
  elementId: string,
  options: GenericPdfOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`Elemento com ID '${elementId}' não encontrado.`);
    }

    const orientation = options.orientation || 'portrait';
    const isLandscape = orientation === 'landscape';
    const fileName = options.fileName
      ? options.fileName.endsWith('.pdf')
        ? options.fileName
        : `${options.fileName}.pdf`
      : `Documento_FleetMoto_${Date.now()}.pdf`;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = isLandscape ? 297 : 210;
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, imgHeight, undefined, 'FAST');
    pdf.save(fileName);
    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Erro em exportElementToPdf:', error);
    return {
      success: false,
      error: error?.message || 'Não foi possível converter o elemento para PDF.',
    };
  }
}
