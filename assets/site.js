(function () {
  var root = document.documentElement;
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l === 'zh' ? 'zh-Hant' : 'en');
    try { localStorage.setItem('lang', l); } catch (e) {}
    var t = document.querySelector('title');
    if (t && t.dataset[l]) document.title = t.dataset[l];
  }
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  setLang(saved || root.getAttribute('data-lang') || 'zh');

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang-toggle]');
    if (b) { setLang(root.getAttribute('data-lang') === 'zh' ? 'en' : 'zh'); return; }
    var m = e.target.closest('.menu-btn');
    if (m) {
      var nav = document.getElementById('nav');
      var open = nav.classList.toggle('open');
      m.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    var s = e.target.closest('.shot');
    if (s) {
      var lb = document.getElementById('lb');
      var img = s.querySelector('img');
      lb.querySelector('img').src = s.dataset.full || img.src;
      lb.querySelector('img').alt = img.alt;
      if (lb.showModal) lb.showModal();
      return;
    }
    if (e.target.matches('dialog.lb')) e.target.close();
  });
})();
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var els = document.querySelectorAll('.card, .tl > li, .page-head, .pd-head, .stat');
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 3) * 60 + 'ms'; io.observe(el); });
  setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 2500);
})();
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-carousel]').forEach(function (c) {
    var track = c.querySelector('.car-track');
    var n = track.children.length;
    var dots = c.querySelectorAll('.car-dot');
    var prev = c.querySelector('.prev'), next = c.querySelector('.next'), play = c.querySelector('.car-play');
    var cur = 0, timer = null, stopped = reduce;
    var vids = c.querySelectorAll('video');
    var lockVideo = vids.length && !reduce;
    if (lockVideo) c.classList.add('has-video');
    if (vids.length) document.addEventListener('visibilitychange', function () { if (!document.hidden) syncVideo(); });
    vids.forEach(function (v) {
      v.muted = true; v.volume = 0;
      v.addEventListener('volumechange', function () { if (!v.muted || v.volume) { v.muted = true; v.volume = 0; } });
      v.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    function syncVideo() {
      if (!vids.length) return;
      vids.forEach(function (v, i) { if (i !== cur) { v.pause(); } });
      var v = vids[cur];
      if (v && !stopped) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else if (v) v.pause();
    }
    function step() { return track.children[0].getBoundingClientRect().width || 1; }
    function maxIdx() { return Math.max(0, n - Math.max(1, Math.round(track.clientWidth / step()))); }
    function go(i, smooth) {
      var m = maxIdx();
      cur = i > m ? 0 : (i < 0 ? m : i);
      track.scrollTo({ left: step() * cur, behavior: smooth === false || reduce ? 'auto' : 'smooth' });
      mark();
      if (vids.length && vids[cur]) { try { vids[cur].currentTime = 0; } catch (e) {} }
      syncVideo();
    }
    function mark() {
      dots.forEach(function (d, i) { if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    }
    function start() { stop(); if (vids.length) { syncVideo(); return; } if (!stopped) timer = setInterval(function () { go(cur + 1); }, 4500); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function setStopped(v) { stopped = v; c.classList.toggle('paused', v); if (v) { stop(); syncVideo(); } else start(); }
    vids.forEach(function (v) { v.addEventListener('ended', function () { if (!stopped) go(cur + 1); }); });
    prev.addEventListener('click', function () { go(cur - 1); start(); });
    next.addEventListener('click', function () { go(cur + 1); start(); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(Math.min(i, maxIdx())); start(); }); });
    play.addEventListener('click', function () { setStopped(!stopped); });
    var st;
    track.addEventListener('scroll', function () {
      clearTimeout(st);
      st = setTimeout(function () { var i = Math.round(track.scrollLeft / step()); if (i !== cur) { cur = i; mark(); syncVideo(); } }, 80);
    }, { passive: true });
    if (!vids.length) {
      c.addEventListener('mouseenter', stop);
      c.addEventListener('mouseleave', start);
      c.addEventListener('focusin', stop);
      c.addEventListener('focusout', start);
    }
    track.addEventListener('touchstart', function () { if (!lockVideo) setStopped(true); }, { passive: true });
    c.addEventListener('click', function (e) { if (e.target.closest('.shot')) setStopped(true); });
    window.addEventListener('resize', function () { go(cur, false); });
    c.classList.toggle('paused', stopped);
    mark();
    if (vids.length && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) start(); else vids.forEach(function (v) { v.pause(); }); });
      }, { threshold: 0.4 }).observe(c);
    } else start();
  });
})();
