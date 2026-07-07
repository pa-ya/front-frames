/* progress.js — per-section reviewed state in localStorage + ring/nav updates */
(function () {
  "use strict";
  const KEY = "fwdeck.progress";
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function key(fw, sec) { return fw + "::" + sec; }
  function isDone(fw, sec) { return !!state[key(fw, sec)]; }

  // count only "core" sections toward progress
  function coreSections(fw) {
    return (fw.sections || []).filter((s) => s.level !== "deep");
  }
  function fwDone(fw) {
    const core = coreSections(fw);
    if (!core.length) return 0;
    const done = core.filter((s) => isDone(fw.id, s.id)).length;
    return done / core.length;
  }
  function overall() {
    const all = window.FRAMEWORKS || [];
    let total = 0, done = 0;
    all.forEach((fw) => {
      const core = coreSections(fw);
      total += core.length;
      done += core.filter((s) => isDone(fw.id, s.id)).length;
    });
    return total ? done / total : 0;
  }

  function toggle(fw, sec) {
    const k = key(fw, sec);
    if (state[k]) delete state[k]; else state[k] = 1;
    save();
    refreshUI();
    return !!state[k];
  }

  function reset() {
    state = {}; save(); refreshUI();
    window.Toast && window.Toast("Progress reset");
  }

  function refreshUI() {
    // ring
    const pct = Math.round(overall() * 100);
    const ring = document.getElementById("ringProgress");
    const label = document.getElementById("ringPercent");
    if (ring) {
      const C = 2 * Math.PI * 34;
      ring.style.strokeDasharray = C;
      ring.style.strokeDashoffset = C * (1 - overall());
    }
    if (label) label.textContent = pct + "%";
    // nav done marks
    document.querySelectorAll(".nav-item").forEach((item) => {
      const id = item.dataset.fw;
      const fw = (window.FRAMEWORKS || []).find((f) => f.id === id);
      if (!fw) return;
      item.classList.toggle("is-done", fwDone(fw) >= 1);
    });
    // section buttons on current page
    document.querySelectorAll(".section-done").forEach((btn) => {
      const [fw, sec] = btn.dataset.done.split("::");
      const done = isDone(fw, sec);
      btn.classList.toggle("is-done", done);
      btn.textContent = done ? "✓ Reviewed" : "Mark reviewed";
    });
  }

  // event delegation for reviewed buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".section-done");
    if (!btn) return;
    const [fw, sec] = btn.dataset.done.split("::");
    toggle(fw, sec);
  });

  window.Progress = { isDone, toggle, reset, refreshUI, fwDone, overall };
})();
