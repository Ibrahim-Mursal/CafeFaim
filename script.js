/* =========================================================
   Café Faim — language toggle + mobile nav
   ========================================================= */
(function () {
  'use strict';

  /* ---------- language ---------- */
  var STORE = 'faim-lang';
  var nodes = document.querySelectorAll('[data-nl][data-en]');
  var btn   = document.getElementById('langbtn');
  var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var langSwapTimer = null;
  var SWAP_FADE_MS = 130;

  // Links/buttons among the translated nodes (CTAs) already own a
  // transition for background/transform/box-shadow on hover (.btn's
  // "transition:.22s ease" shorthand). Setting an inline transition on
  // them for the fade below would replace that shorthand outright and
  // kill their hover animation, so they're excluded from the dip —
  // their text still swaps, just without the fade.
  var fadeNodes = Array.prototype.filter.call(nodes, function (n) {
    return n.tagName !== 'A' && n.tagName !== 'BUTTON';
  });

  // Snapshot the Dutch original once, so repeated toggling can't drift.
  nodes.forEach(function (n) {
    if (!n.dataset.nl) n.dataset.nl = n.textContent.trim();
  });
  if (!prefersReduce) {
    fadeNodes.forEach(function (n) {
      n.style.transition = 'opacity ' + SWAP_FADE_MS + 'ms ease';
    });
  }

  // A whole-page text swap landing instantly reads as a flicker, not a
  // deliberate action. Dip to 0, swap the text while invisible, recover —
  // one legible "the language changed" moment instead of dozens of silent
  // jumps.
  function apply(lang) {
    document.documentElement.lang = lang;

    function swapText() {
      nodes.forEach(function (n) {
        var v = n.dataset[lang];
        if (v) n.textContent = v;
      });
    }

    if (prefersReduce) {
      swapText();
    } else {
      if (langSwapTimer) clearTimeout(langSwapTimer);
      fadeNodes.forEach(function (n) { n.style.opacity = '0'; });
      langSwapTimer = setTimeout(function () {
        swapText();
        fadeNodes.forEach(function (n) { n.style.opacity = ''; });
        langSwapTimer = null;
      }, SWAP_FADE_MS);
    }

    if (btn) {
      btn.textContent = lang === 'nl' ? 'EN' : 'NL';
      btn.setAttribute('aria-label', lang === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands');
    }
    document.title = lang === 'nl'
      ? 'Café Faim — Café · Lunch · Patisserie in Waalwijk'
      : 'Café Faim — Café · Lunch · Patisserie in Waalwijk, NL';
  }

  var lang = 'nl';
  try { lang = localStorage.getItem(STORE) || 'nl'; } catch (e) {}
  if (lang !== 'nl') apply(lang);
  else if (btn) btn.textContent = 'EN';

  if (btn) {
    btn.addEventListener('click', function () {
      lang = lang === 'nl' ? 'en' : 'nl';
      try { localStorage.setItem(STORE, lang); } catch (e) {}
      apply(lang);
    });
  }

  /* ---------- mobile nav ---------- */
  var nav    = document.getElementById('nav');
  var burger = document.getElementById('burger');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- page-in (avoids the webfont flash) ---------- */
  function ready() { document.body.classList.add('ready'); }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ready);
    setTimeout(ready, 900);          // hard fallback, never leave it invisible
  } else {
    ready();
  }

  /* ---------- scroll reveal ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var targets = document.querySelectorAll(
    '.concept__text, .pills li, .card, .mcard, .cake, .gal__i, .visit > div, .map, .hero__inner > *'
  );

  if (reduce || !('IntersectionObserver' in window)) {
    // no observer or user opted out — just show everything
    targets.forEach(function (t) { t.classList.add('rv', 'in'); });
  } else {
    targets.forEach(function (t) { t.classList.add('rv'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- nav shadow on scroll ---------- */
  var navEl = document.getElementById('nav');
  if (navEl) {
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      window.requestAnimationFrame(function () {
        navEl.classList.toggle('stuck', window.scrollY > 12);
        tick = false;
      });
    }, { passive: true });
  }
})();
