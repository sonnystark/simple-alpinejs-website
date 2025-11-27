import Alpine from 'alpinejs';

declare global {
  interface Window {
    Alpine?: typeof Alpine;
    qdoo?: any;
    __quandooWidgetLoaded?: boolean;
    // test helper
    insertQuandooWidget?: (
      containerId: string,
      agentId: number,
      merchantId: number
    ) => Promise<void>;
  }
}

window.Alpine = Alpine;
Alpine.start();

/* ---------- Helper: load remote script once ---------- */
function loadScriptOnce(src: string, id?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    if (src.includes('quandoo') && window.__quandooWidgetLoaded) {
      resolve();
      return;
    }

    const s = document.createElement('script');
    if (id) s.id = id;
    s.async = true;
    s.src = src;
    s.onload = () => {
      if (src.includes('quandoo')) window.__quandooWidgetLoaded = true;
      resolve();
    };
    s.onerror = (e) => reject(new Error(`Failed to load ${src}: ${e}`));
    document.head.appendChild(s);
  });
}

/* ---------- Insert Quandoo widget (idempotent) ---------- */
async function insertQuandooWidget(
  containerId: string,
  agentId: number,
  merchantId: number
) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('insertQuandooWidget: container not found', containerId);
    return;
  }

  if ((container as any).__quandooInjected) {
    return;
  }

  const scriptSrc = 'https://booking-widget.quandoo.com/index.js';
  const script = document.createElement('script');
  script.src = scriptSrc;
  script.async = true;
  script.setAttribute('data-agent-id', String(agentId));
  script.setAttribute('data-merchant-id', String(merchantId));

  const scriptId = `quandoo-script-${containerId}`;
  script.id = scriptId;
  container.insertAdjacentElement('afterend', script);

  try {
    await loadScriptOnce(scriptSrc, scriptId);
    (container as any).__quandooInjected = true;
    console.log('Quandoo: script loaded and widget should be initialized');

    if ((window as any).qdoo) {
      try {
        const qdoo = (window as any).qdoo;
        if (typeof qdoo.onReservationComplete === 'function') {
          qdoo.onReservationComplete((event: any) => {
            console.log('Quandoo reservation complete', event?.payload);
          });
        }
        if (typeof qdoo.onEnquiryComplete === 'function') {
          qdoo.onEnquiryComplete((event: any) => {
            console.log('Quandoo enquiry complete', event?.payload);
          });
        }
        if (typeof qdoo.onContinueCheckoutOnPortal === 'function') {
          qdoo.onContinueCheckoutOnPortal((event: any) => {
            console.log('Quandoo continue on portal', event?.payload);
          });
        }
      } catch (err) {
        console.warn('Failed to register Quandoo callbacks:', err);
      }
    }
  } catch (err) {
    console.error('Failed to load Quandoo widget script:', err);
    container.innerHTML =
      '<div class="quandoo-error">Das Reservierungs-Widget konnte nicht geladen werden. Bitte versuchen Sie es später.</div>';
  }
}

/* ---------- Auto-load when the reservation panel becomes visible ---------- */
function setupQuandooAutoLoad(
  containerId: string,
  panelId: string,
  agentId: number,
  merchantId: number
) {
  const panel = document.getElementById(panelId);
  const accordion = document.querySelector<HTMLElement>('.accordion');

  if (!panel) {
    console.warn('setupQuandooAutoLoad: panel not found', panelId);
    return;
  }

  const tryInsertIfVisible = () => {
    const style = window.getComputedStyle(panel);
    const isVisible =
      style &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      panel.offsetParent !== null;
    if (isVisible) {
      insertQuandooWidget(containerId, agentId, merchantId);
    }
  };

  // Observe attribute changes on the panel (x-show toggles inline style)
  const mo = new MutationObserver((_mutations) => {
    tryInsertIfVisible();
    const container = document.getElementById(containerId);
    if (container && (container as any).__quandooInjected) {
      mo.disconnect();
    }
  });
  mo.observe(panel, { attributes: true, attributeFilter: ['style', 'class'] });

  // Fallback: also check after accordion clicks
  if (accordion) {
    accordion.addEventListener('click', () =>
      setTimeout(tryInsertIfVisible, 50)
    );
  }

  // Check once at startup (in case panel is pre-open)
  setTimeout(tryInsertIfVisible, 50);
}

/* ---------- Configure with your Quandoo IDs and element IDs ---------- */
const AGENT_ID = 2;
const MERCHANT_ID = 95822;
const CONTAINER_ID = 'quandoo-booking-widget';
const PANEL_ID = 'accContent5';

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () =>
      setupQuandooAutoLoad(CONTAINER_ID, PANEL_ID, AGENT_ID, MERCHANT_ID)
    );
  } else {
    setupQuandooAutoLoad(CONTAINER_ID, PANEL_ID, AGENT_ID, MERCHANT_ID);
  }
}

// expose test helper for manual injection from the console (optional)
(window as any).insertQuandooWidget = insertQuandooWidget;

export {};
