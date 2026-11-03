(() => {
  'use strict';

  // This clock exists only in the demonstration iframe. The existing renderer
  // and its original payroll functions calculate every displayed value.
  const OriginalDate = window.Date;
  const startTime = new OriginalDate(2026, 10, 2, 15, 0, 0).getTime();
  const startedAt = performance.now();
  const currentTime = () => startTime + Math.max(0, performance.now() - startedAt);

  class DemoDate extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) super(currentTime());
      else super(...args);
    }

    static now() {
      return currentTime();
    }
  }

  window.Date = DemoDate;

  const settings = {
    salary: { mode: 'hourly', amount: '20' },
    schedule: {
      weekdays: [1, 2, 3, 4, 5],
      start: '09:00',
      end: '18:00',
      lunch: { enabled: true, start: '12:00', end: '13:30' },
    },
    goal: { name: '一件 T 恤', price: '129' },
    alwaysOnTop: false,
  };

  const demoState = () => ({ settings: structuredClone(settings), configured: true });
  const noSubscription = () => () => {};

  // A browser-only bridge supplies an explicit sample; it has no desktop IPC,
  // disk storage, user configuration, network request, or persisted state.
  Object.defineProperty(window, 'encourager', {
    configurable: false,
    writable: false,
    value: Object.freeze({
      getState: async () => demoState(),
      saveSettings: async () => demoState(),
      onSettingsChanged: noSubscription,
      onResume: noSubscription,
    }),
  });

  let lastScale;
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const data = event.data;
    if (!data || data.type !== 'encourager-demo-scale' || !Number.isFinite(data.scale)) return;
    if (data.scale < 0.2 || data.scale > 2 || data.scale === lastScale) return;
    lastScale = data.scale;
    document.documentElement.style.setProperty(
      '--demo-min-font-size',
      `${(12.05 / data.scale).toFixed(4)}px`,
    );
  });

  const initializeDemoView = () => {
    const button = document.querySelector('.app-header .text-button');
    const shell = document.querySelector('.app-shell');
    if (!button || !shell) return false;
    button.inert = true;
    button.setAttribute('inert', '');
    button.tabIndex = -1;

    let lastHeight = 0;
    const reportHeight = () => {
      const height = Math.ceil(shell.getBoundingClientRect().height);
      if (!Number.isFinite(height) || height <= 0 || height === lastHeight) return;
      lastHeight = height;
      window.parent.postMessage({ type: 'encourager-demo-size', height }, window.location.origin);
    };
    reportHeight();
    const resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(shell);
    window.addEventListener('pagehide', () => resizeObserver.disconnect(), { once: true });
    return true;
  };

  if (!initializeDemoView()) {
    const observer = new MutationObserver(() => {
      if (initializeDemoView()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
