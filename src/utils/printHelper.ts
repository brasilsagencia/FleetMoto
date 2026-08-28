/**
 * printHelper.ts
 * Utilitário universal e de alta resiliência para impressão e geração de PDF
 * Compatível com browsers modernos, iFrames (AI Studio sandbox), modais e dispositivos móveis.
 */

import { exportElementToPdf } from './pdfGenerator';

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageFormat?: 'a4' | 'a5' | 'termica' | 'auto';
  customCss?: string;
  autoPdfFallback?: boolean;
}

const MOUNT_ID = 'fleetmoto-print-mount-point';
const STYLE_OVERRIDE_ID = 'fleetmoto-print-temp-style';

/**
 * Imprime um elemento HTML específico pelo ID utilizando montagem direta e suporte a iframe isolado
 */
export function printElementById(elementId: string, options: PrintOptions = {}) {
  const el = document.getElementById(elementId);
  const title = options.title || document.title || 'Documento FleetMoto';

  if (!el) {
    console.warn(`[printHelper] Elemento com id '${elementId}' não encontrado.`);
    try {
      window.print();
    } catch {
      // Ignora erro
    }
    return;
  }

  // Tenta método via iframe isolado primeiro (mais estável em iframes e ambientes sandboxed)
  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'fleetmoto-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.bottom = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      // Coletar estilos da página atual
      const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      let stylesHtml = '';
      styleNodes.forEach((node) => {
        stylesHtml += node.outerHTML;
      });

      const pageSize = options.pageFormat === 'termica' ? '80mm auto' : 'auto';
      const pageMargin = options.pageFormat === 'termica' ? '3mm' : '8mm';

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            ${stylesHtml}
            <style>
              @page {
                size: ${pageSize};
                margin: ${pageMargin};
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                margin: 0 !important;
                padding: 12px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              button, .no-print, .print-hidden {
                display: none !important;
              }
              ${options.customCss || ''}
            </style>
          </head>
          <body>
            ${el.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('[printHelper] Iframe print falhou, tentando método DOM direto:', err);
          fallbackDomPrint(el, title, options);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }
      }, 150);

      return;
    }
  } catch (iframeErr) {
    console.warn('[printHelper] Erro ao criar iframe de impressão:', iframeErr);
  }

  // Fallback se iframe não for suportado
  fallbackDomPrint(el, title, options);
}

function fallbackDomPrint(el: HTMLElement, title: string, options: PrintOptions) {
  // 1. Remove qualquer mount point anterior
  const existingMount = document.getElementById(MOUNT_ID);
  if (existingMount && existingMount.parentNode) {
    existingMount.parentNode.removeChild(existingMount);
  }

  // 2. Remove style temporário anterior
  const existingStyle = document.getElementById(STYLE_OVERRIDE_ID);
  if (existingStyle && existingStyle.parentNode) {
    existingStyle.parentNode.removeChild(existingStyle);
  }

  // 3. Cria container isolado no topo do <body>
  const mountPoint = document.createElement('div');
  mountPoint.id = MOUNT_ID;
  mountPoint.className = 'fleetmoto-print-container-root printable-area bg-white text-slate-900';
  mountPoint.innerHTML = el.innerHTML;
  document.body.appendChild(mountPoint);

  // 4. Injeta CSS temporário
  const pageSize = options.pageFormat === 'termica' ? '80mm auto' : 'auto';
  const pageMargin = options.pageFormat === 'termica' ? '3mm' : '8mm';

  const tempStyle = document.createElement('style');
  tempStyle.id = STYLE_OVERRIDE_ID;
  tempStyle.textContent = `
    @page {
      size: ${pageSize};
      margin: ${pageMargin};
    }
    ${options.customCss || ''}
  `;
  document.head.appendChild(tempStyle);

  const originalTitle = document.title;
  document.title = title;
  document.body.classList.add('is-printing-specific-target');

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    document.body.classList.remove('is-printing-specific-target');
    document.title = originalTitle;

    if (mountPoint.parentNode) {
      mountPoint.parentNode.removeChild(mountPoint);
    }
    if (tempStyle.parentNode) {
      tempStyle.parentNode.removeChild(tempStyle);
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('[printHelper] Erro ao invocar window.print():', err);
        if (options.autoPdfFallback !== false) {
          exportElementToPdf(el.id, { fileName: title, orientation: options.orientation });
        }
      } finally {
        setTimeout(cleanup, 2500);
      }
    }, 60);
  });
}

/**
 * Imprime uma string HTML avulsa diretamente
 */
export function printHtml(htmlContent: string, options: PrintOptions = {}) {
  const title = options.title || 'Documento FleetMoto';

  const existingMount = document.getElementById(MOUNT_ID);
  if (existingMount && existingMount.parentNode) {
    existingMount.parentNode.removeChild(existingMount);
  }

  const mountPoint = document.createElement('div');
  mountPoint.id = MOUNT_ID;
  mountPoint.className = 'fleetmoto-print-container-root printable-area bg-white text-slate-900';
  mountPoint.innerHTML = htmlContent;
  document.body.appendChild(mountPoint);

  const originalTitle = document.title;
  document.title = title;
  document.body.classList.add('is-printing-specific-target');

  const cleanup = () => {
    document.body.classList.remove('is-printing-specific-target');
    document.title = originalTitle;
    if (mountPoint.parentNode) {
      mountPoint.parentNode.removeChild(mountPoint);
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('[printHelper] Falha ao imprimir HTML:', err);
      } finally {
        setTimeout(cleanup, 2500);
      }
    }, 60);
  });
}
