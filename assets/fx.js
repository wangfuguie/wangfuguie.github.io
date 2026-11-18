/* Interactive layer: 3D hero, tilting cards, counting figures, scroll progress, coin shower.
   Everything here is decoration — the site works the same without it. */
(function () {
  var mm = window.matchMedia ? window.matchMedia.bind(window) : function () { return { matches: false }; };
  var reduce = mm('(prefers-reduced-motion: reduce)').matches;
  var fine = mm('(hover: hover) and (pointer: fine)').matches;
  var doc = document.documentElement;

  /* scroll progress bar */
  var bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function progress() {
    ticking = false;
    var max = doc.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, { passive: true });
  progress();

  /* figures count up when they come into view */
  var nums = document.querySelectorAll('.stat b');
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = parseInt(el.textContent, 10), t0 = null;
        if (!to) return;
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* cards lean toward the pointer, with a soft highlight under it */
  if (fine && !reduce) {
    var tiles = document.querySelectorAll('.card.skill, .card.pcard, .card.tile, .card.award, .home-duo .stat');
    tiles.forEach(function (el) {
      el.classList.add('tilt');
      var back = null;
      el.addEventListener('pointerenter', function () {
        clearTimeout(back);
        el.style.transitionDelay = '0ms';
        el.style.transition = 'transform .14s ease-out, box-shadow .3s';
        el.classList.add('on');
      });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 7).toFixed(2) + 'deg) scale(1.02)';
        el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('on');
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .3s';
        el.style.transform = '';
        back = setTimeout(function () { el.style.transition = ''; }, 520);
      });
    });
  }

  /* home hero: the portrait and its floating symbols turn with the pointer */
  var band = document.querySelector('.hero-band');
  var stage = document.querySelector('.portrait');
  if (band && stage) {
    if (fine && !reduce) {
      var raf = null, tx = 0, ty = 0;
      band.addEventListener('pointermove', function (e) {
        var r = band.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          stage.style.transform = 'rotateY(' + (tx * 16).toFixed(2) + 'deg) rotateX(' + (-ty * 12).toFixed(2) + 'deg)';
          band.style.setProperty('--mx', (tx * 60).toFixed(1) + 'px');
          band.style.setProperty('--my', (ty * 40).toFixed(1) + 'px');
        });
      });
      band.addEventListener('pointerleave', function () {
        stage.style.transform = '';
        band.style.setProperty('--mx', '0px');
        band.style.setProperty('--my', '0px');
      });
    } else if (!reduce) {
      stage.classList.add('sway');
    }
  }

  /* the coin showers coins (the name 富貴 means wealth) */
  var coin = document.querySelector('[data-coin-rain]');
  if (coin) {
    coin.addEventListener('click', function () {
      if (reduce || !coin.animate) return;
      coin.animate([{ scale: '1' }, { scale: '1.04' }, { scale: '1' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      var n = window.innerWidth < 768 ? 18 : 30;
      for (var i = 0; i < n; i++) {
        (function (i) {
          var c = document.createElement('img');
          c.src = 'assets/icons/coin.svg';
          c.alt = '';
          c.className = 'fx-coin';
          var size = 26 + Math.random() * 30;
          c.style.width = size + 'px';
          c.style.left = (Math.random() * 100) + 'vw';
          document.body.appendChild(c);
          var spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540);
          var drift = (Math.random() - 0.5) * 160;
          var a = c.animate([
            { transform: 'translate3d(0,-80px,0) rotate(0deg)', opacity: 1 },
            { transform: 'translate3d(' + drift + 'px,' + (window.innerHeight + 120) + 'px,0) rotate(' + spin + 'deg)', opacity: 1 }
          ], { duration: 1500 + Math.random() * 1400, delay: i * 35, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'both' });
          a.onfinish = function () { c.remove(); };
        })(i);
      }
    });
  }
  /* avatar / photo switch */
  var tog = document.querySelector('[data-av-toggle]');
  if (tog && stage) {
    tog.addEventListener('click', function () {
      var photo = stage.dataset.view !== 'photo';
      stage.dataset.view = photo ? 'photo' : 'avatar';
      tog.setAttribute('aria-pressed', photo);
    });
  }

  /* project strip: cards turn as they pass the centre */
  var track = document.querySelector('.feat-track');
  if (track && !reduce) {
    var cardsF = track.querySelectorAll('.fcard'), fr = null;
    var lay = function () {
      fr = null;
      var r = track.getBoundingClientRect(), mid = r.left + r.width / 2;
      cardsF.forEach(function (c) {
        var b = c.getBoundingClientRect();
        var d = Math.max(-1, Math.min(1, (b.left + b.width / 2 - mid) / (r.width / 2)));
        c.style.transform = 'rotateY(' + (-d * 26).toFixed(1) + 'deg) scale(' + (1 - Math.abs(d) * 0.1).toFixed(3) + ') translateZ(' + (-Math.abs(d) * 40).toFixed(0) + 'px)';
      });
    };
    var ask = function () { if (!fr) fr = requestAnimationFrame(lay); };
    track.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    lay();
  }
  /* back to top */
  var topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'fx-top';
  topBtn.setAttribute('aria-label', '回到頁面最上方 Back to top');
  topBtn.innerHTML = '<img src="assets/icons/coin.svg" alt="">';
  document.body.appendChild(topBtn);
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  window.addEventListener('scroll', function () { topBtn.classList.toggle('show', window.scrollY > 700); }, { passive: true });

  /* soft light following the pointer */
  if (fine && !reduce) {
    var glow = document.createElement('div');
    glow.className = 'fx-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(glow, document.body.firstChild);
    var gr = null, gx = 0, gy = 0;
    window.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (gr) return;
      gr = requestAnimationFrame(function () { gr = null; var z = parseFloat(getComputedStyle(doc).getPropertyValue('--z')) || 1; glow.style.transform = 'translate3d(' + (gx / z) + 'px,' + (gy / z) + 'px,0)'; glow.classList.add('on'); });
    }, { passive: true });
    document.addEventListener('pointerleave', function () { glow.classList.remove('on'); });
  }
  /* project strip plays by itself: one card at a time, back to the first after the last */
  var strip = document.querySelector('.feat-track');
  var pauseBtn = document.querySelector('[data-feat-pause]');
  if (strip) {
    var items = strip.querySelectorAll('.fcard'), idx = 0, tm = null, userPaused = reduce, hovering = false, seen = false;
    var goTo = function (i, smooth) {
      idx = (i + items.length) % items.length;
      var c = items[idx];
      strip.scrollTo({ left: c.offsetLeft - (strip.clientWidth - c.offsetWidth) / 2, behavior: smooth === false || reduce ? 'auto' : 'smooth' });
    };
    var nearest = function () {
      var mid = strip.scrollLeft + strip.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    var tick = function () { if (userPaused || hovering || !seen || document.hidden) return; goTo(nearest() + 1); };
    var run = function () { clearInterval(tm); tm = setInterval(tick, 2800); };
    strip.addEventListener('pointerenter', function () { hovering = true; });
    strip.addEventListener('pointerleave', function () { hovering = false; });
    strip.addEventListener('focusin', function () { hovering = true; });
    strip.addEventListener('focusout', function () { hovering = false; });
    strip.addEventListener('touchstart', function () { hovering = true; }, { passive: true });
    strip.addEventListener('touchend', function () { setTimeout(function () { hovering = false; }, 4000); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.4 }).observe(strip); else seen = true;
    if (pauseBtn) {
      if (reduce) pauseBtn.setAttribute('aria-pressed', 'true');
      pauseBtn.addEventListener('click', function () { userPaused = !userPaused; pauseBtn.setAttribute('aria-pressed', userPaused); });
    }
    goTo(0, false);
    run();
  }
  /* project marquee: pause / play */
  var marq = document.querySelector('.feat-marq'), mBtn = document.querySelector('[data-feat-pause]');
  if (marq && mBtn) {
    mBtn.addEventListener('click', function () {
      var p = !marq.classList.contains('paused');
      marq.classList.toggle('paused', p);
      mBtn.setAttribute('aria-pressed', p);
    });
  }
})();
