(function () {
  "use strict";

  var overlay = document.getElementById("overlay");
  var speedForm = document.getElementById("speedForm");
  var desiredSpeedInput = document.getElementById("desiredSpeed");
  var unitSelect = document.getElementById("unitSelect");
  var formError = document.getElementById("formError");

  var speedValueEl = document.getElementById("speedValue");
  var speedUnitEl = document.getElementById("speedUnit");
  var refreshBtn = document.getElementById("refreshBtn");
  var moreBtn = document.getElementById("moreBtn");
  var morePanel = document.getElementById("morePanel");

  var downloadValEl = document.getElementById("downloadVal");
  var downloadUnitEl = document.getElementById("downloadUnit");
  var uploadValEl = document.getElementById("uploadVal");
  var uploadUnitEl = document.getElementById("uploadUnit");
  var unloadedPingEl = document.getElementById("unloadedPingVal");
  var loadedPingEl = document.getElementById("loadedPingVal");

  var langBtn = document.getElementById("langBtn");
  var langMenu = document.getElementById("langMenu");
  var langLabel = document.getElementById("langLabel");

  var targetSpeed = 0;
  var targetUnit = "Mbps";
  var animToken = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toKbps(value, unit) {
    if (unit === "Gbps") return value * 1e6;
    if (unit === "Mbps") return value * 1e3;
    return value;
  }

  function fromKbps(kbps, unit) {
    if (unit === "Gbps") return kbps / 1e6;
    if (unit === "Mbps") return kbps / 1e3;
    return kbps;
  }

  function displayUnitFor(kbps, finalUnit, progress) {
    if (progress >= 0.92) return finalUnit;
    if (finalUnit === "Gbps") {
      if (kbps >= 900000) return "Gbps";
      if (kbps >= 900) return "Mbps";
      return "Kbps";
    }
    if (finalUnit === "Mbps") {
      if (kbps >= 900) return "Mbps";
      return "Kbps";
    }
    return "Kbps";
  }

  function formatForUnit(value, unit) {
    if (!isFinite(value) || value < 0) return "0";
    if (unit === "Gbps") {
      if (value >= 10) return value.toFixed(1);
      return value.toFixed(2);
    }
    if (unit === "Kbps") {
      if (value >= 100) return String(Math.round(value));
      if (Number.isInteger(value)) return String(value);
      return value.toFixed(1);
    }
    if (value >= 100) return String(Math.round(value));
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
  }

  function parseSpeed(raw) {
    if (raw == null) return NaN;
    var normalized = String(raw).trim().replace(",", ".");
    if (normalized === "") return NaN;
    var value = Number(normalized);
    return value;
  }

  function showError(show) {
    formError.hidden = !show;
    desiredSpeedInput.setAttribute("aria-invalid", show ? "true" : "false");
  }

  function setRunning(running) {
    refreshBtn.classList.toggle("is-hidden", running);
    moreBtn.classList.toggle("is-hidden", running);
    if (running) {
      morePanel.classList.remove("open");
      morePanel.setAttribute("aria-hidden", "true");
      moreBtn.setAttribute("aria-expanded", "false");
    }
  }

  function updateMoreInfo(speed, unit) {
    var upload = speed * 0.42;
    downloadValEl.textContent = formatForUnit(speed, unit);
    downloadUnitEl.textContent = unit;
    uploadValEl.textContent = formatForUnit(upload, unit);
    uploadUnitEl.textContent = unit;
    unloadedPingEl.textContent = String(Math.round(18 + Math.random() * 16));
    loadedPingEl.textContent = String(Math.round(48 + Math.random() * 40));
  }

  function renderSpeed(kbps, unit) {
    speedUnitEl.textContent = unit;
    speedValueEl.textContent = formatForUnit(fromKbps(kbps, unit), unit);
  }

  function animateTo(target, unit) {
    var token = ++animToken;
    var targetKbps = toKbps(target, unit);
    setRunning(true);

    if (reduceMotion) {
      renderSpeed(targetKbps, unit);
      setRunning(false);
      updateMoreInfo(target, unit);
      return;
    }

    var duration = 3800 + Math.min(2200, Math.log10(Math.max(targetKbps, 1)) * 700);
    var start = null;

    function step(now) {
      if (token !== animToken) return;
      if (!start) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 2.4);
      var jitterAmp = (1 - t) * targetKbps * 0.22;
      var jitter = (Math.random() * 2 - 1) * jitterAmp;
      var currentKbps = t >= 1 ? targetKbps : Math.max(0, targetKbps * eased + jitter);
      var shownUnit = displayUnitFor(currentKbps, unit, t);
      renderSpeed(currentKbps, shownUnit);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        renderSpeed(targetKbps, unit);
        setRunning(false);
        updateMoreInfo(target, unit);
      }
    }

    requestAnimationFrame(step);
  }

  function closeOverlayThenRun() {
    overlay.classList.add("is-closing");
    document.body.classList.remove("locked");
    window.setTimeout(function () {
      overlay.hidden = true;
      desiredSpeedInput.blur();
      animateTo(targetSpeed, targetUnit);
    }, 280);
  }

  speedForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = parseSpeed(desiredSpeedInput.value);
    var unit = unitSelect.value;
    if (!isFinite(value) || value <= 0) {
      showError(true);
      desiredSpeedInput.focus();
      return;
    }
    showError(false);
    targetSpeed = value;
    targetUnit = unit;
    closeOverlayThenRun();
  });

  refreshBtn.addEventListener("click", function () {
    if (!targetSpeed) return;
    refreshBtn.classList.remove("spin");
    void refreshBtn.offsetWidth;
    refreshBtn.classList.add("spin");
    animateTo(targetSpeed, targetUnit);
  });

  moreBtn.addEventListener("click", function () {
    var open = morePanel.classList.toggle("open");
    morePanel.setAttribute("aria-hidden", open ? "false" : "true");
    moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  langBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    var open = langMenu.classList.toggle("open");
    langBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  langMenu.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      langLabel.textContent = btn.getAttribute("data-lang");
      langMenu.querySelectorAll("button").forEach(function (item) {
        item.removeAttribute("aria-current");
      });
      btn.setAttribute("aria-current", "true");
      langMenu.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function () {
    langMenu.classList.remove("open");
    langBtn.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      langMenu.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    }
  });

  window.setTimeout(function () {
    desiredSpeedInput.focus();
  }, 50);
})();
