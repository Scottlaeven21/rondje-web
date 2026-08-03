// Rondje landingssite — kleine, afhankelijkheidsvrije interacties.

(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var mobile = document.getElementById('navMobile');

  // Schaduw/rand op de nav zodra je scrollt.
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobiel menu open/dicht.
  function setMenu(open) {
    if (!burger || !mobile) return;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobile.hidden = !open;
  }

  if (burger && mobile) {
    burger.addEventListener('click', function () {
      setMenu(mobile.hidden);
    });
    // Sluit het menu na het kiezen van een link.
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  // Sluit het mobiele menu bij het vergroten naar desktop.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 760) setMenu(false);
  });

  // FAQ: hooguit één item tegelijk open (accordion-gevoel).
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq__item'));
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  // Pad-scrollytelling: scroll langs het middenpad, zoom per bol, lijn kleurt mee
  (function initJourney() {
    var root = document.querySelector('[data-journey]');
    if (!root) return;

    var stops = Array.prototype.slice.call(root.querySelectorAll('.journey__stop'));
    var snake = root.querySelector('.journey__snake');
    var clipRect = document.getElementById('journeyClipRect');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var active = 0;

    // Zelfde kronkelvorm als origineel (bochten op x=29/71), maar de hoogte
    // van elke bocht schuift mee met de werkelijke positie van de bol.
    function fitPath() {
      if (!snake) return;
      var bg = snake.querySelector('.journey__snake-bg');
      var fill = snake.querySelector('.journey__snake-fill');
      if (!bg || !fill) return;
      var box = snake.getBoundingClientRect();
      if (box.height < 10) return;

      var ys = stops.map(function (stop) {
        var ball = stop.querySelector('.journey__ball');
        if (!ball) return null;
        var r = ball.getBoundingClientRect();
        return ((r.top + r.height / 2) - box.top) / box.height * 100;
      }).filter(function (v) { return v !== null; });
      if (ys.length < 2) return;

      // Mobiel: de bollen staan zelf zijwaarts (2 rechts, 3 links uit beeld);
      // de lijn loopt vloeiend door de echte bolposities, met verticale
      // raaklijn op elke bol zodat het pad de blik meeneemt.
      if (window.matchMedia('(max-width: 720px)').matches) {
        var pts = stops.map(function (stop) {
          var ball = stop.querySelector('.journey__ball');
          if (!ball) return null;
          var r = ball.getBoundingClientRect();
          return {
            x: ((r.left + r.width / 2) - box.left) / box.width * 100,
            y: ((r.top + r.height / 2) - box.top) / box.height * 100,
          };
        }).filter(function (p) { return p !== null; });
        if (pts.length < 2) return;

        var p0 = pts[0];
        var dm = 'M' + p0.x.toFixed(1) + ' 0 C ' +
          p0.x.toFixed(1) + ' ' + (p0.y / 3).toFixed(1) + ', ' +
          p0.x.toFixed(1) + ' ' + (2 * p0.y / 3).toFixed(1) + ', ' +
          p0.x.toFixed(1) + ' ' + p0.y.toFixed(1);
        for (var m = 0; m < pts.length - 1; m++) {
          var a = pts[m];
          var b = pts[m + 1];
          var mdy = b.y - a.y;
          dm += ' C ' + a.x.toFixed(1) + ' ' + (a.y + mdy / 3).toFixed(1) +
                ', ' + b.x.toFixed(1) + ' ' + (a.y + 2 * mdy / 3).toFixed(1) +
                ', ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        }
        var pl = pts[pts.length - 1];
        dm += ' C ' + pl.x.toFixed(1) + ' ' + (pl.y + (100 - pl.y) / 3).toFixed(1) +
              ', ' + pl.x.toFixed(1) + ' ' + (pl.y + 2 * (100 - pl.y) / 3).toFixed(1) +
              ', ' + pl.x.toFixed(1) + ' 100';
        bg.setAttribute('d', dm);
        fill.setAttribute('d', dm);
        return;
      }

      // Midden-kruisingen halverwege tussen de bochten; bochten exact op de bollen
      var bounds = [Math.max(0, ys[0] - (ys[1] - ys[0]) / 2)];
      for (var i = 1; i < ys.length; i++) bounds.push((ys[i - 1] + ys[i]) / 2);
      bounds.push(Math.min(100, ys[ys.length - 1] + (ys[ys.length - 1] - ys[ys.length - 2]) / 2));

      var d = 'M50 ' + bounds[0].toFixed(1);
      for (var s = 0; s < ys.length; s++) {
        var ext = s % 2 === 0 ? 29 : 71;   // bochtdiepte gelijk aan het origineel
        var mid = s % 2 === 0 ? 36 : 64;
        // Naar de bol toe (verticale raaklijn op de bol) en weer terug naar het midden
        d += ' C ' + mid + ' ' + (bounds[s] + (ys[s] - bounds[s]) / 3).toFixed(1) +
             ', ' + ext + ' ' + (bounds[s] + 2 * (ys[s] - bounds[s]) / 3).toFixed(1) +
             ', ' + ext + ' ' + ys[s].toFixed(1);
        d += ' C ' + ext + ' ' + (ys[s] + (bounds[s + 1] - ys[s]) / 3).toFixed(1) +
             ', ' + mid + ' ' + (ys[s] + 2 * (bounds[s + 1] - ys[s]) / 3).toFixed(1) +
             ', 50 ' + bounds[s + 1].toFixed(1);
      }
      bg.setAttribute('d', d);
      fill.setAttribute('d', d);
    }

    function setProgress(pct) {
      if (!clipRect) return;
      pct = Math.max(0, Math.min(1, pct));
      // viewBox 0–100: cliphoogte laat paars/oranje pad meegroeien met scroll
      clipRect.setAttribute('height', String(pct * 100));
    }

    function setFocus(step) {
      step = Number(step);
      if (!step || step === active) return;
      active = step;
      stops.forEach(function (stop) {
        var n = Number(stop.getAttribute('data-step'));
        stop.classList.toggle('is-focus', n === step);
        stop.classList.toggle('is-done', n < step);
      });
    }

    function progressFill() {
      if (!clipRect || !snake) return;
      // Inkleuring volgt de focuslijn door het SVG-pad (niet alleen bol 1→4)
      var rect = snake.getBoundingClientRect();
      var focusY = window.innerHeight * 0.45;
      var pct = (focusY - rect.top) / Math.max(rect.height, 1);
      setProgress(pct);
    }

    function focusFromScroll() {
      var focusY = window.innerHeight * 0.45;
      var best = 1;
      var bestDist = Infinity;
      stops.forEach(function (stop) {
        var ball = stop.querySelector('.journey__ball');
        if (!ball) return;
        var rect = ball.getBoundingClientRect();
        var mid = rect.top + rect.height / 2;
        var dist = Math.abs(mid - focusY);
        if (dist < bestDist) {
          bestDist = dist;
          best = Number(stop.getAttribute('data-step'));
        }
      });
      setFocus(best);
      progressFill();
    }

    fitPath();
    window.addEventListener('load', fitPath);
    window.addEventListener('resize', function () { window.requestAnimationFrame(fitPath); });
    if ('ResizeObserver' in window) {
      // Volgt ook hoogteveranderingen door tekst-omloop, fonts en afbeeldingen
      new ResizeObserver(function () { window.requestAnimationFrame(fitPath); }).observe(root);
    }

    if (reduceMotion) {
      stops.forEach(function (s) { s.classList.add('is-focus', 'is-done'); });
      setProgress(1);
      return;
    }

    setProgress(0);

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        focusFromScroll();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', focusFromScroll);
    focusFromScroll();
  })();
})();
