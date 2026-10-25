/**
 * viewport-diag.js — overlay de diagnostic du viewport iOS.
 *
 * Sert à capturer l'état quand la barre du bas (.bottom-nav, position:fixed)
 * se retrouve au milieu de l'écran dans la web app iOS : innerHeight,
 * visualViewport, 100dvh et la position réelle de la barre.
 * On/off en touchant la ligne « Soft » dans Plus > Infos app ; l'état survit
 * au reload (localStorage). Mis à jour sur événements uniquement, pas de poll.
 */
var ViewportDiag = (() => {
  const KEY = 'tk-viewport-diag';
  const EVENTS = ['scroll', 'resize', 'orientationchange', 'pageshow', 'focusin', 'focusout', 'touchend'];
  let box = null;
  let probe = null;
  let lastEvent = 'init';
  let frame = 0;

  function onEvent(e) {
    lastEvent = e.type;
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function onVisibility() {
    onEvent({ type: 'visibility:' + document.visibilityState });
  }

  function paint() {
    frame = 0;
    if (!box) return;
    const vv = window.visualViewport;
    const de = document.documentElement;
    const nav = document.getElementById('bottom-nav');
    const r = nav ? nav.getBoundingClientRect() : null;
    const maxY = Math.max(0, de.scrollHeight - window.innerHeight);
    box.textContent = [
      `iH ${window.innerHeight} cH ${de.clientHeight} dvh ${probe.offsetHeight}`,
      `sY ${Math.round(window.scrollY)}/${maxY} sH ${de.scrollHeight}`,
      vv ? `vv h ${Math.round(vv.height)} top ${Math.round(vv.offsetTop)} pTop ${Math.round(vv.pageTop)} s ${vv.scale.toFixed(2)}` : 'vv n/a',
      r ? `nav ${Math.round(r.top)}-${Math.round(r.bottom)}` : 'nav n/a',
      `${navigator.standalone ? 'standalone' : 'browser'} · ${lastEvent} ${new Date().toLocaleTimeString()}`
    ].join('\n');
  }

  function start() {
    if (box) return;
    probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100dvh;visibility:hidden;pointer-events:none';
    box = document.createElement('pre');
    box.id = 'viewport-diag';
    box.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 4px);left:4px;z-index:10000;margin:0;padding:4px 6px;'
      + 'font:10px/1.3 ui-monospace,monospace;color:#0f0;background:rgba(0,0,0,.75);border-radius:6px;pointer-events:none;white-space:pre';
    document.body.append(probe, box);
    EVENTS.forEach(t => window.addEventListener(t, onEvent, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onEvent);
      window.visualViewport.addEventListener('scroll', onEvent);
    }
    paint();
  }

  function stop() {
    if (!box) return;
    EVENTS.forEach(t => window.removeEventListener(t, onEvent));
    document.removeEventListener('visibilitychange', onVisibility);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', onEvent);
      window.visualViewport.removeEventListener('scroll', onEvent);
    }
    box.remove();
    probe.remove();
    box = probe = null;
  }

  function toggle() {
    const on = !box;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) {}
    if (on) start(); else stop();
  }

  try { if (localStorage.getItem(KEY) === '1') start(); } catch (_) {}

  return { toggle };
})();
