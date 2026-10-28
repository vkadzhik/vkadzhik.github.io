(function () {
  var root = document.documentElement;

  function applyLang(l) {
    root.setAttribute('data-lang', l);
    root.lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === l ? 'true' : 'false');
    });
    document.querySelectorAll('img[data-alt-' + l + ']').forEach(function (i) {
      i.alt = i.getAttribute('data-alt-' + l);
    });
    var t = document.querySelector('meta[name="x-title-' + l + '"]');
    if (t) document.title = t.content;
  }

  applyLang(root.getAttribute('data-lang') || 'en');
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-set-lang')); });
  });


  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll, with a small stagger for items that enter together
  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--d', (n++ * 0.08) + 's');
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // cursor pill over case covers (mouse only)
  var pill = document.querySelector('.pill');
  if (pill && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var x = 0, y = 0, raf = 0;
    function move() { pill.style.left = x + 'px'; pill.style.top = y + 'px'; raf = 0; }
    document.querySelectorAll('.card__img').forEach(function (a) {
      var c = getComputedStyle(a.closest('.card')).getPropertyValue('--c');
      a.addEventListener('mouseenter', function () { pill.style.setProperty('--c', c); pill.classList.add('is-on'); });
      a.addEventListener('mouseleave', function () { pill.classList.remove('is-on'); });
      a.addEventListener('mousemove', function (ev) { x = ev.clientX; y = ev.clientY; if (!raf) raf = requestAnimationFrame(move); });
    });
  }


  // mobile menu
  var burger = document.querySelector('.burger'), mnav = document.getElementById('mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      mnav.hidden = open;
    });
    mnav.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); mnav.hidden = true; }
    });
  }

  // cover preview next to the cursor on experience rows
  var peek = document.querySelector('.peek');
  if (peek && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pim = peek.querySelector('img'), px = 0, py = 0, praf = 0;
    function pmove() { peek.style.left = px + 'px'; peek.style.top = py + 'px'; praf = 0; }
    document.querySelectorAll('.xp[data-peek]').forEach(function (li) {
      var row = li.querySelector('.xp__row');
      row.addEventListener('mouseenter', function () { pim.src = li.getAttribute('data-peek'); peek.classList.add('is-on'); });
      row.addEventListener('mouseleave', function () { peek.classList.remove('is-on'); });
      row.addEventListener('mousemove', function (ev) { px = ev.clientX; py = ev.clientY; if (!praf) praf = requestAnimationFrame(pmove); });
    });
  }

  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // image zoom
  var dlg = document.querySelector('.zoom');
  if (dlg && typeof dlg.showModal === 'function') {
    var big = dlg.querySelector('img');
    document.addEventListener('click', function (ev) {
      var im = ev.target.closest('img[data-zoom], .cover img');
      if (!im) return;
      big.src = im.currentSrc || im.src;
      big.alt = im.alt;
      dlg.showModal();
      dlg.scrollTop = 0;
    });
    dlg.addEventListener('click', function (ev) {
      if (ev.target === dlg || ev.target === big || ev.target.hasAttribute('data-close')) dlg.close();
    });
  }
})();
