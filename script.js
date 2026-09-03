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
    var fill = document.getElementById('journeyFill');
    var bg = snake ? snake.querySelector('.journey__snake-bg') : null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var active = 0;
    var pathLen = 0;
    var currentPct = 0;
    var targetPct = 0;
    var smoothing = false;
    var resizeTimer = 0;
    // Fracties langs de echte padlengte per stop (niet lineair in Y —
    // op desktop is het zigzag-pad langer dan de verticale afstand).
    var stopPathPcts = [];
    var stopMidsY = [];

    function nearestPathPct(targetX, targetY) {
      if (!fill || !pathLen) return 0;
      var samples = 240;
      var bestLen = 0;
      var bestDist = Infinity;
      for (var j = 0; j <= samples; j++) {
        var len = (pathLen * j) / samples;
        var pt = fill.getPointAtLength(len);
        var dx = pt.x - targetX;
        var dy = pt.y - targetY;
        var d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestLen = len;
        }
      }
      return bestLen / pathLen;
    }

    function refreshStopMids() {
      stopMidsY = stops.map(function (stop) {
        var ball = stop.querySelector('.journey__ball');
        if (!ball) return 0;
        var r = ball.getBoundingClientRect();
        return r.top + r.height / 2;
      });
    }

    function cacheStopPathPcts(ys, width) {
      if (!fill || !pathLen || !ys || !ys.length) {
        stopPathPcts = [];
        return;
      }

      // Exacte bochtpunten van het pad (in pixels), niet de geschaalde bol
      stopPathPcts = ys.map(function (y, s) {
        var ext = width * (s % 2 === 0 ? 0.29 : 0.71);
        return nearestPathPct(ext, y);
      });

      // Monotoon oplopend houden (pad gaat altijd naar beneden)
      for (var i = 1; i < stopPathPcts.length; i++) {
        if (stopPathPcts[i] < stopPathPcts[i - 1]) {
          stopPathPcts[i] = stopPathPcts[i - 1];
        }
      }

      refreshStopMids();
    }

    // Padvorm vastzetten t.o.v. stops (niet opnieuw bij bol-scale → geen haperen)
    function fitPath() {
      if (!snake || !bg || !fill) return;
      var box = snake.getBoundingClientRect();
      if (box.height < 10 || box.width < 10) return;

      // De viewBox loopt gelijk met de werkelijke pixelmaat. Zo is de schaal in
      // beide richtingen 1, en is de dashlengte van de voortgang dus dezelfde
      // eenheid als de lijn die je ziet. Rekten we een vaste viewBox van 100
      // uit, dan herhaalde het streeppatroon zich over de lijn — de "bubbels".
      var w = box.width;
      var h = box.height;
      snake.setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h.toFixed(1));

      var ys = stops.map(function (stop) {
        var visual = stop.querySelector('.journey__visual');
        var el = visual || stop;
        var r = el.getBoundingClientRect();
        return (r.top + r.height * 0.35) - box.top;
      });
      if (ys.length < 2) return;

      var bounds = [Math.max(0, ys[0] - (ys[1] - ys[0]) / 2)];
      for (var i = 1; i < ys.length; i++) bounds.push((ys[i - 1] + ys[i]) / 2);
      bounds.push(Math.min(h, ys[ys.length - 1] + (ys[ys.length - 1] - ys[ys.length - 2]) / 2));

      var cx = w * 0.5;
      var d = 'M' + cx.toFixed(1) + ' ' + bounds[0].toFixed(1);
      for (var s = 0; s < ys.length; s++) {
        var ext = (w * (s % 2 === 0 ? 0.29 : 0.71)).toFixed(1);
        var mid = (w * (s % 2 === 0 ? 0.36 : 0.64)).toFixed(1);
        d += ' C ' + mid + ' ' + (bounds[s] + (ys[s] - bounds[s]) / 3).toFixed(1) +
             ', ' + ext + ' ' + (bounds[s] + 2 * (ys[s] - bounds[s]) / 3).toFixed(1) +
             ', ' + ext + ' ' + ys[s].toFixed(1);
        d += ' C ' + ext + ' ' + (ys[s] + (bounds[s + 1] - ys[s]) / 3).toFixed(1) +
             ', ' + mid + ' ' + (ys[s] + 2 * (bounds[s + 1] - ys[s]) / 3).toFixed(1) +
             ', ' + cx.toFixed(1) + ' ' + bounds[s + 1].toFixed(1);
      }
      bg.setAttribute('d', d);
      fill.setAttribute('d', d);
      pathLen = fill.getTotalLength();
      fill.style.strokeDasharray = String(pathLen);
      cacheStopPathPcts(ys, w);
      fill.style.strokeDashoffset = String(pathLen * (1 - currentPct));
    }

    function applyProgress(pct) {
      if (!fill || !pathLen) return;
      pct = Math.max(0, Math.min(1, pct));
      fill.style.strokeDashoffset = String(pathLen * (1 - pct));
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

    function readTargetPct() {
      if (!stopPathPcts.length || !stopMidsY.length) {
        // Fallback: lineair in Y (werkt goed op mobiel, waar het pad vrij recht is)
        if (!snake) return 0;
        var rect = snake.getBoundingClientRect();
        var focusY = window.innerHeight * 0.45;
        return Math.max(0, Math.min(1, (focusY - rect.top) / Math.max(rect.height, 1)));
      }

      var focusY = window.innerHeight * 0.45;
      var mids = stopMidsY;
      var pcts = stopPathPcts;
      var ease = window.innerHeight * 0.55;

      if (focusY <= mids[0]) {
        var tIn = Math.max(0, Math.min(1, 1 - (mids[0] - focusY) / ease));
        return tIn * pcts[0];
      }
      if (focusY >= mids[mids.length - 1]) {
        var tOut = Math.max(0, Math.min(1, (focusY - mids[mids.length - 1]) / ease));
        return pcts[pcts.length - 1] + tOut * (1 - pcts[pcts.length - 1]);
      }

      for (var i = 0; i < mids.length - 1; i++) {
        if (focusY >= mids[i] && focusY <= mids[i + 1]) {
          var span = mids[i + 1] - mids[i];
          var t = span > 0 ? (focusY - mids[i]) / span : 0;
          return pcts[i] + t * (pcts[i + 1] - pcts[i]);
        }
      }
      return pcts[pcts.length - 1];
    }

    function focusFromScroll() {
      var focusY = window.innerHeight * 0.42;
      var best = 1;
      var bestDist = Infinity;
      stops.forEach(function (stop) {
        var n = Number(stop.getAttribute('data-step'));
        var ball = stop.querySelector('.journey__ball');
        if (!ball) return;
        var r = ball.getBoundingClientRect();
        var mid = r.top + r.height / 2;
        var dist = Math.abs(mid - focusY);
        if (dist < bestDist) {
          bestDist = dist;
          best = n;
        }
      });
      refreshStopMids();
      setFocus(best);
      targetPct = readTargetPct();
      if (!smoothing) {
        smoothing = true;
        window.requestAnimationFrame(smoothTick);
      }
    }

    function smoothTick() {
      var diff = targetPct - currentPct;
      if (Math.abs(diff) < 0.0005) {
        currentPct = targetPct;
        applyProgress(currentPct);
        smoothing = false;
        return;
      }
      // Lichte lerp → vloeiende lijn zonder haperen
      currentPct += diff * 0.14;
      applyProgress(currentPct);
      window.requestAnimationFrame(smoothTick);
    }

    function scheduleFit() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        fitPath();
        targetPct = readTargetPct();
        currentPct = targetPct;
        applyProgress(currentPct);
        focusFromScroll();
      }, 80);
    }

    fitPath();
    window.addEventListener('load', function () {
      fitPath();
      focusFromScroll();
    });
    window.addEventListener('resize', scheduleFit);

    if (reduceMotion) {
      stops.forEach(function (s) { s.classList.add('is-focus', 'is-done'); });
      currentPct = 1;
      applyProgress(1);
      return;
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        focusFromScroll();
        ticking = false;
      });
    }, { passive: true });

    focusFromScroll();
  })();
})();
