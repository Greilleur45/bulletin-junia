// JS/main.js
(function () {
  "use strict";

  let state = window.StorageAPI.loadState();
  let ueSearchQuery = "";

  const THEME_KEY = "junia_theme"; // "dark" | "light"

  function applyTheme(theme) {
    const t = (theme === "light") ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);

    // icône (lune = sombre, soleil = clair)
    const icon = document.querySelector("#btnTheme i");
    if (icon) {
      icon.className = (t === "light") ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
      return;
    }
    // défaut: suivre le système si possible, sinon dark
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
    applyTheme(prefersLight ? "light" : "dark");
  }

  function wireThemeButton() {
    const btn = document.getElementById("btnTheme");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = (current === "light") ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  function setupSidebarDrawer() {
    const sidebar = document.getElementById("sidebar");
    const btnOpen = document.getElementById("btnSidebar");
    const btnClose = document.getElementById("btnSidebarClose");
    const overlay = document.getElementById("overlay");

    if (!sidebar || !btnOpen || !overlay) return;

    const isDesktop = () => window.innerWidth > 1024;

    const open = () => {
      if (isDesktop()) return; // desktop: sidebar fixe
      sidebar.classList.add("is-open");
      overlay.hidden = false;
      document.body.classList.add("no-scroll");
    };

    const close = () => {
      sidebar.classList.remove("is-open");
      overlay.hidden = true;
      document.body.classList.remove("no-scroll");
    };

    btnOpen.addEventListener("click", open);
    overlay.addEventListener("click", close);
    btnClose?.addEventListener("click", close);

    // Fermeture auto quand on sélectionne une UE (mobile/tablet UX)
    document.addEventListener("click", (e) => {
      const item = e.target.closest(".ue-item");
      if (!item) return;
      if (sidebar.classList.contains("is-open")) close();
    });

    // ESC pour fermer
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("is-open")) close();
    });

    // Si on repasse desktop, on nettoie
    window.addEventListener("resize", () => {
      if (isDesktop()) close();
    });
  }

  function renderKPIs() {
    const PASS = window.CalcAPI?.PASS_MARK ?? 10;

    // KPI 1 : Moyenne générale (réel + simulation)
    const global = window.CalcAPI.computeGlobalAverage(state, true);
    setText(
      "kpiGlobalAvg",
      global.avg === null
        ? "—"
        : `${window.CalcAPI.round2(global.avg).toFixed(2)} / 20`
    );

    // KPI 2 + 3 : UE sélectionnée
    const ue = window.CRUD.getUEById(state, state.selectedUE);
    if (!ue) return;

    const all = window.CalcAPI.flattenUEAssessments(state, ue);

    // Si aucune épreuve => aucune note
    if (all.length === 0) {
      const kpiTarget = document.getElementById("kpiTarget");
      const kpiTargetDetail = document.getElementById("kpiTargetDetail");

      if (kpiTarget) kpiTarget.innerHTML = `<span class="warn-text">Aucune note</span>`;
      if (kpiTargetDetail) kpiTargetDetail.textContent = "Aucune épreuve n'est définie pour cette UE.";

      // On peut sortir ici, car le reste du calcul n'a pas de sens
      return;
    }


    // Moyennes
    const real = window.CalcAPI.computeUEAverage(state, ue, false); // réel uniquement
    const scen = window.CalcAPI.computeUEAverage(state, ue, true);  // réel + simu (réel prioritaire)

    // Complétude
    const completeReal = all.every(({ a }) => typeof state.grades?.[a.id] === "number");
    const completeScenario = all.every(({ a }) => {
      const r = state.grades?.[a.id];
      const s = state.sim?.[a.id];
      return (typeof r === "number") || (typeof s === "number");
    });

    // KPI "Objectif validation"
    const kpiTarget = document.getElementById("kpiTarget");
    const kpiTargetDetail = document.getElementById("kpiTargetDetail");

    // KPI "Progrès"
    const kpiProgress = document.getElementById("kpiProgress");
    const kpiProgressDetail = document.getElementById("kpiProgressDetail");

    // --- KPI 3 : Progrès ---
    if (kpiProgress && kpiProgressDetail) {
      const total = all.length;

      const filledReal = all.filter(({ a }) => typeof state.grades?.[a.id] === "number").length;

      const filledScenario = all.filter(({ a }) => {
        const r = state.grades?.[a.id];
        const s = state.sim?.[a.id];
        return (typeof r === "number") || (typeof s === "number");
      }).length;

      const pct = total > 0 ? (filledReal / total) * 100 : 0;

      kpiProgress.innerHTML = total === 0 ? "—" : `${window.CalcAPI.round2(pct)}%`;
      kpiProgressDetail.innerHTML =
        `${filledReal} note(s) réelles sur ${total} • ${filledScenario}/${total} avec simulation`;
    }

    if (!kpiTarget) return;

    // --- KPI 2 : Objectif validation ---

    // Cas 1 : UE complète en réel => verdict définitif
    if (completeReal) {
      if (typeof real.avg === "number" && real.avg >= PASS) {
        kpiTarget.innerHTML = `<span class="ok-text">UE validée</span>`;
        if (kpiTargetDetail) kpiTargetDetail.textContent = "Toutes les notes réelles sont renseignées.";
      } else if (typeof real.avg === "number") {
        kpiTarget.innerHTML = `<span class="bad-text">UE non validée</span>`;
        if (kpiTargetDetail) kpiTargetDetail.textContent = "Toutes les notes réelles sont renseignées.";
      } else {
        kpiTarget.innerHTML = `<span class="warn-text">UE complète</span>`;
        if (kpiTargetDetail) kpiTargetDetail.textContent = "Toutes les notes réelles sont renseignées.";
      }
      return;
    }

    // Cas 2 : UE complète en scénario => verdict scénario
    if (completeScenario) {
      if (typeof scen.avg === "number" && scen.avg >= PASS) {
        kpiTarget.innerHTML = `<span class="ok-text">Scénario validant</span>`;
        if (kpiTargetDetail) kpiTargetDetail.textContent = "Toutes les notes sont renseignées (réel + simulation).";
      } else if (typeof scen.avg === "number") {
        kpiTarget.innerHTML = `<span class="bad-text">Scénario non validant</span>`;
        if (kpiTargetDetail) kpiTargetDetail.textContent = "Toutes les notes sont renseignées (réel + simulation).";
      } else {
        kpiTarget.innerHTML = `<span class="warn-text">Scénario complet</span>`;
        if (kpiTargetDetail) kpiTargetDetail.textContent = "Toutes les notes sont renseignées (réel + simulation).";
      }
      return;
    }

    // Cas 3 : scénario incomplet => afficher le min restant
    const plan = window.CalcAPI.requiredAverageForUE(state, ue, PASS, true);

    if (!plan || plan.possible !== true) {
      kpiTarget.innerHTML = `<span class="bad-text">Impossible</span>`;
      if (kpiTargetDetail) kpiTargetDetail.textContent = "Calcul indisponible.";
      return;
    }

    if (plan.remainingW <= 0) {
      kpiTarget.innerHTML = `<span class="warn-text">UE en cours</span>`;
      if (kpiTargetDetail) kpiTargetDetail.textContent = "Renseigne des notes pour obtenir un objectif.";
      return;
    }

    // Si reqAvg <= 0 : objectif déjà atteint
    if (typeof plan.reqAvg === "number" && Number.isFinite(plan.reqAvg) && plan.reqAvg <= 0) {
      kpiTarget.innerHTML = `<span class="ok-text">Objectif déjà atteint</span>`;
      if (kpiTargetDetail) {
        kpiTargetDetail.textContent = `à faire sur ${window.CalcAPI.round2(plan.remainingW)} coeff restants`;
      }
      return;
    }

    if (typeof plan.reqAvg === "number" && Number.isFinite(plan.reqAvg)) {
      // Si la note nécessaire dépasse 20 => rattrapage
      if (plan.reqAvg > 20) {
        kpiTarget.innerHTML = `<span class="bad-text">Rattrapage</span>`;
        if (kpiTargetDetail) {
          kpiTargetDetail.textContent =
            `Objectif non atteignable sur les évaluations restantes (min > 20/20) • ` +
            `reste ${window.CalcAPI.round2(plan.remainingW)} coeff`;
        }
        return;
      }

      const reqClamped = Math.max(0.5, plan.reqAvg);
      const cls =
        reqClamped > 16 ? "bad-text" :
        reqClamped > 12 ? "warn-text" :
        reqClamped > PASS ? "warn-text" :
        "ok-text";

      kpiTarget.innerHTML =
        `<span class="${cls}">Min restant ≈ ${window.CalcAPI.round2(reqClamped).toFixed(2)}/20</span>`;

      if (kpiTargetDetail) {
        kpiTargetDetail.textContent = `à faire sur ${window.CalcAPI.round2(plan.remainingW)} coeff restants`;
      }
      return;
    }

    // Fallback
    kpiTarget.innerHTML = `<span class="warn-text">UE en cours</span>`;
    if (kpiTargetDetail) kpiTargetDetail.textContent = "Renseigne des notes pour obtenir un objectif.";
  }

  function renderAll() {
    window.UIAPI.renderUEList(state, ueSearchQuery, (ueId) => {
      state.selectedUE = ueId;
      window.StorageAPI.saveState(state);
      renderAll();
    });

    renderKPIs();
    window.ChartAPI.renderChart(state);

    window.UIAPI.renderModules(
      state,
      { saveState: window.StorageAPI.saveState, renderAll },
      ueSearchQuery
    );
  }

  function hardReset() {
    const ok = confirm(
      "Réinitialiser complètement le bulletin ?\n\n" +
      "• Notes réelles / simulations supprimées\n" +
      "• Coefficients remis à zéro\n" +
      "• Modules/épreuves personnalisés supprimés\n\n" +
      "Retour comme à la première ouverture."
    );
    if (!ok) return;

    // On repart d'une structure propre
    state = {
      structure: structuredClone(window.DEFAULT_STRUCTURE),
      selectedUE: structuredClone(window.DEFAULT_STRUCTURE.ues?.[0]?.id ?? null),
      grades: {},
      sim: {},
      coeffOverrides: {},
    };

    window.StorageAPI.saveState(state);
    renderAll();
  }

  function wireUI() {
    // Search
    const s = document.getElementById("ueSearch");
    if (s) {
      s.addEventListener("input", () => {
        ueSearchQuery = s.value.trim();

        // Mobile/tablette : ouvrir la sidebar automatiquement
        if (window.innerWidth <= 1024) {
          document.getElementById("sidebar")?.classList.add("is-open");
          document.getElementById("overlay").hidden = false;
          document.body.classList.add("no-scroll");
        }

        renderAll();
      });
    }

    // Export
    document.getElementById("btnExport")?.addEventListener("click", () => {
      window.StorageAPI.exportFullJSON(state);
    });

    // Reset
    document.getElementById("btnReset")?.addEventListener("click", hardReset);

    // Import
    const fileImport = document.getElementById("fileImport");
    if (fileImport) {
      fileImport.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          state = await window.StorageAPI.importFullJSON(file);
          window.StorageAPI.saveState(state);
          renderAll();
        } catch (err) {
          alert(`Import impossible: ${err?.message ?? err}`);
        } finally {
          e.target.value = "";
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupSidebarDrawer();
    wireUI();
    initTheme();
    wireThemeButton();
    renderAll();
  });

  // Debug
  window.__STATE__ = () => state;
})();