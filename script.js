(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- elements ---------- */
    var body        = document.body;
    var overlay     = document.getElementById('promptOverlay');
    var input       = document.getElementById('speedInput');
    var unitSelect  = document.getElementById('unitSelect');
    var goBtn       = document.getElementById('promptBtn');

    var speedValue  = document.getElementById('speedValue');
    var speedUnit   = document.getElementById('speedUnit');
    var statusText  = document.getElementById('statusText');
    var refreshBtn  = document.getElementById('refreshBtn');
    var moreBtn     = document.getElementById('moreBtn');
    var moreInfo    = document.getElementById('moreInfo');

    var downVal       = document.getElementById('downVal');
    var upVal         = document.getElementById('upVal');
    var pingVal       = document.getElementById('pingVal');
    var loadedPingVal = document.getElementById('loadedPingVal');
    var downUnits     = document.querySelectorAll('.down-unit');
    var upUnits       = document.querySelectorAll('.up-unit');

    /* ---------- state ---------- */
    var target = null;
    var unit = 'Mbps';
    var running = false;

    input.focus();

    /* ---------- intro prompt ---------- */

    goBtn.addEventListener('click', start);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') start();
    });
    input.addEventListener('input', function () {
      input.classList.remove('err');
    });

    function start() {
      var val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) {
        input.classList.add('err');
        input.value = '';
        input.placeholder = 'raqam sahih';
        input.focus();
        return;
      }
      if (val > 99999) val = 99999;

      target = val;
      unit = unitSelect.value;

      speedUnit.textContent = unit;
      setAll(downUnits, unit);
      setAll(upUnits, unit);

      overlay.classList.add('hide');
      body.classList.remove('locked');
      setTimeout(function () { overlay.style.display = 'none'; }, 350);

      runTest();
    }

    function setAll(nodes, text) {
      for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
    }

    /* ---------- the fake test ---------- */

    function runTest() {
      if (running) return;
      running = true;

      // phase 1: measuring — gray number, no refresh ring, no info button
      body.classList.remove('done');
      speedValue.classList.add('testing');
      speedUnit.classList.add('testing');
      moreInfo.classList.remove('open');
      moreBtn.textContent = "Voir plus d'infos";
      statusText.textContent = 'Votre vitesse de connexion est de';

      downVal.textContent = '0';
      upVal.textContent = '0';
      pingVal.textContent = '0';
      loadedPingVal.textContent = '0';

      var duration = 5200;
      var t0 = performance.now();
      var shown = 0;

      function frame(now) {
        var p = Math.min((now - t0) / duration, 1);

        if (p < 1) {
          // fast.com ramps hard at first, then creeps toward the final value
          var eased = 1 - Math.pow(1 - p, 2.6);

          // early on the reading is unstable and overshoots/undershoots
          var noise = (Math.random() - 0.42) * target * 0.22 * Math.pow(1 - p, 1.5);

          var raw = target * eased + noise;
          if (raw < 0) raw = 0;

          // smooth it so digits don't strobe
          shown += (raw - shown) * 0.35;
          render(shown);
          requestAnimationFrame(frame);
        } else {
          render(target);
          finish();
        }
      }
      requestAnimationFrame(frame);
    }

    // fast.com shows one decimal under 10, whole numbers at 10+
    function render(v) {
      speedValue.textContent = v < 10 ? v.toFixed(1) : String(Math.round(v));
    }

    function fmt(v) {
      return v < 10 ? v.toFixed(1) : String(Math.round(v));
    }

    function finish() {
      running = false;

      // phase 2: locked in — number goes black, ring + button appear
      speedValue.classList.remove('testing');
      speedUnit.classList.remove('testing');
      body.classList.add('done');

      var upload     = Math.max(0.1, target * (0.14 + Math.random() * 0.16));
      var ping       = Math.round(4 + Math.random() * 18);
      var loadedPing = ping + Math.round(6 + Math.random() * 34);

      downVal.textContent = fmt(target);
      count(upVal, upload, false);
      count(pingVal, ping, true);
      count(loadedPingVal, loadedPing, true);
    }

    function count(el, to, isInt) {
      var dur = 900;
      var t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        var v = to * e;
        el.textContent = isInt ? String(Math.round(v)) : fmt(v);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = isInt ? String(Math.round(to)) : fmt(to);
      }
      requestAnimationFrame(step);
    }

    /* ---------- controls ---------- */

    refreshBtn.addEventListener('click', function () {
      if (running || target === null) return;
      refreshBtn.classList.add('spin');
      setTimeout(function () { refreshBtn.classList.remove('spin'); }, 600);
      runTest();
    });

    moreBtn.addEventListener('click', function () {
      var open = moreInfo.classList.toggle('open');
      moreBtn.textContent = open ? 'Masquer les infos' : "Voir plus d'infos";
    });

  });
})();
