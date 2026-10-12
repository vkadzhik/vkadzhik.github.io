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

  applyLang(root.getAttribute('data-lang') || 'ru');
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-set-lang')); });
  });

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
