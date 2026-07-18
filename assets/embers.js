/* ============================================================
   CRIMSON AETHER — EMBERS
   Floating aether sparks. Lightweight canvas, pauses when the
   tab is hidden, disabled for prefers-reduced-motion.
   Usage: CA_embers(canvasElement, {count: 26})
   ============================================================ */
window.CA_embers = function (canvas, opts) {
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  opts = opts || {};
  var ctx = canvas.getContext("2d");
  var COUNT = opts.count || 26;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, parts = [], running = true, raf;

  var COLORS = [
    [196, 18, 48],   /* blood */
    [201, 168, 76],  /* gold */
    [232, 206, 142], /* gold-hi */
    [139, 0, 0]      /* crimson */
  ];

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(fresh) {
    var c = COLORS[(Math.random() * COLORS.length) | 0];
    return {
      x: Math.random() * W,
      y: fresh ? H + 10 : Math.random() * H,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.15 + Math.random() * 0.5,
      sway: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.25 + Math.random() * 0.55,
      c: c,
      flicker: 0.5 + Math.random() * 2
    };
  }

  function tick(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y -= p.vy;
      p.x += Math.sin(t / 1400 * p.flicker + p.phase) * p.sway * 0.25;
      var a = p.alpha * (0.65 + 0.35 * Math.sin(t / 500 * p.flicker + p.phase));
      /* fade near top */
      var fade = Math.min(1, p.y / (H * 0.28));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + p.c[0] + "," + p.c[1] + "," + p.c[2] + "," + (a * fade).toFixed(3) + ")";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(" + p.c[0] + "," + p.c[1] + "," + p.c[2] + ",0.8)";
      ctx.fill();
      ctx.shadowBlur = 0;
      if (p.y < -12) parts[i] = spawn(true);
    }
    raf = requestAnimationFrame(tick);
  }

  size();
  for (var i = 0; i < COUNT; i++) parts.push(spawn(false));
  raf = requestAnimationFrame(tick);

  window.addEventListener("resize", size);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; raf = requestAnimationFrame(tick); }
  });
};
