import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a5';
  marginMm?: number;
}

/**
 * Gera e realiza download de um arquivo PDF a partir de um elemento do DOM
 * Utiliza html2canvas + jsPDF com alta resolução (scale: 2) e suporte a múltiplas páginas.
 */
export async function exportElementToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`Elemento com ID '${elementId}' não encontrado no documento.`);
    }

    const orientation = options.orientation || 'portrait';
    const isLandscape = orientation === 'landscape';
    const fileName = options.fileName
      ? options.fileName.endsWith('.pdf')
        ? options.fileName
        : `${options.fileName}.pdf`
      : `Relatorio_FleetMoto_${Date.now()}.pdf`;

    // Dimensões A4 em milímetros
    const pageWidthMm = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;
    const marginMm = options.marginMm !== undefined ? options.marginMm : 8;
    const contentWidthMm = pageWidthMm - marginMm * 2;

    // Renderizar o elemento com alta resolução
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Garantir que elementos no clone tenham visualização clara e sem overflow truncado
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.maxHeight = 'none';
          clonedEl.style.overflow = 'visible';
          clonedEl.style.width = isLandscape ? '1100px' : '820px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.backgroundColor = '#ffffff';

          // Ocultar botões ou elementos de ação no clone
          const noPrintNodes = clonedEl.querySelectorAll('button, .no-print, .print-hidden');
          noPrintNodes.forEach((node) => {
            (node as HTMLElement).style.display = 'none';
          });
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Calcular altura proporcional da imagem em mm
    const imgWidthMm = contentWidthMm;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
    const maxPageContentHeightMm = pageHeightMm - marginMm * 2;

    if (imgHeightMm <= maxPageContentHeightMm) {
      // Cabe em uma única página
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, imgWidthMm, imgHeightMm, undefined, 'FAST');
    } else {
      // Múltiplas páginas: divide fatiando o canvas
      let heightLeftMm = imgHeightMm;
      let positionY = marginMm;
      let pageNumber = 1;

      while (heightLeftMm > 0) {
        if (pageNumber > 1) {
          pdf.addPage();
        }

        // Posiciona a imagem deslocando para cima conforme a página
        pdf.addImage(
          imgData,
          'JPEG',
          marginMm,
          positionY - (pageNumber - 1) * maxPageContentHeightMm,
          imgWidthMm,
          imgHeightMm,
          undefined,
          'FAST'
        );

        // Rodapé com numeração de página
        pdf.setFontSize(8);
        pdf.setTextColor(140, 140, 140);
        pdf.text(
          `FleetMoto Logística • Página ${pageNumber}`,
          pageWidthMm / 2,
          pageHeightMm - 4,
          { align: 'center' }
        );

        heightLeftMm -= maxPageContentHeightMm;
        pageNumber++;
      }
    }

    // Salva diretamente o arquivo
    pdf.save(fileName);
    return { success: true };
  } catch (error: any) {
    console.error('[pdfGenerator] Falha ao exportar PDF:', error);
    return {
      success: false,
      error: error?.message || 'Não foi possível gerar o arquivo PDF.',
    };
  }
}
