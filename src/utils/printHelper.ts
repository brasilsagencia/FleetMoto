/**
 * printHelper.ts
 * Utilitário universal e de alta resiliência para impressão e geração de PDF
 * Funciona perfeitamente em browsers modernos, iFrames (AI Studio), modais e dispositivos móveis.
 */

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageFormat?: 'a4' | 'a5' | 'termica' | 'auto';
  customCss?: string;
}

const MOUNT_ID = 'fleetmoto-print-mount-point';
const STYLE_OVERRIDE_ID = 'fleetmoto-print-temp-style';

/**
 * Imprime um elemento HTML específico pelo ID utilizando montagem direta no DOM
 * Este método é 100% imune a bloqueios de sandboxing de iframe e sobreposições de modais.
 */
export function printElementById(elementId: string, options: PrintOptions = {}) {
  const el = document.getElementById(elementId);
  const title = options.title || document.title || 'Documento FleetMoto';

  if (!el) {
    console.warn(`[printHelper] Elemento com id '${elementId}' não encontrado. Executando window.print() padrão.`);
    window.print();
    return;
  }

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

  // 4. Injeta CSS temporário para regras específicas de página (ex: térmico ou customCss)
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

  // 5. Salva título original e define título de impressão (usado pelo navegador como nome do PDF)
  const originalTitle = document.title;
  document.title = title;

  // 6. Adiciona classe ao body que isola o elemento impresso
  document.body.classList.add('is-printing-specific-target');

  // 7. Cleanup callback
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

  // 8. Dispara o diálogo de impressão
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error('[printHelper] Erro ao invocar window.print():', err);
      } finally {
        // Fallback de segurança para remover o container
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
