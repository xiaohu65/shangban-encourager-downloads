const preview = document.querySelector('.preview-frame');
const demo = document.querySelector('[data-demo-frame]');

if (preview && demo) {
  let demoHeight = 706;
  const fitDemo = () => {
    const scale = preview.clientWidth / 400;
    demo.style.transform = `scale(${scale})`;
    demo.style.height = `${demoHeight}px`;
    preview.style.height = `${Math.ceil(demoHeight * scale) + 2}px`;
    demo.contentWindow?.postMessage({ type: 'encourager-demo-scale', scale }, location.origin);
  };
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== demo.contentWindow) return;
    const data = event.data;
    if (!data || data.type !== 'encourager-demo-size' || !Number.isFinite(data.height)) return;
    if (data.height < 500 || data.height > 1400) return;
    demoHeight = Math.ceil(data.height);
    fitDemo();
  });
  demo.addEventListener('load', fitDemo);
  new ResizeObserver(fitDemo).observe(preview);
  fitDemo();
}
